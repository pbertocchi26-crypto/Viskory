'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface BrandProfile {
  id?: string;
  name: string;
  slug: string;
  logo_url: string;
  cover_image_url: string;
  short_bio: string;
  description: string;
  location: string;
  instagram_url: string;
  tiktok_url: string;
  website_url: string;
  story_title?: string;
  story_content?: string;
  story_images?: string[];
}

export default function BrandProfilePage() {
  const t = useTranslations();
  const [profile, setProfile] = useState<BrandProfile>({
    name: '',
    slug: '',
    logo_url: '',
    cover_image_url: '',
    short_bio: '',
    description: '',
    location: '',
    instagram_url: '',
    tiktok_url: '',
    website_url: '',
    story_title: '',
    story_content: '',
    story_images: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'BRAND') {
      router.push('/auth/login');
      return;
    }

    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    if (!user) return;

    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (brand) {
      setProfile(brand);
    } else {
      setIsNew(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isNew) {
        const { data: existingSlug } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', profile.slug)
          .maybeSingle();

        if (existingSlug) {
          toast({
            title: 'Error',
            full_description: 'This slug is already taken',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('brands').insert([
          {
            ...profile,
            owner_user_id: user!.id,
          },
        ]);

        if (error) throw error;

        toast({
          title: 'Success',
          full_description: 'Brand profile created successfully',
        });
      } else {
        const { error } = await supabase
          .from('brands')
          .update(profile)
          .eq('id', profile.id!);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Brand profile updated successfully',
        });
      }

      router.push('/dashboard/brand');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BrandProfile, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const generateSlug = () => {
    const slug = profile.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setProfile({ ...profile, slug });
  };

  const uploadStoryImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `brand-story/${fileName}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'product-images');
    formData.append('path', filePath);

    const response = await fetch('/api/upload-product-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const currentImages = profile.story_images || [];
    if (currentImages.length >= 6) {
      toast({
        title: t('common.error'),
        description: t('dashboard.brand.story.maxImagesReached'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map((file) => uploadStoryImage(file));
      const urls = await Promise.all(uploadPromises);

      const newImages = [...currentImages, ...urls].slice(0, 6);
      setProfile({ ...profile, story_images: newImages });

      toast({
        title: t('common.success'),
        description: 'Images uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeStoryImage = (index: number) => {
    const newImages = [...(profile.story_images || [])];
    newImages.splice(index, 1);
    setProfile({ ...profile, story_images: newImages });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-6">
          {isNew ? 'Setup Brand Profile' : 'Edit Brand Profile'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={profile.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    required
                    placeholder="your-brand-name"
                  />
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Your brand will be accessible at: /brand/{profile.slug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={profile.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_image_url">Cover Image URL</Label>
                <Input
                  id="cover_image_url"
                  type="url"
                  value={profile.cover_image_url}
                  onChange={(e) => handleChange('cover_image_url', e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_bio">Short Bio</Label>
                <Input
                  id="short_bio"
                  value={profile.short_bio}
                  onChange={(e) => handleChange('short_bio', e.target.value)}
                  placeholder="A brief description of your brand"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Tell customers about your brand story and values"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="New York, USA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  type="url"
                  value={profile.instagram_url}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok_url">TikTok URL</Label>
                <Input
                  id="tiktok_url"
                  type="url"
                  value={profile.tiktok_url}
                  onChange={(e) => handleChange('tiktok_url', e.target.value)}
                  placeholder="https://tiktok.com/@yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={profile.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                  placeholder="https://yourbrand.com"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isNew ? 'Create Profile' : 'Update Profile'}
                </Button>
                {!isNew && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/brand')}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Brand Story Section */}
        <Card className="mt-8 bg-secondary/10 border-secondary/30">
          <CardHeader>
            <CardTitle className="text-text">{t('dashboard.brand.story.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.brand.story.subtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="story_title" className="text-text">
                  {t('dashboard.brand.story.storyTitle')}
                </Label>
                <Input
                  id="story_title"
                  value={profile.story_title || ''}
                  onChange={(e) => handleChange('story_title', e.target.value)}
                  placeholder={t('dashboard.brand.story.storyTitlePlaceholder')}
                  className="bg-white border-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="story_content" className="text-text">
                  {t('dashboard.brand.story.storyContent')}
                </Label>
                <Textarea
                  id="story_content"
                  value={profile.story_content || ''}
                  onChange={(e) => handleChange('story_content', e.target.value)}
                  placeholder={t('dashboard.brand.story.storyContentPlaceholder')}
                  rows={6}
                  className="bg-white border-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-text">{t('dashboard.brand.story.storyImages')}</Label>
                <div className="space-y-3">
                  {profile.story_images && profile.story_images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {profile.story_images.map((url, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-secondary/30"
                        >
                          <Image
                            src={url}
                            alt={`Story image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeStoryImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!profile.story_images || profile.story_images.length < 6) && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleStoryImageUpload}
                        disabled={uploading}
                        className="hidden"
                        id="story-images-upload"
                      />
                      <label
                        htmlFor="story-images-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          uploading
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                            : 'bg-white border-accent hover:bg-accent/5'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-accent mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading
                            ? 'Uploading...'
                            : t('dashboard.brand.story.uploadStoryImages')}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {loading ? 'Saving...' : 'Save Story'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
