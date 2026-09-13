import { z } from 'zod';
import prisma from '../../utils/prisma';
import { getSeoAiProvider, ProviderError } from './ai.provider';
import { calculateSeoScore, SeoScoreResult } from './seo-score';
import {
  generateProductSearchIntelligence,
  GeneratedSearchVocabulary,
} from './search-intent.engine';

// ── Types & schemas ──────────────────────────────────────────────────────

export interface SeoProductInput {
  id?: string;
  name: string;
  category?: string;
  subcategory?: string;
  collection?: string;
  productType?: string;
  fabric?: string;
  material?: string;
  pattern?: string;
  style?: string;
  color?: string;
  colors?: string[];
  price?: number;
  salePrice?: number;
  discount?: number;
  description?: string;
  shortDescription?: string;
  attributes?: Record<string, string>;
  brand?: string;
  tags?: string[];
  sizes?: string[];
  careInstructions?: string;
  slug?: string;
  gender?: string;
  sku?: string;
  highlights?: string[];
}

const faqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(1000),
});

export const aiSeoResponseSchema = z.object({
  shortDescription: z.string().min(20).max(500),
  description: z.string().min(80).max(6000),
  seoTitle: z.string().min(10).max(85),
  metaDescription: z.string().min(50).max(320),
  keywords: z.array(z.string().min(2).max(80)).min(3).max(25),
  primaryKeyword: z.string().min(2).max(80).optional(),
  secondaryKeywords: z.array(z.string().min(2).max(80)).max(15).default([]),
  longTailKeywords: z.array(z.string().min(2).max(100)).max(10).default([]),
  imageAltText: z.string().min(5).max(160).optional(),
  tags: z.array(z.string().min(2).max(60)).max(25).default([]),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'slug must be lowercase-hyphenated').optional(),
  highlights: z.array(z.string().min(3).max(120)).max(8).default([]),
  faqs: z.array(faqSchema).max(8).default([]),
});

export type AiSeoResponse = z.infer<typeof aiSeoResponseSchema>;

// JSON Schema handed to the Gemini Interactions API response_format so the model's
// output is structurally guaranteed (no code fences, no markdown drift).
const SEO_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    shortDescription: { type: 'string' },
    description: { type: 'string' },
    seoTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    primaryKeyword: { type: 'string' },
    secondaryKeywords: { type: 'array', items: { type: 'string' } },
    longTailKeywords: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    imageAltText: { type: 'string' },
    slug: { type: 'string' },
    highlights: { type: 'array', items: { type: 'string' } },
    faqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: { question: { type: 'string' }, answer: { type: 'string' } },
        required: ['question', 'answer'],
      },
    },
  },
  required: [
    'shortDescription',
    'description',
    'seoTitle',
    'metaDescription',
    'primaryKeyword',
    'secondaryKeywords',
    'longTailKeywords',
    'keywords',
    'tags',
    'imageAltText',
    'highlights',
    'faqs',
  ],
};

export interface GenerateSeoResult {
  content: AiSeoResponse;
  score: SeoScoreResult;
  meta: { provider: string; model: string; duplicateGuardCount: number; retried?: boolean; fallback?: boolean };
  searchIntelligence: GeneratedSearchVocabulary;
}

// ── Sanitization ─────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text: string, max: number): string {
  const t = String(text || '').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

export function sanitizeKeyword(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70);
}

export function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

// ── Duplicate prevention ─────────────────────────────────────────────────

