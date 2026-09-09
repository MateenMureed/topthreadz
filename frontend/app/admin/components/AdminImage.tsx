'use client';

import { useState } from 'react';
import { resolveImageUrl } from './types';

export function AdminImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImageUrl(src);

  if (!resolved || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-100 text-[10px] text-surface-400`}>
        No image
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

export default AdminImage;
