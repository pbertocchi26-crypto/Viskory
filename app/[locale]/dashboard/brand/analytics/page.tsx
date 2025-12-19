'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Eye,
  MousePointer,
  Users,
  ShoppingCart,
  TrendingUp,
  Heart,
  ExternalLink,
  DollarSign,
  Package,
  Award
} from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalFollowers: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  clickThroughRate: number;
  topProducts: Array<{
    name: string;
    views: number;
    clicks: number;
    sales: number;
    revenue: number;
    conversion: number;
  }>;
  mostLikedProducts: Array<{ name: string; likes: number }>;
  viewsOverTime: Array<{ date: string; views: number; clicks: number }>;
  salesOverTime: Array<{ date: string; sales: number; revenue: number }>;
  recentClicks: Array<{ product_name: string; clicked_at: string; user_name?: string }>;
  referralData: Array<{ name: string; value: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const t = useTranslations('dashboard.brand.analytics');
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalClicks: 0,
    totalFollowers: 0,
    totalSales: 0,
    totalRevenue: 0,
    conversionRate: 0,
    clickThroughRate: 0,
    topProducts: [],
    mostLikedProducts: [],
    viewsOverTime: [],
    salesOverTime: [],
    recentClicks: [],
    referralData: []
  });

  useEffect(() => {
    if (user?.role === 'BRAND') {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[timeRange];

    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  const loadAnalytics = async () => {
    if (!user) return;

    const { data: brand } = await supabase
      .from('brands')
      .select('id, followers_count')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!brand) {
      setLoading(false);
      return;
    }

    setBrandId(brand.id);
    const startDate = getDateFilter();

    const [
      viewsResult,
      clicksResult,
      salesResult,
      productsResult,
      likesResult,
      recentClicksResult
    ] = await Promise.all([
      supabase
        .from('product_views')
        .select('*')
        .eq('brand_id', brand.id)
        .gte('viewed_at', startDate),

      supabase
        .from('product_clicks')
        .select('*, products(name)')
        .eq('brand_id', brand.id)
        .gte('clicked_at', startDate),

      supabase
        .from('external_sales')
        .select('*')
        .eq('brand_id', brand.id)
        .gte('sale_date', startDate),

      supabase
        .from('products')
        .select('id, name')
        .eq('brand_id', brand.id),

      supabase
        .from('product_likes')
        .select('product_id, products(name)')
        .eq('brand_id', brand.id),

      supabase
        .from('product_clicks')
        .select('clicked_at, products(name), users(name)')
        .eq('brand_id', brand.id)
        .gte('clicked_at', startDate)
        .order('clicked_at', { ascending: false })
        .limit(10)
    ]);

    const views = viewsResult.data || [];
    const clicks = clicksResult.data || [];
    const sales = salesResult.data || [];
    const products = productsResult.data || [];
    const likes = likesResult.data || [];
    const recentClicks = recentClicksResult.data || [];

    const totalViews = views.length;
    const totalClicks = clicks.length;
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.amount.toString()), 0);
    const conversionRate = totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0;
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    const productStats: Record<string, any> = {};
    products.forEach(product => {
      productStats[product.id] = {
        name: product.name,
        views: 0,
        clicks: 0,
        sales: 0,
        revenue: 0,
        likes: 0
      };
    });

    views.forEach(view => {
      if (productStats[view.product_id]) {
        productStats[view.product_id].views++;
      }
    });

    clicks.forEach(click => {
      if (productStats[click.product_id]) {
        productStats[click.product_id].clicks++;
      }
    });

    sales.forEach(sale => {
      if (sale.product_id && productStats[sale.product_id]) {
        productStats[sale.product_id].sales++;
        productStats[sale.product_id].revenue += parseFloat(sale.amount.toString());
      }
    });

    likes.forEach((like: any) => {
      if (productStats[like.product_id]) {
        productStats[like.product_id].likes++;
      }
    });

    const topProducts = Object.values(productStats)
      .map((p: any) => ({
        ...p,
        conversion: p.clicks > 0 ? (p.sales / p.clicks) * 100 : 0
      }))
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 5);

    const mostLikedProducts = Object.values(productStats)
      .map((p: any) => ({ name: p.name, likes: p.likes }))
      .sort((a, b) => b.likes - a.likes)
      .filter(p => p.likes > 0)
      .slice(0, 5);

    const viewsByDate: Record<string, { views: number; clicks: number }> = {};
    views.forEach(view => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      if (!viewsByDate[date]) viewsByDate[date] = { views: 0, clicks: 0 };
      viewsByDate[date].views++;
    });
    clicks.forEach(click => {
      const date = new Date(click.clicked_at).toISOString().split('T')[0];
      if (!viewsByDate[date]) viewsByDate[date] = { views: 0, clicks: 0 };
      viewsByDate[date].clicks++;
    });

    const viewsOverTime = Object.entries(viewsByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
        views: data.views,
        clicks: data.clicks
      }));

    const salesByDate: Record<string, { sales: number; revenue: number }> = {};
    sales.forEach(sale => {
      const date = new Date(sale.sale_date).toISOString().split('T')[0];
      if (!salesByDate[date]) salesByDate[date] = { sales: 0, revenue: 0 };
      salesByDate[date].sales++;
      salesByDate[date].revenue += parseFloat(sale.amount.toString());
    });

    const salesOverTime = Object.entries(salesByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
        sales: data.sales,
        revenue: data.revenue
      }));

    const viskoryReferrals = sales.filter(s => s.viskory_referral).length;
    const directSales = sales.length - viskoryReferrals;
    const referralData = [
      { name: 'Da Viskory', value: viskoryReferrals },
      { name: 'Dirette', value: directSales }
    ].filter(d => d.value > 0);

    setAnalytics({
      totalViews,
      totalClicks,
      totalFollowers: brand.followers_count || 0,
      totalSales,
      totalRevenue,
      conversionRate,
      clickThroughRate,
      topProducts,
      mostLikedProducts,
      viewsOverTime,
      salesOverTime,
      recentClicks: recentClicks.map((click: any) => ({
        product_name: click.products?.name || 'Unknown',
        clicked_at: click.clicked_at,
        user_name: click.users?.name
      })),
      referralData
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Visualizzazioni totali',
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      full_description: 'Visite alle pagine dei tuoi prodotti'
    },
    {
      title: 'Click esterni',
      value: analytics.totalClicks.toLocaleString(),
      icon: MousePointer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      full_description: 'Click verso il tuo sito'
    },
    {
      title: 'Vendite sincronizzate',
      value: analytics.totalSales.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      full_description: 'Vendite dal tuo sito'
    },
    {
      title: 'Fatturato totale',
      value: `€${analytics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      full_description: 'Dalle vendite sincronizzate'
    },
    {
      title: 'Tasso di conversione',
      value: `${analytics.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Click che diventano vendite'
    },
    {
      title: 'Click-Through Rate',
      value: `${analytics.clickThroughRate.toFixed(1)}%`,
      icon: ExternalLink,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: 'Visualizzazioni che diventano click'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'bg-secondary/10 text-foreground hover:bg-secondary/20'
                }`}
              >
                {range === '7d' && '7 giorni'}
                {range === '30d' && '30 giorni'}
                {range === '90d' && '90 giorni'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mb-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Visualizzazioni e Click nel tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Visualizzazioni" />
                  <Line type="monotone" dataKey="clicks" stroke="#10b981" name="Click" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Vendite e Fatturato nel tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#8b5cf6" name="Vendite" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#f59e0b" name="Fatturato (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border">
            <CardHeader>
              <CardTitle>Top Prodotti - Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProducts.length > 0 ? (
                  analytics.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-primary text-white">#{index + 1}</Badge>
                          <p className="font-semibold text-foreground">{product.name}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Visualizzazioni</p>
                            <p className="font-semibold text-blue-600">{product.views}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Click</p>
                            <p className="font-semibold text-green-600">{product.clicks}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vendite</p>
                            <p className="font-semibold text-purple-600">{product.sales}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fatturato</p>
                            <p className="font-semibold text-orange-600">€{product.revenue.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversione</p>
                            <p className="font-semibold text-indigo-600">{product.conversion.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nessun dato disponibile per il periodo selezionato
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Prodotti più amati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.mostLikedProducts.length > 0 ? (
                  analytics.mostLikedProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                      <p className="text-sm font-medium text-foreground truncate flex-1">
                        {product.name}
                      </p>
                      <Badge variant="secondary" className="bg-red-50 text-red-700">
                        {product.likes} ❤️
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Nessun like ancora
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {analytics.referralData.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Origine Vendite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.referralData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.referralData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Click recenti verso il tuo sito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recentClicks.length > 0 ? (
                analytics.recentClicks.map((click, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{click.product_name}</p>
                        {click.user_name && (
                          <p className="text-xs text-muted-foreground">da {click.user_name}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(click.clicked_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nessun click ancora
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
