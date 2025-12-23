'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Users, Store, Package, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalBrands: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBrands: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadStats();
  }, [user, router]);

  const loadStats = async () => {
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'PAID');

    const totalRevenue = orders?.reduce(
      (sum, order) => sum + parseFloat(order.total_amount),
      0
    ) || 0;

    setStats({
      totalUsers: usersCount || 0,
      totalBrands: brandsCount || 0,
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalRevenue,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform management and overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            description="All registered users"
          />
          <StatCard
            title="Total Brands"
            value={stats.totalBrands}
            icon={Store}
            description="Active brands"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
            description="All products"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            description="From all orders"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/admin/users">
                <Button className="w-full" variant="outline">
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/brands">
                <Button className="w-full" variant="outline">
                  Manage Brands
                </Button>
              </Link>
              <Link href="/admin/brand-requests">
                <Button className="w-full" variant="outline">
                  Brand Requests
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button className="w-full" variant="outline">
                  Manage Products
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button className="w-full" variant="outline">
                  View Orders
                </Button>
              </Link>
              <Link href="/admin/hero-slides">
                <Button className="w-full" variant="outline">
                  Homepage Banners
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
