-- ============================================================================
-- MİGRASYON: Google Login ve Yeni Kayıtlarda 'pending' Statüsü Garantisi
-- ============================================================================
-- Bu SQL dosyasını Supabase SQL Editöründe çalıştırarak:
-- 1. auth.users tetikleyicisini (trigger) güncelleyip yeni kullanıcıların
--    tenants tablosuna AÇIKÇA status: 'pending' ile kaydedilmesini sağlarsınız.
-- 2. Mevcut test kullanıcınızı yeniden 'pending' durumuna alarak bekleme ekranını test edebilirsiniz.

-- 1. Tenants tablosunun varsayılan status değerini 'pending' yap
ALTER TABLE IF EXISTS public.tenants 
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE IF EXISTS public.users 
  ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Yeni Kullanıcı Oluştuğunda Tetiklenen Fonksiyonu Güncelle
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

  -- 1. Atölye / Tenant Kaydı (AÇIKÇA status: 'pending')
  INSERT INTO public.tenants (
    id, 
    name, 
    slug, 
    subscription_status, 
    status, 
    subscription_plan_id, 
    subscription_tier, 
    remaining_credits, 
    total_credits, 
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    _full_name || ' Çerçeve Atölyesi',
    _slug,
    'pending',
    'pending',            -- AÇIKÇA 'pending' statüsü
    'pay_as_you_go',
    'free_tier',
    0,
    0,
    NEW.email,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Varsayılan Atölye Fiyatlandırma Ayarları
  INSERT INTO public.tenant_settings (tenant_id, updated_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (tenant_id) DO NOTHING;

  -- 3. Kullanıcı Profili Kaydı (AÇIKÇA status: 'pending')
  INSERT INTO public.users (
    id, 
    auth_user_id, 
    tenant_id, 
    full_name, 
    username, 
    email, 
    role, 
    status, 
    is_email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.id,
    _full_name,
    LOWER(REPLACE(_slug, '-', '_')),
    COALESCE(NEW.email, ''),
    'owner',
    'pending',            -- AÇIKÇA 'pending' statüsü
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tetikleyiciyi Yeniden Tanımla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Supabase Realtime Replikasyonunun Tenants Tablosu İçin Açık Olduğundan Emin Ol
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
    -- Yayın zaten mevcutsa devam et
    NULL;
END $$;

-- ============================================================================
-- TEST İÇİN: Eğer daha önce giriş yapıp 'active' olmuş hesabınızı
-- hemen 'pending' durumuna geri çekmek isterseniz aşağıdaki komutu çalıştırabilirsiniz:
--
-- UPDATE public.tenants SET status = 'pending' WHERE email = 'ornek_hesap@gmail.com';
-- ============================================================================
