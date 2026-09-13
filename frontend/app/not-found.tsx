import Link from 'next/link';
import type { Metadata } from 'next';
import { noindexMetadata } from '@/lib/seo';
import { FiHome, FiShoppingBag, FiSearch, FiArrowRight } from 'react-icons/fi';

export const metadata: Metadata = noindexMetadata('Page Not Found | Top Threadz');

const TOP_CATEGORIES = [
  { name: 'Unstitched Fabric', href: '/products?category=Unstitched' },
  { name: 'Stitched Suits', href: '/products?category=Stitched' },
  { name: 'Two Piece Sets', href: '/products?category=Two+Piece' },
  { name: 'Kurta Collection', href: '/products?category=Kurta' },
  { name: 'Boys & Kids', href: '/products?category=Kids' },
];

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[#fafafa] px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full text-center space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-surface-200 shadow-soft">
        <div className="space-y-3">
          <span className="text-6xl sm:text-7xl font-display font-black text-surface-900 tracking-tight">
            404
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-surface-600 max-w-md mx-auto leading-relaxed">
            The page you are looking for may have been moved, renamed, or is temporarily unavailable. Explore our top menswear collections below.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-950 text-white text-xs font-bold hover:bg-surface-800 transition-colors shadow-sm"
          >
            <FiHome className="w-4 h-4" /> Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-100 text-surface-800 border border-surface-200 text-xs font-bold hover:bg-surface-200 transition-colors"
          >
            <FiShoppingBag className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>

        {/* Popular Categories */}
        <div className="pt-6 border-t border-surface-100 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-surface-400">
            Popular Categories
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TOP_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="px-3.5 py-1.5 rounded-full bg-surface-50 hover:bg-[#D4A84B]/10 hover:border-[#D4A84B]/40 border border-surface-200 text-xs text-surface-700 font-medium transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Customer Support shortcut */}
        <div className="pt-4 text-xs text-surface-500 flex items-center justify-center gap-1">
          <span>Need assistance?</span>
          <Link href="/faq" className="font-bold text-surface-900 hover:text-[#B88728] underline underline-offset-4">
            Visit FAQ &amp; Support
          </Link>
        </div>
      </div>
    </div>
  );
}
