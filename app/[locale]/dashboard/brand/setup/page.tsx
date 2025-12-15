'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BrandSetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'BRAND') {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Viskory!</CardTitle>
            <CardDescription>
              Let&apos;s set up your brand profile to start selling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Complete your brand profile
              </h3>
              <p className="text-gray-600 mb-4">
                Before you can start adding products and selling on Viskory, you need to
                complete your brand profile. This includes your brand name, logo,
                description, and social links.
              </p>
              <Link href="/dashboard/brand/profile">
                <Button size="lg">Create Brand Profile</Button>
              </Link>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-2">What happens next?</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Complete your brand profile</li>
                <li>✓ Add your first products</li>
                <li>✓ Start selling to Viskory&apos;s community</li>
                <li>✓ Track your performance and grow your brand</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
