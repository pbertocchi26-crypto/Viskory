'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { HeroSlideForm } from '@/components/HeroSlideForm';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NewHeroSlidePage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('admin.heroSlides');
  const locale = useLocale();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push(`/${locale}`);
    }
  }, [user, router, locale]);

  if (!user || user.role !== 'ADMIN') {
    return null;
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
          <h1 className="text-3xl font-bold">{t('new')}</h1>
          <p className="text-gray-600 mt-1">Create a new homepage banner slide</p>
        </div>

        <HeroSlideForm />
      </div>
    </DashboardLayout>
  );
}
