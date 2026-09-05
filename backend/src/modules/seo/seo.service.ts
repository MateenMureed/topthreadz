import { z } from 'zod';
import prisma from '../../utils/prisma';
import { getSeoAiProvider, ProviderError } from './ai.provider';
import { calculateSeoScore } from './seo-score';

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
}

const faqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(1000),
});

const aiSeoResponseSchema = z.object({
  shortDescription: z.string().min(20).max(500),
  description: z.string().min(80).max(6000),
  seoTitle: z.string().min(10).max(70),
  metaDescription: z.string().min(50).max(320),
  keywords: z.array(z.string().min(2).max(60)).min(3).max(20),
  tags: z.array(z.string().min(2).max(60)).max(20).default([]),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'slug must be lowercase-hyphenated'),
  highlights: z.array(z.string().min(3).max(120)).max(8).default([]),
  faqs: z.array(faqSchema).max(8).default([]),
  primaryKeyword: z.string().min(2).max(60).optional(),
});

export type AiSeoResponse = z.infer<typeof aiSeoResponseSchema>;

// JSON Schema handed to the Interactions API response_format so the model's
// output is structurally guaranteed (no code fences, no drift). Mirrors
// aiSeoResponseSchema above; zod still validates on arrival (defense in depth).
const SEO_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    shortDescription: { type: 'string' },
    description: { type: 'string' },
    seoTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
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
    primaryKeyword: { type: 'string' },
  },
  required: ['shortDescription', 'description', 'seoTitle', 'metaDescription', 'keywords', 'tags', 'slug', 'highlights', 'faqs'],
};

export interface GenerateSeoResult {
  content: AiSeoResponse;
  score: { score: number; max: number; suggestions: string[] };
  meta: { provider: string; model: string; duplicateGuardCount: number };
}

// ── Sanitization ─────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  const t = String(text || '').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

function sanitizeKeyword(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function slugify(value: string): string {
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
      take: 8,
      orderBy: { createdAt: 'desc' },
    });
    return competitors.map((c) => ({
      name: c.name,
      title: c.metaTitle || '',
      meta: c.metaDescription || '',
      descriptionFirst120: stripHtml(c.description || '').slice(0, 120),
      keywords: (c.metaKeywords || []).slice(0, 6),
    }));
  } catch {
    // Duplicate prevention is best-effort: never block generation on DB read failure.
    return [];
  }
}

// ── Prompt construction ─────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return [
    'You are an expert e-commerce SEO copywriter for Top Threadz, a premium Pakistani men\'s fashion brand.',
    'You write unique, natural, persuasive copy for product listings — never spammy, never stuffed.',
    'STRICT RULES:',
    '1. Use ONLY facts supplied in the product data. NEVER invent specifications, measurements, materials, ratings, or claims.',
    '2. If information is missing, write naturally without addressing it. Do not guess fabric types, sizes, or features.',
    '3. Every output must be substantially different from the related existing products provided.',
    '4. Weave keywords naturally. No repetition stuffing. Only use a term when it genuinely fits this product.',
    '5. Tone: premium, refined, confident — aimed at Pakistani men\'s fashion shoppers.',
    '6. Write in clear English. Titles concise; descriptions flowing.',
    '7. The "slug" must be lowercase, hyphen-separated, URL-safe, no stopwords (a/the/with/for/of).',
    '8. FAQs must only ask things answerable from supplied data (e.g. fabric care if provided, brand, price range, category). Maximum 4 FAQs. If little info is available, return fewer or none.',
    'Return ONLY valid JSON matching the requested shape.',
  ].join('\n');
}

