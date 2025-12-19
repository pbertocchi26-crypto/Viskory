import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const supabase = createServerClient();

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('password123', 10);

    const { data: adminUser } = await supabase

    const brandOwners = [
      {
        name: 'Sarah Chen',
        email: 'sarah@urbanthread.com',
        password_hash: userPassword,
        role: 'BRAND',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@streetluxe.com',
        password_hash: userPassword,
        role: 'BRAND',
      },
      {
        name: 'Elena Rodriguez',
        email: 'elena@minimalmuse.com',
        password_hash: userPassword,
        role: 'BRAND',
      },
      {
        name: 'David Kim',
        email: 'david@echoapparel.com',
        password_hash: userPassword,
        role: 'BRAND',
      },
    ];

    const { data: insertedBrandOwners } = await supabase
      .from('profiles')
      .insert(brandOwners)
      .select();

    const regularUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: userPassword,
        role: 'USER',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password_hash: userPassword,
        role: 'USER',
      },
      {
        name: 'Mike Wilson',
        email: 'mike@example.com',
        password_hash: userPassword,
        role: 'USER',
      },
    ];

    const brands = [
      {
        owner_user_id: insertedBrandOwners![0].id,
        name: 'Urban Thread',
        slug: 'urban-thread',
        logo_url: 'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=200',
        cover_image_url: 'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1200',
        short_bio: 'Modern streetwear with urban aesthetics',
        description: 'Urban Thread brings together contemporary design and street culture. Our collections are inspired by the energy of city life and the diverse communities that shape urban fashion.',
        location: 'Brooklyn, NY',
        instagram_url: 'https://instagram.com/urbanthread',
        website_url: 'https://urbanthread.com',
        followers_count: 245,
        status: 'APPROVED',
        is_featured: true,
      },
      {
        owner_user_id: insertedBrandOwners![1].id,
        name: 'Street Luxe',
        slug: 'street-luxe',
        logo_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=200',
        cover_image_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=1200',
        short_bio: 'Luxury meets street culture',
        description: 'Street Luxe redefines the boundaries between high fashion and streetwear. We create premium pieces that blend luxury craftsmanship with urban edge.',
        location: 'Los Angeles, CA',
        instagram_url: 'https://instagram.com/streetluxe',
        tiktok_url: 'https://tiktok.com/@streetluxe',
        followers_count: 189,
        status: 'APPROVED',
        is_featured: true,
      },
      {
        owner_user_id: insertedBrandOwners![2].id,
        name: 'Minimal Muse',
        slug: 'minimal-muse',
        logo_url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=200',
        cover_image_url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1200',
        short_bio: 'Minimalist designs for the modern wardrobe',
        description: 'Minimal Muse celebrates the beauty of simplicity. Our designs focus on clean lines, quality materials, and timeless pieces that transcend trends.',
        location: 'Portland, OR',
        instagram_url: 'https://instagram.com/minimalmuse',
        website_url: 'https://minimalmuse.com',
        followers_count: 312,
        status: 'APPROVED',
      },
      {
        owner_user_id: insertedBrandOwners![3].id,
        name: 'Echo Apparel',
        slug: 'echo-apparel',
        logo_url: 'https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=200',
        cover_image_url: 'https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?auto=compress&cs=tinysrgb&w=1200',
        short_bio: 'Sustainable fashion that makes a statement',
        description: 'Echo Apparel is committed to creating fashion that resonates with conscious consumers. We use eco-friendly materials and ethical production methods.',
        location: 'Seattle, WA',
        instagram_url: 'https://instagram.com/echoapparel',
        tiktok_url: 'https://tiktok.com/@echoapparel',
        website_url: 'https://echoapparel.com',
        followers_count: 156,
        status: 'APPROVED',
      },
    ];

    const { data: insertedBrands } = await supabase
      .from('brands')
      .insert(brands)
      .select();

    const products = [
      {
        brand_id: insertedBrands![0].id,
        name: 'Urban Classic Tee',
        description: 'Premium cotton t-shirt with oversized fit. Perfect for everyday wear with a relaxed silhouette and heavy fabric.',
        price: 45.00,
        main_image_url: 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'tshirts',
        material: 'cotton',
        made_in: 'portugal',
        gender: 'UNISEX',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Gray'],
        stock_by_size: { 'S': 10, 'M': 15, 'L': 15, 'XL': 10 },
        price_by_size: { 'S': 45, 'M': 45, 'L': 45, 'XL': 48 },
        is_published: true,
        published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![0].id,
        name: 'Street Hoodie',
        description: 'Heavyweight hoodie with embroidered logo. Made for the streets with premium fleece interior.',
        price: 89.00,
        main_image_url: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'hoodies',
        material: 'mixed',
        made_in: 'portugal',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black', 'Navy', 'Burgundy'],
        stock_by_size: { 'S': 5, 'M': 10, 'L': 10, 'XL': 7, 'XXL': 3 },
        price_by_size: { 'S': 89, 'M': 89, 'L': 89, 'XL': 89, 'XXL': 95 },
        is_published: true,
        published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![0].id,
        name: 'Summer Cargo Shorts',
        description: 'Lightweight cargo shorts with multiple pockets. Perfect for the upcoming summer season.',
        price: 75.00,
        main_image_url: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'shorts',
        material: 'cotton',
        made_in: 'turkey',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Khaki', 'Olive', 'Black'],
        stock_by_size: { 'S': 20, 'M': 25, 'L': 25, 'XL': 15 },
        price_by_size: { 'S': 75, 'M': 75, 'L': 75, 'XL': 78 },
        is_published: false,
        scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![1].id,
        name: 'Luxe Bomber Jacket',
        description: 'Premium bomber jacket with silk lining. A statement piece crafted with Italian fabrics.',
        price: 199.00,
        main_image_url: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'jackets',
        material: 'silk',
        made_in: 'italy',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'Olive'],
        stock_by_size: { 'S': 4, 'M': 6, 'L': 6, 'XL': 4 },
        price_by_size: { 'S': 199, 'M': 199, 'L': 199, 'XL': 199 },
        is_published: true,
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![1].id,
        name: 'Premium Cargo Pants',
        description: 'Modern cargo pants with technical fabric. Function meets fashion with water-resistant material.',
        price: 125.00,
        main_image_url: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'pants',
        material: 'nylon',
        made_in: 'portugal',
        sizes: ['28', '30', '32', '34', '36'],
        colors: ['Black', 'Khaki', 'Gray'],
        stock_by_size: { '28': 6, '30': 10, '32': 12, '34': 8, '36': 4 },
        price_by_size: { '28': 125, '30': 125, '32': 125, '34': 125, '36': 125 },
        is_published: true,
        published_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![1].id,
        name: 'Designer Wool Coat',
        description: 'Luxury wool coat with cashmere blend. Coming this winter for the exclusive collection launch.',
        price: 450.00,
        main_image_url: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'coats',
        material: 'cashmere',
        made_in: 'italy',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Camel', 'Black', 'Navy'],
        stock_by_size: { 'S': 8, 'M': 12, 'L': 12, 'XL': 8 },
        price_by_size: { 'S': 450, 'M': 450, 'L': 450, 'XL': 450 },
        is_published: false,
        scheduled_for: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![2].id,
        name: 'Essential White Tee',
        description: 'The perfect white t-shirt. Clean, simple, essential. Made with premium Portuguese cotton.',
        price: 38.00,
        main_image_url: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'tshirts',
        material: 'organic_cotton',
        made_in: 'portugal',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['White'],
        stock_by_size: { 'XS': 15, 'S': 25, 'M': 30, 'L': 20, 'XL': 10 },
        price_by_size: { 'XS': 38, 'S': 38, 'M': 38, 'L': 38, 'XL': 40 },
        is_published: true,
        published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![2].id,
        name: 'Minimalist Crew Neck',
        description: 'Soft cotton crewneck sweatshirt. Understated elegance with French terry fabric.',
        price: 75.00,
        main_image_url: 'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'sweatshirts',
        material: 'cotton',
        made_in: 'france',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Beige', 'Gray', 'Navy'],
        stock_by_size: { 'S': 12, 'M': 18, 'L': 18, 'XL': 12 },
        price_by_size: { 'S': 75, 'M': 75, 'L': 75, 'XL': 78 },
        is_published: true,
        published_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![2].id,
        name: 'Linen Summer Shirt',
        description: 'Breathable linen shirt for hot summer days. Launching soon with our spring collection.',
        price: 95.00,
        main_image_url: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'shirts',
        material: 'linen',
        made_in: 'portugal',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Light Blue', 'Sage'],
        stock_by_size: { 'S': 15, 'M': 20, 'L': 20, 'XL': 10 },
        price_by_size: { 'S': 95, 'M': 95, 'L': 95, 'XL': 98 },
        is_published: false,
        scheduled_for: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![3].id,
        name: 'Eco Organic Tee',
        description: '100% organic cotton t-shirt. Sustainable and comfortable. GOTS certified organic cotton.',
        price: 42.00,
        main_image_url: 'https://images.pexels.com/photos/1722198/pexels-photo-1722198.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'tshirts',
        material: 'organic_cotton',
        made_in: 'india',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Natural', 'Forest Green', 'Charcoal'],
        stock_by_size: { 'S': 18, 'M': 22, 'L': 22, 'XL': 18 },
        price_by_size: { 'S': 42, 'M': 42, 'L': 42, 'XL': 45 },
        is_published: true,
        published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![3].id,
        name: 'Recycled Zip Hoodie',
        description: 'Made from 100% recycled plastic bottles. Fashion with a conscience and environmental impact.',
        price: 95.00,
        main_image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'hoodies',
        material: 'recycled',
        made_in: 'portugal',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'Ocean Blue'],
        stock_by_size: { 'S': 10, 'M': 12, 'L': 13, 'XL': 10 },
        price_by_size: { 'S': 95, 'M': 95, 'L': 95, 'XL': 98 },
        is_published: true,
        published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![3].id,
        name: 'Hemp Canvas Jacket',
        description: 'Sustainable hemp jacket with organic dyes. Part of our eco-friendly spring launch.',
        price: 165.00,
        main_image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'jackets',
        material: 'hemp',
        made_in: 'portugal',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Natural', 'Olive', 'Rust'],
        stock_by_size: { 'S': 8, 'M': 12, 'L': 12, 'XL': 8 },
        price_by_size: { 'S': 165, 'M': 165, 'L': 165, 'XL': 165 },
        is_published: false,
        scheduled_for: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: insertedProducts } = await supabase.from('products').insert(products).select();

    const additionalProducts = [
      {
        brand_id: insertedBrands![0].id,
        name: 'Classic Men Chinos',
        description: 'Tailored chinos for men. Perfect fit with stretch fabric for all-day comfort.',
        price: 55.00,
        original_price: 79.00,
        discount_percentage: 30,
        main_image_url: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'pants',
        material: 'cotton',
        made_in: 'italy',
        gender: 'MEN',
        sizes: ['30', '32', '34', '36'],
        colors: ['Navy', 'Beige', 'Black'],
        stock_by_size: { '30': 12, '32': 18, '34': 15, '36': 10 },
        price_by_size: { '30': 55, '32': 55, '34': 55, '36': 55 },
        is_published: true,
        published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![1].id,
        name: 'Women Summer Dress',
        description: 'Elegant summer dress with floral pattern. Lightweight and perfect for warm days.',
        price: 69.00,
        original_price: 98.00,
        discount_percentage: 30,
        main_image_url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'dresses',
        material: 'viscose',
        made_in: 'portugal',
        gender: 'WOMEN',
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Blue', 'Pink', 'White'],
        stock_by_size: { 'XS': 10, 'S': 15, 'M': 15, 'L': 10 },
        price_by_size: { 'XS': 69, 'S': 69, 'M': 69, 'L': 69 },
        is_published: true,
        published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![2].id,
        name: 'Men Wool Sweater',
        description: 'Premium merino wool sweater. Soft, warm and timeless design for modern gentlemen.',
        price: 89.00,
        main_image_url: 'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'sweaters',
        material: 'wool',
        made_in: 'scotland',
        gender: 'MEN',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Navy', 'Grey', 'Beige'],
        stock_by_size: { 'S': 8, 'M': 12, 'L': 12, 'XL': 8 },
        price_by_size: { 'S': 89, 'M': 89, 'L': 89, 'XL': 92 },
        is_published: true,
        published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![2].id,
        name: 'Women Silk Blouse',
        description: 'Luxurious silk blouse with elegant drape. Perfect for office or evening wear.',
        price: 79.00,
        original_price: 129.00,
        discount_percentage: 39,
        main_image_url: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'shirts',
        material: 'silk',
        made_in: 'italy',
        gender: 'WOMEN',
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['White', 'Cream', 'Black'],
        stock_by_size: { 'XS': 6, 'S': 10, 'M': 10, 'L': 6 },
        price_by_size: { 'XS': 79, 'S': 79, 'M': 79, 'L': 79 },
        is_published: true,
        published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![3].id,
        name: 'Men Organic Hoodie',
        description: 'Super soft organic cotton hoodie. Made with sustainable practices and eco-friendly dyes.',
        price: 59.00,
        original_price: 85.00,
        discount_percentage: 31,
        main_image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'hoodies',
        material: 'organic_cotton',
        made_in: 'portugal',
        gender: 'MEN',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Forest Green', 'Navy', 'Black'],
        stock_by_size: { 'S': 15, 'M': 20, 'L': 20, 'XL': 15 },
        price_by_size: { 'S': 59, 'M': 59, 'L': 59, 'XL': 62 },
        is_published: true,
        published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        brand_id: insertedBrands![3].id,
        name: 'Women Yoga Leggings',
        description: 'High-waisted leggings made from recycled materials. Perfect for yoga and everyday wear.',
        price: 39.00,
        original_price: 59.00,
        discount_percentage: 34,
        main_image_url: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=800',
        category: 'activewear',
        material: 'recycled',
        made_in: 'portugal',
        gender: 'WOMEN',
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Black', 'Navy', 'Purple'],
        stock_by_size: { 'XS': 20, 'S': 25, 'M': 25, 'L': 20 },
        price_by_size: { 'XS': 39, 'S': 39, 'M': 39, 'L': 39 },
        is_published: true,
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: moreProducts } = await supabase.from('products').insert(additionalProducts).select();

    const allProducts = [...(insertedProducts || []), ...(moreProducts || [])];
    const regularUserIds = regularUsers.map((_, index) => index);

    const productLikes = [
      { user_id: regularUsers[0].email, product_id: allProducts[0].id },
      { user_id: regularUsers[0].email, product_id: allProducts[1].id },
      { user_id: regularUsers[0].email, product_id: allProducts[12].id },
      { user_id: regularUsers[0].email, product_id: allProducts[13].id },
      { user_id: regularUsers[1].email, product_id: allProducts[1].id },
      { user_id: regularUsers[1].email, product_id: allProducts[3].id },
      { user_id: regularUsers[1].email, product_id: allProducts[13].id },
      { user_id: regularUsers[1].email, product_id: allProducts[14].id },
      { user_id: regularUsers[1].email, product_id: allProducts[17].id },
      { user_id: regularUsers[2].email, product_id: allProducts[1].id },
      { user_id: regularUsers[2].email, product_id: allProducts[12].id },
      { user_id: regularUsers[2].email, product_id: allProducts[16].id },
    ];

    const { data: insertedRegularUsers } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', regularUsers.map(u => u.email));

    const likesToInsert = productLikes.map(like => {
      const user = insertedRegularUsers?.find(u => u.email === like.user_id);
      return {
        user_id: user?.id,
        product_id: like.product_id,
      };
    }).filter(like => like.user_id);

    await supabase.from('product_likes').insert(likesToInsert);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      credentials: {
        admin: { email: 'admin@vesty.com', password: 'admin123' },
        brands: [
          { email: 'sarah@urbanthread.com', password: 'password123' },
          { email: 'marcus@streetluxe.com', password: 'password123' },
          { email: 'elena@minimalmuse.com', password: 'password123' },
          { email: 'david@echoapparel.com', password: 'password123' },
        ],
        users: [
          { email: 'john@example.com', password: 'password123' },
          { email: 'jane@example.com', password: 'password123' },
          { email: 'mike@example.com', password: 'password123' },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
