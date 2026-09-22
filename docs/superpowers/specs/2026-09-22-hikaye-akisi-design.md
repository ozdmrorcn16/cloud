# Hikaye akisi (2026-09-22)

Kullanicinin istegi: "Ana sayfaya Instagram gibi hikaye ekleme akisi da
ekle." Kapsam kullaniciyla netlestirildi (sikayet dahil, "dediklerinin
hepsini yap"). Taslak: `tasarim/hikaye/taslak.png`.

## Kararlar

| Konu | Karar |
|---|---|
| Icerik | TEK fotograf (kamera/galeri) + istege bagli yazi (<= 200) + istege bagli MEKAN etiketi (aktif check-in varsa otomatik onerilir). Video yok. |
| Omur | 24 saat. Saatlik cron: suresi dolan satir VE kova dosyasi silinir (arsiv yok). |
| Gorunurluk | Check-in'lerle ayni: sahibi + arkadaslar (`takipler` durum 'kabul'); engelleme iki yonlu (`gizli.engelli_mi`); moderasyonla gizlenen kimseye gorunmez. |
| Kisi basina | En fazla 10 aktif hikaye. |
| Ana sayfa | Marka basliginin altinda yatay serit: ilk daire "Hikayen" (yoksa kesikli halka + artik; varsa acar, artik ekler), sonra arkadaslar; gorulmemis turuncu halka, gorulmus gri; gorulmemisler once, sonra en yeni. |
| Izleyici | Tam ekran rota `/hikaye/izle?kullanici=<id>`; ustte kisi basina ilerleme cubuklari, 5 sn otomatik, sag/sol dokunus ileri/geri, basili tut durdur, asagi surukle kapat; kisi bitince sonraki kisi, son kisi bitince kapanir. |
| Goruntuleme | `hikaye_goruntulemeler` (hikaye, kullanici, zaman); yalnizca sahibi "N kisi gordu" + listeyi gorur. Sahip kendi hikayesini izleyince kayit yok. |
| Yanit | Baskasinin hikayesinde altta "Mesaj gonder": mevcut `mesaj_gonder` RPC'siyle sohbete mesaj ("Hikayene yanit: ..." on ekiyle). Mesaj izni kurallari aynen. |
| Silme | Sahibi kendi hikayesini izleyiciden siler (uc nokta -> Sil -> onay). |
| Sikayet | `sikayet_gonder` hedef 'hikaye' (yalnizca goren sikayet edebilir, kendi hikayesi olamaz); mevcut sikayet ekrani. Panelde hedef 'Hikaye' (fotograf + yazi + mekan + sahibi), "Hikayeyi gizle" / "Gizlemeyi kaldir" (moderasyon_gizli; denetim izine yazilir). Sikayet aninda gizlemez (check-in ile ayni; yorumdaki ani gizleme kurali hikayeye tasinmadi). |
| Push | Yok. |
| KVKK | Yeni veri: hikaye fotografi/yazisi (24 saat), goruntuleme kaydi (kim, ne zaman; hikayeyle birlikte silinir). Gizlilik metnine "Hikayeler" maddesi 7 dil; KVKK listesi; `verilerimi_disa_aktar` `hikayelerim` + `hikaye_goruntulemelerim`. |

## Sunucu (migrasyon `20260922150000_hikayeler.sql`)

