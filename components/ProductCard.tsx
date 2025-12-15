import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  mainImageUrl?: string;
  brandName?: string;
  discountPercentage?: number;
  originalPrice?: number;
  showFastShipping?: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  mainImageUrl,
  brandName,
  discountPercentage,
  originalPrice,
  showFastShipping = false,
}: ProductCardProps) {
  const hasDiscount = discountPercentage && discountPercentage > 0;
  const calculatedOriginalPrice = hasDiscount && !originalPrice
    ? price / (1 - discountPercentage / 100)
    : originalPrice;
  const displayOriginalPrice = hasDiscount ? calculatedOriginalPrice : null;

  return (
    <Link href={`/product/${id}`} className="h-full">
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-border flex flex-col group relative">
        <div className="aspect-square relative bg-muted">
          {mainImageUrl ? (
            <Image
              src={mainImageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}

          <div className="absolute top-2 right-2 z-10">
            <div className="bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform cursor-pointer">
              <Heart className="w-5 h-5 text-muted-foreground hover:text-red-500 hover:fill-red-500 transition-colors" />
            </div>
          </div>

          {hasDiscount && discountPercentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-600 text-white hover:bg-red-700 font-bold">
              Promo
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          {brandName && (
            <p className="text-sm font-bold text-foreground mb-1">{brandName}</p>
          )}
          <h3 className="font-normal text-sm line-clamp-2 text-foreground mb-2 flex-1">{name}</h3>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-foreground">da {price.toFixed(2).replace('.', ',')} €</p>
            </div>
            {hasDiscount && displayOriginalPrice && discountPercentage !== null && discountPercentage !== undefined && discountPercentage > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Prezzo mediano: {displayOriginalPrice.toFixed(2).replace('.', ',')} €
                </p>
                <p className="text-xs text-red-600 font-medium">
                  Fino a -{discountPercentage}%
                </p>
              </>
            )}
            {showFastShipping && (
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="text-xs font-normal border-foreground/20">
                  <span className="font-bold mr-1">Plus</span>
                  Consegna veloce
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
