'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

export default function ReturnsPolicyPage() {
  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const customPolicy = settingsData?.exchangeReturnPolicy;

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-soft border border-surface-200">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-6 transition-colors">
          <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-200">
          <div className="p-3 bg-surface-100 rounded-xl text-black">
            <FiRefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">Exchange & Return Policy</h1>
            <p className="text-xs text-surface-500 mt-1">Top Threadz • Hassle-Free Returns & Exchanges</p>
          </div>
        </div>

        {customPolicy ? (
          <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed whitespace-pre-line">
            {customPolicy}
          </div>
        ) : (
          <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">1. Return Window</h2>
              <p>
                We want you to be completely satisfied with your purchase. You may request an exchange or return within <strong>7 days</strong> of receiving your package.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">2. Conditions for Exchange / Return</h2>
              <ul className="list-disc pl-5 space-y-1 text-surface-600">
                <li>Fabric must be unstitched, unwashed, and undamaged.</li>
                <li>All original tags and packaging must be intact.</li>
                <li>Proof of purchase (Order ID or invoice) must be provided.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">3. How to Request an Exchange</h2>
              <p>
                Contact our customer support team via WhatsApp at <strong>{settingsData?.whatsappNumber || '03009070520'}</strong> or email <strong>{settingsData?.email || 'support@topthreadz.pk'}</strong> with your Order Number and details of the product you wish to exchange.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">4. Refund Process</h2>
              <p>
                Once returned items are received and inspected at our warehouse, approved refunds will be processed via Bank Transfer or Store Credit within 3-5 business days.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
