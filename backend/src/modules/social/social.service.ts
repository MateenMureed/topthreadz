/**
 * social.service.ts
 * Business logic for the Social Publishing module.
 * - Caption generation via Gemini AI (reuses existing GEMINI_API_KEY env var)
 * - Publishing to Facebook Page and Instagram Business account
 * - Post history management in PostgreSQL via Prisma
 */

import { PrismaClient, SocialPlatform, SocialPostStatus } from '@prisma/client';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import {
  getMetaConfig,
  getMetaStatus,
  publishToFacebook,
  publishToInstagram,
  MetaStatusResult,
} from './meta.client';
import { composePostImage } from './socialImageCompose';

const prisma = new PrismaClient();

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProductForCaption {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number | null;
  discount?: number;
  category: string;
  subcategory?: string | null;
  colors: string[];
  images: string[];
  tags: string[];
  featured?: boolean;
  trending?: boolean;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  fullText: string; // caption + hashtags ready to copy-paste
}

export interface PublishRequest {
  productId: string;
  productName: string;
  imageUrl: string;
  productUrl: string;
  caption: string;
  hashtags: string[];
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'BOTH';
  // Optional metadata for bottom banner composition
  colorNames?: string[];  // e.g. ['Cobalt Blue', 'Ivory']
  category?: string;      // e.g. 'Unstitched Fabric'
  priceStr?: string;      // e.g. 'PKR 3,500'
}

export interface PublishResult {
  success: boolean;
  facebookResult?: { postId: string; postUrl: string } | null;
  instagramResult?: { mediaId: string } | null;
  socialPostId: string;
  error?: string;
}

// ── Caption Generation ─────────────────────────────────────────────────────

/**
 * Build a Gemini prompt to generate a premium English caption for a product.
 * Deliberately kept simple and focused: one rich caption block + hashtag array.
 */
function buildCaptionPrompt(product: ProductForCaption, productUrl: string): string {
  const priceStr = product.salePrice
    ? `PKR ${product.salePrice.toLocaleString()} (was PKR ${product.price.toLocaleString()}, ${product.discount ?? 0}% off)`
    : `PKR ${product.price.toLocaleString()}`;

  const colorStr = product.colors.length ? product.colors.join(', ') : 'As shown';
  const categoryStr = product.subcategory
    ? `${product.category} › ${product.subcategory}`
    : product.category;

  return `You are a senior social media copywriter for TOP THREADZ — a premium Pakistani men's fashion brand based in Zamzama DHA Phase 5, Karachi.

BRAND VOICE: Premium, elegant, masculine, modern Pakistani. Never generic. Speak with authority.

STRICT RULES:
- Only use facts from the product data below. Never invent discounts, guarantees, reviews, or features.
- Include the exact product URL.
- All prices in PKR as given.
- Keep caption 3-5 sentences. Punchy, premium, emotional.
- Hashtags: 12-18 relevant tags mixing brand, category, and cultural tags. Include #TopThreadz.

PRODUCT DATA:
Name: ${product.name}
Price: ${priceStr}
Category: ${categoryStr}
Colors: ${colorStr}
Description: ${product.description}
URL: ${productUrl}
${product.featured ? 'Status: Featured Product' : ''}
${product.trending ? 'Status: Trending Now' : ''}

Respond with valid JSON only — no markdown fences, no explanation:
{
  "caption": "3-5 sentence premium caption text (no hashtags in this field, end with the product URL)",
  "hashtags": ["tag1", "tag2", ...]
}`;
}

/**
 * Generate a premium social media caption + hashtags for a product using Gemini AI.
 * Falls back to a template if the API key is not configured.
 */
