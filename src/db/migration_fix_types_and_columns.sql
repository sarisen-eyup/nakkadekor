-- ============================================================================
-- NAKKA FRAME STUDIO - VERİ TİPİ VE SÜTUN MİGRASYONU
-- Bu betiği Supabase Dashboard -> SQL Editor alanında çalıştırabilirsiniz.
-- ============================================================================

-- 1. QUOTES_ORDERS Tablosuna delivery_date_str Sütununun Eklenmesi (PGRST204 Çözümü)
ALTER TABLE IF EXISTS public.quotes_orders 
ADD COLUMN IF NOT EXISTS delivery_date_str VARCHAR(100);

-- 2. VISUALIZATIONS Tablosundaki Foreign Key Kısıtlamasını Kaldırmak İsterseniz (Opsiyonel / Tam Esneklik):
-- Bu komut, henüz tabloda olmayan bir çerçeve ID'si gelse bile görsel kaydetmenin ASLA 409 Foreign Key hatası vermemesini sağlar:
ALTER TABLE IF EXISTS public.visualizations 
  DROP CONSTRAINT IF EXISTS visualizations_inner_frame_profile_id_fkey;

-- 3. FRAME_PROFILES ve VISUALIZATIONS için TEXT ID Desteği (Opsiyonel / Esnek ID Desteği)
-- Eğer Supabase tablolarında 'default-av-501' veya 'prof_123' gibi metinsel ID'ler saklamak isterseniz:
DO $$
BEGIN
  -- Foreign key kısıtlamasını geçici olarak kaldır
  ALTER TABLE IF EXISTS public.visualizations 
    DROP CONSTRAINT IF EXISTS visualizations_inner_frame_profile_id_fkey;

  -- frame_profiles tablosunun id tipini TEXT'e dönüştür
  ALTER TABLE IF EXISTS public.frame_profiles 
    ALTER COLUMN id TYPE TEXT;

  -- visualizations tablosundaki ilişkili sütunları TEXT'e dönüştür
  ALTER TABLE IF EXISTS public.visualizations 
    ALTER COLUMN id TYPE TEXT,
    ALTER COLUMN inner_frame_profile_id TYPE TEXT;

  -- Foreign key ilişkisini yeniden bağla (TEXT tipinde)
  ALTER TABLE IF EXISTS public.visualizations 
    ADD CONSTRAINT visualizations_inner_frame_profile_id_fkey 
    FOREIGN KEY (inner_frame_profile_id) 
    REFERENCES public.frame_profiles(id) 
    ON DELETE SET NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration step notice: %', SQLERRM;
END $$;

-- Schema cache'i yenile
NOTIFY pgrst, 'reload schema';
