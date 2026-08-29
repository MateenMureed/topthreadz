import { env } from '../../config/env';
import logger from '../../utils/logger';

// ── Types ────────────────────────────────────────────────

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number | null;
  discount?: number;
  category: string;
  subcategory?: string | null;
  brand?: string | null;
  collection?: string | null;
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  careInstructions?: string | null;
  tags: string[];
  featured: boolean;
  trending: boolean;
}

export interface CampaignGenerationInput {
  product: ProductData;
  platforms: string[];
  objective: string;
  tone: string;
  language: string;
  durationDays: number;
  storeUrl: string;
}

export interface GeneratedContentItem {
  platform: string;
  contentType: string;
  primaryText: string;
  hashtags: string[];
  callToAction: string;
  imageSuggestion: string;
  recommendedTime: string;
}

export interface CampaignGenerationResult {
  campaignName: string;
  contents: GeneratedContentItem[];
  provider: string;
  model: string;
  durationMs: number;
  promptTokens?: number;
  outputTokens?: number;
}

// ── Helpers ──────────────────────────────────────────────

function buildProductContext(product: ProductData, storeUrl: string): string {
  const productUrl = `${storeUrl}/products/${product.slug}`;
  const priceStr = product.salePrice
    ? `PKR ${product.salePrice.toLocaleString()} (was PKR ${product.price.toLocaleString()}, ${product.discount}% off)`
    : `PKR ${product.price.toLocaleString()}`;

  return [
    `PRODUCT: ${product.name}`,
    `URL: ${productUrl}`,
    `PRICE: ${priceStr}`,
    `CATEGORY: ${product.category}${product.subcategory ? ` > ${product.subcategory}` : ''}`,
    product.brand ? `BRAND: ${product.brand}` : '',
    product.collection ? `COLLECTION: ${product.collection}` : '',
    `SIZES: ${product.sizes.join(', ') || 'Standard'}`,
    `COLORS: ${product.colors.join(', ') || 'As shown'}`,
    `STOCK: ${product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}`,
    product.careInstructions ? `CARE: ${product.careInstructions}` : '',
    `TAGS: ${product.tags.join(', ')}`,
    product.featured ? 'STATUS: Featured Product' : '',
    product.trending ? 'STATUS: Trending' : '',
    `DESCRIPTION: ${product.description}`,
  ].filter(Boolean).join('\n');
}

function buildSystemPrompt(input: CampaignGenerationInput): string {
  return `You are a senior social media marketing strategist for TOP THREADZ, a premium Pakistani men's unstitched fabric brand based in Zamzama DHA Phase 5, Karachi.

BRAND VOICE:
- Premium, masculine, elegant, trustworthy
- Modern Pakistani aesthetics with global appeal
- Natural language — never sound AI-generated
- Never use generic marketing phrases
- Speak with authority and exclusivity

CRITICAL RULES:
- ONLY use the actual product data provided below. NEVER invent prices, reviews, discounts, materials, stock counts, guarantees, or features.
- If the product has no discount, do NOT mention any discount.
- Use the exact product URL provided.
- All prices must be in PKR exactly as provided.
- Reference the Top Threadz Zamzama DHA Phase 5 Karachi store.
- Include the store website: topthreadz.com.pk

PRODUCT DATA:
${buildProductContext(input.product, input.storeUrl)}

CAMPAIGN PARAMETERS:
- Platforms: ${input.platforms.join(', ')}
- Objective: ${input.objective}
- Tone: ${input.tone}
- Language: ${input.language}
- Duration: ${input.durationDays} days

LANGUAGE GUIDELINES:
${input.language === 'ENGLISH' ? '- Write entirely in English.' : ''}
${input.language === 'URDU' ? '- Write in Urdu script. Use proper Urdu grammar and vocabulary.' : ''}
${input.language === 'ROMAN_URDU' ? '- Write in Roman Urdu (Urdu words in English/Latin script). This is how young Pakistanis text.' : ''}
${input.language === 'MIXED' ? '- Mix English and Roman Urdu naturally, like educated young Pakistani professionals speak. Use English for technical/product terms and Roman Urdu for emotional/cultural appeal.' : ''}`;
}

