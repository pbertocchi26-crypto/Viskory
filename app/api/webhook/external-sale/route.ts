import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    const webhookToken = authHeader?.replace('Bearer ', '');

    if (!webhookToken) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const { data: tokenData } = await supabase
      .from('brand_webhook_tokens')
      .select('brand_id, is_active')
      .eq('token', webhookToken)
      .eq('is_active', true)
      .maybeSingle();

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or inactive webhook token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      external_order_id,
      product_id,
      amount,
      currency = 'EUR',
      customer_email,
      sale_date,
      viskory_referral = false,
      referral_code,
      metadata,
    } = body;

    if (!external_order_id || !amount || !sale_date) {
      return NextResponse.json(
        { error: 'Missing required fields: external_order_id, amount, sale_date' },
        { status: 400 }
      );
    }

    const { data: saleData, error: saleError } = await supabase
      .from('external_sales')
      .insert({
        brand_id: tokenData.brand_id,
        product_id: product_id || null,
        external_order_id,
        amount,
        currency,
        customer_email,
        sale_date,
        viskory_referral,
        referral_code,
        metadata,
      })
      .select()
      .single();

    if (saleError) {
      if (saleError.code === '23505') {
        return NextResponse.json(
          { error: 'Sale already synced', message: 'This external_order_id has already been recorded' },
          { status: 409 }
        );
      }
      throw saleError;
    }

    await supabase
      .from('brand_webhook_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token', webhookToken);

    return NextResponse.json(
      {
        success: true,
        sale_id: saleData.id,
        message: 'Sale synced successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Viskory External Sales Webhook',
    version: '1.0',
    description: 'Endpoint to sync sales from brand websites to Viskory',
    method: 'POST',
    authentication: 'Bearer token in Authorization header',
    required_fields: ['external_order_id', 'amount', 'sale_date'],
    optional_fields: [
      'product_id',
      'currency',
      'customer_email',
      'viskory_referral',
      'referral_code',
      'metadata',
    ],
    example: {
      external_order_id: 'ORDER-12345',
      product_id: 'uuid-of-product',
      amount: 59.99,
      currency: 'EUR',
      customer_email: 'customer@example.com',
      sale_date: '2024-12-12T10:30:00Z',
      viskory_referral: true,
      referral_code: 'VISK123',
      metadata: {
        size: 'M',
        color: 'Black',
        shipping_address: 'Italy',
      },
    },
  });
}
