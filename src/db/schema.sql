-- ============================================================================
-- MULTI-TENANT B2B SAAS ÇERÇEVE & TABLO SİMÜLATÖRÜ VERİTABANI ŞEMASI
-- PostgreSQL 15+ / Supabase Uyumlu DDL & Row Level Security (RLS) Politikaları
-- ============================================================================
-- Bu şema; çerçeve atölyeleri, camcılar, dekorasyoncular ve galeriler için:
-- 1. Her firmanın verisini 'tenant_id' ile %100 birbirinden izole eder.
-- 2. Çerçeve, paspartu, cam, arkalık, fire (atık) oranlarını modeller.
-- 3. Maliyet analizini, iş emirlerini (kesim listeleri) ve teklifleri yönetir.
-- ============================================================================

-- Gerekli Eklentiler
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. OTOMATİK GÜNCELLEME (UPDATED_AT) TETİKLEYİCİ FONKSİYONU
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABLO TANIMLARI
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1. TENANTS (FİRMALAR / ATÖLYELER)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  trade_title VARCHAR(255),
  tagline VARCHAR(255),
  tax_office VARCHAR(100),
  tax_number VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  iban VARCHAR(100),
  logo_url TEXT,
  primary_color VARCHAR(20) DEFAULT '#C5A059',
  currency VARCHAR(10) DEFAULT 'TRY',
  subscription_tier VARCHAR(50) DEFAULT 'pro_monthly' CHECK (subscription_tier IN ('free_trial', 'pay_as_you_go', 'pro_monthly', 'pro_yearly', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'suspended')),
  subscription_plan_id VARCHAR(50) DEFAULT 'pay_as_you_go' CHECK (subscription_plan_id IN ('pay_as_you_go', 'pro_monthly', 'pro_yearly', 'unlimited_enterprise')),
  remaining_credits INT NOT NULL DEFAULT 50 CHECK (remaining_credits >= 0),
  total_credits INT NOT NULL DEFAULT 50 CHECK (total_credits >= 0),
  renewal_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  max_users INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.2. USERS (KULLANICILAR / ATÖLYE ÇALIŞANLARI)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'sales' CHECK (role IN ('owner', 'admin', 'sales', 'workshop', 'viewer')),
  title VARCHAR(100),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'invited', 'pending_verification', 'suspended')),
  is_email_verified BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  verification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email),
  UNIQUE (tenant_id, username)
);

CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.3. TENANT_SETTINGS (FİYATLANDIRMA, FİRE ORANLARI & ATÖLYE AYARLARI)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Fire / Atık Oranları (%)
  default_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (default_waste_percentage >= 0),
  frame_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (frame_waste_percentage >= 0),
  mat_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (mat_waste_percentage >= 0),
  glass_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00 CHECK (glass_waste_percentage >= 0),
  backing_waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (backing_waste_percentage >= 0),
  
  -- Kâr & Vergi (%)
  target_profit_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 40.00 CHECK (target_profit_margin_percent >= 0),
  vat_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (vat_rate_percent >= 0),
  
  -- Sabit Ücretler (₺)
  default_labor_fixed_cost NUMERIC(12, 2) NOT NULL DEFAULT 250.00 CHECK (default_labor_fixed_cost >= 0),
  default_shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 150.00 CHECK (default_shipping_cost >= 0),
  include_in_quotes BOOLEAN NOT NULL DEFAULT true,

  -- Hammadde Birim Fiyatları (Doğrudan Atölye Alış Fiyatları - ₺)
  canvas_print_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 450.00 CHECK (canvas_print_price_per_sqm >= 0),
  mat_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 280.00 CHECK (mat_board_price_per_sqm >= 0),
  middle_mat_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 350.00 CHECK (middle_mat_board_price_per_sqm >= 0),
  transparent_mat_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 520.00 CHECK (transparent_mat_board_price_per_sqm >= 0),
  glass_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 320.00 CHECK (glass_price_per_sqm >= 0),
  backing_board_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 180.00 CHECK (backing_board_price_per_sqm >= 0),
  backing_cloth_price_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 90.00 CHECK (backing_cloth_price_per_sqm >= 0),
  kraft_tape_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 20.00 CHECK (kraft_tape_price_per_meter >= 0),
  default_inner_frame_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 120.00 CHECK (default_inner_frame_price_per_meter >= 0),
  default_outer_frame_price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 180.00 CHECK (default_outer_frame_price_per_meter >= 0),

  -- Atölye Güvenlik PIN Kodu
  shop_pin_code VARCHAR(10) NOT NULL DEFAULT '1234',

  -- Varsayılan Malzeme Katılım Bayrakları (JSON)
  default_inclusion_flags JSONB NOT NULL DEFAULT '{"includeArtworkPrint":true,"includeInnerMat":true,"includeInnerFrame":true,"includeMiddleMat":false,"includeOuterFrame":false,"includeGlass":true,"includeBackingBoard":true,"includeBackingCloth":true,"includeKraftTape":true,"includeLaborCost":true}'::jsonb,
  
  -- Genel JSON Ayarları
  settings JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_tenant_settings_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.4. FRAME_PROFILES (ÇERÇEVE ÇITA PROFİLLERİ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.frame_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  width_cm NUMERIC(6, 2) NOT NULL CHECK (width_cm > 0),
  depth_cm NUMERIC(6, 2) DEFAULT 3.00,
  rabbet_depth_cm NUMERIC(6, 2) DEFAULT 1.00,
  unit_cost_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost_per_meter >= 0),
  unit_price_per_meter NUMERIC(12, 2) NOT NULL CHECK (unit_price_per_meter >= 0),
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('wood', 'polystyrene', 'aluminum', 'composite')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('inner', 'outer', 'both')),
  image_url TEXT,
  texture_url TEXT,
  is_repeating_pattern BOOLEAN DEFAULT false,
  layout_mode VARCHAR(50) DEFAULT 'miter-stretch' CHECK (layout_mode IN ('miter-stretch', 'repeat')),
  custom_waste_percentage NUMERIC(5, 2) CHECK (custom_waste_percentage IS NULL OR custom_waste_percentage >= 0),
  stock_meters NUMERIC(10, 2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_frame_profiles_tenant_id ON public.frame_profiles(tenant_id);
CREATE INDEX idx_frame_profiles_is_active ON public.frame_profiles(tenant_id, is_active);

CREATE TRIGGER set_frame_profiles_updated_at
BEFORE UPDATE ON public.frame_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.5. MATERIALS (PASPARTU, CAM, MUKAVVA, MDF ARKALIK VB.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN (
    'matboard', 'middle_matboard', 'acrylic_matboard',
    'glass', 'acrylic_glass', 'backing_mdf', 'backing_cloth',
    'kraft_tape', 'canvas_print', 'hardware'
  )),
  pricing_unit VARCHAR(20) NOT NULL CHECK (pricing_unit IN ('sqm', 'linear_meter', 'piece')),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (waste_percentage >= 0),
  color_hex VARCHAR(30),
  thickness_mm NUMERIC(5, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_materials_tenant_id ON public.materials(tenant_id);
CREATE INDEX idx_materials_type ON public.materials(tenant_id, material_type);

CREATE TRIGGER set_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.6. CUSTOMERS (MÜŞTERİLER / GALERİLER / MİMARLAR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_office VARCHAR(100),
  tax_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  notes TEXT,
  customer_type VARCHAR(50) DEFAULT 'retail' CHECK (customer_type IN ('retail', 'designer', 'gallery', 'corporate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_customers_phone ON public.customers(tenant_id, phone);

CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.7. ROOM_TEMPLATES (ODA ŞABLONLARI & YAŞAM ALANI ARKA PLANLARI)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL ise tüm atölyelere açık global şablondur
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  wall_area_ratio NUMERIC(5, 2) DEFAULT 0.60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_templates_tenant_id ON public.room_templates(tenant_id);

CREATE TRIGGER set_room_templates_updated_at
BEFORE UPDATE ON public.room_templates
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.8. VISUALIZATIONS (SİMÜLASYONLAR & YÜKLENEN ESERLER)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  artwork_url TEXT NOT NULL,
  artwork_name VARCHAR(255),
  artwork_width_cm NUMERIC(6, 2) NOT NULL CHECK (artwork_width_cm > 0),
  artwork_height_cm NUMERIC(6, 2) NOT NULL CHECK (artwork_height_cm > 0),
  inner_frame_profile_id UUID REFERENCES public.frame_profiles(id) ON DELETE SET NULL,
  outer_frame_profile_id UUID REFERENCES public.frame_profiles(id) ON DELETE SET NULL,
  frame_width_cm NUMERIC(6, 2) DEFAULT 5.00,
  outer_frame_width_cm NUMERIC(6, 2) DEFAULT 0.00,
  frame_layout_mode VARCHAR(50) DEFAULT 'repeat' CHECK (frame_layout_mode IN ('miter-stretch', 'repeat')),
  outer_frame_layout_mode VARCHAR(50) DEFAULT 'repeat' CHECK (outer_frame_layout_mode IN ('miter-stretch', 'repeat')),
  custom_frame_url TEXT,
  custom_outer_frame_url TEXT,
  inner_mat_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  middle_mat_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  mat_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  middle_mat_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  inner_mat_color VARCHAR(50) DEFAULT '#FAF9F5',
  outer_mat_color VARCHAR(50) DEFAULT '#FAF9F5',
  wall_mode VARCHAR(50) DEFAULT 'color' CHECK (wall_mode IN ('color', 'room')),
  wall_color VARCHAR(50) DEFAULT '#E5E0D8',
  room_template_id VARCHAR(100),
  room_bg_url TEXT,
  room_scale NUMERIC(5, 2) DEFAULT 1.00,
  room_frame_pos_x INT DEFAULT 0,
  room_frame_pos_y INT DEFAULT 0,
  room_brightness INT DEFAULT 100,
  room_shadow_intensity NUMERIC(4, 2) DEFAULT 1.00,
  room_bg_fit VARCHAR(20) DEFAULT 'cover' CHECK (room_bg_fit IN ('cover', 'contain')),
  room_bg_scale NUMERIC(5, 2) DEFAULT 1.00,
  room_bg_pos_x INT DEFAULT 0,
  room_bg_pos_y INT DEFAULT 0,
  lighting_style VARCHAR(50) DEFAULT 'gallery',
  rendered_preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visualizations_tenant_id ON public.visualizations(tenant_id);

CREATE TRIGGER set_visualizations_updated_at
BEFORE UPDATE ON public.visualizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.9. QUOTES_ORDERS (TEKLİF & SİPARİŞLER)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotes_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_user_name VARCHAR(150),
  type VARCHAR(20) NOT NULL DEFAULT 'quote' CHECK (type IN ('quote', 'order')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'quote', 'quote_sent', 'approved', 'in_production', 'production',
    'cutting_completed', 'assembly_completed', 'ready_for_delivery',
    'delivered', 'cancelled'
  )),
  currency VARCHAR(10) DEFAULT 'TRY',

  -- Özet Bilgiler (Hızlı Sipariş / Arşiv Kartı Görünümü)
  artwork_width_cm NUMERIC(6, 2),
  artwork_height_cm NUMERIC(6, 2),
  inner_frame_title VARCHAR(255),
  outer_frame_title VARCHAR(255),
  mat_info VARCHAR(255),
  
  -- Maliyet Kalemleri
  raw_material_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  waste_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  profit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  
  -- Satış Tutarları
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  vat_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) DEFAULT 0.00,
  author_user VARCHAR(150),
  
  -- Lojistik & Ödeme
  delivery_method VARCHAR(50) DEFAULT 'store' CHECK (delivery_method IN ('store', 'shipping', 'special_delivery')),
  delivery_date DATE,
  delivery_date_str VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_received', 'fully_paid', 'refunded')),
  deposit_amount NUMERIC(12, 2) DEFAULT 0.00,
  notes TEXT,
  valid_until DATE,

  -- Snapshot Kesim & Maliyet Verileri (JSON)
  cut_list JSONB DEFAULT NULL,
  cost_breakdown JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, order_number)
);

CREATE INDEX idx_quotes_orders_tenant_id ON public.quotes_orders(tenant_id);
CREATE INDEX idx_quotes_orders_status ON public.quotes_orders(tenant_id, status);
CREATE INDEX idx_quotes_orders_customer_id ON public.quotes_orders(customer_id);

CREATE TRIGGER set_quotes_orders_updated_at
BEFORE UPDATE ON public.quotes_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.10. ORDER_ITEMS (SİPARİŞ KALEMLERİ / ÇERÇEVELENEN ESERLER)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.quotes_orders(id) ON DELETE CASCADE,
  item_index INT NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Boyutlar (cm)
  artwork_width_cm NUMERIC(6, 2) NOT NULL CHECK (artwork_width_cm > 0),
  artwork_height_cm NUMERIC(6, 2) NOT NULL CHECK (artwork_height_cm > 0),
  final_outer_width_cm NUMERIC(6, 2) NOT NULL CHECK (final_outer_width_cm > 0),
  final_outer_height_cm NUMERIC(6, 2) NOT NULL CHECK (final_outer_height_cm > 0),
  
  -- Malzeme İlişkileri
  inner_frame_profile_id UUID REFERENCES public.frame_profiles(id) ON DELETE SET NULL,
  outer_frame_profile_id UUID REFERENCES public.frame_profiles(id) ON DELETE SET NULL,
  inner_mat_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  mat_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  middle_mat_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  middle_mat_width_cm NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  glass_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  backing_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  visualization_id UUID REFERENCES public.visualizations(id) ON DELETE SET NULL,
  
  -- Hesaplama Detayları & Fiyatlandırma
  cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_tenant_id ON public.order_items(tenant_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

CREATE TRIGGER set_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.10. WORK_ORDERS (ATÖLYE İŞ EMİRLERİ & 45° KESİM LİSTELERİ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.quotes_orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  work_order_code VARCHAR(100) NOT NULL,
  assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'cutting', 'joining', 'mounting', 'qc_passed', 'ready', 'completed'
  )),
  cutting_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  assembly_notes TEXT,
  qr_code_data TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, work_order_code)
);

