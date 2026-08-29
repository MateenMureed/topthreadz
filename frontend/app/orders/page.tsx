'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { orderService } from '@/services/order.service';
import { useHydration } from '@/hooks/useHydration';
import toast from 'react-hot-toast';
import { FiClock, FiRefreshCw, FiTruck, FiRotateCcw, FiDollarSign, FiSearch } from 'react-icons/fi';

type ReturnTypeOption = 'RETURN' | 'EXCHANGE';

function statusTone(status?: string) {
  const value = String(status || '').toUpperCase();
  if (value === 'DELIVERED') return 'bg-emerald-100 text-emerald-700';
  if (value === 'SHIPPED') return 'bg-blue-100 text-blue-700';
  if (value === 'PAID') return 'bg-cyan-100 text-cyan-700';
  if (value === 'CANCELLED') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function formatPkr(value?: number) {
  return `PKR ${Math.round(value || 0).toLocaleString()}`;
}

function OrdersContent() {
  const hydrated = useHydration();
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [returnType, setReturnType] = useState<ReturnTypeOption>('RETURN');
  const [returnReason, setReturnReason] = useState('');
  const [partialRefundAmount, setPartialRefundAmount] = useState('');
  const [selectedOrderItemId, setSelectedOrderItemId] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'my-list'],
    queryFn: () => orderService.getAll(1, 20),
    enabled: isAuthenticated,
  });

  const orders = useMemo(() => ordersData?.data?.orders || [], [ordersData]);

  const selectedOrder = useMemo(
    () => orders.find((order: any) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const { data: liveTrackingData, isFetching: isLiveTrackingFetching } = useQuery({
    queryKey: ['orders', 'tracking-live', selectedOrderId],
    queryFn: () => orderService.getTrackingByOrderId(selectedOrderId as string),
    enabled: isAuthenticated && Boolean(selectedOrderId),
    refetchInterval: 15000,
  });

  const searchParams = useSearchParams();
  const trackingParam = searchParams.get('tracking') || searchParams.get('orderNumber') || '';

  const { data: searchedTrackingData, isFetching: isTrackingSearchFetching, refetch: refetchTrackingByOrderNumber } = useQuery({
    queryKey: ['orders', 'tracking-by-number', trackingOrderNumber],
    queryFn: () => orderService.getTrackingByOrderNumber(trackingOrderNumber),
    enabled: Boolean(trackingOrderNumber),
  });

  useEffect(() => {
    if (trackingParam && trackingParam.trim()) {
      const clean = trackingParam.trim();
      setTrackingOrderNumber(clean);
    }
  }, [trackingParam]);

  const activeTracking = liveTrackingData?.data || searchedTrackingData?.data || selectedOrder;

  const handleSubmitReturn = async () => {
    if (!selectedOrder?.id) {
      toast.error('Select an order first');
      return;
    }

    if (!returnReason.trim()) {
      toast.error('Please provide a return/exchange reason');
      return;
    }

    try {
      setSubmittingReturn(true);
      await orderService.createReturnRequest(selectedOrder.id, {
        type: returnType,
        reason: returnReason.trim(),
        orderItemId: selectedOrderItemId || undefined,
        refundAmount: partialRefundAmount ? Number(partialRefundAmount) : undefined,
      });
      toast.success(returnType === 'EXCHANGE' ? 'Exchange request submitted' : 'Return request submitted');
      setReturnReason('');
      setPartialRefundAmount('');
      setSelectedOrderItemId('');
      await queryClient.invalidateQueries({ queryKey: ['orders', 'tracking-live', selectedOrder.id] });
      await queryClient.invalidateQueries({ queryKey: ['orders', 'my-list'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto bg-surface-200 rounded-full animate-pulse" />
        <div className="h-4 w-64 mx-auto bg-surface-100 rounded-full animate-pulse mt-4" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Login Required</h1>
        <p className="text-surface-500 mb-6">Please login to view and track your orders.</p>
        <button type="button" onClick={() => openModal('login', '/orders')} className="btn-primary">Login</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold">Order & Delivery Center</h1>
        <button
          type="button"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['orders', 'my-list'] });
            if (selectedOrderId) {
              queryClient.invalidateQueries({ queryKey: ['orders', 'tracking-live', selectedOrderId] });
            }
          }}
          className="btn-secondary !py-2 !px-3 text-sm inline-flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4" /> Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-4">
          <div className="card p-4">
            <p className="font-semibold mb-3">Track by Order Number</p>
            <div className="flex gap-2">
              <input
                className="input-field"
                placeholder="e.g. ORD-ABC123"
                value={trackingOrderNumber}
                onChange={(e) => setTrackingOrderNumber(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary !py-2 !px-3"
                disabled={!trackingOrderNumber.trim() || isTrackingSearchFetching}
                onClick={async () => {
                  try {
                    await refetchTrackingByOrderNumber();
                    toast.success('Tracking loaded');
                  } catch {
                    toast.error('Order tracking not found');
                  }
                }}
              >
                <FiSearch className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="card p-4">
            <p className="font-semibold mb-3">My Orders</p>
            {ordersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-16 rounded-xl skeleton" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-surface-500">No orders yet.</p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                {orders.map((order: any) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      selectedOrderId === order.id ? 'border-brand-300 bg-brand-50' : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-surface-800 line-clamp-1">{order.orderNumber}</p>
                      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusTone(order.status)}`}>{order.status}</span>
                    </div>
                    <p className="text-xs text-surface-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="text-sm font-semibold mt-1">{formatPkr(order.total)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-semibold">Order Tracking Timeline</p>
              {isLiveTrackingFetching && selectedOrderId ? (
                <span className="text-xs text-brand-700 inline-flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5" /> Live updating
                </span>
              ) : null}
            </div>

            {!activeTracking ? (
              <p className="text-sm text-surface-500">Select an order or search by order number to view timeline.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-surface-200 p-3 bg-surface-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-surface-800">{activeTracking.orderNumber}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusTone(activeTracking.status)}`}>{activeTracking.status}</span>
                  </div>
                  <p className="text-sm text-surface-600 mt-1">Total: {formatPkr(activeTracking.total)}</p>
                </div>

                {activeTracking.slotBooking?.slot ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm font-semibold text-blue-800 inline-flex items-center gap-2"><FiTruck className="w-4 h-4" /> Delivery Slot (Advanced)</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {new Date(activeTracking.slotBooking.date).toLocaleDateString()} • {activeTracking.slotBooking.slot.label} ({activeTracking.slotBooking.slot.startHour}:00-{activeTracking.slotBooking.slot.endHour}:00)
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {(activeTracking.timeline || []).map((entry: any, idx: number) => (
                    <div key={entry.id || idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-brand-500 mt-1" />
                        {idx < (activeTracking.timeline || []).length - 1 ? <div className="w-[2px] flex-1 bg-surface-200 mt-1" /> : null}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-semibold text-surface-800">{entry.title || entry.status}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{entry.description || 'Status update received.'}</p>
                        <p className="text-xs text-surface-400 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-4">
            <p className="font-semibold mb-3 inline-flex items-center gap-2"><FiRotateCcw className="w-4 h-4" /> Return / Exchange Request</p>
            {!selectedOrder ? (
              <p className="text-sm text-surface-500">Select an order from the left to request return or exchange.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select className="input-field" value={returnType} onChange={(e) => setReturnType(e.target.value as ReturnTypeOption)}>
                    <option value="RETURN">Return</option>
                    <option value="EXCHANGE">Exchange</option>
                  </select>

                  <select className="input-field" value={selectedOrderItemId} onChange={(e) => setSelectedOrderItemId(e.target.value)}>
                    <option value="">Entire order</option>
                    {(selectedOrder.items || []).map((item: any) => (
                      <option key={item.id} value={item.id}>{item.product?.name || 'Order item'}</option>
                    ))}
                  </select>

                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Partial refund amount"
                    value={partialRefundAmount}
                    onChange={(e) => setPartialRefundAmount(e.target.value)}
                  />
                </div>

                <textarea
                  className="input-field min-h-24"
                  placeholder="Reason for return/exchange"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />

                <button type="button" className="btn-primary !py-2 !px-4 inline-flex items-center gap-2" onClick={handleSubmitReturn} disabled={submittingReturn}>
                  <FiDollarSign className="w-4 h-4" />
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="h-8 w-48 mx-auto bg-surface-200 rounded-full animate-pulse" />
        <div className="h-4 w-64 mx-auto bg-surface-100 rounded-full animate-pulse mt-4" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
