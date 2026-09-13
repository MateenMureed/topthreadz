import Link from 'next/link';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';

export interface CategoryFaq {
  question: string;
  answer: string;
}

export function getCategoryFaqs(categoryName: string): CategoryFaq[] {
  const lower = categoryName.toLowerCase();

  if (lower.includes('unstitched') || lower.includes('fabric')) {
    return [
      {
        question: `How much unstitched fabric is provided in Top Threadz ${categoryName} suits?`,
        answer: `Top Threadz unstitched suits come in generous 4.0-meter or 4.5-meter cuts with double-width (54–56 inch arz), giving your tailor enough yardage for a full shalwar kameez or kurta trouser.`,
      },
      {
        question: `Does Top Threadz wash & wear fabric shrink?`,
        answer: `Our wash & wear fabrics are pre-stabilized to keep shrinkage below 1%. For the sharpest tailor finish, we recommend dipping the fabric in cold water for 15 minutes before cutting.`,
      },
      {
        question: `Are buttons and brand tags included with unstitched fabric?`,
        answer: `Yes, each unstitched suit comes with matching premium buttons and woven signature brand tags in luxury packaging.`,
      },
      {
        question: `How does Top Threadz deliver unstitched fabric across Pakistan?`,
        answer: `We deliver nationwide to all cities and towns via reliable courier partners with Cash on Delivery (COD) and fast 2–4 business days delivery.`,
      },
    ];
  }

  if (lower.includes('stitched') || lower.includes('kurta')) {
    return [
      {
        question: `What sizes are available in Top Threadz ${categoryName}?`,
        answer: `Our stitched collections are available in Small (38-40" chest), Medium (42-43" chest), Large (45-46" chest), and X-Large (48-49" chest). Check our detailed Size Guide for sleeve and collar measurements.`,
      },
      {
        question: `Is Cash on Delivery available for ${categoryName}?`,
        answer: `Yes, Cash on Delivery is available across Pakistan. You can inspect the sealed flyer and pay upon delivery.`,
      },
      {
        question: `Can I exchange the size if it doesn't fit?`,
        answer: `Yes! We offer a hassle-free 7-day exchange policy for unworn items with tags intact. Contact our WhatsApp support team to arrange a swift size swap.`,
      },
      {
        question: `What fabric is used for Top Threadz ${categoryName}?`,
        answer: `We use premium wrinkle-resistant wash & wear, breathable cotton blends, and luxury soft weaves designed specifically for Pakistani weather and everyday comfort.`,
      },
    ];
  }

  if (lower.includes('kid') || lower.includes('boy')) {
    return [
      {
        question: `What age groups are covered in Top Threadz Kids collection?`,
        answer: `Our boys' collection spans ages 4 to 14 years, tailored in comfortable, soft, skin-friendly fabrics for Eid, weddings, and formal events.`,
      },
      {
        question: `Are kids' clothes comfortable for all-day wear?`,
        answer: `Yes, we use soft-washed, breathable fabrics with smooth inner collar fusing and non-scratch seams so children stay comfortable all day.`,
      },
      {
        question: `How fast is delivery for children's Eid & wedding wear?`,
        answer: `Delivery across Karachi is 2–3 business days, and other cities in Pakistan typically take 3–5 business days.`,
      },
    ];
  }

  // Generic fallback for any other category (Waistcoat, Two Piece, Three Piece, etc.)
  return [
    {
      question: `Why choose Top Threadz for ${categoryName}?`,
      answer: `Top Threadz specializes in premium Pakistani menswear with high-grade wash & wear fabrics, impeccable finishes, and fast nationwide delivery from our Karachi flagship store.`,
    },
    {
      question: `What are the shipping charges for ${categoryName} in Pakistan?`,
      answer: `We offer flat PKR 200 shipping nationwide and free shipping on eligible order thresholds. Orders are handled by express couriers with tracking.`,
    },
    {
      question: `Can I pay with Cash on Delivery (COD)?`,
      answer: `Yes, Cash on Delivery is accepted across Pakistan for all ${categoryName} items.`,
    },
    {
      question: `Where can I see the ${categoryName} collection in person?`,
      answer: `You can visit our flagship retail outlet at Street 2, DHA Phase 5 Zamzama Commercial Area, Defence V, Karachi.`,
    },
  ];
}

export default function CategoryFaqBlock({ categoryName }: { categoryName: string }) {
  const faqs = getCategoryFaqs(categoryName);

  return (
    <section className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-surface-200 shadow-soft space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-surface-100 text-surface-900 rounded-xl">
          <FiHelpCircle className="w-5 h-5 text-[#B88728]" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B88728]">
            Frequently Asked Questions
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-surface-950">
            {categoryName} Questions &amp; Answers
          </h2>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            className="group border border-surface-200/90 rounded-2xl overflow-hidden bg-surface-50/40 p-4 transition-all open:bg-white open:shadow-sm"
          >
            <summary className="flex items-center justify-between cursor-pointer font-bold text-sm sm:text-base text-surface-950 list-none gap-3">
              <span>{faq.question}</span>
              <FiChevronDown className="w-4 h-4 text-surface-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-surface-600 leading-relaxed border-t border-surface-100 pt-3">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <div className="pt-4 border-t border-surface-100 flex flex-wrap items-center justify-between gap-3 text-xs text-surface-500">
        <span>Need more help choosing the right size or fabric?</span>
        <div className="flex items-center gap-4 font-bold text-surface-950">
          <Link href="/size-guide" className="hover:text-[#B88728] underline underline-offset-4">
            Size Guide
          </Link>
          <Link href="/faq" className="hover:text-[#B88728] underline underline-offset-4">
            All FAQs
          </Link>
        </div>
      </div>
    </section>
  );
}
