# Bildirimler - plan (2026-08-21)

Spec: `docs/superpowers/specs/2026-08-21-bildirimler-design.md`

## Global Constraints

- Turkce metin; kodda/yorumlarda/belgelerde Turkce aksanli harf YOK
  (duz ASCII). Em dash U+2014 ve tipografik kesme U+2019 yasak.
  Dosyalar UTF-8 BOM'suz.
- Uygulanmis migrasyon dosyasi duzenlenmez; duzeltme yeni dosyayla.
- Her `public` security definer fonksiyon: `set search_path = public`,
  ilk satirda `auth.uid() is null` kontrolu, `revoke execute ... from
  public, anon` + `grant execute ... to authenticated`.
- Yeni tabloda authenticated'dan insert/update/delete geri alinir;
  yazma RPC uzerinden.
- Test dosyalari `mobil/src/app` altina konmaz; ekran testleri
  `mobil/__tests__/ekranlar/`.
- `@testing-library/react-native` 14.0.1: render() ve fireEvent
  ASENKRON, await sart.
- Tam Jest paketi `npx jest --runInBand`; taban 39 paket / 295 test.
  `npx tsc --noEmit` taban tam 5 hata; artmamali.
- `npm run test:gorunurluk -- --tavan` CALISTIRILMAZ.
- Commit'ler yerel; push faz sonunda.

## Gorevler

### Task 1: Jeton tablosu ve RPC'ler
Migrasyon: `bildirim_jetonlari` tablosu (kullanici_id uuid ref
auth.users on delete cascade, jeton text, platform text check
('ios','android'), guncellendi timestamptz default now(), primary key
(kullanici_id, jeton), jeton'a benzersiz indeks - ayni jeton tek
kullanicida). RLS: yalnizca kendi satirlarini select. Iki RPC:
`jeton_kaydet(p_jeton, p_platform)` - once ayni jetonu baska
kullanicidan siler, sonra upsert; `jeton_sil(p_jeton)` - yalnizca kendi
satirini siler. Kisit kaliplari birebir. test:sema'ya dogrulamalar.

### Task 2: Vault siri ve tetikleyiciler
Vault'a `bildirim_siri` konur (guclu rastgele deger; degeri commit'e
GIRMEZ, migrasyon vault.create_secret'i cagirmaz - sir elle/MCP ile
konur, migrasyon yalnizca okuyan fonksiyonu kurar). Ozel semada
`bildirim.olay_gonder()` trigger fonksiyonu: pg_net ile Edge Function
adresine POST, basliga Vault'tan okunan sir. Tetikleyiciler: mesajlar
INSERT; takipler INSERT (durum='beklemede'); takipler UPDATE
(beklemede->kabul); sohbet_istekleri INSERT (beklemede) ve UPDATE
(beklemede->kabul). Not: takip kabulunde ayna satir INSERT'i (kabul)
ikinci bildirim URETMEMELI - yalnizca beklemede->kabul UPDATE'i sayilir.

### Task 3: Edge Function "bildirim-gonder"
Deno/TS. Siri dogrular; payload'dan tablo+tip+satiri okur; aliciyi
cikarir (mesaj: konusmanin diger uyesi; istek: hedef; kabul: istegi
gonderen); gonderen adini profiller'den okur; alicinin jetonlarini
ceker; Expo Push API'ye toplu POST; "DeviceNotRegistered" jetonlarini
siler. Dort metin kalibi (icerik yok, yalnizca ad). `--no-verify-jwt`
ile deploy; sir dogrulamasi fonksiyon icinde.

### Task 4: Istemci modulu lib/bildirim.ts + giris kancasi
expo-notifications kurulumu (SDK 57 uyumlu surum). Modul: izin iste,
jeton al, jeton_kaydet cagir; cikista jeton_sil; bildirime dokununca
yonlendirme (data.tur'e gore /sohbet/[kullaniciId] ya da /baglar).
Girise baglama: oturum acildiginda kayit. Web'de sessizce atla
(Platform.OS === 'web'). Jest testleri mock'la.

### Task 5: Canli sunucu dogrulamasi + kapanis
Sahte jetonla jeton_kaydet; test hesabiyla gercek mesaj_gonder;
Edge Function loglarinda Expo API cagrisini gor; DeviceNotRegistered
temizliginin calistigini dogrula. Dort kosum (jest/sema/gorunurluk/tsc)
taban degerlerde. CLAUDE.md + konusma gunlugu guncelle; cihaz borcu
acikca yazilir. Push.
