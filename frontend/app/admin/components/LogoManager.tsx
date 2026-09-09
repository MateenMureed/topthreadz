'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { AdminImage } from './AdminImage';
import { FiUpload, FiTrash2, FiLayers } from 'react-icons/fi';

const LOGO_SLOTS_UI: { slot: 'dark' | 'light' | 'footer' | 'favicon'; title: string; hint: string; previewBg: string }[] = [
  { slot: 'dark', title: 'Dark Mode Logo', hint: 'White-text logo for dark headers & the mobile drawer', previewBg: '#0B1220' },
  { slot: 'light', title: 'Light Mode Logo', hint: 'Black-text logo for the white desktop navbar', previewBg: '#FFFFFF' },
  { slot: 'footer', title: 'Footer Logo', hint: 'Logo shown in the storefront footer', previewBg: '#0F1F3D' },
  { slot: 'favicon', title: 'Favicon (ICO)', hint: 'Square icon — auto-generates .ico + .png for all browsers', previewBg: '#EEF1F6' },
];

export default function LogoManager() {
  const queryClient = useQueryClient();
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const { data: logo } = useQuery({
    queryKey: ['site-logo'],
    queryFn: () => api.get('/settings/logo').then((r) => r.data?.data),
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('slot', slot);
      return api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (_res, { slot }) => {
      queryClient.invalidateQueries({ queryKey: ['site-logo'] });
      toast.success(`${LOGO_SLOTS_UI.find((s) => s.slot === slot)?.title} uploaded — sizes resize automatically.`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Logo upload failed.'),
    onSettled: (_d, _e, { slot }) => setUploadingSlot(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (slot: string) => api.delete(`/settings/logo?slot=${slot}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logo'] });
      toast.success('Logo slot cleared — default branding now in use.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not remove logo.'),
  });

  const handleFile = (slot: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(slot);
    uploadMutation.mutate({ file, slot });
    e.target.value = '';
  };

  const slotPreview = (slot: string) => {
    const entry = (logo as any)?.[slot];
    return entry?.header || entry?.url || '';
  };

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 sm:p-6 shadow-card space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
        <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-100/60 shadow-subtle">
          <FiLayers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-surface-900">Store Branding — Brand Assets</h2>
          <p className="text-xs text-surface-500">
            Upload custom logos for each storefront surface. High-resolution WebP, PNG, SVG supported.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {LOGO_SLOTS_UI.map(({ slot, title, hint, previewBg }) => {
          const preview = slotPreview(slot);
          const uploading = uploadingSlot === slot;
          return (
            <div key={slot} className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-4 flex gap-4 transition-all hover:bg-surface-50">
              {/* Preview tile on the slot's real background */}
              <div
                className="shrink-0 w-28 h-20 rounded-xl border border-surface-200 flex items-center justify-center overflow-hidden px-2 shadow-inner"
                style={{ backgroundColor: previewBg }}
              >
                {preview ? (
                  <AdminImage src={preview} alt={`${title} preview`} className="max-h-12 w-auto object-contain" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400">None</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-surface-900">{title}</p>
                <p className="text-[11px] text-surface-500 mt-0.5 leading-snug">{hint}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <label className="admin-btn-primary cursor-pointer !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5">
                    <FiUpload className="w-3 h-3" />
                    {uploading ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/x-icon"
                      hidden
                      onChange={handleFile(slot)}
                    />
                  </label>
                  {preview && (
                    <button
                      onClick={() => deleteMutation.mutate(slot)}
                      className="admin-btn-secondary !py-1.5 !px-3 text-xs !text-red-600 border-red-200 hover:bg-red-50 inline-flex items-center gap-1.5"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 flex items-start gap-2.5">
        <span className="text-blue-600 text-xs mt-0.5 font-bold">ℹ</span>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          <strong>Favicon tip:</strong> Provide a square graphic (512 × 512 px recommended). Icons are automatically exported in all browser and mobile home screen formats.
        </p>
      </div>
    </div>
  );
}
