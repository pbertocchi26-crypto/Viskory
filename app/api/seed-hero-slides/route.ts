import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const heroSlides = [
      {
        image_url: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'NEW',
        subtitle: 'Scopri ora le nuove uscite',
        position: 1,
        is_active: true
      },
      {
        image_url: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'SUMMER',
        subtitle: 'Collezione estate 2024',
        position: 2,
        is_active: true
      },
      {
        image_url: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'SCONTI',
        subtitle: 'Fino al 50% di sconto',
        position: 3,
        is_active: true
      },
      {
        image_url: 'https://images.pexels.com/photos/1350560/pexels-photo-1350560.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'URBAN',
        subtitle: 'Stile urbano contemporaneo',
        position: 4,
        is_active: true
      },
      {
        image_url: 'https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg?auto=compress&cs=tinysrgb&w=1200',
        title: 'PREMIUM',
        subtitle: 'Qualità senza compromessi',
        position: 5,
        is_active: true
      }
    ];

    const { data, error } = await supabase
      .from('hero_slides')
      .insert(heroSlides)
      .select();

    if (error) {
      console.error('Seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Hero slides seeded successfully',
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
