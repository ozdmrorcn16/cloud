---
name: slooin-tasarim
description: Slooin mobil uygulamasinda ekran tasarlarken ya da mevcut bir ekrani gorsel kimlige tasirken kullanilir. Kimlik jetonlarini, renk ve yazi kurallarini, bilesen desenlerini ve daha once verilmis tasarim kararlarini tasir.
---

# Slooin tasarim

Slooin konum tabanli bir sosyal uygulama: kullanici bulundugu yere
check-in yapar ve tam o anda orada olan diger insanlari gorur. Hedef
kitle 18+. Uygulamanin tek sorusu sudur: **"su an nerede insan var?"**
Her tasarim karari bu soruya hizmet etmeli.

Bu beceri devreye girdiginde once `mobil/src/tasarim/tema.ts` dosyasini
oku - jetonlarin tek kaynagi orasidir, buradaki degerler ozettir.

## Degismez kurallar

Bunlar kullanicinin verdigi kararlardir; tasarim tercihi degil kisittir.

1. **Turuncu YALNIZCA eylem ve canlilik icin.** Bir sey turuncuysa ya
   tiklanabilir ya da "su an oluyor" demektir. Dekorasyon icin turuncu
   kullanmak kimligi tuketir. Bir ekranda genelde TEK birincil turuncu
   eylem olur.
2. **EKRAN METINLERI KODA GOMULMEZ.** Uygulama cok dilli (2026-08-24).
   Kullaniciya gorunen her metin `mobil/lib/ceviriler/tr.ts` icine
   yazilir, `en.ts` icine cevrilir ve ekranda `const { t } = useDil()`
   ile `t('ekran.anahtar')` seklinde kullanilir. Anahtarlar ekran adiyla
   gruplanir. Yeni bir ekran yapiyorsan metinleri once sozluge yaz.
   Dil adlari (`Türkçe`, `English`) CEVRILMEZ - `DIL_ADI` sabitinde
   durur. Testler `jest.setup.js` icindeki mock uzerinden GERCEK Turkce
   sozlugu gorur, yani testlerde hala asil metin aranir.
3. **Ekran metinleri duzgun Turkce yazilir** (karar 74): aksanli, tam
   karakterlerle. "Sikayet" degil "Şikâyet"... ama duzeltme isaretli
   harflere GIRILMEZ: "mekan" ve "sikayet" kelimelerinde yalnizca
   c, g, i, o, s, u aksanlari kullanilir. ASCII kurali yalnizca kod,
   yorum ve commit metinleri icindir.
4. **Toplu dize degistirme kod tanimlayicilarina tasar.** Metinleri
   Turkceye cevirirken bir kez `kullaniciAdiniNormallestir` fonksiyon
   adinin ici bozuldu ve uygulama calismaz hale geldi. Boyle bir
   degisiklikten sonra, dize sabitleri DISINDA aksanli harf arayan bir
   tarama mutlaka kosulmali.
5. **Mekanlarin fotografi yok.** Dis kaynaktan gorsel cekme iptal
   edildi (telif, kapsam, API bagimliligi). Check-in fotografi da kapak
   olamaz: kisi kendi yuzunu yukleyebilir. Gercek fotograflar YALNIZCA
   anilarda.
6. **Dis kaynakli mekanlarda TUR GOSTERILMEZ** (karar 2026-08-24).
   Yalnizca ad ve semt gorunur. Tur, kullanicinin kendi ekledigi
   mekanlarda gosterilir. Kural tek yerde: `lib/mekan.ts` icindeki
   `turuGosterilir()`. Tur ikonlari da bu kararla birlikte ekrandan
   kaldirildi.
7. **Onaylar TEK yerde toplanir.** Kullanici birden fazla onay kutusu
   istemiyor (karar 2026-08-24). Uyum, onay sayisini artirarak degil
   metnin kapsayici olmasi ve onayin kayit altina alinmasiyla saglanir:
   kayit ekranindaki tek kutu, veritabanina iki onay turu birden yazar.
8. **Gizlilik ve KVKK her adimda gozetilir.** Bir ekran kisisel veriye
   dokunuyorsa (konum, ozel mesaj), aydinlatma o ekranin icinde durur -
   ayri bir "sonra" maddesine kaymaz.

## Marka isareti

Logo (2026-08-25) tek isarette uc sey soyluyor: bir KONUM IGNESI,
icinde IKI INSAN ve bir KONUSMA BALONU - "burada birileri var ve
konusuyorlar". Kaynak: `tasarim/slooin-logo-kaynak.png`.

Ekranda `<MarkaIsareti zemin="acik|koyu" boyut={96} />` ile kullanilir.
Isaret ZEMINE GORE uyarlanir (kullanicinin karari):

