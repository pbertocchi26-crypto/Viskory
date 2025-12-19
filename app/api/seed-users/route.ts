import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const brandPassword = await bcrypt.hash('brand123', 10);

    const { data: adminUser, error: adminError } = await supabase

    if (adminError) {
      console.error('Admin creation error:', adminError);
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    const { data: brandUser, error: brandUserError } = await supabase

    if (brandUserError) {
      console.error('Brand user creation error:', brandUserError);
      return NextResponse.json({ error: brandUserError.message }, { status: 500 });
    }

    const { data: brand, error: brandError } = await supabase
    
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
