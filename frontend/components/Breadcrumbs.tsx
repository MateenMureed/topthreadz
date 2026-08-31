'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FiChevronRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';

const formatSegment = (segment: string) => {
  if (!segment) return '';
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const normalizedPathname = pathname || '/';
  const segments = normalizedPathname.split('/').filter(Boolean);
  const isHome = normalizedPathname === '/' || segments.length === 0;
  const brand = searchParams.get('brand');
  const isCategoryRoute = segments[0] === 'products' && segments[1] === 'category';
  const productSegment = !isCategoryRoute && segments[0] === 'products' && segments[1] ? segments[1] : '';

  const { data: productBreadcrumbData } = useQuery({
    queryKey: ['breadcrumb-product', productSegment],
    enabled: Boolean(productSegment) && normalizedPathname.startsWith('/products/') && !isCategoryRoute,
    queryFn: async () => {
      try {
        return await productService.getById(productSegment);
      } catch {
        return await productService.getBySlug(productSegment);
      }
    },
  });

  if (isHome) {
    return null;
  }

  const breadcrumbProductName = productBreadcrumbData?.data?.name as string | undefined;
  const breadcrumbProductCategory = productBreadcrumbData?.data?.category as string | undefined;

  const crumbs: Array<{ href?: string; label: string }> = [{ href: '/', label: 'Home' }];

  if (isCategoryRoute) {
    crumbs.push({ href: '/products', label: 'Products' });
    if (segments[2]) {
      crumbs.push({ label: formatSegment(segments[2]) });
    }
  } else if (segments[0] === 'products' && productSegment) {
    // Product detail page: Home > Products > Category > Product Name
    crumbs.push({ href: '/products', label: 'Products' });
    if (breadcrumbProductCategory) {
      crumbs.push({
        href: `/products/category/${encodeURIComponent(breadcrumbProductCategory)}`,
        label: breadcrumbProductCategory,
      });
    }
    crumbs.push({
      label: breadcrumbProductName || formatSegment(productSegment),
    });
  } else {
    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const isLast = index === segments.length - 1;
      crumbs.push({
        href: isLast ? undefined : href,
        label: formatSegment(segment),
      });
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="hover:text-surface-800 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-surface-800' : ''}>{crumb.label}</span>
              )}
              {!isLast ? <FiChevronRight className="w-4 h-4" /> : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
