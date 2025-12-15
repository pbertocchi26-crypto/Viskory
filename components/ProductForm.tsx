'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  main_image_url: string;
  additional_image_urls: string[];
  category: string;
  material?: string;
  made_in?: string;
  gender?: string;
  discount_percentage?: number;
  external_url?: string;
  sizes: string[];
  colors: string[];
  stock_by_size: Record<string, number>;
  price_by_size: Record<string, number>;
  is_published: boolean;
  scheduled_for?: string | null;
  published_at?: string | null;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  brandId: string;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  'tshirts',
  'sweaters',
  'sweatshirts',
  'hoodies',
  'shirts',
  'pants',
  'jeans',
  'shorts',
  'dresses',
  'skirts',
  'jackets',
  'coats',
  'activewear',
  'accessories',
  'shoes',
  'other',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '26', '28', '30', '32', '34', 'One Size'];

const COLORS = [
  'Black',
  'White',
  'Beige',
  'Grey',
  'Navy',
  'Blue',
  'Green',
  'Brown',
  'Red',
  'Pink',
  'Olive',
  'Cream',
  'Khaki',
];

const MATERIALS = [
  'cotton',
  'organic_cotton',
  'wool',
  'cashmere',
  'linen',
  'silk',
  'hemp',
  'bamboo',
  'viscose',
  'polyester',
  'nylon',
  'elastane',
  'recycled',
  'mixed',
  'other',
];

const COUNTRIES = [
  'italy',
  'france',
  'spain',
  'portugal',
  'germany',
  'uk',
  'usa',
  'turkey',
  'morocco',
  'tunisia',
  'india',
  'bangladesh',
  'china',
  'vietnam',
  'romania',
  'poland',
  'other',
];

