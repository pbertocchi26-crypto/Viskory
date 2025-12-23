'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface BrandRequest {
  id: string;
  user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  data: any;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export default function BrandRequestDetailPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<BrandRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadRequest();
  }, [user, router, params.id]);

  const loadRequest = async () => {
    const { data } = await supabase
      .from('brand_requests')
      .select('*, profiles(name, email)')
      .eq('id', params.id)
      .single();

    if (data) {
      setRequest(data as any);
    }

    setLoading(false);
  };

  const handleApprove = async () => {
    if (!request) return;

    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/brand-requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve request');
      }

      toast({
        title: 'Success',
        description: 'Brand request approved successfully!',
      });

      router.push('/admin/brand-requests');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }

    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!request || !rejectNote.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/admin/brand-requests/${request.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: rejectNote }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject request');
      }

      toast({
        title: 'Success',
        description: 'Brand request rejected successfully',
      });

      router.push('/admin/brand-requests');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }

    setActionLoading(false);
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

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Request not found</p>
        </div>
      </div>
    );
  }

  const data = request.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/admin/brand-requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{data.brandName}</h1>
            <p className="text-gray-600 mt-2">
              Submitted by {request.profiles.name} ({request.profiles.email})
            </p>
          </div>
          <div>
            {request.status === 'PENDING' && (
              <Badge variant="default" className="bg-yellow-500">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {request.status === 'APPROVED' && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            {request.status === 'REJECTED' && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Rejected
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Country</p>
                <p className="text-base">{data.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">City</p>
                <p className="text-base">{data.city}</p>
              </div>
              {data.address && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-base">{data.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">VAT Number</p>
                <p className="text-base">{data.vatNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-base">{data.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Business Sector</p>
                <p className="text-base">{data.businessSector}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Founded Year</p>
                <p className="text-base">{data.foundedYear}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Short Bio</p>
                <p className="text-base">{data.shortBio}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Full Description</p>
                <p className="text-base">{data.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Target Audience</p>
                <p className="text-base">
                  {JSON.parse(data.targetAudience || '[]').join(', ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Price Range</p>
                <p className="text-base">{data.priceRange}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Production Origin</p>
                <p className="text-base">{data.productionOrigin}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Brand Values</p>
                <p className="text-base">
                  {JSON.parse(data.brandValues || '[]').join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Online Presence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Website</p>
              <a
                href={data.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {data.websiteUrl}
              </a>
            </div>
            {data.instagramUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500">Instagram</p>
                <p className="text-base">{data.instagramUrl}</p>
              </div>
            )}
            {data.tiktokUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500">TikTok</p>
                <p className="text-base">{data.tiktokUrl}</p>
              </div>
            )}
            {data.facebookUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500">Facebook</p>
                <p className="text-base">{data.facebookUrl}</p>
              </div>
            )}
            {data.pinterestUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500">Pinterest</p>
                <p className="text-base">{data.pinterestUrl}</p>
              </div>
            )}
            {data.linkedinUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                <p className="text-base">{data.linkedinUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {request.status === 'REJECTED' && request.admin_note && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Rejection Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">{request.admin_note}</p>
            </CardContent>
          </Card>
        )}

        {request.status === 'PENDING' && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showRejectForm ? (
                <div className="flex gap-4">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve Request'}
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejectNote">Rejection Reason *</Label>
                    <Textarea
                      id="rejectNote"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Please provide a clear reason for rejection..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading || !rejectNote.trim()}
                      variant="destructive"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectNote('');
                      }}
                      disabled={actionLoading}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
