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
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiTruck,
} from 'react-icons/fi';

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const phoneNumber = settings?.phoneNumber || '+92 300 1234567';
  const email = settings?.email || 'support@topthreadz.pk';
  const operatingDays =
    settings?.operatingDays || 'Mon – Fri: 9:00 AM – 6:00 PM';

  return (
    <footer className="relative bg-surface-950 text-white overflow-hidden border-t border-white/10">
      {/* Decorative subtle ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-6rem] h-64 w-64 rounded-full bg-white/[0.03] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Compact Footer Grid */}
        <div className="py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 border-b border-white/10">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 space-y-2.5">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-surface-950 font-black text-xs tracking-tight shadow-md transition-transform duration-300 group-hover:scale-105">
                TT
              </span>
              <span className="text-sm font-black tracking-[0.16em] text-white">
                TOP THREADZ
              </span>
            </Link>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              Premium unstitched men&apos;s fabric in Pakistan. Exceptional quality, comfort, and timeless menswear.
            </p>
          </div>

          {/* Quick Links / Shop */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Shop
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/products"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  All Products <FiArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/products?sortBy=newest"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/delivery"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <FiTruck className="h-3.5 w-3.5 text-white/40" /> Delivery Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <FiRefreshCw className="h-3.5 w-3.5 text-white/40" /> Exchanges & Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <FiShield className="h-3.5 w-3.5 text-white/40" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <FiFileText className="h-3.5 w-3.5 text-white/40" /> Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Contact Us
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              {phoneNumber && (
                <li>
                  <a
                    href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                    className="hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <FiPhone className="h-3.5 w-3.5 text-white/40 shrink-0" />
                    <span>{phoneNumber}</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${email}`}
                  className="hover:text-white transition-colors inline-flex items-center gap-2 break-all"
                >
                  <FiMail className="h-3.5 w-3.5 text-white/40 shrink-0" />
                  <span>{email}</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-white/60">
                <FiClock className="h-3.5 w-3.5 text-white/40 shrink-0" />
                <span>{operatingDays}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Top Threadz. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/delivery" className="hover:text-white transition-colors">
              Delivery
            </Link>
            <span>•</span>
            <Link href="/returns" className="hover:text-white transition-colors">
              Returns
            </Link>
            <span>•</span>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}