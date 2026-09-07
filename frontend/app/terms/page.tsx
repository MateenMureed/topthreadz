'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import ObfuscatedEmail from '@/components/ObfuscatedEmail';

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
            <p className="text-xs text-surface-500 mt-1">Top Threadz</p>
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
                This website is operated by Top Threadz (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By visiting our site and/or purchasing from us, you engage in our &quot;Service&quot; and agree to be bound by these terms and conditions. Top Threadz is a multi-category fashion retailer offering menswear, unstitched fabrics, stitched garments, suits and kids&apos; collections.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">2. Products &amp; Pricing</h2>
              <p>
                We describe all products â€” including unstitched fabrics, stitched garments, two-piece and three-piece suits, and kids&apos; wear â€” as accurately as possible. Prices are subject to change without notice, and we reserve the right to modify or discontinue any product at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">3. Orders &amp; Payment</h2>
              <p>
                We accept Cash on Delivery (COD) and approved digital payments. We reserve the right to refuse any order or limit quantities per person or per order.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">4. Product Use &amp; Sizing</h2>
              <p>
                Sizing guides are provided as a reference. Because tailoring preferences and body measurements vary, we encourage you to review each product&apos;s size details before ordering. Unstitched fabric is supplied for stitching to your preferred style and measurements.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">5. Intellectual Property</h2>
              <p>
                All content on this website â€” including product photography, descriptions, branding and design â€” belongs to Top Threadz and may not be copied, reproduced or used commercially without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">6. Returns &amp; Exchanges</h2>
              <p>
                Returns and exchanges are governed by our <Link href="/returns" className="text-black font-semibold underline underline-offset-2">Exchange &amp; Return Policy</Link>, which forms part of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">7. Limitation of Liability</h2>
              <p>
                To the extent permitted by law, Top Threadz is not liable for indirect or consequential losses arising from the use of this website or the purchase of our products.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">8. Changes to These Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-2">9. Contact Information</h2>
              <p>
                Questions about these Terms of Service may be sent to{' '}
                <ObfuscatedEmail className="text-black font-semibold underline underline-offset-2" />.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
