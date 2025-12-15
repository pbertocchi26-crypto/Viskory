'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BrandCard } from '@/components/BrandCard';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { Search } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  short_bio?: string;
  followers_count: number;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchQuery, brands]);

  const loadBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (data) {
      setBrands(data);
      setFilteredBrands(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">All Brands</h1>
          <p className="text-gray-600 mb-6">
            Discover emerging clothing brands on Vesty
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading brands...</p>
          </div>
        ) : filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                id={brand.id}
                name={brand.name}
                slug={brand.slug}
                logoUrl={brand.logo_url}
                shortBio={brand.short_bio}
                followersCount={brand.followers_count}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No brands found</p>
          </div>
        )}
      </div>
    </div>
  );
}
