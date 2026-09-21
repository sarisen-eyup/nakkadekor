-- ============================================================================
-- NAKKA DEKOR - 5 ALTIN KURAL UYUMLU KAPSAMLI SUPABASE SCHEMA & RLS GÜNCELLEMESİ
-- Dosya: src/db/schema_update.sql
-- 
-- Bu dosya Supabase Dashboard -> SQL Editor sekmesine yapıştırılıp "RUN" edilerek
-- çalıştırılmak üzere tasarlanmıştır. Tamamen idempotenttir (tekrar tekrar
-- çalıştırıldığında hata vermez).
-- ============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLOLARIN OLUŞTURULMASI VE UUID / DEFAULT auth.uid() YAPILANDIRMASI
-- ============================================================================

-- 1.1 TENANTS (Atölyeler / Müşteri Hesapları)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name VARCHAR(255) NOT NULL DEFAULT 'Atölye',
  slug VARCHAR(100) UNIQUE,
  trade_title VARCHAR(255),
  tagline VARCHAR(255),
  tax_office VARCHAR(100),
  tax_number VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(150),
  website VARCHAR(150),
  address TEXT,
  city VARCHAR(100),
  iban VARCHAR(50),
  logo_url TEXT,
  primary_color VARCHAR(20) DEFAULT '#C5A059',
  subscription_status VARCHAR(50) DEFAULT 'active',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 TENANT_SETTINGS (Maliyet, Kâr ve Birim Fiyat Ayarları)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tenant_id UNIQUE kısıtı (Tekil tenant ayarları için zorunlu)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_settings_tenant_id_key'
  ) THEN
    ALTER TABLE public.tenant_settings ADD CONSTRAINT tenant_settings_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

-- 1.3 FRAME_PROFILES (Çerçeve Profilleri & Çıtalar)
CREATE TABLE IF NOT EXISTS public.frame_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT auth.uid() REFERENCES public.tenants(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  material_type VARCHAR(50) DEFAULT 'wood',
  width_cm NUMERIC(5, 2) NOT NULL DEFAULT 4.00,
  depth_cm NUMERIC(5, 2) DEFAULT 2.00,
  unit_price_per_meter NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  unit_cost_per_meter NUMERIC(10, 2) DEFAULT 60.00,
  category VARCHAR(50) DEFAULT 'both',
  image_url TEXT,
  texture_url TEXT,
  is_repeating_pattern BOOLEAN DEFAULT true,
  layout_mode VARCHAR(50) DEFAULT 'repeat',
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Var olan tablolarda tenant_id sütununda NOT NULL kısıtı varsa kaldır (Ortak sistem profilleri için tenant_id IS NULL gereklidir)
ALTER TABLE public.frame_profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- tenant_id + code UNIQUE kısıtı (Aynı atölyede aynı kodun tekrarını engeller)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'frame_profiles_tenant_id_code_key'
  ) THEN
    ALTER TABLE public.frame_profiles ADD CONSTRAINT frame_profiles_tenant_id_code_key UNIQUE (tenant_id, code);
  END IF;
END $$;

-- 1.4 VISUALIZATIONS (Simülasyonlar & Yüklenen Eserler)
CREATE TABLE IF NOT EXISTS public.visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.tenants(id) ON DELETE CASCADE,
  artwork_url TEXT NOT NULL,
  artwork_name VARCHAR(255) DEFAULT 'Yeni Eser',
  artwork_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 50.00,
  artwork_height_cm NUMERIC(6, 2) NOT NULL DEFAULT 70.00,
  inner_frame_profile_id UUID REFERENCES public.frame_profiles(id) ON DELETE SET NULL,
  rendered_preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 QUOTES_ORDERS (Siparişler & Teklifler)
CREATE TABLE IF NOT EXISTS public.quotes_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tenant_id + order_number UNIQUE kısıtı
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_orders_tenant_id_order_number_key'
  ) THEN
    ALTER TABLE public.quotes_orders ADD CONSTRAINT quotes_orders_tenant_id_order_number_key UNIQUE (tenant_id, order_number);
  END IF;
END $$;

-- 1.6 USERS (Atölye Kullanıcıları)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  tenant_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100),
  email VARCHAR(150) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 2. KURAL 5: EKSİK SÜTUNLARIN TAMAMLANMASI (tenant_settings & quotes_orders)
-- ============================================================================

