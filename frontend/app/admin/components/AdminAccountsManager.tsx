'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiUserPlus, FiTrash2, FiShield, FiMail, FiLock, FiUser } from 'react-icons/fi';

export default function AdminAccountsManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: () => api.get('/admin/admins').then((r) => r.data?.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      api.post('/admin/admins', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      toast.success('Admin account created. They can now sign in with these credentials.');
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Could not create admin.'),
    onSettled: () => setCreating(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      toast.success('Admin account deleted.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Could not delete admin.'),
  });

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error('All three fields are required.');
      return;
    }
    setCreating(true);
    createMutation.mutate({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 sm:p-6 shadow-card space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
        <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-100/60 shadow-subtle">
          <FiUsers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-surface-900">Admin Accounts & Permissions</h2>
          <p className="text-xs text-surface-500">
            Manage admin users with access to store orders, catalogs, analytics, and settings.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-surface-400">Loading admin accounts…</div>
      ) : (
        <div className="space-y-2.5">
          {(admins || []).map((a: any) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-surface-200/80 bg-surface-50/50 px-4 py-3.5 hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-surface-200/70 flex items-center justify-center text-xs font-bold text-surface-700">
                  {a.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-surface-900 truncate">{a.name}</p>
                    {a.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 text-accent-700 border border-accent-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <FiShield className="w-2.5 h-2.5" />
                        Primary Owner
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-surface-500 truncate mt-0.5">{a.email}</p>
                </div>
              </div>

              {!a.isPrimary && (
                <button
                  onClick={() => deleteMutation.mutate(a.id)}
                  className="admin-btn-secondary !py-1.5 !px-3 text-xs !text-red-600 border-red-200 hover:bg-red-50 inline-flex items-center gap-1.5 shrink-0"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create New Admin */}
      <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FiUserPlus className="w-4 h-4 text-accent-600" />
          <p className="text-xs font-bold uppercase tracking-wider text-surface-800">Add New Admin Account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-surface-600 flex items-center gap-1">
              <FiUser className="w-3 h-3" /> Full Name
            </label>
            <input
              className="admin-input-field w-full text-xs"
              placeholder="e.g. Sarah Khan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-surface-600 flex items-center gap-1">
              <FiMail className="w-3 h-3" /> Email Address
            </label>
            <input
              className="admin-input-field w-full text-xs"
              type="email"
              placeholder="admin@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-surface-600 flex items-center gap-1">
              <FiLock className="w-3 h-3" /> Temporary Password
            </label>
            <input
              className="admin-input-field w-full text-xs"
              type="password"
              placeholder="Min 8 chars, 1 number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="admin-btn-primary inline-flex items-center gap-2 text-xs"
          >
            <FiUserPlus className="w-3.5 h-3.5" />
            {creating ? 'Creating…' : 'Create Admin Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
