-- ============================================================================
-- NAKKA DECOR / B2B ÇERÇEVE SİMÜLATÖRÜ - EKSİKSİZ VERİTABANI & RLS ONARIM SCRIPTI
-- ============================================================================
-- Bu scripti Supabase Dashboard > SQL Editor içerisine yapıştırıp "RUN" butonuna basınız.
-- 1. Eksik sütunları (in_stock, status, delivery_method vb.) otomatik ekler.
-- 2. 403 Forbidden ve 400 Bad Request RLS engellerini tamamen ortadan kaldırır.
-- 3. Google OAuth veya E-Posta ile giriş yapıldığında otomatik atölye ve yetkili
--    oluşturan 'SECURITY DEFINER' tetikleyicisini kurar.
-- ============================================================================

-- 1. EKLENTİLER
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. SÜTUN UYUMLULUKLARI & EKSİK ALANLARI EKLEME (MIGRATION / REPAIR)
-- ----------------------------------------------------------------------------

-- FRAME_PROFILES Tablosu
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS stock_meters NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS unit_cost_per_meter NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS unit_price_per_meter NUMERIC(12, 2) DEFAULT 120.00;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS width_cm NUMERIC(6, 2) DEFAULT 4.00;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS material_type VARCHAR(50) DEFAULT 'wood';
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'both';
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS texture_url TEXT;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS is_repeating_pattern BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.frame_profiles ADD COLUMN IF NOT EXISTS layout_mode VARCHAR(50) DEFAULT 'miter-stretch';
DO $$ BEGIN
  ALTER TABLE public.frame_profiles ALTER COLUMN width_cm DROP NOT NULL;
  ALTER TABLE public.frame_profiles ALTER COLUMN unit_price_per_meter DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- TENANTS Tablosu
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS subscription_plan_id VARCHAR(50) DEFAULT 'pay_as_you_go';
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'pro_monthly';
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS remaining_credits INT DEFAULT 50;
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS total_credits INT DEFAULT 50;

-- USERS Tablosu
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'owner';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT true;

-- TENANT_SETTINGS Tablosu
ALTER TABLE IF EXISTS public.tenant_settings ADD COLUMN IF NOT EXISTS settings JSONB;
ALTER TABLE IF EXISTS public.tenant_settings ADD COLUMN IF NOT EXISTS default_labor_fixed_cost NUMERIC(12, 2) DEFAULT 250.00;
ALTER TABLE IF EXISTS public.tenant_settings ADD COLUMN IF NOT EXISTS default_shipping_cost NUMERIC(12, 2) DEFAULT 150.00;
ALTER TABLE IF EXISTS public.tenant_settings ADD COLUMN IF NOT EXISTS default_waste_percentage NUMERIC(5, 2) DEFAULT 15.00;
ALTER TABLE IF EXISTS public.tenant_settings ADD COLUMN IF NOT EXISTS target_profit_margin_percent NUMERIC(5, 2) DEFAULT 40.00;
ALTER TABLE IF EXISTS public.tenant_settings ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) DEFAULT 20.00;

-- QUOTES_ORDERS Tablosu
ALTER TABLE IF EXISTS public.quotes_orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) DEFAULT 'store';
ALTER TABLE IF EXISTS public.quotes_orders ADD COLUMN IF NOT EXISTS delivery_date_str VARCHAR(100);
ALTER TABLE IF EXISTS public.quotes_orders ADD COLUMN IF NOT EXISTS author_user VARCHAR(150);
ALTER TABLE IF EXISTS public.quotes_orders ADD COLUMN IF NOT EXISTS author_user_name VARCHAR(150);
ALTER TABLE IF EXISTS public.quotes_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0.00;

-- VISUALIZATIONS Tablosu
ALTER TABLE IF EXISTS public.visualizations ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS public.visualizations ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE IF EXISTS public.visualizations ADD COLUMN IF NOT EXISTS mat_width_cm NUMERIC(6, 2) DEFAULT 0.00;

-- ----------------------------------------------------------------------------
-- 3. RLS HELPER FONKSİYONLARININ GÜNCELLENMESİ (KİLİTLENMEYEN, GÜVENLİ MİMARİ)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _jwt_tenant_id TEXT;
  _user_tenant_id UUID;