export function ProductForm({ initialData, brandId, mode }: ProductFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  // Determine initial launch mode from initialData
  const hasSchedule = initialData?.scheduled_for && !initialData?.is_published;
  const initialLaunchMode = hasSchedule ? 'schedule' : 'now';
  const initialScheduleDate = hasSchedule && initialData?.scheduled_for
    ? new Date(initialData.scheduled_for).toISOString().split('T')[0]
    : '';
  const initialScheduleTime = hasSchedule && initialData?.scheduled_for
    ? new Date(initialData.scheduled_for).toTimeString().slice(0, 5)
    : '';

  const [form, setForm] = useState<ProductFormData>(
    initialData || {
      name: '',
      description: '',
      price: '0',
      main_image_url: '',
      additional_image_urls: [],
      category: '',
      material: '',
      made_in: '',
      gender: 'UNISEX',
      discount_percentage: 0,
      external_url: '',
      sizes: [],
      colors: [],
      stock_by_size: {},
      price_by_size: {},
      is_published: false,
      scheduled_for: null,
      published_at: null,
    }
  );

  const [launchMode, setLaunchMode] = useState<'now' | 'schedule'>(initialLaunchMode);
  const [scheduleDate, setScheduleDate] = useState(initialScheduleDate);
  const [scheduleTime, setScheduleTime] = useState(initialScheduleTime);

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(
    initialData?.main_image_url || ''
  );
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>(
    initialData?.additional_image_urls || []
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otherColor, setOtherColor] = useState('');

  const totalImages = (mainImagePreview ? 1 : 0) + additionalImagePreviews.length;
  const maxImagesReached = totalImages >= 7;

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 7 - totalImages;

    if (files.length > remainingSlots) {
      toast({
        title: t('common.error'),
        description: t('dashboard.products.form.maxImages'),
        variant: 'destructive',
      });
      return;
    }

    setAdditionalImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview('');
    setForm({ ...form, main_image_url: '' });
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setAdditionalImageFiles((prev) => prev.filter((_, i) => i !== index));

    if (index < form.additional_image_urls.length) {
      setForm({
        ...form,
        additional_image_urls: form.additional_image_urls.filter((_, i) => i !== index),
      });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch('/api/upload-product-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = t('dashboard.products.errors.nameRequired');
    }

    if (!form.description.trim()) {
      newErrors.description = t('dashboard.products.errors.descriptionRequired');
    } else if (form.description.trim().length < 20) {
      newErrors.description = t('dashboard.products.errors.descriptionTooShort');
    }

    if (!form.category) {
      newErrors.category = t('dashboard.products.errors.categoryRequired');
    }

    if (form.sizes.length === 0) {
      newErrors.sizes = t('dashboard.products.errors.sizesRequired');
    }

    form.sizes.forEach((size) => {
      if (!form.price_by_size[size] || form.price_by_size[size] <= 0) {
        newErrors[`price_${size}`] = t('dashboard.products.errors.priceForSizeRequired', { size });
      }
    });

    if (form.colors.length === 0) {
      newErrors.colors = t('dashboard.products.errors.colorsRequired');
    }

    if (!mainImagePreview && mode === 'create') {
      newErrors.main_image = t('dashboard.products.errors.imageRequired');
    }

    // Validate launch schedule
    if (launchMode === 'schedule') {
      if (!scheduleDate) {
        newErrors.scheduleDate = t('dashboard.products.errors.scheduleDateRequired');
      }
      if (!scheduleTime) {
        newErrors.scheduleTime = t('dashboard.products.errors.scheduleTimeRequired');
      }
      if (scheduleDate && scheduleTime) {
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledDateTime <= new Date()) {
          newErrors.schedule = t('dashboard.products.errors.invalidSchedule');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: t('common.error'),
        description: t('dashboard.products.errors.fixErrors'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      let mainImageUrl = form.main_image_url;
      if (mainImageFile) {
        mainImageUrl = await uploadImage(mainImageFile);
      }

      const additionalImageUrls = [...form.additional_image_urls];
      for (const file of additionalImageFiles) {
        const url = await uploadImage(file);
        additionalImageUrls.push(url);
      }

      const minPrice = Math.min(...Object.values(form.price_by_size));

      // Handle launch settings
      let isPublished = false;
      let publishedAt = null;
      let scheduledFor = null;

      if (launchMode === 'now') {
        isPublished = true;
        publishedAt = new Date().toISOString();
      } else if (launchMode === 'schedule') {
        isPublished = false;
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const productData = {
        brand_id: brandId,
        name: form.name,
        description: form.description,
        price: minPrice,
        main_image_url: mainImageUrl,
        additional_image_urls: additionalImageUrls,
        category: form.category,
        material: form.material || null,
        made_in: form.made_in || null,
        gender: form.gender || 'UNISEX',
        discount_percentage: form.discount_percentage || 0,
        sizes: form.sizes,
        colors: form.colors,
        stock_by_size: form.stock_by_size,
        price_by_size: form.price_by_size,
        is_published: isPublished,
        published_at: publishedAt,
        scheduled_for: scheduledFor,
      };

      if (mode === 'edit' && form.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', form.id);

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('dashboard.products.messages.updateSuccess'),
        });
      } else {
        const { error } = await supabase.from('products').insert([productData]);

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('dashboard.products.messages.createSuccess'),
        });
      }

      router.push('/dashboard/brand/products');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const toggleSize = (size: string) => {
    const newSizes = form.sizes.includes(size)
      ? form.sizes.filter((s) => s !== size)
      : [...form.sizes, size];

    const newStockBySize = { ...form.stock_by_size };
    const newPriceBySize = { ...form.price_by_size };

    if (!form.sizes.includes(size)) {
      newStockBySize[size] = 0;
      newPriceBySize[size] = 0;
    } else {
      delete newStockBySize[size];
      delete newPriceBySize[size];
    }

    setForm({
      ...form,
      sizes: newSizes,
      stock_by_size: newStockBySize,
      price_by_size: newPriceBySize,
    });
  };

  const updateStock = (size: string, stock: number) => {
    setForm({
      ...form,
      stock_by_size: {
        ...form.stock_by_size,
        [size]: stock,
      },
    });
  };

  const updatePrice = (size: string, price: number) => {
    setForm({
      ...form,
      price_by_size: {
        ...form.price_by_size,
        [size]: price,
      },
    });
  };

  const toggleColor = (color: string) => {
    setForm({
      ...form,
      colors: form.colors.includes(color)
        ? form.colors.filter((c) => c !== color)
        : [...form.colors, color],
    });
  };

  const addOtherColor = () => {
    if (otherColor.trim() && !form.colors.includes(otherColor.trim())) {
      setForm({
        ...form,
        colors: [...form.colors, otherColor.trim()],
      });
      setOtherColor('');
    }
  };

  const removeColor = (color: string) => {
    setForm({
      ...form,
      colors: form.colors.filter((c) => c !== color),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="bg-secondary/10 border-secondary/30 shadow-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            {t('dashboard.products.form.images')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
            <div className="aspect-square relative">
              {mainImagePreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={mainImagePreview}
                    alt="Main"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-7 w-7 p-0"
                    onClick={removeMainImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full border-2 border-dashed border-secondary/30 rounded-lg flex flex-col items-center justify-center hover:border-accent transition-colors cursor-pointer bg-white"
                  onClick={() => document.getElementById('main-image')?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600 text-center px-2">
                    {t('dashboard.products.form.mainImage')}
                  </p>
                </div>
              )}
              <input
                id="main-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleMainImageChange}
                className="hidden"
              />
            </div>

            {additionalImagePreviews.map((preview, index) => (
              <div key={index} className="aspect-square relative">
                <img
                  src={preview}
                  alt={`Additional ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-7 w-7 p-0"
                  onClick={() => removeAdditionalImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {!maxImagesReached && (
              <div
                className="aspect-square border-2 border-dashed border-secondary/30 rounded-lg flex flex-col items-center justify-center hover:border-accent transition-colors cursor-pointer bg-white"
                onClick={() => document.getElementById('additional-images')?.click()}
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                <p className="text-xs text-gray-600 text-center px-2">
                  {t('dashboard.products.form.additionalImages')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalImages}/7
                </p>
              </div>
            )}

            <input
              id="additional-images"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleAdditionalImagesChange}
              className="hidden"
            />
          </div>
          {errors.main_image && (
            <p className="text-sm text-red-600 mt-2">{errors.main_image}</p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            {t('dashboard.products.form.imageFormats')} • {totalImages}/7 images
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-secondary/10 border-secondary/30 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-text mb-4">
              {t('dashboard.products.form.basicInfo')}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-text">
                  {t('dashboard.products.form.productName')} *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('dashboard.products.form.productNamePlaceholder')}
                  className="bg-white border-secondary/30 focus:border-accent focus:ring-accent"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-text">
                  {t('dashboard.products.form.description')} *
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  className="bg-white border-secondary/30 focus:border-accent focus:ring-accent"
                  placeholder={t('dashboard.products.form.descriptionPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                  {form.description.length} / 20 {t('dashboard.products.form.minChars')}
                </p>
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_url" className="text-text">
                  Link diretto al prodotto sul tuo sito
                </Label>
                <Input
                  id="external_url"
                  type="url"
                  value={form.external_url || ''}
                  onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  placeholder="https://tuosito.com/prodotti/nome-prodotto"
                  className="bg-white border-secondary/30 focus:border-accent focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground">
                  I clienti verranno reindirizzati a questo link per acquistare. Se non inserito, verrà usato il link generico del tuo sito.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-text">
                  {t('dashboard.products.form.category')} *
                </Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">{t('dashboard.products.form.selectCategory')}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`dashboard.products.categories.${cat}`)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="material" className="text-text">
                  {t('dashboard.products.form.material')}
                </Label>
                <select
                  id="material"
                  value={form.material || ''}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">{t('dashboard.products.form.selectMaterial')}</option>
                  {MATERIALS.map((material) => (
                    <option key={material} value={material}>
                      {t(`dashboard.products.materials.${material}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="made_in" className="text-text">
                  {t('dashboard.products.form.madeIn')}
                </Label>
                <select
                  id="made_in"
                  value={form.made_in || ''}
                  onChange={(e) => setForm({ ...form, made_in: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">{t('dashboard.products.form.selectCountry')}</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {t(`dashboard.products.countries.${country}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-text">
                  Genere *
                </Label>
                <select
                  id="gender"
                  value={form.gender || 'UNISEX'}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="UNISEX">Unisex</option>
                  <option value="MEN">Uomo</option>
                  <option value="WOMEN">Donna</option>
                </select>
              </div>

              <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <Label className="text-text font-semibold">Sconto (Opzionale)</Label>

                <div className="space-y-2">
                  <Label htmlFor="discount_percentage" className="text-sm text-muted-foreground">
                    Percentuale Sconto
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_percentage || ''}
                      onChange={(e) => setForm({ ...form, discount_percentage: e.target.value ? parseInt(e.target.value) : 0 })}
                      className="bg-white border-secondary/30 focus:border-accent focus:ring-accent pr-8"
                      placeholder="Es. 20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Il prezzo attuale diventerà il prezzo scontato e il sistema calcolerà automaticamente il prezzo originale da mostrare barrato
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-secondary/30 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-text mb-4">
              {t('dashboard.products.form.colors')} *
            </h3>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                      form.colors.includes(color)
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-text border-secondary/30 hover:border-accent'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>

              {form.colors.filter((c) => !COLORS.includes(c)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.colors
                    .filter((c) => !COLORS.includes(c))
                    .map((color) => (
                      <div
                        key={color}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg border-2 border-primary flex items-center gap-2"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="hover:bg-primary/80 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder={t('dashboard.products.form.otherColor')}
                  value={otherColor}
                  onChange={(e) => setOtherColor(e.target.value)}
                  className="bg-white border-secondary/30 focus:border-accent focus:ring-accent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOtherColor();
                    }
                  }}
                />
                <Button type="button" onClick={addOtherColor} variant="outline" className="border-secondary/30">
                  {t('dashboard.products.form.add')}
                </Button>
              </div>
              {errors.colors && <p className="text-sm text-red-600">{errors.colors}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-secondary/10 border-secondary/30 shadow-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            {t('dashboard.products.form.variantsStock')}
          </h3>

          <div className="space-y-4">
            <Label className="text-text">
              {t('dashboard.products.form.sizes')} *
            </Label>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SIZES.map((size) => {
                const isSelected = form.sizes.includes(size);
                return (
                  <div key={size} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`w-full px-4 py-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white text-text border-secondary/30 hover:border-accent'
                      }`}
                    >
                      {size}
                    </button>

                    {isSelected && (
                      <div className="space-y-1.5 bg-white p-2 rounded-lg border border-secondary/20">
                        <div className="space-y-1">
                          <Label htmlFor={`stock-${size}`} className="text-xs text-muted-foreground">
                            {t('dashboard.products.form.stockForSize')}
                          </Label>
                          <Input
                            id={`stock-${size}`}
                            type="number"
                            min="0"
                            value={form.stock_by_size[size] || 0}
                            onChange={(e) => updateStock(size, parseInt(e.target.value) || 0)}
                            className="h-9 bg-white border-secondary/30 focus:border-accent focus:ring-accent text-sm"
                            placeholder={t('dashboard.products.form.enterStockForSize')}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`price-${size}`} className="text-xs text-muted-foreground">
                            {t('dashboard.products.form.priceForSize')}
                          </Label>
                          <Input
                            id={`price-${size}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.price_by_size[size] || ''}
                            onChange={(e) => updatePrice(size, parseFloat(e.target.value) || 0)}
                            className="h-9 bg-white border-secondary/30 focus:border-accent focus:ring-accent text-sm"
                            placeholder={t('dashboard.products.form.enterPriceForSize')}
                          />
                          {errors[`price_${size}`] && (
                            <p className="text-xs text-red-600">{errors[`price_${size}`]}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {errors.sizes && <p className="text-sm text-red-600">{errors.sizes}</p>}
          </div>

          <div className="mt-6 pt-6 border-t border-secondary/30">
            <Label className="text-text text-base font-semibold">
              {t('dashboard.products.form.launchSettings')}
            </Label>

            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setLaunchMode('now')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    launchMode === 'now'
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-text border-secondary/30 hover:border-accent'
                  }`}
                >
                  {t('dashboard.products.form.publishNow')}
                </button>
                <button
                  type="button"
                  onClick={() => setLaunchMode('schedule')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    launchMode === 'schedule'
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-text border-secondary/30 hover:border-accent'
                  }`}
                >
                  {t('dashboard.products.form.scheduleLaunch')}
                </button>
              </div>

              {launchMode === 'schedule' && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-secondary/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="schedule-date" className="text-sm text-muted-foreground">
                        {t('dashboard.products.form.launchDate')} *
                      </Label>
                      <Input
                        id="schedule-date"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-white border-secondary/30 focus:border-accent focus:ring-accent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.scheduleDate && (
                        <p className="text-xs text-red-600">{errors.scheduleDate}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="schedule-time" className="text-sm text-muted-foreground">
                        {t('dashboard.products.form.launchTime')} *
                      </Label>
                      <Input
                        id="schedule-time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-white border-secondary/30 focus:border-accent focus:ring-accent"
                      />
                      {errors.scheduleTime && (
                        <p className="text-xs text-red-600">{errors.scheduleTime}</p>
                      )}
                    </div>
                  </div>
                  {errors.schedule && (
                    <p className="text-sm text-red-600">{errors.schedule}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || uploading}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {uploading
            ? t('dashboard.products.form.uploading')
            : loading
            ? t('dashboard.products.form.saving')
            : mode === 'edit'
            ? t('dashboard.products.form.saveChanges')
            : t('dashboard.products.form.createProduct')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/brand/products')}
          size="lg"
          className="border-secondary/30 hover:bg-secondary/10"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
