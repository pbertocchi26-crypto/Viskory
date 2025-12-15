'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { ProfileMyData } from '@/components/profile/ProfileMyData';
import { ProfileOrders } from '@/components/profile/ProfileOrders';
import { ProfileFavoriteProducts } from '@/components/profile/ProfileFavoriteProducts';
import { ProfileBugReport } from '@/components/profile/ProfileBugReport';
import { ProfileGiftCards } from '@/components/profile/ProfileGiftCards';
import { ProfileFavoriteBrands } from '@/components/profile/ProfileFavoriteBrands';
import {
  ShoppingBag,
  Heart,
  Bug,
  Gift,
  Store,
  User,
  ChevronRight,
  Undo2
} from 'lucide-react';

type ProfileSection = 'account' | 'orders' | 'favorites' | 'bugReport' | 'giftCards' | 'favoriteBrands' | null;

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<ProfileSection>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [mounted, loading, user, router, locale]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'account' as ProfileSection, icon: User, label: t('tabs.account') },
    { id: 'orders' as ProfileSection, icon: ShoppingBag, label: t('tabs.orders') },
    { id: 'favorites' as ProfileSection, icon: Heart, label: t('tabs.favorites') },
    { id: 'favoriteBrands' as ProfileSection, icon: Store, label: t('tabs.favoriteBrands') },
    { id: 'giftCards' as ProfileSection, icon: Gift, label: t('tabs.giftCards') },
    { id: 'bugReport' as ProfileSection, icon: Bug, label: t('tabs.bugReport') },
  ];

  const handleMenuClick = (sectionId: ProfileSection) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <ProfileMyData user={user} />;
      case 'orders':
        return <ProfileOrders user={user} />;
      case 'favorites':
        return <ProfileFavoriteProducts user={user} />;
      case 'bugReport':
        return <ProfileBugReport user={user} />;
      case 'giftCards':
        return <ProfileGiftCards />;
      case 'favoriteBrands':
        return <ProfileFavoriteBrands user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-6">{t('title')}</h1>

          {/* Menu List */}
          {!activeSection && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border overflow-hidden">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`
                      w-full flex items-center justify-between px-6 py-5
                      hover:bg-gray-50 dark:hover:bg-gray-800
                      transition-colors duration-150
                      ${index !== 0 ? 'border-t border-border' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
                      <span className="text-lg font-medium text-foreground">{item.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Section */}
          {activeSection && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Undo2 className="h-5 w-5" />
                <span className="font-medium">{t('common.back')}</span>
              </button>

              {/* Section Content */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border p-6">
                {renderSection()}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
