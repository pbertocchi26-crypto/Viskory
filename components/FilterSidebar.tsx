'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const categories = [
  { id: 'all', label: 'Abbigliamento', value: '' },
  { id: 'sweaters', label: 'Maglieria e Felpe', value: 'sweaters,sweatshirts,hoodies' },
  { id: 'tshirts', label: 'T-shirt e polo', value: 'tshirts' },
  { id: 'shirts', label: 'Camicie', value: 'shirts' },
  { id: 'knitwear', label: 'Maglieria', value: 'sweaters' },
  { id: 'pants', label: 'Pantaloni', value: 'pants' },
  { id: 'jeans', label: 'Jeans', value: 'jeans' },
  { id: 'jackets', label: 'Giacche', value: 'jackets' },
  { id: 'coats', label: 'Cappotti', value: 'coats' },
  { id: 'activewear', label: 'Abbigliamento sportivo', value: 'activewear' },
  { id: 'shorts', label: 'Pantaloni sportivi e joggers', value: 'shorts' },
  { id: 'dresses', label: 'Completi e cravatte', value: 'dresses' },
  { id: 'shorts_beach', label: 'Bermuda', value: 'shorts' },
  { id: 'underwear', label: 'Intimo', value: 'other' },
  { id: 'swimwear', label: 'Moda mare', value: 'other' },
  { id: 'sleepwear', label: 'Per la notte', value: 'other' },
  { id: 'offers', label: 'OFFERTE', value: 'offers' },
];

export function FilterSidebar() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  return (
    <div className="w-64 flex-shrink-0 pr-8">
      <nav className="space-y-1">
        {categories.map((category) => {
          const isActive = currentCategory === category.value;
          const params = new URLSearchParams(searchParams.toString());

          if (category.value) {
            params.set('category', category.value);
          } else {
            params.delete('category');
          }

          return (
            <Link
              key={category.id}
              href={`?${params.toString()}`}
              className={`block py-2 text-sm transition-colors ${
                isActive
                  ? 'font-bold text-foreground'
                  : category.id === 'offers'
                  ? 'font-bold text-foreground hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {category.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
