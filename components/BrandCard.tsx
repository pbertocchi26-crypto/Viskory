import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import Image from 'next/image';

interface BrandCardProps {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  shortBio?: string;
  followersCount: number;
}

export function BrandCard({
  id,
  name,
  slug,
  logoUrl,
  shortBio,
  followersCount,
}: BrandCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 border-border">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 relative rounded-full overflow-hidden bg-muted border-2 border-border">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-xl text-foreground">{name}</h3>
            {shortBio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{shortBio}</p>
            )}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            <span>{followersCount} followers</span>
          </div>
          <Link href={`/brand/${slug}`} className="w-full">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Visit Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
