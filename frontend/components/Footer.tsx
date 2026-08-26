'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  FiArrowUpRight,
  FiClock,
  FiFileText,
  FiHelpCircle,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiTruck,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const whatsappNumber = settings?.whatsappNumber || '923009070520';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');

  const phoneNumber = settings?.phoneNumber || '+92 300 1234567';
  const email = settings?.email || 'support@topthreadz.pk';

  const operatingDays =
    settings?.operatingDays || 'Mon – Fri: 9:00 AM – 6:00 PM';

  return (
    <footer className="relative overflow-hidden bg-surface-950 text-white">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-8rem] h-80 w-80 rounded-full bg-white/[0.04] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-white/[0.03] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* =========================================================
            TOP BRAND / CTA
        ========================================================== */}
        <div className="border-b border-white/10 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">

            {/* Brand */}
            <div>
              <Link
                href="/"
                className="group inline-flex items-center gap-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white text-sm font-black tracking-tight text-surface-950 shadow-lg transition-transform duration-300 group-hover:scale-105">
                  TT
                </span>

                <span className="text-lg font-black tracking-[0.18em]">
                  TOP THREADZ
                </span>
              </Link>

              <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Premium fabric.
                <br />
                <span className="text-white/50">
                  Made for your style.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
                Discover premium unstitched men&apos;s fabric from Top Threadz,
                carefully selected for comfort, quality and timeless Pakistani
                menswear.
              </p>
            </div>

            {/* WhatsApp CTA */}
            {cleanWhatsapp && (
              <div className="lg:justify-self-end">
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=Hi%20Top%20Threadz%2C%20I%20need%20assistance.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.1] sm:p-5 lg:w-[320px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white">
                      <FaWhatsapp className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                        Need help?
                      </p>

                      <p className="mt-0.5 text-sm font-bold">
                        Chat with us
                      </p>
                    </div>
                  </div>

                  <FiArrowUpRight className="h-5 w-5 text-white/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            MAIN FOOTER CONTENT
        ========================================================== */}
        <div className="grid grid-cols-1 gap-0 border-b border-white/10 py-8 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-12 lg:py-12">

          {/* Shop */}
          <div className="border-b border-white/10 py-6 first:pt-0 sm:border-0 sm:py-0">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Shop
            </h3>

            <ul className="mt-5 space-y-3.5">
              <li>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  All Products
                  <FiArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </Link>
              </li>

              <li>
                <Link
                  href="/products?sortBy=newest"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  New Arrivals
                  <FiArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </Link>
              </li>

              <li>
                <Link
                  href="/orders"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  Track My Order
                  <FiArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  FAQs
                  <FiArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="border-b border-white/10 py-6 sm:border-0 sm:py-0">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Customer Care
            </h3>

            <ul className="mt-5 space-y-3.5">
              <li>
                <Link
                  href="/delivery"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <FiTruck className="h-4 w-4 text-white/30" />
                  Delivery Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/returns"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <FiRefreshCw className="h-4 w-4 text-white/30" />
                  Returns & Exchanges
                </Link>
              </li>

              <li>
                <Link
                  href="/privacy"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <FiShield className="h-4 w-4 text-white/30" />
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <FiFileText className="h-4 w-4 text-white/30" />
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
                >
                  <FiHelpCircle className="h-4 w-4 text-white/30" />
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="border-b border-white/10 py-6 sm:border-0 sm:py-0">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Contact
            </h3>

            <div className="mt-5 space-y-4">

              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                  className="group flex items-start gap-3"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                    <FiPhone className="h-3.5 w-3.5 text-white/50" />
                  </span>

                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/30">
                      Phone
                    </span>

                    <span className="mt-0.5 block break-all text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                      {phoneNumber}
                    </span>
                  </span>
                </a>
              )}

              <a
                href={`mailto:${email}`}
                className="group flex items-start gap-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <FiMail className="h-3.5 w-3.5 text-white/50" />
                </span>

                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/30">
                    Email
                  </span>

                  <span className="mt-0.5 block break-all text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                    {email}
                  </span>
                </span>
              </a>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <FiClock className="h-3.5 w-3.5 text-white/50" />
                </span>

                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/30">
                    Support Hours
                  </span>

                  <span className="mt-0.5 block text-sm font-medium leading-6 text-white/70">
                    {operatingDays}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <FiMapPin className="h-3.5 w-3.5 text-white/50" />
                </span>

                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/30">
                    Delivery
                  </span>

                  <span className="mt-0.5 block text-sm font-medium text-white/70">
                    Nationwide across Pakistan
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Brand Promise */}
          <div className="py-6 sm:py-0">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Top Threadz
            </h3>

            <p className="mt-5 text-sm leading-7 text-white/55">
              Premium unstitched men&apos;s fabric designed for modern Pakistani
              menswear — combining refined style, comfort and everyday
              versatility.
            </p>

            <div className="mt-6 space-y-2.5">
              {[
                'Premium fabric selection',
                'Nationwide delivery',
                'Secure checkout',
                'Dedicated customer support',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 text-xs font-semibold text-white/65"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  {item}
                </div>
              ))}
            </div>

            {cleanWhatsapp && (
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=Hi%20Top%20Threadz%2C%20I%20need%20assistance.`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.1] hover:text-white"
              >
                <FaWhatsapp className="h-4 w-4 text-[#25D366]" />
                WhatsApp Support
              </a>
            )}
          </div>
        </div>

        {/* =========================================================
            BOTTOM BAR
        ========================================================== */}
        <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-center sm:text-left">
            <p className="text-xs font-medium text-white/40">
              © {new Date().getFullYear()} Top Threadz. All rights reserved.
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              Premium Unstitched Men&apos;s Fabric in Pakistan
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-white/40">
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Privacy
            </Link>

            <span className="text-white/15">•</span>

            <Link
              href="/terms"
              className="transition-colors hover:text-white"
            >
              Terms
            </Link>

            <span className="text-white/15">•</span>

            <Link
              href="/delivery"
              className="transition-colors hover:text-white"
            >
              Delivery
            </Link>

            <span className="text-white/15">•</span>

            <Link
              href="/returns"
              className="transition-colors hover:text-white"
            >
              Returns
            </Link>

            <span className="text-white/15">•</span>

            <Link
              href="/faq"
              className="transition-colors hover:text-white"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}