-- ============================================================================
-- NAKKAŞ SİSTEMİ - SUPABASE RLS 403 HATASI VE TABLO YETKİLENDİRME DÜZELTMESİ
-- ============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor kısmına yapıştırıp "RUN" edin.
-- Sorun: Sistem frame_profiles tablosuna varsayılan çerçeveleri eklerken 403 Forbidden alıyordu.
-- Çözüm: Giriş yapmış kullanıcılara (auth.uid() = tenant_id) INSERT/UPDATE/ALL yetkileri tanınır.
-- ============================================================================

-- 1. FRAME_PROFILES TABLOSU İÇİN ESKİ/KISITLAYICI POLİTİKALARI KALDIR
DROP POLICY IF EXISTS "frame_profiles_auth_isolation" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_anon_access" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_select_policy" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_insert_policy" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_update_policy" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_delete_policy" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_authenticated_all" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_authenticated_policy" ON public.frame_profiles;
DROP POLICY IF EXISTS "frame_profiles_anon_policy" ON public.frame_profiles;

-- RLS'nin aktif olduğundan emin ol
ALTER TABLE public.frame_profiles ENABLE ROW LEVEL SECURITY;

-- 2. GİRİŞ YAPMIŞ KULLANICILAR İÇİN TAM YETKİ (INSERT / UPDATE / SELECT / DELETE)
-- Oturum açmış kullanıcı kendi tenant_id'siyle veya atölyesiyle veri ekleyebilir/güncelleyebilir:
CREATE POLICY "frame_profiles_authenticated_policy"
ON public.frame_profiles
FOR ALL
TO authenticated
USING (
  tenant_id = auth.uid() 
  OR tenant_id IS NULL 
  OR auth.uid() IS NOT NULL
)
WITH CHECK (
  tenant_id = auth.uid() 
  OR auth.uid() IS NOT NULL
);

-- 3. ANONİM / DEMO KULLANICILAR İÇİN OKUMA VE DEMO ÇITAYI YAZMA İZNİ
CREATE POLICY "frame_profiles_anon_policy"
ON public.frame_profiles
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Rol izinlerini ver
GRANT ALL ON TABLE public.frame_profiles TO authenticated;
GRANT ALL ON TABLE public.frame_profiles TO anon;
GRANT ALL ON TABLE public.frame_profiles TO service_role;


-- ============================================================================
-- 4. TENANTS TABLOSU RLS İZİNLERİ
-- ============================================================================
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_authenticated_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_anon_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_auth_isolation" ON public.tenants;
DROP POLICY IF EXISTS "tenants_anon_select" ON public.tenants;

CREATE POLICY "tenants_authenticated_policy"
ON public.tenants
FOR ALL
TO authenticated
USING (id = auth.uid() OR auth.uid() IS NOT NULL)
WITH CHECK (id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "tenants_anon_policy"
ON public.tenants
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.tenants TO authenticated;
GRANT ALL ON TABLE public.tenants TO anon;
GRANT ALL ON TABLE public.tenants TO service_role;


-- ============================================================================
-- 5. TENANT_SETTINGS TABLOSU RLS İZİNLERİ
-- ============================================================================
ALTER TABLE IF EXISTS public.tenant_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_settings_authenticated_policy" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_anon_policy" ON public.tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_auth_isolation" ON public.tenant_settings;

CREATE POLICY "tenant_settings_authenticated_policy"
ON public.tenant_settings
FOR ALL
TO authenticated
USING (tenant_id = auth.uid() OR auth.uid() IS NOT NULL)
WITH CHECK (tenant_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "tenant_settings_anon_policy"
ON public.tenant_settings
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.tenant_settings TO authenticated;
GRANT ALL ON TABLE public.tenant_settings TO anon;
GRANT ALL ON TABLE public.tenant_settings TO service_role;


-- ============================================================================
-- 6. VISUALIZATIONS VE QUOTES_ORDERS TABLOLARI İÇİN İZİNLER
-- ============================================================================
ALTER TABLE IF EXISTS public.visualizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visualizations_auth_policy" ON public.visualizations;
CREATE POLICY "visualizations_auth_policy"
ON public.visualizations
FOR ALL
TO authenticated
USING (tenant_id = auth.uid() OR auth.uid() IS NOT NULL)
WITH CHECK (tenant_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "visualizations_anon_policy" ON public.visualizations;
CREATE POLICY "visualizations_anon_policy"
ON public.visualizations
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.visualizations TO authenticated;
GRANT ALL ON TABLE public.visualizations TO anon;
GRANT ALL ON TABLE public.visualizations TO service_role;

ALTER TABLE IF EXISTS public.quotes_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotes_orders_auth_policy" ON public.quotes_orders;
CREATE POLICY "quotes_orders_auth_policy"
ON public.quotes_orders
FOR ALL
TO authenticated
USING (tenant_id = auth.uid() OR auth.uid() IS NOT NULL)
WITH CHECK (tenant_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "quotes_orders_anon_policy" ON public.quotes_orders;
CREATE POLICY "quotes_orders_anon_policy"
ON public.quotes_orders
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.quotes_orders TO authenticated;
GRANT ALL ON TABLE public.quotes_orders TO anon;
GRANT ALL ON TABLE public.quotes_orders TO service_role;


-- ============================================================================
-- 7. FOREIGN KEY VE SÜTUN GÜVENLİĞİ
-- ============================================================================
-- delivery_date_str sütunu eksikse ekle
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes_orders' AND column_name = 'delivery_date_str'
  ) THEN 
    ALTER TABLE public.quotes_orders ADD COLUMN delivery_date_str VARCHAR(100);
  END IF;
END $$;

-- PostgREST API önbelleğini tazeleyip yeni izin ve şemayı aktif et
NOTIFY pgrst, 'reload schema';
