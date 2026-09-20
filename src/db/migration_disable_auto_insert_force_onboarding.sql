-- ============================================================================
-- MİGRASYON: Otomatik Tenant Kaydını İptal Et & Temiz Onboarding Akışı
-- ============================================================================
-- Bu SQL dosyasını Supabase SQL Editöründe bir kez çalıştırınız.
-- 
-- 1. auth.users üzerindeki otomatik trigger'ı kaldırır. Google OAuth ile giriş
--    yapıldığında KESİNLİKLE otomatik tenant oluşturulmaz.
-- 2. tenants tablosundaki varsayılan değerleri temizler (50 kredi, pro vb. kaldırılır).
-- 3. Test için daha önce otomatik oluşturulmuş sahte tenant kaydını silme örneği sunar.

-- 1. Otomatik Trigger ve Fonksiyonu İptal Et (DROP)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 2. tenants tablosunda 'pro' ve 50 kredi gibi sahte varsayılanları kaldır
ALTER TABLE IF EXISTS public.tenants 
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE IF EXISTS public.tenants 
  ALTER COLUMN subscription_status SET DEFAULT 'pending';

ALTER TABLE IF EXISTS public.tenants 
  ALTER COLUMN subscription_tier SET DEFAULT 'free_tier';

ALTER TABLE IF EXISTS public.tenants 
  ALTER COLUMN remaining_credits SET DEFAULT 0;

ALTER TABLE IF EXISTS public.tenants 
  ALTER COLUMN total_credits SET DEFAULT 0;

-- 3. Realtime aboneliğinin tenants tablosu için açık olduğundan emin ol
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tenants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================================
-- TEST İÇİN: 
-- Daha önce Google ile giriş yapıp otomatik oluşturulan kaydınızı silerek 
-- doğrudan Onboarding (Firma Bilgileri) formunun açıldığını test etmek için:
--
-- DELETE FROM public.tenants WHERE email = 'test_kullanici@gmail.com';
-- ============================================================================
