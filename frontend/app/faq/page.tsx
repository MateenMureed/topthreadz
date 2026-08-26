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

const FAQS_LIST = [
  {
    category: 'Product & Quality',
    question: 'What type of fabric does Top Threadz sell?',
    answer:
      'Top Threadz specializes in premium unstitched men’s fabric in Pakistan, including wash & wear and other selected fabrics. Our collection is designed for a clean, comfortable and premium formal look.',
  },
  {
    category: 'Product & Quality',
    question: 'How much fabric is included in one suit?',
    answer:
      'Our standard unstitched men’s suit fabric is provided according to the product specification shown on the individual product page. Please check the product details before placing your order for the exact fabric length and included pieces.',
  },
  {
    category: 'Product & Quality',
    question: 'Are Top Threadz fabrics unstitched?',
    answer:
      'Yes. Top Threadz primarily offers unstitched men’s fabric. The fabric is supplied for customers who want to have it stitched according to their preferred style, size and design.',
  },
  {
    category: 'Product & Quality',
    question: 'Do the actual fabric colors look exactly like the website images?',
    answer:
      'We make every effort to display product colors as accurately as possible. However, colors may appear slightly different depending on your screen, device settings, lighting and photography conditions.',
  },
  {
    category: 'Product & Quality',
    question: 'Is Top Threadz fabric suitable for everyday wear?',
    answer:
      'Our collection includes fabrics designed for comfortable everyday and formal wear. Please check the individual product description for specific information about the fabric, finish, season and recommended use.',
  },

  {
    category: 'Shipping & Delivery',
    question: 'Do you deliver across Pakistan?',
    answer:
      'Yes. Top Threadz provides delivery across Pakistan through available courier and logistics partners. Delivery availability and charges may vary depending on your location.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How long does delivery take?',
    answer:
      'Delivery time depends on your location, courier availability, order processing and other operational factors. Estimated delivery information may be displayed during checkout or communicated after your order is confirmed.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How much does delivery cost?',
    answer:
      'Shipping charges depend on the delivery location, parcel size, applicable promotions and courier charges. The applicable delivery fee, if any, will normally be shown during checkout before you confirm your order.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How can I track my Top Threadz order?',
    answer:
      'Once your order has been dispatched, tracking information may be provided through your account, email, SMS, WhatsApp or another available notification method. You can use the tracking ID to check your parcel status with the relevant courier.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Can I change my delivery address after placing an order?',
    answer:
      'Please contact Top Threadz as soon as possible if you need to change your delivery address. Address changes may only be possible before the order is dispatched. Once the parcel has been handed over to the courier, changes may not be possible.',
  },

  {
    category: 'Payment Methods',
    question: 'What payment methods does Top Threadz accept?',
    answer:
      'Available payment methods may include Cash on Delivery (COD), bank transfer and online payment options. The payment methods available to you will be displayed during checkout.',
  },
  {
    category: 'Payment Methods',
    question: 'Is Cash on Delivery available?',
    answer:
      'Cash on Delivery may be available for eligible orders within Pakistan. Availability can depend on your delivery location, order value and other operational conditions.',
  },
  {
    category: 'Payment Methods',
    question: 'Is online payment secure?',
    answer:
      'When online payment is available, payment information is processed through the applicable payment service provider using appropriate security measures. Top Threadz does not intentionally store complete payment card details on its own systems unless explicitly stated.',
  },
  {
    category: 'Payment Methods',
    question: 'What should I do if my payment was deducted but my order was not confirmed?',
    answer:
      'If your account was charged but your order was not successfully confirmed, please contact Top Threadz support with your payment transaction details and, if available, your Order ID. We will review the transaction and assist you according to the applicable payment and refund procedures.',
  },

  {
    category: 'Exchanges & Returns',
    question: 'What is Top Threadz’s return and exchange policy?',
    answer:
      'Returns and exchanges are subject to the current Top Threadz Return & Exchange Policy. Please review that policy before returning a product, as eligibility may depend on the condition of the fabric, packaging, tags and the time period specified in the policy.',
  },
  {
    category: 'Exchanges & Returns',
    question: 'Can I return fabric after it has been cut or stitched?',
    answer:
      'Products that have been cut, stitched, altered, washed or otherwise used may not be eligible for return or exchange. Please review our Return & Exchange Policy for the complete eligibility requirements before altering the fabric.',
  },
  {
    category: 'Exchanges & Returns',
    question: 'What should I do if I receive a damaged or incorrect product?',
    answer:
      'Please contact Top Threadz customer support as soon as possible and provide your Order ID along with clear photographs or other relevant information about the issue. Our team will review the matter and guide you through the applicable resolution process.',
  },

  {
    category: 'Ordering & Support',
    question: 'How can I place an order?',
    answer:
      'Select your desired products, choose the required quantity or available options, add the products to your shopping bag and proceed to checkout. Enter your delivery information, select an available payment method and confirm your order.',
  },
  {
    category: 'Ordering & Support',
    question: 'How do I know if my order was successfully placed?',
    answer:
      'After successfully placing your order, you should receive an order confirmation through the available email, SMS, WhatsApp or website notification system. You may also be able to view the order through your account.',
  },
  {
    category: 'Ordering & Support',
    question: 'Can I cancel my order?',
    answer:
      'If you need to cancel an order, contact Top Threadz as soon as possible. Cancellation may only be possible before the order has been processed or dispatched.',
  },
  {
    category: 'Ordering & Support',
    question: 'Can I change products in my order after checkout?',
    answer:
      'Please contact us immediately if you need to change your order. Changes are subject to product availability and order status. Once an order has entered processing or has been dispatched, changes may no longer be possible.',
  },
  {
    category: 'Ordering & Support',
    question: 'How can I contact Top Threadz customer support?',
    answer:
      'You can contact Top Threadz through the support options provided on our website, including WhatsApp, phone or email where available. Our team can assist with orders, products, delivery and other customer questions.',
  },

  {
    category: 'Washing & Care',
    question: 'How should I wash Top Threadz wash & wear fabric?',
    answer:
      'For best results, follow the care instructions provided with the specific product. In general, use a suitable mild detergent and avoid excessive heat or harsh chemicals. Always check the product-specific care instructions before washing.',
  },
  {
    category: 'Washing & Care',
    question: 'Can I use bleach on the fabric?',
    answer:
      'We generally recommend avoiding bleach and harsh chemicals unless the specific product care instructions state otherwise, as they may affect the fabric color, finish or fibers.',
  },
  {
    category: 'Washing & Care',
    question: 'How should I iron the fabric?',
    answer:
      'Use an appropriate iron temperature for the specific fabric and follow the product care instructions. Avoid excessive heat, particularly on delicate or blended fabrics.',
  },
  {
    category: 'Washing & Care',
    question: 'How can I keep my fabric looking fresh and wrinkle-free?',
    answer:
      'Follow the recommended washing and ironing instructions for the product. Avoid excessive heat during washing and drying, and store the fabric clean and properly folded when not in use.',
  },
];

