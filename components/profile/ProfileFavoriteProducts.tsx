'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/ProductCard';
import { supabase } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';
import type { User } from '@/lib/auth';

interface Product {
  id: string;
  name: string;
  price: string;
  main_image_url?: string;
  discount_percentage?: number;
  brands: {
    brand_name: string;
  };
}

interface ProfileFavoriteProductsProps {
  user: User;
}

export function ProfileFavoriteProducts({ user }: ProfileFavoriteProductsProps) {
  const t = useTranslations('profile.favorites');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [user.id]);

  const loadFavorites = async () => {
    try {
      const { data: likes, error } = await supabase
        .from('product_likes')
        .select(`
          product_id,
          products (
            id,
            name,
            price,
            main_image_url,
            discount_percentage,
            brands (
              name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteProducts = likes
        ?.map((like: any) => like.products)
        .filter(Boolean) as Product[];

      setProducts(favoriteProducts);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading favourites...</p>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-2">{t('empty')}</p>
          <p className="text-sm text-muted-foreground">{t('emptySubtext')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={parseFloat(product.price)}
          mainImageUrl={product.main_image_url}
          brandName={product.brands?.brand_name}
          discountPercentage={product.discount_percentage}
        />
      ))}
    </div>
  );
}
