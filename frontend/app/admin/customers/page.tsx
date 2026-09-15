'use client';

/**
 * CustomersPage — /admin/customers
 * Customer accounts overview: metrics, roles, and account security state.
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiSettings,
  FiAlertTriangle,
  FiCheck,
  FiDownload,
} from 'react-icons/fi';

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  const users = data?.data?.users || [];
  const adminCount = users.filter((u: any) => u.role === 'ADMIN').length;
  const lockedCount = users.filter((u: any) => u.isLocked).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950">Customers</h2>
          <p className="text-sm text-surface-500">View customer accounts, staff roles, and account security state.</p>
        </div>
        <button className="btn-secondary !rounded-lg !px-3 !py-2 text-xs" onClick={() => toast.success('Customer export report queued.')}>
          <FiDownload className="mr-1 inline" /> Export customers
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Customers', value: users.length, icon: FiUsers },
          { label: 'Staff admins', value: adminCount, icon: FiSettings },
          { label: 'Locked', value: lockedCount, icon: FiAlertTriangle },
          { label: 'Active', value: Math.max(users.length - lockedCount, 0), icon: FiCheck },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft">
            <metric.icon className="mb-3 h-4 w-4 text-surface-500" />
            <p className="text-2xl font-bold text-surface-950">{metric.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft">
        <div className="hidden grid-cols-[1.2fr_1fr_0.7fr_0.7fr] gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-500 lg:grid">
          <span>Name</span>
          <span>Contact</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {users.length === 0 ? <div className="p-10 text-center text-sm text-surface-500">No customers found.</div> : null}
        {users.map((u: any) => (
          <div key={u.id} className="grid grid-cols-1 gap-3 border-b border-surface-100 px-4 py-4 last:border-b-0 lg:grid-cols-[1.2fr_1fr_0.7fr_0.7fr] lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-900 text-sm font-bold text-white">
                {String(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-surface-950">{u.name}</p>
                <p className="truncate text-xs text-surface-500">Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="truncate text-sm text-surface-800">{u.email}</p>
              <p className="truncate text-xs text-surface-500">{u.phone || 'No phone'}</p>
            </div>
            <span className={`badge w-fit ${u.role === 'ADMIN' ? 'badge-warn' : 'badge-info'}`}>{u.role}</span>
            <span className={`badge w-fit ${u.isLocked ? 'badge-danger' : 'badge-active'}`}>{u.isLocked ? 'Locked' : 'Active'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
