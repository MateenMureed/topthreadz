'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  FiMail,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiFileText,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const FOOTER_FAQS = [
  {
    q: 'What is the fabric cutting length of your unstitched suits?',
    a: 'All our unstitched suits come in standard 4.5 meter suit length, ideal for custom tailoring of all sizes.',
  },
  {
    q: 'How fast is delivery across Pakistan?',
    a: 'We offer fast shipping nationwide. Major cities are delivered in 2-3 business days, other cities in 3-5 business days.',
  },
  {
    q: 'What is your Exchange & Return policy?',
    a: 'We provide a 7-day hassle-free return and exchange policy for unwashed and uncut fabrics in original packaging.',
  },
  {
    q: 'What payment options do you support?',
    a: 'We accept Cash on Delivery (COD) across Pakistan as well as secure digital bank payments.',
  },
];

export default function Footer() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <footer className="block bg-[#0f1115] text-[#d1d5db] font-sans border-t border-surface-800 pt-12 pb-28 lg:pb-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── FOOTER FAQ ACCORDION SECTION ── */}
        <div className="mb-14 pb-12 border-b border-surface-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-surface-400">
                <FiHelpCircle className="w-4 h-4 text-emerald-400" />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                Have Questions? We&apos;ve Got Answers.
              </h3>
            </div>
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider bg-surface-800 hover:bg-surface-700 px-4 py-2 rounded-full border border-surface-700 transition-colors w-fit"
            >
              View All FAQs →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FOOTER_FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-xl border border-surface-800 bg-surface-900/90 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-white hover:bg-surface-800/50 transition-colors gap-3"
                  >
                    <span>{item.q}</span>
                    <div className="p-1 rounded-md bg-surface-800 text-surface-300 shrink-0">
                      {isOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-surface-300 leading-relaxed border-t border-surface-800/60 bg-surface-950/40">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN FOOTER COLUMNS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* 1. Need Help */}
          <div>
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-800/80">
              Need Help
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=Hi%20TopThreadz%2C%20I%20need%20assistance.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-[#25D366] hover:text-[#20ba5a] font-semibold transition-colors bg-surface-900 px-3.5 py-2 rounded-xl border border-[#25D366]/30 shadow-sm"
                >
                  <FaWhatsapp className="w-4 h-4 shrink-0" />
                  <span>WhatsApp: {whatsappNumber}</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-surface-300">
                <FiClock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{operatingDays}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${phoneNumber.replace(/\s+/g, '')}`} className="hover:text-white transition-colors text-surface-300 font-medium">
                  {phoneNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors text-surface-300 font-medium break-all">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* 2. Customer Service */}
          <div>
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-800/80">
              Customer Service
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-surface-300">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-2">
                  <FiShield className="w-3.5 h-3.5 text-surface-400" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5 text-surface-400" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-white transition-colors flex items-center gap-2">
                  <FiTruck className="w-3.5 h-3.5 text-surface-400" />
                  <span>Delivery Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors flex items-center gap-2">
                  <FiRefreshCw className="w-3.5 h-3.5 text-surface-400" />
                  <span>Exchange & Return Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors flex items-center gap-2">
                  <FiHelpCircle className="w-3.5 h-3.5 text-surface-400" />
                  <span>FAQ Page</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Our Brand */}
          <div>
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-800/80">
              Our Brand
            </h4>
            <p className="text-xs text-surface-400 leading-relaxed mb-3">
              Top Threadz provides premium unstitched wash & wear fabrics tailored for modern Pakistani elegance.
            </p>
            <ul className="space-y-2 text-xs text-surface-300 font-medium">
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>100% Premium Blended Fabrics</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Boski-Inspired Soft Finish</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Standard 4.5m Unstitched Suits</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>All-Season Durability & Comfort</span>
              </li>
            </ul>
          </div>

          {/* 4. Quick Links */}
          <div>
            <h4 className="text-white font-display font-bold text-base uppercase tracking-wider mb-4 pb-2 border-b border-surface-800/80">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-surface-300">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products Catalog
                </Link>
              </li>
              <li>
                <Link href="/products?sortBy=newest" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?category=Shalwar+Kameez" className="hover:text-white transition-colors">
                  Unstitched Wash & Wear
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Track Order Status
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ── BOTTOM COPYRIGHT & LINKS BAR ── */}
        <div className="border-t border-surface-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-surface-400">
          <p>&copy; {new Date().getFullYear()} Top Threadz (MensWear.pk). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-surface-700">•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="text-surface-700">•</span>
            <Link href="/delivery" className="hover:text-white transition-colors">Delivery Policy</Link>
            <span className="text-surface-700">•</span>
            <Link href="/returns" className="hover:text-white transition-colors">Exchange & Returns</Link>
            <span className="text-surface-700">•</span>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
