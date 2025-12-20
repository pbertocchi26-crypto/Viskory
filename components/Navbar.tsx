'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { User, LogOut, LayoutDashboard, UserCircle, Edit, Heart, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nav');
  const [brandSlug, setBrandSlug] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'BRAND') {
      loadBrandSlug();
    }
  }, [user]);

  const loadBrandSlug = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('brands')
      .select('slug')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (data) {
      setBrandSlug(data.slug);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push(`/${locale}`);
  };

  const getDashboardLink = () => {
    if (user?.role === 'ADMIN') return `/${locale}/admin`;
    if (user?.role === 'BRAND') return `/${locale}/dashboard/brand`;
    return `/${locale}/profile`;
  };

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold">VISKORY</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8">
                  <Link
                    href={`/${locale}`}
                    className="text-lg hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('home')}
                  </Link>
                  <Link
                    href={`/${locale}/brands`}
                    className="text-lg hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('brands')}
                  </Link>
                  <Link
                    href={`/${locale}/products?discount=true`}
                    className="text-lg text-red-600 hover:text-red-700 font-semibold transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sconti
                  </Link>
                  <Link
                    href={`/${locale}/products?gender=MEN`}
                    className="text-lg hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Uomo
                  </Link>
                  <Link
                    href={`/${locale}/products?gender=WOMEN`}
                    className="text-lg hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Donna
                  </Link>
                  <Link
                    href={`/${locale}/rankings`}
                    className="text-lg hover:text-foreground transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('rankings')}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            <Link href={`/${locale}`} className="text-2xl font-bold text-foreground">
              VISKORY
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href={`/${locale}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('home')}
              </Link>
              <Link
                href={`/${locale}/brands`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('brands')}
              </Link>
              <Link
                href={`/${locale}/products?discount=true`}
                className="text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                Sconti
              </Link>
              <Link
                href={`/${locale}/products?gender=MEN`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Uomo
              </Link>
              <Link
                href={`/${locale}/products?gender=WOMEN`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Donna
              </Link>
              <Link
                href={`/${locale}/rankings`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('rankings')}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/${locale}/favorites`)}
                title="I tuoi preferiti"
              >
                <Heart className="h-5 w-5" />
              </Button>
            )}
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Role: {user.role}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'BRAND' && brandSlug && (
                      <>
                        <DropdownMenuItem onClick={() => router.push(`/${locale}/brand/${brandSlug}`)}>
                          <UserCircle className="mr-2 h-4 w-4" />
                          {t('profile')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/brand/profile`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('editProfile')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>
                      {user.role === 'USER' ? (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          {t('profile')}
                        </>
                      ) : (
                        <>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t('dashboard')}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/${locale}/auth/login`)}
                >
                  {t('login')}
                </Button>
                <Button onClick={() => router.push(`/${locale}/auth/signup`)}>
                  {t('signup')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
