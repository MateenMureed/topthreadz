'use client';

/**
 * PaymentsPage — /admin/payments
 * Safepay payment exceptions and the manual verification queue.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { formatPkr } from '../components/types';
import {
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiCheck,
  FiX,
} from 'react-icons/fi';

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.get('/admin/payments/pending').then(r => r.data),
  });
  const queryClient = useQueryClient();

  const verify = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post(`/admin/payments/${id}/verify`, { approved }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment updated'); },
  });

  if (isLoading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const payments = data?.data?.payments || [];
  const totalPendingAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Payments</h2>
          <p className="text-sm text-surface-500">Review Safepay payment exceptions and manual verification queue.</p>
        </div>
        <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Payment reconciliation export queued.')}>
          <FiDownload className="mr-1 inline" /> Export payments
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
          <FiCreditCard className="mb-3 h-4 w-4 text-surface-500" />
          <p className="text-2xl font-bold text-surface-950">{payments.length}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Pending reviews</p>
        </div>
        <div className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft md:col-span-2">
          <FiDollarSign className="mb-3 h-4 w-4 text-surface-500" />
          <p className="text-2xl font-bold text-surface-950">{formatPkr(totalPendingAmount)}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Pending payment value</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
        <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.9fr] gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-500 lg:grid">
          <span>Order</span>
          <span>Method</span>
          <span>Amount</span>
          <span className="text-right">Decision</span>
        </div>
        {payments.length === 0 ? <div className="p-10 text-center text-sm text-surface-500">No pending payments</div> : null}
        {payments.map((p: any) => (
          <div key={p.id} className="grid grid-cols-1 gap-3 border-b border-surface-100 px-4 py-4 last:border-b-0 lg:grid-cols-[1fr_0.8fr_0.8fr_0.9fr] lg:items-center">
            <div>
              <p className="font-semibold text-surface-950">{p.order?.orderNumber}</p>
              <p className="text-xs text-surface-500">{p.order?.user?.name || 'Customer'}</p>
            </div>
            <span className="badge badge-info w-fit">{p.method}</span>
            <p className="text-sm font-semibold text-surface-950">{formatPkr(p.amount)}</p>
            <div className="flex justify-start gap-2 lg:justify-end">
              <button onClick={() => verify.mutate({ id: p.id, approved: true })} className="btn-accent !rounded-lg !py-2 !px-3 text-xs flex items-center gap-1">
                <FiCheck className="w-3 h-3" /> Approve
              </button>
              <button onClick={() => verify.mutate({ id: p.id, approved: false })} className="btn-secondary !rounded-lg !py-2 !px-3 text-xs flex items-center gap-1">
                <FiX className="w-3 h-3" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
