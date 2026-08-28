# Slooin — elle test listesi

Bu liste, uygulamayı gerçek bir uygulama gibi telefonda baştan sona
denemek içindir. Otomatik testler (jest, `test:sema`, `test:gorunurluk`)
veritabanı tarafını zaten kapsıyor; burada **yalnızca insanın
yapabileceği** şeyler var: arayüz kablolaması, gerçek konum, gerçek
fotoğraf, iki cihaz arasındaki canlı davranış.

Her satırın sonunda kutucuk var. Bir madde çalışmazsa oraya kısa not
düş; oturum sonunda hepsi tek tek ele alınır.

---

## 0. Hazırlık

**Adres: https://slooin.expo.app** — kalıcı adres, her yayında aynı kalıyor.

**Uygulamayı ana ekrana ekle (iPhone):** Safari ile adresi aç → Paylaş
düğmesi → "Ana Ekrana Ekle". Bundan sonra Slooin simgesine dokununca
adres çubuğu olmadan, tam ekran, gerçek uygulama gibi açılır. **Testleri
bu kısayoldan yap**, Safari sekmesinden değil — davranış farklı.

**Konum izni:** ilk check-in denemesinde sorulur. "İzin Ver" demezsen
mekân listesi boş kalır; bu bir hata değil.

### Test hesapları

| Numara | Şifre | SMS kodu | Durum |
|---|---|---|---|
| `05550000000` | `test1234` | `123456` | Profili var — "Test Kullanici" |
| `05550000001` | `test1234` | `123456` | Profili var — "orçun" |
| `05550000002` | `test1234` | `123456` | Profili var — "Ucuncu Test Kullanici" |
| `05550000003` | — | `123456` | **Profili var** (`asdfgh`) — artık kayıt akışı için uygun değil |
| `05550000008` | `test1234` | yok | Profilsiz, SMS alamıyor — sadece giriş ekranından |

> **Örnek akış verisi (2026-08-28, SAHTE).** Zaman tünelini dolu
> görebilmek için `05550000000` ile `05550000001` ve `05550000002`
> arasında **karşılıklı takip** kuruldu ve üç hesaba toplam 9 check-in
> eklendi (ikisi canlı, "şu an burada" rozetli). Hiçbiri gerçek
> kullanıcı hareketi değil. Temizlemek için:
>
> ```sql
> delete from public.check_inler
> where kullanici_id in (select id from auth.users
>   where phone in ('905550000000','905550000001','905550000002'));
> delete from public.takipler
> where takip_eden_id in (select id from auth.users
>   where phone in ('905550000000','905550000001','905550000002'));
> ```

> **Dikkat:** kayıt akışını (numara → SMS → profil oluştur) baştan sona
> denemek için şu an **boş bir test numarası yok**. `05550000003` geçen
> oturumda profil oluşturarak harcandı. Çözüm ikisinden biri: Supabase
> panelinden test numarası listesine yenilerini eklemek
> (Authentication → Sign In / Providers → Phone → Test phone numbers),
> ya da `05550000003`ün profilini silip sıfırlamak. Bu bir karar
> gerektiriyor — bkz. oturum notu.

---

## A. Kayıt ve giriş

- [ ] Hesap yokken uygulama açılınca **karşılama** ekranı geliyor; kroki arka
      plan çiziliyor, dört başlık ve örnek check-in kartları görünüyor.
- [ ] "Hesap oluştur" → yalnızca telefon numarası isteniyor, kod gönderiliyor.
- [ ] Doğrulama ekranında altı kutu var; kod yapıştırılınca kutulara dağılıyor.
- [ ] Yanlış kod girilince anlaşılır Türkçe bir hata çıkıyor (ham İngilizce
      sunucu metni değil).
- [ ] Tekrar gönder düğmesi geri sayım bitmeden basılamıyor.
- [ ] **Zaten kayıtlı bir numarayla** (örn. `05550000000`) kayıt akışına
      girip kodu doğrulayınca "Bu numarada zaten bir hesap var" deyip
      girişe yönlendiriyor.
- [ ] Profil oluşturma ekranı: ad-soyad, doğum tarihi (kaydırmalı seçici),
      kullanıcı adı, şifre, şifre tekrarı, sözleşme onayı.
