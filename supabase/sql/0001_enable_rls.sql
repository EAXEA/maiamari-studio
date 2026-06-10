-- MAIAMARI.STUDIO — Row Level Security (defense-in-depth)
-- =========================================================
-- NEDEN: Uygulama tüm veriye SUNUCU tarafından `DATABASE_URL` (tam yetkili
-- Postgres rolü) ile erişir; bu rol RLS'i zaten bypass eder, dolayısıyla site
-- bu politikalardan ETKİLENMEZ ve çalışmaya aynen devam eder.
--
-- Bu dosyanın amacı Supabase'in varsayılan olarak açtığı PostgREST/Data API
-- yüzeyini (https://<ref>.supabase.co/rest/v1/ — anon/authenticated rolleriyle)
-- kapatmaktır. RLS açık ve hiçbir policy tanımlı DEĞİLSE, anon/authenticated
-- rollerine erişim tamamen reddedilir (deny-by-default). Böylece anon key sızsa
-- bile tablolar REST üzerinden okunamaz/yazılamaz.
--
-- NASIL ÇALIŞTIRILIR: Supabase Dashboard → SQL Editor → bu dosyayı yapıştır → Run.
-- (Tek seferlik; idempotent — tekrar çalıştırmak güvenlidir.)
--
-- EK ÖNERİ: Dashboard → Project Settings → API'den anon key'i ROTATE et ve
-- Data API (PostgREST) kullanılmadığı için kapatmayı/kısıtlamayı değerlendir.

alter table public.products              enable row level security;
alter table public.categories           enable row level security;
alter table public.artists              enable row level security;
alter table public.series               enable row level security;
alter table public.journal              enable row level security;
alter table public.workshops            enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;

-- Bilinçli olarak HİÇBİR policy tanımlanmadı: anon/authenticated rolleri için
-- erişim tümüyle kapalı. Uygulama owner/service rolüyle bağlandığından etkilenmez.
-- Eğer ileride client-side (anon key ile) public okuma gerekirse, yalnız okunması
-- gereken tablolara açık bir SELECT policy eklenir, örn:
--   create policy "public read products" on public.products
--     for select to anon using (is_published = true);
