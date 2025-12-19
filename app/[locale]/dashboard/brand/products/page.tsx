'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { publishScheduledProducts } from '@/lib/publishScheduledProducts';
import { Edit, Trash2, Plus, Calendar, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: string;
  main_image_url?: string;
  category?: string;
  is_published: boolean;
  stock_by_size?: Record<string, number>;
  scheduled_for?: string | null;
  published_at?: string | null;
  created_at: string;
}

export default function ProductsManagementPage() {
  const t = useTranslations();
  const [products, setProducts] = useState<Product[]>([]);
  const [scheduledProducts, setScheduledProducts] = useState<Product[]>([]);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'BRAND') {
      router.push('/auth/login');
      return;
    }

    loadProducts();
  }, [user, router]);

  const loadProducts = async () => {
    if (!user) return;

    // Auto-publish scheduled products that are due
    await publishScheduledProducts();

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!brand) {
      router.push('/dashboard/brand/profile');
      return;
    }

    setBrandId(brand.id);

    // Fetch all products (published and drafts)
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brand.id)
      .or('is_published.eq.true,scheduled_for.is.null')
      .order('created_at', { ascending: false });

    // Fetch scheduled products separately
    const { data: scheduledData } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brand.id)
      .eq('is_published', false)
      .not('scheduled_for', 'is', null)
      .gt('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (productsData) {
      setProducts(productsData);
    }

    if (scheduledData) {
      setScheduledProducts(scheduledData);
    }

    setLoading(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t('common.delete') + '?')) return;

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      toast({
        title: t('common.error'),
        full_description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        full_description: 'Product deleted successfully',
      });
      setProducts(products.filter((p) => p.id !== productId));
      setScheduledProducts(scheduledProducts.filter((p) => p.id !== productId));
    }
  };

  const togglePublish = async (productId: string, currentStatus: boolean) => {
    const updateData: any = { is_published: !currentStatus };

    if (!currentStatus) {
      updateData.published_at = new Date().toISOString();
      updateData.scheduled_for = null;
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (error) {
      toast({
        title: t('common.error'),
        full_description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        full_description: `Product ${!currentStatus ? 'published' : 'unpublished'}`,
      });
      loadProducts();
    }
  };

  const publishNow = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        scheduled_for: null,
      })
      .eq('id', productId);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: 'Product published successfully',
      });
      loadProducts();
    }
  };

  const cancelSchedule = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({
        scheduled_for: null,
      })
      .eq('id', productId);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: 'Schedule cancelled',
      });
      loadProducts();
    }
  };

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTotalStock = (stockBySize: Record<string, number> | undefined): number => {
    if (!stockBySize) return 0;
    return Object.values(stockBySize).reduce((sum, stock) => sum + stock, 0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Products</h1>
            <p className="text-muted-foreground mt-2">Create and manage your product catalog</p>
          </div>
          <Link href="/dashboard/brand/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Scheduled Products Section */}
        {scheduledProducts.length > 0 && (
          <Card className="mb-8 bg-accent/5 border-accent/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold text-text">
                  {t('dashboard.products.scheduled.title')}
                </h2>
              </div>

              <div className="space-y-3">
                {scheduledProducts.map((product) => (
                  <Card key={product.id} className="bg-white border-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.main_image_url ? (
                            <Image
                              src={product.main_image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-text">{product.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-muted-foreground text-sm">
                              €{parseFloat(product.price).toFixed(2)}
                            </p>
                            <Badge className="bg-accent text-white">
                              {product.scheduled_for && formatScheduleDate(product.scheduled_for)}
                            </Badge>
                            {product.category && (
                              <span className="text-xs text-muted-foreground">
                                {t(`dashboard.products.categories.${product.category}`)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishNow(product.id)}
                            className="border-primary text-primary hover:bg-primary hover:text-white"
                          >
                            {t('dashboard.products.actions.publishNow')}
                          </Button>
                          <Link href={`/dashboard/brand/products/${product.id}/edit`}>
                            <Button variant="outline" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => cancelSchedule(product.id)}
                            className="text-muted-foreground hover:text-text"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Products List */}
        {products.length === 0 && scheduledProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Link href="/dashboard/brand/products/new">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Add Your First Product
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => {
              const isScheduled = product.scheduled_for && !product.is_published;
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.main_image_url ? (
                          <Image
                            src={product.main_image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-text">{product.name}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <p className="text-muted-foreground">
                            €{parseFloat(product.price).toFixed(2)}
                          </p>
                          {product.is_published ? (
                            <Badge className="bg-primary text-white">
                              {t('dashboard.products.form.published')}
                            </Badge>
                          ) : isScheduled ? (
                            <Badge className="bg-accent text-white">
                              {t('dashboard.products.badges.scheduled', {
                                date: product.scheduled_for
                                  ? formatScheduleDate(product.scheduled_for)
                                  : '',
                              })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t('dashboard.products.form.draft')}
                            </Badge>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Stock: {getTotalStock(product.stock_by_size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isScheduled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePublish(product.id, product.is_published)}
                            className="border-secondary/30 hover:bg-secondary/10"
                          >
                            {product.is_published ? 'Unpublish' : 'Publish'}
                          </Button>
                        )}
                        <Link href={`/dashboard/brand/products/${product.id}/edit`}>
                          <Button variant="outline" size="icon" className="border-secondary/30">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="border-secondary/30"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
