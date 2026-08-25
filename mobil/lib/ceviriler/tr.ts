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
  },

  karsilama: {
    baslikBirinci: 'Aynı yerdesiniz.',
    baslikIkinci: 'Tanışmaya ne dersin?',
    aciklama:
      'Bulunduğun yere check-in yap, tam o anda orada olan başka insanları gör. Konum paylaşımı check-in yaptığın süreyle sınırlı.',
    dilEtiket: 'Dil',
    // Dort ozellik. Metinler kisa tutuldu: acilis ekrani okunmaz, taranir.
    adim1Baslik: 'Check-in Yap',
    adim1Metin: 'Bulunduğun yeri paylaş, görünür ol.',
    adim2Baslik: 'Yakınındakiler',
    adim2Metin: 'Etrafında kimler var gör, yeni insanlarla tanış.',
    adim3Baslik: 'Sohbet Et',
    adim3Metin: 'İstek gönder, kabul edilirse mesajlaşın.',
    adim4Baslik: 'Popüler Yerleri Gör',
    adim4Metin: 'Yakınındaki popüler mekanları keşfet.',

    hesapOlustur: 'Hesap oluştur',
    hesabinVarMi: 'Hesabın var mı?',
    girisYap: 'Giriş yap',
    kucukNot: '18 yaşından büyük olmalısın. Konumun sürekli paylaşılmaz.',
  },

  kayit: {
    baslik: 'Hesabını oluştur',
    altYazi: 'Numaranı doğrulayacağız. Numaran profilinde görünmez.',
    telefonEtiket: 'Telefon numarası',
    telefonYerTutucu: '05XX XXX XX XX',
    dilEtiket: 'Uygulama dili',
    yakinda: 'yakında',
    sifreEtiket: 'Şifre',
    sifreYerTutucu: 'En az {{adet}} karakter',
    tekrarEtiket: 'Şifreyi tekrar gir',
    tekrarYerTutucu: 'Aynı şifreyi bir kez daha',
    sifrelerFarkli: 'Şifreler henüz aynı değil.',
    onayEtiket: 'Koşulları kabul ediyorum',
    onayMetni:
      'Gizlilik metnini okudum; kişisel verilerimin ve konum bilgimin orada anlatıldığı şekilde işlenmesini kabul ediyorum.',
    metniOku: 'Metni oku',
    onayNotu:
      'Konumun yalnızca check-in yaptığın süre boyunca kullanılır ve kimseyle sürekli paylaşılmaz. Bu onayı ayarlardan geri çekebilirsin.',
    gonder: 'Hesap oluştur',
    gonderiliyor: 'Gönderiliyor…',
    zatenHesap: 'Zaten hesabın var mı?',
    girisYap: 'Giriş yap',
    hataTelefon: 'Geçerli bir telefon numarası gir.',
    hataSifreKisa: 'Şifre en az {{adet}} karakter olmalı.',
    hataSifreUyusmuyor: 'Şifreler aynı değil. İkisini de kontrol et.',
    hataOnay: 'Devam etmek için koşulları kabul etmen gerekiyor.',
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
    bagSayisi: 'Bağ',
    canliEtiket: 'Şu an buradasın',
    ayril: 'Ayrıl',
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
