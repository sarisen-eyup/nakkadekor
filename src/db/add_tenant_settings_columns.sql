-- ============================================================================
-- NAKKA ÇERÇEVE ATÖLYESİ - TENANT_SETTINGS TABLOSU EKSİK SÜTUNLARI & RLS GÜNCELLEMESİ
-- Bu scripti Supabase Dashboard > SQL Editor sekmesine yapıştırıp RUN butonuna basarak çalıştırabilirsiniz.
-- ============================================================================

-- 1. tenant_settings tablosunun mevcut olduğundan emin olun
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Atölye Maliyet & Kâr Ayarları ekranındaki tüm alanlara karşılık gelen sütunları ekleyin
ALTER TABLE public.tenant_settings 
  -- Hammadde ve Baskı Birim Fiyatları
  ADD COLUMN IF NOT EXISTS canvas_print_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS mat_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS middle_mat_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS transparent_mat_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS glass_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS backing_board_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS backing_cloth_price_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS kraft_tape_price_per_meter NUMERIC(12, 2) DEFAULT 0.00,
  
  -- Çerçeve Profil Metre Tül ve Sabit Bedeller
  ADD COLUMN IF NOT EXISTS default_inner_frame_price_per_meter NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS default_outer_frame_price_per_meter NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS default_shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS default_labor_fixed_cost NUMERIC(12, 2) DEFAULT 0.00,
  
  -- Kesim Fire Oranı, Hedef Kâr Marjı ve KDV Oranı
  ADD COLUMN IF NOT EXISTS default_waste_percentage NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS target_profit_margin_percent NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) DEFAULT 0.00,
  
  -- Yedek & Esnek JSON Ayar Depolama Sütunu
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. tenant_id üzerinde UNIQUE kısıtı (UPSERT / onConflict: 'tenant_id' için zorunludur)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_settings_tenant_id_key'
  ) THEN
    ALTER TABLE public.tenant_settings ADD CONSTRAINT tenant_settings_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;

-- 4. RLS Politikaları (Giriş yapmış atölye sahibinin kendi tenant_id kaydını okuyup kaydetmesini sağlar)
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_settings_select_policy" ON public.tenant_settings;
CREATE POLICY "tenant_settings_select_policy"
ON public.tenant_settings FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "tenant_settings_insert_policy" ON public.tenant_settings;
CREATE POLICY "tenant_settings_insert_policy"
ON public.tenant_settings FOR INSERT
TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "tenant_settings_update_policy" ON public.tenant_settings;
CREATE POLICY "tenant_settings_update_policy"
ON public.tenant_settings FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);
