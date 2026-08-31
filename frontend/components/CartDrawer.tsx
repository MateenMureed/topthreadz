'use client';

import { FiX, FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { isBackendUploadUrl, resolveImageUrl } from '@/lib/images';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const total = subtotal;
  const count = getItemCount();

  if (!isOpen) return null;

  const mobileSheetHeightClass = items.length === 0
    ? 'h-auto max-h-[48vh]'
    : items.length === 1
    ? 'h-auto max-h-[64vh]'
    : items.length === 2
    ? 'h-auto max-h-[78vh]'
    : 'h-auto max-h-[90vh]';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm cursor-pointer transition-opacity duration-300" onClick={closeCart} />

      {/* Dynamic Bottom Sheet on Mobile, Right Sidebar on Desktop */}
      <div className={`fixed bottom-0 inset-x-0 z-[105] w-full sm:top-0 sm:bottom-0 sm:right-0 sm:left-auto sm:max-w-[420px] sm:h-full sm:max-h-none ${mobileSheetHeightClass} bg-white shadow-[0_-12px_45px_rgba(0,0,0,0.25)] sm:shadow-[0_0_40px_rgba(0,0,0,0.2)] rounded-t-[28px] sm:rounded-none flex flex-col overflow-hidden transition-all duration-300 ease-out`}>
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-surface-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4.5 py-3 border-b border-surface-200 bg-white">
          <div className="flex items-center gap-2">
            <FiShoppingBag className="w-4 h-4 text-surface-950" />
            <h2 className="font-display text-base font-bold uppercase tracking-tight text-surface-900">Your Bag ({count})</h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-full hover:bg-surface-100 transition-colors text-surface-700 active:scale-95"
            id="close-cart"
            aria-label="Close cart"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingBag className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600 font-bold text-sm">Your cart is empty</p>
              <p className="text-xs text-surface-400 mt-1">Start shopping to add items to your bag</p>
            </div>
          ) : (
            items.map(item => {
              const effectivePrice = item.price * (1 - item.discount / 100);
              const oldPrice = Math.round(item.price);
              const finalPrice = Math.round(effectivePrice);
              const itemImage = resolveImageUrl(item.image);
              return (
                <div key={item.id} className="grid grid-cols-[72px_1fr_auto] gap-2.5 items-start border-b border-surface-200 pb-3 last:border-b-0">
                  <div className="w-[72px] h-[92px] bg-surface-100 rounded-xl overflow-hidden flex-shrink-0 border border-surface-200">
                    {itemImage ? (
                      <Image src={itemImage} alt={item.name} width={72} height={92} unoptimized={isBackendUploadUrl(itemImage)} sizes="72px" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-surface-400">img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] leading-tight font-bold text-surface-950 line-clamp-2">{item.name}</h3>
                    {(item.size || item.color) && (
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-surface-600">
                        {item.size ? <span>Size: <strong className="text-surface-900">{item.size}</strong></span> : null}
                        {item.color ? <span>Color: <strong className="text-surface-900">{item.color}</strong></span> : null}
                      </div>
                    )}

                    <div className="mt-1 flex items-center gap-2 text-sm">
                      {item.discount > 0 ? <span className="line-through text-surface-400 text-xs">PKR {oldPrice.toLocaleString()}</span> : null}
                      <span className="font-black text-surface-950">PKR {finalPrice.toLocaleString()}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="qty-chip !h-7">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 text-surface-400 hover:text-red-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Pill Action Bar */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-surface-200 bg-white/95 backdrop-blur-md px-4 py-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">Total Price</p>
                <p className="text-lg sm:text-xl font-black text-surface-950 leading-none mt-0.5">PKR {total.toLocaleString()}</p>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="h-11 sm:h-12 px-6 sm:px-7 rounded-[6px] bg-[#B91C2B] text-white hover:bg-[#8F1620] text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-150 shadow-md active:scale-[0.98] whitespace-nowrap"
              >
                <span>Proceed to Checkout</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
