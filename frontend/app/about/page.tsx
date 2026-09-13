import Link from 'next/link';
import { SITE_URL } from '@/lib/seo';
import {
  FiAward,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiArrowRight,
  FiShield,
  FiTruck,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function AboutPage() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'Top Threadz',
    alternateName: 'Top Threadz Pakistan',
    url: SITE_URL,
    logo: `${SITE_URL}/images/topthreadz-logo.jpg`,
    image: `${SITE_URL}/images/topthreadz-logo.jpg`,
    description:
      'Top Threadz is a premier Pakistani menswear brand specializing in luxury wash & wear unstitched fabric, ready-to-wear kurtas, and tailored suits.',
    telephone: '+923009070520',
    email: 'support@topthreadz.pk',
    priceRange: 'PKR 2,500 - PKR 15,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Street 2, DHA Phase 5 Zamzama Commercial Area Defence V',
      addressLocality: 'Karachi',
      addressRegion: 'Sindh',
      postalCode: '75600',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '24.8252',
      longitude: '67.0315',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '11:00',
        closes: '22:00',
      },
    ],
    sameAs: [
      'https://www.facebook.com/topthreadz',
      'https://www.instagram.com/topthreadz',
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About Us',
        item: `${SITE_URL}/about`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-[#fafafa] py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] bg-[#D4A84B]/15 text-[#916b1f] border border-[#D4A84B]/30">
              <FiAward className="w-3.5 h-3.5" /> Established in Pakistan
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-surface-950 tracking-tight">
              Crafting Excellence in <span className="text-[#B88728]">Pakistani Menswear</span>
            </h1>
            <p className="text-sm sm:text-base text-surface-600 leading-relaxed">
              Top Threadz was founded on a simple philosophy: men deserve fabrics that combine
              timeless elegance, effortless maintenance, and uncompromised comfort for Pakistan’s climate.
            </p>
          </div>

          {/* Story & Philosophy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-surface-200 shadow-soft flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B88728]">
                  Our Heritage &amp; Craft
                </span>
                <h2 className="text-2xl font-display font-bold text-surface-950">
                  Premium Wash &amp; Wear &amp; Luxury Boski
                </h2>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  From executive boardroom meetings in Karachi to festive family weddings in Lahore,
                  Top Threadz curates fabrics engineered for all-day sharpness. Our signature micro-fiber
                  and blended cotton wash &amp; wear collections resist creases while offering maximum
                  airflow and liquid drape.
                </p>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  Each unstitched suit is supplied in full 4-meter to 4.5-meter lengths, accompanied
                  by matching luxury buttons, signature woven labels, and pristine gift packaging.
                </p>
              </div>

              <div className="pt-6 border-t border-surface-100 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold font-display text-surface-950">100%</div>
                  <div className="text-[11px] text-surface-500 font-medium">Original Quality Guarantee</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-surface-950">Nationwide</div>
                  <div className="text-[11px] text-surface-500 font-medium">Fast Express Delivery</div>
                </div>
              </div>
            </div>

            <div className="bg-surface-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#E8C86A]">
                  Why Choose Top Threadz?
                </span>
                <h2 className="text-2xl font-display font-bold text-white">
                  Designed for Durability, Luster &amp; Comfort
                </h2>
                <ul className="space-y-3 text-xs sm:text-sm text-surface-300">
                  <li className="flex items-start gap-3">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Wrinkle-Free Wash &amp; Wear:</strong> Crisp look that requires minimal ironing after washing.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Breathable Weaves:</strong> Temperature-regulating fabrics suitable for hot summers and mild winters.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Colorfast Guarantee:</strong> Retains rich shade saturation wash after wash without fading or bleeding.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Full Menswear Range:</strong> Unstitched fabrics, stitched kurtas, two-piece shalwar kameez, waistcoats, and festive kids&apos; wear.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 rounded-2xl bg-white text-surface-950 font-bold text-xs uppercase tracking-wider hover:bg-[#E8C86A] transition-colors"
                >
                  Explore All Collections <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Flagship Store & NAP Block */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-surface-200 shadow-soft">
            <div className="max-w-3xl space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B88728]">
                  Physical Store &amp; Flagship Outlet
                </span>
                <h2 className="text-2xl font-display font-bold text-surface-950 mt-1">
                  Visit Us at Zamzama, DHA Phase 5, Karachi
                </h2>
                <p className="text-xs sm:text-sm text-surface-600 mt-2">
                  Experience our premium fabric textures, weight, and colors firsthand at our retail flagship outlet in Karachi.
                </p>
              </div>

              {/* Semantic Address block for GEO & Local SEO */}
              <address className="not-italic grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-surface-700">
                    <FiMapPin className="text-[#B88728]" /> Store Address
                  </div>
                  <p className="text-xs text-surface-600 leading-relaxed">
                    <strong>Top Threadz</strong><br />
                    Street 2, DHA Phase 5 Zamzama Commercial Area,<br />
                    Defence V, Karachi, 75600, Sindh, Pakistan
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-surface-700">
                    <FiClock className="text-[#B88728]" /> Store Timings &amp; Contact
                  </div>
                  <p className="text-xs text-surface-600">
                    <strong>Monday – Sunday:</strong> 11:00 AM – 10:00 PM
                  </p>
                  <div className="flex flex-col gap-1 text-xs text-surface-600">
                    <a href="tel:+923009070520" className="inline-flex items-center gap-1.5 hover:text-black">
                      <FiPhone className="text-surface-400" /> +92 300 9070520
                    </a>
                    <a href="mailto:support@topthreadz.pk" className="inline-flex items-center gap-1.5 hover:text-black">
                      <FiMail className="text-surface-400" /> support@topthreadz.pk
                    </a>
                  </div>
                </div>
              </address>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="https://maps.google.com/?q=R28V%2BR3W,+Street+2,+DHA+Phase+5+Zamzama+Commercial+Area+Defence+V+Karachi,+75600,+Pakistan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-950 text-white text-xs font-bold hover:bg-surface-800 transition-colors"
                >
                  <FiMapPin className="w-3.5 h-3.5 text-[#E8C86A]" /> Open in Google Maps
                </a>
                <a
                  href="https://wa.me/923009070520?text=Hi%20TopThreadz%2C%20I%20would%20like%20directions%20or%20inquiry%20about%20your%20Zamzama%20outlet."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba5a] transition-colors"
                >
                  <FaWhatsapp className="w-3.5 h-3.5" /> WhatsApp Store Support
                </a>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-surface-200 text-center space-y-2">
              <FiTruck className="w-6 h-6 text-[#B88728] mx-auto" />
              <h3 className="text-sm font-bold text-surface-900">Nationwide Delivery</h3>
              <p className="text-xs text-surface-500">Fast delivery across Karachi, Lahore, Islamabad, and all cities in Pakistan.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-surface-200 text-center space-y-2">
              <FiShield className="w-6 h-6 text-[#B88728] mx-auto" />
              <h3 className="text-sm font-bold text-surface-900">7-Day Easy Exchange</h3>
              <p className="text-xs text-surface-500">Shop with confidence with our transparent returns and exchange policy.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-surface-200 text-center space-y-2">
              <FiAward className="w-6 h-6 text-[#B88728] mx-auto" />
              <h3 className="text-sm font-bold text-surface-900">Cash on Delivery</h3>
              <p className="text-xs text-surface-500">Pay safely at your doorstep upon receiving your parcel.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
