-- ============================================================================
-- NAKKA / VİZYON ART STUDIO - SUPABASE YENİ PROJE KURULUM ŞEMASI (schema.sql)
-- Frankfurt (eu-central-1) ve Tüm Supabase Bölgeleri İçin Eksiksiz & Temiz SQL
-- ============================================================================
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor sekmesine yapıştırıp "RUN"
-- butonuna basarak tek seferde çalıştırabilirsiniz.
--
-- İçerik:
-- 1. Gerekli Eklentiler & Otomatik Tarih Güncelleyici
-- 2. Temel Tablolar:
--    - tenants (Atölye / Firma Bilgileri)
--    - tenant_settings (KDV, Kâr Marjı, Tuval, İşçilik vb. Tüm Maliyet Parametreleri)
--    - frame_profiles (Çerçeve Çıta Profilleri Kataloğu)
--    - visualizations (Görsel Simülasyonlar & Eser Kayıtları - Sadece Storage URL Saklar)
--    - quotes_orders (Teklifler ve Siparişler)
--    - users (Kullanıcılar & Personel)
-- 3. Basit ve Güvenli RLS Politikaları (auth.uid() = tenant_id)
-- 4. Supabase Storage Bucket ('uploads' ve 'visualizations' Public Bucket Kurulumu & Politikaları)
-- 5. Otomatik Kayıt Tetikleyicisi (Auth Sign-up -> Tenant & Settings Senkronizasyonu)
-- 6. Başlangıç Varsayılan Verileri (Demo / Varsayılan Atölye ve Çıta Kataloğu)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EKLENTİLER & YARDIMCI FONKSİYONLAR
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Otomatik 'updated_at' güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. TABLOLAR
-- ----------------------------------------------------------------------------

-- 2.1. TENANTS (ATÖLYELER / FİRMALAR)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'Vizyon Sanat ve Çerçeve Tasarım',
  slug VARCHAR(100) NOT NULL DEFAULT 'vizyon-sanat',
  trade_title VARCHAR(255),
  tagline TEXT DEFAULT 'Özel Çerçeve Tasarımı & Sanat Eseri Koruma Atölyesi',
  tax_office VARCHAR(100),
  tax_number VARCHAR(50),
  phone VARCHAR(50) DEFAULT '+90 (216) 450 12 34',
  email VARCHAR(255) DEFAULT 'info@vizyonart.com',
  website VARCHAR(255) DEFAULT 'www.vizyonart.com',
  address TEXT DEFAULT 'Bağdat Caddesi No: 242/A Kadıköy',
  city VARCHAR(100) DEFAULT 'İstanbul',
  iban VARCHAR(50),
  logo_url TEXT,
  primary_color VARCHAR(30) DEFAULT '#C5A059',
  currency VARCHAR(10) DEFAULT '₺',
  subscription_tier VARCHAR(50) DEFAULT 'pro',
  subscription_status VARCHAR(50) DEFAULT 'active',
  status VARCHAR(50) DEFAULT 'active',
  remaining_credits INT DEFAULT 50,
  total_credits INT DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2.2. TENANT_SETTINGS (MALİYETLER, FİRELER, KÂR MARJI, KDV & BİRİM FİYATLAR)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Kanvas Tablo Baskı Fiyatı (m²)
  canvas_print_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 450.00,

  -- Paspartu & Özel Kartonlar (m²)
  mat_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 280.00,
  middle_mat_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 350.00,
  transparent_mat_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 520.00,

  -- Cam, Arkalık & Bitiş Malzemeleri
  glass_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 320.00,
  backing_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 180.00,
  backing_cloth_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 90.00,
  kraft_tape_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 20.00,

  -- Varsayılan Profil Metre Fiyatları
  default_inner_frame_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 120.00,
  default_outer_frame_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 180.00,

  -- İşçilik ve Sevkiyat Sabitleri
  default_labor_fixed_cost NUMERIC(12, 2) NOT NULL DEFAULT 250.00,
  default_shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 150.00,

  -- Fire Yüzdeleri (%)
  default_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  frame_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  mat_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  glass_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
  backing_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,

  -- Hedef Kâr Marjı & KDV Oranı (%)
  target_profit_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
  vat_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,

  -- Fiyatlandırma ve Güvenlik Tercihleri
  include_in_quotes BOOLEAN NOT NULL DEFAULT true,
  shop_pin_code VARCHAR(10) NOT NULL DEFAULT '1234',

  -- JSONB Esnek Ayarlar (Örn: dahil/hariç checkbox bayrakları)
  default_inclusion_flags JSONB DEFAULT NULL,
  settings JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_tenant_settings_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2.3. FRAME_PROFILES (ÇERÇEVE ÇITA VE PROFİL KATALOĞU)
