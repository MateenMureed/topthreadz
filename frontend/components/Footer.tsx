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
  FiMapPin,
  FiRefreshCw,
  FiShield,
  FiTruck,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { SiGmail } from 'react-icons/si';
import { SOCIAL_LINKS } from '@/lib/seo';

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
    settings?.operatingDays ||
    'Store: Mon – Fri: 9:00 AM – 12:00 PM | Sat & Sun: Store Closed | Online Shopping: 24/7';

  if (pathname?.startsWith('/admin')) return null;

  // Dynamic store logo (footer variant) with bundled fallback
  const { data: siteLogo } = useQuery({
    queryKey: ['site-logo'],
    queryFn: () => api.get('/settings/logo').then((r) => r.data?.data).catch(() => null),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const footerLogoSrc = siteLogo?.footer?.footer || siteLogo?.dark?.footer || siteLogo?.url || '/images/topthreadz-logo-light.png';

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

            <Link href="/" className="hover-lift inline-block">
              <Image
                src={footerLogoSrc}
                alt="Top Threadz"
                width={160}
                height={50}
                unoptimized={!footerLogoSrc.startsWith('/')}
                className="h-10 w-auto object-contain"
              />
            </Link>

            <p className="max-w-sm text-[12px] leading-relaxed text-white/55">
              Official store for premium unstitched men&apos;s fabric in Pakistan — exceptional
              quality, soft finish, and timeless luxury menswear.
            </p>

            <address className="not-italic max-w-sm space-y-1.5 border-t border-white/10 pt-3">
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
                className="group/link inline-flex items-center gap-1 pl-7 text-[11.5px] font-semibold text-[#E8C86A] transition-colors hover:text-[#F3D78A] focus-visible:outline-none"
              >
                <span>View on Google Maps</span>
                <FiArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
              </a>
            </address>
          </div>

          {/* Collections */}
          <div className="border-t border-white/10 lg:border-t-0">
            <button
              type="button"
              onClick={() => toggleSection('shop')}
              className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:py-0"
              aria-expanded={openSection === 'shop'}
            >
              <h2 className="font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:mb-3.5">
                Collections
              </h2>
              <FiChevronDown
                className={`h-4 w-4 text-white/40 transition-transform duration-200 lg:hidden ${openSection === 'shop' ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <nav
              aria-label="Shop categories"
              className={`overflow-hidden transition-all duration-300 lg:!grid-rows-[1fr] lg:!opacity-100 ${openSection === 'shop' ? 'grid grid-rows-[1fr] opacity-100' : 'grid grid-rows-[0fr] opacity-0 lg:opacity-100'
                }`}
            >
              <ul className="min-h-0 space-y-2.5 overflow-hidden pb-3.5 text-[12.5px] lg:pb-0">
                <li>
                  <Link href="/products/category/unstitched-fabric" className={linkClass}>
                    <span>Unstitched Fabric</span>
                    {underline}
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/stitched" className={linkClass}>
                    <span>Stitched Clothing</span>
                    {underline}
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/waist-coats" className={linkClass}>
                    <span>Waistcoats</span>
                    {underline}
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/two-piece" className={linkClass}>
                    <span>Two Piece Suits</span>
                    {underline}
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/three-piece" className={linkClass}>
                    <span>Three Piece Suits</span>
                    {underline}
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/kids-section" className={linkClass}>
                    <span>Kids&apos; Traditional Wear</span>
                    {underline}
                  </Link>
                </li>
                <li>
                  <Link href="/products" className={linkClass}>
                    <span>Shop All Products</span>
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

          {/* Contact & Connect */}
          <div className="border-t border-white/10 lg:border-t-0">
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:py-0"
              aria-expanded={openSection === 'contact'}
            >
              <h2 className="font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40 lg:mb-3.5">
                Contact &amp; Connect
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
              <div className="min-h-0 space-y-4 overflow-hidden pb-3.5 lg:pb-0">
                {/* Instant Action Icons for WhatsApp, Email, Facebook and Instagram */}
                <div className="flex items-center gap-3 pt-1">
                  {/* WhatsApp Icon */}
                  <a
                    href={`https://wa.me/${(phoneNumber || '923009070520').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Top Threadz, I have an inquiry regarding your collection.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact us on WhatsApp"
                    title="Chat on WhatsApp"
                    className="group/wa relative flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm transition-all duration-300 ease-out hover:scale-115 hover:-translate-y-1 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_22px_rgba(37,211,102,0.45)] active:scale-95"
                  >
                    <FaWhatsapp className="h-5 w-5 transition-transform duration-300 group-hover/wa:rotate-6" />
                  </a>

                  {/* Facebook Icon */}
                  <a
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Facebook"
                    title="Follow on Facebook"
                    className="group/fb relative flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-sm transition-all duration-300 ease-out hover:scale-115 hover:-translate-y-1 hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:shadow-[0_0_22px_rgba(24,119,242,0.45)] active:scale-95"
                  >
                    <FaFacebookF className="h-5 w-5 transition-transform duration-300 group-hover/fb:rotate-6" />
                  </a>

                  {/* Instagram Icon */}
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Instagram"
                    title="Follow on Instagram"
                    className="group/ig relative flex h-11 w-11 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 shadow-sm transition-all duration-300 ease-out hover:scale-115 hover:-translate-y-1 hover:border-[#E4405F] hover:bg-[#E4405F] hover:text-white hover:shadow-[0_0_22px_rgba(228,64,95,0.45)] active:scale-95"
                  >
                    <FaInstagram className="h-5 w-5 transition-transform duration-300 group-hover/ig:rotate-6" />
                  </a>

                  {/* Gmail / Email Icon */}
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email || 'support@topthreadz.pk')}&su=${encodeURIComponent('Top Threadz Customer Inquiry')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Send email via Gmail"
                    title="Send Email via Gmail"
                    className="group/mail relative flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 shadow-sm transition-all duration-300 ease-out hover:scale-115 hover:-translate-y-1 hover:border-[#EA4335] hover:bg-[#EA4335] hover:text-white hover:shadow-[0_0_22px_rgba(234,67,53,0.45)] active:scale-95"
                  >
                    <SiGmail className="h-5 w-5 transition-transform duration-300 group-hover/mail:rotate-6" />
                  </a>
                </div>

                <div className="inline-flex items-start gap-2 text-white/50 text-[11.5px]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                    <FiClock className="h-2.5 w-2.5 text-white/40" />
                  </span>
                  <ul className="space-y-0.5 leading-5">
                    {String(operatingDays)
                      .split('|')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-2.5 py-4 text-[11.5px] text-white/35 sm:flex-row">
          <p suppressHydrationWarning>© {new Date().getFullYear()} Top Threadz. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11.5px]">
            <Link
              href="/about"
              className="group/link relative inline-flex items-center gap-1 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
            >
              About Us
              {underline}
            </Link>
            <Link
              href="/size-guide"
              className="group/link relative inline-flex items-center gap-1 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
            >
              Size Guide
              {underline}
            </Link>
            <Link
              href="/blog"
              className="group/link relative inline-flex items-center gap-1 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
            >
              Blog
              {underline}
            </Link>
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