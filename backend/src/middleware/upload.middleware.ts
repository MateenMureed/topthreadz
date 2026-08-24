import multer from 'multer';
import { env } from '../config/env';
import { BadRequestError } from '../utils/errors';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPEG, PNG, and WebP images are allowed') as any, false);
  }
};

export const upload = multer({
  // Serverless filesystems are ephemeral. Keep files in memory only until
  // Cloudinary receives them in the request lifecycle.
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 10,
  },
});
