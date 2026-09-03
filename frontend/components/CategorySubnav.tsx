'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiChevronDown } from 'react-icons/fi';

interface CategorySubnavProps {
  categories?: any[];
}

export default function CategorySubnav({ categories = [] }: CategorySubnavProps) {
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  return (
    <nav
      aria-label="Categories"
      className="w-full bg-[#FAFAF8] border-b border-surface-200"
    >
      {/* Mobile Hamburger Subheader Bar */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileCategoriesOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-surface-800 bg-[#FAFAF8] active:bg-surface-100 transition-colors"
          aria-expanded={mobileCategoriesOpen}
        >
          <span className="inline-flex items-center gap-2">
            <FiMenu className="w-4 h-4 text-[#0F1F3D]" />
            <span className="text-[#0F1F3D]">Browse Categories</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-surface-700">
            <span>{categories.length + 2} items</span>
            <FiChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                mobileCategoriesOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>

        {mobileCategoriesOpen && (
          <div className="px-4 py-3 border-t border-surface-200/80 bg-white grid grid-cols-2 gap-x-4 gap-y-2.5 animate-fadeIn">
            <Link
              href="/products"
              onClick={() => setMobileCategoriesOpen(false)}
              className="group relative py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors"
            >
              <span className="block truncate">All Products</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#0F1F3D] group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/products?sortBy=newest"
              onClick={() => setMobileCategoriesOpen(false)}
              className="group relative py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors"
            >
              <span className="block truncate">New Arrivals</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#0F1F3D] group-hover:w-full transition-all duration-300" />
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat.id || cat.slug || cat.name}
                href={`/products/category/${encodeURIComponent(cat.slug || cat.name)}`}
                onClick={() => setMobileCategoriesOpen(false)}
                className="group relative py-1.5 text-xs font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors"
              >
                <span className="block truncate">{cat.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#0F1F3D] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Horizontal Subheader with Underline Hover */}
      <div className="hidden sm:flex max-w-7xl mx-auto items-center justify-center gap-1 md:gap-3 px-4 py-1 overflow-x-auto scrollbar-none">
        <Link
          href="/products"
          className="group relative py-2.5 px-3 text-xs md:text-[13px] font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors whitespace-nowrap"
        >
          <span>All Products</span>
          <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-[#0F1F3D] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
        </Link>
        <Link
          href="/products?sortBy=newest"
          className="group relative py-2.5 px-3 text-xs md:text-[13px] font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors whitespace-nowrap"
        >
          <span>New Arrivals</span>
          <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-[#0F1F3D] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
        </Link>
        {categories.map((cat: any) => (
          <Link
            key={cat.id || cat.slug || cat.name}
            href={`/products/category/${encodeURIComponent(cat.slug || cat.name)}`}
            className="group relative py-2.5 px-3 text-xs md:text-[13px] font-semibold uppercase tracking-wider text-surface-700 hover:text-surface-950 transition-colors whitespace-nowrap"
          >
            <span>{cat.name}</span>
            <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-[#0F1F3D] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
