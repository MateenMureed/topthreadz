'use client';

/**
 * EditProductPage — /admin/products/[id]/edit
 * Owns the "edit product" workflow: loads the product by id from the
 * public product endpoint, then hands it to the shared ProductFormEditor
 * (same form used by AddProductPage) which manages all form state,
 * validation, image uploads, AI SEO, and the update mutation.
 */

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import { ProductFormEditor } from '../../../components/ProductFormEditor';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const product = data?.data ?? null;

  if (isLoading) {
    return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;
  }

  if (isError || !product) {
    return (
      <div className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-sm text-[#B91C2B]">
        Product could not be loaded. It may have been deleted or the link is invalid.
      </div>
    );
  }

  return <ProductFormEditor editingProduct={product} />;
}
