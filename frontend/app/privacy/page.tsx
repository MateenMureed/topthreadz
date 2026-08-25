'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

export default function PrivacyPolicyPage() {
  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const customPolicy = settingsData?.privacyPolicy;

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-soft border border-surface-200">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-6 transition-colors">
          <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-200">
          <div className="p-3 bg-surface-100 rounded-xl text-black">
            <FiShield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">Privacy Policy</h1>
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
              <h2 className="text-lg font-bold text-surface-900 mb-2">1. Information We Collect</h2>
              <p>
                When you visit or make a purchase from Top Threadz (MensWear.pk), we collect certain information about your device, your interaction with our site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">2. How We Use Your Information</h2>
              <p>
                We use your personal information to provide our services to you, which includes: offering products for sale, processing payments, shipping and fulfillment of your order, and keeping you up to date on new products, services, and offers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">3. Data Security & Protection</h2>
              <p>
                We implement industry-standard security measures to safeguard your personal data. Your financial transactions and personal details are encrypted and processed through trusted secure payment channels.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">4. Contact Us</h2>
              <p>
                For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at{' '}
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
