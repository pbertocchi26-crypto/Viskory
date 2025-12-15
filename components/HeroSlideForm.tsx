'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Upload, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

type HeroSlideFormData = {
  imageUrl: string;
  title: string;
  subtitle: string;
  position: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

interface HeroSlideFormProps {
  slideId?: string;
  initialData?: HeroSlideFormData;
}

export function HeroSlideForm({ slideId, initialData }: HeroSlideFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('admin.heroSlides');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [position, setPosition] = useState<string>(initialData?.position?.toString() || '1');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(initialData?.startsAt || '');
  const [endsAt, setEndsAt] = useState(initialData?.endsAt || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl && !imageFile) {
      toast({
        title: 'Error',
        description: 'Please select an image',
        variant: 'destructive',
      });
      return;
    }

    if (!title || !subtitle) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        setUploading(true);
        finalImageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      const slideData = {
        image_url: finalImageUrl,
        title,
        subtitle,
        position: parseInt(position),
        is_active: isActive,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
      };

      let error;

      if (slideId) {
        const result = await supabase
          .from('hero_slides')
          .update(slideData)
          .eq('id', slideId);
        error = result.error;
      } else {
        const result = await supabase
          .from('hero_slides')
          .insert([slideData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: slideId ? 'Slide updated successfully' : 'Slide created successfully',
      });

      router.push(`/${locale}/admin/hero-slides`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save slide',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Slide Image</h2>

          <div className="space-y-4">
            {imagePreview && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <Label htmlFor="image">{t('fields.image')} *</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload image'}
                    </span>
                  </div>
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Slide Content</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('fields.title')} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="NEW"
                required
                maxLength={50}
              />
              <p className="text-sm text-gray-500 mt-1">Large overlay text on the slide</p>
            </div>

            <div>
              <Label htmlFor="subtitle">{t('fields.subtitle')} *</Label>
              <Textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Scopri ora le nuove uscite"
                required
                maxLength={200}
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">Smaller text below the title</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Display Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="position">{t('fields.position')} *</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Position {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Order in the carousel (1-10)</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {t('fields.isActive')}
              </Label>
            </div>

            <div>
              <Label htmlFor="startsAt">{t('fields.startsAt')}</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty to show immediately</p>
            </div>

            <div>
              <Label htmlFor="endsAt">{t('fields.endsAt')}</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty for no expiration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/hero-slides`)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading || uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploading ? 'Uploading...' : 'Saving...'}
            </>
          ) : (
            slideId ? t('edit') : 'Create Slide'
          )}
        </Button>
      </div>
    </form>
  );
}
