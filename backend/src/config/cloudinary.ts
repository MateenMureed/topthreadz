import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import logger from '../utils/logger';

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryImage {
  url: string;
  publicId: string;
}

export async function uploadToCloudinary(buffer: Buffer, folder = 'ecommerce-products'): Promise<CloudinaryImage> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are not configured.');
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      const isHero = folder === 'topthreadz-hero';
      // Normalize incoming originals once. Product imagery uses the site-wide 3:4
      // frame and hero banners use 16:9; `limit` never upscales smaller originals.
      const transformation = isHero
        ? [{ width: 1920, height: 1080, crop: 'limit' }]
        : [{ width: 1600, height: 2133, crop: 'limit' }];
      const stream = cloudinary.uploader.upload_stream({
        folder,
        resource_type: 'image',
        transformation,
        quality: 'auto:good',
        fetch_format: 'auto',
      }, (error, upload) => {
        if (error) reject(error);
        else resolve(upload);
      });
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    logger.error('Failed to upload file to Cloudinary', error);
    throw error;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (error) {
    // Database changes must not be rolled back because a CDN cleanup retry failed.
    logger.error('Failed to delete Cloudinary asset', error);
  }
}
