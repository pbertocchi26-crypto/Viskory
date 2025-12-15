import { supabase } from './supabase/client';

/**
 * Auto-publishes products that have reached their scheduled launch time
 *
 * This function should be called at the start of any server-side data loader
 * that fetches products for display. It automatically publishes any products
 * where the scheduled_for time has passed.
 *
 * @returns Promise<void>
 */
export async function publishScheduledProducts(): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Find products that are scheduled and ready to publish
    const { data: scheduledProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, scheduled_for')
      .eq('is_published', false)
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', now);

    if (fetchError) {
      console.error('Error fetching scheduled products:', fetchError);
      return;
    }

    if (!scheduledProducts || scheduledProducts.length === 0) {
      return;
    }

    // Publish each product
    const productIds = scheduledProducts.map(p => p.id);

    const { error: updateError } = await supabase
      .from('products')
      .update({
        is_published: true,
        published_at: now,
        scheduled_for: null,
      })
      .in('id', productIds);

    if (updateError) {
      console.error('Error publishing scheduled products:', updateError);
      return;
    }

    console.log(`Auto-published ${productIds.length} scheduled product(s)`);
  } catch (error) {
    console.error('Unexpected error in publishScheduledProducts:', error);
  }
}

/**
 * Server-side version of auto-publish for use in server components
 * Uses server-side Supabase client
 */
export async function publishScheduledProductsServer(): Promise<void> {
  // For server-side usage, we'll use the same function since we're using
  // the same Supabase client. In a production app, you might want to
  // use a service role key for server-side operations.
  return publishScheduledProducts();
}
