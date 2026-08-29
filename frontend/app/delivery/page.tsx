'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiTruck,
  FiClock,
  FiMapPin,
  FiPackage,
  FiCreditCard,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function DeliveryPolicyPage() {
  const { data: settingsData } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () =>
      api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const customPolicy = settingsData?.deliveryPolicy;

  const whatsappNumber = settingsData?.whatsappNumber || '';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');

  const phoneNumber = settingsData?.phoneNumber || '';
  const email = settingsData?.email || 'support@topthreadz.pk';

  const operatingDays =
    settingsData?.operatingDays || 'Mon to Fri: 9:00 AM - 6:00 PM';

  return (
    <div className="min-h-screen bg-surface-50 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-5 sm:mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Link>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-soft border border-surface-200 overflow-hidden">

          {/* Header */}
          <div className="p-6 sm:p-10 border-b border-surface-200">
            <div className="flex items-start gap-4">
              <div className="p-3 sm:p-4 bg-surface-950 text-white rounded-xl sm:rounded-2xl shrink-0">
                <FiTruck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-surface-400">
                  Top Threadz
                </span>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-surface-950 mt-1">
                  Delivery Policy
                </h1>

                <p className="text-sm text-surface-500 mt-2 leading-relaxed">
                  Everything you need to know about ordering, shipping and
                  receiving your Top Threadz products across Pakistan.
                </p>
              </div>
            </div>
          </div>

          {/* Custom policy from backend */}
          {customPolicy ? (
            <div className="p-6 sm:p-10">
              <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed whitespace-pre-line">
                {customPolicy}
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-10 space-y-10 text-sm text-surface-700 leading-relaxed">

              {/* 1 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiClock className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    1. Order Processing
                  </h2>
                </div>

                <p>
                  After your order is successfully placed, Top Threadz
                  processes the order for dispatch. Processing time may vary
                  depending on product availability, order volume, payment
                  verification and other operational factors.
                </p>

                <div className="mt-4 rounded-xl bg-surface-50 border border-surface-200 p-4">
                  <p className="font-semibold text-surface-900">
                    Important:
                  </p>
                  <p className="mt-1 text-surface-600">
                    An order is considered ready for shipment only after the
                    required order and payment verification has been completed.
                  </p>
                </div>
              </section>

              {/* 2 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiTruck className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    2. Delivery Across Pakistan
                  </h2>
                </div>

                <p>
                  Top Threadz delivers orders to eligible locations across
                  Pakistan through courier and logistics partners.
                </p>

                <ul className="list-disc pl-5 mt-3 space-y-2 text-surface-600">
                  <li>
                    Delivery times depend on your city and delivery address.
                  </li>
                  <li>
                    Major cities may generally receive orders faster than
                    remote or rural locations.
                  </li>
                  <li>
                    Estimated delivery times are not guaranteed and may change
                    due to operational circumstances.
                  </li>
                  <li>
                    Delivery may take longer during public holidays, seasonal
                    sales, weather conditions or unusually high order volumes.
                  </li>
                </ul>
              </section>

              {/* 3 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiMapPin className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    3. Delivery Address
                  </h2>
                </div>

                <p>
                  Customers are responsible for providing a complete and
                  accurate delivery address at checkout.
                </p>

                <p className="mt-3">
                  Please make sure your order includes:
                </p>

                <ul className="list-disc pl-5 mt-2 space-y-1 text-surface-600">
                  <li>Full name</li>
                  <li>Active phone number</li>
                  <li>Complete delivery address</li>
                  <li>City and area</li>
                  <li>Any useful landmark or delivery instructions</li>
                </ul>
              </section>

              {/* 4 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiPackage className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    4. Shipping Charges
                  </h2>
                </div>

                <p>
                  We offer <strong>FREE Nationwide Delivery</strong> across Pakistan on all orders exceeding <strong>PKR 10,000</strong>.
                </p>

                <p className="mt-3">
                  For orders below PKR 10,000, a flat standard delivery fee (e.g. PKR 250) is applied at checkout.
                </p>

                <p className="mt-3">
                  All applicable shipping charges are clearly calculated and displayed before you confirm your order.
                </p>
              </section>

              {/* 5 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiCreditCard className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    5. Cash on Delivery
                  </h2>
                </div>

                <p>
                  Cash on Delivery (COD) may be available for eligible orders
                  within Pakistan.
                </p>

                <p className="mt-3">
                  COD availability can depend on your location, order value,
                  delivery service and other operational conditions.
                </p>

                <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
                  <p className="font-semibold text-surface-900">
                    Please note:
                  </p>
                  <p className="mt-1 text-surface-600">
                    Customers should keep the required amount ready when the
                    courier arrives to avoid unnecessary delivery delays.
                  </p>
                </div>
              </section>

              {/* 6 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiPackage className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    6. Order Tracking
                  </h2>
                </div>

                <p>
                  Once your order has been dispatched, tracking information may
                  be provided through your account, email, SMS, WhatsApp or
                  another available notification method.
                </p>

                <p className="mt-3">
                  Tracking updates are controlled partly by the courier
                  service. There may occasionally be a delay between the
                  physical movement of a parcel and the tracking system update.
                </p>
              </section>

              {/* 7 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiRefreshCw className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    7. Failed Delivery
                  </h2>
                </div>

                <p>
                  Customers should remain available at the provided delivery
                  address and respond to calls from the courier when required.
                </p>

                <p className="mt-3">
                  If a parcel cannot be delivered because of an incorrect
                  address, unavailable recipient, unreachable phone number,
                  refusal or other delivery issue, the parcel may be returned
                  to Top Threadz.
                </p>

                <p className="mt-3">
                  Additional shipping or reshipment charges may apply where
                  applicable.
                </p>
              </section>

              {/* 8 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiMapPin className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    8. Changing Your Delivery Address
                  </h2>
                </div>

                <p>
                  If you need to change your delivery address, contact Top
                  Threadz as soon as possible after placing your order.
                </p>

                <p className="mt-3">
                  Address changes may only be possible before the order is
                  dispatched. Once the parcel has been handed over to the
                  courier, Top Threadz may not be able to change the delivery
                  address.
                </p>
              </section>

              {/* 9 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiAlertCircle className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    9. Delivery Delays
                  </h2>
                </div>

                <p>
                  While Top Threadz works to process and dispatch orders as
                  quickly as possible, delivery delays may occur due to
                  circumstances outside our direct control.
                </p>

                <ul className="list-disc pl-5 mt-3 space-y-2 text-surface-600">
                  <li>Severe weather conditions</li>
                  <li>Public holidays</li>
                  <li>Courier operational issues</li>
                  <li>High order volumes</li>
                  <li>Incorrect or incomplete addresses</li>
                  <li>Security or access restrictions</li>
                  <li>Unexpected logistical circumstances</li>
                </ul>
              </section>

              {/* 10 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiCheckCircle className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    10. Damaged or Tampered Parcels
                  </h2>
                </div>

                <p>
                  If your parcel appears significantly damaged or tampered
                  with when delivered, please contact the courier and Top
                  Threadz customer support as soon as possible.
                </p>

                <p className="mt-3">
                  Where possible, take clear photographs of the parcel and its
                  packaging before opening or immediately after noticing the
                  issue. This may help us investigate the matter.
                </p>
              </section>

              {/* 11 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiTruck className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    11. Courier Services
                  </h2>
                </div>

                <p>
                  Top Threadz may work with different courier and logistics
                  providers depending on the delivery location, service
                  availability and operational requirements.
                </p>

                <p className="mt-3">
                  The courier assigned to your order may therefore vary from
                  one order to another.
                </p>
              </section>

              {/* 12 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiMapPin className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    12. Remote & Restricted Locations
                  </h2>
                </div>

                <p>
                  Some remote, rural or restricted locations may have limited
                  courier coverage. In such cases, delivery may take longer or
                  the courier may require the customer to collect the parcel
                  from a nearby service point.
                </p>
              </section>

              {/* 13 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiTruck className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    13. International Delivery
                  </h2>
                </div>

                <p>
                  International delivery availability depends on the countries
                  and shipping services supported by Top Threadz at the time of
                  ordering.
                </p>

                <p className="mt-3">
                  International customers may be responsible for customs
                  duties, import taxes, VAT, clearance charges and other fees
                  imposed by the destination country.
                </p>
              </section>

              {/* 14 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiRefreshCw className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    14. Returns & Exchanges
                  </h2>
                </div>

                <p>
                  Delivery and shipping issues are separate from product
                  returns and exchanges.
                </p>

                <p className="mt-3">
                  For information about returning or exchanging a product,
                  please review our{' '}
                  <Link
                    href="/returns"
                    className="font-bold text-surface-950 underline underline-offset-2"
                  >
                    Exchange & Return Policy
                  </Link>
                  .
                </p>
              </section>

              {/* 15 */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <FiPhone className="w-5 h-5 text-surface-900" />
                  <h2 className="text-lg sm:text-xl font-bold text-surface-950">
                    15. Delivery Support
                  </h2>
                </div>

                <p>
                  If you have questions about your delivery, order status,
                  tracking information or delivery address, please contact Top
                  Threadz customer support.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {cleanWhatsapp && (
                    <a
                      href={`https://wa.me/${cleanWhatsapp}?text=Hi%20Top%20Threadz%2C%20I%20need%20help%20with%20my%20delivery.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 hover:bg-surface-100 transition-colors"
                    >
                      <FaWhatsapp className="w-5 h-5 text-[#25D366]" />

                      <div>
                        <p className="text-xs font-bold text-surface-900">
                          WhatsApp
                        </p>
                        <p className="text-xs text-surface-500">
                          Chat with our support team
                        </p>
                      </div>
                    </a>
                  )}

                  {phoneNumber && (
                    <a
                      href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                      className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 hover:bg-surface-100 transition-colors"
                    >
                      <FiPhone className="w-5 h-5 text-surface-700" />

                      <div>
                        <p className="text-xs font-bold text-surface-900">
                          Phone
                        </p>
                        <p className="text-xs text-surface-500">
                          {phoneNumber}
                        </p>
                      </div>
                    </a>
                  )}

                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 hover:bg-surface-100 transition-colors"
                  >
                    <FiMail className="w-5 h-5 text-surface-700" />

                    <div>
                      <p className="text-xs font-bold text-surface-900">
                        Email
                      </p>
                      <p className="text-xs text-surface-500 break-all">
                        {email}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
                    <FiClock className="w-5 h-5 text-surface-700" />

                    <div>
                      <p className="text-xs font-bold text-surface-900">
                        Support Hours
                      </p>
                      <p className="text-xs text-surface-500">
                        {operatingDays}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Final note */}
              <div className="rounded-2xl bg-surface-950 text-white p-5 sm:p-6">
                <p className="text-xs sm:text-sm leading-6 text-white/70">
                  By placing an order with Top Threadz, you acknowledge that
                  delivery times are estimates and may be affected by courier
                  operations, weather, public holidays and other circumstances
                  beyond our reasonable control.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/faq"
                    className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-bold text-surface-950 hover:bg-white/90 transition-colors"
                  >
                    View FAQs
                  </Link>

                  <Link
                    href="/returns"
                    className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Returns & Exchanges
                  </Link>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-surface-400 mt-5 px-4">
          Top Threadz • Premium Unstitched Men&apos;s Fabric in Pakistan
        </p>
      </div>
    </div>
  );
}