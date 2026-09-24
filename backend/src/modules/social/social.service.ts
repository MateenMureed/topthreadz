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
  // Clean product name to remove any trailing "| Top Threadz" or "- Top Threadz"
  const cleanName = product.name
    .replace(/\s*\|\s*Top\s*Threadz/gi, '')
    .replace(/\s*-\s*Top\s*Threadz/gi, '')
    .trim();

  const priceStr = product.salePrice
    ? `PKR ${product.salePrice.toLocaleString()} (was PKR ${product.price.toLocaleString()}, ${product.discount ?? 0}% off)`
    : `PKR ${product.price.toLocaleString()}`;

  const colorStr = product.colors.length ? product.colors.join(', ') : 'As shown';
  const categoryStr = product.subcategory
    ? `${product.category} › ${product.subcategory}`
    : product.category;

  return `You are an elite fashion copywriter for TOP THREADZ — Karachi's premier luxury men's label in Zamzama DHA Phase 5.

TASK: Write an authentic, human-written, high-converting FACEBOOK MARKETING POST for this product.

🚨 STRICT CREATIVE RULES (ANTI-ROBOT / UNIQUE HUMAN VOICE):
1. BANNED CLICHÉS: NEVER use "Elevate your wardrobe", "Masterfully crafted for the modern gentleman", "Look no further", or "Introducing the...". These sound like AI.
2. MAKE EVERY POST COMPLETELY UNIQUE: Tailor the tone directly to the product's fabric, color, and practical appeal:
   - For Wash & Wear: Highlight zero-crease sharpness, all-day crispness, effortless maintenance, office-to-dinner elegance.
   - For Cotton / Latha: Highlight breathable comfort, lightweight drape, cool natural weave, understated sophistication.
   - For Dark colors (Black, Navy, Brown, Charcoal): Highlight authoritative presence, bold contrast, evening depth.
   - For Light colors (Off-White, Cream, Sky): Highlight regal summer purity, timeless heritage, celebratory charm.
3. STRUCTURE WITH GAPS (FACEBOOK MARKETING STYLE):
   - Hook: Catchy, unique headline with emojis (varies every time, e.g. "⚡ THE POWER OF PURE TEXTURE", "🍂 DEEP BROWN WASH & WEAR HAS LANDED", "✨ CRISP. COLD. IMMACULATE.")
   - Blank line (\n\n)
   - Intro: 2 fresh, natural, human-sounding sentences explaining why this piece feels and looks exceptional to wear.
   - Blank line (\n\n)
   - "💎 PRODUCT SPECIFICATIONS:"
     • Category: ${categoryStr}
     • Available Color(s): ${colorStr}
     • Price: ${priceStr}
   - Blank line (\n\n)
   - "🇵🇰 SHOP WITH CONFIDENCE:"
     • 100% Guaranteed Premium Fabric
     • Cash on Delivery Available Across Pakistan
     • Free Shipping on Orders Over PKR 5,000
   - Blank line (\n\n)
   - CTA with Link & Flagship Location:
     🛒 Claim yours online before roll runs out:
     👉 ${productUrl}

     📍 Flagship: Zamzama DHA Phase 5, Karachi

PRODUCT DETAILS:
Name: ${cleanName}
Price: ${priceStr}
Category: ${categoryStr}
Colors: ${colorStr}
Description: ${product.description}
URL: ${productUrl}
${product.featured ? 'Status: Featured Roll' : ''}
${product.trending ? 'Status: High Demand' : ''}

Respond with valid JSON only — no markdown fences, no commentary:
{
  "caption": "Complete Facebook marketing post text formatted with double line breaks between sections.",
  "hashtags": ["TopThreadz", "PakistaniFashion", "MensWear", "UnstitchedFabric", "Karachi", "Zamzama"]
}`;
}

/**
 * Generate a premium social media caption + hashtags for a product using Gemini AI.
 * Falls back to dynamic human-written templates if the API key is not configured.
 */