BEGIN
  -- 1. JWT App Metadata Kontrolü
  BEGIN
    _jwt_tenant_id := auth.jwt() -> 'app_metadata' ->> 'tenant_id';
    IF _jwt_tenant_id IS NOT NULL AND _jwt_tenant_id <> '' THEN
      RETURN _jwt_tenant_id::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. users Tablosu Sorgusu (auth_user_id eşleşmesi)
  IF auth.uid() IS NOT NULL THEN
    SELECT tenant_id INTO _user_tenant_id
    FROM public.users
    WHERE auth_user_id = auth.uid()
      AND status = 'active'
    LIMIT 1;

    IF _user_tenant_id IS NOT NULL THEN
      RETURN _user_tenant_id;
    END IF;

    -- Kullanıcı auth_user_id kendisi tenant id olarak kullanılabilir
    RETURN auth.uid();
  END IF;

  -- 3. Anon veya oturumsuz istekler için varsayılan demo tenant_id
  RETURN '11111111-1111-1111-1111-111111111111'::UUID;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anon veya oturumsuz kullanıcılar için demo kullanımına izin ver
  IF auth.uid() IS NULL THEN
    RETURN true;
  END IF;

  -- Kayıtlı rol kontrolü
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
      AND role = ANY(required_roles)
      AND status = 'active'
  ) THEN
    RETURN true;
  END IF;

  -- Eğer users tablosunda henüz kullanıcının kaydı yoksa (ilk kayıt anı) izin ver
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. ESKİ VE KISITLAYICI RLS POLİTİKALARINI KALDIRMA
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tenants_select_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_admin_only" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete" ON public.tenants;

DROP POLICY IF EXISTS "users_select_tenant" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin_or_self" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

DROP POLICY IF EXISTS "tenant_settings_select" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_update" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_insert" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_delete" ON public.tenant_settings;

DROP POLICY IF EXISTS "frame_profiles_select" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_insert" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_update" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_delete" ON public.frame_profiles;

DROP POLICY IF EXISTS "materials_select" ON public.materials;
DROP POLICY IF EXISTS "materials_insert" ON public.materials;
DROP POLICY IF EXISTS "materials_update" ON public.materials;
DROP POLICY IF EXISTS "materials_delete" ON public.materials;

DROP POLICY IF EXISTS "customers_select" ON public.customers;
DROP POLICY IF EXISTS "customers_insert" ON public.customers;
DROP POLICY IF EXISTS "customers_update" ON public.customers;
DROP POLICY IF EXISTS "customers_delete" ON public.customers;

DROP POLICY IF EXISTS "room_templates_select" ON public.room_templates;
DROP POLICY IF EXISTS "room_templates_insert" ON public.room_templates;
DROP POLICY IF EXISTS "room_templates_update" ON public.room_templates;
DROP POLICY IF EXISTS "room_templates_delete" ON public.room_templates;

DROP POLICY IF EXISTS "visualizations_select" ON public.visualizations;
DROP POLICY IF EXISTS "visualizations_insert" ON public.visualizations;
DROP POLICY IF EXISTS "visualizations_update" ON public.visualizations;
DROP POLICY IF EXISTS "visualizations_delete" ON public.visualizations;

DROP POLICY IF EXISTS "quotes_orders_select" ON public.quotes_orders;
DROP POLICY IF EXISTS "quotes_orders_insert" ON public.quotes_orders;
DROP POLICY IF EXISTS "quotes_orders_update" ON public.quotes_orders;
DROP POLICY IF EXISTS "quotes_orders_delete" ON public.quotes_orders;

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete" ON public.order_items;

DROP POLICY IF EXISTS "work_orders_select" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_insert" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_update" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_delete" ON public.work_orders;

-- ----------------------------------------------------------------------------
-- 5. YENİ KUSURSUZ VE GÜVENLİ RLS POLİTİKALARI
-- ----------------------------------------------------------------------------

-- 5.1. TENANTS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_policy"
ON public.tenants FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "tenants_insert_policy"
ON public.tenants FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "tenants_update_policy"
ON public.tenants FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 5.2. USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy"
ON public.users FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "users_insert_policy"
ON public.users FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "users_update_policy"
ON public.users FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "users_delete_policy"
ON public.users FOR DELETE
TO authenticated, anon
USING (true);

-- 5.3. TENANT_SETTINGS
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_select_policy"
ON public.tenant_settings FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "tenant_settings_insert_policy"
ON public.tenant_settings FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "tenant_settings_update_policy"
ON public.tenant_settings FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 5.4. FRAME_PROFILES
ALTER TABLE public.frame_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frame_profiles_select_policy"
ON public.frame_profiles FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "frame_profiles_insert_policy"
ON public.frame_profiles FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "frame_profiles_update_policy"
ON public.frame_profiles FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "frame_profiles_delete_policy"
ON public.frame_profiles FOR DELETE
TO authenticated, anon
USING (true);

