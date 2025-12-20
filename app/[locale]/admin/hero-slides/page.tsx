'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type HeroSlide = {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  position: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export default function AdminHeroSlidesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('admin.heroSlides');
  const locale = useLocale();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push(`/${locale}`);
      return;
    }
    loadSlides();
  }, [user, router, locale]);

  const loadSlides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load slides',
        variant: 'destructive',
      });
    } else {
      setSlides(data || []);
    }
    setLoading(false);
  };

  const getSlideStatus = (slide: HeroSlide) => {
    const now = new Date();
    const startsAt = slide.starts_at ? new Date(slide.starts_at) : null;
    const endsAt = slide.ends_at ? new Date(slide.ends_at) : null;

    if (!slide.is_active) {
      return { label: t('status.inactive'), color: 'text-gray-500 bg-gray-100' };
    }

    if (startsAt && startsAt > now) {
      return { label: t('status.scheduled'), color: 'text-blue-600 bg-blue-100' };
    }

    if (endsAt && endsAt < now) {
      return { label: t('status.expired'), color: 'text-red-600 bg-red-100' };
    }

    return { label: t('status.active'), color: 'text-green-600 bg-green-100' };
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('hero_slides')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update slide',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Slide updated successfully',
      });
      loadSlides();
    }
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;

    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', slideToDelete);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete slide',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Slide deleted successfully',
      });
      loadSlides();
    }

    setDeleteDialogOpen(false);
    setSlideToDelete(null);
  };

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-gray-600 mt-1">Manage homepage banner carousel</p>
          </div>
          <Link href={`/${locale}/admin/hero-slides/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('new')}
            </Button>
          </Link>
        </div>

        {slides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No slides yet. Create your first one!</p>
              <Link href={`/${locale}/admin/hero-slides/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Slide
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {slides.map((slide) => {
              const status = getSlideStatus(slide);
              return (
                <Card key={slide.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                          #{slide.position}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">{slide.title}</h3>
                            <p className="text-gray-600 text-sm">{slide.subtitle}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          {slide.starts_at && (
                            <span>
                              Starts: {new Date(slide.starts_at).toLocaleDateString()}
                            </span>
                          )}
                          {slide.ends_at && (
                            <span>
                              Ends: {new Date(slide.ends_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={slide.is_active}
                              onCheckedChange={() => toggleActive(slide.id, slide.is_active)}
                            />
                            <span className="text-sm text-gray-600">
                              {t('fields.isActive')}
                            </span>
                          </div>

                          <div className="flex gap-2 ml-auto">
                            <Link href={`/${locale}/admin/hero-slides/${slide.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Pencil className="w-4 h-4 mr-1" />
                                {t('edit')}
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSlideToDelete(slide.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
