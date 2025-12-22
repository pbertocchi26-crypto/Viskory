'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { User } from '@/lib/auth';

interface ProfileMyDataProps {
  user: User;
}

export function ProfileMyData({ user }: ProfileMyDataProps) {
  const t = useTranslations('profile.myData');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(t('updateSuccess'));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('name')}</p>
                <p className="text-lg text-foreground">{user.name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('email')}</p>
                <p className="text-lg text-foreground">{user.email}</p>
              </div>

              {user.created_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('memberSince')}</p>
                  <p className="text-lg text-foreground">
                    {format(new Date(user.created_at), 'dd MMMM yyyy')}
                  </p>
                </div>
              )}
            </div>

            <Button onClick={() => setIsEditing(true)} variant="outline">
              {t('edit')}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('name')}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('email')}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t('updating') : t('save')}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setName(user.name || '');
                }}
                variant="outline"
                disabled={isSaving}
              >
                {t('cancel')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
