'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { authService, type SocialAuthProviders } from '@/services/auth.service';

type SocialAuthMode = 'signin' | 'signup';

interface SocialAuthButtonsProps {
  mode: SocialAuthMode;
  redirectTo?: string;
  className?: string;
}

interface SocialButtonConfig {
  provider: keyof SocialAuthProviders;
  label: string;
  badge: string;
  logoSrc: string;
  logoAlt: string;
  logoClassName: string;
  imageWidth: number;
  imageHeight: number;
}

const DEFAULT_REDIRECT = '/checkout';

export default function SocialAuthButtons({ mode, redirectTo = DEFAULT_REDIRECT, className = '' }: SocialAuthButtonsProps) {
  const [providers, setProviders] = useState<SocialAuthProviders | null>(null);

  useEffect(() => {
    let isMounted = true;

    authService
      .getOAuthProviders()
      .then((response) => {
        if (isMounted) {
          setProviders(response.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProviders({ google: false, facebook: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const startSocialAuth = (provider: keyof SocialAuthProviders) => {
    if (!providers?.[provider]) return;

    sessionStorage.setItem('postLoginRedirect', redirectTo);

    const apiBaseRaw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const apiOrigin = apiBaseRaw.replace(/\/api\/?$/, '');
    window.location.href = `${apiOrigin}/api/auth/${provider}`;
  };

  const buttons: SocialButtonConfig[] = [
    {
      provider: 'google',
      label: mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google',
      badge: 'Google',
      logoSrc: '/auth-logos/google.svg',
      logoAlt: 'Google',
      logoClassName: 'border border-[#dadce0] bg-white',
      imageWidth: 18,
      imageHeight: 18,
    },
    {
      provider: 'facebook',
      label: mode === 'signup' ? 'Sign up with Facebook' : 'Continue with Facebook',
      badge: 'Facebook',
      logoSrc: '/auth-logos/facebook.png',
      logoAlt: 'Facebook',
      logoClassName: 'bg-[#1877f2]',
      imageWidth: 18,
      imageHeight: 18,
    },
  ];

  if (providers === null) {
    return (
      <div className={`space-y-3 ${className}`.trim()}>
        <div className="h-12 animate-pulse rounded-xl bg-surface-200" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-200" />
      </div>
    );
  }

  const availableButtons = buttons.filter((button) => providers[button.provider]);

  if (!availableButtons.length) {
    const message =
      mode === 'signup'
        ? 'Google and Facebook signup will appear here after OAuth keys are configured on the backend.'
        : 'Google and Facebook sign-in will appear here after OAuth keys are configured on the backend.';

    return <p className={`text-center text-xs text-surface-500 ${className}`.trim()}>{message}</p>;
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {availableButtons.map((button) => (
        <button
          key={button.provider}
          type="button"
          onClick={() => startSocialAuth(button.provider)}
          className="flex w-full items-center gap-3 rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-left text-sm font-medium text-surface-800 transition hover:border-surface-400 hover:bg-surface-50"
          aria-label={button.label}
        >
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${button.logoClassName}`}>
            <Image src={button.logoSrc} alt={button.logoAlt} width={button.imageWidth} height={button.imageHeight} />
          </span>
          <span className="flex-1">{button.label}</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-surface-500">{button.badge}</span>
        </button>
      ))}
    </div>
  );
}
