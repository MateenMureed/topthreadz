/**
 * socialImageCompose.ts
 *
 * Composes a branded product image for Facebook and Instagram posts.
 *
 * Why this architecture:
 * 1. Sharp composites the dark frosted-glass gradient bar and gold divider lines
 *    onto the product image (pure graphics, 100% reliable across any OS).
 * 2. Cloudinary adds the text overlays (Color, Category, Price) in the cloud
 *    using its server-side font engine (Arial/Montserrat).
 *    This completely eliminates the missing-font "tofu boxes" (▯▯▯) bug that occurs
 *    when trying to render SVG text on Vercel/Linux serverless environments.
 * 3. The composed image is stored in Cloudinary folder `topthreadz-social` and
 *    its public HTTPS URL is returned for Facebook/Instagram publishing.
 */

import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { isCloudinaryConfigured } from '../../config/cloudinary';
import logger from '../../utils/logger';

export interface ComposeOptions {
  imageUrl: string;
  colorNames: string[];
  category: string;
  priceStr: string;
}

/**
 * Fetch an image from a public URL and return it as a Buffer.
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': 'TopThreadz-SocialBot/1.0' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch product image: HTTP ${res.status} from ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Composites a branded bottom banner with product details (color, category, price)
 * onto the image and returns a public Cloudinary URL.
 */
export async function composePostImage(opts: ComposeOptions): Promise<string> {
  const { imageUrl, colorNames, category, priceStr } = opts;

  try {
    if (!isCloudinaryConfigured()) {
      logger.warn('[SocialCompose] Cloudinary not configured — skipping composition');
      return imageUrl;
    }

    logger.info('[SocialCompose] Fetching original image for composition:', imageUrl);
    const rawBuffer = await fetchImageBuffer(imageUrl);

    // 1. Read dimensions and normalize orientation
    const pipeline = sharp(rawBuffer).rotate();
    const meta = await pipeline.metadata();
    const imgW = meta.width ?? 1080;
    const imgH = meta.height ?? 1350;

    const bannerH = Math.round(imgH * 0.185);
    const bannerTop = imgH - bannerH;

    // 2. Build the graphic banner (dark frosted gradient + gold divider lines)
    // Pure vector graphics with NO text elements — immune to fontconfig/OS font errors
    const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${bannerH}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#080808" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="#080808" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#c8952a" stop-opacity="0"/>
          <stop offset="25%" stop-color="#c8952a" stop-opacity="0.95"/>
          <stop offset="75%" stop-color="#c8952a" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#c8952a" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Dark frosted banner background -->
      <rect width="${imgW}" height="${bannerH}" fill="url(#bg)"/>
      <!-- Top gold accent line -->
      <rect x="0" y="0" width="${imgW}" height="3" fill="url(#goldLine)"/>
      <!-- Bottom subtle gold highlight -->
      <rect x="0" y="${bannerH - 3}" width="${imgW}" height="3" fill="#c8952a" opacity="0.6"/>
    </svg>`;

    // 3. Composite dark banner over the product image
    const imageWithBanner = await pipeline
      .composite([{ input: Buffer.from(bannerSvg), top: bannerTop, left: 0, blend: 'over' }])
      .jpeg({ quality: 92, progressive: true })
      .toBuffer();

    // 4. Prepare text content
    const colorText = colorNames.slice(0, 3).join('  ·  ');
    const detailText = colorText && category
      ? `${colorText.toUpperCase()}  |  ${category.toUpperCase()}`
      : (colorText || category || 'PREMIUM COLLECTION').toUpperCase();

    // Proportional font sizes and positions (relative to image dimensions)
    const detailFontSize = Math.max(18, Math.round(imgW * 0.026));
    const priceFontSize  = Math.max(34, Math.round(imgW * 0.048));
    const detailY        = Math.round(bannerH * 0.58);
    const priceY         = Math.round(bannerH * 0.20);

    // 5. Upload to Cloudinary with cloud-rendered text overlays
    // Cloudinary renders Arial fonts on its servers with 100% reliability, zero tofu boxes!
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'topthreadz-social',
          resource_type: 'image',
          transformation: [
            // Detail line (Color | Category) in champagne gold
            {
              overlay: {
                font_family: 'Arial',
                font_size: detailFontSize,
                letter_spacing: 2,
                text: encodeURIComponent(detailText),
              },
              color: 'rgb:e8d5a3',
              gravity: 'south',
              y: detailY,
            },
            // Price line (PKR) in bold rich gold
            {
              overlay: {
                font_family: 'Arial',
                font_size: priceFontSize,
                font_weight: 'bold',
                text: encodeURIComponent(priceStr || 'PKR'),
              },
              color: 'rgb:f5d97a',
              gravity: 'south',
              y: priceY,
            },
          ],
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(imageWithBanner);
    });

    logger.info('[SocialCompose] Successfully generated branded post image:', uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (err: any) {
    logger.error('[SocialCompose] Composition failed, falling back to original image:', err.message);
    return imageUrl;
  }
}
