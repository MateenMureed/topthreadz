/**
 * socialImageCompose.ts
 *
 * Composes a branded product image for social media posts.
 * Applies a sleek bottom banner containing: color, category, and price.
 * Banner style: semi-transparent dark frosted-glass with gold accent text.
 * Composed image is uploaded to Cloudinary (folder: topthreadz-social).
 */

import sharp from 'sharp';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../config/cloudinary';
import logger from '../../utils/logger';

export interface ComposeOptions {
  imageUrl: string;
  colorNames: string[];
  category: string;
  priceStr: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildBannerSVG(
  imgW: number,
  imgH: number,
  colorNames: string[],
  category: string,
  priceStr: string,
): { svg: Buffer; bannerH: number; top: number } {
  const bannerH = Math.round(imgH * 0.195);
  const top = imgH - bannerH;

  const priceFontSize  = Math.round(imgW * 0.072);
  const detailFontSize = Math.round(imgW * 0.042);

  const colorText = colorNames.slice(0, 3).join('  ·  ');
  const detailText = colorText
    ? `${colorText.toUpperCase()}  |  ${category.toUpperCase()}`
    : category.toUpperCase();

  const midY    = bannerH / 2;
  const priceY  = midY + priceFontSize * 0.18;
  const detailY = priceY - priceFontSize * 0.95;

  const svgContent = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${bannerH}">`,
    `<defs>`,
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0%" stop-color="#0a0a0a" stop-opacity="0.55"/>`,
    `<stop offset="100%" stop-color="#0a0a0a" stop-opacity="0.92"/>`,
    `</linearGradient>`,
    `<linearGradient id="ln" x1="0" y1="0" x2="1" y2="0">`,
    `<stop offset="0%" stop-color="#c8952a" stop-opacity="0"/>`,
    `<stop offset="30%" stop-color="#c8952a" stop-opacity="0.9"/>`,
    `<stop offset="70%" stop-color="#c8952a" stop-opacity="0.9"/>`,
    `<stop offset="100%" stop-color="#c8952a" stop-opacity="0"/>`,
    `</linearGradient>`,
    `<filter id="sh">`,
    `<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>`,
    `</filter>`,
    `</defs>`,
    `<rect width="${imgW}" height="${bannerH}" fill="url(#bg)"/>`,
    `<rect x="0" y="0" width="${imgW}" height="2" fill="url(#ln)"/>`,
    `<text x="${imgW / 2}" y="${detailY}" font-family="Arial,Helvetica Neue,sans-serif" font-size="${detailFontSize}" font-weight="400" letter-spacing="${Math.round(detailFontSize * 0.18)}" fill="#e8d5a3" text-anchor="middle" dominant-baseline="middle" filter="url(#sh)">${escapeXml(detailText)}</text>`,
    `<text x="${imgW / 2}" y="${priceY}" font-family="Arial Black,Arial,Helvetica Neue,sans-serif" font-size="${priceFontSize}" font-weight="900" letter-spacing="${Math.round(priceFontSize * 0.04)}" fill="#f5d97a" text-anchor="middle" dominant-baseline="middle" filter="url(#sh)">${escapeXml(priceStr)}</text>`,
    `<rect x="0" y="${bannerH - 3}" width="${imgW}" height="3" fill="#c8952a" opacity="0.7"/>`,
    `</svg>`,
  ].join('\n');

  return { svg: Buffer.from(svgContent, 'utf-8'), bannerH, top };
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': 'TopThreadz-SocialBot/1.0' } });
  if (!res.ok) {
    throw new Error(`Failed to fetch product image: HTTP ${res.status} from ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function composePostImage(opts: ComposeOptions): Promise<string> {
  const { imageUrl, colorNames, category, priceStr } = opts;

  try {
    if (!isCloudinaryConfigured()) {
      logger.warn('[SocialCompose] Cloudinary not configured — skipping composition');
      return imageUrl;
    }

    logger.info('[SocialCompose] Fetching image:', imageUrl);
    const rawBuffer = await fetchImageBuffer(imageUrl);

    const pipeline = sharp(rawBuffer).rotate();
    const meta = await pipeline.metadata();
    const imgW = meta.width ?? 1080;
    const imgH = meta.height ?? 1350;

    const { svg, bannerH, top } = buildBannerSVG(imgW, imgH, colorNames, category, priceStr);
    logger.info(`[SocialCompose] Banner: ${imgW}x${imgH}, h=${bannerH}, top=${top}`);

    const composed = await pipeline
      .composite([{ input: svg, top, left: 0, blend: 'over' }])
      .jpeg({ quality: 93, progressive: true })
      .toBuffer();

    const { url } = await uploadToCloudinary(composed, 'topthreadz-social');
    logger.info('[SocialCompose] Uploaded composed image:', url);
    return url;
  } catch (err: any) {
    logger.error('[SocialCompose] Composition failed — using original:', err.message);
    return imageUrl;
  }
}
