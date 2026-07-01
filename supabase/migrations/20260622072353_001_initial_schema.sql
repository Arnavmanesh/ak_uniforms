-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  meters_per_unit DECIMAL(4,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  status TEXT DEFAULT 'Order Received',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (public read for active products)
CREATE POLICY "select_active_products" ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "select_all_products_admin" ON products FOR SELECT
  USING (true);

CREATE POLICY "insert_products_admin" ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_products_admin" ON products FOR UPDATE
  USING (true) WITH CHECK (true);

-- Orders policies (public can insert, admin can view all)
CREATE POLICY "insert_orders_public" ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "select_orders_admin" ON orders FOR SELECT
  USING (true);

CREATE POLICY "update_orders_admin" ON orders FOR UPDATE
  USING (true) WITH CHECK (true);

-- Order items policies
CREATE POLICY "insert_order_items_public" ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "select_order_items_admin" ON order_items FOR SELECT
  USING (true);

-- Insert default products
INSERT INTO products (name, description, price, meters_per_unit, image_url) VALUES
('Shirt Cloth', 'Premium quality shirt cloth for college uniforms', 300, 2.5, NULL),
('Pant Cloth', 'Durable pant cloth for college uniforms', 350, 1.5, NULL),
('Coat Cloth', 'High-quality coat/blazer cloth', 250, 1.0, NULL);

-- Create index for faster order lookups
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);