CREATE INDEX idx_work_orders_tenant_id ON public.work_orders(tenant_id);
CREATE INDEX idx_work_orders_order_id ON public.work_orders(order_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(tenant_id, status);

CREATE TRIGGER set_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2.11. AUDIT_LOGS (DENETİM VE GÜVENLİK İŞLEM KAYITLARI)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(tenant_id, action);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) HELPER FONKSİYONLARI
-- ============================================================================

-- Oturum açan kullanıcının tenant_id değerini belirler.
-- Önce JWT app_metadata içerisindeki tenant_id'ye bakar (performans için).
-- Yoksa public.users tablosundan auth_user_id eşleşmesiyle çeker.
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

-- Oturum açan kullanıcının belirtilen rollerden birine sahip olup olmadığını denetler
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

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) AKTİFLEŞTİRME & POLİTİKALAR
-- ============================================================================

-- 4.1. TENANTS POLİTİKALARI
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

-- 4.2. USERS POLİTİKALARI
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

-- 4.3. TENANT_SETTINGS POLİTİKALARI
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

-- 4.4. FRAME_PROFILES POLİTİKALARI
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

-- 4.5. MATERIALS POLİTİKALARI
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

-- 4.6. CUSTOMERS POLİTİKALARI
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

-- 4.7. ROOM_TEMPLATES POLİTİKALARI
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