-- 2.1 tenant_settings Eksik Sütunları
ALTER TABLE public.tenant_settings
  -- Baskı ve Paspartu Fiyatları
  ADD COLUMN IF NOT EXISTS canvas_print_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS mat_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS middle_mat_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS transparent_mat_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  
  -- Cam, Arkalık ve İzolasyon Fiyatları
  ADD COLUMN IF NOT EXISTS glass_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS backing_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS backing_cloth_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS kraft_tape_price_per_meter NUMERIC(12, 2) DEFAULT 0.00,
  
  -- Varsayılan Profil & Sabit İşçilik / Kargo
  ADD COLUMN IF NOT EXISTS default_inner_frame_price_per_meter NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS default_outer_frame_price_per_meter NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS default_shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS default_labor_fixed_cost NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS labor_fixed_cost NUMERIC(12, 2) DEFAULT 0.00,
  
  -- Fire Oranı, Kâr Marjı ve KDV
  ADD COLUMN IF NOT EXISTS default_waste_percentage NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS waste_percentage NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS target_profit_margin_percent NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) DEFAULT 0.00,
  
  -- Firma Profili Teklif Görünürlüğü ve Esnek JSON
  ADD COLUMN IF NOT EXISTS include_in_quotes BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2.2 quotes_orders Eksik Sütunları
ALTER TABLE public.quotes_orders
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_date_str VARCHAR(100),
  ADD COLUMN IF NOT EXISTS artwork_width_cm NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS artwork_height_cm NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS inner_frame_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS outer_frame_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mat_info VARCHAR(255),
  ADD COLUMN IF NOT EXISTS raw_material_cost NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS profit_amount NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT '₺',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'quote',
  ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) DEFAULT 'store',
  ADD COLUMN IF NOT EXISTS author_user_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS notes TEXT;


-- ============================================================================
-- 3. KURAL 1: SUPABASE STORAGE KOVALARI (BUCKETS) VE POLİTİKALARI
-- Görseller Base64 yerine Storage'da tutulur, tablolara Public URL kaydedilir.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('uploads', 'uploads', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('visualizations', 'visualizations', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('artworks', 'artworks', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('profiles', 'profiles', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Politikaları
DROP POLICY IF EXISTS "Public Read Access on Objects" ON storage.objects;
CREATE POLICY "Public Read Access on Objects"
ON storage.objects FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated User Upload Objects" ON storage.objects;
CREATE POLICY "Authenticated User Upload Objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated User Update Objects" ON storage.objects;
CREATE POLICY "Authenticated User Update Objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated User Delete Objects" ON storage.objects;
CREATE POLICY "Authenticated User Delete Objects"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anon User Upload Objects" ON storage.objects;
CREATE POLICY "Anon User Upload Objects"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (true);


-- ============================================================================
-- 4. KURAL 2: GÜVENLİK VE İZOLASYON (RLS - Row Level Security)
-- Her tabloda SELECT, INSERT, UPDATE, DELETE için tenant_id = auth.uid() izolasyonu.
-- ============================================================================

-- 4.1 TENANTS RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_auth_isolation" ON public.tenants;
DROP POLICY IF EXISTS "tenants_authenticated_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_anon_policy" ON public.tenants;

CREATE POLICY "tenants_auth_isolation"
ON public.tenants
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "tenants_anon_select"
ON public.tenants
FOR SELECT
TO anon
USING (true);

-- 4.2 TENANT_SETTINGS RLS
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_settings_auth_isolation" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_authenticated_policy" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_anon_policy" ON public.tenant_settings;

CREATE POLICY "tenant_settings_auth_isolation"
ON public.tenant_settings
FOR ALL
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "tenant_settings_anon_select"
ON public.tenant_settings
FOR SELECT
TO anon
USING (tenant_id = '11111111-1111-1111-1111-111111111111'::uuid);

-- 4.3 FRAME_PROFILES RLS
ALTER TABLE public.frame_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "frame_profiles_auth_isolation" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_authenticated_policy" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_anon_policy" ON public.frame_profiles;

-- Giriş yapmış kullanıcı: Kendi profillerini okur/yazar, ayrıca ortak sistem profillerini (tenant_id IS NULL) okuyabilir
CREATE POLICY "frame_profiles_select_auth"
ON public.frame_profiles
FOR SELECT
TO authenticated
USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY "frame_profiles_insert_auth"
ON public.frame_profiles
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "frame_profiles_update_auth"
ON public.frame_profiles
FOR UPDATE
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "frame_profiles_delete_auth"
ON public.frame_profiles
FOR DELETE
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "frame_profiles_anon_select"
ON public.frame_profiles
FOR SELECT
TO anon
USING (tenant_id IS NULL OR tenant_id = '11111111-1111-1111-1111-111111111111'::uuid);

