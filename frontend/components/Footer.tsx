'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  FiArrowUpRight,
  FiChevronDown,
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

type SectionKey = 'shop' | 'policies' | 'contact';

export default function Footer() {
  const pathname = usePathname();
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const phoneNumber = settings?.phoneNumber || '+92 300 9070520';
  const email = settings?.email || 'support@topthreadz.pk';
  const operatingDays =
    settings?.operatingDays || 'Mon – Sat: 11:00 AM – 10:30 PM | Sun: 2:00 PM – 10:00 PM';

  if (pathname?.startsWith('/admin')) return null;

  const toggleSection = (key: SectionKey) => {
    setOpenSection((current) => (current === key ? null : key));
  };

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
        className="pointer-events-none absolute -top-24 right-[-8rem] h-64 w-64 rounded-full bg-[#D4A84B]/[0.06] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-[-6rem] h-56 w-56 rounded-full bg-white/[0.03] blur-[100px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 border-b border-white/10 py-8 sm:py-9 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr] lg:gap-8 lg:py-8">
          {/* Brand Info & Outlets — always visible, not part of the accordion */}
          <div className="relative space-y-3 pb-6 lg:pb-0 lg:pr-8">
            {/* Vertical gold divider, desktop only */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1 hidden h-[calc(100%-0.25rem)] w-px bg-gradient-to-b from-transparent via-[#D4A84B]/25 to-transparent lg:block"
            />

            <Link href="/" className="hover-lift inline-flex items-center gap-2.5">
              <div className="relative h-7 w-24">
                <Image
                  src="/images/topthreadz-logo-light.png"
                  alt="Top Threadz"
                  width={140}
                  height={44}
                  className="h-full w-auto object-contain brightness-125"
                />
              </div>
            </Link>

            <p className="max-w-sm text-[12px] leading-relaxed text-white/55">
              Official store for premium unstitched men&apos;s fabric in Pakistan — exceptional
              quality, soft finish, and timeless luxury menswear.
            </p>

            <div className="max-w-sm space-y-1.5 border-t border-white/10 pt-3">
              <p className="flex items-center gap-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8C86A]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#D4A84B]/40 bg-[#D4A84B]/10">
                  <FiMapPin className="h-2.5 w-2.5 text-[#E8C86A]" />
                </span>
                Karachi Flagship Outlet
              </p>
              <p className="pl-7 text-[11.5px] leading-relaxed text-white/50">
                topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V
                Karachi, 75600
              </p>
              <a
                href="https://maps.google.com/?q=R28V%2BR3W,+Street+2,+DHA+Phase+5+Zamzama+Commercial+Area+Defence+V+Karachi,+75600,+Pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale ml-7 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#E8C86A] transition-colors hover:text-white focus-visible:outline-none"
              >
                View on Google Maps
                <FiArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="border-t border-white/10 lg:border-t-0">
            <button
              type="button"
              onClick={() => toggleSection('shop')}
              className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:py-0"
              aria-expanded={openSection === 'shop'}
            >
              <h2 className="font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:mb-3.5">
                Shop
              </h2>
              <FiChevronDown
                className={`h-4 w-4 text-white/40 transition-transform duration-200 lg:hidden ${openSection === 'shop' ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <nav
              aria-label="Shop"
              className={`overflow-hidden transition-all duration-300 lg:!grid-rows-[1fr] lg:!opacity-100 ${openSection === 'shop' ? 'grid grid-rows-[1fr] opacity-100' : 'grid grid-rows-[0fr] opacity-0 lg:opacity-100'
                }`}
            >
              <ul className="min-h-0 space-y-2.5 overflow-hidden pb-3.5 text-[12.5px] lg:pb-0">
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
          </div>

          {/* Policies */}
          <div className="border-t border-white/10 lg:border-t-0">
            <button
              type="button"
              onClick={() => toggleSection('policies')}
              className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:py-0"
              aria-expanded={openSection === 'policies'}
            >
              <h2 className="font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:mb-3.5">
                Policies
              </h2>
              <FiChevronDown
                className={`h-4 w-4 text-white/40 transition-transform duration-200 lg:hidden ${openSection === 'policies' ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <nav
              aria-label="Policies"
              className={`overflow-hidden transition-all duration-300 lg:!grid-rows-[1fr] lg:!opacity-100 ${openSection === 'policies' ? 'grid grid-rows-[1fr] opacity-100' : 'grid grid-rows-[0fr] opacity-0 lg:opacity-100'
                }`}
            >
              <ul className="min-h-0 space-y-2.5 overflow-hidden pb-3.5 text-[12.5px] lg:pb-0">
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
          </div>

          {/* Contact & Outlets */}
          <div className="border-t border-white/10 lg:border-t-0">
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:py-0"
              aria-expanded={openSection === 'contact'}
            >
              <h2 className="font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:mb-3.5">
                Contact &amp; Outlets
              </h2>
              <FiChevronDown
                className={`h-4 w-4 text-white/40 transition-transform duration-200 lg:hidden ${openSection === 'contact' ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 lg:!grid-rows-[1fr] lg:!opacity-100 ${openSection === 'contact' ? 'grid grid-rows-[1fr] opacity-100' : 'grid grid-rows-[0fr] opacity-0 lg:opacity-100'
                }`}
            >
              <ul className="min-h-0 space-y-2.5 overflow-hidden pb-3.5 text-[12.5px] text-white/60 lg:pb-0">
                {phoneNumber && (
                  <li>
                    <a
                      href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                      className="group/link inline-flex items-center gap-2 transition-colors hover:text-white focus-visible:outline-none"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors group-hover/link:border-[#D4A84B]/40 group-hover/link:bg-[#D4A84B]/10">
                        <FiPhone className="h-3 w-3 text-white/50 group-hover/link:text-[#E8C86A]" />
                      </span>
                      <span>{phoneNumber}</span>
                    </a>
                  </li>
                )}
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="group/link inline-flex items-center gap-2 break-all transition-colors hover:text-white focus-visible:outline-none"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors group-hover/link:border-[#D4A84B]/40 group-hover/link:bg-[#D4A84B]/10">
                      <FiMail className="h-3 w-3 text-white/50 group-hover/link:text-[#E8C86A]" />
                    </span>
                    <span>{email}</span>
                  </a>
                </li>
                <li className="inline-flex items-center gap-2 text-white/50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <FiClock className="h-3 w-3 text-white/40" />
                  </span>
                  <span>{operatingDays}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-2.5 py-4 text-[11.5px] text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Top Threadz. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11.5px]">
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