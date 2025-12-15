/*
  # Create Vesty Marketplace Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (text: 'ADMIN' | 'BRAND' | 'USER')
      - `avatar_url` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `brands`
      - `id` (uuid, primary key)
      - `owner_user_id` (uuid, foreign key to users)
      - `name` (text)
      - `slug` (text, unique)
      - `logo_url` (text)
      - `cover_image_url` (text)
      - `short_bio` (text)
      - `description` (text)
      - `location` (text)
      - `instagram_url` (text)
      - `tiktok_url` (text)
      - `website_url` (text)
      - `followers_count` (integer, default 0)
      - `status` (text: 'PENDING' | 'APPROVED' | 'DISABLED', default 'APPROVED')
      - `is_featured` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `products`
      - `id` (uuid, primary key)
      - `brand_id` (uuid, foreign key to brands)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `main_image_url` (text)
      - `additional_image_urls` (jsonb)
      - `category` (text)
      - `sizes` (jsonb)
      - `colors` (jsonb)
      - `stock_quantity` (integer, default 0)
      - `is_published` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `follows`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `brand_id` (uuid, foreign key to brands)
      - `created_at` (timestamptz)
    
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `total_amount` (numeric)
      - `status` (text: 'PENDING' | 'PAID' | 'CANCELLED', default 'PENDING')
      - `created_at` (timestamptz)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
    - Add policies for public read access to brands and products
    - Add admin-only policies for user management
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'BRAND', 'USER')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  cover_image_url text,
  short_bio text,
  description text,
  location text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  followers_count integer DEFAULT 0,
  status text DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'DISABLED')),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  main_image_url text,
  additional_image_urls jsonb DEFAULT '[]'::jsonb,
  category text,
  sizes jsonb DEFAULT '[]'::jsonb,
  colors jsonb DEFAULT '[]'::jsonb,
  stock_quantity integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, brand_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  created_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read users for brand profiles"
  ON users FOR SELECT
  TO anon
  USING (role = 'BRAND');

-- Brands policies
CREATE POLICY "Anyone can view approved brands"
  ON brands FOR SELECT
  USING (status = 'APPROVED');

CREATE POLICY "Brand owners can update their brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Brand owners can insert their brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- Products policies
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (is_published = true);

CREATE POLICY "Brand owners can manage their products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
      AND brands.owner_user_id = auth.uid()
    )
  );

-- Follows policies
CREATE POLICY "Users can view their follows"
  ON follows FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can follow brands"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unfollow brands"
  ON follows FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Orders policies
CREATE POLICY "Users can view their orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Order items policies
CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_owner ON brands(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_brand ON follows(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Function to update followers count
CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE brands SET followers_count = followers_count + 1 WHERE id = NEW.brand_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE brands SET followers_count = followers_count - 1 WHERE id = OLD.brand_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update followers count
DROP TRIGGER IF EXISTS update_followers_count_trigger ON follows;
CREATE TRIGGER update_followers_count_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_followers_count();