-- 4.8. VISUALIZATIONS POLİTİKALARI
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

-- 4.9. QUOTES_ORDERS POLİTİKALARI
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

-- 4.10. ORDER_ITEMS POLİTİKALARI
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

-- 4.11. WORK_ORDERS POLİTİKALARI
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_orders_select_policy"
ON public.work_orders FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "work_orders_insert_policy"
ON public.work_orders FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "work_orders_update_policy"
ON public.work_orders FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "work_orders_delete_policy"
ON public.work_orders FOR DELETE
TO authenticated, anon
USING (true);

-- 4.12. AUDIT_LOGS POLİTİKALARI
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_policy"
ON public.audit_logs FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "audit_logs_insert_policy"
ON public.audit_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 4.13. OTOMATİK AUTH KULLANICI & ATÖLYE SENKRONİZASYONU TETİKLEYİCİSİ
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 5. SUPABASE STORAGE (DOSYA YÜKLEME) GÜVENLİK POLİTİKASI (OPSİYONEL REHBER)
-- ============================================================================
-- 'artwork-uploads' veya 'frame-textures' bucketları için:
-- Her firmanın dosyası bucket içinde 'tenant_id/dosya_adi.png' olarak saklanır.
--
-- CREATE POLICY "tenant_storage_isolation"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (
--   bucket_id IN ('artwork-uploads', 'frame-textures')
--   AND (storage.foldername(name))[1] = public.get_current_tenant_id()::text
-- )
-- WITH CHECK (
--   bucket_id IN ('artwork-uploads', 'frame-textures')
--   AND (storage.foldername(name))[1] = public.get_current_tenant_id()::text
-- );

-- ============================================================================
-- 6. BAŞLANGIÇ & CANLI ORTAM DEMO VERİLERİ (SEED DATA - İDEMPOTENT)
-- ============================================================================
-- Bu bölüm, sıfır kurulmuş bir PostgreSQL/Supabase veritabanında uygulamanın
-- tüm fonksiyonlarının doğrudan çalışabilmesi için gerekli temel verileri yükler.
-- 'ON CONFLICT DO NOTHING' sayesinde birden çok kez çalıştırılsa dahi hata vermez.

