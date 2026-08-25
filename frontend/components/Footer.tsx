'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  FiMail,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiFileText,
  FiHelpCircle,
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
  const operatingDays = settings?.operatingDays || 'Mon to Fri: 9:00 AM - 6:00 PM';

  return (
    <footer className="block bg-[#f4f4f3] text-surface-800 font-sans border-t border-surface-300 pt-10 pb-28 lg:pb-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── MODERN FOOTER BRAND HEADER & WHATSAPP CARD ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-surface-200/90 shadow-sm mb-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <span className="brand-wordmark text-xs uppercase tracking-[0.2em] text-surface-400 font-bold block">Top Threadz</span>
            <h3 className="text-lg sm:text-xl font-display font-bold text-surface-950 mt-0.5">
              Premium Unstitched Menswear
            </h3>
            <p className="text-xs text-surface-600 mt-1">
              Nationwide Cash on Delivery & 7-Day Easy Exchange Policy
            </p>
          </div>
          
          <a
            href={`https://wa.me/${cleanWhatsapp}?text=Hi%20TopThreadz%2C%20I%20need%20assistance.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-[#1fad53] hover:text-white hover:bg-[#1fad53] font-bold transition-all bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-200/80 shadow-sm shrink-0 text-xs sm:text-sm"
          >
            <FaWhatsapp className="w-5 h-5 text-[#25D366] shrink-0" />
            <span>Chat on WhatsApp ({whatsappNumber})</span>
          </a>
        </div>

        {/* ── MAIN FOOTER COLUMNS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* 1. Need Help */}
          <div className="bg-white/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-surface-200/60">
            <h4 className="text-surface-950 font-display font-bold text-sm uppercase tracking-wider mb-3.5 pb-2 border-b border-surface-300/80">
              Need Assistance
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5 text-surface-700 font-medium">
                <FiClock className="w-4 h-4 text-surface-900 shrink-0" />
                <span>{operatingDays}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-surface-900 shrink-0" />
                <a href={`tel:${phoneNumber.replace(/\s+/g, '')}`} className="hover:text-black transition-colors text-surface-800 font-semibold">
                  {phoneNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-surface-900 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-black transition-colors text-surface-800 font-semibold break-all">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* 2. Customer Service */}
          <div className="bg-white/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-surface-200/60">
            <h4 className="text-surface-950 font-display font-bold text-sm uppercase tracking-wider mb-3.5 pb-2 border-b border-surface-300/80">
              Customer Policies
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-surface-700">
              <li>
                <Link href="/privacy" className="hover:text-black transition-colors flex items-center gap-2">
                  <FiShield className="w-3.5 h-3.5 text-surface-500" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-black transition-colors flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5 text-surface-500" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-black transition-colors flex items-center gap-2">
                  <FiTruck className="w-3.5 h-3.5 text-surface-500" />
                  <span>Delivery Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-black transition-colors flex items-center gap-2">
                  <FiRefreshCw className="w-3.5 h-3.5 text-surface-500" />
                  <span>Exchange & Return Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-black transition-colors flex items-center gap-2">
                  <FiHelpCircle className="w-3.5 h-3.5 text-surface-500" />
                  <span>FAQ Page</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Our Brand */}
          <div className="bg-white/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-surface-200/60">
            <h4 className="text-surface-950 font-display font-bold text-sm uppercase tracking-wider mb-3.5 pb-2 border-b border-surface-300/80">
              Our Brand
            </h4>
            <ul className="space-y-2 text-xs text-surface-700 font-semibold">
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>100% Premium Blended Fabrics</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Boski-Inspired Soft Finish</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Standard 4.5m Unstitched Suits</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>All-Season Comfort & Quality</span>
              </li>
            </ul>
          </div>

          {/* 4. Quick Links */}
          <div className="bg-white/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-surface-200/60">
            <h4 className="text-surface-950 font-display font-bold text-sm uppercase tracking-wider mb-3.5 pb-2 border-b border-surface-300/80">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-surface-700">
              <li>
                <Link href="/products" className="hover:text-black transition-colors">
                  All Products Catalog
                </Link>
              </li>
              <li>
                <Link href="/products?sortBy=newest" className="hover:text-black transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-black transition-colors">
                  Track Order Status
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-black transition-colors">
                  Help & FAQs Page
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ── BOTTOM COPYRIGHT & LINKS BAR ── */}
        <div className="border-t border-surface-300/80 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-surface-600">
          <p>&copy; {new Date().getFullYear()} Top Threadz (MensWear.pk). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 font-semibold text-[11px]">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <span className="text-surface-400">•</span>
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <span className="text-surface-400">•</span>
            <Link href="/delivery" className="hover:text-black transition-colors">Delivery</Link>
            <span className="text-surface-400">•</span>
            <Link href="/returns" className="hover:text-black transition-colors">Exchanges</Link>
            <span className="text-surface-400">•</span>
            <Link href="/faq" className="hover:text-black transition-colors">FAQ</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
