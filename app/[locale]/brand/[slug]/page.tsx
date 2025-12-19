'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { publishScheduledProducts } from '@/lib/publishScheduledProducts';
import { Users, MapPin, Instagram, ExternalLink, Search, SlidersHorizontal, Tag, Ruler, Palette, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  cover_image_url?: string;
  short_bio?: string;
  description?: string;
  location?: string;
  instagram_url?: string;
  tiktok_url?: string;
  website_url?: string;
  followers_count: number;
  story_title?: string;
  story_content?: string;
  story_images?: string[];
}

interface Product {
  id: string;
  name: string;
  price: string;
  main_image_url?: string;
  description?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  brand_response?: string;
  brand_response_at?: string;
  created_at: string;
  users: {
    name: string;
    avatar_url?: string;
  };
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

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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

export default function BrandProfilePage({ params }: { params: { slug: string } }) {
  const t = useTranslations();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userReview, setUserReview] = useState<{ id: string; rating: number; review_text: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadBrandData();
  }, [params.slug, user]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedSizes, selectedColors, allProducts]);

  const loadBrandData = async () => {
    // Auto-publish scheduled products
    await publishScheduledProducts();

    const { data: brandData } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'APPROVED')
      .maybeSingle();

    if (brandData) {
      setBrand(brandData);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', brandData.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (productsData) {
        setAllProducts(productsData);
        setFilteredProducts(productsData);
      }

      await loadReviews(brandData.id);

      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('user_id', user.id)
          .eq('brand_id', brandData.id)
          .maybeSingle();

        setIsFollowing(!!followData);

        const { data: existingReview } = await supabase
          .from('brand_reviews')
          .select('id, rating, review_text')
          .eq('brand_id', brandData.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setUserReview(existingReview);
      }
    }

    setLoading(false);
  };

  const loadReviews = async (brandId: string) => {
    const { data: reviewsData } = await supabase
      .from('brand_reviews')
      .select(`
        *,
        users (
          name,
          avatar_url
        )
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsData) {
      setReviews(reviewsData as Review[]);

      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((product) =>
        product.sizes?.some((size) => selectedSizes.includes(size))
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((product) =>
        product.colors?.some((color) => selectedColors.includes(color))
      );
    }

    setFilteredProducts(filtered);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedSizes.length > 0 || selectedColors.length > 0;

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        full_description: 'Please login to follow brands',
        variant: 'destructive',
      });
      return;
    }

    if (!brand) return;

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', user.id)
        .eq('brand_id', brand.id);

      if (!error) {
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          full_description: `You unfollowed ${brand.name}`,
        });
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([{ user_id: user.id, brand_id: brand.id }]);

      if (!error) {
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: `You are now following ${brand.name}`,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Brand not found</p>
        </div>
      </div>
    );
  }

  const hasStory = brand.story_title || brand.story_content || (brand.story_images && brand.story_images.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {brand.cover_image_url && (
        <div className="w-full h-64 relative bg-gray-200">
          <Image
            src={brand.cover_image_url}
            alt={brand.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Brand Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg relative">
              {brand.logo_url ? (
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                  {brand.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-text mb-2">{brand.name}</h1>
                <p className="text-muted-foreground">@{brand.slug}</p>
              </div>
              <Button
                onClick={handleFollow}
                variant={isFollowing ? 'outline' : 'default'}
                className={isFollowing ? '' : 'bg-primary hover:bg-primary/90 text-white'}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            </div>

            {brand.short_bio && (
              <p className="text-lg text-text mb-4">{brand.short_bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{brand.followers_count} followers</span>
              </div>
              {brand.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{brand.location}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {brand.instagram_url && (
                <Link href={brand.instagram_url} target="_blank">
                  <Button variant="outline" size="sm" className="border-secondary/30">
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                </Link>
              )}
              {brand.website_url && (
                <Link href={brand.website_url} target="_blank">
                  <Button variant="outline" size="sm" className="border-secondary/30">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Website
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        {brand.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-text mb-4">About</h2>
            <p className="text-text whitespace-pre-line leading-relaxed">{brand.description}</p>
          </div>
        )}

        {/* Story Section */}
        {hasStory && (
          <Card className="mb-12 bg-secondary/10 border-secondary/30">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-text mb-4">
                {t('brands.profile.story.title')}
              </h2>

              {brand.story_title && (
                <h3 className="text-xl font-semibold text-text mb-3">{brand.story_title}</h3>
              )}

              {brand.story_content && (
                <p className="text-text whitespace-pre-line leading-relaxed mb-6">
                  {brand.story_content}
                </p>
              )}

              {brand.story_images && brand.story_images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {brand.story_images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-secondary/30"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${brand.name} story ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text">Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-text">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {user && (
              <ReviewForm
                brandId={brand.id}
                existingReview={userReview}
                onReviewSubmitted={() => {
                  loadBrandData();
                }}
              />
            )}

            {reviews.length > 0 ? (
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex-shrink-0 w-[350px] md:w-[400px] snap-start">
                      <ReviewCard
                        id={review.id}
                        userName={review.users.name}
                        userAvatar={review.users.avatar_url}
                        rating={review.rating}
                        reviewText={review.review_text}
                        brandResponse={review.brand_response}
                        brandResponseAt={review.brand_response_at}
                        createdAt={review.created_at}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !user && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No reviews yet. Be the first to review this brand!
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>

        {/* Products Section with Filters */}
        <div>
          <h2 className="text-2xl font-bold text-text mb-6">{t('brands.products')}</h2>

          {/* Compact Filters Bar */}
          <div className="mb-6 flex gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('brands.profile.filters.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-secondary/30"
              />
            </div>

            {/* Category Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-secondary/30 relative">
                  <Tag className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t('brands.profile.filters.category')}</span>
                  {selectedCategory && (
                    <Badge className="absolute -top-1 -right-1 bg-primary text-white h-4 w-4 p-0 flex items-center justify-center rounded-full text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>{t('brands.profile.filters.category')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full px-4 py-2 rounded-lg text-left text-sm transition-colors ${
                      !selectedCategory
                        ? 'bg-primary text-white'
                        : 'bg-secondary/10 text-text hover:bg-secondary/20'
                    }`}
                  >
                    {t('brands.profile.filters.allCategories')}
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full px-4 py-2 rounded-lg text-left text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary text-white'
                          : 'bg-secondary/10 text-text hover:bg-secondary/20'
                      }`}
                    >
                      {t(`dashboard.products.categories.${category}`)}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Size Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-secondary/30 relative">
                  <Ruler className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t('brands.profile.filters.size')}</span>
                  {selectedSizes.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-accent text-white h-4 w-4 p-0 flex items-center justify-center rounded-full text-xs">
                      {selectedSizes.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>{t('brands.profile.filters.size')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedSizes.includes(size)
                          ? 'bg-accent text-white'
                          : 'bg-secondary/10 text-text hover:bg-secondary/20 border border-secondary/30'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSizes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSizes([])}
                    className="mt-4 w-full"
                  >
                    {t('brands.profile.filters.clearFilters')}
                  </Button>
                )}
              </SheetContent>
            </Sheet>

            {/* Color Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-secondary/30 relative">
                  <Palette className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{t('brands.profile.filters.color')}</span>
                  {selectedColors.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-accent text-white h-4 w-4 p-0 flex items-center justify-center rounded-full text-xs">
                      {selectedColors.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>{t('brands.profile.filters.color')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedColors.includes(color)
                          ? 'bg-accent text-white'
                          : 'bg-secondary/10 text-text hover:bg-secondary/20 border border-secondary/30'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
                {selectedColors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedColors([])}
                    className="mt-4 w-full"
                  >
                    {t('brands.profile.filters.clearFilters')}
                  </Button>
                )}
              </SheetContent>
            </Sheet>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-text"
              >
                ✕
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                  {t(`dashboard.products.categories.${selectedCategory}`)}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-2 hover:text-primary/70"
                  >
                    ✕
                  </button>
                </Badge>
              )}
              {selectedSizes.map((size) => (
                <Badge key={size} variant="secondary" className="bg-accent/10 text-accent border-accent/30">
                  {size}
                  <button
                    onClick={() => toggleSize(size)}
                    className="ml-2 hover:text-accent/70"
                  >
                    ✕
                  </button>
                </Badge>
              ))}
              {selectedColors.map((color) => (
                <Badge key={color} variant="secondary" className="bg-accent/10 text-accent border-accent/30">
                  {color}
                  <button
                    onClick={() => toggleColor(color)}
                    className="ml-2 hover:text-accent/70"
                  >
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Products Grid - Mobile: 2 columns, Desktop: 4 columns */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={parseFloat(product.price)}
                  mainImageUrl={product.main_image_url}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              {hasActiveFilters ? 'No products match your filters' : 'No products available yet'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