CREATE TABLE IF NOT EXISTS public.frame_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  width_cm NUMERIC(5, 2) NOT NULL DEFAULT 4.00,
  depth_cm NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
  unit_cost_per_meter NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
  unit_price_per_meter NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  material_type VARCHAR(50) DEFAULT 'wood',
  category VARCHAR(50) DEFAULT 'both',
  image_url TEXT,
  texture_url TEXT,
  is_repeating_pattern BOOLEAN DEFAULT true,
  layout_mode VARCHAR(50) DEFAULT 'repeat',
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_frame_profiles_tenant ON public.frame_profiles(tenant_id);

CREATE TRIGGER set_frame_profiles_updated_at
BEFORE UPDATE ON public.frame_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2.4. VISUALIZATIONS (SİMÜLASYONLAR & YÜKLENEN ESERLER)
-- NOT: artwork_url alanında ASLA Base64 saklanmaz; sadece Supabase Storage'dan dönen kısa public URL tutulur.
CREATE TABLE IF NOT EXISTS public.visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  artwork_url TEXT NOT NULL,
  artwork_name VARCHAR(255) DEFAULT 'Yeni Eser',
  artwork_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 50.00,
  artwork_height_cm NUMERIC(6, 2) NOT NULL DEFAULT 70.00,
  inner_frame_profile_id UUID REFERENCES public.frame_profiles(id) ON DELETE SET NULL,
  rendered_preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visualizations_tenant ON public.visualizations(tenant_id);

