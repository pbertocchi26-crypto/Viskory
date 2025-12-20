'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  brand_response?: string;
  brand_response_at?: string;
  created_at: string;
  users: {
    name: string;
    avatar_url?: string;
  };
}

export default function BrandReviewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [brandId, setBrandId] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'BRAND') {
      router.push('/');
      return;
    }

    loadReviews();
  }, [user, router]);

  const loadReviews = async () => {
    if (!user) return;

    const { data: brandData } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!brandData) {
      toast.error('Brand not found');
      router.push('/dashboard/brand/setup');
      return;
    }

    setBrandId(brandData.id);

    const { data: reviewsData, error } = await supabase
      .from('brand_reviews')
      .select(`
        *,
        users (
          name,
          avatar_url
        )
      `)
      .eq('brand_id', brandData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } else if (reviewsData) {
      setReviews(reviewsData as Review[]);

      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    }

    setLoading(false);
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    const { error } = await supabase
      .from('brand_reviews')
      .update({
        brand_response: responseText,
        brand_response_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error responding to review:', error);
      toast.error('Failed to submit response');
    } else {
      toast.success('Response submitted successfully!');
      setRespondingToId(null);
      setResponseText('');
      loadReviews();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Brand Reviews</h1>
            <p className="text-muted-foreground mt-2">
              Manage and respond to customer reviews
            </p>
          </div>
          <Link href="/dashboard/brand">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {reviews.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-4xl font-bold text-foreground">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-l pl-4">
                  <p className="text-2xl font-semibold text-foreground">
                    {reviews.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reviews.length === 1 ? 'Review' : 'Reviews'}
                  </p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-2xl font-semibold text-foreground">
                    {reviews.filter((r) => r.brand_response).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-12">
                No reviews yet. Keep up the great work to get your first review!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{review.users.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(review.created_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4">{review.review_text}</p>

                  {review.brand_response ? (
                    <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">
                          Your Response
                        </p>
                        {review.brand_response_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(review.brand_response_at), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{review.brand_response}</p>
                    </div>
                  ) : (
                    <div>
                      {respondingToId === review.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your response..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleRespond(review.id)}
                              size="sm"
                            >
                              Submit Response
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRespondingToId(null);
                                setResponseText('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRespondingToId(review.id)}
                        >
                          Respond to Review
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
