'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import Breadcrumbs from '@/components/Breadcrumbs';
import CategorySubnav from '@/components/CategorySubnav';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <main className="flex-1 min-w-0">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <CategorySubnav />
      <main className="flex-1 pt-16 lg:pt-[108px] pb-24 lg:pb-0">
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
        {children}
      </main>
      <Footer />
      <MobileNav />
      <WhatsAppButton />
    </>
  );
}
