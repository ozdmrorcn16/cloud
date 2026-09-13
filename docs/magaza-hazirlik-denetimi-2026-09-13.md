# Magaza hazirlik denetimi - 2026-09-13

Yontem: **nota degil canliya soruldu.** Her madde yayindaki adresten
olculdu; depodaki kaynak ya da CLAUDE.md'deki kayit kanit sayilmadi.

Denetim SALT OKUR - hicbir sey degistirilmedi. Bulgularin duzeltmesi
bekliyor, cunku hukuki metin dosyalarinda o sirada paralel bir oturum
calisiyordu.

---

## Bulgu 1 (KRITIK) - Cloudflare butun e-posta adreslerini gizliyor

Yayindaki gizlilik politikasi sunu yaziyor:

> KVKK kapsamindaki basvurularini **[email protected]** adresine
> iletebilirsin; basvurun en gec 30 gun icinde yanitlanir.

`destek@slooin.com` sunulan HTML'de **SIFIR kez** geciyor. Cloudflare'in
Scrape Shield / "Email Address Obfuscation" ozelligi adresi sunum
aninda `[email protected]` ile degistirip yanina bir JavaScript
cozucu koyuyor.

Olculen izler (`/gizlilik/` ham HTML'inde):

```
cdn-cgi/l/email-protection : 3
data-cfemail               : 2
email-decode               : 1
destek@slooin.com          : 0
```

**Dort hukuki sayfanin dordu de etkileniyor** (`/gizlilik/`,
`/kosullar/`, `/destek/`, `/hesap-sil/`).

Sonuclari:

- JavaScript acik bir tarayicida insan dogru adresi goruyor - Cloudflare
  cozuyor. Yani gozle bakarak fark edilmez.
- **JavaScript kapaliyken tek iletisim kanali okunamaz** bir yer
  tutucuya donuesuyor. Apple gizlilik politikasinin herkese acik duez
  bir HTTPS sayfasi olmasini sart kosuyor; metin okunuyor ama
  icindeki tek adres okunmuyor.
- KVKK, veri sorumlusunun kimligi YANINDA basvuru yolunu da ister.
  Bugun yayindaki sayfada basvuru yolu yok - yerinde bir yer tutucu var.
- **En agiri `/hesap-sil/` sayfasinda.** Orada `destek@slooin.com`,
  formu kullanamayan kullanicilarin (telefonla acilmis hesaplar,
  parola belirlemeden kaydi birakmis hesaplar) TEK yolu. Play hesap
  silmenin web'den erisilebilir olmasini zorunlu tutuyor.

Cozum iki yoldan biri:

1. Cloudflare panelinde Scrape Shield > Email Address Obfuscation
   kapatilir. Tek tikla cozer ama panel ayari - biri yeniden acarsa
   sessizce geri gelir.
2. Adresler `<!--email_off-->...<!--/email_off-->` ile sarilir. Kodda
   durur, panel ayarindan bagimsizdir. **Onerilen bu.**

## Bulgu 2 (ONEMLI) - Apple'a verilen gizlilik adresi yanlis yerde

CLAUDE.md'ye gore Apple'a verilen adres:

    https://slooin.expo.app/gizlilik

Orasi sitenin degil, **uygulamanin web derlemesinin** adresi. Olculdu:

```
https://slooin.com/gizlilik/      JS'siz okunabilir metin: 11.098 karakter
https://slooin.expo.app/gizlilik  JS'siz okunabilir metin:     70 karakter
```

Expo derlemesi bir React Native Web uygulamasi; metni JavaScript
ciziyor, HTML'de yok. Apple'in istedigi "herkese acik HTTPS sayfasi"
sartini karsilama bicimi kirilgan.

Ayrica iki adres ayni metni GOSTERMEYEBILIR: `slooin.com` bugunku
duzeltmeleri tasiyor (veri sorumlusu, e-postanin BIRINCIL kimlik
olmasi), expo.app ise uygulamanin icindeki ekrani cizyor.

**Yapilacak:** App Store Connect ve Play Console'daki gizlilik
politikasi adresi `https://slooin.com/gizlilik/` ile degistirilmeli.
Sondaki egik cizgi onemli: `/gizlilik` 308 ile `/gizlilik/` adresine
yonleniyor.

## Dogrulandi, sorun yok

| Madde | Sonuc |
|---|---|
| Bes adres de yayinda | `/`, `/gizlilik/`, `/kosullar/`, `/destek/`, `/hesap-sil/` -> 200 |
| Hukuki sayfalar JS'siz okunuyor | 11.098 / 3.853 / 1.407 karakter |
| Hesap silme sayfasi JS'siz anlatiyor | 1.647 karakter - form disindaki anlatim statik HTML'de |
| Yas siniri tutarli | `docs/kullanim-kosullari.md` ve `mobil/lib/hukuki/tr.ts`: 18, "16" hic gecmiyor |
| Veri sorumlusu yayinda | "gercek kisi olarak Orcun Ozdemir'dir" |
| Hukuki sebep yayinda | Her amac icin ayri ayri (KVKK m.5/2-c vb.) |

## Dogrulanamadi

- **Sosyal giris durumu.** `giris.tsx` icinde saglayici araması sonuc
  vermedi; dosya yapisi degismis olabilir. Onemi su: iOS'ta baska bir
  sosyal giris varsa App Store "Apple ile giris"i de ZORUNLU tutuyor.
  Ayrica dogrulanmali.
- **Play Data Safety formunun** kodun gercekte topladigi veriyle
  uyusmasi. Form panelde; karsilastirma ancak panele bakilarak yapilir.

## Asil ders - bu denetimin var olma sebebi

**Derlemeyi dogruluyoruz, dagitimi dogrulamiyoruz.**

`site/araclar/dogrula.mjs` yerel `dist/` uzerinde calisiyor ve orada
her sey dogru: adres HTML'de, metin JS'siz okunuyor. Bulgu 1 yerel
derlemede **YOK**; Cloudflare onu sunum aninda uretiyor. Yani
`dist/` ile kullanicinin gordugu sayfa arasinda dogrulanmamis bir
katman var.

Ayni sinif hata bu projede daha once iki kez yasandi: dagitilmis Edge
Function'in depodaki kaynaktan eski olmasi (hesap silme aylarca
kirikti) ve `eas deploy`un `dist/`te ne varsa onu yayinlamasi.

Onerilen: `dogrula.mjs`'e **yayindaki adrese karsi** kosan bir kip
eklenmeli - en azindan e-posta adreslerinin sunulan HTML'de duez metin
olarak bulundugunu ve hukuki sayfalarin JS'siz okundugunu olcsuen.
