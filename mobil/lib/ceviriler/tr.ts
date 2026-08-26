/**
 * Turkce metinler - KAYNAK DIL.
 *
 * Yeni bir metin once buraya yazilir, sonra `en.ts` icine cevrilir.
 * Anahtarlar ekran adiyla gruplanir; boylece bir ekran uzerinde
 * calisirken ilgili metinler bir arada durur.
 *
 * Kural (karar 74): kullaniciya gorunen her metin duzgun, aksanli
 * Turkce yazilir. ASCII kurali yalnizca kod, yorum ve commit
 * metinleri icindir.
 */
export default {
  ortak: {
    devam: 'Devam et',
    iptal: 'İptal',
    kaydet: 'Kaydet',
    tekrarDene: 'Tekrar dene',
    yukleniyor: 'Yükleniyor…',
    birSorunOldu: 'Bir sorun oluştu.',
    sil: 'Sil',
    vazgec: 'Vazgeç',
    geri: 'Geri',
  },

  karsilama: {
    baslikBirinci: 'Aynı yerdesiniz.',
    baslikIkinci: 'Tanışmaya ne dersin?',
    aciklama:
      'Bulunduğun yere check-in yap, tam o anda orada olan başka insanları gör. Konum paylaşımı check-in yaptığın süreyle sınırlı.',
    dilEtiket: 'Dil',


    // Acilistaki ornek check-in kartlari. GERCEK VERI DEGIL: kullanici
    // henuz giris yapmamis ve kimin nerede oldugu giris oncesi
    // gosterilemez. Mekan adlari da bilerek jenerik.
    ornek1Ad: 'Sahil Yürüyüş Yolu',
    ornek1Alt: '7 kişi şu an burada',
    ornek2Ad: 'Kampüs Kütüphanesi',
    ornek2Alt: '3 kişi şu an burada',
    // Dort ozellik, YALNIZCA BASLIK. Basliklarin altindaki aciklama
    // satirlari kullanicinin karariyla kaldirildi (2026-08-26): baslik
    // zaten ne oldugunu soyluyordu, aciklama ayni seyi tekrar ediyordu.
    adim1Baslik: 'Check-in Yap',
    adim2Baslik: 'Yakınında kimler var gör',
    adim3Baslik: 'Sohbet Et',
    adim4Baslik: 'Popüler yerleri keşfet',

    hesapOlustur: 'Hesap oluştur',
    hesabinVarMi: 'Hesabın var mı?',
    girisYap: 'Giriş yap',
  },

  kayit: {
    telefonEtiket: 'Telefon numarası',
    telefonYerTutucu: '05XX XXX XX XX',
    gonder: 'Kodu gönder',
    gonderiliyor: 'Gönderiliyor…',
    zatenHesap: 'Zaten hesabın var mı?',
    girisYap: 'Giriş yap',
    hataTelefon: 'Geçerli bir telefon numarası gir.',
    aydinlatma: 'Devam ederek gizlilik metnini kabul etmiş olmazsın; onayı bir sonraki adımda vereceksin.',
  },

  profilOlustur: {
    baslik: 'Hesap oluştur',

    adYerTutucu: 'Adın ve soyadın',
    adHata: 'Adını ve soyadını yaz.',

    dogumEtiket: 'Doğum tarihin',
    dogumSec: 'Doğum tarihin',
    dogumHataGecersiz: 'Doğum tarihini seç.',
    dogumHataYas: 'Slooin’i kullanmak için 18 yaşını doldurmuş olman gerekiyor.',
    tarihGun: 'Gün',
    tarihAy: 'Ay',
    tarihYil: 'Yıl',
    tarihTamam: 'Tamam',
    aylar: {
      1: 'Ocak',
      2: 'Şubat',
      3: 'Mart',
      4: 'Nisan',
      5: 'Mayıs',
      6: 'Haziran',
      7: 'Temmuz',
      8: 'Ağustos',
      9: 'Eylül',
      10: 'Ekim',
      11: 'Kasım',
      12: 'Aralık',
    },

    kullaniciAdiYerTutucu: 'Kullanıcı adı',
    kullaniciAdiIpucu: '3-20 karakter; küçük harf, rakam, nokta ve alt çizgi.',
    kullaniciAdiKontrol: 'Kontrol ediliyor…',
    kullaniciAdiMusait: 'Bu kullanıcı adı müsait.',
    kullaniciAdiAlinmis: 'Bu kullanıcı adı alınmış, başka bir tane dene.',

    sifreEtiket: 'Şifre',
    sifreYerTutucu: 'En az {{adet}} karakter',
    tekrarEtiket: 'Şifreyi tekrar gir',
    tekrarYerTutucu: 'Aynı şifreyi bir kez daha',
    sifrelerFarkli: 'Şifreler henüz aynı değil.',
    sifreGoster: 'Şifreyi göster',
    sifreGizle: 'Şifreyi gizle',
    hataSifreKisa: 'Şifre en az {{adet}} karakter olmalı.',
    hataSifreUyusmuyor: 'Şifreler aynı değil. İkisini de kontrol et.',

    onayEtiket: 'Sözleşmeleri kabul ediyorum',
    onayMetni:
      'Kullanım koşullarını ve gizlilik metnini okudum, kabul ediyorum; kişisel verilerimin ve konum bilgimin orada anlatıldığı şekilde işlenmesine açık rıza veriyorum.',
    metniOku: 'Metni oku',
    onayNotu:
      'Onay vermeden hesap oluşturulmaz. Konumun yalnızca check-in yaptığın süre boyunca kullanılır ve kimseyle sürekli paylaşılmaz.',
    hataOnay: 'Devam etmek için sözleşmeleri onaylaman gerekiyor.',

    gonder: 'Hesabı oluştur',
    gonderiliyor: 'Oluşturuluyor…',
    oturumDustu: 'Oturumun düşmüş, tekrar giriş yap.',
    beklenmeyenHata: 'Beklenmeyen bir hata oluştu.',
  },

  kisiler: {
    baslik: 'Kişi ara',
    yerTutucu: 'Kullanıcı adı ya da isim',
    enAzIki: 'En az 2 karakter yaz.',
    bulunamadi: 'Kimse bulunamadı.',
    ipucu: 'Tanıdığın birini kullanıcı adıyla ya da ismiyle arayabilirsin.',
  },

  mesajlar: {
    baslik: 'Mesajlar',
    bosBaslik: 'Henüz bir konuşman yok',
    bosAciklama:
      'Karşılıklı bağ kurduğun ya da sohbet isteğin kabul edilen kişilerle mesajlaşabilirsin.',
    silinmisKullanici: 'Silinmiş kullanıcı',
    gizle: 'Gizle',
  },

  anaSayfa: {
    baslik: 'slooin',
    suAnBurada: 'şu an burada',
    bosBaslik: 'Akışın henüz boş',
    bosAciklama:
      'Bir yere check-in yap ya da birileriyle bağ kur; onların check-inleri burada görünür.',
    kesfet: 'Mekanları keşfet',
    azOnce: 'az önce',
    dakika: '{{sayi}} dk',
    saat: '{{sayi}} sa',
    gun: '{{sayi}} gün',
    silOnay: 'Bu check-in kalıcı olarak silinsin mi?',
    silAriza: 'Check-in silinemedi.',
  },

  kullanici: {
    bulunamadi: 'Bu profil bulunamadı',
    aniSayisi: '{{sayi}} anı',
    takipEt: 'Takip et',
    istegiGeriCek: 'İsteği geri çek',
    bagiKopar: 'Bağı kopar',
    sohbetIste: 'Sohbet iste',
    sohbetAcik: 'Sohbet açık',
    mesajGonder: 'Mesaj gönder',
    gelenIstekAciklama:
      "Kabul edersen birbirinizin check-in'lerini görebilir ve mesajlaşabilirsiniz.",
    kabulEt: 'Kabul et',
    reddet: 'Reddet',
    anilar: 'Anılar',
    aniYok: 'Henüz bir anısı yok',
    sikayetEt: 'Şikayet et',
    engelle: 'Engelle',
    engelleOnayi: 'Engellersen birbirinizi hiçbir yerde göremezsiniz.',
    engelleEvet: 'Evet, engelle',
    vazgec: 'Vazgeç',
    geri: 'Geri',
  },

  ayarlar: {
    baslik: 'Ayarlar',
    geri: 'Geri',

    bolumHesap: 'Hesabın',
    kullaniciAdi: 'Kullanıcı adı',
    gizlilikMetni: 'Gizlilik metni',

    bolumGorunurluk: 'Seni kimler görebilir?',
    checkInGorunurlugu: 'Yeni check-in’lerim',
    aniGorunurlugu: 'Geçmiş anılarım',
    aramadaGorun: 'Beni aramada göster',
    aramadaGorunEtiket: 'Aramada görünürlük',

    bolumKisiler: 'Kişiler',
    engellenenler: 'Engellenenler',

    bolumHesapIslemleri: 'Hesap',
    dondur: 'Hesabımı dondur',
    dondurAciklama:
      'Verilerin silinmez. Tekrar giriş yaptığında hesabın kendiliğinden aktif olur.',
    dondurEvet: 'Evet, dondur',
    vazgec: 'Vazgeç',
    hesabiSil: 'Hesabımı sil',
    cikisYap: 'Çıkış yap',

    bulunurlukHerkeseAcik: 'Herkese açık',
    bulunurlukTakipcilerim: 'Sadece takipçilerim',
    bulunurlukGizli: 'Gizli',
    aniHerkeseAcik: 'Herkes görsün',
    aniTakipcilerim: 'Sadece takipçilerim görsün',
    aniKimse: 'Kimse görmesin',
    secilmedi: 'Seçilmedi',
  },

  kullaniciAdiEkrani: {
    baslik: 'Kullanıcı adı',
    geri: 'Geri',
    mevcut: 'Şu anki kullanıcı adın',
    yerTutucu: 'Yeni kullanıcı adı',
    kaydet: 'Kullanıcı adını değiştir',
    guncellendi: 'Kullanıcı adın güncellendi.',
    sonrakiDegisim: 'Tekrar değiştirebileceğin tarih: {{tarih}}',
  },

  checkInGorunurlugu: {
    baslik: 'Yeni check-in’lerim',
    geri: 'Geri',
    aciklama: 'Bundan sonra yaptığın check-in’ler bu ayarla başlar; her check-in’de tek tek değiştirebilirsin.',
    herkeseAcikAciklama: 'Buradakiler ve takipçilerin görür',
    takipcilerimAciklama: 'Buradaki yabancılar görmez',
    gizliAciklama: 'Kimse görmez',
  },

  aniGorunurlugu: {
    baslik: 'Geçmiş anılarım',
    geri: 'Geri',
    aciklama:
      'Bu seçim bütün anılarına uygulanır, ama gizli check-in’den dönüşen anılar bu ayardan etkilenmez ve kapalı kalır.',
  },

  engellenenler: {
    baslik: 'Engellenenler',
    engeliKaldir: 'Engeli kaldır',
    bosBaslik: 'Kimseyi engellemedin',
    bosAciklama: 'Birini engellersen burada görünür ve buradan geri alabilirsin.',
    geri: 'Geri',
  },

  profil: {
    ayarlar: 'Ayarlar',
    aniSayisi: 'Anı',
    bagSayisi: 'Arkadaşlarım',
    canliEtiket: 'Şu an buradasın',
    ayril: 'Ayrıl',
    canliSil: 'Sil',
    canliSilOnay: 'Bu check-in kalıcı olarak silinsin mi? Anılarında da kalmaz.',
    bosCanliBaslik: 'Şu an bir yerde değilsin',
    bosCanliAciklama:
      'Bulunduğun yere check-in yap, tam o anda orada olan insanları gör.',
    checkInYap: 'Bir yere check-in yap',
    anilarBaslik: 'Anılar',
    tumu: 'Tümü',
    bosAniBaslik: 'Henüz bir anın yok',
    bosAniAciklama: 'Check-in’in bittiğinde burada bir anı olarak kalır.',
    profilYok: 'Profilin henüz hazır değil',
    profilYokAciklama: 'Adını ve kullanıcı adını belirle, sonra buradan devam et.',
    profilOlustur: 'Profilini oluştur',
  },

  dogrula: {
    geri: 'Geri',
    baslik: 'Telefonunu doğrula',
    aciklama: '{{telefon}} numarasına 6 haneli bir kod gönderdik.',
    kodEtiketi: 'Doğrulama kodu',
    gonder: 'Doğrula',
    gonderiliyor: 'Doğrulanıyor…',
    kodGelmedi: 'Kod gelmedi mi?',
    tekrarGonder: 'Tekrar gönder',
    tekrarBekle: '{{saniye}} sn sonra tekrar gönderebilirsin',
    tekrarGonderildi: 'Yeni kod gönderildi.',
    hakKalmadi: 'Bu numara için çok fazla kod istendi. Bir saat sonra tekrar deneyebilirsin.',
    hataEksik: 'Kodu eksiksiz gir.',
    zatenKayitliBaslik: 'Bu numarada zaten bir hesap var',
    zatenKayitliAciklama:
      '{{telefon}} numarasıyla daha önce hesap oluşturulmuş. Şifrenle giriş yapabilirsin.',
    girisYap: 'Giriş yap',
    baskaNumara: 'Başka bir numarayla devam et',
  },

  giris: {
    telefonYerTutucu: 'Telefon numarası',
    sifreYerTutucu: 'Şifre',
    gonder: 'Giriş yap',
    gonderiliyor: 'Giriş yapılıyor…',
    kayitOl: 'Yeni hesap oluştur',
    hataTelefon: 'Geçerli bir telefon numarası gir.',
    hataBos: 'Telefon numaranı ve şifreni gir.',
  },
} as const
