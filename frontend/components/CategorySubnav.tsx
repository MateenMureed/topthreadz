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
    // Hidden on mobile – categories live in the hamburger drawer.
    // Visible on desktop (lg+) only.
    <nav
      aria-label="Categories"
      className="fixed top-16 left-0 right-0 z-40 w-full shadow-sm hidden lg:block"
      style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)' }}
    >
      {/* Centered horizontal row */}
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-0.5 px-4 overflow-x-auto scrollbar-none">
        <Link
          href="/products"
          className={`group relative flex-shrink-0 py-2.5 px-3 text-[13px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
            pathname === '/products'
              ? 'text-surface-950 dark:text-[#F1F5F9]'
              : 'text-surface-700 dark:text-[#94A3B8] hover:text-surface-950 dark:hover:text-[#F1F5F9]'
          }`}
        >
          <span>All</span>
          <span
            className={`absolute bottom-1 left-3 right-3 h-[2px] bg-[#0F1F3D] transition-transform duration-300 origin-center ${
              pathname === '/products' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </Link>

        {categories.map((cat: any) => {
          const href = `/products/category/${encodeURIComponent(cat.slug || cat.name)}`;
          const isActive = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={cat.id || cat.slug || cat.name}
              href={href}
              className={`group relative flex-shrink-0 py-2.5 px-3 text-[13px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                isActive ? 'text-surface-950 dark:text-[#F1F5F9]' : 'text-surface-700 dark:text-[#94A3B8] hover:text-surface-950 dark:hover:text-[#F1F5F9]'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`absolute bottom-1 left-3 right-3 h-[2px] bg-[#0F1F3D] transition-transform duration-300 origin-center ${
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
