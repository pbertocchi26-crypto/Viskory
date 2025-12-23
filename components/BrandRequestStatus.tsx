'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';

interface BrandRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export function BrandRequestStatus() {
  const [request, setRequest] = useState<BrandRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!user || user.role === 'BRAND') {
      setLoading(false);
      return;
    }

    loadRequest();

    const channel = supabase
      .channel('brand_request_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brand_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setRequest(payload.new as BrandRequest);
          } else if (payload.eventType === 'DELETE') {
            setRequest(null);
          }
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as any;
          if (newProfile.role === 'BRAND') {
            setUser({ ...user, role: 'BRAND' });
            router.push(`/${locale}/dashboard/brand`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(profileChannel);
    };
  }, [user, router, locale, setUser]);

  const loadRequest = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('brand_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'REJECTED'])
      .maybeSingle();

    setRequest(data);
    setLoading(false);
  };

  if (loading || !user || user.role === 'BRAND') {
    return null;
  }

  if (!request) {
    return null;
  }

  if (request.status === 'PENDING') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Clock className="h-5 w-5" />
            Brand Request Under Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            Your request to become a brand is currently being reviewed by our team.
            You will be notified once the review is complete.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Submitted: {new Date(request.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (request.status === 'REJECTED') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <XCircle className="h-5 w-5" />
            Brand Request Rejected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-red-800 mb-2">
              Your brand registration request has been rejected.
            </p>
            {request.admin_note && (
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-sm font-semibold text-red-900 mb-1">Reason:</p>
                <p className="text-sm text-red-700">{request.admin_note}</p>
              </div>
            )}
          </div>
          <Button
            onClick={() => router.push(`/${locale}/auth/brand-register`)}
            variant="default"
          >
            Submit New Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
