'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { ProductForm } from '@/components/ProductForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function NewProductPage() {
  const t = useTranslations();
  const [brandId, setBrandId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'BRAND') {
      router.push('/auth/login');
      return;
    }

    loadBrand();
  }, [user, router]);

  const loadBrand = async () => {
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
  };

  if (!brandId) {
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
          {t('dashboard.brand.newProduct')}
        </h1>
        <p className="text-muted-foreground mb-8">
          Add a new sustainable product to your collection
        </p>

        <ProductForm brandId={brandId} mode="create" />
      </div>
    </div>
  );
}
