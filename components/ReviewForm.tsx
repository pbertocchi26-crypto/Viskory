'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReviewFormProps {
  brandId: string;
  existingReview?: {
    id: string;
    rating: number;
    review_text: string;
  } | null;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ brandId, existingReview, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingReview;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text);
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (reviewText.length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('brand_reviews')
        .upsert(
          {
            id: existingReview?.id,
            brand_id: brandId,
            user_id: user.id,
            rating,
            review_text: reviewText,
          },
          { onConflict: 'brand_id,user_id' }
        );

      if (error) throw error;

      toast.success(isEditing ? 'Review updated successfully!' : 'Review submitted successfully!');

      if (!isEditing) {
        setRating(0);
        setReviewText('');
      }

      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'submit'} review`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please login to leave a review
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Your Review' : 'Leave a Review'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Your Review
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this brand..."
              rows={4}
              minLength={10}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 10 characters
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting || rating === 0}>
            {isSubmitting ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Review' : 'Submit Review')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
