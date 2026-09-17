'use client';

/**
 * CustomersPage — /admin/customers
 * Customer accounts overview: metrics, roles, and account security state.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiUser,
  FiLock,
  FiShield,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit2,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const STATUS_OPTIONS = ['All Status', 'Active', 'Locked'];
const PAGE_SIZE = 7;

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const users = data?.data?.users || [];
  const adminCount = users.filter((u: any) => u.role === 'ADMIN').length;
  const lockedCount = users.filter((u: any) => u.isLocked).length;
  const activeCount = Math.max(users.length - lockedCount, 0);

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const matchesStatus =
        statusFilter === 'All Status' ||
        (statusFilter === 'Locked' ? u.isLocked : !u.isLocked);
      if (!matchesStatus) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.phone || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, statusFilter]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const allOnPageSelected =
    pageUsers.length > 0 && pageUsers.every((u: any) => selected.has(u.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageUsers.forEach((u: any) => next.delete(u.id));
      } else {
        pageUsers.forEach((u: any) => next.add(u.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const metrics = [
    {
      label: 'Total Customers',
      value: users.length,
      icon: FiUsers,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-500',
      caption: 'All registered accounts',
    },
    {
      label: 'Staff Admins',
      value: adminCount,
      icon: FiUser,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      caption: users.length ? `${Math.round((adminCount / users.length) * 100)}% of total` : 'No accounts yet',
    },
    {
      label: 'Locked Accounts',
      value: lockedCount,
      icon: FiLock,
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-500',
      caption: lockedCount > 0 ? 'Needs review' : 'All clear',
    },
    {
      label: 'Active Accounts',
      value: activeCount,
      icon: FiShield,
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconColor: 'text-violet-500',
      caption: users.length ? `${Math.round((activeCount / users.length) * 100)}% of total` : 'No accounts yet',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-950 dark:text-white">Customer Profiles</h2>
          <p className="text-sm text-surface-500">View and manage customer accounts, staff roles and account security state.</p>
        </div>
        <button
          className="apple-btn-secondary !rounded-lg !px-4 !py-2 text-xs font-semibold"
          onClick={() => toast.success('Customer export report queued.')}
        >
          <FiDownload className="mr-1.5 inline h-3.5 w-3.5" /> Export Customers
        </button>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="apple-card p-4 sm:p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${metric.iconBg}`}>
              <metric.icon className={`h-4.5 w-4.5 ${metric.iconColor}`} />
            </div>
            <p className="apple-stat-number text-2xl font-bold text-surface-950 dark:text-white">{metric.value}</p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-surface-500">{metric.label}</p>
            <p className="mt-2 text-[11px] font-medium text-surface-400">{metric.caption}</p>
          </div>
        ))}
      </div>

      {/* ── CUSTOMERS TABLE CARD ── */}
      <div className="apple-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-surface-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/5 sm:px-5">
          <div>
            <h3 className="text-base font-bold text-surface-950 dark:text-white">Customers ({filteredUsers.length})</h3>
            <p className="text-xs text-surface-500">Manage your customer list, roles and account status.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search customers..."
                className="admin-input !w-full !pl-8 sm:!w-56"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen((v) => !v)}
                className="apple-btn-secondary !h-10 w-full !justify-between gap-2 !px-3 text-xs font-semibold sm:w-36"
              >
                <span className="flex items-center gap-1.5">
                  <FiFilter className="h-3.5 w-3.5" /> {statusFilter}
                </span>
              </button>
              {statusMenuOpen && (
                <div className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-surface-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#1E2228]">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatusFilter(opt);
                        setStatusMenuOpen(false);
                        setPage(1);
                      }}
                      className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-surface-50 dark:hover:bg-white/5 ${
                        statusFilter === opt ? 'text-surface-950 dark:text-white' : 'text-surface-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="hidden min-w-[820px] grid-cols-[28px_1.4fr_1.2fr_0.7fr_0.7fr_0.8fr_0.9fr] items-center gap-3 border-b border-surface-100 bg-surface-50/60 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-surface-500 dark:border-white/5 dark:bg-white/5 lg:grid">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleAll}
              className="h-3.5 w-3.5 rounded border-surface-300"
            />
            <span>Name</span>
            <span>Contact</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span className="text-right">Actions</span>
          </div>

          {pageUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-surface-500">No customers found.</div>
          ) : null}

          <div className="min-w-[820px]">
            {pageUsers.map((u: any) => (
              <div
                key={u.id}
                className="grid grid-cols-1 items-center gap-3 border-b border-surface-50 px-5 py-4 last:border-b-0 dark:border-white/5 lg:grid-cols-[28px_1.4fr_1.2fr_0.7fr_0.7fr_0.8fr_0.9fr]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={() => toggleOne(u.id)}
                  className="h-3.5 w-3.5 rounded border-surface-300"
                />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-900 text-xs font-bold text-white dark:bg-white/10">
                    {String(u.name || u.email || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <p className="truncate text-sm font-semibold text-surface-950 dark:text-white">{u.name}</p>
                </div>
                <div>
                  <p className="truncate text-xs text-surface-700 dark:text-surface-300">{u.email}</p>
                  <p className="truncate text-[11px] text-surface-400">{u.phone || 'No phone'}</p>
                </div>
                <span className={`badge w-fit ${u.role === 'ADMIN' ? 'badge-info' : 'badge-info'}`}>{u.role}</span>
                <span className="flex w-fit items-center gap-1.5 text-xs font-semibold">
                  <span className={`h-1.5 w-1.5 rounded-full ${u.isLocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span className={u.isLocked ? 'text-rose-600' : 'text-emerald-600'}>{u.isLocked ? 'Locked' : 'Active'}</span>
                </span>
                <p className="text-xs text-surface-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</p>
                <div className="flex items-center gap-1.5 lg:justify-end">
                  <button className="apple-squircle-badge !h-8 !w-8 border border-surface-200 text-surface-500 hover:bg-surface-50 dark:border-white/10 dark:hover:bg-white/5" title="View">
                    <FiEye className="h-3.5 w-3.5" />
                  </button>
                  <button className="apple-squircle-badge !h-8 !w-8 border border-surface-200 text-surface-500 hover:bg-surface-50 dark:border-white/10 dark:hover:bg-white/5" title="Edit">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button className="apple-squircle-badge !h-8 !w-8 border border-surface-200 text-surface-500 hover:bg-surface-50 dark:border-white/10 dark:hover:bg-white/5" title="More">
                    <FiMoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-surface-100 px-5 py-3 text-xs text-surface-500 dark:border-white/5 sm:flex-row">
          <span>
            Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="apple-btn-secondary !h-8 !w-8 !px-0 disabled:opacity-40"
            >
              <FiChevronLeft className="mx-auto h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-900 text-xs font-bold text-white dark:bg-white/10">
              {currentPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="apple-btn-secondary !h-8 !w-8 !px-0 disabled:opacity-40"
            >
              <FiChevronRight className="mx-auto h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}