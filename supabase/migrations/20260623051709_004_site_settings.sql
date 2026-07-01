-- Site settings table for logo and other configurations
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_settings_public" ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "insert_settings_admin" ON site_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_settings_admin" ON site_settings FOR UPDATE
  USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('logo_url', NULL),
  ('site_name', 'AK Uniforms')
ON CONFLICT (setting_key) DO NOTHING;