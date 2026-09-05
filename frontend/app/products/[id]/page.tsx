import type { Metadata } from 'next';
import ProductDetailClient from '@/components/ProductDetailClient';
import { fetchServerProduct } from '@/lib/serverData';
import { resolveImageUrl } from '@/lib/images';

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

function stripHtml(html: string = ''): string {
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchServerProduct(resolvedParams.id);

  if (!product) {
    return {
      title: 'Product Not Found | Top Threadz',
      description: 'The requested menswear product is not available. Shop our full collection at Top Threadz.',
    };
  }

  const cleanDesc = stripHtml(product.description || '');
  const shortDesc = stripHtml(product.shortDescription || '');
  // Prefer AI-generated/curated SEO fields, fall back to derived copy.
  const title = product.metaTitle?.trim() || `${product.name} | Top Threadz`;
  const description = product.metaDescription?.trim()
    || (shortDesc.length > 20 ? shortDesc.slice(0, 160)
      : cleanDesc.length > 20
        ? `${cleanDesc.slice(0, 150)}... Buy online at Top Threadz with cash on delivery across Pakistan.`
        : `Buy ${product.name} at Top Threadz. Premium Pakistani men's fabric. Fast delivery nationwide.`);

  const keywords = Array.isArray(product.metaKeywords) && product.metaKeywords.length > 0
    ? product.metaKeywords
    : undefined;

  const primaryImage = product.images?.[0] ? resolveImageUrl(product.images[0]) : 'https://www.topthreadz.com.pk/images/topthreadz-logo.jpg';

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: `https://www.topthreadz.com.pk/products/${product.slug || product.id}`,
    },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      url: `https://www.topthreadz.com.pk/products/${product.slug || product.id}`,
      siteName: 'Top Threadz',
      title,
      description,
      images: [
        {
          url: primaryImage,
          width: 1000,
          height: 1250,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await fetchServerProduct(resolvedParams.id);

  const cleanDesc = stripHtml(product?.description || '');
  const effectivePrice = product
    ? Math.round(product.price * (1 - (product.discount || 0) / 100))
    : 0;

  const images = (product?.images || []).map((img: string) => resolveImageUrl(img));

  // Product Schema (JSON-LD) — uses curated/AI fields with safe fallbacks.
  const jsonLdDescription = product.metaDescription?.trim()
    || stripHtml(product.shortDescription || '')
    || cleanDesc
    || product.name;

  const productJsonLd = product
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: images.length > 0 ? images : ['https://www.topthreadz.com.pk/images/topthreadz-logo.jpg'],
        description: jsonLdDescription,
        sku: product.sku || `TT-${product.id}`,
        brand: {
          '@type': 'Brand',
          name: product.brand || 'Top Threadz',
        },
        ...(Array.isArray(product.highlights) && product.highlights.length > 0
          ? { additionalProperty: product.highlights.slice(0, 8).map((h: string) => ({ '@type': 'PropertyValue', name: 'Highlight', value: h })) }
          : {}),
        offers: {
          '@type': 'Offer',
          url: `https://www.topthreadz.com.pk/products/${product.slug || product.id}`,
          priceCurrency: 'PKR',
          price: effectivePrice,
          priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Top Threadz',
          },
        },
      }
    : null;

  // FAQ Schema — only when real Q&A pairs exist on the product record.
  const validFaqs = Array.isArray(product?.faqs)
    ? (product.faqs as Array<{ question?: string; answer?: string }>).filter(
        (f) => f && typeof f.question === 'string' && typeof f.answer === 'string' && f.question.trim() && f.answer.trim()
      )
    : [];
  const faqJsonLd = validFaqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: validFaqs.slice(0, 8).map((f) => ({
          '@type': 'Question',
          name: f.question!.slice(0, 300),
          acceptedAnswer: { '@type': 'Answer', text: f.answer!.slice(0, 1000) },
        })),
      }
    : null;

  // Breadcrumb Schema (JSON-LD)
  const breadcrumbJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.topthreadz.com.pk',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category || 'Menswear',
            item: `https://www.topthreadz.com.pk/products/category/${encodeURIComponent(product.category || 'Unstitched')}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: `https://www.topthreadz.com.pk/products/${product.slug || product.id}`,
          },
        ],
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductDetailClient initialProduct={product} productId={resolvedParams.id} />
    </>
  );
}
