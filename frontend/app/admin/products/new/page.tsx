'use client';

/**
 * AddProductPage — /admin/products/new
 * Owns the create-product workflow. The full create/edit form lives in the
 * shared ProductFormEditor (single source of truth also used by EditProductPage),
 * which handles form state, validation, image uploads, AI SEO generation,
 * and the create mutation.
 */

import { ProductFormEditor } from '../../components/ProductFormEditor';

export default function AddProductPage() {
  return <ProductFormEditor editingProduct={null} />;
}
