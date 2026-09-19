/**
 * brandWatermark.ts
 *
 * Server-side image compositing utility that stamps the Top Threadz logo
 * onto every new product image before it is uploaded to Cloudinary.
 *
 * Placement rules (percentage-based, 3:4 portrait optimised):
 *   logoLeft  = imageWidth  * 0.07
 *   logoTop   = imageHeight * 0.05
 *   logoWidth = imageWidth  * 0.23
 *   logoHeight is calculated automatically from the original logo aspect ratio.
 *
 * These percentages are derived from the official reference image so the
 * logo visual position remains identical across all 3:4 resolutions.
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// ─── Logo candidate paths ─────────────────────────────────────────────────────
const CANDIDATE_PATHS = [
  path.resolve(__dirname, '../assets/topthreadz-logo.png'),
  path.resolve(__dirname, '../../src/assets/topthreadz-logo.png'),
  path.resolve(process.cwd(), 'src/assets/topthreadz-logo.png'),
  path.resolve(process.cwd(), 'dist/src/assets/topthreadz-logo.png'),
  path.resolve(process.cwd(), 'backend/src/assets/topthreadz-logo.png'),
  path.resolve(process.cwd(), '../frontend/public/images/topthreadz-logo.png'),
  path.resolve(process.cwd(), 'frontend/public/images/topthreadz-logo.png'),
  path.resolve(__dirname, '../../../frontend/public/images/topthreadz-logo.png'),
];

// In-process cache — read once, reuse for every upload in that process.
let _logoBuffer: Buffer | null = null;
let _logoOrigW = 804;
let _logoOrigH = 397;

async function getLogoMeta(): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (_logoBuffer) {
    return { buffer: _logoBuffer, width: _logoOrigW, height: _logoOrigH };
  }

  let foundPath: string | null = null;
  for (const candidate of CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) {
      foundPath = candidate;
      break;
    }
  }

  if (!foundPath) {
    throw new Error(`Top Threadz logo not found in candidate paths: ${CANDIDATE_PATHS.join(', ')}`);
  }

  const raw = await fs.promises.readFile(foundPath);
  const meta = await sharp(raw).metadata();
  _logoOrigW = meta.width ?? 804;
  _logoOrigH = meta.height ?? 397;
  _logoBuffer = raw;

  return { buffer: _logoBuffer, width: _logoOrigW, height: _logoOrigH };
}

/**
 * Composites the Top Threadz logo onto a product image buffer using
 * percentage-based positioning:
 *   logoLeft   = imageWidth  * 0.07
 *   logoTop    = imageHeight * 0.05
 *   logoWidth  = imageWidth  * 0.23
 *   logoHeight = calculated from logo's aspect ratio
 *
 * @param imageBuffer  Raw multer buffer (JPEG, PNG, WebP).
 * @returns            JPEG buffer with the logo stamped in the upper-left.
 */
export async function applyProductBranding(imageBuffer: Buffer): Promise<Buffer> {
  const { buffer: logoRaw, width: logoOrigW, height: logoOrigH } = await getLogoMeta();

  // 1. Normalize orientation via EXIF (.rotate() without args auto-orientates)
  const orientedPipeline = sharp(imageBuffer).rotate();
  const productMeta = await orientedPipeline.metadata();

  const imgW = productMeta.width ?? 900;
  const imgH = productMeta.height ?? 1200;

  // 2. Scale the logo proportionally:
  //    logoWidth  = 23% of image width
  //    logoHeight = auto from aspect ratio
  const targetLogoW = Math.round(imgW * 0.23);
  const aspectRatio = logoOrigH / logoOrigW;
  const targetLogoH = Math.round(targetLogoW * aspectRatio);

  // 3. Compute placement offsets (7% from left, 5% from top)
  const left = Math.round(imgW * 0.07);
  const top  = Math.round(imgH * 0.05);

  // 4. Resize logo, preserving alpha transparency
  const resizedLogo = await sharp(logoRaw)
    .resize(targetLogoW, targetLogoH, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 5. Composite over the oriented product image
  const branded = await orientedPipeline
    .composite([{ input: resizedLogo, top, left, blend: 'over' }])
    .jpeg({ quality: 92, progressive: true })
    .toBuffer();

  return branded;
}