CREATE TRIGGER set_visualizations_updated_at
BEFORE UPDATE ON public.visualizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2.5. QUOTES_ORDERS (SİPARİŞLER VE TEKLİFLER)
CREATE TABLE IF NOT EXISTS public.quotes_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  delivery_date DATE,
  delivery_date_str VARCHAR(100),
  artwork_width_cm NUMERIC(6, 2),
  artwork_height_cm NUMERIC(6, 2),
  inner_frame_title VARCHAR(255),
  outer_frame_title VARCHAR(255),
  mat_info VARCHAR(255),
  raw_material_cost NUMERIC(12, 2) DEFAULT 0.00,
  labor_cost NUMERIC(12, 2) DEFAULT 0.00,
  profit_amount NUMERIC(12, 2) DEFAULT 0.00,
  subtotal NUMERIC(12, 2) DEFAULT 0.00,
  vat_amount NUMERIC(12, 2) DEFAULT 0.00,
  grand_total NUMERIC(12, 2) DEFAULT 0.00,
  total_amount NUMERIC(12, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT '₺',
  status VARCHAR(50) DEFAULT 'quote',
  delivery_method VARCHAR(50) DEFAULT 'store',
  author_user_name VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_quotes_orders_tenant ON public.quotes_orders(tenant_id);

CREATE TRIGGER set_quotes_orders_updated_at
BEFORE UPDATE ON public.quotes_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2.6. USERS (ATÖLYE KULLANICILARI & PERSONEL)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'owner',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- auth.uid() = tenant_id Kuralı ile Basit, Güçlü ve Güvenli İzolasyon
-- ----------------------------------------------------------------------------

-- RLS Etkinleştirme
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3.1. TENANTS POLİTİKALARI
DROP POLICY IF EXISTS "tenants_auth_isolation" ON public.tenants;
CREATE POLICY "tenants_auth_isolation" ON public.tenants
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "tenants_anon_access" ON public.tenants;
CREATE POLICY "tenants_anon_access" ON public.tenants
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- 3.2. TENANT_SETTINGS POLİTİKALARI
DROP POLICY IF EXISTS "tenant_settings_auth_isolation" ON public.tenant_settings;
CREATE POLICY "tenant_settings_auth_isolation" ON public.tenant_settings
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "tenant_settings_anon_access" ON public.tenant_settings;
CREATE POLICY "tenant_settings_anon_access" ON public.tenant_settings
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- 3.3. FRAME_PROFILES POLİTİKALARI
DROP POLICY IF EXISTS "frame_profiles_auth_isolation" ON public.frame_profiles;
CREATE POLICY "frame_profiles_auth_isolation" ON public.frame_profiles
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "frame_profiles_anon_access" ON public.frame_profiles;
CREATE POLICY "frame_profiles_anon_access" ON public.frame_profiles
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- 3.4. VISUALIZATIONS POLİTİKALARI
DROP POLICY IF EXISTS "visualizations_auth_isolation" ON public.visualizations;
CREATE POLICY "visualizations_auth_isolation" ON public.visualizations
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "visualizations_anon_access" ON public.visualizations;
CREATE POLICY "visualizations_anon_access" ON public.visualizations
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- 3.5. QUOTES_ORDERS POLİTİKALARI
DROP POLICY IF EXISTS "quotes_orders_auth_isolation" ON public.quotes_orders;
CREATE POLICY "quotes_orders_auth_isolation" ON public.quotes_orders
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "quotes_orders_anon_access" ON public.quotes_orders;
CREATE POLICY "quotes_orders_anon_access" ON public.quotes_orders
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- 3.6. USERS POLİTİKALARI
DROP POLICY IF EXISTS "users_auth_isolation" ON public.users;
CREATE POLICY "users_auth_isolation" ON public.users
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "users_anon_access" ON public.users;
CREATE POLICY "users_anon_access" ON public.users
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. SUPABASE STORAGE (DOSYA YÜKLEME) PUBLIC BUCKET KURULUMU
-- ----------------------------------------------------------------------------
-- 'uploads' ve 'visualizations' public bucketlarını oluşturur ve erişim izinlerini verir.
-- Bu sayede eser fotoğrafları, kırpılmış resimler ve logolar doğrudan Storage'a yüklenir.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('uploads', 'uploads', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('visualizations', 'visualizations', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage Güvenlik Politikaları
DROP POLICY IF EXISTS "Public View Storage Objects" ON storage.objects;
CREATE POLICY "Public View Storage Objects"
ON storage.objects FOR SELECT
USING (bucket_id IN ('uploads', 'visualizations'));

DROP POLICY IF EXISTS "Allow Insert Storage Objects" ON storage.objects;
CREATE POLICY "Allow Insert Storage Objects"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('uploads', 'visualizations'));

DROP POLICY IF EXISTS "Allow Update Storage Objects" ON storage.objects;
CREATE POLICY "Allow Update Storage Objects"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('uploads', 'visualizations'));

DROP POLICY IF EXISTS "Allow Delete Storage Objects" ON storage.objects;
CREATE POLICY "Allow Delete Storage Objects"
ON storage.objects FOR DELETE
USING (bucket_id IN ('uploads', 'visualizations'));

-- ----------------------------------------------------------------------------
-- 5. SUPABASE AUTH KULLANICI SENKRONİZASYON TETİKLEYİCİSİ
-- ----------------------------------------------------------------------------
-- Yeni bir kullanıcı kaydolduğunda (auth.users), otomatik olarak aynı id ile
-- tenants ve tenant_settings kaydını açar. (auth.uid() = tenant_id garantisi)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name TEXT;
  _slug TEXT;
