'use client';

import { FiX, FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { isBackendUploadUrl, resolveImageUrl } from '@/lib/images';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const tax = Math.round(subtotal * 0.17);
  const priceInclTax = Math.round(subtotal + tax);
  const total = priceInclTax;
  const count = getItemCount();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[65] bg-black/35 backdrop-blur-[2px] cursor-pointer" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full sm:max-w-[380px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.2)] animate-slide-in-right flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <h2 className="font-display text-lg font-semibold uppercase tracking-tight">Your Bag ({count})</h2>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
            id="close-cart"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <FiShoppingBag className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-surface-400 mt-1">Start shopping to add items</p>
            </div>
          ) : (
            items.map(item => {
              const effectivePrice = item.price * (1 - item.discount / 100);
              const oldPrice = Math.round(item.price);
              const finalPrice = Math.round(effectivePrice);
              const itemImage = resolveImageUrl(item.image);
              return (
                <div key={item.id} className="grid grid-cols-[72px_1fr_auto] gap-2.5 items-start border-b border-surface-200 pb-3 last:border-b-0">
                  <div className="w-[72px] h-[92px] bg-surface-100 rounded-lg overflow-hidden flex-shrink-0 border border-surface-200">
                    {itemImage ? (
                      <Image src={itemImage} alt={item.name} width={72} height={92} unoptimized={isBackendUploadUrl(itemImage)} sizes="72px" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-surface-400">img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] leading-tight font-semibold line-clamp-2">{item.name}</h3>
                    {(item.size || item.color) && (
                      <div className="mt-1 text-[11px] text-surface-700">
                        {item.size ? <p>Size <span className="font-semibold ml-2">{item.size}</span></p> : null}
                        {item.color ? <p>Color <span className="font-semibold ml-2">{item.color}</span></p> : null}
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center gap-2 text-sm">
                      {item.discount > 0 ? <span className="line-through text-surface-500">PKR {oldPrice.toLocaleString()}</span> : null}
                      <span className="font-bold text-black">PKR {finalPrice.toLocaleString()}</span>
                    </div>

                    <p className="mt-1 text-[#22994a] text-xs">In Stock</p>

                    <div className="mt-2 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-surface-600">Product Details</p>
                      <div className="mt-1 grid grid-cols-1 gap-y-0.5">
                        <p className="text-[10px] text-surface-700 line-clamp-1">
                          <span className="font-semibold">Color:</span> {item.color || 'As selected'}
                        </p>
                        <p className="text-[10px] text-surface-700 line-clamp-1">
                          <span className="font-semibold">Size:</span> {item.size || 'Standard'}
                        </p>
                        <p className="text-[10px] text-surface-700 line-clamp-1">
                          <span className="font-semibold">Category:</span> Unstitched
                        </p>
                        <p className="text-[10px] text-surface-700 line-clamp-1">
                          <span className="font-semibold">Finish:</span> Premium
                        </p>
                      </div>
                    </div>

                    <div className="mt-1.5">
                      <div className="qty-chip">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span>{item.quantity}</span>
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
                    className="p-1.5 rounded-md hover:bg-surface-100 text-surface-700"
                    aria-label="Remove item"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-3 space-y-3 border-t border-surface-200 bg-white">
            <div className="sidebar-line-card">
              <p className="font-display text-lg font-semibold uppercase">Order Summary</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Price Incl. Tax</span><span className="font-semibold">PKR {priceInclTax.toLocaleString()}</span></div>
                <div className="border-t border-surface-200 pt-2 flex justify-between"><span>Total</span><span className="font-semibold">PKR {total.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeCart}
                className="text-center rounded-xl border-2 border-surface-700 py-2.5 text-sm font-semibold"
              >
                View Bag
              </button>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="bag-pill-btn !py-2.5 !text-xs"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