-- 4.4 VISUALIZATIONS RLS
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visualizations_auth_isolation" ON public.visualizations;
DROP POLICY IF EXISTS "visualizations_auth_policy" ON public.visualizations;
DROP POLICY IF EXISTS "visualizations_anon_policy" ON public.visualizations;

CREATE POLICY "visualizations_auth_isolation"
ON public.visualizations
FOR ALL
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "visualizations_anon_select"
ON public.visualizations
FOR SELECT
TO anon
USING (tenant_id = '11111111-1111-1111-1111-111111111111'::uuid);

-- 4.5 QUOTES_ORDERS RLS
ALTER TABLE public.quotes_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotes_orders_auth_isolation" ON public.quotes_orders;
DROP POLICY IF EXISTS "quotes_orders_auth_policy" ON public.quotes_orders;
DROP POLICY IF EXISTS "quotes_orders_anon_policy" ON public.quotes_orders;

CREATE POLICY "quotes_orders_auth_isolation"
ON public.quotes_orders
FOR ALL
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "quotes_orders_anon_select"
ON public.quotes_orders
FOR SELECT
TO anon
USING (tenant_id = '11111111-1111-1111-1111-111111111111'::uuid);

-- 4.6 USERS RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_auth_isolation" ON public.users;

CREATE POLICY "users_auth_isolation"
ON public.users
FOR ALL
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

-- ROL YETKİLERİ (GRANTS)
GRANT ALL ON TABLE public.tenants TO authenticated;
GRANT ALL ON TABLE public.tenant_settings TO authenticated;
GRANT ALL ON TABLE public.frame_profiles TO authenticated;
GRANT ALL ON TABLE public.visualizations TO authenticated;
GRANT ALL ON TABLE public.quotes_orders TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;

GRANT SELECT ON TABLE public.tenants TO anon;
GRANT SELECT ON TABLE public.tenant_settings TO anon;
GRANT SELECT ON TABLE public.frame_profiles TO anon;
GRANT SELECT ON TABLE public.visualizations TO anon;
GRANT SELECT ON TABLE public.quotes_orders TO anon;
GRANT SELECT ON TABLE public.users TO anon;