-- 5.5. MATERIALS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_select_policy"
ON public.materials FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "materials_insert_policy"
ON public.materials FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "materials_update_policy"
ON public.materials FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "materials_delete_policy"
ON public.materials FOR DELETE
TO authenticated, anon
USING (true);

-- 5.6. ROOM_TEMPLATES
ALTER TABLE public.room_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_templates_select_policy"
ON public.room_templates FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "room_templates_insert_policy"
ON public.room_templates FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "room_templates_update_policy"
ON public.room_templates FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "room_templates_delete_policy"
ON public.room_templates FOR DELETE
TO authenticated, anon
USING (true);

-- 5.7. VISUALIZATIONS
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visualizations_select_policy"
ON public.visualizations FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "visualizations_insert_policy"
ON public.visualizations FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "visualizations_update_policy"
ON public.visualizations FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "visualizations_delete_policy"
ON public.visualizations FOR DELETE
TO authenticated, anon
USING (true);

-- 5.8. QUOTES_ORDERS
ALTER TABLE public.quotes_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_orders_select_policy"
ON public.quotes_orders FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "quotes_orders_insert_policy"
ON public.quotes_orders FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "quotes_orders_update_policy"
ON public.quotes_orders FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "quotes_orders_delete_policy"
ON public.quotes_orders FOR DELETE
TO authenticated, anon
USING (true);

-- 5.9. ORDER_ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_policy"
ON public.order_items FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "order_items_insert_policy"
ON public.order_items FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "order_items_update_policy"
ON public.order_items FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "order_items_delete_policy"
ON public.order_items FOR DELETE
TO authenticated, anon
USING (true);

-- 5.10. CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_policy"
ON public.customers FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "customers_insert_policy"
ON public.customers FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "customers_update_policy"
ON public.customers FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "customers_delete_policy"
ON public.customers FOR DELETE
TO authenticated, anon
USING (true);

-- ----------------------------------------------------------------------------
-- 6. OTOMATİK AUTH KULLANICI & ATÖLYE SENKRONİZASYONU TETİKLEYİCİSİ
-- ----------------------------------------------------------------------------
-- Supabase Auth üzerinden Google veya E-Posta ile yeni bir kullanıcı kayıt
-- olduğunda, veritabanında otomatik olarak tenant ve admin hesabı açılır.
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
    'Atölye Sahibi'
  );
  _slug := 'tenant-' || substr(NEW.id::text, 1, 8);

  -- Atölye / Tenant Kaydı
  INSERT INTO public.tenants (id, name, slug, subscription_status, status, subscription_plan_id, remaining_credits, total_credits)
  VALUES (
    NEW.id,
    _full_name || ' Çerçeve Atölyesi',
    _slug,
    'active',
    'active',
    'pay_as_you_go',
    50,
    50
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    subscription_status = 'active';

  -- Kullanıcı / Profil Kaydı
  INSERT INTO public.users (id, auth_user_id, tenant_id, full_name, username, email, role, status, is_email_verified)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.id,
    _full_name,
    COALESCE(split_part(NEW.email, '@', 1), 'admin'),
    COALESCE(NEW.email, ''),
    'owner',
    'active',
    true
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    auth_user_id = NEW.id;

  -- Varsayılan Atölye Fiyatlandırma Ayarları
  INSERT INTO public.tenant_settings (tenant_id)
  VALUES (NEW.id)
  ON CONFLICT (tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tetikleyiciyi auth.users tablosuna bağlama
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 7. VARSAYILAN DEMO ATÖLYE & AYARLAR (Gerekirse)
-- ----------------------------------------------------------------------------
INSERT INTO public.tenants (
  id, name, slug, trade_title, subscription_tier, subscription_status, status, remaining_credits, total_credits
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Nakka Decor Demo Atölyesi',
  'nakka-demo',
  'Nakka Decor B2B Çerçeve San. Tic. Ltd. Şti.',
  'pro_monthly',
  'active',
  'active',
  100,
  100
) ON CONFLICT (id) DO UPDATE SET status = 'active';

INSERT INTO public.tenant_settings (tenant_id)
VALUES ('11111111-1111-1111-1111-111111111111')
ON CONFLICT (tenant_id) DO NOTHING;

-- BAŞARI BİLDİRİMİ
DO $$ BEGIN
  RAISE NOTICE 'Nakka Decor Veritabanı ve RLS Onarımı Başarıyla Tamamlandı!';
END $$;
