'use client';

import { useEffect, useState } from 'react';

/**
 * Spam-safe email link. The address is assembled in JS from parts at runtime
 * (scrapers that read raw HTML never see a complete mailto: address), and is
 * only rendered after hydration so the server HTML contains no email text
 * either. Children (icon/label) render as the link content when provided;
 * otherwise the address itself is shown.
 */
export default function ObfuscatedEmail({ className, children }: { className?: string; children?: React.ReactNode }) {
  // Parts never appear together as one string in the shipped JS source.
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(['support', 'topthreadz', 'pk'].join('@').replace('topthreadz@', 'topthreadz.'));
  }, []);

  if (!email) {
    // Pre-hydration / non-JS: render a contact link without the address text.
    return (
      <a href="/faq" className={className} aria-label="Contact support">
        {children || 'Contact Support'}
      </a>
    );
  }

  return (
    <a href={`mailto:${email}`} className={className} aria-label={`Email ${email}`}>
      {children || email}
    </a>
  );
}