export async function generateCaption(product: ProductForCaption): Promise<GeneratedCaption> {
  const storeUrl = process.env.STORE_FRONTEND_URL || env.FRONTEND_URL || 'https://www.topthreadz.com.pk';
  const productUrl = `${storeUrl}/products/${product.slug}`;
  const prompt = buildCaptionPrompt(product, productUrl);

  const geminiKey = env.GEMINI_API_KEY;

  if (!geminiKey) {
    logger.warn('[SocialService] GEMINI_API_KEY not set — using dynamic template caption');
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
          temperature: 0.9, // slightly higher temperature for authentic variety
          maxOutputTokens: 900,
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

/**
 * Dynamic human-written template generator.
 * Produces unique, varied openings based on the fabric, colors, and product traits
 * so no two products ever share the exact same copy.
 */
function buildTemplateCaption(product: ProductForCaption, productUrl: string): GeneratedCaption {
  const cleanName = product.name
    .replace(/\s*\|\s*Top\s*Threadz/gi, '')
    .replace(/\s*-\s*Top\s*Threadz/gi, '')
    .trim();

  const priceStr = product.salePrice
    ? `PKR ${product.salePrice.toLocaleString()} (was PKR ${product.price.toLocaleString()})`
    : `PKR ${product.price.toLocaleString()}`;
  const colorStr = product.colors.length ? product.colors.slice(0, 4).join(', ') : 'Exclusive Shades';
  const categoryStr = product.subcategory
    ? `${product.category} — ${product.subcategory}`
    : product.category;

  const nameLower = cleanName.toLowerCase();
  const isWashAndWear = nameLower.includes('wash') || nameLower.includes('wear');
  const isCotton = nameLower.includes('cotton') || nameLower.includes('latha');
  const isDark = product.colors.some(c => /black|dark|navy|charcoal|brown|burgundy|olive/i.test(c)) || /dark|black|navy|brown/i.test(nameLower);

  // Deterministic seed so a product consistently gets a natural fit, but different products get varied copy
  const seed = (product.id || cleanName).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  let hook = '✨ TOP THREADZ | CURATED LUXURY ROLL';
  let intro = `A standout addition to our seasonal roll. The ${cleanName} brings high-density weave and an unmatched natural drape to your traditional wardrobe.`;

  if (isWashAndWear) {
    const washOptions = [
      {
        hook: `👔 WRINKLE-FREE CONFIDENCE | TOP THREADZ`,
        intro: `Zero midday creases, zero compromise. The ${cleanName} is engineered to stay sharp and crisp from early morning meetings right through to evening gatherings.`,
      },
      {
        hook: `⚡ EFFORTLESS POLISH. ZERO COMPROMISE.`,
        intro: `When your schedule demands all-day poise without ironing hassles, the ${cleanName} delivers. Breathable, fluid fall, and razor-sharp lines all day long.`,
      },
      {
        hook: `✨ THE DAILY EXECUTIVE STAPLE`,
        intro: `Subtle sheen, high-durability yarn, and a fall that turns heads. The ${cleanName} gives you the luxury look with easy wash-and-wear care.`,
      },
    ];
    const pick = washOptions[seed % washOptions.length];
    hook = pick.hook;
    intro = pick.intro;
  } else if (isCotton) {
    const cottonOptions = [
      {
        hook: `🌿 THE BREATHABLE HERITAGE WEAVE`,
        intro: `Nothing feels quite like authentic, high-count cotton. The ${cleanName} pairs an ultra-soft hand-feel with a crisp masculine silhouette suited for any occasion.`,
      },
      {
        hook: `✨ COOL COMFORT, REGAL DRAPE`,
        intro: `Hand-selected yarns woven to perfection. The ${cleanName} offers cool, lightweight ease without losing that structured, tailored grace you count on.`,
      },
      {
        hook: `🕊️ UNDERSTATED SOPHISTICATION | TOP THREADZ`,
        intro: `A masterclass in quiet luxury. The ${cleanName} lets the quality of the weave do all the talking — light on skin, immaculate in every setting.`,
      },
    ];
    const pick = cottonOptions[seed % cottonOptions.length];
    hook = pick.hook;
    intro = pick.intro;
  } else if (isDark) {
    const darkOptions = [
      {
        hook: `🖤 DEEP TONES & UNMISTAKABLE DEPTH`,
        intro: `Command any room with the rich, saturated tones of the ${cleanName}. A commanding choice for formal gatherings, dinners, and evening occasions.`,
      },
      {
        hook: `👑 THE POWER PALETTE | TOP THREADZ`,
        intro: `Bold, masculine, and unapologetically refined. The ${cleanName} offers an intensely rich depth of shade that holds its brilliant luster wear after wear.`,
      },
      {
        hook: `✨ STATEMENT TAILORING FOR THE DISCERNING`,
        intro: `Rich tones meet immaculate textile finish. The ${cleanName} is tailored in spirit for men who value quiet strength and dignified style.`,
      },
    ];
    const pick = darkOptions[seed % darkOptions.length];
    hook = pick.hook;
    intro = pick.intro;
  } else {
    const generalOptions = [
      {
        hook: `✨ FRESH FROM OUR EXCLUSIVE ROLLS`,
        intro: `Selected by our master tailors for its exceptional fall and tactile texture. The ${cleanName} is ready to be cut and styled to your exact preference.`,
      },
      {
        hook: `🌟 CRAFTED FOR SPECIAL OCCASIONS`,
        intro: `When ordinary fabric simply won't do. The ${cleanName} brings premium textile density and subtle luster that sets your traditional attire apart.`,
      },
      {
        hook: `💎 MODERN EASTERN ATTIRE REDEFINED`,
        intro: `Designed for moments where presence matters. The ${cleanName} balances traditional eastern aesthetic with contemporary textile excellence.`,
      },
    ];
    const pick = generalOptions[seed % generalOptions.length];
    hook = pick.hook;
    intro = pick.intro;
  }

  const sections = [
    hook,
    intro,
    `💎 PRODUCT SPECIFICATIONS:\n• Category: ${categoryStr}\n• Available Color(s): ${colorStr}\n• Price: ${priceStr}`,
    `🇵🇰 SHOP WITH CONFIDENCE:\n• 100% Guaranteed Premium Fabric\n• Cash on Delivery Nationwide (Pakistan)\n• Free Shipping on Orders Over PKR 5,000`,
    `🛒 Claim your cut online before rolls run out:\n👉 ${productUrl}\n\n📍 Flagship Store: Zamzama DHA Phase 5, Karachi`,
  ];

  const caption = sections.join('\n\n');

  const hashtags = [
    'TopThreadz',
    'PakistaniFashion',
    'MensFashion',
    'UnstitchedFabric',
    'KarachiFashion',
    'Zamzama',
    'DHA',
    'LuxuryMenswear',
    'PakistaniMen',
    'PremiumFabric',
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
