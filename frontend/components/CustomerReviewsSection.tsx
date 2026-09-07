'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewService, CustomerReview } from '@/services/review.service';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

// Fallback initial reviews directly mirroring the reference image
const DEFAULT_TESTIMONIALS: CustomerReview[] = [
  {
    id: 'default-1',
    userName: 'Umair',
    rating: 5,
    comment: 'The magical words with multicolor effect attract me very much.',
    createdAt: '2025-01-15',
  },
  {
    id: 'default-2',
    userName: 'Abeera Mirza',
    rating: 5,
    comment: 'Your suits are beautifully and carefully stitched. Thank you for being honest in this meta age. Keep it up 💪',
    createdAt: '2025-01-28',
  },
  {
    id: 'default-3',
    userName: 'Ibrar Khan',
    rating: 5,
    comment: 'A very good stuff. The finishing of the fabric is very decent.',
    createdAt: '2025-02-04',
  },
  {
    id: 'default-4',
    userName: 'ALI Shahzad',
    rating: 5,
    comment: 'Great experience as i expected.',
    createdAt: '2025-02-12',
  },
];

export default function CustomerReviewsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: reviews = DEFAULT_TESTIMONIALS } = useQuery({
    queryKey: ['featured-reviews'],
    queryFn: async () => {
      const items = await reviewService.getFeaturedReviews();
      return items && items.length > 0 ? items : DEFAULT_TESTIMONIALS;
    },
    staleTime: 5 * 60 * 1000,
  });

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [reviews]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="w-full bg-[#f8f8f8] py-14 sm:py-20 border-y border-surface-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section (Matching Reference Image 1) */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-normal tracking-[0.2em] text-surface-900 uppercase">
            WHAT CUSTOMER SPEAK FOR US
          </h2>
          <div className="mt-2.5">
            <Link
              href="/products"
              className="text-xs sm:text-sm text-surface-600 hover:text-surface-950 underline underline-offset-4 decoration-surface-400 hover:decoration-surface-900 transition-colors font-serif italic tracking-wide"
            >
              We Love Trusting Diners.
            </Link>
          </div>
        </div>

        {/* Slider with Arrows (Matching Reference Image 1) */}
        <div className="relative flex items-center">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous reviews"
            className={`hidden md:flex shrink-0 w-10 h-10 -ml-2 lg:-ml-6 items-center justify-center text-surface-800 hover:text-surface-950 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity z-10`}
          >
            <FiArrowLeft className="w-6 h-6 stroke-[1.5]" />
          </button>

          {/* Cards Track */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-6 sm:gap-8 overflow-x-auto scroll-smooth py-4 px-2 no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-none w-[260px] sm:w-[280px] md:w-[calc(25%-1.5rem)] snap-start flex flex-col justify-between text-center px-4"
              >
                <div>
                  {/* Customer Name */}
                  <h3 className="text-sm sm:text-base font-normal text-surface-900 tracking-wide mb-3">
                    {review.userName}
                  </h3>

                  {/* Comment Text */}
                  <p className="text-xs sm:text-sm text-surface-600 leading-relaxed min-h-[54px]">
                    {review.comment}
                  </p>
                </div>

                {/* 5 Golden Yellow Stars (Centered Below Quote) */}
                <div className="mt-4 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < Math.round(review.rating)
                          ? 'text-[#F5B014]'
                          : 'text-surface-300'
                      }`}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next reviews"
            className={`hidden md:flex shrink-0 w-10 h-10 -mr-2 lg:-mr-6 items-center justify-center text-surface-800 hover:text-surface-950 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity z-10`}
          >
            <FiArrowRight className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden items-center justify-center gap-6 mt-6">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous reviews"
            className="w-8 h-8 rounded-full border border-surface-300 flex items-center justify-center text-surface-800 disabled:opacity-25"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next reviews"
            className="w-8 h-8 rounded-full border border-surface-300 flex items-center justify-center text-surface-800 disabled:opacity-25"
          >
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
