'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  main_image_url?: string;
  discount_percentage?: number;
  brands: {
    brand_name: string;
  };
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    const { data: likes } = await supabase
      .from('product_likes')
      .select(`
        product_id,
        products (
          id,
          name,
          price,
          main_image_url,
          discount_percentage,
          brands (
            name
          )
        )
      `)
      .eq('user_id', user.id);

    if (likes) {
      const favoriteProducts = likes
        .map(like => like.products)
        .filter(Boolean) as any[];
      setProducts(favoriteProducts);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <Heart className="w-8 h-8 text-red-600 fill-red-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              I Miei Preferiti
            </h1>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-4">
                Non hai ancora prodotti preferiti
              </p>
              <p className="text-muted-foreground">
                Inizia ad esplorare i nostri prodotti e aggiungi i tuoi preferiti!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={parseFloat(product.price)}
                  mainImageUrl={product.main_image_url}
                  brandName={product.brands?.brand_name}
                  discountPercentage={product.discount_percentage}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