async function fetchRelatedProducts(product: SeoProductInput) {
  try {
    const filters: any[] = [];
    if (product.category) filters.push({ category: { equals: product.category, mode: 'insensitive' } });
    if (product.subcategory) filters.push({ subcategory: { equals: product.subcategory, mode: 'insensitive' } });
    if (filters.length === 0) filters.push({ featured: true });

    const competitors = await prisma.product.findMany({
      where: {
        ...(product.id ? { id: { not: product.id } } : {}),
        OR: filters,
      },
      select: { name: true, metaTitle: true, metaDescription: true, description: true, metaKeywords: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });
    return competitors.map((c) => ({
      name: c.name,
      title: c.metaTitle || '',
      meta: c.metaDescription || '',
      descriptionFirst120: stripHtml(c.description || '').slice(0, 120),
      keywords: (c.metaKeywords || []).slice(0, 5),
    }));
  } catch {
    return [];
  }
}

// ── Prompt construction ─────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return [
    'You are an expert e-commerce SEO copywriter for Top Threadz, a premier Pakistani menswear brand.',
    'You write authentic, high-converting, human-readable product listings based EXCLUSIVELY on real database product attributes.',
    '',
    'STRICT ANTI-HALLUCINATION RULES:',
    '1. Use ONLY facts provided in the product data. NEVER invent fabric types, materials, sizes, colors, prices, discounts, shipping claims, product features, certifications, reviews, ratings, availability, manufacturing claims, or location claims.',
    '2. If a field is missing, DO NOT hallucinate or assume it. Write naturally without mentioning absent attributes.',
    '3. Every output must be distinct from related existing products. Avoid keyword stuffing and repetitive cliches ("unmatched luxury", "timeless elegance", "elevate your wardrobe", "sophisticated").',
    '',
    'SEO TITLE RULES (Section 3):',
    '- TARGET LENGTH: 50–60 characters whenever naturally possible.',
    '- ABSOLUTE CEILING: Do NOT exceed 60 characters under any circumstance.',
    '- Structure: [Primary Product Attribute] + [Product Type] | Top Threadz',
    '- Examples:',
    '  * Dark Brown Wash & Wear Stitched Suit | Top Threadz',
    '  * Blue Cotton Unstitched Fabric for Men | Top Threadz',
    '  * Men\'s Black Three Piece Suit | Top Threadz',
    '- Readable first, optimized second. Never spam ("Buy Best Premium High Quality...").',
    '',
    'META DESCRIPTION RULES (Section 4):',
    '- TARGET LENGTH: 140–160 characters.',
    '- Must naturally communicate: what the product is, key attribute (color/fabric/style), men\'s fashion intent, Top Threadz, and Pakistan/shopping intent where natural.',
    '- Example: "Shop Dark Brown Wash & Wear Stitched Suit for men by Top Threadz. Premium traditional wear with comfortable fabric, classic styling and nationwide delivery."',
    '- Vary sentence structures across products. No keyword stuffing. No unsupported claims.',
    '',
    'PRODUCT DESCRIPTION RULES (Section 5):',
    '- TARGET: 120–180 words.',
    '- Exactly 3 structured paragraphs:',
    '  Paragraph 1: Clearly identify the product using its actual name, type, color, and main attribute.',
    '  Paragraph 2: Explain material/fabric, comfort, appearance, styling, and construction ONLY if supported by product data.',
    '  Paragraph 3: Explain suitable use cases (everyday wear, office wear, formal occasions, Eid, Jummah, weddings) ONLY when appropriate to the product.',
    '  Final sentence: Use a natural shopping CTA, such as: "Shop this men\'s [product type] from Top Threadz."',
    '',
    'KEYWORD RULES & CATEGORY CONTEXT (Sections 6–9):',
    '- primaryKeyword: One strongest product-specific keyword (e.g. "dark brown wash and wear stitched suit").',
    '- secondaryKeywords: 5–10 closely related variations.',
    '- longTailKeywords: 3–6 high-intent phrases (e.g. "buy dark brown stitched suit online").',
    '- CATEGORY SPECIFICS (NEVER cross-contaminate categories):',
    '  * STITCHED: Focus on "men\'s stitched wear", "stitched suit", "stitched shalwar kameez", "ready to wear". NEVER use "unstitched fabric" keywords.',
    '  * UNSTITCHED: Focus on "men\'s unstitched fabric", "unstitched suit fabric", "wash and wear fabric", "boski fabric", "cotton fabric". NEVER use "stitched suit" or "ready made" keywords.',
    '  * TWO PIECE: Focus on "men\'s two piece suit", "2 piece suit for men", "Pakistani two piece suit".',
    '  * THREE PIECE: Focus on "men\'s three piece suit", "3 piece suit for men", "formal suit for men".',
    '  * WAISTCOATS: Focus on "men\'s waistcoat", "Pakistani waistcoat", "waistcoat for men".',
    '  * KIDS: Focus on "boys clothing Pakistan", "kids traditional wear", "boys shalwar kameez". NEVER make adult men the primary intent.',
    '- COLOR SPECIFICS: Use actual database color name (e.g. "Dark Brown"). Do NOT invent marketing color names.',
    '',
    'IMAGE ALT TEXT (Section 11):',
    '- Format: descriptive and factual, e.g. "[Color] [Fabric] [Product Type] for Men | Top Threadz".',
    '',
    'CANONICAL / SLUG (Section 12):',
    '- If an existing slug is provided, return that exact slug. Never modify existing URLs.',
    '',
    'Return ONLY valid JSON complying with the requested schema.',
  ].join('\n');
}