- [ ] Sözleşme onayı verilmeden "Devam" çalışmıyor.
- [ ] Kullanıcı adı alınmışsa canlı olarak "bu kullanıcı adı alınmış" diyor.
- [ ] 18 yaşından küçük bir doğum tarihi kabul edilmiyor.
- [ ] Kayıt bitince uygulama içine düşüyor.
- [ ] Çıkış yapıp aynı numara + şifre ile **giriş** ekranından girilebiliyor.
- [ ] Tarayıcı tamamen kapatılıp açıldığında oturum **açık kalıyor**.

---

## B. Check-in

- [ ] Alt çubuktaki ortadaki turuncu düğme check-in akışını açıyor.
- [ ] Yakındaki mekânlar listeleniyor; her satırda **ad + semt · uzaklık** var,
      **tür ve ikon yok** (kullanıcının eklediği mekânlar hariç).
- [ ] Arama kutusuna Türkçe büyük harfle bir şey yazınca (`İstanbul`,
      `Şişli`) sonuç geliyor — küçük/büyük harf sorunu yok.
- [ ] Bir mekâna check-in yapılıyor; not yazılabiliyor.
- [ ] Fotoğraf eklenebiliyor (telefon galerisinden ve kameradan).
- [ ] Görünürlük seçimi çalışıyor: herkese açık / takipçilerim / gizli.
- [ ] Check-in sonrası ana sayfada kart görünüyor; ilk bir saat içinde
      **"şu an burada"** etiketi var.
- [ ] Karta dokununca **harita ekranı** açılıyor; kendi konumun merkezde,
      mekân doğru yönde ve doğru mesafede.
- [ ] "Ayrıldım" denince canlı kart anıya dönüşüyor.
- [ ] Aktif check-in varken ikinci bir check-in yapılamıyor.
- [ ] Mekândan ~500 m uzaktayken check-in reddediliyor (anlaşılır mesajla).

### Arkadaş etiketleme

- [ ] Check-in'de yalnızca **karşılıklı bağlı** kişiler etiketlenebiliyor.
- [ ] Etiketlenen kişi kendi etiketini kaldırabiliyor.
- [ ] Etiketi koyan kişi de kaldırabiliyor.

---

## C. Mekân ekleme

- [ ] Listede olmayan bir yer için "Mekân ekle" çalışıyor.
- [ ] ~200 m'den uzak bir yer eklenemiyor.
- [ ] Tür seçimi **burada var** (tek tür girişi noktası bu).
- [ ] Eklenen mekân listede görünüyor ve **türü gösteriliyor**.
- [ ] Günde 5'ten fazla mekân eklenemiyor.

---

## D. Kişiler ve arama

- [ ] Alt çubuktan "Kişiler" açılıyor.
- [ ] Kullanıcı adıyla arama çalışıyor (en az 2 karakter).
- [ ] İsimle arama çalışıyor, Türkçe harfler dahil.
- [ ] Kendi hesabın sonuçlarda çıkmıyor.
- [ ] Ayarlardan "Beni aramada göster" kapatılınca diğer hesap seni bulamıyor;
      geri açılınca yine buluyor. *(iki hesap gerekir)*

---

## E. Bağ: takip ve sohbet istekleri *(iki hesap gerekir)*

- [ ] A, B'nin profilinden takip isteği gönderiyor.
- [ ] B'nin "Bağlar" ekranında istek görünüyor.
- [ ] B kabul edince **iki taraf da** birbirini bağlarında görüyor
      (takip karşılıklı).
- [ ] Kabul sonrası A, B'nin `takipçilerim` görünürlüklü check-in'ini
      mekâna gitmeden görüyor.
- [ ] B `gizli` ile check-in yapınca A göremiyor.
- [ ] "Takibi bırak" iki yönü birden siliyor.
- [ ] Sohbet isteği gönderilip kabul edilebiliyor.

---

## F. Mesajlaşma *(iki hesap gerekir)*

- [ ] Karşılıklı bağ kurulunca profildeki "Mesaj gönder" açılıyor.
- [ ] Gönderilen mesaj karşı tarafta **anında** beliriyor (yenilemeden).
- [ ] Alt çubuktaki Mesajlar sekmesinde okunmamış rozeti artıyor.
- [ ] Konuşma açılınca rozet sıfırlanıyor.
- [ ] "Konuşmayı gizle" yalnızca kendi tarafında çalışıyor; karşı taraf
      yazınca konuşma geri geliyor.
