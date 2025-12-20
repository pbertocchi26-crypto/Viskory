import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const sampleBrands = [
  { name: 'Eleganza Milano', tagline: 'Timeless Italian elegance', logo: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg' },
  { name: 'Strada Urbana', tagline: 'Urban streetwear revolution', logo: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg' },
  { name: 'Natura Viva', tagline: 'Sustainable fashion forward', logo: 'https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg' },
  { name: 'Luce di Roma', tagline: 'Roman heritage meets modern style', logo: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg' },
  { name: 'Vento Libero', tagline: 'Free spirit fashion', logo: 'https://images.pexels.com/photos/1884583/pexels-photo-1884583.jpeg' },
  { name: 'Stella Nera', tagline: 'Dark elegance redefined', logo: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg' },
  { name: 'Sole Dorato', tagline: 'Golden summer vibes', logo: 'https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg' },
  { name: 'Mare Azzurro', tagline: 'Coastal lifestyle brand', logo: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg' },
  { name: 'Montagna Alta', tagline: 'Alpine inspired designs', logo: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg' },
  { name: 'Cielo Sereno', tagline: 'Clear sky philosophy', logo: 'https://images.pexels.com/photos/1884583/pexels-photo-1884583.jpeg' },
  { name: 'Terra Forte', tagline: 'Grounded in tradition', logo: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg' },
  { name: 'Fuoco Vivo', tagline: 'Passionate fashion statements', logo: 'https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg' },
  { name: 'Acqua Pura', tagline: 'Pure minimal aesthetics', logo: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg' },
  { name: 'Bosco Verde', tagline: 'Forest inspired collections', logo: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg' },
  { name: 'Luna Bianca', tagline: 'Moonlit elegance', logo: 'https://images.pexels.com/photos/1884583/pexels-photo-1884583.jpeg' },
  { name: 'Notte Scura', tagline: 'Night wear luxury', logo: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg' },
  { name: 'Aurora Rosa', tagline: 'Dawn of new fashion', logo: 'https://images.pexels.com/photos/1192609/pexels-photo-1192609.jpeg' },
  { name: 'Vetta Suprema', tagline: 'Peak performance style', logo: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg' },
  { name: 'Onda Morbida', tagline: 'Soft wave textiles', logo: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg' },
  { name: 'Roccia Dura', tagline: 'Solid craftsmanship', logo: 'https://images.pexels.com/photos/1884583/pexels-photo-1884583.jpeg' },
];

export async function POST() {
  try {
    const insertedBrands = [];

    for (const brandData of sampleBrands) {
      const slug = brandData.name.toLowerCase().replace(/\s+/g, '-');

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({
          brand_name: brandData.name,
          slug: slug,
          short_bio: brandData.tagline,
          logo_url: brandData.logo,
          full_description: `${brandData.name} is an emerging Italian fashion brand focused on ${brandData.tagline.toLowerCase()}.`,
          owner_id: '00000000-0000-0000-0000-000000000000',
        })
        .select()
        .single();

      if (brandError || !brand) {
        console.error('Error creating brand:', brandError);
        continue;
      }

      insertedBrands.push(brand);

      const reviewsCount = Math.floor(Math.random() * 50) + 5;
      for (let i = 0; i < reviewsCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        await supabase.from('brand_reviews').insert({
          brand_id: brand.id,
          reviewer_user_id: '00000000-0000-0000-0000-000000000000',
          rating: Math.floor(Math.random() * 3) + 3,
          review_text: 'Great brand with amazing quality!',
          created_at: createdAt.toISOString(),
        });
      }

      const salesCount = Math.floor(Math.random() * 100) + 10;
      for (let i = 0; i < salesCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - daysAgo);

        await supabase.from('external_sales').insert({
          brand_id: brand.id,
          external_order_id: `ORD-${brand.id.substring(0, 8)}-${i}`,
          sale_amount: (Math.random() * 200 + 50).toFixed(2),
          sale_date: saleDate.toISOString(),
          customer_email: `customer${i}@example.com`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedBrands.length} brands with reviews and sales`,
      brands: insertedBrands.length
    });
  } catch (error) {
    console.error('Error seeding brands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed brands' },
      { status: 500 }
    );
  }
}
