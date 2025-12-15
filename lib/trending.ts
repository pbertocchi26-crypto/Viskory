import { supabase } from './supabase/client';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  short_bio?: string;
  followers_count: number;
  status: string;
  is_featured: boolean;
  created_at: string;
}

export interface BrandWithScore extends Brand {
  trendingScore: number;
  productCount: number;
  recentOrders: number;
}

export async function getTrendingBrands(limit: number = 6): Promise<BrandWithScore[]> {
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('status', 'APPROVED')
    .order('followers_count', { ascending: false });

  if (!brands) return [];

  const brandsWithScores = await Promise.all(
    brands.map(async (brand) => {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brand.id)
        .eq('is_published', true);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales } = await supabase
        .from('external_sales')
        .select('id, product_id, sale_date')
        .eq('brand_id', brand.id)
        .gte('sale_date', thirtyDaysAgo.toISOString());

      const recentOrders = recentSales?.length || 0;

      const trendingScore =
        brand.followers_count * 2 +
        (productCount || 0) * 10 +
        recentOrders * 5;

      return {
        ...brand,
        trendingScore,
        productCount: productCount || 0,
        recentOrders,
      };
    })
  );

  return brandsWithScores
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
}
