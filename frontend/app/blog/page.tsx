import Link from 'next/link';
import { SITE_URL } from '@/lib/seo';
import { BLOG_POSTS } from '@/lib/blogData';
import { FiBookOpen, FiClock, FiCalendar, FiArrowRight } from 'react-icons/fi';

export default function BlogIndexPage() {
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
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-[#fafafa] py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] bg-[#D4A84B]/15 text-[#916b1f] border border-[#D4A84B]/30">
              <FiBookOpen className="w-3.5 h-3.5" /> Editorial &amp; Style Journal
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-surface-950">
              The Gentleman&apos;s Gazette
            </h1>
            <p className="text-xs sm:text-sm text-surface-600">
              In-depth guides on Pakistani menswear styling, fabric care, tailoring standards, and wardrobe essentials.
            </p>
          </div>

          {/* Article Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post) => {
              const formattedDate = new Date(post.publishDate).toLocaleDateString('en-PK', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <article
                  key={post.slug}
                  className="bg-white rounded-3xl border border-surface-200 shadow-soft hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-surface-400">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-100 text-surface-700 font-bold">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>

                    <h2 className="text-lg font-display font-bold text-surface-950 group-hover:text-[#B88728] transition-colors leading-snug">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-xs text-surface-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="p-6 sm:p-7 pt-0 border-t border-surface-100/60 mt-auto flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] text-surface-400">
                      <FiCalendar className="w-3 h-3" /> {formattedDate}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-surface-950 group-hover:text-[#B88728] transition-colors"
                    >
                      Read Article <FiArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sizing & Shopping Help Banner */}
          <div className="bg-surface-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8C86A]">Tailoring Advice</span>
              <h3 className="text-xl font-display font-bold text-white">Need Exact Sizing Specs?</h3>
              <p className="text-xs text-surface-300 max-w-md">
                Check our official cutting charts and measurements before having your fabric stitched.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/size-guide"
                className="px-5 py-2.5 rounded-full bg-white text-surface-950 text-xs font-bold hover:bg-[#E8C86A] transition-colors"
              >
                View Size Guide
              </Link>
              <Link
                href="/products"
                className="px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20 hover:bg-white/20 transition-colors"
              >
                Shop Fabrics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
