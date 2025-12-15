'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Edit,
  Package,
  Star,
  User,
  BarChart3,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations('dashboard.brand.menu');
  const { user } = useAuth();
  const [brandSlug, setBrandSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (data) {
      setBrandSlug(data.slug);
    }
  };

  const menuItems = [
    {
      href: '/',
      label: t('home'),
      icon: Home,
      exact: true
    },
    {
      href: '/dashboard/brand',
      label: t('dashboard'),
      icon: LayoutDashboard,
      exact: true
    },
    {
      href: '/dashboard/brand/profile',
      label: t('editProfile'),
      icon: Edit
    },
    {
      href: '/dashboard/brand/products',
      label: t('manageProducts'),
      icon: Package
    },
    {
      href: '/dashboard/brand/reviews',
      label: t('reviews'),
      icon: Star
    },
    {
      href: brandSlug ? `/brand/${brandSlug}` : '#',
      label: t('viewProfile'),
      icon: User,
      disabled: !brandSlug
    },
    {
      href: '/dashboard/brand/analytics',
      label: t('analytics'),
      icon: BarChart3
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-16 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out z-40",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="lg:ml-64 pt-16">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
