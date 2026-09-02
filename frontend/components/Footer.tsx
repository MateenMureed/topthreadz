'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const phoneNumber = settings?.phoneNumber || '+92 300 9070520';
  const email = settings?.email || 'support@topthreadz.pk';
  const operatingDays =
    settings?.operatingDays || 'Mon – Sat: 11:00 AM – 10:30 PM | Sun: 2:00 PM – 10:00 PM';

  if (pathname?.startsWith('/admin')) return null;

  const linkClass =
    'group/link relative inline-flex items-center gap-1.5 text-white/60 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-white';

  const underline = (
    <span className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-[#D4A84B] to-[#E8C86A] transition-all duration-300 group-hover/link:w-full" />
  );

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#0F1F3D] to-[#081020] text-white">
      {/* Thread-line accent — a single gold hairline, evoking a stitched seam */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4A84B]/70 to-transparent" />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-8rem] h-80 w-80 rounded-full bg-[#D4A84B]/[0.06] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-[-6rem] h-72 w-72 rounded-full bg-white/[0.03] blur-[100px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 py-12 sm:py-14 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr] lg:gap-8">
          {/* Brand Info & Outlets */}
          <div className="relative space-y-4 lg:pr-8">
            {/* Vertical gold divider, desktop only */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1 hidden h-[calc(100%-0.25rem)] w-px bg-gradient-to-b from-transparent via-[#D4A84B]/25 to-transparent lg:block"
            />

            <Link href="/" className="hover-lift inline-flex items-center gap-2.5">
              <div className="relative h-9 w-28">
                <Image
                  src="/images/topthreadz-logo-light.png"
                  alt="Top Threadz"
                  width={140}
                  height={44}
                  className="h-full w-auto object-contain brightness-125"
                />
              </div>
            </Link>

            <p className="max-w-sm text-[13px] leading-relaxed text-white/55">
              Official store for premium unstitched men&apos;s fabric in Pakistan — exceptional
              quality, soft finish, and timeless luxury menswear.
            </p>

            <div className="max-w-sm space-y-2 border-t border-white/10 pt-4">
              <p className="flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E8C86A]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4A84B]/40 bg-[#D4A84B]/10">
                  <FiMapPin className="h-3 w-3 text-[#E8C86A]" />
                </span>
                Karachi Flagship Outlet
              </p>
              <p className="pl-8 text-[12px] leading-relaxed text-white/50">
                topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V
                Karachi, 75600
              </p>
              <a
                href="https://maps.google.com/?q=R28V%2BR3W,+Street+2,+DHA+Phase+5+Zamzama+Commercial+Area+Defence+V+Karachi,+75600,+Pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale ml-8 inline-flex items-center gap-1 text-[12px] font-semibold text-[#E8C86A] transition-colors hover:text-white focus-visible:outline-none"
              >
                View on Google Maps
                <FiArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Links / Shop */}
          <nav aria-label="Shop">
            <h2 className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Shop
            </h2>
            <ul className="space-y-3 text-[13px]">
              <li>
                <Link href="/products" className={linkClass}>
                  All Products <FiArrowUpRight className="h-3 w-3 opacity-50" />
                  {underline}
                </Link>
              </li>
              <li>
                <Link href="/products?sortBy=newest" className={linkClass}>
                  New Arrivals
                  {underline}
                </Link>
              </li>
              <li>
                <Link href="/orders" className={linkClass}>
                  Track Order
                  {underline}
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQs
                  {underline}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Policies */}
          <nav aria-label="Policies">
            <h2 className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Policies
            </h2>
            <ul className="space-y-3 text-[13px]">
              <li>
                <Link href="/delivery" className={linkClass}>
                  <FiTruck className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <span>Delivery Policy</span>
                  {underline}
                </Link>
              </li>
              <li>
                <Link href="/returns" className={linkClass}>
                  <FiRefreshCw className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <span>Exchanges &amp; Returns</span>
                  {underline}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  <FiShield className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <span>Privacy Policy</span>
                  {underline}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  <FiFileText className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <span>Terms of Service</span>
                  {underline}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact & Outlets */}
          <div>
            <h2 className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Contact &amp; Outlets
            </h2>
            <ul className="space-y-3.5 text-[13px] text-white/60">
              {phoneNumber && (
                <li>
                  <a
                    href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                    className="group/link inline-flex items-center gap-2.5 transition-colors hover:text-white focus-visible:outline-none"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors group-hover/link:border-[#D4A84B]/40 group-hover/link:bg-[#D4A84B]/10">
                      <FiPhone className="h-3.5 w-3.5 text-white/50 group-hover/link:text-[#E8C86A]" />
                    </span>
                    <span>{phoneNumber}</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${email}`}
                  className="group/link inline-flex items-center gap-2.5 break-all transition-colors hover:text-white focus-visible:outline-none"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors group-hover/link:border-[#D4A84B]/40 group-hover/link:bg-[#D4A84B]/10">
                    <FiMail className="h-3.5 w-3.5 text-white/50 group-hover/link:text-[#E8C86A]" />
                  </span>
                  <span>{email}</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2.5 text-white/50">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <FiClock className="h-3.5 w-3.5 text-white/40" />
                </span>
                <span>{operatingDays}</span>
              </li>
              <li className="ml-9 border-t border-white/10 pt-3 text-[12px] text-white/40">
                <strong className="font-medium text-white/60">Flagship Store:</strong> Zamzama
                DHA Phase 5, Karachi.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-3 py-5 text-[12px] text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Top Threadz. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[12px]">
            <Link
              href="/faq"
              className="group/link relative inline-flex items-center gap-1.5 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
            >
              <FiHelpCircle className="h-3.5 w-3.5" />
              FAQ
              {underline}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}