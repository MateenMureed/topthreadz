import Link from 'next/link';
import { SITE_URL } from '@/lib/seo';
import { FiCheck, FiHelpCircle, FiScissors, FiArrowRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function SizeGuidePage() {
  const sizeFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much fabric is needed for a men\'s shalwar kameez in Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For men of average height (5\'6" to 5\'11") with a standard body build, 4 meters of fabric with a 54 to 56-inch arz (width) is ideal for a full two-piece shalwar kameez. For men taller than 6 feet or with a heavier build, 4.25 to 4.5 meters is recommended.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the standard fabric length of Top Threadz unstitched suits?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Top Threadz unstitched suits come in generous 4.0 meter or 4.5 meter cuts with double-width (54-56 inch arz), giving your tailor ample room for full cuffs, custom collars, ban, and deep pockets without running short.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I choose the right size for a stitched kurta or shalwar kameez?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Measure your chest at the widest point with a measuring tape held comfortably loose. If your bare chest is 38 inches, select a Medium (finished garment chest 42 inches) for a relaxed traditional drape, or Small (finished garment chest 40 inches) for a slim modern cut.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Top Threadz wash & wear fabric shrink after washing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Top Threadz premium wash & wear fabrics are pre-treated to minimize shrinkage (less than 1%). However, as standard practice for tailoring in Pakistan, we recommend soaking the unstitched fabric in water for 15-20 minutes before taking it to the tailor.',
        },
      },
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
        name: 'Size Guide',
        item: `${SITE_URL}/size-guide`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sizeFaqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-[#fafafa] py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] bg-[#D4A84B]/15 text-[#916b1f] border border-[#D4A84B]/30">
              <FiScissors className="w-3.5 h-3.5" /> Tailoring &amp; Fit Guide
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-surface-950">
              Men&apos;s Size Guide &amp; Fabric Measurements
            </h1>
            <p className="text-xs sm:text-sm text-surface-600 max-w-2xl mx-auto">
              Find the perfect fit for Top Threadz ready-to-wear stitched kurtas, suits, waistcoats, and fabric specifications for your custom tailoring.
            </p>
          </div>

          {/* Table 1: Stitched Kurta & Shalwar Kameez */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-surface-100 pb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-surface-950">
                  Stitched Kurta &amp; Kameez Size Chart (Inches)
                </h2>
                <p className="text-xs text-surface-500">Measurements reflect finished garment dimensions, not bare body.</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-surface-100 text-surface-700 rounded-full w-fit">
                Regular / Relaxed Fit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-400 font-semibold uppercase text-[10px] sm:text-xs">
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Chest</th>
                    <th className="py-3 px-3">Length</th>
                    <th className="py-3 px-3">Shoulder</th>
                    <th className="py-3 px-3">Sleeve</th>
                    <th className="py-3 px-3">Collar / Ban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 font-medium text-surface-800">
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">Small (S)</td>
                    <td className="py-3 px-3">40&quot;</td>
                    <td className="py-3 px-3">40&quot;</td>
                    <td className="py-3 px-3">17.5&quot;</td>
                    <td className="py-3 px-3">24.5&quot;</td>
                    <td className="py-3 px-3">15.5&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">Medium (M)</td>
                    <td className="py-3 px-3">43&quot;</td>
                    <td className="py-3 px-3">42&quot;</td>
                    <td className="py-3 px-3">18.5&quot;</td>
                    <td className="py-3 px-3">25.0&quot;</td>
                    <td className="py-3 px-3">16.0&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">Large (L)</td>
                    <td className="py-3 px-3">46&quot;</td>
                    <td className="py-3 px-3">44&quot;</td>
                    <td className="py-3 px-3">19.5&quot;</td>
                    <td className="py-3 px-3">25.5&quot;</td>
                    <td className="py-3 px-3">16.5&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">X-Large (XL)</td>
                    <td className="py-3 px-3">49&quot;</td>
                    <td className="py-3 px-3">45&quot;</td>
                    <td className="py-3 px-3">20.5&quot;</td>
                    <td className="py-3 px-3">26.0&quot;</td>
                    <td className="py-3 px-3">17.0&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">XX-Large (XXL)</td>
                    <td className="py-3 px-3">52&quot;</td>
                    <td className="py-3 px-3">46&quot;</td>
                    <td className="py-3 px-3">21.5&quot;</td>
                    <td className="py-3 px-3">26.5&quot;</td>
                    <td className="py-3 px-3">17.5&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Waistcoat Size Guide */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-surface-100 pb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-surface-950">
                  Men&apos;s Waistcoat Size Chart (Inches)
                </h2>
                <p className="text-xs text-surface-500">Wear over a kurta or shirt for accurate measurement.</p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-surface-100 text-surface-700 rounded-full w-fit">
                Classic Tailored Fit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-400 font-semibold uppercase text-[10px] sm:text-xs">
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Chest</th>
                    <th className="py-3 px-3">Waist</th>
                    <th className="py-3 px-3">Front Length</th>
                    <th className="py-3 px-3">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 font-medium text-surface-800">
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">Small (38)</td>
                    <td className="py-3 px-3">39&quot;</td>
                    <td className="py-3 px-3">38&quot;</td>
                    <td className="py-3 px-3">27.5&quot;</td>
                    <td className="py-3 px-3">15.5&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">Medium (40)</td>
                    <td className="py-3 px-3">41&quot;</td>
                    <td className="py-3 px-3">40&quot;</td>
                    <td className="py-3 px-3">28.5&quot;</td>
                    <td className="py-3 px-3">16.0&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">Large (42)</td>
                    <td className="py-3 px-3">43&quot;</td>
                    <td className="py-3 px-3">42&quot;</td>
                    <td className="py-3 px-3">29.5&quot;</td>
                    <td className="py-3 px-3">16.5&quot;</td>
                  </tr>
                  <tr className="hover:bg-surface-50/70">
                    <td className="py-3 px-3 font-bold text-surface-950">X-Large (44)</td>
                    <td className="py-3 px-3">45&quot;</td>
                    <td className="py-3 px-3">44&quot;</td>
                    <td className="py-3 px-3">30.5&quot;</td>
                    <td className="py-3 px-3">17.0&quot;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Unstitched Fabric Guide */}
          <div className="bg-surface-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8C86A]">
                Unstitched Fabric Specifications
              </span>
              <h2 className="text-2xl font-display font-bold text-white mt-1">
                How Much Fabric Do You Need for Shalwar Kameez?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-surface-300">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <FiCheck className="text-emerald-400" /> Standard 4.00 Metres (Double Arz)
                </div>
                <p className="leading-relaxed">
                  Best for heights between <strong>5&apos;4&quot; and 5&apos;11&quot;</strong>. With our 54–56 inch wide width (arz), a standard 4m cut allows your master tailor to stitch a complete 2-piece shalwar kameez or kurta trouser with collar, cuffs, and front placket.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <FiCheck className="text-emerald-400" /> Extra Length 4.50 Metres (Double Arz)
                </div>
                <p className="leading-relaxed">
                  Recommended for men <strong>6&apos;0&quot; or taller</strong>, heavy body builds, or if you prefer an oversized traditional flair with extra fabric for double cuffs, waistcoat lining, or deep pockets.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#D4A84B]/10 border border-[#D4A84B]/20 text-xs text-[#E8C86A] flex items-start gap-3">
              <FiHelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Tailor Tip:</strong> Top Threadz wash &amp; wear fabrics are wrinkle-resistant and pre-finished. We recommend a 15-minute cold water sponge or dip before tailoring to achieve the crispest drape.
              </span>
            </div>
          </div>

          {/* Sizing Assistance Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-200 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-lg font-display font-bold text-surface-950">
                Still Unsure About Sizing or Fabric Length?
              </h3>
              <p className="text-xs text-surface-600 mt-1">
                Share your height and weight on WhatsApp, and our master stylists will guide you directly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://wa.me/923009070520?text=Hi%20TopThreadz%2C%20I%20need%20assistance%20choosing%20the%20right%20size%20or%20fabric%20length."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba5a] transition-all shadow-md"
              >
                <FaWhatsapp className="w-4 h-4" /> Ask Size on WhatsApp
              </a>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-950 text-white text-xs font-bold hover:bg-surface-800 transition-all"
              >
                Shop Now <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
