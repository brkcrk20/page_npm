-- ============================================================================
-- 0046 — İletişim mesajları
--
-- İletişim sayfasında kendi kendine çözüm bağlantıları ve ilan bildirimi
-- uyarısı vardı ama MESAJ GÖNDERİLECEK BİR YER YOKTU. Ayarlardaki e-posta ve
-- telefon boş olduğu için sayfa "iletişim bilgileri henüz yayınlanmadı"
-- diyordu; yani iletişim sayfasına gelen kullanıcının elinde tek bir kanal
-- bile kalmıyordu.
--
-- E-POSTA SAĞLAYICISI YOK, YİNE DE ÇALIŞIYOR
-- Mesajlar veritabanına yazılıyor ve yönetim panelinde görünüyor. Sağlayıcı
-- bağlandığında aynı satırlar bildirime kaynaklık edecek. "Gönderdim" deyip
-- hiçbir yere yazmayan bir form, formun hiç olmamasından kötü olurdu —
-- kullanıcı ulaştığını sanıp beklerdi.
-- ============================================================================

create type public.contact_status as enum ('yeni', 'okundu', 'yanitlandi', 'kapatildi');

create table public.contact_messages (
  id         bigint generated always as identity primary key,

  -- Giriş yapmışsa kim olduğu; yapmamışsa null.
  user_id    uuid references public.profiles(id) on delete set null,

  name       text not null check (char_length(btrim(name)) between 2 and 100),
  email      text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject    text not null check (char_length(btrim(subject)) between 2 and 120),
  message    text not null check (char_length(btrim(message)) between 10 and 4000),

  -- İlan bildirimi ise hangi ilan. Şikayet akışı ayrı (listing_reports);
  -- bu alan "ilanla ilgili yazdım" diyen serbest mesajlar için.
  listing_id bigint references public.listings(id) on delete set null,

  status     public.contact_status not null default 'yeni',
  admin_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Muhafız: durum ve sahiplik istemciden gelmesin, sel baskını olmasın
--
-- Form herkese açık; giriş istemek, hesabına giremeyen kullanıcının
-- ("şifremi sıfırlayamıyorum") yazamaması demek olurdu — tam da yazması
-- gereken kişi. Açık form ise otomatik gönderime davetiye çıkarır, o yüzden
-- aynı e-postadan saatte üç mesajla sınırlı.
-- ---------------------------------------------------------------------------
create or replace function public.contact_messages_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_son_saat integer;
begin
  if tg_op = 'UPDATE' then
    if public.guard_bypass() then
      return new;
    end if;
    -- Yönetici olmayan hiç kimse mesajı değiştiremez.
    raise exception 'Bu kaydı değiştiremezsiniz.' using errcode = '42501';
  end if;

  new.status     := 'yeni';
  new.admin_note := null;
  new.created_at := now();
  -- Giriş yapmışsa kimliği sunucudan; istemcinin yazdığı değer yok sayılıyor.
  new.user_id    := auth.uid();

  if not public.guard_bypass() then
    select count(*) into v_son_saat
      from public.contact_messages m
     where lower(m.email) = lower(new.email)
       and m.created_at > now() - interval '1 hour';

    if v_son_saat >= 3 then
      raise exception 'Kısa sürede çok fazla mesaj gönderdiniz. Lütfen bir süre sonra tekrar deneyin.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists contact_messages_guard_trigger on public.contact_messages;
create trigger contact_messages_guard_trigger
  before insert or update on public.contact_messages
  for each row execute function public.contact_messages_guard();

-- ---------------------------------------------------------------------------
-- RLS
--
-- Yazma herkese açık, OKUMA YALNIZCA YÖNETİCİYE. Gönderenin kendi mesajını
-- geri okuması gerekmiyor; okuma açılsaydı e-posta adresi bilen herkes
-- başkasının mesajını görebilirdi.
-- ---------------------------------------------------------------------------
alter table public.contact_messages enable row level security;

create policy contact_messages_insert_any on public.contact_messages
  for insert with check (true);
create policy contact_messages_admin on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;
