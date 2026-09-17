'use client';

/**
 * PaymentsPage — /admin/payments
 * Safepay payment exceptions and the manual verification queue.
 */

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { formatPkr } from '../components/types';
import {
  FiCreditCard,
  FiDownload,
  FiCheck,
  FiX,
  FiArrowRight,
  FiShoppingCart,
  FiLayers,
  FiShield,
  FiFileText,
  FiSearch,
} from 'react-icons/fi';

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.get('/admin/payments/pending').then(r => r.data),
  });
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const verify = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post(`/admin/payments/${id}/verify`, { approved }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment updated'); },
  });

  if (isLoading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const payments = data?.data?.payments || [];
  const totalPendingAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === payments.length) return new Set();
      return new Set(payments.map((p: any) => p.id));
    });
  };

  const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-4">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="admin-title-badge" style={{ background: 'var(--admin-gold-soft)', color: '#B7841E' }}>
            <FiCreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-950 dark:text-white">Payment Verifications</h2>
            <p className="text-sm text-surface-500">Review Safepay payment exceptions and manual verification queue.</p>
          </div>
        </div>
        <button
          className="apple-btn-secondary !rounded-lg !px-4 !py-2 text-xs font-semibold"
          onClick={() => toast.success('Payment reconciliation export queued.')}
        >
          <FiDownload className="mr-1.5 inline h-3.5 w-3.5" /> Export Payments
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className="admin-stat-card"
          style={{ ['--stat-accent' as any]: '#3B82F6', ['--stat-icon-bg' as any]: 'rgba(59,130,246,0.12)', ['--stat-icon-color' as any]: '#3B82F6' }}
        >
          <div className="admin-stat-icon">
            <FiCreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="admin-stat-label">Pending Reviews</p>
            <p className="admin-stat-value">{payments.length}</p>
            <p className="admin-stat-caption">{payments.length > 0 ? 'Awaiting your action' : 'Nothing to review right now'}</p>
          </div>
          <button className="admin-stat-arrow" onClick={scrollToTable} title="View pending reviews">
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div
          className="admin-stat-card"
          style={{ ['--stat-accent' as any]: '#10B981', ['--stat-icon-bg' as any]: 'rgba(16,185,129,0.14)', ['--stat-icon-color' as any]: '#0F9A6B' }}
        >
          <div className="admin-stat-icon">
            <span className="text-[11px] font-extrabold tracking-tight">PKR</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="admin-stat-label">Pending Payment Value</p>
            <p className="admin-stat-value">{formatPkr(totalPendingAmount)}</p>
            <p className="admin-stat-caption">Total amount under review</p>
          </div>
          <button className="admin-stat-arrow" onClick={scrollToTable} title="View pending value">
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── VERIFICATION QUEUE TABLE ── */}
      <div ref={tableRef} className="apple-card overflow-hidden">
        <div className="hidden grid-cols-[28px_1.3fr_0.9fr_0.9fr_1.1fr] items-center gap-3 border-b border-surface-100 bg-surface-50/60 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-surface-500 dark:border-white/5 dark:bg-white/5 lg:grid">
          <input
            type="checkbox"
            checked={payments.length > 0 && selected.size === payments.length}
            onChange={toggleAll}
            className="h-3.5 w-3.5 rounded border-surface-300"
          />
          <span className="flex items-center gap-1.5"><FiShoppingCart className="admin-table-head-icon h-3.5 w-3.5" /> Order</span>
          <span className="flex items-center gap-1.5"><FiCreditCard className="admin-table-head-icon h-3.5 w-3.5" /> Method</span>
          <span className="flex items-center gap-1.5"><FiLayers className="admin-table-head-icon h-3.5 w-3.5" /> Amount</span>
          <span className="flex items-center justify-end gap-1.5"><FiShield className="admin-table-head-icon h-3.5 w-3.5" /> Decision</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="admin-empty-icon">
              <FiFileText className="h-7 w-7" />
              <span className="badge-dot">
                <FiSearch className="h-3 w-3" />
              </span>
            </div>
            <p className="text-sm font-bold text-surface-950 dark:text-white">No pending payments</p>
            <p className="mt-1 text-xs text-surface-500">All payment verifications are up to date.</p>
          </div>
        ) : null}

        {payments.map((p: any) => (
          <div
            key={p.id}
            className="grid grid-cols-1 items-center gap-3 border-b border-surface-50 px-5 py-4 last:border-b-0 dark:border-white/5 lg:grid-cols-[28px_1.3fr_0.9fr_0.9fr_1.1fr]"
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggleOne(p.id)}
              className="h-3.5 w-3.5 rounded border-surface-300"
            />
            <div>
              <p className="font-semibold text-surface-950 dark:text-white">{p.order?.orderNumber}</p>
              <p className="text-xs text-surface-500">{p.order?.user?.name || 'Customer'}</p>
            </div>
            <span className="badge badge-info w-fit">{p.method}</span>
            <p className="text-sm font-bold text-surface-950 dark:text-white">{formatPkr(p.amount)}</p>
            <div className="flex justify-start gap-2 lg:justify-end">
              <button
                onClick={() => verify.mutate({ id: p.id, approved: true })}
                disabled={verify.isPending}
                className="admin-btn-soft-success"
              >
                <FiCheck className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => verify.mutate({ id: p.id, approved: false })}
                disabled={verify.isPending}
                className="admin-btn-soft-danger"
              >
                <FiX className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}