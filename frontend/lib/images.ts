const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:5000/api';

function getApiOrigin() {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function resolveImageUrl(src: string | null | undefined): string {
  const value = String(src || '').trim();
  if (!value) return '';

  const apiOrigin = getApiOrigin();

  if (value.startsWith('/uploads/')) {
    return `${apiOrigin}${value}`;
  }

  if (value.startsWith('uploads/')) {
    return `${apiOrigin}/${value}`;
  }

  try {
    const url = new URL(value);
    if (url.pathname.startsWith('/uploads/') && ['localhost', '127.0.0.1', 'backend'].includes(url.hostname)) {
      return `${apiOrigin}${url.pathname}${url.search}`;
    }
  } catch {
    // Leave valid relative app assets such as /payment-logos/ unchanged below.
  }

  return value;
}

export function isBackendUploadUrl(src: string | null | undefined): boolean {
  const value = String(src || '').trim();
  if (!value) return false;
  if (value.startsWith('/uploads/') || value.startsWith('uploads/')) return true;

  try {
    return new URL(resolveImageUrl(value)).pathname.startsWith('/uploads/');
  } catch {
    return false;
  }
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
}

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/');
}

export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  options: CloudinaryTransformOptions = {}
): string {
  if (!url || typeof url !== 'string') return '';
  if (!isCloudinaryUrl(url)) return url;

  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transforms: string[] = [];
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (width) transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${Math.round(height)}`);
  if (crop && (width || height)) transforms.push(`c_${crop}`);

  const transformSegment = transforms.join(',');
  if (!transformSegment) return url;

  const uploadMarker = '/image/upload/';
  const uploadIndex = url.indexOf(uploadMarker);
  if (uploadIndex === -1) return url;

  const prefix = url.slice(0, uploadIndex + uploadMarker.length);
  let rest = url.slice(uploadIndex + uploadMarker.length);

  // Strip existing transformation segment if present (e.g. f_auto,q_auto/ or w_1920/)
  rest = rest.replace(/^([a-z]_[a-zA-Z0-9_:.-]+,?)+\/?/, '');

  return `${prefix}${transformSegment}/${rest}`;
}

export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!isCloudinaryUrl(src)) {
    return src;
  }
  return getOptimizedCloudinaryUrl(src, {
    width,
    quality: quality || 'auto',
    format: 'auto',
    crop: 'limit',
  });
}
