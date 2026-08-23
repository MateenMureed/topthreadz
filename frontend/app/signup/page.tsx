import { Suspense } from 'react';
import SignupPageClient from './SignupPageClient';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center px-4">Loading...</div>}>
      <SignupPageClient />
    </Suspense>
  );
}
