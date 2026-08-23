'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthModalStore } from '@/store/authModalStore';

export default function AuthRouteHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openModal } = useAuthModalStore();

  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/signup') return;

    const targetView = pathname === '/signup' ? 'signup' : 'login';
    const redirectParam = searchParams.get('redirect') || '/';
    const isSafePath = redirectParam.startsWith('/') && redirectParam !== '/login' && redirectParam !== '/signup';
    const fallbackPath = isSafePath ? redirectParam : '/';

    openModal(targetView, fallbackPath);
    router.replace(fallbackPath);
  }, [openModal, pathname, router, searchParams]);

  return null;
}
