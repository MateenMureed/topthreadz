import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center px-4">Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}
