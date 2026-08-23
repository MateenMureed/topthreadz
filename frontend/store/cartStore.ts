import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveImageUrl } from '@/lib/images';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  discount: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

const normalizeCartItem = (item: CartItem): CartItem => ({
  ...item,
  image: resolveImageUrl(item.image),
});

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const normalizedItem = normalizeCartItem(item);
        const items = get().items;
        const existing = items.find(
          i => i.productId === normalizedItem.productId && i.size === normalizedItem.size && i.color === normalizedItem.color
        );
        if (existing) {
          set({
            items: items.map(i =>
              i.id === existing.id ? { ...i, quantity: i.quantity + normalizedItem.quantity } : i
            ),
          });
        } else {
          set({ items: [...items, normalizedItem] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter(i => i.id !== id) });
        } else {
          set({ items: get().items.map(i => i.id === id ? { ...i, quantity } : i) });
        }
      },
      clearCart: () => set({ items: [] }),
      setItems: (items) => set({ items: items.map(normalizeCartItem) }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * (1 - i.discount / 100) * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage', partialize: (state) => ({ items: state.items }) }
  )
);
