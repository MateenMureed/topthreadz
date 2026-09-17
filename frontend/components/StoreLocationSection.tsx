import React from 'react';
import Link from 'next/link';
import {
  FiMapPin,
  FiClock,
  FiPhone,
  FiNavigation,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiExternalLink,
  FiMessageCircle,
} from 'react-icons/fi';

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/JnY6MPP9w9bBnfJd9';
const MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=Top+Threadz+Zamzama+Commercial+Area+Karachi&t=&z=16&ie=UTF8&iwloc=&output=embed';
const PHONE_NUMBER = '+92 300 9070520';
const WHATSAPP_URL = 'https://wa.me/923009070520?text=Hello%20Top%20Threadz,%20I%20would%20like%20to%20inquire%20about%20store%20timings%20and%20location.';

export default function StoreLocationSection() {
  return (
    <section
      id="store-location"
      className="w-full bg-[#fcfcfb] dark:bg-[#12161E] py-14 sm:py-20 border-t border-stone-200/80 dark:border-stone-800 transition-colors"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="font-serif italic text-xs sm:text-sm text-[#8C7355] tracking-widest uppercase block mb-1.5">
            Flagship Experience &bull; Online Convenience
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-normal tracking-[0.22em] text-[#1E2229] dark:text-white uppercase">
            VISIT OUR STORE OR SHOP ONLINE
          </h2>
          <div className="w-12 h-0.5 bg-[#8C7355] mx-auto my-3" />
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            Step inside our flagship outlet in Karachi to touch and feel our premium fabric weaves in person, or order from the comfort of your home with express delivery across Pakistan.
          </p>
        </div>

        {/* Dual Cards Grid: Physical Store vs Online Ordering */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch mb-10 sm:mb-12">
          {/* Card 1: Visit Our Store (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#191F2B] rounded-2xl border border-stone-200/90 dark:border-stone-800/80 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shadow-2xs">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-wide">
                      Top Threadz Flagship Store
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Zamzama Commercial Area &bull; Karachi
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open For Walk-ins
                </span>
              </div>

              {/* Key Store Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                    <FiMapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Exact Address
                  </p>
                  <p className="text-xs sm:text-[13px] text-stone-800 dark:text-stone-200 leading-snug">
                    Street 2, DHA Phase 5 Zamzama Commercial Area, Defence V, Karachi, 75600, Pakistan
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                    Plus Code: R28V+R3W Karachi
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Store Timings
                  </p>
                  <div className="text-xs sm:text-[13px] text-stone-800 dark:text-stone-200 leading-snug space-y-0.5">
                    <p><span className="font-semibold text-stone-900 dark:text-white">Mon &ndash; Sat:</span> 11:00 AM &ndash; 10:30 PM</p>
                    <p><span className="font-semibold text-stone-900 dark:text-white">Sunday:</span> 2:00 PM &ndash; 10:00 PM</p>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Air-conditioned showroom &bull; Valet parking nearby
                  </p>
                </div>
              </div>

              {/* In-store experience highlights */}
              <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-4 border border-stone-200/70 dark:border-stone-800 mb-6">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  What you will experience in store:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-stone-600 dark:text-stone-300">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355]" />
                    Touch &amp; drape fabric feel
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355]" />
                    Expert fit &amp; cut advice
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355]" />
                    Exclusive outlet editions
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#1E2229] hover:bg-black text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-xs hover:shadow-md"
              >
                <FiNavigation className="w-4 h-4" />
                <span>Get Directions On Google Maps</span>
                <FiExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all shadow-xs"
              >
                <FiMessageCircle className="w-4 h-4" />
                <span>Chat On WhatsApp</span>
              </a>

              <a
                href={`tel:${PHONE_NUMBER.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-1.5 border border-stone-300 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-300 text-stone-700 dark:text-stone-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                <FiPhone className="w-3.5 h-3.5 text-[#8C7355]" />
                <span>{PHONE_NUMBER}</span>
              </a>
            </div>
          </div>

          {/* Card 2: Shop Online / Nationwide Service (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1E2229] to-[#12161E] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-md border border-stone-800">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#8C7355]/30 text-[#E8C86A] text-[10px] font-bold uppercase tracking-widest border border-[#8C7355]/40">
                  Nationwide Delivery
                </span>
                <span className="text-[11px] text-stone-400">Available 24/7</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-normal tracking-wide text-white mb-2">
                Can&apos;t Visit In Person?
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed mb-6">
                Explore our complete catalog from anywhere in Pakistan. Every order is inspected, securely packed, and delivered directly to your doorstep with guaranteed authenticity.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#E8C86A]">
                    <FiTruck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">2 &ndash; 5 Working Days Delivery</p>
                    <p className="text-[11px] text-stone-400">Swift shipping across Karachi, Lahore, Islamabad, and all cities.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#E8C86A]">
                    <FiShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Cash on Delivery &amp; Free Shipping</p>
                    <p className="text-[11px] text-stone-400">Pay cash upon delivery. Free shipping on all orders over PKR 10,000.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-[#E8C86A]">
                    <FiShield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">7-Day Return &amp; Exchange Policy</p>
                    <p className="text-[11px] text-stone-400">Hassle-free exchanges if you need another shade or sizing.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/products"
                className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#1E2229] hover:bg-[#E8C86A] hover:text-black px-6 py-3 rounded-xl text-xs font-bold tracking-[0.16em] uppercase transition-all duration-200 shadow-md"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>Shop Full Online Catalog</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Embedded Interactive Map Card */}
        <div className="rounded-2xl overflow-hidden border border-stone-200/90 dark:border-stone-800 shadow-sm bg-white dark:bg-[#191F2B]">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                Live Google Maps Location &bull; Top Threadz Karachi
              </p>
            </div>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7355] hover:text-stone-950 dark:hover:text-white underline underline-offset-4 transition-colors"
            >
              <span>Open in Google Maps App</span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="relative w-full h-[320px] sm:h-[400px] bg-stone-100 dark:bg-stone-900">
            <iframe
              src={MAPS_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Top Threadz Karachi Flagship Store Location"
              className="w-full h-full grayscale-[15%] contrast-[105%] hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
