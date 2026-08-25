'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  FiMail,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiHelpCircle,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiFileText,
  FiArrowRight,
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
    <footer className="block bg-[#f4f4f3] text-surface-800 font-sans border-t border-surface-300 pt-12 pb-28 lg:pb-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── FOOTER FAQ LINK BANNER (NO INLINE FAQS, DIRECT FULL PAGE BUTTON) ── */}
        <div className="mb-12 pb-10 border-b border-surface-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-soft border border-surface-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3.5 bg-surface-100 rounded-2xl text-surface-900 shrink-0">
                <FiHelpCircle className="w-7 h-7 text-black" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-surface-950">
                  Got Questions? Check Our FAQs
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 mt-1">
                  Find fast answers about fabric cutting, nationwide delivery, COD payments, and easy returns.
                </p>
              </div>
            </div>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-full bg-surface-950 px-6 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-surface-800 transition-all shadow-md shrink-0"
            >
              <span>View All FAQs</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── MAIN FOOTER COLUMNS (LIGHT THEME) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* 1. Need Help */}
          <div>
            <h4 className="text-surface-950 font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-300">
              Need Help
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=Hi%20TopThreadz%2C%20I%20need%20assistance.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-[#1fad53] hover:text-[#189244] font-bold transition-colors bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-sm"
                >
                  <FaWhatsapp className="w-4 h-4 shrink-0 text-[#25D366]" />
                  <span>WhatsApp: {whatsappNumber}</span>
                </a>
              </li>
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
          <div>
            <h4 className="text-surface-950 font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-300">
              Customer Service
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold text-surface-700">
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
          <div>
            <h4 className="text-surface-950 font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-300">
              Our Brand
            </h4>
            <p className="text-xs text-surface-600 leading-relaxed mb-3">
              Top Threadz delivers premium unstitched wash & wear menswear crafted for modern Pakistani elegance.
            </p>
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
          <div>
            <h4 className="text-surface-950 font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-300">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold text-surface-700">
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
                <Link href="/products?category=Shalwar+Kameez" className="hover:text-black transition-colors">
                  Unstitched Wash & Wear
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-black transition-colors">
                  Track Order Status
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-black transition-colors">
                  Help & FAQs
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ── BOTTOM COPYRIGHT & LINKS BAR ── */}
        <div className="border-t border-surface-300 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-surface-600">
          <p>&copy; {new Date().getFullYear()} Top Threadz (MensWear.pk). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-semibold">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <span className="text-surface-400">•</span>
            <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
            <span className="text-surface-400">•</span>
            <Link href="/delivery" className="hover:text-black transition-colors">Delivery Policy</Link>
            <span className="text-surface-400">•</span>
            <Link href="/returns" className="hover:text-black transition-colors">Exchange & Returns</Link>
            <span className="text-surface-400">•</span>
            <Link href="/faq" className="hover:text-black transition-colors">FAQ</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
