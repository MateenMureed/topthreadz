export interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

export const FAQS_LIST: FaqItem[] = [
  {
    category: 'Product & Quality',
    question: 'What does Top Threadz sell?',
    answer:
      'Top Threadz is a multi-category menswear retailer based in Pakistan. Our collections include premium wash & wear unstitched fabrics, stitched garments, two-piece and three-piece suits, and kids\' wear designed for men who value premium quality and modern style.',
  },
  {
    category: 'Product & Quality',
    question: 'What is included in an unstitched suit?',
    answer:
      'Unstitched suits include standard 4-meter or 4.5-meter fabric lengths (as specified on each product page) tailored for Pakistani men\'s shalwar kameez or kurta pajama, along with branded buttons and signature packaging tags.',
  },
  {
    category: 'Product & Quality',
    question: 'Do you only sell unstitched fabric?',
    answer:
      'No. While unstitched fabric is our signature heritage collection, we offer a full range of menswear including ready-to-wear stitched kurtas, two-piece and three-piece suits, waistcoats, and festive kids\' collections.',
  },
  {
    category: 'Product & Quality',
    question: 'Do the actual colors look exactly like the website images?',
    answer:
      'We shoot all products under studio lighting to represent colors as accurately as possible. Slight variations may occur depending on your screen calibration, display profile, or ambient lighting conditions.',
  },
  {
    category: 'Product & Quality',
    question: 'Is Top Threadz clothing suitable for everyday wear and Pakistan’s summer?',
    answer:
      'Yes. Our signature wash & wear and lightweight blended cotton fabrics are specifically engineered for breathability, wrinkle resistance, and comfort in Pakistan\'s hot and humid weather.',
  },

  {
    category: 'Shipping & Delivery',
    question: 'Do you deliver across Pakistan?',
    answer:
      'Yes, Top Threadz delivers to all cities, towns, and postal codes across Pakistan (including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, and beyond) via trusted courier partners like Leopards, TCS, and Trax.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How long does delivery take?',
    answer:
      'Orders in Karachi are typically delivered within 2–3 business days. Delivery to other major cities takes 3–5 business days, and remote areas may take 5–7 business days.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How much does shipping cost?',
    answer:
      'Standard nationwide shipping is flat PKR 200, and free delivery is provided on orders above PKR 5,000 or PKR 10,000 depending on active seasonal promotions.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'How can I track my order?',
    answer:
      'Once your parcel is dispatched, you will receive an SMS and email containing your courier tracking number and a direct tracking link.',
  },
  {
    category: 'Shipping & Delivery',
    question: 'Can I change my delivery address after placing an order?',
    answer:
      'Please contact Top Threadz customer support on WhatsApp immediately (+92 300 9070520). If your order has not been dispatched to the courier, we will update the address for you.',
  },

  {
    category: 'Payment Methods',
    question: 'What payment methods does Top Threadz accept?',
    answer:
      'We accept Cash on Delivery (COD) across Pakistan, direct online bank transfers, and major credit/debit cards.',
  },
  {
    category: 'Payment Methods',
    question: 'Is Cash on Delivery (COD) available everywhere in Pakistan?',
    answer:
      'Yes, Cash on Delivery is available across all serviceable courier pin codes nationwide.',
  },
  {
    category: 'Payment Methods',
    question: 'Is online payment secure?',
    answer:
      'Yes, our online payment gateway utilizes bank-grade 256-bit SSL encryption. We do not store your complete card details on our servers.',
  },
  {
    category: 'Payment Methods',
    question: 'What should I do if money was deducted but my order was not confirmed?',
    answer:
      'Please take a screenshot of your bank deduction / transaction SMS and share it with our support team on WhatsApp along with your name and email. We will verify with our payment gateway and manually confirm your order within a few hours.',
  },

  {
    category: 'Exchanges & Returns',
    question: 'What is Top Threadz’s return and exchange policy?',
    answer:
      'We offer an easy 7-day exchange and return policy for unstitched fabric and unworn items in their original condition with all tags and original packaging intact.',
  },
  {
    category: 'Exchanges & Returns',
    question: 'Can I return fabric after it has been cut or stitched?',
    answer:
      'No. Once fabric has been cut, altered, stitched, or washed, it cannot be returned or exchanged unless there was a pre-existing manufacturing defect reported prior to tailoring.',
  },
  {
    category: 'Exchanges & Returns',
    question: 'What should I do if I receive a damaged or incorrect product?',
    answer:
      'Notify us within 48 hours of receiving your delivery via WhatsApp with clear pictures of the item and courier fly-bag. We will arrange a free exchange or full refund.',
  },

  {
    category: 'Ordering & Support',
    question: 'How do I place an order on Top Threadz?',
    answer:
      'Browse our catalog, choose your fabric or size, click "Add to Cart", and click Checkout. Enter your shipping address, choose Cash on Delivery or Card payment, and confirm.',
  },
  {
    category: 'Ordering & Support',
    question: 'Where is Top Threadz located?',
    answer:
      'Our flagship retail outlet is located at Street 2, DHA Phase 5 Zamzama Commercial Area, Defence V, Karachi, 75600, Pakistan. We also ship across Pakistan online via topthreadz.com.pk.',
  },
  {
    category: 'Ordering & Support',
    question: 'How can I contact Top Threadz customer support?',
    answer:
      'You can reach our team via WhatsApp at +92 300 9070520, email at support@topthreadz.pk, or visit our Zamzama outlet during operating hours.',
  },

  {
    category: 'Product Care',
    question: 'How should I care for wash & wear fabric?',
    answer:
      'Hand wash or machine wash on a gentle cycle with cold water and mild detergent. Do not bleach. Hang to dry in shade to retain vibrant luster and minimize ironing requirements.',
  },
  {
    category: 'Product Care',
    question: 'Can I use bleach on fabrics or garments?',
    answer:
      'Never use chlorine bleach on wash & wear or Boski fabrics, as bleach damages synthetic and blended fibers and causes premature discoloration.',
  },
  {
    category: 'Product Care',
    question: 'How should I iron my Top Threadz suits?',
    answer:
      'Use a low-to-medium steam iron setting for wash & wear fabrics. Always iron on the reverse side or use a pressing cloth for dark shades.',
  },
];

export const FAQ_CATEGORIES = [
  'All',
  'Product & Quality',
  'Shipping & Delivery',
  'Payment Methods',
  'Exchanges & Returns',
  'Ordering & Support',
  'Product Care',
];