BEGIN
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Atölye Yöneticisi'
  );
  _slug := 'tenant-' || substr(NEW.id::text, 1, 8);

  -- 1. Atölye / Tenant Kaydı
  INSERT INTO public.tenants (id, name, slug, subscription_status, status, remaining_credits, total_credits)
  VALUES (
    NEW.id,
    _full_name || ' Çerçeve Atölyesi',
    _slug,
    'active',
    'active',
    50,
    50
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    subscription_status = 'active';

  -- 2. Varsayılan Atölye Fiyatlandırma Ayarları
  INSERT INTO public.tenant_settings (tenant_id)
  VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- 3. Kullanıcı Profili Kaydı
  INSERT INTO public.users (id, auth_user_id, tenant_id, full_name, username, email, role, status)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.id,
    _full_name,
    COALESCE(split_part(NEW.email, '@', 1), 'admin'),
    COALESCE(NEW.email, ''),
    'owner',
    'active'
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    auth_user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 6. BAŞLANGIÇ DEMO / VARSAYILAN ATÖLYE VERİLERİ (İDEMPOTENT)
-- ----------------------------------------------------------------------------
-- Varsayılan tenant: '11111111-1111-1111-1111-111111111111'
DO $$
DECLARE
  _tenant_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- 6.1. Varsayılan Atölye
  INSERT INTO public.tenants (
    id, name, slug, trade_title, tagline, tax_office, tax_number,
    phone, email, website, address, city, iban, primary_color, currency,
    subscription_tier, subscription_status, remaining_credits, total_credits
  ) VALUES (
    _tenant_id,
    'Vizyon Art Studio',
    'vizyon-art',
    'Vizyon Sanat ve Çerçeve Tasarım Ltd. Şti.',
    'Özel Çerçeve Tasarımı & Sanat Eseri Koruma Atölyesi',
    'Kadıköy',
    '9820148291',
    '+90 (216) 450 12 34',
    'info@vizyonart.com',
    'www.vizyonart.com',
    'Bağdat Caddesi No: 242/A Kadıköy',
    'İstanbul',
    'TR33 0006 2000 1234 5678 9012 34',
    '#C5A059',
    '₺',
    'pro',
    'active',
    50,
    50
  ) ON CONFLICT (id) DO NOTHING;

  -- 6.2. Varsayılan Fiyatlandırma ve Maliyet Ayarları
  INSERT INTO public.tenant_settings (
    tenant_id,
    canvas_print_price_per_sqm,
    mat_board_price_per_sqm,
    middle_mat_board_price_per_sqm,
    transparent_mat_board_price_per_sqm,
    glass_price_per_sqm,
    backing_board_price_per_sqm,
    backing_cloth_price_per_sqm,
    kraft_tape_price_per_meter,
    default_inner_frame_price_per_meter,
    default_outer_frame_price_per_meter,
    default_labor_fixed_cost,
    default_shipping_cost,
    default_waste_percentage,
    frame_waste_percentage,
    mat_waste_percentage,
    glass_waste_percentage,
    backing_waste_percentage,
    target_profit_margin_percent,
    vat_rate_percent,
    include_in_quotes,
    shop_pin_code
  ) VALUES (
    _tenant_id,
    450.00, 280.00, 350.00, 520.00, 320.00, 180.00, 90.00, 20.00,
    120.00, 180.00, 250.00, 150.00,
    15.00, 15.00, 10.00, 12.00, 10.00,
    40.00, 20.00, true, '1234'
  ) ON CONFLICT (tenant_id) DO NOTHING;

  -- 6.3. Başlangıç Çerçeve Profilleri Kataloğu
  INSERT INTO public.frame_profiles (
    tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
    material_type, category, layout_mode, image_url
  ) VALUES 
  (
    _tenant_id, 'AV-501', 'Altın Varak Klasik Oymalı', 5.00, 3.50, 75.00, 150.00,
    'wood', 'both', 'repeat',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80'
  ),
  (
    _tenant_id, 'SM-302', 'Siyah Mat Minimalist Galeri', 3.00, 2.80, 45.00, 95.00,
    'polystyrene', 'both', 'repeat',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80'
  ),
  (
    _tenant_id, 'CR-405', 'Doğal Masif Meşe', 4.00, 3.00, 90.00, 180.00,
    'wood', 'both', 'repeat',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80'
  ),
  (
    _tenant_id, 'BL-201', 'Fırçalanmış İnce Alüminyum', 2.00, 2.00, 60.00, 120.00,
    'aluminum', 'inner', 'repeat',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80'
  ),
  (
    _tenant_id, 'GV-602', 'Gümüş Varak Barok Kasa', 6.00, 4.20, 110.00, 220.00,
    'composite', 'outer', 'repeat',
    'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80'
  ) ON CONFLICT (tenant_id, code) DO NOTHING;

END $$;

-- BİTTİ: Şema başarıyla tamamlandı!