| Zemin | Igne / balon | Siyah figur |
|---|---|---|
| `acik` (sayfa zemini #FAF7F3) | turuncu | **degismez** |
| `koyu` (turuncu ya da koyu yuzey) | beyaz | **degismez** |

**Siyah figur SABITTIR** - kullanici bunu ayrica duzeltti. Zemine gore
degisen tek sey logonun BEYAZ ogeleridir; onlar acik zeminde
kayboldugu icin turuncuya doner. Siyah figur markanin sabit unsuru ve
her iki zeminde de okunuyor.

Uygulama simgesi (`icon.png`, ana ekranda gorunen) logonun ORIJINAL
hali kalir: turuncu zemin uzerinde beyaz + siyah. Ona uyarlama
uygulanmaz.

Ikonlari yeniden uretmek gerekirse maskeleme olcutu "beyaz mi" DEGIL,
"zemin turuncusuna uzak mi" olmalidir - parlakliga bakan bir esik
siyah figuru eleyip isareti yarim birakir.

## Jetonlar

Degerler `mobil/src/tasarim/tema.ts` dosyasindan gelir. Ekranlarda ham
renk kodu ya da ham piksel YAZILMAZ; jeton kullanilir.

**Renk**
| Jeton | Deger | Kullanim |
|---|---|---|
| `renk.turuncu` | `#FE7813` | Birincil eylem, canlilik. Logodan OLCULEN ton |
| `renk.turuncuKoyu` | `#E06509` | Basili hal |
| `renk.turuncuZemin` | `#FFF3E8` | Secili satir, rozet arkasi |
| `renk.metin` | `#17130F` | Ana metin (saf siyah degil) |
| `renk.metinIkincil` | `#6E6660` | Aciklama, zaman damgasi |
| `renk.metinSoluk` | `#A39B93` | Yer tutucu, pasif |
| `renk.zemin` | `#FAF7F3` | Sayfa zemini (sicak beyaz) |
| `renk.yuzey` | `#FFFFFF` | Kart, yuzer yuzey |
| `renk.cizgi` | `#EFEAE5` | Ayirici, kenarlik |

**Yazi**
- Baslik: `BricolageGrotesque_600SemiBold` / `_700Bold` - karakterli,
  olculu kullanilir. Baslik boyutlarinda `letterSpacing` negatif
  (-0.6 / -0.8) verilir, yoksa dagilir.
- Govde: `InstrumentSans_400Regular` / `_500Medium` / `_600SemiBold`.
- Olcek: `olcek.dev 56` / `baslik 24` / `altBaslik 18` / `govde 15` /
  `kucuk 13` / `minik 11`.

**Bosluk** `xs 4 / s 8 / m 12 / l 16 / xl 24 / xxl 32`
**Yuvarlaklik** `kart 16 / buyuk 20 / hap 999`
**Golge** `golge.yuzer` (gezinme, birincil buton), `golge.kart`

Yazi tipleri `_layout.tsx` icinde `useFonts` ile yukleniyor ve
yuklenmeden ekran cizilmiyor - sistem fontuyla bir kare cizip marka
fontuna atlamak gorunur bir sicrama uretiyordu.

## Bilesen desenleri

**Birincil eylem**: turuncu zemin, `yuvarlak.hap`, `paddingVertical`
16-17, beyaz `govdeKalin` yazi, `golge.yuzer`. Basili halde
`turuncuKoyu`. Ekranda tek tane.

**Ikincil eylem**: zeminsiz, yalnizca metin. Vurgulu kelime
`govdeKalin` + `renk.metin`.

**Liste satiri**: `renk.yuzey` zemin, altta `renk.cizgi` ayirici. Ust
satir ad (`govdeOrta`, `olcek.govde`), alt satir baglam
(`renk.metinIkincil`, `olcek.kucuk`), parcalar ` · ` ile birlesir ve
bos olanlar once elenir (`filter(Boolean).join(' · ')`).

**Canlilik rozeti**: turuncu nokta + sayi. "3 kişi burada". Canlilik
turuncunun mesru kullanimidir.

**Bos ve hatali durum**: yon verir, yalnizca hata metni basmaz. Bir
baslik, ne yapilacagini soyleyen bir cumle ve bir eylem butonu.
Hatalar ozur dilemez ve ne oldugu konusunda belirsiz kalmaz.

## Ekran duzeni tuzagi - ONEMLI

Bir ekranin YUKLEME ya da HATA durumunda `return` ile tamamen baska bir
agac cizmesi, o ekrandaki `TextInput`'u agactan kaldirir; klavye
kapanir ve kullanici yazamaz. Bu gercek bir hata olarak yasandi
(kesfet ekraninda arama).

Kural: **tam ekran durumlar yalnizca ILK acilista.** Sonrasinda ekran
duzeni sabit kalir, durum kucuk bir seritle anlatilir. Ayrica arama
alanlari bekletmeli (300 ms) olmali ve gec donen istekler sira
numarasiyla yok sayilmali.

## Erisilebilirlik tabani

- Hareket: `AccessibilityInfo.isReduceMotionEnabled()` dinlenir;
  kapaliysa animasyon hic baslamaz.
- Dokunma hedefleri en az 44 pt.
- `accessibilityRole` verilir (`button`, `header`).
- Renk tek basina anlam tasimaz; canlilik rozetinde renk + yazi birlikte.

## Hareket

Ekranda genelde TEK hareketli oge olur ve o da bir sey anlatir.
Dagitilmis efektler tasarimi yapay gosterir. Karsilama ekranindaki
nabiz atan nokta buna ornektir: markanin noktasi ile urunun vaadi
("su an burada biri var") ayni ogede birlesir.

## Ekranlarin durumu (2026-08-25)

Kimlige tasinmis: `(auth)/karsilama`, `(auth)/giris`, `(auth)/kayit`,
`mekanlar/index` (kesfet), `kisiler`, `mesajlar`.

SIRADAKI: profil sekmesi. Alt gezinmedeki "Profil" su an dogrudan
`/profil/anilar`a gidiyor cunku bir profil ANA ekrani yok; Instagram ve
Swarm'da o sekme kisinin kendi profilini gosterir (fotograf, kullanici
adi, anilar, ayarlara giris).