-- ============================================================================
-- 5. KURAL 4: YENİ ATÖLYE İÇİN OTOMATİK TENANT & DEFAULT PROFILES TRIGGER'I
-- Kullanıcı Auth ile kayıt olduğunda otomatik tenant kaydı açar.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_slug TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Atölye');
  v_slug := 'tenant-' || substr(NEW.id::text, 1, 8);

  -- 1. Tenants tablosuna ekle
  INSERT INTO public.tenants (id, name, slug, email)
  VALUES (NEW.id, v_name, v_slug, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- 2. Tenant_settings tablosuna varsayılan ayarları ekle
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
    default_shipping_cost,
    default_labor_fixed_cost,
    labor_fixed_cost,
    default_waste_percentage,
    waste_percentage,
    target_profit_margin_percent,
    vat_rate_percent,
    include_in_quotes
  )
  VALUES (
    NEW.id,
    250.00, 180.00, 150.00, 320.00, 140.00, 95.00, 60.00, 15.00,
    120.00, 160.00, 120.00, 50.00, 50.00, 15.00, 15.00, 40.00, 20.00, true
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  -- 3. Users tablosuna kullanıcıyı ekle
  INSERT INTO public.users (auth_user_id, tenant_id, full_name, email, role)
  VALUES (NEW.id, NEW.id, v_name, NEW.email, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı auth.users üzerine bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================================
-- 6. ORTAK SİSTEM VARSAYILAN ÇERÇEVELERİ (tenant_id IS NULL)
-- Tüm atölyeler 409 Conflict yaşamadan bu ortak profilleri anında okuyabilir.
-- ============================================================================

-- Kesinlikle tenant_id üzerindeki NOT NULL kısıtını kaldır:
ALTER TABLE public.frame_profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- 23502 ve 409 hatalarını önleyen güvenli idempotent ekleme & güncelleme bloğu:
DO $$
BEGIN
  -- 1. AV-501
  IF NOT EXISTS (SELECT 1 FROM public.frame_profiles WHERE code = 'AV-501' AND tenant_id IS NULL) THEN
    INSERT INTO public.frame_profiles (
      tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
      material_type, category, layout_mode, image_url, texture_url, is_repeating_pattern
    ) VALUES (
      NULL, 'AV-501', 'Altın Varak Klasik Oymalı', 5.0, 2.5, 65.00, 145.00,
      'wood', 'both', 'repeat',
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80',
      true
    );
  ELSE
    UPDATE public.frame_profiles SET
      name = 'Altın Varak Klasik Oymalı',
      width_cm = 5.0,
      unit_price_per_meter = 145.00,
      image_url = 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80',
      texture_url = 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=500&auto=format&fit=crop&q=80'
    WHERE code = 'AV-501' AND tenant_id IS NULL;
  END IF;

  -- 2. SM-204
  IF NOT EXISTS (SELECT 1 FROM public.frame_profiles WHERE code = 'SM-204' AND tenant_id IS NULL) THEN
    INSERT INTO public.frame_profiles (
      tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
      material_type, category, layout_mode, image_url, texture_url, is_repeating_pattern
    ) VALUES (
      NULL, 'SM-204', 'Mat Siyah Minimalist', 2.0, 3.0, 40.00, 95.00,
      'polystyrene', 'both', 'repeat',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      true
    );
  ELSE
    UPDATE public.frame_profiles SET
      name = 'Mat Siyah Minimalist',
      width_cm = 2.0,
      unit_price_per_meter = 95.00,
      image_url = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      texture_url = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80'
    WHERE code = 'SM-204' AND tenant_id IS NULL;
  END IF;

  -- 3. DM-302
  IF NOT EXISTS (SELECT 1 FROM public.frame_profiles WHERE code = 'DM-302' AND tenant_id IS NULL) THEN
    INSERT INTO public.frame_profiles (
      tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
      material_type, category, layout_mode, image_url, texture_url, is_repeating_pattern
    ) VALUES (
      NULL, 'DM-302', 'Doğal Meşe İskandinav', 3.0, 2.0, 55.00, 125.00,
      'wood', 'both', 'repeat',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      true
    );
  ELSE
    UPDATE public.frame_profiles SET
      name = 'Doğal Meşe İskandinav',
      width_cm = 3.0,
      unit_price_per_meter = 125.00,
      image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      texture_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80'
    WHERE code = 'DM-302' AND tenant_id IS NULL;
  END IF;

  -- 4. AB-401
  IF NOT EXISTS (SELECT 1 FROM public.frame_profiles WHERE code = 'AB-401' AND tenant_id IS NULL) THEN
    INSERT INTO public.frame_profiles (
      tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
      material_type, category, layout_mode, image_url, texture_url, is_repeating_pattern
    ) VALUES (
      NULL, 'AB-401', 'Fırçalanmış Antik Bakır', 4.0, 2.2, 70.00, 160.00,
      'aluminum', 'both', 'repeat',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
      true
    );
  ELSE
    UPDATE public.frame_profiles SET
      name = 'Fırçalanmış Antik Bakır',
      width_cm = 4.0,
      unit_price_per_meter = 160.00,
      image_url = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
      texture_url = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80'
    WHERE code = 'AB-401' AND tenant_id IS NULL;
  END IF;

  -- 5. GV-305
  IF NOT EXISTS (SELECT 1 FROM public.frame_profiles WHERE code = 'GV-305' AND tenant_id IS NULL) THEN
    INSERT INTO public.frame_profiles (
      tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
      material_type, category, layout_mode, image_url, texture_url, is_repeating_pattern
    ) VALUES (
      NULL, 'GV-305', 'Gümüş Varak İnce Zarif', 3.5, 2.0, 60.00, 135.00,
      'wood', 'both', 'repeat',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      true
    );
  ELSE
    UPDATE public.frame_profiles SET
      name = 'Gümüş Varak İnce Zarif',
      width_cm = 3.5,
      unit_price_per_meter = 135.00,
      image_url = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80',
      texture_url = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80'
    WHERE code = 'GV-305' AND tenant_id IS NULL;
  END IF;

  -- 6. CB-405
  IF NOT EXISTS (SELECT 1 FROM public.frame_profiles WHERE code = 'CB-405' AND tenant_id IS NULL) THEN
    INSERT INTO public.frame_profiles (
      tenant_id, code, name, width_cm, depth_cm, unit_cost_per_meter, unit_price_per_meter,
      material_type, category, layout_mode, image_url, texture_url, is_repeating_pattern
    ) VALUES (
      NULL, 'CB-405', 'Ceviz Ağacı Rustik Çizgili', 4.5, 2.5, 75.00, 170.00,
      'wood', 'both', 'repeat',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      true
    );
  ELSE
    UPDATE public.frame_profiles SET
      name = 'Ceviz Ağacı Rustik Çizgili',
      width_cm = 4.5,
      unit_price_per_meter = 170.00,
      image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      texture_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80'
    WHERE code = 'CB-405' AND tenant_id IS NULL;
  END IF;
END $$;
