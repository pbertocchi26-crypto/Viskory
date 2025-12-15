import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const brandPassword = await bcrypt.hash('brand123', 10);

    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert({
        name: 'Admin Viskory',
        email: 'admin@viskory.com',
        password_hash: adminPassword,
        role: 'ADMIN',
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'
      })
      .select()
      .single();

    if (adminError) {
      console.error('Admin creation error:', adminError);
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    const { data: brandUser, error: brandUserError } = await supabase
      .from('users')
      .insert({
        name: 'Marco Rossi',
        email: 'brand@viskory.com',
        password_hash: brandPassword,
        role: 'BRAND',
        avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200'
      })
      .select()
      .single();

    if (brandUserError) {
      console.error('Brand user creation error:', brandUserError);
      return NextResponse.json({ error: brandUserError.message }, { status: 500 });
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        owner_user_id: brandUser.id,
        name: 'Urban Style',
        slug: 'urban-style',
        logo_url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
        cover_image_url: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200',
        short_bio: 'Streetwear contemporaneo made in Italy',
        description: 'Urban Style è un brand italiano che fonde lo streetwear con l\'eleganza del design italiano. Ogni capo racconta una storia di qualità, stile e attenzione ai dettagli.',
        location: 'Milano, Italia',
        instagram_url: 'https://instagram.com/urbanstyle',
        website_url: 'https://urbanstyle.com',
        status: 'APPROVED',
        is_featured: true,
        followers_count: 0
      })
      .select()
      .single();

    if (brandError) {
      console.error('Brand creation error:', brandError);
      return NextResponse.json({ error: brandError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      users: {
        admin: {
          email: 'admin@viskory.com',
          password: 'admin123',
          role: 'ADMIN'
        },
        brand: {
          email: 'brand@viskory.com',
          password: 'brand123',
          role: 'BRAND',
          brandName: 'Urban Style',
          brandSlug: 'urban-style'
        }
      }
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
