'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 30 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{
          top: 14,
          left: 12,
          right: 12,
          bottom: 12,
        }}
        toastOptions={{
          duration: 3200,
          style: {
            background: '#121212',
            color: '#f5f5f5',
            border: '1px solid #2b2b2b',
            borderRadius: '999px',
            padding: '10px 14px',
            maxWidth: 'min(92vw, 420px)',
          },
          success: { iconTheme: { primary: '#f5f5f5', secondary: '#121212' } },
          error: { iconTheme: { primary: '#e00000', secondary: '#ffffff' } },
        }}
      />
    </QueryClientProvider>
  );
}
