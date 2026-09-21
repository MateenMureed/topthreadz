'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { IconType } from 'react-icons';
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiCopy,
  FiMapPin,
  FiNavigation,
  FiShield,
  FiShoppingBag,
  FiTruck,
} from 'react-icons/fi';

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/JnY6MPP9w9bBnfJd9';
const MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=Top+Threadz+Zamzama+Commercial+Area+Karachi&t=&z=16&ie=UTF8&iwloc=&output=embed';
const ADDRESS = 'Street 2, DHA Phase 5 Zamzama Commercial Area, Defence V, Karachi, 75600, Pakistan';
const PLUS_CODE = 'R28V+R3W Karachi';
const STORE_TIMEZONE = 'Asia/Karachi';

/* -------------------------------------------------------------------------- */
/*  Store hours: single source of truth for the list AND the live open badge   */
/* -------------------------------------------------------------------------- */

type Hours = { open: number; close: number }; // minutes from midnight

const WEEKDAY: Hours = { open: 9 * 60, close: 12 * 60 }; // 9:00 AM – 12:00 PM
// Index = JS weekday (0 = Sunday). null = store closed (online orders stay open 24/7).
const WEEKLY_HOURS: (Hours | null)[] = [null, WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, WEEKDAY, null];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOURS_ROWS: { label: string; days: number[]; hours: Hours | null }[] = [
  { label: 'Mon – Fri', days: [1, 2, 3, 4, 5], hours: WEEKDAY },
  { label: 'Sat & Sun', days: [6, 0], hours: null },
];

