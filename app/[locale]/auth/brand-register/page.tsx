import { BrandRegistrationForm } from '@/components/auth/BrandRegistrationForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BrandRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/auth/signup"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign up options
        </Link>
        <BrandRegistrationForm />
      </div>
    </div>
  );
}