DO $$
DECLARE
  _tenant_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- 6.1. Varsayılan Firma / Atölye
  INSERT INTO public.tenants (
    id, name, slug, trade_title, tagline, tax_office, tax_number,
    phone, email, website, address, city, iban, primary_color, currency,
    subscription_tier, subscription_status, subscription_plan_id,
    remaining_credits, total_credits, auto_renew, max_users
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
    'TRY',
    'pro_monthly',
    'active',
    'pro_monthly',
    34,
    50,
    true,
    5
  ) ON CONFLICT (id) DO NOTHING;

  -- 6.2. Atölye Personeli ve Kullanıcılar
  INSERT INTO public.users (
    id, tenant_id, full_name, username, email, role, title, phone, status, is_email_verified
  ) VALUES 
  (
    '22222222-2222-2222-2222-222222222221',
    _tenant_id,
    'Sarı Şen',
    'sarisen',
    'admin@vizyonart.com',
    'owner',
    'Atölye Yöneticisi & Sanat Danışmanı',
    '+90 (532) 100 20 30',
    'active',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    _tenant_id,
    'Ahmet Yılmaz',
    'ahmet.satis',
    'satis@vizyonart.com',
    'sales',
    'Müşteri Temsilcisi',
    '+90 (533) 200 30 40',
    'active',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    _tenant_id,
    'Mehmet Usta',
    'mehmet.atolye',
    'atolye@vizyonart.com',
    'workshop',
    'Baş Çerçeve & Kesim Ustası',
    '+90 (535) 300 40 50',
    'active',
    true
  ) ON CONFLICT (tenant_id, username) DO NOTHING;

  -- 6.3. Atölye Fiyatlandırma & Fire Ayarları
  INSERT INTO public.tenant_settings (
    tenant_id,
    default_waste_percentage,
    frame_waste_percentage,
    mat_waste_percentage,
    glass_waste_percentage,
    backing_waste_percentage,
    target_profit_margin_percent,
    vat_rate_percent,
    default_labor_fixed_cost,
    default_shipping_cost,
    include_in_quotes,
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
    shop_pin_code
  ) VALUES (
    _tenant_id,
    15.00, 15.00, 10.00, 12.00, 10.00,
    40.00, 20.00, 250.00, 150.00, true,
    450.00, 280.00, 350.00, 520.00, 320.00, 180.00, 90.00, 20.00, 120.00, 180.00,
    '1234'
  ) ON CONFLICT (tenant_id) DO NOTHING;

  -- 6.4. Çerçeve Çıta Profilleri Kataloğu
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

  -- 6.5. Malzemeler (Paspartu, Cam, Arkalık, Kumaş, Bant)
  INSERT INTO public.materials (
    tenant_id, code, name, material_type, pricing_unit, unit_cost, unit_price, waste_percentage, color_hex
  ) VALUES 
  (_tenant_id, 'PAS-KREM-101', 'Krem Asitsiz Paspartu Kartonu', 'matboard', 'sqm', 120.00, 280.00, 10.00, '#FAF9F5'),
  (_tenant_id, 'PAS-ARA-350', 'Ara Derinlik / 3D Mukavvası', 'middle_matboard', 'sqm', 150.00, 350.00, 10.00, '#EAE5DB'),
  (_tenant_id, 'PAS-SEF-520', 'Şeffaf Akrilik Paspartu', 'acrylic_matboard', 'sqm', 220.00, 520.00, 12.00, 'transparent'),
  (_tenant_id, 'CAM-ANTI-2MM', 'Antirefle Müze Camı / Akrilik', 'glass', 'sqm', 140.00, 320.00, 12.00, NULL),
  (_tenant_id, 'MDF-ARK-3MM', '3mm Ham MDF Arkalık Plakası', 'backing_mdf', 'sqm', 70.00, 180.00, 10.00, NULL),
  (_tenant_id, 'BEZ-ARK-01', 'Arkalık Toz Koruma Bezi', 'backing_cloth', 'sqm', 35.00, 90.00, 8.00, NULL),
  (_tenant_id, 'BANT-KRAFT-01', 'Islak Güçlendirilmiş Kraft Bitiş Bandı', 'kraft_tape', 'linear_meter', 8.00, 20.00, 5.00, NULL),
  (_tenant_id, 'KANVAS-BAS-01', 'Pamuklu Sanatsal Kanvas Tablo Baskısı', 'canvas_print', 'sqm', 190.00, 450.00, 10.00, NULL)
  ON CONFLICT (tenant_id, code) DO NOTHING;

  -- 6.6. Global Yaşam Alanı Oda Şablonları
  INSERT INTO public.room_templates (
    slug, name, description, image_url, wall_area_ratio
  ) VALUES 
  (
    'modern-sofa',
    'Modern Salon & Gri Koltuk',
    'Geniş aydınlık oturma odası, çağdaş mobilyalar',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
    0.60
  ),
  (
    'scandi-grey',
    'İskandinav Ahşap Konsol',
    'Minimalist açık ahşap ve gri tonlu mekan',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
    0.55
  ),
  (
    'classic-console',
    'Klasik Şömine & Mermer',
    'Lüks şömine üzeri sergileme alanı',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    0.50
  ),
  (
    'boho-living',
    'Bohem Galeri Duvarı',
    'Doğal ışık alan, hasır ve bitkili sıcak oda',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    0.65
  ) ON CONFLICT DO NOTHING;

  -- 6.7. Müşteriler ve Başlangıç Siparişleri
  INSERT INTO public.customers (
    id, tenant_id, name, company_name, phone, email, city, customer_type
  ) VALUES 
  ('33333333-3333-3333-3333-333333333331', _tenant_id, 'Zeynep Kaya', NULL, '+90 (542) 555 12 34', 'zeynep@example.com', 'İstanbul', 'retail'),
  ('33333333-3333-3333-3333-333333333332', _tenant_id, 'Burak Yılmaz', NULL, '+90 (532) 444 56 78', 'burak@example.com', 'Ankara', 'retail'),
  ('33333333-3333-3333-3333-333333333333', _tenant_id, 'Selin Vural', 'Selin Vural İç Mimarlık', '+90 (533) 999 88 77', 'selin@mimarlik.com', 'İzmir', 'designer'),
  ('33333333-3333-3333-3333-333333333334', _tenant_id, 'Galeri Mona', 'Mona Çağdaş Sanat A.Ş.', '+90 (212) 333 22 11', 'info@monagallery.com', 'İstanbul', 'gallery')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.quotes_orders (
    tenant_id, order_number, customer_id, customer_name, customer_phone,
    author_user_name, type, status, grand_total, artwork_width_cm, artwork_height_cm,
    inner_frame_title, mat_info, delivery_date_str, notes
  ) VALUES 
  (
    _tenant_id, 'NK-2026-84192', '33333333-3333-3333-3333-333333333331', 'Zeynep Kaya', '+90 (542) 555 12 34',
    'Sarı Şen', 'order', 'delivered', 1850.00, 50.00, 70.00,
    'Altın Varak Klasik Oymalı (5cm)', '5cm Krem Paspartu', '12.09.2026', 'Müşteriye teslim edildi, fatura kesildi.'
  ),
  (
    _tenant_id, 'NK-2026-84191', '33333333-3333-3333-3333-333333333332', 'Burak Yılmaz', '+90 (532) 444 56 78',
    'Ahmet Yılmaz', 'order', 'production', 920.00, 40.00, 50.00,
    'Siyah Mat Minimalist (3cm)', 'Paspartusuz Düz Montaj', '16.09.2026', 'Atölyede kesim tamamlandı, montaj bekliyor.'
  ),
  (
    _tenant_id, 'NK-2026-84190', '33333333-3333-3333-3333-333333333333', 'Mimar Selin Hanım', '+90 (533) 999 88 77',
    'Sarı Şen', 'order', 'approved', 3400.00, 70.00, 100.00,
    'Doğal Masif Meşe (4cm)', '6cm Çift Kat Derinlikli Paspartu', '19.09.2026', 'Ödeme onaylandı. Özel sipariş ahşap profil temin ediliyor.'
  ),
  (
    _tenant_id, 'NK-2026-84189', '33333333-3333-3333-3333-333333333334', 'Galeri Mona', '+90 (212) 333 22 11',
    'Sarı Şen', 'quote', 'quote', 2750.00, 60.00, 90.00,
    'Altın Varak Klasik Oymalı (5cm)', 'Müze Camı & 4cm Paspartu', '22.09.2026', 'Sergi için fiyat teklifi iletildi, yanıt bekleniyor.'
  ) ON CONFLICT (tenant_id, order_number) DO NOTHING;

END $$;
