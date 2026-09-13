import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';
import { BLOG_POSTS } from '@/lib/blogData';
import {
  FiArrowLeft,
  FiClock,
  FiCalendar,
  FiUser,
  FiTag,
  FiCheckCircle,
  FiArrowRight,
  FiHelpCircle,
} from 'react-icons/fi';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find((p) => p.slug === resolvedParams.slug);
  if (!post) return { title: 'Article Not Found | Top Threadz' };

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.coverImage.startsWith('http')
    ? post.coverImage
    : `${SITE_URL}${post.coverImage}`;

  return {
    title: post.seoTitle,
    description: post.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      siteName: 'Top Threadz',
      title: post.seoTitle,
      description: post.metaDescription,
      publishedTime: post.publishDate,
      modifiedTime: post.modifiedDate,
      authors: [post.author.name],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle,
      description: post.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.coverImage.startsWith('http')
    ? post.coverImage
    : `${SITE_URL}${post.coverImage}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: ogImage,
    datePublished: post.publishDate,
    dateModified: post.modifiedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Organization',
      name: post.author.name,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Top Threadz',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/topthreadz-logo.jpg`,
      },
    },
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
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  const faqSchema =
    post.content.faqs && post.content.faqs.length > 0
      ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.content.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      }
      : null;

  const formattedDate = new Date(post.publishDate).toLocaleDateString('en-PK', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="min-h-screen bg-[#fafafa] py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto space-y-8">
          {/* Back to Blog */}
          <Link
            href="/blog"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-surface-500 hover:text-black transition-colors bg-white px-3.5 py-2 rounded-full border border-surface-200 shadow-sm"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" /> All Articles
          </Link>

          {/* Article Header */}
          <header className="space-y-4 bg-white rounded-3xl p-6 sm:p-10 border border-surface-200 shadow-soft">
            <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 font-semibold">
              <span className="px-3 py-1 rounded-full bg-[#D4A84B]/15 text-[#916b1f] border border-[#D4A84B]/30 font-bold">
                {post.category}
              </span>
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3.5 h-3.5 text-surface-400" /> {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5 text-surface-400" /> {post.readTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-surface-950 leading-tight">
              {post.title}
            </h1>

            <div className="pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-900 text-white flex items-center justify-center font-bold text-xs">
                  TT
                </div>
                <div>
                  <div className="font-bold text-surface-900">{post.author.name}</div>
                  <div className="text-[11px] text-surface-400">{post.author.role}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Article Body */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-surface-200 shadow-soft space-y-8 text-surface-800 text-sm sm:text-base leading-relaxed">
            <p className="text-base sm:text-lg font-medium text-surface-900 leading-relaxed border-l-4 border-[#B88728] pl-4 italic">
              {post.content.intro}
            </p>

            {post.content.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-surface-950">
                  {section.heading}
                </h2>
                {section.body.map((p, pIdx) => (
                  <p key={pIdx} className="text-surface-700 leading-relaxed">
                    {p}
                  </p>
                ))}

                {section.tip && (
                  <div className="p-4 rounded-2xl bg-[#D4A84B]/10 border border-[#D4A84B]/20 text-xs sm:text-sm text-[#916b1f] font-medium flex items-start gap-2.5">
                    <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B88728]" />
                    <span>{section.tip}</span>
                  </div>
                )}
              </section>
            ))}

            {/* In-Article FAQs */}
            {post.content.faqs && post.content.faqs.length > 0 && (
              <div className="pt-6 border-t border-surface-100 space-y-4">
                <h3 className="text-lg font-display font-bold text-surface-950 flex items-center gap-2">
                  <FiHelpCircle className="text-[#B88728]" /> Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {post.content.faqs.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-1.5"
                    >
                      <div className="font-bold text-xs sm:text-sm text-surface-950">
                        {faq.question}
                      </div>
                      <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related CTA Banner */}
          <div className="bg-surface-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8C86A]">Explore the Collection</span>
              <h4 className="text-lg font-display font-bold text-white mt-0.5">Ready to Upgrade Your Wardrobe?</h4>
              <p className="text-xs text-surface-300 mt-1">
                Browse our premium wash &amp; wear and stitched suits with fast delivery across Pakistan.
              </p>
            </div>
            <Link
              href={post.content.relatedCategory.href}
              className="px-5 py-3 rounded-full bg-white text-surface-950 text-xs font-bold hover:bg-[#E8C86A] transition-colors inline-flex items-center gap-2 shrink-0"
            >
              {post.content.relatedCategory.name} <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
