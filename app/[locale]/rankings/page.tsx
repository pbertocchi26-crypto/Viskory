'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { Trophy, TrendingUp, Award } from 'lucide-react';

interface BrandRanking {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  score: number;
  avgRating: number;
  reviewsCount: number;
  salesCount: number;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<BrandRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('rankings');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: brands } = await supabase
      .from('brands')
      .select('id, name, slug, logo_url, tagline')
      .order('created_at', { ascending: false });

    if (!brands) {
      setLoading(false);
      return;
    }

    const brandRankings: BrandRanking[] = await Promise.all(
      brands.map(async (brand) => {
        const { data: reviews } = await supabase
          .from('brand_reviews')
          .select('rating')
          .eq('brand_id', brand.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        const { data: sales } = await supabase
          .from('external_sales')
          .select('id')
          .eq('brand_id', brand.id)
          .gte('sale_date', thirtyDaysAgo.toISOString());

        const reviewsCount = reviews?.length || 0;
        const salesCount = sales?.length || 0;
        const avgRating = reviewsCount > 0 && reviews
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
          : 0;

        const ratingScore = avgRating * 20;
        const salesScore = Math.min(salesCount * 2, 40);
        const reviewsScore = Math.min(reviewsCount * 2, 20);
        const score = ratingScore + salesScore + reviewsScore;

        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo_url: brand.logo_url,
          tagline: brand.tagline,
          score: Math.round(score * 10) / 10,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewsCount,
          salesCount,
        };
      })
    );

    const sortedRankings = brandRankings
      .filter((b) => b.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    setRankings(sortedRankings);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-10 h-10 text-orange-500" />
              <h1 className="text-4xl md:text-5xl font-bold">{t('title')}</h1>
            </div>
            <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('last30Days')}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">{tCommon('loading')}</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">{t('noData')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rankings.map((brand, index) => {
                const rank = index + 1;
                return (
                  <Card
                    key={brand.id}
                    className={`overflow-hidden transition-all hover:shadow-lg ${
                      rank <= 3 ? 'border-2' : ''
                    } ${
                      rank === 1
                        ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-white'
                        : rank === 2
                        ? 'border-gray-400 bg-gradient-to-r from-gray-50 to-white'
                        : rank === 3
                        ? 'border-amber-600 bg-gradient-to-r from-amber-50 to-white'
                        : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center justify-center w-12 md:w-16 flex-shrink-0">
                          {getRankIcon(rank)}
                        </div>

                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border border-border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xl md:text-2xl font-bold text-muted-foreground">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold truncate">{brand.name}</h3>
                          {brand.tagline && (
                            <p className="text-sm text-muted-foreground truncate">
                              {brand.tagline}
                            </p>
                          )}
                        </div>

                        <Link href={`/${locale}/brand/${brand.slug}`} className="flex-shrink-0">
                          <Button variant="outline" size="sm">
                            {t('viewBrand')}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
