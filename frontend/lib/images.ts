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
