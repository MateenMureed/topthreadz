'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, CreateReviewPayload } from '@/services/review.service';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ProductReviewsAccordionProps {
  productId: string;
  productName: string;
}

export default function ProductReviewsAccordion({
  productId,
  productName,
}: ProductReviewsAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => reviewService.getProductReviews(productId, 1, 20),
    staleTime: 60 * 1000,
  });

  const reviews = data?.reviews || [];
  const stats = data?.stats || { averageRating: 0, totalReviews: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

  const submitMutation = useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewService.createReview(productId, payload),
    onSuccess: () => {
      toast.success('Thank you! Your review has been submitted.');
      setShowForm(false);
      setTitle('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['featured-reviews'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit review. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter your review comments');
      return;
    }
    const finalName = name.trim() || user?.name || '';
    const finalEmail = email.trim() || user?.email || '';

    submitMutation.mutate({
      rating,
      title: title.trim(),
      comment: comment.trim(),
      userName: finalName,
      userEmail: finalEmail,
    });
  };

  const currentDisplayRating = Math.round(stats.averageRating) || 0;

  return (
    <div className="pt-2 border-t border-surface-200">
      {/* Accordion Bar (Matching Reference Image 2: "REVIEW" on left, "-" or "+" on right) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left py-2 font-display font-bold text-base text-surface-950 uppercase tracking-wide"
      >
        <span>REVIEW</span>
        <span className="text-xl font-normal leading-none select-none">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div className="pt-6 pb-4">
          {/* Centered Heading (Matching Reference Image 2: "Customer Reviews") */}
          <h3 className="text-center font-bold text-xl sm:text-2xl text-surface-900 mb-6">
            Customer Reviews
          </h3>

          {/* Review Summary Bar & Action Button (Matching Reference Image 2) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 py-4">
            {/* Left Column: Stars & Review Count */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right min-w-[180px]">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl sm:text-2xl ${
                      stats.totalReviews > 0 && star <= currentDisplayRating
                        ? 'text-[#F5B014]'
                        : 'text-yellow-400'
                    }`}
                    aria-hidden="true"
                  >
                    {stats.totalReviews > 0 && star <= currentDisplayRating ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-surface-600">
                {stats.totalReviews === 0
                  ? 'Be the first to write a review'
                  : `Based on ${stats.totalReviews} review${stats.totalReviews === 1 ? '' : 's'}`}
              </p>
            </div>

            {/* Vertical Divider (Matching Reference Image 2) */}
            <div className="hidden sm:block w-px h-12 bg-surface-300" />

            {/* Right Column: Solid Black "Write a review" Button (Matching Reference Image 2) */}
            <div className="min-w-[180px] flex justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-black hover:bg-surface-800 text-white font-bold text-sm sm:text-base px-7 py-3 rounded-none transition-colors tracking-wide shadow-xs"
              >
                {showForm ? 'Cancel review' : 'Write a review'}
              </button>
            </div>
          </div>

          {/* Expandable Write a Review Form */}
          {showForm && (
            <div className="mt-8 max-w-xl mx-auto p-5 sm:p-6 bg-surface-50 border border-surface-200 rounded-lg">
              <h4 className="text-base font-bold text-surface-900 mb-4 text-center">
                Write a Review for {productName}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1.5">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl text-yellow-400 hover:scale-110 transition-transform focus:outline-none"
                        aria-label={`${star} star`}
                      >
                        {star <= (hoverRating || rating) ? '★' : '☆'}
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-surface-600">
                      {rating === 5 ? '5 - Excellent' : rating === 4 ? '4 - Good' : rating === 3 ? '3 - Average' : rating === 2 ? '2 - Fair' : '1 - Poor'}
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                    Review Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your review a title (e.g. Beautiful fabric, great fit)"
                    className="w-full px-3 py-2 text-sm border border-surface-300 rounded bg-white focus:outline-none focus:border-black"
                    maxLength={100}
                  />
                </div>

                {/* Review Body */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                    Review Comments *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your comments here about quality, stitching, fabric feel, or delivery..."
                    className="w-full px-3 py-2 text-sm border border-surface-300 rounded bg-white focus:outline-none focus:border-black"
                    maxLength={1500}
                  />
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={user?.name || 'e.g. Umair'}
                      className="w-full px-3 py-2 text-sm border border-surface-300 rounded bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-1">
                      Your Email (kept private)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={user?.email || 'e.g. customer@example.com'}
                      className="w-full px-3 py-2 text-sm border border-surface-300 rounded bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs font-bold text-surface-600 hover:text-surface-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="bg-black hover:bg-surface-800 text-white font-bold text-xs px-6 py-2.5 rounded transition-colors disabled:opacity-50"
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Customer Reviews List */}
          {reviews.length > 0 && (
            <div className="mt-8 space-y-4 max-w-2xl mx-auto border-t border-surface-200 pt-6">
              {reviews.map((r) => (
                <div key={r.id} className="pb-4 border-b border-surface-100 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-900">{r.userName}</span>
                      {r.isVerifiedBuyer && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-surface-400">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 my-1.5">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < r.rating ? 'text-[#F5B014]' : 'text-surface-200'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  {r.title && (
                    <h5 className="font-semibold text-sm text-surface-900 mt-1">{r.title}</h5>
                  )}

                  {r.comment && (
                    <p className="text-xs sm:text-sm text-surface-600 mt-1 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