function buildUserPrompt(
  product: SeoProductInput,
  related: Awaited<ReturnType<typeof fetchRelatedProducts>>,
  sections: string[],
  searchIntelligence: GeneratedSearchVocabulary
): string {
  const facts: string[] = [];
  const add = (label: string, value?: string | number | null) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      facts.push(`- ${label}: ${String(value).trim()}`);
    }
  };

  add('Product name', product.name);
  add('Category', product.category);
  add('Subcategory', product.subcategory);
  add('Collection', product.collection);
  add('Product type', product.productType);
  add('Fabric / material', product.fabric || product.material);
  add('Pattern / design', product.pattern);
  add('Style / cut', product.style);
  add('Gender / Demographic', product.gender || 'MALE');
  add('Colors', (product.colors && product.colors.length ? product.colors : product.color ? [product.color] : []).join(', '));
  add('Price (PKR)', product.price);
  add('Sale price (PKR)', product.salePrice);
  if (product.discount && product.discount > 0) add('Discount', `${product.discount}%`);
  add('SKU', product.sku);
  add('Brand', product.brand || 'Top Threadz');
  add('Available sizes', (product.sizes || []).join(', '));
  add('Care instructions', product.careInstructions);
  if (product.highlights && product.highlights.length > 0) {
    add('Features / Highlights', product.highlights.join(', '));
  }
  add('Current tags', (product.tags || []).slice(0, 15).join(', '));
  if (product.attributes && Object.keys(product.attributes).length > 0) {
    facts.push('- Attributes: ' + Object.entries(product.attributes).map(([k, v]) => `${k}=${v}`).join('; ').slice(0, 400));
  }
  const existingDesc = stripHtml(product.description || '');
  if (existingDesc) add('Existing description (reference only)', truncate(existingDesc, 600));
  const existingShort = stripHtml(product.shortDescription || '');
  if (existingShort) add('Existing short description', truncate(existingShort, 200));
  if (product.slug) add('Existing slug (DO NOT CHANGE)', product.slug);

  const relatedBlock = related.length
    ? related.map((r, i) => `${i + 1}. "${r.name}" — meta: "${r.meta}" — kw: ${r.keywords.slice(0, 4).join(', ')}`).join('\n')
    : '(none)';

  const searchTargetLines = [
    `- Primary target phrase: ${searchIntelligence.primaryKeyword || searchIntelligence.googleKeywords[0] || product.name}`,
    `- Relevant search phrases: ${searchIntelligence.googleKeywords.slice(0, 6).join(', ')}`,
    searchIntelligence.intents.CATEGORY?.length ? `- Category phrasing: ${searchIntelligence.intents.CATEGORY.slice(0, 4).join(', ')}` : '',
    searchIntelligence.intents.FABRIC?.length ? `- Fabric terms: ${searchIntelligence.intents.FABRIC.slice(0, 4).join(', ')}` : '',
    searchIntelligence.intents.STYLE?.length ? `- Silhouette/Style: ${searchIntelligence.intents.STYLE.slice(0, 4).join(', ')}` : '',
    searchIntelligence.intents.COLOR?.length ? `- Color terms: ${searchIntelligence.intents.COLOR.slice(0, 4).join(', ')}` : '',
    searchIntelligence.intents.BUYING?.length ? `- Buying intent: ${searchIntelligence.intents.BUYING.slice(0, 3).join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return [
    'Generate comprehensive, fact-checked SEO content for this Top Threadz product.',
    '',
    'PRODUCT ATTRIBUTES (Use only these facts; never invent missing properties):',
    facts.join('\n'),
    '',
    'HUMAN SEARCH INTENT TARGETS (Weave naturally into sentences; NEVER stuff raw keywords):',
    searchTargetLines,
    '',
    'EXISTING CATALOG ITEMS (Ensure your output is distinct from each):',
    relatedBlock,
    '',
    `REQUESTED SECTIONS: ${sections.join(', ')}.`,
    'CRITICAL CONSTRAINTS:',
    '- Title MUST be 50–60 characters (never exceed 60 characters).',
    '- Meta description MUST be 140–160 characters.',
    '- Description MUST be 120–180 words across 3 paragraphs.',
    '- Return valid JSON conforming to the schema.',
  ].join('\n');
}

// ── Enforce Length Limits ───────────────────────────────────────────────

export function enforceTitleLimit(rawTitle: string, productName: string, brand = 'Top Threadz'): string {
  let t = stripHtml(rawTitle).replace(/\s+/g, ' ').trim();
  const brandSuffix = ` | ${brand}`;

  // If title already fits perfectly within 50–60 chars (or <= 60 chars)
  if (t.length <= 60 && t.length >= 45) {
    if (!t.toLowerCase().includes(brand.toLowerCase())) {
      if (t.length + brandSuffix.length <= 60) {
        return `${t}${brandSuffix}`;
      }
    }
    return t;
  }

  // If title exceeds hard ceiling of 60 characters
  if (t.length > 60) {
    let body = t.replace(new RegExp(`\\s*\\|\\s*${brand}.*$`, 'i'), '').trim();
    const maxBody = Math.max(20, 60 - brandSuffix.length); // 60 - 13 = 47
    if (body.length > maxBody) {
      body = body.slice(0, maxBody);
      const lastSpace = body.lastIndexOf(' ');
      if (lastSpace > 20) body = body.slice(0, lastSpace);
    }
    const candidate = `${body}${brandSuffix}`.trim();
    return candidate.length <= 60 ? candidate : candidate.slice(0, 60).trim();
  }

  // If title is under 45 characters, try to include brand suffix if it fits within 60 chars
  if (t.length < 45) {
    if (!t.toLowerCase().includes(brand.toLowerCase())) {
      const withBrand = `${t}${brandSuffix}`.trim();
      if (withBrand.length <= 60) return withBrand;
    }
  }

  return t.length <= 60 ? t : t.slice(0, 60).trim();
}

export function enforceMetaLimit(rawMeta: string, fallback: string): string {
  let m = stripHtml(rawMeta).replace(/\s+/g, ' ').trim();

  // If within the target sweet spot (140–160 characters)
  if (m.length >= 140 && m.length <= 160) {
    return m;
  }

  // If exceeds 160 characters: trim cleanly at punctuation or word boundary <= 160
  if (m.length > 160) {
    let trimmed = m.slice(0, 159);
    const lastPeriod = trimmed.lastIndexOf('.');
    if (lastPeriod >= 135) return trimmed.slice(0, lastPeriod + 1).trim();
    const lastComma = trimmed.lastIndexOf(',');
    if (lastComma >= 135) return trimmed.slice(0, lastComma).trim() + '.';
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace >= 135) return trimmed.slice(0, lastSpace).trim() + '.';
    return trimmed.slice(0, 157).trim() + '...';
  }

  // If below 140 characters: expand naturally with shopping/brand context to hit 140–160 chars
  if (m.length < 140) {
    const endings = [
      ' Available at Top Threadz with cash on delivery across Pakistan.',
      ' Shop online at Top Threadz with fast nationwide delivery.',
      ' Order now at Top Threadz for premium quality and nationwide shipping.',
    ];
    for (const ending of endings) {
      const candidate = m.replace(/\.*$/, '') + ending;
      if (candidate.length >= 140 && candidate.length <= 160) {
        return candidate;
      }
    }
    // If fallback is available and fits
    if (fallback && fallback.length >= 140 && fallback.length <= 160) {
      return fallback;
    }
  }

  return m.slice(0, 160);
}

// ── Validation & Quality Gates ──────────────────────────────────────────

export function validateSeoOutput(
  content: AiSeoResponse,
  input: SeoProductInput
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Title validation
  const title = (content.seoTitle || '').trim();
  if (!title) {
    issues.push('Missing SEO title.');
  } else if (title.length > 60) {
    issues.push(`SEO title is ${title.length} characters; must not exceed 60 characters.`);
  }

  // Meta description validation
  const meta = (content.metaDescription || '').trim();
  if (!meta) {
    issues.push('Missing meta description.');
  } else if (meta.length > 165) {
    issues.push(`Meta description is ${meta.length} characters; target is 140–160 characters.`);
  } else if (meta.length < 120) {
    issues.push(`Meta description is too short (${meta.length} characters); target is 140–160 characters.`);
  }

  // Description word count validation (Target: 120–180 words)
  const descWords = stripHtml(content.description || '').split(/\s+/).filter(Boolean).length;
  if (descWords < 80) {
    issues.push(`Product description has only ${descWords} words; target is 120–180 words.`);
  } else if (descWords > 240) {
    issues.push(`Product description has ${descWords} words; keep it concise (target 120–180 words).`);
  }

  // Category keyword consistency check
  const cat = (input.category || input.subcategory || input.productType || '').toLowerCase();
  const allKeywords = [
    content.primaryKeyword || '',
    ...(content.secondaryKeywords || []),
    ...(content.longTailKeywords || []),
    ...(content.keywords || []),
  ].map((k) => k.toLowerCase());

  const isStitched = /stitched|ready to wear|readymade/i.test(cat);
  const isUnstitched = /unstitched|fabric/i.test(cat);
  const isKids = /kid|boy|child/i.test(cat);

  if (isStitched && !isUnstitched) {
    if (allKeywords.some((k) => k.includes('unstitched fabric') || k.includes('unstitched suit fabric'))) {
      issues.push('Stitched product must not contain unstitched fabric keywords.');
    }
  }

  if (isUnstitched && !isStitched) {
    if (allKeywords.some((k) => k.includes('stitched suit') || k.includes('ready made') || k.includes('ready-made'))) {
      issues.push('Unstitched fabric product must not contain stitched suit or ready made keywords.');
    }
  }

  if (isKids) {
    const primary = (content.primaryKeyword || '').toLowerCase();
    if (primary.includes("men's") || primary.includes('gents')) {
      issues.push("Kids product must not have adult men's clothing as the primary keyword.");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// ── Safe Deterministic Fallback ──────────────────────────────────────────

export function generateDeterministicFallback(
  input: SeoProductInput,
  searchIntelligence: GeneratedSearchVocabulary
): AiSeoResponse {
  const cleanName = input.name.trim();
  const cat = (input.category || 'Menswear').trim();
  const subcat = (input.subcategory || '').trim();
  const color = (input.colors && input.colors[0]) || input.color || '';
  const fabric = input.fabric || input.material || '';
  const brand = input.brand || 'Top Threadz';
  const isKids = /kid|boy|child/i.test(cat) || /kid|boy|child/i.test(subcat) || /kid|boy/i.test(cleanName);
  const isUnstitched = /unstitched/i.test(cat) || /unstitched/i.test(subcat) || /unstitched/i.test(cleanName);

  // Title: 50–60 characters
  let titleCandidate = `${color ? color + ' ' : ''}${fabric ? fabric + ' ' : ''}${cleanName} | ${brand}`.replace(/\s+/g, ' ').trim();
  if (titleCandidate.length > 60 || titleCandidate.length < 45) {
    titleCandidate = enforceTitleLimit(`${cleanName} | ${brand}`, cleanName, brand);
  }

  // Meta: 140–160 characters
  const attributeNote = [color, fabric].filter(Boolean).join(' ') || (isUnstitched ? 'unstitched fabric' : 'stitched wear');
  const rawMeta = `Shop ${cleanName} by ${brand}. High quality ${attributeNote} with refined drape, comfort and reliable nationwide delivery across Pakistan.`;
  const metaDescription = enforceMetaLimit(rawMeta, `Buy authentic ${cleanName} at Top Threadz. Premium Pakistani men's traditional clothing with nationwide cash on delivery.`);

  // 3-paragraph description targeting 120–180 words
  const p1 = `The ${cleanName} by ${brand} delivers authentic Pakistani craftsmanship designed for modern men. Featuring a classic ${color ? color.toLowerCase() + ' shade' : 'palette'} with clean tailoring, this ${isUnstitched ? 'unstitched fabric' : 'suit'} offers effortless poise and everyday confidence.`;

  const p2 = `${fabric ? `Constructed from carefully sourced ${fabric.toLowerCase()} material, this` : 'Engineered with premium textile techniques, this'} garment offers exceptional breathability, balanced weight, and enduring comfort. The smooth texture resists unnecessary creasing, maintaining a sharp silhouette from morning through evening.`;

  const p3 = `Ideal for Friday prayers, office wear, festive gatherings, and formal family occasions throughout the season. Pair with classic footwear to complete your signature traditional look. Shop this men's ${isUnstitched ? 'fabric' : 'suit'} from ${brand}.`;

  const description = `${p1}\n\n${p2}\n\n${p3}`;
  const shortDescription = `Authentic ${cleanName} by ${brand}. Fine ${attributeNote} tailored for lasting comfort and refined style.`;

  // Keywords
  const primaryKeyword = searchIntelligence.primaryKeyword || `${color ? color.toLowerCase() + ' ' : ''}${cleanName.toLowerCase()}`.trim();
  const secondaryKeywords = (searchIntelligence.secondaryKeywords || []).slice(0, 8);
  const longTailKeywords = (searchIntelligence.supportingKeywords || []).slice(0, 5);
  const keywords = Array.from(new Set([primaryKeyword, ...secondaryKeywords, ...(searchIntelligence.googleKeywords || [])])).slice(0, 12);
  const tags = (searchIntelligence.searchAliases || []).slice(0, 20);

  const imageAltText = `${color ? color + ' ' : ''}${cleanName} for Men | ${brand}`.replace(/\s+/g, ' ').trim();

  return {
    seoTitle: titleCandidate,
    metaDescription,
    shortDescription,
    description,
    primaryKeyword,
    secondaryKeywords,
    longTailKeywords,
    keywords,
    tags,
    imageAltText,
    slug: input.slug || slugify(cleanName),
    highlights: input.highlights && input.highlights.length > 0
      ? input.highlights.slice(0, 6)
      : ['Premium drape', 'Breathable comfort', 'Durable color fastness', 'Nationwide delivery'],
    faqs: [
      {
        question: `How should I care for the ${cleanName}?`,
        answer: input.careInstructions || 'Wash gently in cold water with like colors. Avoid harsh bleaching agents and dry in shade to preserve fabric luster.',
      },
      {
        question: 'What is the delivery time across Pakistan?',
        answer: 'Orders are processed within 24 hours and delivered within 2 to 5 business days nationwide with cash on delivery available.',
      },
    ],
  };
}

