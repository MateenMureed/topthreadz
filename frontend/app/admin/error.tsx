'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // When an RSC flight transition error happens during login navigation,
    // automatically do a clean hard reload to ensure cookies and layout mount.
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-surface-200">
        <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#0F1F3D] text-white flex items-center justify-center font-bold">
          TT
        </div>
        <h2 className="text-base font-bold text-surface-900 mb-2">Connecting Admin Panel...</h2>
        <p className="text-xs text-surface-500 mb-6">Initializing admin session. If it does not redirect, click below.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-[#0F1F3D] hover:bg-[#16284D] text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors"
        >
          Reload Admin Panel
        </button>
      </div>
    </div>
  );
}
