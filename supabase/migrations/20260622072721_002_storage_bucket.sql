-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated write access
CREATE POLICY "Authenticated write access" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow anon insert/update for product images
CREATE POLICY "Allow anon uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow anon updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Allow anon deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');