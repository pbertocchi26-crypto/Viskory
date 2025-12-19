'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HeroSlideForm } from '@/components/HeroSlideForm';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function EditHeroSlidePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('admin.heroSlides');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [slideData, setSlideData] = useState<any>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push(`/${locale}`);
      return;
    }
    loadSlide();
  }, [user, router, locale, params.id]);

  const loadSlide = async () => {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        full_description: 'Slide not found',
        variant: 'destructive',
      });
      router.push(`/${locale}/admin/hero-slides`);
      return;
    }

    setSlideData({
      imageUrl: data.image_url,
      title: data.title,
      subtitle: data.subtitle,
      position: data.position,
      isActive: data.is_active,
      startsAt: data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : '',
      endsAt: data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : '',
    });
    setLoading(false);
  };

  if (!user || user.role !== 'ADMIN' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/${locale}/admin/hero-slides`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to slides
          </Link>
          <h1 className="text-3xl font-bold">{t('edit')}</h1>
          <p className="text-gray-600 mt-1">Update slide information</p>
        </div>

        {slideData && (
          <HeroSlideForm slideId={params.id} initialData={slideData} />
        )}
      </div>
    </DashboardLayout>
  );
}
