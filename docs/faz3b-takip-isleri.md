# Faz 3b - kapanistan sonra kalan isler

Faz 3b (birebir sohbet) tamamlandi: 18 gorev, hepsi ayri ayri incelendi.
Bu dosya, incelemelerde bulunup **bilerek** ertelenen maddeleri tutar.
Hicbiri kritik degil ve hicbiri birlestirmeyi engellemedi. Ayrinti icin
`CLAUDE.md` icindeki "Faz 3b TAMAMLANDI" bolumune bak; fazin gunu gunune
gunlugu `docs/faz3b-devam-notu.md` icinde.

Faz 3a'dan devreden maddeler ayri dosyada: `docs/faz3a-takip-isleri.md`.

## 1. Gelecekteki bir isi YANLIS YONE SOKABILECEK iki madde

Bu iki madde listenin geri kalanindan farkli: ikisi de bugun zararsiz,
ama ikisi de **baska bir isin** varsayimini sessizce bozabilir. Ilkini
Faz 3c'yi (mekan odalari) yazan, ikincisini moderasyon panelini yazan
okumali.

### 1a. `mesajlari_getir`'in engelleme kontrolu grup sohbetinde kirilir

`public.mesajlari_getir` `security definer`, yani `mesajlar` tablosunun
RLS'ini (dolayisiyla `not gizli.engelli_mi(...)` kosulunu) tamamen
atliyor. Engelleme kurali bu yuzden fonksiyonun govdesinde AYRICA
zorlaniyor - ve orada "karsi uye" soyle bulunuyor:

    select u.kullanici_id into v_diger_id
    from public.konusma_uyeleri u
    where u.konusma_id = p_konusma_id and u.kullanici_id <> auth.uid()
    limit 1;

`limit 1` var, `tur = 'birebir'` filtresi yok. Bugun zararsiz, cunku bu
fazda her konusmanin tam iki uyesi var ve "diger uye" tek. Faz 3c grup
odalarini ayni RPC'ye baglarsa yalnizca **rastgele** bir uyenin engel
durumu kontrol edilir ve grup sohbetinde engelleme sessizce kirilir.