function buildUserPrompt(input: CampaignGenerationInput): string {
  const platformInstructions = input.platforms.map(p => {
    switch (p) {
      case 'FACEBOOK': return '- FACEBOOK: Create an engaging post (150-300 words) with emojis, hashtags, and a strong CTA. Include product link.';
      case 'INSTAGRAM': return '- INSTAGRAM: Write a compelling caption (100-200 words) optimized for engagement. Include relevant hashtags (15-25). Add a Reel/Story hook idea.';
      case 'TIKTOK': return '- TIKTOK: Write a short hook (first 3 seconds text), a 30-60 second script outline for a Reel/TikTok, and trending sound suggestions.';
      case 'WHATSAPP': return '- WHATSAPP: Create a concise, personal status update (50-100 words) with emojis. Also create a broadcast message version.';
      default: return '';
    }
  }).filter(Boolean).join('\n');

  return `Generate a ${input.durationDays}-day marketing campaign for the product above.

For each platform, create unique content:
${platformInstructions}

IMPORTANT: Respond with valid JSON only — no markdown, no code fences, no explanation. Use this exact schema:
{
  "campaignName": "string — creative campaign name",
  "contents": [
    {
      "platform": "FACEBOOK|INSTAGRAM|TIKTOK|WHATSAPP",
      "contentType": "POST|CAPTION|REEL_HOOK_SCRIPT|STATUS_UPDATE",
      "primaryText": "the full post/caption/script text",
      "hashtags": ["tag1", "tag2"],
      "callToAction": "clear CTA text",
      "imageSuggestion": "which product image to use and how to present it",
      "recommendedTime": "HH:MM in Asia/Karachi timezone with reasoning"
    }
  ]
}

Generate one content item per platform. Make each piece unique and platform-native.`;
}

// ── Template Fallback (no AI key) ────────────────────────

function generateTemplateContent(input: CampaignGenerationInput): CampaignGenerationResult {
  const { product, platforms, objective, storeUrl } = input;
  const productUrl = `${storeUrl}/products/${product.slug}`;
  const priceStr = product.salePrice
    ? `PKR ${product.salePrice.toLocaleString()} (was PKR ${product.price.toLocaleString()})`
    : `PKR ${product.price.toLocaleString()}`;

  const contents: GeneratedContentItem[] = [];

  for (const platform of platforms) {
    switch (platform) {
      case 'FACEBOOK':
        contents.push({
          platform: 'FACEBOOK',
          contentType: 'POST',
          primaryText: `🔥 ${product.name}\n\n${product.description}\n\n💰 ${priceStr}\n${product.colors.length ? `🎨 Available in: ${product.colors.join(', ')}` : ''}\n${product.sizes.length ? `📏 Sizes: ${product.sizes.join(', ')}` : ''}\n\n${objective === 'SALES' ? '🛒 Order now before stock runs out!' : '✨ Discover the difference.'}\n\n👉 ${productUrl}\n\n#TopThreadz #PremiumFabric #MensWear #PakistaniFashion #UnstitchedFabric #Karachi #DHA #Zamzama`,
          hashtags: ['TopThreadz', 'PremiumFabric', 'MensWear', 'PakistaniFashion', 'UnstitchedFabric', 'Karachi', 'DHA', 'Zamzama'],
          callToAction: `Shop now: ${productUrl}`,
          imageSuggestion: product.images[0] ? `Use primary product image: ${product.images[0]}` : 'Use product catalog image',
          recommendedTime: '19:00 PKT — Peak evening engagement',
        });
        break;

      case 'INSTAGRAM':
        contents.push({
          platform: 'INSTAGRAM',
          contentType: 'CAPTION',
          primaryText: `${product.name} — Redefining premium menswear. ✨\n\n${product.description}\n\n${priceStr}\n${product.colors.length ? `Available in ${product.colors.join(' | ')}` : ''}\n\n${objective === 'LAUNCH' ? 'New arrival — limited stock.' : 'Elevate your wardrobe.'}\n\n🔗 Link in bio\n.\n.\n.`,
          hashtags: ['TopThreadz', 'MensFashionPakistan', 'PremiumFabric', 'UnstitchedSuit', 'PakistaniMensWear', 'KarachiFashion', 'ZamzamaDHA', 'MensStyle', 'FabricLove', 'ElegantMen', 'Menswear2026', 'DesignerFabric', 'SuitFabric', 'TraditionalWear', 'ModernClassic'],
          callToAction: 'Link in bio — topthreadz.com.pk',
          imageSuggestion: product.images[0] ? `Hero product shot: ${product.images[0]}` : 'Use styled flat-lay of the fabric',
          recommendedTime: '20:30 PKT — Instagram peak engagement for Pakistan',
        });
        break;

      case 'TIKTOK':
        contents.push({
          platform: 'TIKTOK',
          contentType: 'REEL_HOOK_SCRIPT',
          primaryText: `HOOK (0-3s): "This fabric will change how you dress." 🎬\n\nSCRIPT:\n- Show close-up texture shot of ${product.name}\n- Reveal the full drape and fall\n- Flash the price: ${priceStr}\n- End with: "Available at Top Threadz Zamzama, Karachi"\n\nCAPTION: ${product.name} — Premium unstitched fabric. ${priceStr}. Shop at topthreadz.com.pk\n\nSOUND: Trending Pakistani aesthetic / luxury reveal sound`,
          hashtags: ['TopThreadz', 'MensFabric', 'PakistanTikTok', 'FashionTikTok', 'PremiumQuality', 'UnstitchedFabric'],
          callToAction: 'Visit topthreadz.com.pk',
          imageSuggestion: 'Create a 15-30s Reel showing fabric texture, drape, and styling options',
          recommendedTime: '21:00 PKT — TikTok peak hours in Pakistan',
        });
        break;

      case 'WHATSAPP':
        contents.push({
          platform: 'WHATSAPP',
          contentType: 'STATUS_UPDATE',
          primaryText: `✨ ${product.name}\n${priceStr}\n${product.colors.length ? `Colors: ${product.colors.join(', ')}` : ''}\n\nShop: ${productUrl}\n📍 Top Threadz, Zamzama DHA Phase 5, Karachi`,
          hashtags: [],
          callToAction: `Order now: ${productUrl}`,
          imageSuggestion: product.images[0] ? `Product image for status: ${product.images[0]}` : 'Use product catalog image',
          recommendedTime: '12:00 PKT — Lunch break browsing peak',
        });
        break;
    }
  }

  return {
    campaignName: `${product.name} — ${objective.charAt(0) + objective.slice(1).toLowerCase()} Campaign`,
    contents,
    provider: 'template',
    model: 'fallback-v1',
    durationMs: 0,
  };
}

