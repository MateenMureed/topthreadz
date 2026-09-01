'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { orderService } from '@/services/order.service';
import { useHydration } from '@/hooks/useHydration';
import toast from 'react-hot-toast';
import { FiCalendar, FiCheck, FiClock, FiCopy, FiDollarSign, FiMapPin, FiPackage, FiRefreshCw, FiRotateCcw, FiSearch, FiTruck } from 'react-icons/fi';

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

function statusLabel(status?: string) {
  const value = String(status || 'PENDING').toUpperCase();
  if (value === 'PAID') return 'Processing';
  if (value === 'SHIPPED') return 'Shipped';
  if (value === 'DELIVERED') return 'Delivered';
  if (value === 'CANCELLED') return 'Cancelled';
  return 'Order received';
}

function estimatedDate(order: any) {
  const date = order?.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt) : new Date(new Date(order?.createdAt || Date.now()).getTime() + 5 * 86400000);
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

function trackingSteps(status?: string) {
  const current = String(status || 'PENDING').toUpperCase();
  const position = current === 'DELIVERED' ? 3 : current === 'SHIPPED' ? 2 : current === 'PAID' ? 1 : 0;
  return [
    { label: 'Order placed', icon: FiCheck },
    { label: 'Processing', icon: FiPackage },
    { label: 'Shipped', icon: FiTruck },
    { label: 'Delivered', icon: FiMapPin },
  ].map((step, index) => ({ ...step, complete: position > index, current: position === index }));
}

