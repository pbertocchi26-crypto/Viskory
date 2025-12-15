'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Package, MapPin, ExternalLink, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LikeButton } from '@/components/LikeButton';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  main_image_url?: string;
  additional_image_urls?: string[];
  category?: string;
  material?: string;
  made_in?: string;
  sizes?: string[];
  colors?: string[];
  stock_by_size?: Record<string, number>;
  price_by_size?: Record<string, number>;
  brand_id: string;
  external_url?: string;
  discount_percentage?: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  website_url?: string;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('viskory_session');
      if (!sid) {
        sid = Math.random().toString(36).substring(2);
        sessionStorage.setItem('viskory_session', sid);
      }
      return sid;
    }
    return '';
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProductData();
  }, [params.id]);

  const loadProductData = async () => {
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('is_published', true)
      .maybeSingle();

    if (productData) {
      setProduct(productData);

      const { data: brandData } = await supabase
        .from('brands')
        .select('id, name, slug, website_url')
        .eq('id', productData.brand_id)
        .maybeSingle();

      if (brandData) {
        setBrand(brandData);
      }

      await supabase.from('product_views').insert({
        product_id: productData.id,
        brand_id: productData.brand_id,
        user_id: user?.id || null,
        session_id: sessionId,
        viewed_at: new Date().toISOString(),
      });
    }

    setLoading(false);
  };

  const handleBuyOnBrandSite = async () => {
    if (!product || !brand) return;

    const purchaseUrl = product.external_url || brand.website_url;

    if (!purchaseUrl) {
      toast({
        title: 'Link non disponibile',
        description: 'Il link al sito del brand non è ancora configurato',
        variant: 'destructive',
      });
      return;
    }

    await supabase.from('product_clicks').insert({
      product_id: product.id,
      brand_id: brand.id,
      user_id: user?.id || null,
      clicked_at: new Date().toISOString(),
      referrer: window.location.href,
      user_agent: navigator.userAgent,
      session_id: sessionId,
    });

    window.open(purchaseUrl, '_blank', 'noopener,noreferrer');

    toast({
      title: 'Reindirizzamento in corso',
      description: `Ti stiamo portando sul sito di ${brand.name}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Product not found</p>
        </div>
      </div>
    );
  }

  const basePrice = parseFloat(product.price);
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = hasDiscount && product.discount_percentage ? basePrice / (1 - product.discount_percentage / 100) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="relative">
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-4 sticky top-24">
              {product.main_image_url ? (
                <Image
                  src={product.main_image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}

              <div className="absolute top-4 right-4 z-10">
                <LikeButton productId={product.id} size="lg" />
              </div>

              {hasDiscount && (
                <Badge className="absolute top-4 left-4 bg-red-600 text-white hover:bg-red-700 font-bold">
                  -{product.discount_percentage}%
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              {brand && (
                <Link
                  href={`/brand/${brand.slug}`}
                  className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-2 mb-3"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {brand.name}
                </Link>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.name}</h1>

              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-3xl md:text-4xl font-bold text-foreground">
                  da €{basePrice.toFixed(2)}
                </p>
                {hasDiscount && originalPrice && (
                  <p className="text-xl text-muted-foreground line-through">
                    €{originalPrice.toFixed(2)}
                  </p>
                )}
              </div>

              {hasDiscount && (
                <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                  Risparmia fino a €{((originalPrice || 0) - basePrice).toFixed(2)}
                </Badge>
              )}
            </div>

            {product.description && (
              <div className="mb-6 pb-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground mb-3">Descrizione</h2>
                <p className="text-foreground/80 whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {(product.material || product.made_in || product.sizes || product.colors) && (
              <div className="mb-6 pb-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground mb-3">Dettagli prodotto</h2>
                <div className="space-y-3">
                  {product.material && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Materiale</p>
                        <p className="text-sm text-muted-foreground">
                          {t(`dashboard.products.materials.${product.material}`)}
                        </p>
                      </div>
                    </div>
                  )}
                  {product.made_in && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Prodotto in</p>
                        <p className="text-sm text-muted-foreground">
                          {t(`dashboard.products.countries.${product.made_in}`)}
                        </p>
                      </div>
                    </div>
                  )}
                  {product.sizes && product.sizes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Taglie disponibili</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <Badge key={size} variant="outline" className="border-primary/30">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.colors && product.colors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Colori disponibili</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <Badge key={color} variant="outline" className="border-primary/30">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 space-y-3">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base h-14"
                onClick={handleBuyOnBrandSite}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Acquista su {brand?.name || 'sito del brand'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Verrai reindirizzato al sito ufficiale di {brand?.name || 'questo brand'} per completare l'acquisto
              </p>

              {brand?.website_url && (
                <Link
                  href={brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Visita il sito di {brand.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
