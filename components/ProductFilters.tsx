'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface ProductFiltersProps {
  totalProducts: number;
  brands?: Array<{ id: string; name: string }>;
}

export function ProductFilters({ totalProducts, brands = [] }: ProductFiltersProps) {
  const t = useTranslations('products');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/products');
    setIsOpen(false);
  };

  const sortOptions = [
    { value: 'newest', label: 'Più recenti' },
    { value: 'price-asc', label: 'Prezzo: crescente' },
    { value: 'price-desc', label: 'Prezzo: decrescente' },
    { value: 'popular', label: 'Più popolari' },
  ];

  const sizeOptions = [
    { value: 'XS', label: 'XS' },
    { value: 'S', label: 'S' },
    { value: 'M', label: 'M' },
    { value: 'L', label: 'L' },
    { value: 'XL', label: 'XL' },
    { value: 'XXL', label: 'XXL' },
    { value: '26', label: '26' },
    { value: '28', label: '28' },
    { value: '30', label: '30' },
    { value: '32', label: '32' },
    { value: '34', label: '34' },
    { value: '36', label: '36' },
    { value: '38', label: '38' },
    { value: '40', label: '40' },
    { value: '42', label: '42' },
  ];

  const colorOptions = [
    { value: 'Black', label: 'Nero' },
    { value: 'White', label: 'Bianco' },
    { value: 'Blue', label: 'Blu' },
    { value: 'Light Blue', label: 'Azzurro' },
    { value: 'Dark Blue', label: 'Blu scuro' },
    { value: 'Red', label: 'Rosso' },
    { value: 'Green', label: 'Verde' },
    { value: 'Forest Green', label: 'Verde foresta' },
    { value: 'Olive', label: 'Oliva' },
    { value: 'Gray', label: 'Grigio' },
    { value: 'Grey', label: 'Grigio' },
    { value: 'Beige', label: 'Beige' },
    { value: 'Brown', label: 'Marrone' },
    { value: 'Pink', label: 'Rosa' },
    { value: 'Yellow', label: 'Giallo' },
    { value: 'Orange', label: 'Arancione' },
    { value: 'Purple', label: 'Viola' },
  ];

  const priceRanges = [
    { value: '0-25', label: '0€ - 25€' },
    { value: '25-50', label: '25€ - 50€' },
    { value: '50-100', label: '50€ - 100€' },
    { value: '100+', label: '100€+' },
  ];

  const materialOptions = [
    { value: 'cotton', label: 'Cotone' },
    { value: 'organic_cotton', label: 'Cotone biologico' },
    { value: 'wool', label: 'Lana' },
    { value: 'silk', label: 'Seta' },
    { value: 'linen', label: 'Lino' },
    { value: 'recycled', label: 'Riciclato' },
  ];

  const activeFiltersCount = [
    searchParams.get('brand'),
    searchParams.get('size'),
    searchParams.get('color'),
    searchParams.get('price'),
    searchParams.get('newIn'),
    searchParams.get('material'),
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Mobile filters - compact */}
      <div className="md:hidden flex items-center gap-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1 gap-2 relative">
              <SlidersHorizontal className="h-4 w-4" />
              Filtri
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtri</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Ordina</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={searchParams.get('sort') === option.value}
                        onChange={(e) => updateFilter('sort', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {brands.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Brand</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="brand"
                          value={brand.id}
                          checked={searchParams.get('brand') === brand.id}
                          onChange={(e) => updateFilter('brand', e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Taglia</h3>
                <div className="grid grid-cols-4 gap-2">
                  {sizeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={searchParams.get('size') === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('size', option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Colore</h3>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={searchParams.get('color') === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('color', option.value)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Prezzo</h3>
                <div className="space-y-2">
                  {priceRanges.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        value={option.value}
                        checked={searchParams.get('price') === option.value}
                        onChange={(e) => updateFilter('price', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Novità</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="newIn"
                      value="7days"
                      checked={searchParams.get('newIn') === '7days'}
                      onChange={(e) => updateFilter('newIn', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Ultimi 7 giorni</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="newIn"
                      value="30days"
                      checked={searchParams.get('newIn') === '30days'}
                      onChange={(e) => updateFilter('newIn', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Ultimi 30 giorni</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Materiale</h3>
                <div className="space-y-2">
                  {materialOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={searchParams.get('material') === option.value}
                        onChange={(e) => updateFilter('material', e.target.checked ? e.target.value : '')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t sticky bottom-0 bg-white pb-4">
                <Button onClick={clearAllFilters} variant="outline" className="w-full">
                  Cancella tutti i filtri
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Select
          value={searchParams.get('sort') || ''}
          onValueChange={(value) => updateFilter('sort', value)}
        >
          <SelectTrigger className="flex-1 bg-background">
            <SelectValue placeholder="Ordina" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop filters - all options visible */}
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <Select
          value={searchParams.get('sort') || ''}
          onValueChange={(value) => updateFilter('sort', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Ordina" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {brands.length > 0 && (
          <Select
            value={searchParams.get('brand') || ''}
            onValueChange={(value) => updateFilter('brand', value)}
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={searchParams.get('size') || ''}
          onValueChange={(value) => updateFilter('size', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Taglia" />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('color') || ''}
          onValueChange={(value) => updateFilter('color', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Colore" />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('price') || ''}
          onValueChange={(value) => updateFilter('price', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Prezzo" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('newIn') || ''}
          onValueChange={(value) => updateFilter('newIn', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Novità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Ultimi 7 giorni</SelectItem>
            <SelectItem value="30days">Ultimi 30 giorni</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('material') || ''}
          onValueChange={(value) => updateFilter('material', value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Materiale" />
          </SelectTrigger>
          <SelectContent>
            {materialOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Tutti i filtri
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Tutti i filtri</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Ordina</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        value={option.value}
                        checked={searchParams.get('sort') === option.value}
                        onChange={(e) => updateFilter('sort', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Taglia</h3>
                <div className="grid grid-cols-4 gap-2">
                  {sizeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={searchParams.get('size') === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('size', option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Colore</h3>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={searchParams.get('color') === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('color', option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Prezzo</h3>
                <div className="space-y-2">
                  {priceRanges.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        value={option.value}
                        checked={searchParams.get('price') === option.value}
                        onChange={(e) => updateFilter('price', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Materiale</h3>
                <div className="space-y-2">
                  {materialOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={searchParams.get('material') === option.value}
                        onChange={(e) => updateFilter('material', e.target.checked ? e.target.value : '')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={clearAllFilters} variant="outline" className="w-full">
                  Cancella tutti i filtri
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop product count */}
      <div className="hidden md:flex items-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{totalProducts.toLocaleString('it-IT')}</span>
        <span className="ml-1">articoli</span>
      </div>
    </div>
  );
}