Kalan eski stildeki ekranlar: `baglar`, `mekanlar/[id]`,
`mekanlar/ekle`, `check-in/[mekanId]`, `kullanici/[id]`,
`sohbet/[kullaniciId]`, `profil/anilar`, `profil/ayarlar`,
`profil/hesabi-sil`, `sikayet`, `gizlilik`, `hesap-durumu`,
`profil-olustur`, `(auth)/dogrula`.

Eski `src/app/index.tsx` (ana ekran menusu) artik gereksiz - gezinme
alt cubuktan yapiliyor.

## Alt gezinme cubugu

`src/tasarim/AltGezinme.tsx`. Yuzer, dort sekme, okunmamis rozetli.
Ekrana su desenle eklenir:

```tsx
<View style={stiller.kok}>
  <ScrollView contentContainerStyle={{ paddingBottom: ALT_GEZINME_PAYI }}>…</ScrollView>
  <AltGezinme />
</View>
```

Testlerde `jest.setup.js` icinde global mock'lu; yeni ekran testinde
ayrica bir sey yapmaya gerek yok.

## Marka: kelime markasi ve isaret AYRI

| Varlik | Bilesen | Nerede |
|---|---|---|
| Kelime markasi | `MarkaYazisi` | Giris, karsilama, basliklar |
| Isaret (konum ignesi) | `MarkaIsareti` | Uygulama simgesi, kucuk yerler |

Kelime markasi SIMGE OLAMAZ (en/boy 3.4). `MarkaYazisi` icindeki oran
koda gomulu; gorsel degisirse o sabit de degismeli.

## Ekran goruntusu araci

`mobil/araclar/ekran-goruntusu.mjs` - tasarimi gozle dogrulamanin tek
guvenilir yolu. Chrome'un `--screenshot` bayragi Windows'ta yanlis
teshis uretiyor (asgari pencere genisligi yuzunden sahte "sag kenar
tasmasi"). Ayrinti ve kullanim: CLAUDE.md.

## Calisma bicimi

Kullanicinin kurali: sayfa sayfa, talimatla. Bir ekran bitince
siradakine KENDILIGINDEN GECILMEZ - hangi sayfaya gecilecegi sorulur.
Her adim ekran goruntusuyle gosterilir.

Metinler su an YALNIZCA `tr.ts` icine yaziliyor; diger diller tasarim
bitince toplu eklenecek.

Kanvas calisma dosyalari `tasarim/slooin-kanvas/` altinda; jetonlarin
kaynagi orasidir ama uygulamada dogru yer `tema.ts`.

## Once sunu yap

Yeni bir ekran tasarlarken once genel gorsel tasarim ilkelerini oku:
`.claude/skills/frontend-design/SKILL.md`. O beceri "sablon gibi
gorunmeyen, kendine ozgu tasarim" icin genel yontemi verir; bu beceri
ise Slooin'in kisitlarini. Ikisi birlikte kullanilir: genel yontem
serbest eksenleri doldurur, buradaki kisitlar baglayicidir.
