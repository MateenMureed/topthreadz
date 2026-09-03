'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/services/api';

export default function CategorySubnav() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav
      aria-label="Categories"
      className="fixed top-16 left-0 right-0 z-40 w-full bg-white border-b border-surface-200 shadow-sm"
    >
      {/* Single horizontal scrollable row — no extra hamburger, works on all screen sizes */}
      <div className="max-w-7xl mx-auto flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 overflow-x-auto scrollbar-none">
        <Link
          href="/products"
          className={`group relative flex-shrink-0 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs md:text-[13px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
            pathname === '/products'
              ? 'text-surface-950'
              : 'text-surface-700 hover:text-surface-950'
          }`}
        >
          <span>All</span>
          <span
            className={`absolute bottom-1 left-2.5 right-2.5 sm:left-3 sm:right-3 h-[2px] bg-[#0F1F3D] transition-transform duration-300 origin-center ${
              pathname === '/products' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </Link>
        <Link
          href="/products?sortBy=newest"
          className="group relative flex-shrink-0 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs md:text-[13px] font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors whitespace-nowrap"
        >
          <span>New Arrivals</span>
          <span className="absolute bottom-1 left-2.5 right-2.5 sm:left-3 sm:right-3 h-[2px] bg-[#0F1F3D] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
        </Link>
        {categories.map((cat: any) => {
          const href = `/products/category/${encodeURIComponent(cat.slug || cat.name)}`;
          const isActive = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={cat.id || cat.slug || cat.name}
              href={href}
              className={`group relative flex-shrink-0 py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs md:text-[13px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                isActive ? 'text-surface-950' : 'text-surface-700 hover:text-surface-950'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`absolute bottom-1 left-2.5 right-2.5 sm:left-3 sm:right-3 h-[2px] bg-[#0F1F3D] transition-transform duration-300 origin-center ${
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
