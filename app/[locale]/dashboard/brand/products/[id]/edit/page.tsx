'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { ProductForm } from '@/components/ProductForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: string;
  main_image_url: string;
  additional_image_urls: string[];
  category: string;
  sizes: string[];
  colors: string[];
  stock_by_size: Record<string, number>;
  price_by_size: Record<string, number>;
  is_published: boolean;
  scheduled_for?: string | null;
  published_at?: string | null;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'BRAND') {
      router.push('/auth/login');
      return;
    }

    loadProduct();
  }, [user, router, params.id]);

  const loadProduct = async () => {
    if (!user) return;

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!brand) {
      router.push('/dashboard/brand/profile');
      return;
    }

    setBrandId(brand.id);

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('brand_id', brand.id)
      .maybeSingle();

    if (!product) {
      toast({
        title: t('common.error'),
        description: 'Product not found',
        variant: 'destructive',
      });
      router.push('/dashboard/brand/products');
      return;
    }

    setProductData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      main_image_url: product.main_image_url || '',
      additional_image_urls: Array.isArray(product.additional_image_urls)
        ? product.additional_image_urls
        : [],
      category: product.category || '',
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
      stock_by_size: product.stock_by_size || {},
      price_by_size: product.price_by_size || {},
      is_published: product.is_published,
      scheduled_for: product.scheduled_for || null,
      published_at: product.published_at || null,
    });
  };

  if (!productData || !brandId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-bold text-text mb-2">
          {t('dashboard.brand.editProduct')}
        </h1>
        <p className="text-muted-foreground mb-8">
          Update your product details and images
        </p>

        <ProductForm initialData={productData} brandId={brandId} mode="edit" />
      </div>
    </div>
  );
}
