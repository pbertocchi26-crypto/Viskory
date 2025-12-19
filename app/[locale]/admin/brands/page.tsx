'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  followers_count: number;
  status: string;
  is_featured: boolean;
  created_at: string;
  users: {
    email: string;
  };
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadBrands();
  }, [user, router]);

  const loadBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('*, users!brands_owner_user_id_fkey(email)')
      .order('created_at', { ascending: false });

    if (data) {
      setBrands(data);
    }

    setLoading(false);
  };

  const handleStatusChange = async (brandId: string, newStatus: string) => {
    const { error } = await supabase
      .from('brands')
      .update({ status: newStatus })
      .eq('id', brandId);

    if (error) {
      toast({
        title: 'Error',
        full_description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Brand status updated',
      });
      setBrands(brands.map((b) => (b.id === brandId ? { ...b, status: newStatus } : b)));
    }
  };

  const toggleFeatured = async (brandId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('brands')
      .update({ is_featured: !currentStatus })
      .eq('id', brandId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Brand ${!currentStatus ? 'featured' : 'unfeatured'}`,
      });
      setBrands(
        brands.map((b) =>
          b.id === brandId ? { ...b, is_featured: !currentStatus } : b
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Manage Brands</h1>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Brand Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Owner Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Followers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {brands.map((brand) => (
                    <tr key={brand.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/brand/${brand.slug}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {brand.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{brand.users?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{brand.followers_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            brand.status === 'APPROVED'
                              ? 'default'
                              : brand.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {brand.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {brand.is_featured && <Badge>Featured</Badge>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        {brand.status !== 'APPROVED' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(brand.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                        )}
                        {brand.status !== 'DISABLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(brand.id, 'DISABLED')}
                          >
                            Disable
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFeatured(brand.id, brand.is_featured)}
                        >
                          {brand.is_featured ? 'Unfeature' : 'Feature'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
