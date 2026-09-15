'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiShoppingCart,
  FiClock,
  FiCheck,
  FiTruck,
  FiTrash2,
  FiDownload,
  FiX,
  FiSearch,
  FiSettings,
  FiSliders,
  FiArrowUp,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
} from 'react-icons/fi';
import {
  ORDER_STATUS_OPTIONS,
  formatPkr,
  statusBadgeClass,
  paymentStatusBadgeClass,
  resolveImageUrl,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from '../components/types';

type SortDir = 'asc' | 'desc';

function initialStatusFromParams(view: string | null): OrderStatusFilter {
  return (view === 'pending' ? 'PENDING' : 'ALL') as OrderStatusFilter;
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>(
    initialStatusFromParams(searchParams.get('view'))
  );

  // Sync when sidebar changes the view (?view=pending / ?view=all)
  useEffect(() => {
    setStatusFilter(initialStatusFromParams(searchParams.get('view')));
  }, [searchParams]);

  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (paymentFilter !== 'ALL') params.set('paymentStatus', paymentFilter);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [statusFilter, paymentFilter, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', queryParams],
    queryFn: () => api.get(`/admin/orders${queryParams ? `?${queryParams}` : ''}`).then(r => r.data),
  });
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Order status updated');
    },
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelectedOrder(null);
      toast.success('Order deleted');
    },
  });

  const bulkDeleteOrders = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.delete(`/admin/orders/${id}`))),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelectedIds(new Set());
      toast.success(`${ids.length} order(s) deleted`);
    },
  });

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const rawOrders = data?.data?.orders || [];
  const total = data?.data?.pagination?.total || rawOrders.length;
  const paidCount = rawOrders.filter((order: any) => order.status === 'PAID').length;
  const pendingCount = rawOrders.filter((order: any) => order.status === 'PENDING').length;
  const fulfillableCount = rawOrders.filter((order: any) => ['PAID', 'PENDING'].includes(order.status)).length;

  // Optional server-provided growth vs. previous period, e.g. { total: 12, pending: -4, paid: 8, needsAction: 0 }
  const growth: Record<string, number> = data?.data?.stats?.growth || {};

  const orders = [...rawOrders].sort((a: any, b: any) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? diff : -diff;
  });

  const statusPills: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All Orders' },
    ...ORDER_STATUS_OPTIONS,
  ];

  const metrics = [
    { key: 'total', label: 'Total Orders', value: total, icon: FiShoppingCart, tone: 'bg-[#E8F0FE] text-[#1A73E8]' },
    { key: 'pending', label: 'Pending', value: pendingCount, icon: FiClock, tone: 'bg-[#FEF3C7] text-[#D97706]' },
    { key: 'paid', label: 'Paid', value: paidCount, icon: FiCheck, tone: 'bg-[#DCFCE7] text-[#16A34A]' },
    { key: 'needsAction', label: 'Needs Action', value: fulfillableCount, icon: FiTruck, tone: 'bg-[#FEE2E2] text-[#B91C2B]' },
  ];

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === orders.length ? new Set() : new Set(orders.map((o: any) => o.id))));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Admin Hub
          </div>
          <h2 className="text-2xl font-bold text-surface-950">Orders &amp; Fulfillment</h2>
          <p className="text-sm text-surface-500">Track payment, fulfillment, customer, and delivery status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Order export report queued.')}>
            <FiDownload className="mr-1 inline" /> Export Data
          </button>
          <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast('Order settings coming soon.')}>
            <FiSettings className="mr-1 inline" /> Settings
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => {
          const g = growth[metric.key];
          const isUp = typeof g === 'number' ? g >= 0 : true;
          return (
            <div key={metric.label} className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${metric.tone}`}>
                <metric.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-surface-950">{metric.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{metric.label}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium">
                <span className={`inline-flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  <FiArrowUp className={`h-3 w-3 ${isUp ? '' : 'rotate-180'}`} />
                  {typeof g === 'number' ? `${Math.abs(g)}%` : '0%'}
                </span>
                <span className="text-surface-400">vs. last 7 days</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-surface-300 bg-white p-3 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {statusPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value as OrderStatusFilter)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  statusFilter === pill.value ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatusFilter)}
              className="input-field !w-auto text-xs"
            >
              <option value="ALL">All Statuses</option>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentStatusFilter)}
              className="input-field !w-auto text-xs"
            >
              <option value="ALL">All Payments</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <button
              onClick={resetFilters}
              className="rounded-lg border border-surface-300 bg-white p-2 text-surface-500 hover:bg-surface-100"
              title="Reset filters"
            >
              <FiSliders className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input-field !pl-9"
              placeholder="Search by order #, customer name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="whitespace-nowrap text-xs text-surface-500">{total} order(s)</span>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-surface-300 bg-surface-50 px-4 py-2 text-xs">
          <span className="font-semibold text-surface-700">{selectedIds.size} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds(new Set())} className="text-surface-500 hover:text-surface-700">
              Clear
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${selectedIds.size} selected order(s)? This cannot be undone.`)) {
                  bulkDeleteOrders.mutate(Array.from(selectedIds));
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <FiTrash2 className="h-3.5 w-3.5" /> Delete selected
            </button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-surface-300 bg-white p-12 text-center shadow-soft">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 text-surface-400">
            <FiFileText className="h-6 w-6" />
          </div>
          <p className="font-semibold text-surface-800">No orders found for current filters.</p>
          <p className="mt-1 text-xs text-surface-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
          <div className="hidden grid-cols-[auto_1.1fr_1fr_0.9fr_0.7fr_0.7fr_0.7fr_0.8fr] items-center gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-500 lg:grid">
            <input
              type="checkbox"
              checked={orders.length > 0 && selectedIds.size === orders.length}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-surface-300"
            />
            <span>Order #</span>
            <span>Customer</span>
            <button
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 text-left hover:text-surface-700"
            >
              Date {sortDir === 'desc' ? <FiChevronDown className="h-3 w-3" /> : <FiChevronUp className="h-3 w-3" />}
            </button>
            <span>Total</span>
            <span>Payment</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="grid grid-cols-1 items-start gap-3 border-b border-surface-100 px-4 py-4 last:border-b-0 hover:bg-surface-50/60 transition-colors lg:grid-cols-[auto_1.1fr_1fr_0.9fr_0.7fr_0.7fr_0.7fr_0.8fr] lg:items-center"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(order.id)}
                onChange={() => toggleSelectOne(order.id)}
                className="h-3.5 w-3.5 rounded border-surface-300"
              />
              <div>
                <p className="font-semibold text-surface-950">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-surface-500">{(order.items || []).length} item(s)</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-surface-800">{order.user?.name || 'Customer'}</p>
                <p className="truncate text-xs text-surface-500">{order.user?.email}</p>
              </div>
              <p className="text-xs text-surface-500">{new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-sm font-semibold text-surface-950">{formatPkr(order.total)}</p>
              <span className={`badge w-fit ${paymentStatusBadgeClass(order.payment?.status)}`}>{order.payment?.status || 'UNPAID'}</span>
              <div>
                <span className={`badge w-fit ${statusBadgeClass(order.status)}`}>{order.status}</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-surface-300 bg-white px-2 py-1.5 text-xs"
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setSelectedOrder(order)} className="btn-secondary !rounded-full !px-3 !py-1.5 text-xs">
                  View
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Permanently delete order ${order.orderNumber}? This action cannot be undone.`)) {
                      deleteOrder.mutate(order.id);
                    }
                  }}
                  className="rounded-full border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                  title="Delete Order"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="admin-sheet-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-sheet-panel sm:max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg sm:text-xl font-bold">Order Details • {selectedOrder.orderNumber}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to permanently delete order ${selectedOrder.orderNumber}?`)) {
                      deleteOrder.mutate(selectedOrder.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-surface-100">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="rounded-xl border border-surface-200 p-3">
                <p className="font-semibold mb-2">Customer</p>
                <p>{selectedOrder.user?.name}</p>
                <p className="text-surface-600">{selectedOrder.user?.email}</p>
                <p className="text-surface-600">{selectedOrder.user?.phone || 'No phone'}</p>
              </div>
              <div className="rounded-xl border border-surface-200 p-3">
                <p className="font-semibold mb-2">Shipping Address</p>
                <p>{selectedOrder.address?.fullName || 'N/A'}</p>
                <p className="text-surface-600">{selectedOrder.address?.phone || 'N/A'}</p>
                <p className="text-surface-600">{selectedOrder.address?.address || 'N/A'}</p>
                <p className="text-surface-600">{selectedOrder.address?.city || 'N/A'}, {selectedOrder.address?.province || 'N/A'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-surface-200 p-3 mb-4 text-sm">
              <p className="font-semibold mb-2">Payment</p>
              <p>Method: {selectedOrder.payment?.method || 'Not selected yet'}</p>
              <p>Status: {selectedOrder.payment?.status || 'UNPAID'}</p>
              <p>Total: {formatPkr(selectedOrder.total)}</p>
            </div>

            <div className="rounded-xl border border-surface-200 p-3">
              <p className="font-semibold mb-2">Products in this Order</p>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b border-surface-100 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-md border border-surface-200 bg-white overflow-hidden shrink-0">
                        {item.product?.images?.[0] ? <img src={resolveImageUrl(item.product.images[0])} alt={item.product?.name || 'Product'} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{item.product?.name || 'Product removed'}</p>
                        <p className="text-xs text-surface-500">
                          Qty: {item.quantity}
                          {item.size ? ` • Size: ${item.size}` : ''}
                          {item.color ? ` • Color: ${item.color}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{formatPkr(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}