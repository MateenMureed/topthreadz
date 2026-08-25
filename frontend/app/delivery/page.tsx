'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiTruck } from 'react-icons/fi';

export default function DeliveryPolicyPage() {
  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const customPolicy = settingsData?.deliveryPolicy;

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-soft border border-surface-200">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-6 transition-colors">
          <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-200">
          <div className="p-3 bg-surface-100 rounded-xl text-black">
            <FiTruck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">Delivery Policy</h1>
            <p className="text-xs text-surface-500 mt-1">Top Threadz • Fast Shipping Across Pakistan</p>
          </div>
        </div>

        {customPolicy ? (
          <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed whitespace-pre-line">
            {customPolicy}
          </div>
        ) : (
          <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">1. Delivery Timeline</h2>
              <p>
                We deliver nationwide across Pakistan. Standard orders are dispatched within 24 hours of order placement.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-surface-600">
                <li>Major Cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad): <strong>2 - 3 Business Days</strong></li>
                <li>Other Cities & Rural Areas: <strong>3 - 5 Business Days</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">2. Shipping Charges</h2>
              <p>
                We offer free standard shipping on orders meeting our minimum promotional threshold. For standard orders, shipping charges are calculated at checkout.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">3. Order Tracking</h2>
              <p>
                Once your order is shipped, you will receive a tracking code via SMS / Email or in your Account dashboard under My Orders to track parcel location in real-time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">4. Support & Inquiries</h2>
              <p>
                For urgent shipping queries, feel free to reach out via WhatsApp at{' '}
                <strong>{settingsData?.whatsappNumber || '03009070520'}</strong> or call{' '}
                <strong>{settingsData?.phoneNumber || '+92 300 1234567'}</strong> during operating hours ({settingsData?.operatingDays || 'Mon to Fri: 9:00 AM - 6:00 PM'}).
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
