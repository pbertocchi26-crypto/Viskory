'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';

export function ProfileGiftCards() {
  const t = useTranslations('profile.giftCards');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-2">{t('comingSoon')}</p>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