function OrdersContent() {
  const hydrated = useHydration();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingReference, setTrackingReference] = useState('');
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

  const publicTracking = useMutation({
    mutationFn: (reference: string) => orderService.getTrackingByReference(reference),
    onError: () => toast.error('No order matches that tracking number or email.'),
  });

  useEffect(() => {
    if (trackingParam && trackingParam.trim()) {
      const clean = trackingParam.trim();
      setTrackingReference(clean);
    }
  }, [trackingParam]);

  const activeTracking = liveTrackingData?.data || publicTracking.data?.data || selectedOrder;

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
            <p className="font-semibold mb-1">Track your order</p>
            <p className="mb-3 text-xs text-surface-500">Enter your tracking number or the email used at checkout.</p>
            <div className="space-y-3">
              <input
                className="h-12 w-full rounded-xl border border-surface-300 bg-white px-4 text-sm text-surface-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                placeholder="Tracking number or checkout email"
                value={trackingReference}
                onChange={(e) => setTrackingReference(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && trackingReference.trim()) publicTracking.mutate(trackingReference.trim());
                }}
              />
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F1F3D] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1A2F5A] focus:outline-none focus:ring-4 focus:ring-[#0F1F3D]/15 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!trackingReference.trim() || publicTracking.isPending}
                onClick={() => publicTracking.mutate(trackingReference.trim())}
              >
                <FiSearch className="w-4 h-4" /> {publicTracking.isPending ? 'Finding order…' : 'Track order'}
              </button>
              {publicTracking.isError && <p className="text-xs text-red-600">No order matches that tracking number or email.</p>}
            </div>
          </div>

          {isAuthenticated && <div className="card p-4">
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
          </div>}
        </div>

        <div className="space-y-4">
          {isAuthenticated && <div className="card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-semibold">Order details</p>
              {isLiveTrackingFetching && selectedOrderId ? (
                <span className="text-xs text-brand-700 inline-flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5" /> Live updating
                </span>
              ) : null}
            </div>

            {!activeTracking ? (
              <p className="text-sm text-surface-500">Select an order or search by order number to view its delivery progress.</p>
            ) : (
              <div className="space-y-4">
                <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Tracking number</p>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(activeTracking.orderNumber).then(() => toast.success('Tracking number copied'))} className="mt-1 inline-flex items-center gap-2 text-left text-xl font-bold text-surface-900 hover:text-brand-700">
                        {activeTracking.orderNumber}<FiCopy className="h-4 w-4" aria-label="Copy tracking number" />
                      </button>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-surface-500"><FiCalendar className="h-3.5 w-3.5" /> Placed {new Date(activeTracking.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusTone(activeTracking.status)}`}>{statusLabel(activeTracking.status)}</span>
                  </div>
                </section>

                {String(activeTracking.status).toUpperCase() !== 'CANCELLED' && <section className="rounded-2xl border border-surface-200 bg-white p-4 sm:p-5"><p className="mb-5 text-sm font-bold text-surface-900">Delivery progress</p><div className="grid grid-cols-4 gap-1">{trackingSteps(activeTracking.status).map((step, index) => { const Icon = step.icon; return <div key={step.label} className="relative text-center">{index < 3 && <div className={`absolute left-1/2 top-4 h-0.5 w-full ${step.complete ? 'bg-brand-600' : 'bg-surface-200'}`} />}<div className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${step.complete || step.current ? 'border-brand-600 bg-brand-600 text-white' : 'border-surface-200 bg-white text-surface-400'}`}><Icon className="h-3.5 w-3.5" /></div><p className={`mt-2 text-[10px] font-semibold sm:text-xs ${step.complete || step.current ? 'text-brand-800' : 'text-surface-400'}`}>{step.label}</p></div>; })}</div></section>}

                <section className="rounded-2xl border border-surface-200 bg-white p-4 sm:p-5"><p className="mb-3 text-sm font-bold text-surface-900">Items in this order</p><div className="divide-y divide-surface-100">{(activeTracking.items || []).map((item: any) => <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">{item.product?.images?.[0] ? <img src={item.product.images[0]} alt={item.product?.name || 'Product'} className="h-20 w-20 shrink-0 rounded-lg border border-surface-200 object-cover" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-400"><FiPackage /></div>}<div className="min-w-0 flex-1"><p className="font-semibold text-surface-900">{item.product?.name || 'Product'}</p><p className="mt-1 text-xs text-surface-500">{[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' · ') || 'Standard variant'}</p><p className="mt-2 text-xs text-surface-500">Qty {item.quantity} × {formatPkr(item.price)}</p></div><p className="shrink-0 pt-1 text-sm font-bold text-surface-900">{formatPkr(item.quantity * item.price)}</p></div>)}</div></section>

                <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-surface-200 bg-white p-4 sm:p-5"><p className="mb-3 text-sm font-bold text-surface-900">Order summary</p><div className="space-y-2 text-sm text-surface-600"><p className="flex justify-between"><span>Subtotal</span><span>{formatPkr(activeTracking.subtotal)}</span></p><p className="flex justify-between"><span>Shipping</span><span>{activeTracking.deliveryCharges ? formatPkr(activeTracking.deliveryCharges) : 'Free'}</span></p>{Number(activeTracking.couponDiscount || 0) + Number(activeTracking.autoDiscount || 0) > 0 && <p className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatPkr(Number(activeTracking.couponDiscount || 0) + Number(activeTracking.autoDiscount || 0))}</span></p>}<p className="flex justify-between"><span>Tax</span><span>{formatPkr(activeTracking.tax)}</span></p><div className="mt-3 flex justify-between border-t border-surface-200 pt-3 text-base font-bold text-surface-950"><span>Total</span><span>{formatPkr(activeTracking.total)}</span></div></div></section><section className="rounded-2xl border border-surface-200 bg-white p-4 sm:p-5"><p className="mb-3 text-sm font-bold text-surface-900">Shipping details</p><p className="text-sm font-medium text-surface-800">{activeTracking.address?.fullName}</p><p className="mt-1 text-sm leading-6 text-surface-600">{activeTracking.address?.address}<br />{activeTracking.address?.city}, {activeTracking.address?.province}<br />{activeTracking.address?.phone}</p><p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700"><FiTruck className="h-3.5 w-3.5" /> Estimated delivery: {estimatedDate(activeTracking)}</p>{activeTracking.slotBooking?.slot && <p className="mt-2 text-xs text-surface-500">Delivery slot: {activeTracking.slotBooking.slot.label}</p>}</section></div>
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
          </div>}

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
