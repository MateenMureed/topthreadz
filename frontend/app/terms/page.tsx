'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

export default function TermsOfServicePage() {
  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const customPolicy = settingsData?.termsOfService;

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-soft border border-surface-200">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-6 transition-colors">
          <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-200">
          <div className="p-3 bg-surface-100 rounded-xl text-black">
            <FiFileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">Terms of Service</h1>
            <p className="text-xs text-surface-500 mt-1">Top Threadz • MensWear.pk</p>
          </div>
        </div>

        {customPolicy ? (
          <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed whitespace-pre-line">
            {customPolicy}
          </div>
        ) : (
          <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">1. Overview</h2>
              <p>
                This website is operated by Top Threadz. Throughout the site, the terms &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to Top Threadz. By visiting our site and/ or purchasing something from us, you engage in our &quot;Service&quot; and agree to be bound by the following terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">2. Products & Pricing</h2>
              <p>
                All unstitched fabrics (4.5 meter suit lengths, blended wash & wear, Boski series) are described as accurately as possible. Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue any product.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">3. Orders & Payment</h2>
              <p>
                We accept Cash on Delivery (COD) and approved digital payments. We reserve the right to refuse any order you place with us or limit quantities per person or per order.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">4. Contact Information</h2>
              <p>
                Questions about the Terms of Service should be sent to us at{' '}
                <a href={`mailto:${settingsData?.email || 'support@topthreadz.pk'}`} className="text-black font-semibold underline">
                  {settingsData?.email || 'support@topthreadz.pk'}
                </a>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