// ── Service ──────────────────────────────────────────────────────────────

export class SeoService {
  async generate(input: SeoProductInput, sections?: string[]): Promise<GenerateSeoResult> {
    const requested = sections && sections.length > 0 ? sections : ['description', 'seo', 'keywords', 'meta', 'faqs'];
    const related = await fetchRelatedProducts(input);
    const searchIntelligence = generateProductSearchIntelligence(input);

    const provider = getSeoAiProvider();

    // If Gemini is not configured, seamlessly return deterministic fallback
    if (!provider.isConfigured()) {
      const fallbackContent = generateDeterministicFallback(input, searchIntelligence);
      const score = calculateSeoScore({
        name: input.name,
        slug: fallbackContent.slug || slugify(input.name),
        seoTitle: fallbackContent.seoTitle,
        metaDescription: fallbackContent.metaDescription,
        description: fallbackContent.description,
        keywords: fallbackContent.keywords,
        shortDescription: fallbackContent.shortDescription,
        highlights: fallbackContent.highlights,
        h1: input.name,
        aliasesCount: searchIntelligence.searchAliases?.length || 0,
      });

      return {
        content: fallbackContent,
        score,
        searchIntelligence,
        meta: {
          provider: 'deterministic-fallback',
          model: 'rule-based',
          duplicateGuardCount: related.length,
          fallback: true,
        },
      };
    }

    let parsedContent: AiSeoResponse | null = null;
    let wasRetried = false;
    let lastError: any = null;

    try {
      // First attempt with Gemini
      const result = await provider.generate({
        systemPrompt: buildSystemPrompt(),
        userPrompt: buildUserPrompt(input, related, requested, searchIntelligence),
        responseMimeType: 'application/json',
        responseSchema: SEO_JSON_SCHEMA,
        maxOutputTokens: 4096,
      });

      const parsed = aiSeoResponseSchema.safeParse(JSON.parse(result.text));
      if (parsed.success) {
        const validation = validateSeoOutput(parsed.data, input);
        if (validation.isValid) {
          parsedContent = parsed.data;
        } else {
          // One-time targeted correction prompt
          wasRetried = true;
          const correctionUserPrompt = [
            buildUserPrompt(input, related, requested, searchIntelligence),
            '',
            'CORRECTION REQUIRED — The previous generation failed validation with the following issues:',
            ...validation.issues.map((issue) => `* ${issue}`),
            '',
            'Please regenerate strictly fixing all these issues:',
            '- SEO Title MUST be between 50 and 60 characters (max 60 characters).',
            '- Meta description MUST be between 140 and 160 characters.',
            '- Product description MUST be between 120 and 180 words across 3 paragraphs.',
            '- No cross-category keywords.',
          ].join('\n');

          const retryResult = await provider.generate({
            systemPrompt: buildSystemPrompt(),
            userPrompt: correctionUserPrompt,
            responseMimeType: 'application/json',
            responseSchema: SEO_JSON_SCHEMA,
            maxOutputTokens: 4096,
          });

          const retryParsed = aiSeoResponseSchema.safeParse(JSON.parse(retryResult.text));
          if (retryParsed.success) {
            parsedContent = retryParsed.data;
          }
        }
      }
    } catch (err: any) {
      lastError = err;
    }

    // If Gemini succeeded, sanitize and apply limits
    if (parsedContent) {
      const content = parsedContent;

      const keywords = Array.from(
        new Set([
          ...(content.primaryKeyword ? [sanitizeKeyword(content.primaryKeyword)] : []),
          ...(content.secondaryKeywords || []).map(sanitizeKeyword),
          ...(content.keywords || []).map(sanitizeKeyword),
          ...(searchIntelligence.googleKeywords || []).map(sanitizeKeyword),
        ].filter(Boolean))
      ).slice(0, 12);

      const tags = Array.from(
        new Set([
          ...(content.tags || []).map((t) => t.trim().toLowerCase()),
          ...(searchIntelligence.searchAliases || []).slice(0, 20).map((a) => a.toLowerCase()),
        ].filter(Boolean))
      ).slice(0, 25);

      const seoTitle = enforceTitleLimit(
        content.seoTitle || `${input.name} | ${input.brand || 'Top Threadz'}`,
        input.name,
        input.brand || 'Top Threadz'
      );

      const metaDescription = enforceMetaLimit(
        content.metaDescription || '',
        `Shop authentic ${input.name} at Top Threadz. Premium Pakistani menswear with fast delivery across Pakistan.`
      );

      // Section 12: Preserve existing slug if provided
      const slug = input.slug ? input.slug : slugify(content.slug || input.name);

      const sanitized: AiSeoResponse = {
        shortDescription: truncate(stripHtml(content.shortDescription), 500),
        description: stripHtml(content.description).slice(0, 6000),
        seoTitle,
        metaDescription,
        primaryKeyword: content.primaryKeyword ? sanitizeKeyword(content.primaryKeyword) : keywords[0],
        secondaryKeywords: (content.secondaryKeywords || []).map(sanitizeKeyword).slice(0, 10),
        longTailKeywords: (content.longTailKeywords || []).map(sanitizeKeyword).slice(0, 6),
        keywords,
        tags,
        imageAltText: content.imageAltText || `${input.name} for Men | ${input.brand || 'Top Threadz'}`,
        slug,
        highlights: (content.highlights || []).map((h) => truncate(stripHtml(h), 120)).slice(0, 8),
        faqs: (content.faqs || []).map((f) => ({
          question: truncate(stripHtml(f.question), 300),
          answer: truncate(stripHtml(f.answer), 1000),
        })),
      };

      const score = calculateSeoScore({
        name: input.name,
        slug: sanitized.slug || slugify(input.name),
        seoTitle: sanitized.seoTitle,
        metaDescription: sanitized.metaDescription,
        description: sanitized.description,
        keywords: sanitized.keywords,
        shortDescription: sanitized.shortDescription,
        highlights: sanitized.highlights,
        h1: input.name,
        aliasesCount: searchIntelligence.searchAliases?.length || 0,
      });

      return {
        content: sanitized,
        score,
        searchIntelligence,
        meta: {
          provider: provider.name,
          model: 'gemini',
          duplicateGuardCount: related.length,
          retried: wasRetried,
          fallback: false,
        },
      };
    }

    // If Gemini failed / timed out / invalid JSON after retry, use safe deterministic fallback
    const fallbackContent = generateDeterministicFallback(input, searchIntelligence);
    const score = calculateSeoScore({
      name: input.name,
      slug: fallbackContent.slug || slugify(input.name),
      seoTitle: fallbackContent.seoTitle,
      metaDescription: fallbackContent.metaDescription,
      description: fallbackContent.description,
      keywords: fallbackContent.keywords,
      shortDescription: fallbackContent.shortDescription,
      highlights: fallbackContent.highlights,
      h1: input.name,
      aliasesCount: searchIntelligence.searchAliases?.length || 0,
    });

    return {
      content: fallbackContent,
      score,
      searchIntelligence,
      meta: {
        provider: provider.name,
        model: 'fallback-after-error',
        duplicateGuardCount: related.length,
        retried: wasRetried,
        fallback: true,
      },
    };
  }

  async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    const base = slugify(slug) || `product-${Date.now()}`;
    let candidate = base;
    let suffix = 1;
    for (;;) {
      const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${base}-${++suffix}`;
    }
  }
}