Iki cikis yolu var, ikisi de kabul edilebilir: ya bu RPC'ye `tur =
'birebir'` on kosulu konur ve gruplar icin ayri bir okuma RPC'si yazilir,
ya da kontrol "herhangi bir uye" degil "engelli olan bir uye var mi"
seklinde `exists` ile yeniden yazilir. Karar Faz 3c'nin tasarimina ait;
onemli olan bunun **karar verilmeden** miras alinmamasi.

### 1b. Mesaj sikayeti hangi mesaja ait oldugunu tasimiyor

Sohbet ekrani sikayeti soyle aciyor:

    const sikayetHedefId = konusmaId ?? kullaniciId
    router.push(`/sikayet?hedefTur=mesaj&hedefId=${sikayetHedefId}`)

Yani `sikayetler.hedef_id` mesaj id'si degil, **konusma** id'si (konusma
henuz kurulmamissa kullanici id'si). Diger iki sikayet turunde (`profil`,
`ani`) o alan sikayet edilen seyin tam id'sini tasiyor. Sonucu:
`sikayetler` tablosunu okuyacak moderasyon paneli hangi mesajin sikayet
edildigini bulamaz; elinde yalnizca konusmanin tamami olur.

Bu, "moderasyon paneli" isine baslamadan once karara baglanmali. Secenek
olarak sikayete mesaj id'si eklemek (ekranda mesaj basina sikayet),
`hedef_tur = 'konusma'` diye durustce adlandirmak, ya da panelin konusma
gecmisini okumasini kabullenmek var. Ucu de savunulabilir; sessizce
oldugu gibi birakmak savunulabilir degil, cunku panel yazan kisi alanin
tam id tasidigini varsayar.

## 2. Yapilmamis elle dogrulama

Iki hesapla tarayicida gezinme Faz 3b'de de yapilmadi (etkilesimli,
insan gerektiriyor). Bu borc Faz 2a, 2b, 2c ve 3a'dan beri devrediyor;
Faz 2a'da tam bu yuzden canli veritabaninda hic calismayan bir ekran
yayinlanmisti.

Faz 3b'nin eklediginin dogrulanmasi gerekenler:

1. A ve B karsilikli bag kurunca profildeki "Mesaj gonder" butonunun
   acilmasi.
2. A'nin gonderdigi mesajin B'de Realtime ile belirmesi.
3. B'nin ana ekranindaki okunmamis rozetinin artmasi, konusma acilinca
   sifirlanmasi.
4. Konusmayi gizlemenin yalnizca gizleyen tarafta calismasi ve karsi
   taraf yazinca konusmanin geri gelmesi.
5. Bag koptuktan sonra gecmisin okunabilir ama yazma alaninin kapali
   olmasi.

Bunlarin veritabani tarafi `npm run test:gorunurluk` icindeki 44
senaryoda kapsaniyor; acikta kalan yalnizca arayuz kablolamasinin gozle
dogrulanmasi.

Nasil calistirilir:

    cd mobil
    npx expo start --web --clear --port 8084

Test numaralari `05550000000` ve `05550000001`, sifre `mobil/.env`
icindeki `TEST_HESAP_SIFRESI`. Gezinti bitince sunucuyu kapat - acik
kalan bir dev sunucusu tam Jest kosumlarinda zaman asimi uretiyor.

## 3. Kullaniciya gorunen kucuk kusurlar

- **Gonderilen mesaj iyimser olarak listeye eklenmiyor** ve bu TUTARSIZ:
  konusmayi olusturan ilk gonderimde liste yeniden cekiliyor, sonraki
  gonderimlerde cekilmiyor ve mesaj yalnizca Realtime geri yansitinca
  beliriyor. Kullanici bazen kendi mesajini hemen goruyor, bazen
  gormuyor - bu, her seferinde beklemekten daha kafa karistirici. Testi
  de yok.
- `mesajlari_getir`'e negatif `p_limit` verilince ham Postgres hatasi
  uretiyor, Turkce bir mesaj degil. Istemci bu degeri hic gondermiyor,
  yani bugun yalnizca dogrudan RPC cagrisiyla goruluyor.

## 4. Derinlemesine savunma ve temizlik

- Dort `bag`/`gizli` yardimcisina (`yazabilir_mi`, `takip_ediyor_mu`,
  `engelli_mi`, `istek_on_kontrol`) `revoke execute from public, anon`
  ekleyen tek bir migrasyon. Bugun zaten ulasilamazlar (sema `usage`
  yalnizca `authenticated` rolunde, PostgREST `bag` semasini sunmuyor),
  ama bu iki koruma da yapilandirmaya bagli; `revoke` fonksiyonun
  kendisine bagli olurdu.
- `mesaj_gonder`'in `update konusma_uyeleri` adimi KOSULSUZ calisiyor,
  yani her mesaj iki UPDATE olayini daha Realtime'a yayiyor. Islevsel
  sorun degil, gereksiz yuk.
- `sikayet_gonder`'in `revoke`/`grant` satirlari arguman imzasi yazmiyor,
  tek asiri yukleme olduguna guveniyor. Ikinci bir asiri yukleme
  eklenirse kirilgan.

## 5. Test donanimi borclari

- `__tests__/ekranlar/kullanici/[id].test.tsx:30` artik var olmayan
  `takipciyiCikar` disa acimini mock'lamaya devam ediyor (olu mock
  donanimi). Ayni dosya bilinen bir 5000 ms zaman asimi flake'i de
  tasiyor.
- `__tests__/ekranlar/index.test.tsx`'in odak mock kayit defteri duz
  dizi; `mesajlar.test.tsx` Set'e cevrildi. Ikisi de Set olmali - duz
  dizi, gercek durum degisikligi olan bir odak testi eklenirse gizli
  mukerrer-ekleme uretir.
- `gorunurluk-testleri/calistir.ts:461-605` (Faz 2c senaryolari) icinde
  17 adet `const { data: X } = await ...` cagrisi `error` almiyor. Faz 3b
  senaryolarinda bu sinif risk kapatildi, Faz 2c bolumunde duruyor: RPC
  hata donerse `data` null olur ve negatif iddialar VAKUM halinde gecer.
- Senaryo 24 hala tek yonlu takip satiri sorguyor; `engelle` B->A ayna
  satirini biraksa iddia yine gecerdi. Kapsama boslugu degil (senaryo 38
  iki yonu de dogruluyor), ama `ikiYonTakipSatirlari` yardimcisi
  hazirken kullanilmamis.
- `gorunurluk-testleri/yardimcilar.ts:52`'deki `anonIstemciOlustur()` tam
  bu is icin export edilmis ve hicbir yerde kullanilmiyor; anon istemci
  uc ayri senaryoda satir ici olusturuluyor.
- Senaryo 37 hata yolunda kirletici: senaryo temizlige varmadan
  firlatirsa yonetici istemcisiyle yazilan takip satirlari ortada kalir
  ve sonraki senaryolarin on kosulunu bozar (`senaryo()` sarmalayicisi
  hatayi yakalayip kosuma devam ediyor). Yalnizca hata yolunda gecerli.
- Senaryo 37'de `engelliyken` okumasi yalnizca satir SAYISINI olcuyor,
  `durum` alanini yeniden okumuyor; `'kabul'` degeri insert yukunden ve
  hatasiz insert iddiasindan geliyor.
- `.claude/hooks/oturum-kaydet.py` icindeki `sorted(set(degerler), ...)`
  esit uzunluktaki degerler arasinda sirayi belirsizlestiriyor.
  Maskeleme dogrulugunu etkilemiyor (hepsi yine degistiriliyor).

## 6. Kosum ortami

- **`SUPABASE_SERVICE_ROLE_KEY` yoksa `kotayiTemizle()` yalnizca uyari
  basip donuyor** (`gorunurluk-testleri/yardimcilar.ts`). Faz 3b
  senaryolari kosum basina 7 takip + 2 sohbet istegi ekliyor, yani
  anahtarsiz bir kosum eskisinden daha hizli yanlis alarma girer (gunluk
  50 istek tavani). Ayrica senaryo 34, 35, 37, 38, 39, 40, 41 ve 42
  anahtar olmadan gurultulu duser. Anahtar `mobil/.env` icinde ve
  gitignored; degeri hicbir belgeye, teste ya da commit mesajina
  yazilmaz.
- `npm run test:gorunurluk --tavan` gunun geri kalani icin hala yikici:
  tek kosumda test hesabinin ekle-only istek gunlugune 50 kalici satir
  yaziyor. Yalnizca tavan davranisini dogrulamak icin, bilerek
  calistirilir.
- Dev sunucusu ve tam Jest kosumu ayni anda calistirilmaz; ikisi islemci
  icin yarisip araliklarla 5000 ms render zaman asimi uretiyor.
