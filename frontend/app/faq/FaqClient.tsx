'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import ObfuscatedEmail from '@/components/ObfuscatedEmail';
import { FAQS_LIST, FAQ_CATEGORIES } from './faqsData';

export default function FaqClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const whatsappNumber = settings?.whatsappNumber || '923009070520';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
  const phoneNumber = settings?.phoneNumber || '+92 300 9070520';

  const filteredFaqs = FAQS_LIST.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q) ||
      faq.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-5 transition-colors bg-white px-3.5 py-2 rounded-full border border-surface-200 shadow-sm"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>

        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-surface-200 mb-6">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="p-3 bg-surface-950 text-white rounded-2xl shrink-0">
              <FiHelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400">Support Center</span>
              <h1 className="text-xl sm:text-3xl font-display font-bold text-surface-950">Frequently Asked Questions</h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
            Find instant answers about Top Threadz menswear collections, wash &amp; wear fabrics, nationwide delivery across Pakistan, Cash on Delivery payments, returns and exchange policies.
          </p>

          {/* Search Box */}
          <div className="mt-5 relative">
            <div className="h-11 rounded-2xl border border-surface-300 bg-surface-50 flex items-center px-3.5 gap-2 shadow-inner focus-within:bg-white focus-within:border-surface-800 transition-all">
              <FiSearch className="w-4 h-4 text-surface-400 shrink-0" />
              <input
                id="faq-search"
                name="faq-search"
                type="text"
                placeholder="Search questions (e.g. delivery, returns, wash & wear, size)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-xs sm:text-sm text-surface-900 placeholder:text-surface-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-surface-400 hover:text-surface-700"
                  aria-label="Clear search"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-4 overflow-x-auto scrollbar-hide -mx-2 px-2 pt-1 pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(0);
                  }}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${activeCategory === cat
                    ? 'bg-surface-950 text-white border-surface-950 shadow-sm'
                    : 'bg-surface-100 text-surface-700 border-surface-200 hover:border-surface-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.question}
                  className="border border-surface-200/90 rounded-2xl overflow-hidden bg-white shadow-soft transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-start justify-between p-4 sm:p-5 text-left font-display font-bold text-sm sm:text-base text-surface-950 hover:bg-surface-50/80 transition-colors gap-3"
                    aria-expanded={isOpen}
                  >
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-100 text-surface-700 font-sans font-bold border border-surface-200">
                        {faq.category}
                      </span>
                      <span className="leading-snug">{faq.question}</span>
                    </div>
                    <div className="p-1.5 rounded-full bg-surface-100 text-surface-700 shrink-0 mt-0.5">
                      {isOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-surface-600 border-t border-surface-100 leading-relaxed bg-surface-50/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-surface-200 text-center">
              <p className="text-sm font-semibold text-surface-600">No matching questions found.</p>
              <p className="text-xs text-surface-400 mt-1">Try a different search term or select &quot;All&quot; categories.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="mt-4 px-4 py-2 bg-surface-950 text-white rounded-full text-xs font-bold uppercase tracking-wider"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>

        {/* Support Banner */}
        <div className="mt-8 p-6 rounded-3xl bg-surface-950 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Customer Support</span>
            <h3 className="text-lg font-bold mt-0.5">Need More Help?</h3>
            <p className="text-xs text-surface-300 mt-1">Our customer care team is available to assist you with sizing, fabric advice and order updates.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Hi%20TopThreadz%2C%20I%20have%20a%20question.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#20ba5a] transition-all"
            >
              <FaWhatsapp className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <FiPhone className="w-4 h-4" /> Call
            </a>
            <ObfuscatedEmail className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition-all">
              <FiMail className="w-4 h-4" /> Email
            </ObfuscatedEmail>
          </div>
        </div>
      </div>
    </div>
  );
}
