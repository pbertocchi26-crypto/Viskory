import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ProductFilters } from '@/components/ProductFilters';
import { createServerClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

interface ProductsPageProps {
  searchParams: {
    discount?: string;
    gender?: string;
    category?: string;
    sort?: string;
    brand?: string;
    size?: string;
    color?: string;
    price?: string;
    newIn?: string;
    material?: string;
  };
}

async function getProducts(filters: any) {
  const supabase = createServerClient();
  let query = supabase
    .from('products')
    .select('*, brands!inner(id, name)')
    .eq('is_published', true);

  if (filters.discount) {
    query = query.gt('discount_percentage', 0);
  }

  if (filters.gender) {
    query = query.eq('gender', filters.gender);
  }

  if (filters.category && filters.category !== '') {
    const categories = filters.category.split(',');
    query = query.in('category', categories);
  }

  if (filters.brand) {
    query = query.eq('brand_id', filters.brand);
  }

  if (filters.size) {
    query = query.contains('sizes', [filters.size]);
  }

  if (filters.color) {
    query = query.contains('colors', [filters.color]);
  }

  if (filters.material) {
    query = query.eq('material', filters.material);
  }

  if (filters.price) {
    const [min, max] = filters.price.split('-');
    if (max === '+') {
      query = query.gte('price', parseInt(min));
    } else {
      query = query.gte('price', parseInt(min)).lte('price', parseInt(max));
    }
  }

  if (filters.newIn) {
    const days = filters.newIn === '7days' ? 7 : 30;
    const date = new Date();
    date.setDate(date.getDate() - days);
    query = query.gte('created_at', date.toISOString());
  }

  switch (filters.sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('like_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: products } = await query;

  return products || [];
}

async function getBrands() {
  const supabase = createServerClient();
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .order('name');

  return brands || [];
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const filters = {
    discount: searchParams.discount === 'true',
    gender: searchParams.gender,
    category: searchParams.category,
    sort: searchParams.sort,
    brand: searchParams.brand,
    size: searchParams.size,
    color: searchParams.color,
    price: searchParams.price,
    newIn: searchParams.newIn,
    material: searchParams.material,
  };

  const [products, brands] = await Promise.all([
    getProducts(filters),
    getBrands(),
  ]);

  const t = await getTranslations('home');

  const getTitle = () => {
    if (filters.discount) return 'Prodotti in Sconto';
    if (filters.gender === 'MEN') return 'Prodotti Uomo';
    if (filters.gender === 'WOMEN') return 'Prodotti Donna';
    if (searchParams.category === 'offers') return 'OFFERTE';
    return 'Abbigliamento';
  };

  const getDescription = () => {
    if (filters.discount) return 'Scopri tutte le migliori offerte dai brand indipendenti';
    if (filters.gender === 'MEN') return 'Esplora la collezione uomo dei nostri brand';
    if (filters.gender === 'WOMEN') return 'Esplora la collezione donna dei nostri brand';
    return 'Scopri tutti i prodotti dai migliori brand indipendenti';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="md:py-8 md:px-4">
        <div className="container mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden sticky top-[64px] z-40 bg-white border-b border-gray-200 px-4 py-4">
            <h1 className="text-xl font-bold mb-2">{getTitle()}</h1>
            <p className="text-sm text-gray-600 mb-3">{getDescription()}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-900 font-medium">{products.length} articoli</span>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
              <FilterSidebar />
            </div>

            <div className="flex-1">
              {/* Desktop Filters */}
              <div className="hidden md:block">
                <ProductFilters totalProducts={products.length} brands={brands} />
              </div>

              {/* Mobile Filters - Compact version */}
              <div className="md:hidden px-4 py-4">
                <ProductFilters totalProducts={products.length} brands={brands} />
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <p className="text-lg text-gray-500">Nessun prodotto disponibile con questi filtri.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-6 px-4 md:px-0 pb-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={parseFloat(product.price)}
                      mainImageUrl={product.main_image_url}
                      brandName={product.brands?.name}
                      discountPercentage={product.discount_percentage}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
