# Moderasyon paneli - devam notu (2026-08-22)

Bu is BASLAMADI. Beyin firtinasinin ortasinda duruldu; asagidaki
kararlar KONUSULDU VE ONAYLANDI ama henuz spec yazilmadi, hicbir kod
yazilmadi, veritabanina dokunulmadi.

**Yeni oturum buradan devam etsin.** Sonraki adim: bu kararlara dayanan
spec'i yazmak (`docs/superpowers/specs/`), sonra plan, sonra uygulama.

## Verilen kararlar (kullanicinin onayiyla)

1. **Moderator modeli: yalnizca kullanicinin kendisi, simdilik.** Roller
   tablosu, moderator yonetimi yok. AMA veritabani tarafi ileride
   cok-moderatorlu modele TEMIZ gecilecek sekilde tasarlanacak: her
   aksiyon "kim yapti" bilgisiyle kaydedilsin ki sonradan eklemek
   sema degisikligi gerektirmesin.

2. **Kapsam: tam yonetim konsolu.** Kullanicinin ifadesi: "panelden cok
   kapsamli aksiyon almam gerek, her seye hakim olmam gerek." Yalnizca
   sikayet okuma degil; kullanici ve icerik yonetimi, zorlama
   aksiyonlari ve gozetim dahil.

3. **MESAJ SIKAYETI TAMAMEN KALDIRILIYOR.** Sohbet ekraninda yalnizca
   "kullaniciyi sikayet et" kalacak. Gerekce ve sonuclari asagida
   ("Bugunku kusur" bolumu) - bu karar iki mevcut kusuru birden
   kaynagindan siliyor ve moderatorun ozel mesaj okuma yolunu hic
   acmiyor.

4. **Insa dilimlere bolunecek** ama tasarim butunsel olacak (tek spec,
   dort alan birden dusunulur ki sonradan celiskiye dusmesin).

## Envanter - son hali

`[ILK]` = ilk dilim, `[SONRA]` = sonraki dilim. Kullanici bu listeyi
onayladi ("tam kapsamli olusturabilirsin, baska duzeltme yok").

**Alan 0 - Temel**
- `[ILK]` Yonetici girisi. Panel service-role ile her seyi gorecegi icin
  en guclu koruma gerekiyor (parola + tek kullanimlik kod).
- `[ILK]` Denetim izi: her aksiyon kim/ne/ne zaman.

**Alan 1 - Sikayetler**
- `[ILK]` Baglamiyla listele + filtrele/sirala (durum, tur, tarih, hedef)
- `[ILK]` Sikayet edilen icerigi tam gor (check-in detayi)
- `[ILK]` Karara bagla + moderator notu
- `[ILK]` Hedefin gecmis sikayetleri (tekrar eden suclu)
- `[SONRA]` Sikayet edeni degerlendir (kotu niyetli ihbar sayaci)

**Alan 2 - Kullanicilar**
- `[ILK]` Kullanici ara/gor (profil, check-in gecmisi, baglar, sikayetler)
- `[ILK]` Askiya al (sureli) / yasakla (kalici) / geri al
  ON KOSUL: uygulamaya "askidaki kullanici" kavrami eklenmeli - RLS ve
  giris akisi buna uymazsa panel "askiya aldim" der ama kullanici
  calismaya devam eder.
- `[SONRA]` Profil alani temizle (hakaret iceren kullanici adi/foto)
- `[SONRA]` Hesap sil (KVKK) - geri alinamaz, dikkatli
- `[SONRA]` Pano: canli sayilar (aktif kullanici, bugunku check-in,
  bekleyen sikayet, buyume)

**Alan 3 - Icerik**
- `[ILK]` Check-in / ani gizle veya kaldir
- `[ILK]` Mesaj sikayetini KALDIR (karar 3; ayrinti asagida)
- `[SONRA]` Mekan kaydi kaldir (kotuye kullanim)
- ~~Mesaj kaldir~~ - karar 3 geregi listeden CIKARILDI

## Bugunku kusur: mesaj sikayeti (karar 3 bunu cozuyor)

Kaynaktan dogrulandi. Iki ayri sey birden bozuk:

**Kusur 1 - sikayet veritabanina hic ulasmiyor.** `sikayet_gonder`
RPC'si `'mesaj'` turunu kabul ediyor
(`20260820140113_realtime_ve_mesaj_sikayeti.sql:35`), ama `sikayetler`
tablosunun CHECK kisiti hala Faz 2b'den kalma:
`CHECK (hedef_tur = ANY (ARRAY['kullanici','check_in']))`. Yani insert
`23514` ile patliyor; bugun bir mesaj sikayeti GONDERILEMIYOR.

Testlerden kacma sebebi: Faz 3b'nin "mesaj turu kabul ediliyor" iddiasi
RPC'yi bilerek BOS `sebep` ile cagiriyordu (hata tur kontrolunden degil
sebep kontrolunden gelsin, tabloya satir yazilmasin diye). Zekice ama
insert yoluna hic girmedigi icin CHECK'i hic tetiklemedi.

**Kusur 2 - hangi mesajin sikayet edildigi kayip.** `hedef_id`'ye
KONUSMA id'si yaziliyor (`sohbet/[kullaniciId].tsx:170-171`), mesaj
id'si degil. Diger iki turde o alan sikayet edilen seyin tam kimligi.
Moderator "hangi mesaj?" sorusunu cevaplayamaz.

**Karar 3'un uygulanmasi (ilk dilimde yapilacak is):**
- `sikayet_gonder`'den `'mesaj'` turunu CIKAR (yeni migrasyon; tablonun
  CHECK'ine DOKUNMA - zaten dogru).
- `sohbet/[kullaniciId].tsx`'te `sikayetHedefTur`/`sikayetHedefId`
  ayrimini kaldir; her zaman `hedefTur='kullanici'`,
  `hedefId=kullaniciId`.
- `lib/sikayet.ts`'teki `SikayetHedefTuru` tipinden `'mesaj'`i cikar.
- Ilgili testleri guncelle (Faz 3b'nin "mesaj turu kabul ediliyor"
  iddiasi artik TERSINE donecek: reddedilmeli).
- `docs/faz3b-takip-isleri.md` madde 1b (mesaj sikayetinde hedef_id
  konusma id'si) bu kararla KAPANIYOR - o maddeyi kapandi diye isaretle.

## Konusulmayan, spec yazilirken karara baglanacaklar

- Panelin teknolojisi ve nerede barinacagi (ayri web uygulamasi mi,
  Supabase uzerinde mi, yerelde mi calisacak).
- Yonetici kimlik dogrulamasinin somut bicimi.
- "Askidaki kullanici" kavraminin uygulamada nasil zorlanacagi (RLS mi,
  giris akisi mi, ikisi de).
- Denetim izinin semasi.
