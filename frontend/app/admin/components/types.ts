export type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'payments' | 'settings';

export type SettingsSection =
  | 'all'
  | 'store'
  | 'shipping'
  | 'appearance'
  | 'banner'
  | 'branding'
  | 'categories'
  | 'accounts'
  | 'policies';

export type OrderStatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';

export const ORDER_STATUS_OPTIONS: Array<{ value: Exclude<OrderStatusFilter, 'ALL'>; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Confirmed (Paid)' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export interface ProductFormState {
  category: string;
  name: string;
  description: string;
  subcategory: string;
  brand: string;
  slug: string;
  price: string;
  sku: string;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';
  lowStockThreshold: string;
  discount: string;
  stock: string;
  sizesText: string;
  colorsText: string;
  tagsText: string;
  collection: string;
  careInstructions: string;
  featured: boolean;
  trending: boolean;
  productStatus: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  images: string[];
  // AI SEO fields
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  shortDescription: string;
  highlightsText: string;
  faqsJson: string;
  aiGenerated: boolean;
  seoScore: number | null;
  seoSuggestions: string[];
}

export const emptyProductForm: ProductFormState = {
  category: 'Unstitched',
  name: '',
  description: '',
  subcategory: 'Traditional',
  brand: 'Top Threadz',
  slug: '',
  price: '',
  sku: '',
  stockStatus: 'IN_STOCK',
  lowStockThreshold: '5',
  discount: '0',
  stock: '0',
  sizesText: '',
  colorsText: '',
  tagsText: '',
  collection: '',
  careInstructions: '',
  featured: false,
  trending: false,
  productStatus: 'DRAFT',
  images: [],
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  shortDescription: '',
  highlightsText: '',
  faqsJson: '',
  aiGenerated: false,
  seoScore: null,
  seoSuggestions: [],
};

export const BRAND_OPTIONS = ['Top Threadz'];
export const CATEGORY_OPTIONS = ['Unstitched', 'Stitched', 'Two Piece', 'Three Piece'];
export const COLLECTION_OPTIONS = ['All Season', 'Summer Collection', 'Winter Collection'];

export const COLOR_PRESET_OPTIONS = [
  'Black',
  'White',
  'Off White',
  'Navy Blue',
  'Royal Blue',
  'Sky Blue',
  'Grey',
  'Charcoal',
  'Brown',
  'Olive',
  'Beige',
  'Maroon',
  'Bottle Green',
  'Cream',
];

export const LETTER_SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];
export const KIDS_SIZE_OPTIONS = ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', '12-13Y', '13-14Y'];
export const STITCHED_SIZE_OPTIONS = LETTER_SIZE_OPTIONS;
export const TWO_PIECE_SIZE_OPTIONS = LETTER_SIZE_OPTIONS;
export const THREE_PIECE_SIZE_OPTIONS = LETTER_SIZE_OPTIONS;
export const UNSTITCHED_SIZE_OPTIONS = ['Standard'];

export function categorySizeOptions(category: string): string[] {
  if (/unstitched/i.test(category)) return UNSTITCHED_SIZE_OPTIONS;
  if (/two\s*piece|2\s*piece/i.test(category)) return TWO_PIECE_SIZE_OPTIONS;
  if (/three\s*piece|3\s*piece/i.test(category)) return THREE_PIECE_SIZE_OPTIONS;
  if (/kid|child|boy/i.test(category)) return KIDS_SIZE_OPTIONS;
  return STITCHED_SIZE_OPTIONS;
}

export interface ImageMeta {
  url: string;
  publicId?: string;
  alt: string;
  isPrimary: boolean;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(url: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${BACKEND_BASE_URL}${url}`;
  return `${BACKEND_BASE_URL}/${url}`;
}

export async function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<File> {
  if (file.size < 350 * 1024) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export function formatPkr(value?: number) {
  return `PKR ${(value || 0).toLocaleString()}`;
}

export function splitCsv(text: string) {
  return text.split(',').map((v) => v.trim()).filter(Boolean);
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function statusBadgeClass(status?: string) {
  if (status === 'DELIVERED') return 'badge-active';
  if (status === 'PAID') return 'bg-[#E2E8F4] text-[#0F1F3D] text-[12px] px-2.5 py-0.5 rounded-full font-medium';
  if (status === 'SHIPPED') return 'bg-[#FEF3C7] text-[#92400E] text-[12px] px-2.5 py-0.5 rounded-full font-medium';
  if (status === 'CANCELLED') return 'badge-danger';
  return 'badge-draft';
}

export const productStatusBadgeClass = (status?: string) => {
  if (status === 'PUBLISHED') return 'badge-active';
  if (status === 'HIDDEN') return 'badge-danger';
  return 'badge-draft';
};

export const paymentStatusBadgeClass = (status?: string) => {
  if (status === 'VERIFIED') return 'badge-active';
  if (status === 'FAILED') return 'badge-danger';
  return 'bg-[#FEF3C7] text-[#92400E] text-[12px] px-2.5 py-0.5 rounded-full font-medium';
};
