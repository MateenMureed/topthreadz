import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import fs from 'fs';
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

export async function uploadToCloudinary(filePath: string, folder = 'ecommerce-products'): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are not configured.');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    // Clean up local file after successful Cloudinary upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    logger.error('Failed to upload file to Cloudinary', error);
    throw error;
  }
}
