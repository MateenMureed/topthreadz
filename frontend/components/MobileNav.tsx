'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHeart, FiLogIn, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi';
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

  return (
    <nav className="lg:hidden fixed bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 w-[min(96vw,560px)] z-[90] bg-white/95 backdrop-blur-xl border border-surface-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-full pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[58px] sm:h-[62px] md:h-[66px] px-1.5 sm:px-2 md:px-3 pb-0.5">
        <Link
          href="/products"
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 px-2 sm:px-3 md:px-4 py-1 rounded-full transition-all ${
            pathname.includes('/products') ? 'text-surface-900' : 'text-surface-500'
          }`}
        >
          <FiSearch className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-medium">Search</span>
        </Link>

        <Link
          href="/products?sortBy=recommended"
          className="flex-1 min-w-0 flex flex-col items-center gap-1 px-2 sm:px-3 md:px-4 py-1 rounded-full transition-all text-surface-500"
        >
          <FiHeart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-medium">Favourite</span>
        </Link>

        {/* Cart */}
        <button
          onClick={openCart}
          className="relative flex-1 min-w-0 flex flex-col items-center gap-1 px-2 sm:px-3 md:px-4 py-1 rounded-full text-surface-500 transition-all"
        >
          <FiShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          {count > 0 && (
            <span className="absolute -top-1 right-1.5 sm:right-2 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {count}
            </span>
          )}
          <span className="text-[9px] sm:text-[10px] font-medium">Cart</span>
        </button>

        {/* Account */}
        {isAuthed ? (
          <Link
            href={user?.role === 'ADMIN' ? '/admin' : '/orders'}
            className={`flex-1 min-w-0 flex flex-col items-center gap-1 px-2 sm:px-3 md:px-4 py-1 rounded-full transition-all ${
              pathname.includes('/orders') || pathname.includes('/admin') ? 'text-surface-900' : 'text-surface-500'
            }`}
          >
            <FiUser className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] font-medium">Account</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openModal('login')}
            className="flex-1 min-w-0 flex flex-col items-center gap-1 px-2 sm:px-3 md:px-4 py-1 rounded-full transition-all text-surface-500"
          >
            <FiLogIn className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] font-medium">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
}
