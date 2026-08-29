'use client';

import Link from 'next/link';
import Image from 'next/image';
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

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const phoneNumber = settings?.phoneNumber || '+92 300 9070520';
  const email = settings?.email || 'support@topthreadz.pk';
  const operatingDays =
    settings?.operatingDays || 'Mon – Sat: 11:00 AM – 10:30 PM | Sun: 2:00 PM – 10:00 PM';

  return (
    <footer className="relative bg-surface-950 text-white overflow-hidden border-t border-white/10">
      {/* Decorative subtle ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-6rem] h-64 w-64 rounded-full bg-white/[0.03] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Compact Footer Grid */}
        <div className="py-8 sm:py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 border-b border-white/10">
          {/* Brand Info & Outlets */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative h-8 w-24 flex items-center">
                <Image
                  src="/images/topthreadz-logo-light.png"
                  alt="Top Threadz"
                  width={120}
                  height={40}
                  className="h-full w-auto object-contain brightness-125"
                />
              </div>
            </Link>
            <p className="text-xs text-white/60 leading-relaxed">
              Official store for premium unstitched men&apos;s fabric in Pakistan. Exceptional quality, soft finish, and timeless luxury menswear.
            </p>
            <div className="pt-2 border-t border-white/10 text-xs text-white/80">
              <p className="font-bold text-white flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
                <FiMapPin className="text-white/60 shrink-0" /> Karachi Flagship Outlet:
              </p>
              <p className="text-white/60 text-[11px] leading-relaxed">
                topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V Karachi, 75600
              </p>
              <a
                href="https://maps.google.com/?q=R28V%2BR3W,+Street+2,+DHA+Phase+5+Zamzama+Commercial+Area+Defence+V+Karachi,+75600,+Pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white/80 hover:text-white underline mt-1 inline-block"
              >
                View on Google Maps →
              </a>
            </div>
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
                  <FiTruck className="h-3.5 w-3.5 text-white/40" /> Delivery Policy (Free over 10k)
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

          {/* Contact & Outlets */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Contact & Outlets
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
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
              <li className="pt-2 border-t border-white/10 text-[11px] text-white/50">
                <strong className="text-white/70">Branches:</strong> Zamzama DHA Phase 5 Karachi &amp; F-8 Markaz Islamabad.
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