- [ ] Bağ koptuktan sonra geçmiş okunabiliyor ama yazma alanı kapalı.
- [ ] Bir mesaja uzun basınca **o mesaj için** şikâyet gönderilebiliyor.

---

## G. Engelleme ve şikâyet *(iki hesap gerekir)*

- [ ] Başkasının profilinden **iki adımlı** engelleme yapılıyor.
- [ ] Engellendikten sonra iki taraf da birbirini aramada bulamıyor.
- [ ] Engellenen kişinin eski anıları da görünmüyor.
- [ ] Engelleme **sessiz**: karşı tarafa bildirim gitmiyor, engellendiğini
      açıkça söyleyen bir ekran yok.
- [ ] Ayarlar → Engellenenler listesinden engel kaldırılabiliyor.
- [ ] Profil / check-in / mesaj şikâyeti gönderilebiliyor.

---

## H. Profil ve ayarlar

- [ ] Profil ekranında "şu an buradasın" şeridi doğru çalışıyor.
- [ ] Profili düzenle: ad ve biyografi değiştirilebiliyor.
- [ ] **Profil fotoğrafı** yüklenebiliyor; değiştirince eski fotoğraf
      hiçbir yerde görünmüyor.
- [ ] Kullanıcı adı değiştirilebiliyor; **ikinci denemede 30 gün** uyarısı
      geliyor.
- [ ] Check-in görünürlüğü varsayılanı ayarlanabiliyor.
- [ ] Anı görünürlüğü ayarlanabiliyor.
- [ ] Anılar listesinde bir anı **iki adımda** silinebiliyor.
- [ ] Ayarlar → Gizlilik metni açılıyor ve okunabiliyor.

---

## I. Hesap hakları

- [ ] Hesabı **dondur** → çıkış → aynı hesapla giriş → hesap otomatik
      geri açılıyor.
- [ ] Donduruldu iken hesap aramada ve check-in'lerde görünmüyor.
- [ ] Geri açıldığında **canlı check-in geri gelmiyor** (yalnızca anı kalıyor).
- [ ] Hesabı **sil** akışı: yanlış şifreyle reddediliyor.
- [ ] Doğru şifreyle siliniyor; aynı numarayla yeniden kayıt olunabiliyor.
- [ ] Silinen kullanıcının mesajları karşı tarafta **anonim** görünüyor,
      kaybolmuyor.
- [ ] Askıya alınmış hesapla girilince `hesap-durumu` ekranı çıkıyor.

---

## J. Moderasyon paneli

**Şu an açılamıyor.** Supabase projesinde TOTP MFA kapalı olduğu için
moderatör ikinci faktörü kuramıyor ve panele giremiyor. Açmak için:
Supabase Dashboard → Authentication → Multi-Factor Authentication → TOTP.
Bu bir proje ayarı; migrasyonla açılamıyor.

Açıldıktan sonra denenecekler:

- [ ] Moderatör hesabıyla giriş → TOTP kur → panel açılıyor.
- [ ] İkinci faktör olmadan panel **kapalı** kalıyor.
- [ ] Şikâyet listesi, şikâyet detayı, hedefin geçmişi görünüyor.
- [ ] Karara bağlama çalışıyor ve denetim izine yazılıyor.
- [ ] İçerik gizleme üç yolda da (akış, profil, mekân) etkili oluyor.
- [ ] Askıya alma / yasaklama / kaldırma çalışıyor.

---

## Bilinen sınırlar (hata değil)

- **Push bildirimleri çalışmıyor.** Web sürümünde uzak bildirim yok;
  gerçek cihazda ilk bildirim hâlâ hiç görülmedi. Bu, native derlemeye
  (TestFlight/EAS) kalmış bir borç.
- **Gerçek harita yok.** Harita ekranı kendi çizdiğimiz yön/mesafe
  gösterimi; sokak haritası değil. Bilinçli karar.
- **Haritada ve kartlarda yüz yok.** Yoğunluk yalnızca sayı gösterir.
- **Türkçe dışındaki diller geride.** Eksik çeviri Türkçe'ye düşer,
  ham anahtar görünmez.
- **Yeni numarayla gerçek kayıt yapılamaz.** Supabase'de SMS sağlayıcısı
  tanımlı değil; yalnızca test numaraları kod alır. Bu aynı zamanda
  önizleme adresinin güvenlik kapısıdır: adresi bulan biri hesap açamaz.