const formatTime = (minutes: number) => {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  return `${h24 % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

type StoreStatus = { isOpen: boolean; day: number; message: string };

// Always evaluated in Karachi time, whatever timezone the visitor's device is in.
function getStoreStatus(now: Date = new Date()): StoreStatus | null {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const day = DAY_NAMES.indexOf(get('weekday'));
  if (day < 0) return null;
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  const today = WEEKLY_HOURS[day];

  if (today) {
    if (minutes >= today.open && minutes < today.close) {
      return { isOpen: true, day, message: `Open now · until ${formatTime(today.close)}` };
    }
    if (minutes < today.open) {
      return { isOpen: false, day, message: `Closed · opens today at ${formatTime(today.open)}` };
    }
  }

  // Find the next day the store is open (skips Sat & Sun)
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (day + offset) % 7;
    const next = WEEKLY_HOURS[nextDay];
    if (next) {
      const when = offset === 1 ? 'tomorrow' : FULL_DAY_NAMES[nextDay];
      return { isOpen: false, day, message: `Closed · opens ${when} at ${formatTime(next.open)}` };
    }
  }
  return { isOpen: false, day, message: 'Closed' };
}

const IN_STORE_PERKS = ['Touch & drape fabric feel', 'Expert fit & cut advice', 'Exclusive outlet editions'];

const ONLINE_FEATURES: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FiTruck,
    title: '2 – 5 working days delivery',
    text: 'Swift shipping across Karachi, Lahore, Islamabad, and all cities.',
  },
  {
    icon: FiShoppingBag,
    title: 'Cash on delivery & free shipping',
    text: 'Pay cash upon delivery. Free shipping on all orders over PKR 10,000.',
  },
  {
    icon: FiShield,
    title: '7-day return & exchange',
    text: 'Hassle-free exchanges if you need another shade or sizing.',
  },
];

const eyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400';

export default function StoreLocationSection() {
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const mapWrapRef = useRef<HTMLDivElement>(null);

  // Computed after mount so server and client HTML always match.
  useEffect(() => {
    const update = () => setStatus(getStoreStatus());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  // An embedded map traps touch/scroll gestures on phones. It stays inert until
  // tapped, and goes inert again as soon as the visitor touches anything else.
  useEffect(() => {
    if (!mapActive) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!mapWrapRef.current?.contains(e.target as Node)) setMapActive(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mapActive]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing else to do */
    }
  };

  return (
    <section
      id="store-location"
      aria-labelledby="store-location-heading"
      className="w-full border-t border-stone-200/80 bg-[#FAFAF8] py-12 transition-colors dark:border-stone-800 dark:bg-[#12161E] sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        {/* Heading: same pattern as the other homepage sections (title + italic tagline) */}
        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <h2
            id="store-location-heading"
            className="text-lg font-normal uppercase tracking-[0.22em] text-[#1E2229] dark:text-white sm:text-2xl md:text-3xl"
          >
            Visit Our Store or Shop Online
          </h2>
          <p className="mt-2 font-serif text-sm italic text-stone-500 dark:text-stone-400">
            Our flagship outlet in Karachi, and express delivery across Pakistan
          </p>
        </header>

        {/*
          Phone: info → map → online (single column).
          Desktop: info + online side by side on top, compact full-width map underneath.
        */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6">
          {/* ------------------------------ STORE INFO ------------------------------ */}
          <article className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#191F2B] sm:p-6 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className={eyebrowClass}>Flagship store</span>
              <span className="inline-flex min-h-[28px] items-center">
                {status ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${status.isOpen
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? 'animate-pulse bg-emerald-500' : 'bg-stone-400'
                        }`}
                    />
                    {status.message}
                  </span>
                ) : null}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold tracking-wide text-[#1E2229] dark:text-white sm:text-2xl">
              Top Threadz Flagship Store
            </h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Zamzama Commercial Area, Karachi</p>

            <dl className="mt-5 grid gap-5 border-t border-stone-100 pt-5 dark:border-stone-800 md:grid-cols-2 md:gap-8">
              {/* Address */}
              <div className="flex gap-3">
                <FiMapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />
                <div className="min-w-0 flex-1">
                  <dt className={eyebrowClass}>Address</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-stone-800 dark:text-stone-200">{ADDRESS}</dd>
                  <dd className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="font-mono text-xs text-stone-500 dark:text-stone-400">Plus Code: {PLUS_CODE}</span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-200 px-3 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-900 dark:border-stone-700 dark:text-stone-200 dark:hover:border-stone-300"
                    >
                      {copied ? (
                        <FiCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <FiCopy aria-hidden="true" className="h-3.5 w-3.5" />
                      )}
                      <span aria-live="polite">{copied ? 'Copied' : 'Copy address'}</span>
                    </button>
                  </dd>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-3">
                <FiClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />
                <div className="min-w-0 flex-1">
                  <dt className={eyebrowClass}>Store hours</dt>
                  <dd className="mt-1">
                    <ul className="divide-y divide-stone-100 text-sm dark:divide-stone-800">
                      {HOURS_ROWS.map((row) => {
                        const isToday = status ? row.days.includes(status.day) : false;
                        return (
                          <li
                            key={row.label}
                            className={`flex items-center justify-between gap-3 py-2 ${isToday
                              ? 'font-semibold text-stone-900 dark:text-white'
                              : 'text-stone-600 dark:text-stone-300'
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              {row.label}
                              {isToday ? (
                                <span className="rounded bg-navy px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white dark:bg-white dark:text-navy">
                                  Today
                                </span>
                              ) : null}
                            </span>
                            <span className="tabular-nums">
                              {row.hours
                                ? `${formatTime(row.hours.open)} – ${formatTime(row.hours.close)}`
                                : 'Closed'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Air-conditioned showroom · Valet parking nearby
                    </p>
                  </dd>
                </div>
              </div>
            </dl>

            {/* In-store perks */}
            <ul className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-5 dark:border-stone-800">
              {IN_STORE_PERKS.map((perk) => (
                <li
                  key={perk}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-200"
                >
                  <FiCheck aria-hidden="true" className="h-3 w-3 shrink-0 text-emerald-600" />
                  {perk}
                </li>
              ))}
            </ul>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-navy px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:ring-offset-2 dark:bg-white dark:text-[#1E2229] dark:hover:bg-stone-200"
            >
              <FiNavigation aria-hidden="true" className="h-4 w-4" />
              Get directions
            </a>
          </article>

          {/* --------------------------------- MAP ---------------------------------- */}
          <div
            ref={mapWrapRef}
            className="relative h-[220px] overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900 sm:h-[260px] lg:col-span-12 lg:col-start-1 lg:row-start-2 lg:h-[300px]"
          >
            <iframe
              src={MAPS_EMBED_URL}
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Top Threadz Karachi Flagship Store Location"
              className="absolute inset-0 h-full w-full"
            />
            {!mapActive ? (
              <button
                type="button"
                onClick={() => setMapActive(true)}
                aria-label="Activate the map to pan and zoom"
                className="absolute inset-0 z-10 flex items-end justify-center pb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-stone-800 shadow-md backdrop-blur">
                  <FiMapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  Tap to explore the map
                </span>
              </button>
            ) : null}
          </div>

          {/* ------------------------------ SHOP ONLINE ----------------------------- */}
          <article className="flex flex-col rounded-xl border border-navy bg-navy p-5 text-white dark:border-stone-800 sm:p-6 lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-300">
              Nationwide delivery <span className="mx-1 text-stone-500">·</span>
              <span className="font-normal normal-case tracking-normal text-stone-400">Available 24/7</span>
            </p>
            <h3 className="mt-3 font-serif text-2xl font-normal tracking-wide">Can&apos;t visit in person?</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Explore our complete catalog from anywhere in Pakistan. Every order is inspected, securely packed, and
              delivered directly to your doorstep with guaranteed authenticity.
            </p>

            <ul className="mt-5 space-y-4">
              {ONLINE_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-300">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <Link
                href="/products"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-xs font-bold uppercase tracking-[0.14em] text-navy transition-colors hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
              >
                Shop full catalog
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}