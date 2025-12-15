'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Users, Package, DollarSign, ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Stats {
  followersCount: number;
  productsCount: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: number;
  averageRating: number;
  reviewsCount: number;
}

export default function BrandDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    followersCount: 0,
    productsCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: 0,
    averageRating: 0,
    reviewsCount: 0,
  });
  const [brandId, setBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('dashboard.brand');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'BRAND') {
      router.push('/');
      return;
    }

    loadBrandStats();
  }, [user, router]);

  const loadBrandStats = async () => {
    if (!user) return;

    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!brand) {
      router.push('/dashboard/brand/setup');
      return;
    }

    setBrandId(brand.id);

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id);

    const { data: salesData } = await supabase
      .from('external_sales')
      .select('amount, product_id, sale_date')
      .eq('brand_id', brand.id);

    const totalOrders = salesData?.length || 0;
    const totalRevenue = salesData?.reduce(
      (sum, sale) => sum + parseFloat(sale.amount.toString()),
      0
    ) || 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSalesData } = await supabase
      .from('external_sales')
      .select('id, product_id, sale_date')
      .eq('brand_id', brand.id)
      .gte('sale_date', thirtyDaysAgo.toISOString());

    const { data: reviewsData } = await supabase
      .from('brand_reviews')
      .select('rating')
      .eq('brand_id', brand.id);

    const reviewsCount = reviewsData?.length || 0;
    const averageRating = reviewsCount > 0 && reviewsData
      ? Math.round((reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsCount) * 10) / 10
      : 0;

    setStats({
      followersCount: brand.followers_count,
      productsCount: productsCount || 0,
      totalOrders,
      totalRevenue,
      recentOrders: recentSalesData?.length || 0,
      averageRating,
      reviewsCount,
    });

    setLoading(false);
  };

  if (loading) {
    const tCommon = useTranslations('common');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
          <Link href="/dashboard/brand/products/new">
            <Button>{t('addNewProduct')}</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title={t('stats.followers')}
            value={stats.followersCount}
            icon={Users}
            description={t('stats.totalFollowers')}
          />
          <StatCard
            title={t('stats.products')}
            value={stats.productsCount}
            icon={Package}
            description={t('stats.totalProducts')}
          />
          <StatCard
            title={t('stats.reviews')}
            value={stats.reviewsCount > 0 ? `${stats.averageRating} ★` : '0'}
            icon={Star}
            description={`${stats.reviewsCount} ${stats.reviewsCount === 1 ? t('stats.review') : t('stats.reviewsPlural')}`}
          />
          <StatCard
            title={t('stats.totalRevenue')}
            value={`€${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            description={t('stats.allTimeRevenue')}
          />
          <StatCard
            title={t('stats.orders30d')}
            value={stats.recentOrders}
            icon={ShoppingBag}
            description={t('stats.last30Days')}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/brand/products/new">
                <Button className="w-full" variant="outline">
                  {t('quickActions.addProduct')}
                </Button>
              </Link>
              <Link href="/dashboard/brand/profile">
                <Button className="w-full" variant="outline">
                  {t('quickActions.updateProfile')}
                </Button>
              </Link>
              <Link href="/dashboard/brand/products">
                <Button className="w-full" variant="outline">
                  {t('quickActions.viewAllProducts')}
                </Button>
              </Link>
              <Link href="/dashboard/brand/reviews">
                <Button className="w-full" variant="outline">
                  {t('quickActions.manageReviews')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
