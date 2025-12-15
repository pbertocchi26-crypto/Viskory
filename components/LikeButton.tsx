'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LikeButtonProps {
  productId: string;
  initialLikeCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeButton({ productId, initialLikeCount = 0, showCount = false, size = 'md' }: LikeButtonProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, productId]);

  const checkIfLiked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('product_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to like products');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('product_likes')
          .insert([{ user_id: user.id, product_id: productId }]);

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "flex items-center gap-1 transition-all",
        isLiked ? "text-red-600" : "text-muted-foreground hover:text-red-600"
      )}
    >
      <Heart
        className={cn(
          iconSizes[size],
          isLiked && "fill-current"
        )}
      />
      {showCount && <span className="text-sm font-medium">{likeCount}</span>}
    </button>
  );
}
