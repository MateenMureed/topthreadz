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
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, upload) => {
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
