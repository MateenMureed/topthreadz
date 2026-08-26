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
  const contactEmail = settingsData?.email || 'support@topthreadz.pk';

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-soft border border-surface-200">

        {/* Back to Shop */}
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-surface-200">
          <div className="p-3 bg-surface-100 rounded-xl text-black">
            <FiShield className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">
              Privacy Policy
            </h1>

            <p className="text-xs text-surface-500 mt-1">
              Top Threadz • Premium Unstitched Men&apos;s Fabric
            </p>
          </div>
        </div>

        {/* Custom Policy from Store Settings */}
        {customPolicy ? (
          <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed whitespace-pre-line">
            {customPolicy}
          </div>
        ) : (

          /* Default Top Threadz Privacy Policy */
          <div className="space-y-8 text-sm text-surface-700 leading-relaxed">

            {/* Effective Date */}
            <p className="text-xs text-surface-500">
              <strong>Effective Date:</strong> August 26, 2026
            </p>

            {/* Introduction */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                Privacy Policy
              </h2>

              <p>
                At <strong>Top Threadz</strong>, your privacy is important to us.
                This Privacy Policy explains what personal information we collect
                when you use our website, place an order, create an account, or
                contact us, how we use that information, how it may be shared,
                and the rights you have regarding your personal information.
              </p>

              <p className="mt-3">
                By accessing or using the Top Threadz website, you agree to the
                practices described in this Privacy Policy.
              </p>
            </section>

            {/* 1 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                1. Information We Collect
              </h2>

              <p className="mb-3">
                When you browse our website, create an account, or place an
                order, we may collect information such as:
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>Full name</li>
                <li>Email address</li>
                <li>Mobile/phone number</li>
                <li>Billing address</li>
                <li>Shipping/delivery address</li>
                <li>Order details and purchase history</li>
                <li>Account information</li>
                <li>Information you provide when contacting customer support</li>
                <li>Payment-related information required to process your order</li>
              </ul>

              <p className="mt-3">
                We only collect information that is reasonably necessary to
                provide our products and services.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                2. How We Use Your Information
              </h2>

              <p className="mb-3">
                Top Threadz may use your personal information for the following
                purposes:
              </p>

              <h3 className="font-semibold text-surface-900 mb-1">
                Processing Orders
              </h3>
              <p>
                We use your name, phone number, address, and order information
                to process, confirm, package, and deliver your purchases.
              </p>

              <h3 className="font-semibold text-surface-900 mt-4 mb-1">
                Delivery and Order Updates
              </h3>
              <p>
                Your phone number and delivery information may be provided to
                our courier or delivery partners so that your order can be
                delivered successfully and you can receive relevant delivery
                updates.
              </p>

              <h3 className="font-semibold text-surface-900 mt-4 mb-1">
                Customer Support
              </h3>
              <p>
                We may use your contact information to respond to questions,
                complaints, returns, exchanges, or other requests relating to
                your orders.
              </p>

              <h3 className="font-semibold text-surface-900 mt-4 mb-1">
                Account Management
              </h3>
              <p>
                If you create an account, we may use your information to
                maintain your account, manage your orders, and provide you with
                access to relevant account features.
              </p>

              <h3 className="font-semibold text-surface-900 mt-4 mb-1">
                Website Improvement
              </h3>
              <p>
                We may collect non-personal or technical information about how
                visitors use our website to improve website performance,
                functionality, security, and user experience.
              </p>

              <h3 className="font-semibold text-surface-900 mt-4 mb-1">
                Marketing
              </h3>
              <p>
                If you have opted in to receive promotional communications, we
                may use your email address or phone number to send information
                about new products, promotions, sales, and other Top Threadz
                updates.
              </p>

              <p className="mt-3">
                You may request to stop receiving marketing communications at
                any time.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                3. Payment Information
              </h2>

              <p>
                When you make a payment through an available payment provider,
                payment information may be processed by the relevant payment
                service provider.
              </p>

              <p className="mt-3">
                Top Threadz does not intentionally store complete payment card
                details on its own systems unless explicitly stated at the time
                of payment.
              </p>

              <p className="mt-3">
                Payment information is handled according to the applicable
                policies and security practices of the payment provider.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                4. Cookies and Similar Technologies
              </h2>

              <p className="mb-3">
                Our website may use cookies and similar technologies to:
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>Keep the website functioning properly</li>
                <li>Remember user preferences</li>
                <li>Maintain shopping cart functionality</li>
                <li>Understand website usage</li>
                <li>Improve website performance</li>
                <li>Improve the overall shopping experience</li>
              </ul>

              <p className="mt-3">
                Some cookies may be temporary and expire when you close your
                browser, while others may remain on your device for a longer
                period.
              </p>

              <p className="mt-3">
                You can manage or delete cookies through your browser settings.
                Disabling certain cookies may affect some website functionality.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                5. Information Sharing
              </h2>

              <p>
                Top Threadz does <strong>not sell or rent your personal
                  information to third-party marketing companies.</strong>
              </p>

              <p className="mt-3">
                We may share necessary information with trusted service
                providers when required to operate our business, including:
              </p>

              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>Courier and delivery companies</li>
                <li>Payment service providers</li>
                <li>Website hosting and infrastructure providers</li>
                <li>Cloud storage or image hosting providers</li>
                <li>Technical and analytics service providers</li>
                <li>Customer support or communication providers</li>
              </ul>

              <p className="mt-3">
                These parties may only receive information reasonably necessary
                to provide their services.
              </p>

              <p className="mt-3">
                We may also disclose information when required by law, legal
                proceedings, government authorities, or when necessary to
                protect the rights, property, security, or users of Top Threadz.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                6. Order and Delivery Information
              </h2>

              <p className="mb-3">
                To successfully deliver your order, we may provide the courier
                or delivery service with information such as:
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>Customer name</li>
                <li>Phone number</li>
                <li>Delivery address</li>
                <li>Order number</li>
                <li>Relevant order details</li>
              </ul>

              <p className="mt-3">
                This information is used for order fulfillment and delivery
                purposes.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                7. Data Retention
              </h2>

              <p className="mb-3">
                We retain personal information only for as long as reasonably
                necessary to:
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>Complete transactions</li>
                <li>Provide customer services</li>
                <li>Maintain business and transaction records</li>
                <li>Resolve disputes</li>
                <li>Prevent fraud or misuse</li>
                <li>Comply with applicable legal or regulatory requirements</li>
              </ul>

              <p className="mt-3">
                When information is no longer required, it may be securely
                deleted or anonymized where appropriate.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                8. Data Security
              </h2>

              <p>
                Top Threadz takes reasonable technical and organizational
                measures to protect your personal information against
                unauthorized access, misuse, alteration, disclosure, or
                destruction.
              </p>

              <p className="mt-3">
                However, no method of transmitting or storing information over
                the internet can be guaranteed to be completely secure.
              </p>

              <p className="mt-3">
                You should also take appropriate steps to protect your account
                credentials and personal information.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                9. Third-Party Websites and Services
              </h2>

              <p>
                Our website may contain links to third-party websites, payment
                services, social media platforms, courier services, or other
                external services.
              </p>

              <p className="mt-3">
                These third-party websites and services operate under their own
                privacy policies. Top Threadz is not responsible for the
                privacy or security practices of third-party websites that are
                outside our control.
              </p>

              <p className="mt-3">
                We recommend reviewing the privacy policy of any third-party
                service before providing personal information.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                10. Your Privacy Rights
              </h2>

              <p className="mb-3">
                Depending on applicable law, you may have the right to:
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Request information about the personal data we hold about you
                </li>
                <li>
                  Request correction of inaccurate or incomplete information
                </li>
                <li>
                  Request deletion of personal information where legally
                  permitted
                </li>
                <li>Ask how your personal information is being used</li>
                <li>
                  Withdraw consent for optional marketing communications
                </li>
                <li>
                  Request assistance regarding your personal information
                </li>
              </ul>

              <p className="mt-3">
                Some information may need to be retained where required for
                legal, accounting, fraud-prevention, or legitimate business
                purposes.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                11. Children&apos;s Privacy
              </h2>

              <p>
                Top Threadz products and services are intended for general
                consumers and are not specifically directed toward children.
              </p>

              <p className="mt-3">
                We do not knowingly collect personal information from children
                where such collection is prohibited by applicable law.
              </p>

              <p className="mt-3">
                If you believe that a child has provided personal information
                to us without appropriate consent, please contact us so that we
                can review and take appropriate action.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                12. Changes to This Privacy Policy
              </h2>

              <p>
                Top Threadz may update this Privacy Policy from time to time to
                reflect changes to our services, website functionality, legal
                requirements, or privacy practices.
              </p>

              <p className="mt-3">
                When changes are made, the updated version will be posted on
                this page with a revised effective date.
              </p>

              <p className="mt-3">
                Your continued use of our website after an updated Privacy
                Policy is posted constitutes acceptance of the updated policy
                to the extent permitted by applicable law.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-lg font-bold text-surface-900 mb-3">
                13. Contact Us
              </h2>

              <p>
                If you have questions, concerns, or requests regarding this
                Privacy Policy or your personal information, please contact
                <strong> Top Threadz</strong> through the contact information
                provided on our website.
              </p>

              <div className="mt-4 p-4 bg-surface-50 rounded-xl border border-surface-200">
                <p>
                  <strong>Website:</strong> Top Threadz
                </p>

                <p className="mt-1">
                  <strong>Country:</strong> Pakistan
                </p>

                <p className="mt-1">
                  <strong>Email:</strong>{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-black font-semibold underline"
                  >
                    {contactEmail}
                  </a>
                </p>
              </div>

              <p className="mt-4">
                We will make reasonable efforts to respond to privacy-related
                requests and concerns.
              </p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-surface-200 text-center">
              <p className="font-semibold text-surface-900">
                Top Threadz
              </p>
              <p className="text-xs text-surface-500 mt-1">
                Premium Unstitched Men&apos;s Fabric in Pakistan
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}