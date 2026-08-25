'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { FiMail, FiPhone, FiClock, FiCheckCircle } from 'react-icons/fi';
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
    <footer className="block bg-surface-950 text-surface-300 mt-16 pb-24 lg:pb-0 font-sans border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* 1. Need Help */}
          <div>
            <h3 className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
              Need Help
            </h3>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=Hi%20TopThreadz%2C%20I%20need%20assistance.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-[#25D366] hover:text-[#20ba5a] font-semibold transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-[#25D366]/20"
                >
                  <FaWhatsapp className="w-4 h-4 shrink-0" />
                  <span>WhatsApp: {whatsappNumber}</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-surface-400">
                <FiClock className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{operatingDays}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-brand-400 shrink-0" />
                <a href={`tel:${phoneNumber.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                  {phoneNumber}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-brand-400 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors break-all">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* 2. Customer Service */}
          <div>
            <h3 className="text-white font-display font-bold text-lg mb-4">Customer Service</h3>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-white transition-colors">
                  Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Exchange & Return Policy
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Our Brand */}
          <div>
            <h3 className="text-white font-display font-bold text-lg mb-4">Our Brand</h3>
            <p className="text-xs text-surface-400 leading-relaxed mb-3">
              Top Threadz is committed to delivering exceptional unstitched menswear tailored for Pakistan&apos;s climate and heritage.
            </p>
            <ul className="space-y-2 text-xs text-surface-300">
              <li className="flex items-start gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>100% Premium Blended Fabric</span>
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
                <span>All-Season Comfort & Durability</span>
              </li>
            </ul>
          </div>

          {/* 4. Quick Links */}
          <div>
            <h3 className="text-white font-display font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-surface-400">
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
                  My Orders & Tracking
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-surface-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-surface-500">
          <p>&copy; {new Date().getFullYear()} Top Threadz (MensWear.pk). All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-surface-300">Privacy</Link>
            <span className="text-surface-700">•</span>
            <Link href="/terms" className="hover:text-surface-300">Terms</Link>
            <span className="text-surface-700">•</span>
            <Link href="/delivery" className="hover:text-surface-300">Delivery</Link>
            <span className="text-surface-700">•</span>
            <Link href="/returns" className="hover:text-surface-300">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
