-- Add stock column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;

-- Add viewed column to orders (for new order notification)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT false;

-- Add cancelled_at column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create feedback/reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT false
);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "insert_reviews_public" ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "select_displayed_reviews" ON reviews FOR SELECT
  USING (is_displayed = true);

CREATE POLICY "select_all_reviews_admin" ON reviews FOR SELECT
  USING (true);

CREATE POLICY "update_reviews_admin" ON reviews FOR UPDATE
  USING (true) WITH CHECK (true);

-- Update existing products with stock
UPDATE products SET stock = 100 WHERE stock IS NULL;

-- Create index for reviews
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);