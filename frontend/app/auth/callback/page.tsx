import { Suspense } from 'react';
import OAuthCallbackPageClient from './OAuthCallbackPageClient';

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Loading...</div>}>
      <OAuthCallbackPageClient />
    </Suspense>
  );
}
