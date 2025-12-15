'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthCallback } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { user, error } = await handleOAuthCallback();

      if (error) {
        setError(error);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
        return;
      }

      if (user) {
        setUser(user);

        // Redirect based on user role
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else if (user.role === 'BRAND') {
          router.push('/dashboard/brand');
        } else {
          router.push('/');
        }
      }
    };

    handleCallback();
  }, [router, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Authentication Error</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
