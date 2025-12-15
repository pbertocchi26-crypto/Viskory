'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@/lib/auth';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  short_bio?: string;
}

interface ProfileFavoriteBrandsProps {
  user: User;
}

export function ProfileFavoriteBrands({ user }: ProfileFavoriteBrandsProps) {
  const t = useTranslations('profile.favoriteBrands');
  const locale = useLocale();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteBrands();
  }, [user.id]);

  const loadFavoriteBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          brands (
            id,
            name,
            slug,
            logo_url,
            short_bio
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const brandsList = data
        ?.map((follow: any) => follow.brands)
        .filter(Boolean) as Brand[];

      setBrands(brandsList);
    } catch (error) {
      console.error('Error loading favorite brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (brandId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', user.id)
        .eq('brand_id', brandId);

      if (error) throw error;

      setBrands(brands.filter(b => b.id !== brandId));
      toast.success('Unfollowed successfully');
    } catch (error) {
      console.error('Error unfollowing brand:', error);
      toast.error('Failed to unfollow brand');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading brands...</p>
        </CardContent>
      </Card>
    );
  }

  if (brands.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-2">{t('empty')}</p>
          <p className="text-sm text-muted-foreground">
            Follow your favourite brands to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {brands.map((brand) => (
        <Card key={brand.id}>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              {brand.logo_url && (
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4 relative">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-foreground mb-2">{brand.name}</h3>
              {brand.short_bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {brand.short_bio}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/${locale}/brand/${brand.slug}`)}
                variant="outline"
                className="flex-1"
              >
                {t('viewBrand')}
              </Button>
              <Button
                onClick={() => handleUnfollow(brand.id)}
                variant="ghost"
                className="flex-1"
              >
                {t('unfollow')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
