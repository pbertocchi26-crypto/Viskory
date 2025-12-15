'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewCardProps {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  reviewText: string;
  brandResponse?: string;
  brandResponseAt?: string;
  createdAt: string;
}

export function ReviewCard({
  userName,
  rating,
  reviewText,
  brandResponse,
  brandResponseAt,
  createdAt,
}: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-foreground">{userName}</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-foreground mb-4">{reviewText}</p>

        {brandResponse && (
          <div className="bg-muted p-4 rounded-lg mt-4 border-l-4 border-primary">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Brand Response</p>
              {brandResponseAt && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(brandResponseAt), 'dd MMM yyyy')}
                </p>
              )}
            </div>
            <p className="text-sm text-foreground">{brandResponse}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
