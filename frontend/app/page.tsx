'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiTruck,
  FiHeadphones,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import api from '@/services/api';
import ProductGrid from '@/components/ProductGrid';

const FAQS = [
  {
    question: 'What is the suit length and fabric quality of Top Threadz unstitched suits?',
    answer:
      'All our unstitched suits come in standard 4.5 meter cutting. We craft premium blended wash & wear and Boski-inspired fabrics with a soft finish and plain weave, designed specifically for all-season comfort in Pakistan.',
  },
  {
    question: 'How fast is delivery across Pakistan?',
    answer:
      'We offer quick shipping on all orders nationwide! Orders placed for major cities (Lahore, Islamabad, Karachi, Rawalpindi, Faisalabad) arrive in 2 to 3 business days. Other cities and rural locations are delivered within 3 to 5 business days.',
  },
  {
    question: 'What payment methods are available?',
    answer:
      'We support Cash on Delivery (COD) for your convenience anywhere in Pakistan, as well as verified digital payment channels.',
  },
  {
    question: 'What is your Exchange & Return policy?',
    answer:
      'We offer a hassle-free 7-day exchange and return policy. If the unstitched fabric is unwashed, uncut, and in its original packaging with tags, you can easily exchange it or request a return by contacting our support team.',
  },
  {
    question: 'How can I place an order or contact customer support?',
    answer:
      'You can easily order directly through our website or click the WhatsApp chat button on screen for 24/7 customer assistance and order inquiries.',
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { data: heroResponse } = useQuery({
    queryKey: ['home', 'hero-banner'],
    queryFn: () => api.get('/settings/hero-banner').then((response) => response.data),
    retry: false,
  });

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['home', 'products'],
    queryFn: () => productService.getAll({ limit: 50, sortBy: 'newest' }),
  });

  const products = productsResponse?.data?.products || [];
  const heroBanner = heroResponse?.data?.url as string | undefined;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-white text-black">
      {/* Hero Section */}
      <section className="relative border-b border-surface-300 overflow-hidden bg-surface-950 text-white">
        {heroBanner ? (
          <div className="relative w-full group">
            <Link href="/products" className="block" aria-label="Shop all products">
              <img
                src={heroBanner}
                alt="Top Threadz collection"
                className="block h-auto w-full object-cover"
              />
            </Link>
            {/* Scroll Down Indicator */}
            <a
              href="#catalog"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/90 hover:text-white transition-all bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg text-[10px] sm:text-xs font-bold tracking-widest uppercase"
            >
              <span>Explore Collection</span>
              <FiChevronDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        ) : (
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
            <p className="brand-wordmark text-xs uppercase tracking-[0.25em] text-surface-400 font-bold">Top Threadz</p>
            <h1 className="mt-4 text-4xl md:text-6xl font-display font-bold leading-tight text-white">
              Pure Style.
              <br />
              Pure Confidence.
            </h1>
            <p className="mt-5 text-surface-300 max-w-2xl mx-auto text-sm md:text-base">
              Black and white essentials for modern menswear. Discover premium drops, unstitched wash & wear fabrics, and bold sale picks.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="btn-primary !bg-white !text-surface-950 hover:!bg-surface-100 !px-7 !py-3.5 text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Shop All <FiArrowRight className="inline ml-2" />
              </Link>
              <Link
                href="/products?sortBy=newest"
                className="rounded-full border-2 border-white/80 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-surface-950 shadow-sm"
              >
                New Arrivals
              </Link>
            </div>

            {/* Scroll Down Indicator */}
            <div className="mt-12 flex justify-center">
              <a
                href="#catalog"
                className="inline-flex flex-col items-center gap-1 text-surface-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <span>Explore Collection</span>
                <FiChevronDown className="w-4 h-4 animate-bounce text-white mt-1" />
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Product Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Section Heading with Small-Caps Subtitle & Horizontal Rule */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500 shrink-0">
              PREMIUM WASH & WEAR • SHOP OUR COLLECTION
            </span>
            <div className="h-px flex-1 bg-surface-200" />
          </div>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-surface-950 uppercase tracking-tight">
            Shop Our Collection
          </h2>
        </div>

        <ProductGrid products={products} loading={isLoading} showGridControls={false} />
      </section>

      {/* Post-Catalog Feature Badges Section */}
      <section className="bg-surface-100 border-y border-surface-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fast Delivery */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiTruck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">Fast Delivery</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">Quick shipping on all orders nationwide.</p>
              </div>
            </div>

            {/* Support */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiHeadphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">Support</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">We’re here 24/7 to help with any inquiries.</p>
              </div>
            </div>

            {/* Premium Quality */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">100% Authentic</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">4.5m unstitched Boski & wash n wear suits.</p>
              </div>
            </div>

            {/* Easy Returns */}
            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-3 bg-surface-950 text-white rounded-xl shrink-0">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-surface-950">Hassle-Free Returns</h3>
                <p className="text-xs text-surface-600 mt-1 leading-relaxed">7-day easy exchange & money-back policy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-surface-500">GOT QUESTIONS?</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-surface-950 mt-1">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-surface-600 mt-2 max-w-xl mx-auto">
            Everything you need to know about our products, order delivery, and fabric care.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.question}
                className="border border-surface-200 rounded-2xl bg-white overflow-hidden shadow-soft transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-base md:text-lg text-surface-950 hover:bg-surface-50 transition-colors gap-4"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <div className="p-1 rounded-full bg-surface-100 text-surface-700 shrink-0">
                    {isOpen ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-surface-600 border-t border-surface-100 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