- `public.hikayeler(id, kullanici_id, fotograf, yazi, mekan_id, olusturuldu, bitis, moderasyon_gizli)`; indeks `(kullanici_id, bitis)`, `(bitis)`.
- `public.hikaye_goruntulemeler(hikaye_id, kullanici_id, goruldu)` PK (hikaye_id, kullanici_id).
- RLS hikayeler SELECT: `bitis > now() and not moderasyon_gizli and not gizli.engelli_mi(kullanici_id) and (kullanici_id = auth.uid() or arkadas)`. Yazma yalnizca RPC.
- RLS goruntulemeler SELECT: kendi satirlarim VEYA hikaye benim. INSERT yalnizca RPC.
- Kova `hikaye-medyalari` (private, 10 MB, jpeg/png/webp): INSERT kendi klasoru; SELECT kendi klasoru VEYA `exists (hikayeler h where h.fotograf = name)` (hikayeler RLS'i icinde uygulanir) VEYA moderator; DELETE kendi klasoru.
- RPC'ler (hepsi revoke anon):
  - `hikaye_ekle(p_fotograf, p_yazi, p_mekan_id) returns hikayeler` - aktif hesap, yol `<uid>/...`, yazi <= 200, aktif hikaye < 10.
  - `hikaye_akisi() returns table(...)` security invoker: gorunur hikayeler + `gordum` + `goruntulenme_sayisi` (yalnizca sahibiyse, degilse 0) + mekan adi.
  - `hikaye_goruntulendi(p_hikaye_id)` security definer: hikaye gorunur mu (RLS'i taklit: arkadas/engel) ve sahibi degilse `insert ... on conflict do nothing`.
  - `hikaye_goruntuleyenler(p_hikaye_id) returns table(kullanici_id, goruldu)` yalnizca sahibi.
  - `hikaye_sil(p_hikaye_id) returns text` (fotograf yolu; istemci kovadan siler) yalnizca sahibi.
  - `moderasyon_hikayeyi_gizle(p_hikaye_id, p_gerekce)`, `moderasyon_hikaye_gizlemeyi_kaldir(...)`; `moderasyon_sikayet_detayi` hikaye kolu; `sikayet_gonder` 'hikaye' hedefi; `sikayetler_hedef_tur_check` genisler.
- Cron `hikaye-suresi-dolanlari-sil` saatlik: once storage.objects satirlari (mevcut `veri-disa-aktarim-buda` deseni), sonra hikayeler.
- `verilerimi_disa_aktar`: `hikayelerim`, `hikaye_goruntulemelerim` (kimi izledigim degil - kimin izledigi; kisinin kendi verisi = kendi hikayelerinin izlenmeleri kullanici adiyla).

## Istemci

- `lib/hikaye.ts`: `hikayeAkisiniGetir()` -> `HikayeGrubu[]` (kullanici + hikayeler, imzali adresler toplu `createSignedUrls`), `hikayeEkle`, `hikayeGoruntulendi`, `hikayeGoruntuleyenleriGetir`, `hikayeSil`, `hikayeyeYanitVer`.
- `src/tasarim/HikayeSeridi.tsx` (ana sayfa `ListHeaderComponent` icinde, SuAnDisarida'nin ustunde).
- `src/app/hikaye/ekle.tsx` (kaynak secimi -> onizleme -> yazi/mekan -> Paylas).
- `src/app/hikaye/izle.tsx` (izleyici; alt gezinme gizli; `Animated` ilerleme; `Gesture.Pan` dikey kapatma; uc nokta menusu: Sil / Sikayet et).
- `src/tasarim/KisiListesiSayfasi.tsx` (BegenenlerSayfasi'ndan genellendi): begenenler + goruntuleyenler.
- Sikayet ekrani: `hedefTur=hikaye` (alt baslik metni).
- Panel: `Durum.tsx` HEDEF hikaye; `SikayetDetayi.tsx` hikaye blogu + iki eylem.

## Test

- Jest: lib/hikaye, HikayeSeridi, ekle, izle (ilerleme/dokunus/kapat/yanit/sil/menu), ana sayfa serit, KisiListesiSayfasi.
- Canli: `araclar/hikaye-canli-test.py` (ekle, arkadas gorur / yabanci gormez, goruntuleme kaydi ve sayaci, 10 siniri, sikayet, moderator gizleme sonrasi gorunmez, sil -> dosya gider).
- test:sema (yeni tablolar/RPC/kova), deno yok (EF degismedi).
