'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

interface OAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function OAuthCallbackPageClient() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    authService.session().then((result) => {
      const user = result.data.user as OAuthUser;
      setUser(user);
      toast.success('Logged in successfully');
      if (user.role === 'ADMIN') {
        router.replace('/admin');
        return;
      }
      const pendingRedirect = sessionStorage.getItem('postLoginRedirect') || '/checkout';
      sessionStorage.removeItem('postLoginRedirect');
      router.replace(pendingRedirect);
    }).catch(() => {
      toast.error('Could not complete social login');
      router.replace('/login');
    });
  }, [router, setUser]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card p-8 text-center max-w-md w-full">
        <h1 className="font-display text-2xl font-bold">Finishing sign-in</h1>
        <p className="text-surface-500 mt-2">Please wait while we complete your social login...</p>
      </div>
    </div>
  );
}
