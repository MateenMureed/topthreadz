'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiHeart, FiLogIn, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { useHydration } from '@/hooks/useHydration';

export default function MobileNav() {
  const pathname = usePathname();
  const hydrated = useHydration();
  const { openCart, getItemCount } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const count = hydrated ? getItemCount() : 0;
  const isAuthed = hydrated && isAuthenticated;

  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-4 max-w-md mx-auto z-[90] bg-white/95 backdrop-blur-xl border border-surface-300/80 shadow-[0_10px_35px_rgba(0,0,0,0.15)] rounded-full px-2 py-1 pb-[calc(4px+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between h-12">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all ${
            pathname === '/' ? 'text-surface-950 font-bold' : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <FiHome className={`w-4 h-4 ${pathname === '/' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[9px] font-medium tracking-tight mt-0.5">Home</span>
        </Link>

        {/* 2. Shop / Catalog */}
        <Link
          href="/products"
          className={`flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all ${
            pathname.startsWith('/products') ? 'text-surface-950 font-bold' : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <FiSearch className={`w-4 h-4 ${pathname.startsWith('/products') ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[9px] font-medium tracking-tight mt-0.5">Shop</span>
        </Link>

        {/* 3. Wishlist / FAQ */}
        <Link
          href="/faq"
          className={`flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all ${
            pathname === '/faq' ? 'text-surface-950 font-bold' : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          <FiHeart className={`w-4 h-4 ${pathname === '/faq' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[9px] font-medium tracking-tight mt-0.5">FAQs</span>
        </Link>

        {/* 4. Cart */}
        <button
          onClick={openCart}
          className="relative flex-1 flex flex-col items-center justify-center h-full rounded-full text-surface-500 hover:text-surface-800 transition-all"
        >
          <div className="relative">
            <FiShoppingBag className="w-4 h-4 stroke-2" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 bg-surface-950 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium tracking-tight mt-0.5">Cart</span>
        </button>

        {/* 5. Account / Login */}
        {isAuthed ? (
          <Link
            href={user?.role === 'ADMIN' ? '/admin' : '/orders'}
            className={`flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all ${
              pathname.includes('/orders') || pathname.includes('/admin') ? 'text-surface-950 font-bold' : 'text-surface-500 hover:text-surface-800'
            }`}
          >
            <FiUser className={`w-4 h-4 ${pathname.includes('/orders') || pathname.includes('/admin') ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Account</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex-1 flex flex-col items-center justify-center h-full rounded-full text-surface-500 hover:text-surface-800 transition-all"
            aria-label="Login"
          >
            <FiLogIn className="w-4 h-4 stroke-2" />
            <span className="text-[9px] font-medium tracking-tight mt-0.5">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