// ── AI Provider Calls ────────────────────────────────────

async function callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<{ text: string; promptTokens?: number; outputTokens?: number; model: string }> {
  const model = env.AI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json() as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data?.usageMetadata;

  return {
    text,
    promptTokens: usage?.promptTokenCount,
    outputTokens: usage?.candidatesTokenCount,
    model,
  };
}

async function callOpenAIAPI(systemPrompt: string, userPrompt: string): Promise<{ text: string; promptTokens?: number; outputTokens?: number; model: string }> {
  const model = env.AI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errBody}`);
  }

  const data = await response.json() as any;
  return {
    text: data?.choices?.[0]?.message?.content || '',
    promptTokens: data?.usage?.prompt_tokens,
    outputTokens: data?.usage?.completion_tokens,
    model,
  };
}

async function callAnthropicAPI(systemPrompt: string, userPrompt: string): Promise<{ text: string; promptTokens?: number; outputTokens?: number; model: string }> {
  const model = env.AI_MODEL || 'claude-sonnet-4-20250514';
  const url = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
  }

  const data = await response.json() as any;
  const text = data?.content?.[0]?.text || '';
  return {
    text,
    promptTokens: data?.usage?.input_tokens,
    outputTokens: data?.usage?.output_tokens,
    model,
  };
}

// ── Parse & Validate AI JSON Response ────────────────────

function parseAIResponse(raw: string): { campaignName: string; contents: GeneratedContentItem[] } {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.campaignName || !Array.isArray(parsed.contents) || parsed.contents.length === 0) {
    throw new Error('AI response missing required fields: campaignName, contents[]');
  }

  const validPlatforms = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'WHATSAPP'];
  const validContentTypes = ['POST', 'CAPTION', 'REEL_HOOK_SCRIPT', 'STATUS_UPDATE', 'CAROUSEL'];

  const validatedContents: GeneratedContentItem[] = parsed.contents.map((c: any) => ({
    platform: validPlatforms.includes(c.platform) ? c.platform : 'FACEBOOK',
    contentType: validContentTypes.includes(c.contentType) ? c.contentType : 'POST',
    primaryText: String(c.primaryText || ''),
    hashtags: Array.isArray(c.hashtags) ? c.hashtags.map(String) : [],
    callToAction: String(c.callToAction || ''),
    imageSuggestion: String(c.imageSuggestion || ''),
    recommendedTime: String(c.recommendedTime || ''),
  }));

  return { campaignName: String(parsed.campaignName), contents: validatedContents };
}

// ── Main Export ──────────────────────────────────────────

export async function generateMarketingCampaign(input: CampaignGenerationInput): Promise<CampaignGenerationResult> {
  // If no API key is configured, use template fallback
  if (!env.AI_API_KEY) {
    logger.info('No AI_API_KEY configured — using template-based content generation');
    return generateTemplateContent(input);
  }

  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input);
  const startMs = Date.now();

  try {
    let result: { text: string; promptTokens?: number; outputTokens?: number; model: string };

    switch (env.AI_PROVIDER.toLowerCase()) {
      case 'openai':
        result = await callOpenAIAPI(systemPrompt, userPrompt);
        break;
      case 'anthropic':
        result = await callAnthropicAPI(systemPrompt, userPrompt);
        break;
      case 'gemini':
      default:
        result = await callGeminiAPI(systemPrompt, userPrompt);
        break;
    }

    const durationMs = Date.now() - startMs;
    const parsed = parseAIResponse(result.text);

    return {
      campaignName: parsed.campaignName,
      contents: parsed.contents,
      provider: env.AI_PROVIDER,
      model: result.model,
      durationMs,
      promptTokens: result.promptTokens,
      outputTokens: result.outputTokens,
    };
  } catch (error: any) {
    logger.error('AI generation failed, falling back to template', error);
    const fallback = generateTemplateContent(input);
    fallback.provider = `${env.AI_PROVIDER}-fallback`;
    fallback.model = 'template-fallback';
    return fallback;
  }
}