const CATEGORIES = [
  'All',
  'Product & Quality',
  'Shipping & Delivery',
  'Payment Methods',
  'Exchanges & Returns',
  'Ordering & Support',
  'Washing & Care',
];

export default function FAQPage() {
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
  const phoneNumber = settings?.phoneNumber || '+92 300 1234567';
  const email = settings?.email || 'support@topthreadz.pk';

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

        {/* Page Header Header */}
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
            Find answers to common questions about fabric cuts, nationwide delivery, Cash on Delivery payments, and returns.
          </p>

          {/* Search Box */}
          <div className="mt-5 relative">
            <div className="h-11 rounded-2xl border border-surface-300 bg-surface-50 flex items-center px-3.5 gap-2 shadow-inner focus-within:bg-white focus-within:border-surface-800 transition-all">
              <FiSearch className="w-4 h-4 text-surface-400 shrink-0" />
              <input
                type="text"
                placeholder="Search questions (e.g. delivery, returns, wash)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-xs sm:text-sm text-surface-900 placeholder:text-surface-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-surface-400 hover:text-surface-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-4 overflow-x-auto scrollbar-hide -mx-2 px-2 pt-1 pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {CATEGORIES.map((cat) => (
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
              <p className="text-xs text-surface-400 mt-1">Try a different search term or select "All" categories.</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">24/7 Customer Care</span>
            <h3 className="text-lg font-bold mt-0.5">Need More Help?</h3>
            <p className="text-xs text-surface-300 mt-1">Our support agents are active on WhatsApp and email.</p>
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
            <a
              href={`mailto:${email}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <FiMail className="w-4 h-4" /> Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
