'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiHelpCircle, FiMail, FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const FAQS_LIST = [
  {
    category: 'Product & Quality',
    question: 'What is the fabric length and quality of Top Threadz unstitched suits?',
    answer:
      'All our unstitched suits come in standard 4.5 meter suit cuts. We offer premium blended wash & wear and Boski-inspired fabrics with a formal plain weave and soft finish, crafted specifically for all-season comfort across Pakistan.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How fast is delivery across Pakistan?',
    answer:
      'We provide fast delivery nationwide! Deliveries in major cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad) arrive within 2 to 3 business days. Other cities and rural areas take 3 to 5 business days.',
  },
  {
    category: 'Payment Methods',
    question: 'What payment methods do you accept?',
    answer:
      'We accept Cash on Delivery (COD) nationwide so you can inspect your package before payment, as well as secure online bank payment options.',
  },
  {
    category: 'Exchanges & Returns',
    question: 'What is your Exchange and Return policy?',
    answer:
      'We offer a 7-day hassle-free return and exchange policy. Provided the unstitched fabric remains unwashed, uncut, and in its original packaging with tags intact, you can exchange it or request a return easily.',
  },
  {
    category: 'Ordering & Support',
    question: 'How can I place an order or contact support?',
    answer:
      'You can place an order directly through our website or chat with our team on WhatsApp for instant assistance, custom inquiries, and order tracking support.',
  },
  {
    category: 'Washing & Care',
    question: 'How should I care for wash & wear and Boski fabric?',
    answer:
      'We recommend washing in cold or lukewarm water with mild detergents. Do not bleach or tumble dry on high heat. Iron on medium setting for a crisp, wrinkle-free finish.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => api.get('/settings/store').then((res) => res.data?.data),
    retry: false,
  });

  const whatsappNumber = settings?.whatsappNumber || '923009070520';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
  const phoneNumber = settings?.phoneNumber || '+92 300 1234567';
  const email = settings?.email || 'support@topthreadz.pk';

  return (
    <div className="min-h-screen bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-soft border border-surface-200">
        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black mb-6 transition-colors">
          <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Link>
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-surface-200">
          <div className="p-3 bg-surface-100 rounded-xl text-black">
            <FiHelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-950">Frequently Asked Questions</h1>
            <p className="text-xs text-surface-500 mt-1">Everything you need to know about Top Threadz products & services</p>
          </div>
        </div>

        <div className="space-y-4">
          {FAQS_LIST.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="border border-surface-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-display font-bold text-base text-surface-950 hover:bg-surface-50 transition-colors gap-3"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-100 text-surface-600 font-sans font-semibold shrink-0">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <div className="p-1 rounded-full bg-surface-100 text-surface-700 shrink-0">
                    {isOpen ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-sm text-surface-600 border-t border-surface-100 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-surface-950 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold">Still have questions?</h3>
            <p className="text-xs text-surface-400 mt-1">Our support team is online to assist you directly.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Hi%20TopThreadz%2C%20I%20have%20a%20question.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#20ba5a] transition-all"
            >
              <FaWhatsapp className="w-4 h-4" /> WhatsApp Us
            </a>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 rounded-full bg-surface-800 px-4 py-2 text-xs font-bold text-white border border-surface-700 hover:bg-surface-700 transition-all"
            >
              <FiMail className="w-4 h-4" /> Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