function buildUserPrompt(product: SeoProductInput, related: Awaited<ReturnType<typeof fetchRelatedProducts>>, sections: string[]): string {
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
  add('Colors', (product.colors && product.colors.length ? product.colors : product.color ? [product.color] : []).join(', '));
  add('Price (PKR)', product.price);
  add('Sale price (PKR)', product.salePrice);
  if (product.discount && product.discount > 0) add('Discount', `${product.discount}%`);
  add('Brand', product.brand || 'Top Threadz');
  add('Available sizes', (product.sizes || []).join(', '));
  add('Care instructions', product.careInstructions);
  add('Current tags', (product.tags || []).slice(0, 15).join(', '));
  if (product.attributes && Object.keys(product.attributes).length > 0) {
    facts.push('- Attributes: ' + Object.entries(product.attributes).map(([k, v]) => `${k}=${v}`).join('; ').slice(0, 400));
  }
  const existingDesc = stripHtml(product.description || '');
  if (existingDesc) add('Existing description (reference only, improve it)', truncate(existingDesc, 600));
  const existingShort = stripHtml(product.shortDescription || '');
  if (existingShort) add('Existing short description', truncate(existingShort, 200));

  const relatedBlock = related.length
    ? related.map((r, i) => `${i + 1}. "${r.name}" — meta: "${r.meta}" — starts: "${r.descriptionFirst120}" kw: ${r.keywords.join(', ')}`).join('\n')
    : '(none)';

  return [
    'Generate SEO content for this Top Threadz product.',
    '',
    'PRODUCT DATA (the only facts you may use):',
    facts.join('\n'),
    '',
    'RELATED EXISTING PRODUCTS — your output must be clearly different from each:',
    relatedBlock,
    '',
    `SECTIONS TO GENERATE: ${sections.join(', ')}.`,
    'Leave other fields present but reasonable (never empty except FAQs when unsupported).',
    '',
    'Return JSON exactly as:',
    '{"shortDescription":"","description":"","seoTitle":"","metaDescription":"","keywords":[""],"tags":[""],"slug":"","primaryKeyword":"","highlights":[""],"faqs":[{"question":"","answer":""}]}',
    'keywords: primary first, then secondary, long-tail, and semantic — 6-12 total, no duplicates.',
  ].join('\n');
}

// ── Service ──────────────────────────────────────────────────────────────

export class SeoService {
  async generate(input: SeoProductInput, sections?: string[]): Promise<GenerateSeoResult> {
    const provider = getSeoAiProvider();
    if (!provider.isConfigured()) {
      throw new ProviderError(
        'AI SEO generation is not configured. Add GEMINI_API_KEY to the backend environment.',
        undefined,
        false
      );
    }

    const requested = sections && sections.length > 0 ? sections : ['description', 'seo', 'keywords', 'meta', 'faqs'];
    const related = await fetchRelatedProducts(input);

    const result = await provider.generate({
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt(input, related, requested),
      responseMimeType: 'application/json',
      responseSchema: SEO_JSON_SCHEMA,
      maxOutputTokens: 4096,
    });

    const parsed = aiSeoResponseSchema.safeParse(JSON.parse(result.text));
    if (!parsed.success) {
      throw new ProviderError('AI returned content in an unexpected format. Please retry.', 502, true);
    }
    const content = parsed.data;

    // Sanitize / normalize output before returning.
    const keywords = Array.from(new Set(content.keywords.map(sanitizeKeyword).filter(Boolean))).slice(0, 20);
    const tags = Array.from(new Set((content.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean))).slice(0, 20);
    const sanitized: AiSeoResponse = {
      shortDescription: truncate(stripHtml(content.shortDescription), 500),
      description: stripHtml(content.description).slice(0, 6000),
      seoTitle: truncate(stripHtml(content.seoTitle), 70),
      metaDescription: truncate(stripHtml(content.metaDescription), 320),
      keywords,
      tags,
      slug: slugify(content.slug),
      highlights: (content.highlights || []).map((h) => truncate(stripHtml(h), 120)).slice(0, 8),
      faqs: (content.faqs || []).map((f) => ({
        question: truncate(stripHtml(f.question), 300),
        answer: truncate(stripHtml(f.answer), 1000),
      })),
      primaryKeyword: content.primaryKeyword ? sanitizeKeyword(content.primaryKeyword) : keywords[0],
    };

    const score = calculateSeoScore({
      name: input.name,
      slug: sanitized.slug,
      seoTitle: sanitized.seoTitle,
      metaDescription: sanitized.metaDescription,
      description: sanitized.description,
      keywords: sanitized.keywords,
      shortDescription: sanitized.shortDescription,
      highlights: sanitized.highlights,
    });

    return {
      content: sanitized,
      score,
      meta: {
        provider: provider.name,
        model: result.model,
        duplicateGuardCount: related.length,
      },
    };
  }

  async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    const base = slugify(slug) || `product-${Date.now()}`;
    let candidate = base;
    let suffix = 1;
    // Rely on the unique index; bump suffix until free.
    for (;;) {
      const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${base}-${++suffix}`;
    }
  }
}
