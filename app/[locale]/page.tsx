'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandCard } from '@/components/BrandCard';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroCarousel, HeroSlide } from '@/components/HeroCarousel';
import { supabase } from '@/lib/supabase/client';
import { getTrendingBrands } from '@/lib/trending';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Search, TrendingUp, Clock, Percent, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [trendingBrands, setTrendingBrands] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<any[]>([]);
  const [recentSearchProducts, setRecentSearchProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHomePageData();
  }, [user]);

  const loadHomePageData = async () => {
    const { data: slidesData } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10);

    if (slidesData) {
      const formattedSlides: HeroSlide[] = slidesData.map(slide => ({
        id: slide.id,
        imageUrl: slide.image_url,
        title: slide.title,
        subtitle: slide.subtitle,
        position: slide.position,
      }));
      setHeroSlides(formattedSlides);
    }

    const trending = await getTrendingBrands(6);
    setTrendingBrands(trending);

    const { data: bestSellersData } = await supabase
      .from('products')
      .select('*, brands!inner(brand_name)')
      .eq('is_published', true)
      .order('like_count', { ascending: false })
      .limit(12);

    setBestSellers(bestSellersData || []);

    const { data: newArrivalsData } = await supabase
      .from('products')
      .select('*, brands!inner(brand_name)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12);

    setNewArrivals(newArrivalsData || []);

    const { data: discountedData } = await supabase
      .from('products')
      .select('*, brands!inner(brand_name)')
      .eq('is_published', true)
      .gt('discount_percentage', 0)
      .order('discount_percentage', { ascending: false })
      .limit(12);

    setDiscountedProducts(discountedData || []);

    if (user) {
      const { data: searches } = await supabase
        .from('user_searches')
        .select('search_term')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (searches && searches.length > 0) {
        const searchTerms = searches.map(s => s.search_term.toLowerCase());

        const { data: searchBasedProducts } = await supabase
          .from('products')
          .select('*, brands!inner(brand_name)')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(50);

        const filtered = (searchBasedProducts || []).filter(product => {
          const productName = product.name.toLowerCase();
          const brandName = product.brands?.brand_name?.toLowerCase() || '';
          const category = product.category?.toLowerCase() || '';

          return searchTerms.some(term =>
            productName.includes(term) ||
            brandName.includes(term) ||
            category.includes(term)
          );
        }).slice(0, 12);

        setRecentSearchProducts(filtered);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (user) {
        await supabase.from('user_searches').insert({
          user_id: user.id,
          search_term: searchTerm.trim(),
        });
      }
      router.push(`/${locale}/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Carousel Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white pt-4">
        <HeroCarousel slides={heroSlides} />
      </section>

      {/* Search Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white pb-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cerca prodotti, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-black"
              />
            </div>
          </form>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link href={`/${locale}/products?category=tshirts`}>
              <Button variant="outline" className="rounded-full">T-Shirts</Button>
            </Link>
            <Link href={`/${locale}/products?category=hoodies`}>
              <Button variant="outline" className="rounded-full">Hoodies</Button>
            </Link>
            <Link href={`/${locale}/products?category=jeans`}>
              <Button variant="outline" className="rounded-full">Jeans</Button>
            </Link>
            <Link href={`/${locale}/products?discount=true`}>
              <Button variant="outline" className="rounded-full text-red-600 border-red-600">Sconti</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nuovi Arrivi */}
      {newArrivals.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Nuovi Arrivi</h2>
              </div>
              <Link href={`/${locale}/products?newIn=7days`}>
                <Button variant="ghost">Vedi tutti</Button>
              </Link>
            </div>
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'min-content' }}>
                {newArrivals.map((product) => (
                  <div key={product.id} className="w-[180px] md:w-[220px] flex-shrink-0">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      mainImageUrl={product.main_image_url}
                      brandName={product.brands?.brand_name}
                      discountPercentage={product.discount_percentage}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Più Venduti */}
      {bestSellers.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Più Venduti</h2>
              </div>
              <Link href={`/${locale}/products?sort=popular`}>
                <Button variant="ghost">Vedi tutti</Button>
              </Link>
            </div>
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'min-content' }}>
                {bestSellers.map((product) => (
                  <div key={product.id} className="w-[180px] md:w-[220px] flex-shrink-0">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      mainImageUrl={product.main_image_url}
                      brandName={product.brands?.brand_name}
                      discountPercentage={product.discount_percentage}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Brand in Tendenza */}
      {trendingBrands.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl md:text-3xl font-bold">{t('home.featured.title')}</h2>
              </div>
              <Link href={`/${locale}/brands`}>
                <Button variant="ghost">{t('home.featured.viewAll')}</Button>
              </Link>
            </div>
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'min-content' }}>
                {trendingBrands.map((brand) => (
                  <div key={brand.id} className="w-[280px] flex-shrink-0">
                    <BrandCard
                      id={brand.id}
                      name={brand.brand_name}
                      logoUrl={brand.logo_url}
                      slug={brand.slug}
                      shortBio={brand.short_bio}
                      followersCount={brand.followers_count || 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Prodotti Consigliati / Basato sulle ricerche */}
      {(recentSearchProducts.length > 0 || newArrivals.length > 0) && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl md:text-3xl font-bold">
                  {user && recentSearchProducts.length > 0 ? 'Basato sulle tue ricerche' : 'Consigliati per te'}
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'min-content' }}>
                {(recentSearchProducts.length > 0 ? recentSearchProducts : newArrivals.slice(0, 12)).map((product) => (
                  <div key={product.id} className="w-[180px] md:w-[220px] flex-shrink-0">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      mainImageUrl={product.main_image_url}
                      brandName={product.brands?.brand_name}
                      discountPercentage={product.discount_percentage}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Prodotti in Sconto */}
      {discountedProducts.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Percent className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Offerte Speciali</h2>
              </div>
              <Link href={`/${locale}/products?discount=true`}>
                <Button variant="ghost">Vedi tutti</Button>
              </Link>
            </div>
            <div className="overflow-x-auto custom-scrollbar -mx-4 px-4">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'min-content' }}>
                {discountedProducts.map((product) => (
                  <div key={product.id} className="w-[180px] md:w-[220px] flex-shrink-0">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      mainImageUrl={product.main_image_url}
                      brandName={product.brands?.brand_name}
                      discountPercentage={product.discount_percentage}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Finale */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Scopri tutti i prodotti</h2>
          <p className="text-xl text-gray-300 mb-8">
            Esplora l'intera collezione dei migliori brand indipendenti italiani
          </p>
          <Link href={`/${locale}/products`}>
            <Button size="lg" variant="secondary" className="rounded-full px-8">
              Vedi tutti i prodotti
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
