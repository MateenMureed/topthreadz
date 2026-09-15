'use client';

/**
 * ProductsPage — /admin/products
 * Product catalog management: table view, search, status/category/stock
 * filters, summary metrics, CSV export, row actions, and legacy-data cleanup.
 * Create/Edit live on their own routes:
 *   /admin/products/new         (AddProductPage)
 *   /admin/products/[id]/edit   (EditProductPage)
 *
 * NOTE: this file replaces the return(...) JSX of the original ProductsPage.
 * Keep your existing details drawer/modal JSX (the part that used to sit
 * right after the product list in your original file) — it isn't shown
 * here because it wasn't included in the source I was given, but the
 * `isDetailsOpen` / `detailsProduct` state and the `openDetails()` handler
 * below are unchanged so it will keep working as-is.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { productService } from '@/services/product.service';
import toast from 'react-hot-toast';
import { AdminImage } from '../components/AdminImage';
import { FormattedProductDescription } from '@/components/ProductDetailClient';
import {
  productStatusBadgeClass,
  resolveImageUrl,
  asStringArray,
} from '../components/types';
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiX,
  FiDownload,
  FiSliders,
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiBox,
  FiTag,
} from 'react-icons/fi';

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'HIDDEN'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockView, setStockView] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, error, isError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.get('/products?limit=50').then(r => r.data),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Product deleted');
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete product');
    },
  });

  const cleanupLegacyData = useMutation({
    mutationFn: () => api.post('/admin/maintenance/cleanup-legacy-data').then(r => r.data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      const removed = result?.data?.removed || {};
      const totalRemoved = Object.values(removed).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
      toast.success(`Legacy cleanup complete. Removed ${totalRemoved} stale record(s).`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Legacy cleanup failed');
    },
  });

  const products = useMemo(
    () => (Array.isArray(data?.data?.products) ? data.data.products : []),
    [data]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      const c = p.subcategory || p.category;
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product: any) => {
        const text = `${product.name || ''} ${product.brand || ''} ${product.sku || ''} ${product.subcategory || ''}`.toLowerCase();
        const matchesSearch = !productSearch.trim() || text.includes(productSearch.trim().toLowerCase());
        const matchesStatus = productStatusFilter === 'ALL' || product.productStatus === productStatusFilter;
        const matchesCategory = categoryFilter === 'ALL' || (product.subcategory || product.category) === categoryFilter;
        const lowThreshold = Number(product.lowStockThreshold || 5);
        const matchesStock =
          stockView === 'ALL' ||
          (stockView === 'LOW' && Number(product.stock || 0) > 0 && Number(product.stock || 0) <= lowThreshold) ||
          (stockView === 'OUT' && Number(product.stock || 0) <= 0);
        return matchesSearch && matchesStatus && matchesCategory && matchesStock;
      }),
    [products, productSearch, productStatusFilter, categoryFilter, stockView]
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredProducts, currentPage]
  );

  const publishedCount = products.filter((product: any) => product.productStatus === 'PUBLISHED').length;
  const draftCount = products.filter((product: any) => product.productStatus === 'DRAFT').length;
  const outOfStockCount = products.filter((product: any) => Number(product.stock || 0) <= 0).length;

  const openDetails = (product: any) => {
    setDetailsProduct(product);
    setIsDetailsOpen(true);
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === pagedProducts.length ? [] : pagedProducts.map((p: any) => p.id)
    );
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const exportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }
    const header = ['name', 'sku', 'category', 'price', 'stock', 'status'];
    const rows = filteredProducts.map((p: any) => [
      p.name || '',
      p.sku || '',
      p.subcategory || p.category || '',
      p.price ?? '',
      p.stock ?? '',
      p.productStatus || '',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setProductStatusFilter('ALL');
    setCategoryFilter('ALL');
    setStockView('ALL');
    setPage(1);
  };

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#0F1F3D]"
          >
            ← Products
          </button>
          <h2 className="text-2xl font-black text-[#0F1F3D] dark:text-white">View Products</h2>
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Manage your store products, update inventory, pricing and status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const confirmed = window.confirm("Clean stale cart/search/view data and delete legacy non-unstitched products? Orders, payments, users, and current men's unstitched products will be kept.");
              if (confirmed) cleanupLegacyData.mutate();
            }}
            className="admin-btn-secondary"
            disabled={cleanupLegacyData.isPending}
          >
            {cleanupLegacyData.isPending ? 'Cleaning…' : 'Clean Legacy Data'}
          </button>
          <button onClick={exportCSV} className="admin-btn-secondary flex items-center gap-1.5">
            <FiDownload className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={resetFilters} className="admin-btn-secondary flex items-center gap-1.5">
            <FiSliders className="h-3.5 w-3.5" /> Filters
          </button>
          <button onClick={() => router.push('/admin/products/new')} className="admin-btn-primary flex items-center gap-1.5">
            <FiPlus className="h-3.5 w-3.5" /> Add Product
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm text-[#B91C2B]">
          <p>{(error as any)?.response?.data?.error || 'Products could not be loaded. Please try again.'}</p>
          <button type="button" onClick={() => refetch()} className="admin-btn-secondary" disabled={isFetching}>
            {isFetching ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Products', value: products.length, icon: FiBox, tone: 'bg-[#E0F2FE] text-[#0284C7]' },
          { label: 'Published', value: publishedCount, icon: FiTag, tone: 'bg-[#DCFCE7] text-[#16A34A]' },
          { label: 'Drafts', value: draftCount, icon: FiEdit2, tone: 'bg-[#FEF3C7] text-[#D97706]' },
          { label: 'Out of Stock', value: outOfStockCount, icon: FiX, tone: 'bg-[#FEE2E2] text-[#B91C2B]' },
        ].map((metric) => {
          const pct = products.length ? Math.round((metric.value / products.length) * 100) : 0;
          return (
            <div key={metric.label} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 shadow-xs">
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md ${metric.tone}`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-black text-[#1A1A1A]">{metric.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{metric.label}</p>
              <p className="mt-1 text-xs font-semibold text-[#16A34A]">
                {pct}% <span className="font-normal text-[#9CA3AF]">of catalog</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-4 rounded-[10px] border border-[#E5E7EB] bg-white p-3 shadow-xs">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_180px_180px_44px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              className="admin-input !pl-9"
              placeholder="Search products by name, SKU, or category..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="admin-input"
            value={productStatusFilter}
            onChange={(e) => { setProductStatusFilter(e.target.value as typeof productStatusFilter); setPage(1); }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <select
            className="admin-input"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            title="Cycle stock view (All → Low → Out)"
            onClick={() => setStockView(stockView === 'ALL' ? 'LOW' : stockView === 'LOW' ? 'OUT' : 'ALL')}
            className={`flex items-center justify-center rounded-[8px] border text-sm ${
              stockView !== 'ALL' ? 'border-[#0F1F3D] bg-[#0F1F3D] text-white' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
            }`}
          >
            <FiGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
          <p className="text-sm font-bold text-[#0F1F3D]">{filteredProducts.length} Product(s)</p>
          {selectedIds.length > 0 && (
            <p className="text-xs font-semibold text-[#6B7280]">{selectedIds.length} selected</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={pagedProducts.length > 0 && selectedIds.length === pagedProducts.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#D1D5DB]"
                  />
                </th>
                <th className="px-2 py-3">Product</th>
                <th className="px-2 py-3">SKU</th>
                <th className="px-2 py-3">Category</th>
                <th className="px-2 py-3">Price</th>
                <th className="px-2 py-3">Stock</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-sm text-[#6B7280]">
                    No products match the current filters.
                  </td>
                </tr>
              )}
              {pagedProducts.map((p: any) => {
                const imageUrl = p.images?.[0] ? resolveImageUrl(p.images[0]) : '';
                const stock = Number(p.stock || 0);
                return (
                  <tr key={p.id} className="border-b border-[#F1F1F1] last:border-b-0 hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        className="h-4 w-4 rounded border-[#D1D5DB]"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F3F4F6]">
                          <AdminImage src={imageUrl} alt={p.name || 'Product'} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F1F3D] line-clamp-1">{p.name}</p>
                          <p className="text-xs text-[#9CA3AF] line-clamp-1">
                            {p.brand || 'No brand'}
                            {p.discount > 0 ? ` • -${p.discount}%` : ''}
                          </p>
                          {asStringArray(p.colors).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {asStringArray(p.colors).slice(0, 3).map((color) => (
                                <span key={color} className="rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                                  {color}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-[#6B7280]">{p.sku || 'N/A'}</td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-xs text-[#6B7280]">
                        {p.subcategory || p.category || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm font-semibold text-[#0F1F3D]">PKR {p.price?.toLocaleString()}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          stock <= 0
                            ? 'bg-[#FEE2E2] text-[#B91C2B]'
                            : stock <= Number(p.lowStockThreshold || 5)
                            ? 'bg-[#FFEDD5] text-[#EA580C]'
                            : 'bg-[#DCFCE7] text-[#16A34A]'
                        }`}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className={`badge ${productStatusBadgeClass(p.productStatus)}`}>{p.productStatus || 'DRAFT'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetails(p)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                          <FiEye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                          className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                            className="btn-secondary !py-1.5 !px-2 text-xs"
                          >
                            <FiMoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {openMenuId === p.id && (
                            <>
                              <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 z-10 mt-1 w-36 rounded-[8px] border border-[#E5E7EB] bg-white py-1 shadow-lg">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    const confirmed = window.confirm(`Delete "${p.name}"? This cannot be undone.`);
                                    if (confirmed) deleteProduct.mutate(p.id);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#B91C2B] hover:bg-[#FEF2F2]"
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-4 py-3">
            <p className="text-sm text-[#6B7280]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#6B7280] disabled:opacity-40"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-sm font-semibold ${
                    n === currentPage ? 'bg-[#0F1F3D] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#6B7280] disabled:opacity-40"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Drawer */}
      {isDetailsOpen && detailsProduct && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsDetailsOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
              <h3 className="text-lg font-bold text-[#0F1F3D]">Product Details</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="rounded-full p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {asStringArray(detailsProduct.images).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {asStringArray(detailsProduct.images).slice(0, 3).map((img: string, i: number) => (
                    <div key={i} className="aspect-[3/4] overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F3F4F6]">
                      <AdminImage src={resolveImageUrl(img)} alt={detailsProduct.name || 'Product'} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-[#0F1F3D]">{detailsProduct.name}</h4>
                  <span className={`badge ${productStatusBadgeClass(detailsProduct.productStatus)}`}>
                    {detailsProduct.productStatus || 'DRAFT'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[#6B7280]">
                  {detailsProduct.brand || 'No brand'} • SKU {detailsProduct.sku || 'N/A'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[8px] border border-[#E5E7EB] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Price</p>
                  <p className="mt-1 font-bold text-[#0F1F3D]">PKR {detailsProduct.price?.toLocaleString()}</p>
                </div>
                <div className="rounded-[8px] border border-[#E5E7EB] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Stock</p>
                  <p className="mt-1 font-bold text-[#0F1F3D]">{detailsProduct.stock ?? 0} units</p>
                </div>
                <div className="rounded-[8px] border border-[#E5E7EB] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Category</p>
                  <p className="mt-1 font-medium text-[#0F1F3D]">{detailsProduct.subcategory || detailsProduct.category || '—'}</p>
                </div>
                <div className="rounded-[8px] border border-[#E5E7EB] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Discount</p>
                  <p className="mt-1 font-medium text-[#0F1F3D]">
                    {detailsProduct.discount > 0 ? `${detailsProduct.discount}%` : 'None'}
                  </p>
                </div>
              </div>

              {asStringArray(detailsProduct.colors).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Colors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {asStringArray(detailsProduct.colors).map((color) => (
                      <span key={color} className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#6B7280]">{color}</span>
                    ))}
                  </div>
                </div>
              )}

              {asStringArray(detailsProduct.sizes).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {asStringArray(detailsProduct.sizes).map((size) => (
                      <span key={size} className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#6B7280]">{size}</span>
                    ))}
                  </div>
                </div>
              )}

              {detailsProduct.description && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Description</p>
                  {/* Adjust the prop name below if FormattedProductDescription expects a different one */}
                  <div className="text-sm text-[#374151]">
                    <FormattedProductDescription content={detailsProduct.description} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-[#E5E7EB] bg-white px-5 py-4">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  router.push(`/admin/products/${detailsProduct.id}/edit`);
                }}
                className="admin-btn-primary flex flex-1 items-center justify-center gap-1.5"
              >
                <FiEdit2 className="h-3.5 w-3.5" /> Edit Product
              </button>
              <button onClick={() => setIsDetailsOpen(false)} className="admin-btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}