export async function generateCaption(product: ProductForCaption): Promise<GeneratedCaption> {
  const storeUrl = process.env.STORE_FRONTEND_URL || env.FRONTEND_URL || 'https://www.topthreadz.com.pk';
  const productUrl = `${storeUrl}/products/${product.slug}`;
  const prompt = buildCaptionPrompt(product, productUrl);

  const geminiKey = env.GEMINI_API_KEY;

  if (!geminiKey) {
    logger.warn('[SocialService] GEMINI_API_KEY not set — using template caption');
    return buildTemplateCaption(product, productUrl);
  }

  try {
    const geminiModel = env.GEMINI_MODEL || 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental markdown code fences
    const clean = rawText.replace(/^```(?:json)?\s*/im, '').replace(/\s*```$/im, '').trim();
    const parsed = JSON.parse(clean);

    const caption: string = parsed.caption || '';
    const hashtags: string[] = Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: string) => h.replace(/^#/, '')) : [];

    return {
      caption,
      hashtags,
      fullText: `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
    };
  } catch (err: any) {
    logger.error('[SocialService] Gemini caption generation failed:', err.message);
    return buildTemplateCaption(product, productUrl);
  }
}

function buildTemplateCaption(product: ProductForCaption, productUrl: string): GeneratedCaption {
  const priceStr = product.salePrice
    ? `PKR ${product.salePrice.toLocaleString()}`
    : `PKR ${product.price.toLocaleString()}`;
  const colorStr = product.colors.slice(0, 3).join(', ');

  const caption = [
    `✨ Introducing the ${product.name} — crafted for the discerning Pakistani gentleman.`,
    colorStr ? `Available in ${colorStr}${product.colors.length > 3 ? ' and more.' : '.'}` : '',
    `Premium quality at ${priceStr}.`,
    `Experience the Top Threadz difference. Shop now: ${productUrl}`,
  ].filter(Boolean).join(' ');

  const hashtags = [
    'TopThreadz', 'PremiumFabric', 'MensWear', 'PakistaniFashion',
    'UnstitchedFabric', 'Karachi', 'DHA', 'Zamzama',
    'MensFashion', 'PakistaniMensWear', 'DesignerFabric', 'ElegantMen',
  ];

  return {
    caption,
    hashtags,
    fullText: `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
  };
}

// ── Publishing ─────────────────────────────────────────────────────────────

/**
 * Publish a product post to Facebook, Instagram, or both.
 * Saves the attempt (success or failure) to the SocialPost table.
 */
export async function publishPost(req: PublishRequest): Promise<PublishResult> {
  const config = getMetaConfig();

  if (!config) {
    throw new Error('Meta integration is not configured. Please set META_PAGE_ACCESS_TOKEN and META_FACEBOOK_PAGE_ID in your environment variables.');
  }

  // Build the full post text: caption + hashtags
  const hashtagStr = req.hashtags.length
    ? `\n\n${req.hashtags.map(h => `#${h}`).join(' ')}`
    : '';
  const fullCaption = `${req.caption}${hashtagStr}`;

  // ── Compose image with bottom info banner ──────────────────────────────────
  // Downloads the product image, stamps a dark frosted-glass banner at the
  // bottom showing color · category | price, re-uploads to Cloudinary.
  // Falls back silently to the original URL if anything goes wrong.
  let composedImageUrl = req.imageUrl;
  if (req.colorNames || req.category || req.priceStr) {
    composedImageUrl = await composePostImage({
      imageUrl: req.imageUrl,
      colorNames: req.colorNames ?? [],
      category: req.category ?? '',
      priceStr: req.priceStr ?? '',
    });
  }

  let fbPostId: string | undefined;
  let igMediaId: string | undefined;
  let errorMessage: string | undefined;
  let overallStatus: SocialPostStatus = SocialPostStatus.PUBLISHED;

  try {
    if (req.platform === 'FACEBOOK' || req.platform === 'BOTH') {
      const fbResult = await publishToFacebook(config, composedImageUrl, fullCaption);
      fbPostId = fbResult.post_id || fbResult.id;
      logger.info('[SocialService] Published to Facebook:', fbPostId);
    }

    if (req.platform === 'INSTAGRAM' || req.platform === 'BOTH') {
      if (!config.instagramAccountId) {
        if (req.platform === 'INSTAGRAM') {
          throw new Error('Instagram Account ID is not configured. Please set META_INSTAGRAM_ACCOUNT_ID in your environment variables.');
        } else {
          logger.warn('[SocialService] Skipping Instagram: META_INSTAGRAM_ACCOUNT_ID not configured');
        }
      } else {
        const igResult = await publishToInstagram(config, composedImageUrl, fullCaption);
        igMediaId = igResult.id;
        logger.info('[SocialService] Published to Instagram:', igMediaId);
      }
    }
  } catch (err: any) {
    errorMessage = err.message;
    overallStatus = SocialPostStatus.FAILED;
    logger.error('[SocialService] Publish error:', err.message);
  }

  // Save to DB regardless of outcome
  const post = await prisma.socialPost.create({
    data: {
      productId: req.productId,
      productName: req.productName,
      platform: req.platform as SocialPlatform,
      caption: req.caption,
      hashtags: req.hashtags,
      imageUrl: req.imageUrl,
      productUrl: req.productUrl,
      fbPostId: fbPostId || null,
      igMediaId: igMediaId || null,
      status: overallStatus,
      errorMessage: errorMessage || null,
      publishedAt: overallStatus === SocialPostStatus.PUBLISHED ? new Date() : null,
    },
  });

  if (overallStatus === SocialPostStatus.FAILED) {
    return {
      success: false,
      socialPostId: post.id,
      error: errorMessage,
    };
  }

  const storeUrl = process.env.STORE_FRONTEND_URL || env.FRONTEND_URL || 'https://www.topthreadz.com.pk';

  return {
    success: true,
    socialPostId: post.id,
    facebookResult: fbPostId
      ? { postId: fbPostId, postUrl: `https://www.facebook.com/${fbPostId}` }
      : null,
    instagramResult: igMediaId ? { mediaId: igMediaId } : null,
  };
}

// ── History ────────────────────────────────────────────────────────────────

export interface HistoryQuery {
  page?: number;
  limit?: number;
  platform?: string;
  status?: string;
}

export async function getHistory(query: HistoryQuery = {}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.platform && ['FACEBOOK', 'INSTAGRAM', 'BOTH'].includes(query.platform)) {
    where.platform = query.platform;
  }
  if (query.status && ['DRAFT', 'PUBLISHED', 'FAILED'].includes(query.status)) {
    where.status = query.status;
  }

  const [posts, total] = await Promise.all([
    prisma.socialPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.socialPost.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Status ─────────────────────────────────────────────────────────────────

export async function getSocialStatus(): Promise<MetaStatusResult> {
  return getMetaStatus();
}
