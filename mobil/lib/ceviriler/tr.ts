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
    // KAYIT ARTIK E-POSTA ILE (kullanicinin karari 2026-09-01).
    // Telefon anahtarlari silinmedi: giris ekrani ve eski akis
    // gecis bitene kadar onlari kullanmaya devam ediyor.
    baslik: 'E-postanı kullanarak başla',
    epostaEtiket: 'E-posta adresi',
    epostaYerTutucu: 'ornek@eposta.com',
    devam: 'Devam',
    veya: 'veya',
    appleIle: 'Apple ile devam et',
    googleIle: 'Google ile devam et',
    hataEposta: 'Geçerli bir e-posta adresi gir.',
    hataEpostaKayitli:
      'Bu e-posta adresiyle zaten bir hesap var. Şifrenle giriş yapabilirsin.',
    hataSaglayiciKapali:
      'Bu giriş yöntemi şu an kullanılamıyor. E-posta adresinle devam edebilirsin.',

    telefonEtiket: 'Telefon numarası',
    telefonYerTutucu: '05XX XXX XX XX',
    gonder: 'Kodu gönder',
    gonderiliyor: 'Gönderiliyor…',
    zatenHesap: 'Zaten hesabın var mı?',
    girisYap: 'Giriş yap',
    hataTelefon: 'Geçerli bir telefon numarası gir.',
    hataZatenKayitli:
      'Bu numarada zaten bir hesap var. Şifrenle giriş yapabilirsin.',
    // ONAY ARTIK BURADA (kullanicinin karari 2026-09-01): profil
    // olusturma ekranindaki onay kutusu kaldirildi, kabul "Devam"a
    // basmakla veriliyor. Kayit KAYDI korunuyor - kvkk_onaylari
    // tablosuna yine yaziliyor, yalnizca kaynagi degisti.
    aydinlatma:
      'Devam ederek Kullanım koşullarımızı kabul ettiğini ve Gizlilik Politikamızı okuduğunu onaylıyorsun.',
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


    gonder: 'Hesabı oluştur',
    gonderiliyor: 'Oluşturuluyor…',
    oturumDustu: 'Oturumun düşmüş, tekrar giriş yap.',
    beklenmeyenHata: 'Beklenmeyen bir hata oluştu.',
  },

  bildirimler: {
    baslik: 'Bildirimler',
    arkadaslikBolumu: 'Arkadaşlık istekleri',
    etiketBolumu: 'Etiketlenme istekleri',
    // Kullanici adi satirda AYRI ve kalin basiliyor; metin onun devami.
    arkadaslikMetni: 'seninle arkadaş olmak istiyor.',
    etiketMetni: '{{mekan}} check-in’inde seni etiketlemek istiyor.',
    kabul: 'Kabul et',
    onayla: 'Onayla',
    reddet: 'Reddet',
    bosBaslik: 'Yeni bir şey yok',
    bosAciklama:
      'Arkadaşlık istekleri ve seni etiketlemek isteyenler burada görünür.',
  },
  kisiler: {
    baslik: 'Kişi ara',
    yerTutucu: 'Kullanıcı adı ya da isim',
    enAzIki: 'En az 2 karakter yaz.',
    bulunamadi: 'Kimse bulunamadı.',
    ipucu: 'Tanıdığın birini kullanıcı adıyla ya da ismiyle arayabilirsin.',
  },

  baglar: {
    baslik: 'Arkadaşlar',
    arkadasliktanCikar: 'Arkadaşlıktan çıkar',
    bosArkadas: 'Henüz arkadaşın yok',
    engelle: 'Engelle',
  },
  mesajlar: {
    baslik: 'Mesajlar',
    bosBaslik: 'Henüz bir konuşman yok',
    silinmisKullanici: 'Silinmiş kullanıcı',
    gizle: 'Gizle',
    istekler: 'İstekler',
    istekRozeti: 'İstek',
  },
  mesajIstekleri: {
    baslik: 'İstekler',
    aciklama:
      'Arkadaşın olmayan kişilerden gelen mesajlar burada bekler. Cevap yazarsan sohbet Mesajlar’a taşınır.',
    bosBaslik: 'Bekleyen istek yok',
    bosAciklama: 'Arkadaşın olmayan biri sana yazarsa mesajı burada görürsün.',
    kabul: 'Kabul et',
    reddet: 'Reddet',
    geri: 'Mesajlar',
  },

  anaSayfa: {
    aramaYerTutucu: 'Ara',
    baslik: 'slooin',
    suAnBurada: 'şu an burada',
    bosBaslik: 'Akışın henüz boş',
    bosAciklama:
      'Bir yere check-in yap ya da birileriyle arkadaş ol; onların check-inleri burada görünür.',
    kesfet: 'Mekanları keşfet',
    azOnce: 'az önce',
    dakika: '{{sayi}} dakika önce',
    saat: '{{sayi}} saat önce',
    gun: '{{sayi}} gün önce',
    silOnay: 'Bu check-in kalıcı olarak silinsin mi?',
    silAriza: 'Check-in silinemedi.',
  },

  kullanici: {
    bulunamadi: 'Bu profil bulunamadı',
    aniSayisi: '{{sayi}} anı',
    takipEt: 'Takip et',
    istegiGeriCek: 'İsteği geri çek',
    bagiKopar: 'Arkadaşlıktan çıkar',
    sohbetIste: 'Sohbet iste',
    istekGonderildi: 'İstek gönderildi',
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
    engelleOnayi:
      'Engellersen birbirinizi hiçbir yerde göremezsiniz ve aranızdaki bütün mesajlar kalıcı olarak silinir. Bu işlem geri alınamaz.',
    engelleEvet: 'Evet, engelle',
    vazgec: 'Vazgeç',
    geri: 'Geri',
  },

  profilDuzenle: {
    baslik: 'Profilini düzenle',
    adEtiket: 'Ad ve soyad',
    adYerTutucu: 'Adın ve soyadın',
    adHata: 'Adını ve soyadını yaz.',
    kullaniciAdiEtiket: 'Kullanıcı adı',
    biyografiEtiket: 'Biyografi',
    biyografiYerTutucu: 'Kendinden kısaca bahset',
    kaydediliyor: 'Kaydediliyor…',
    kaydedildi: 'Profilin güncellendi.',
  },

  ayarlar: {
    baslik: 'Ayarlar',
    geri: 'Geri',

    bolumHesap: 'Hesabın',
    profiliDuzenle: 'Profilini düzenle',
    kullaniciAdi: 'Kullanıcı adı',
    profilGizli: 'Profilim gizli',
    profilGizliAciklama:
      'Açıkken anıların ve check-in’lerin yalnızca arkadaşlarına görünür. Adın, kullanıcı adın ve fotoğrafın herkese açık kalır; böylece seni bulup arkadaşlık isteği gönderebilirler.',
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
    yerSayisi: 'Yer',
    duzenle: 'Profili düzenle',
    paylas: 'Paylaş',
    paylasilamadi: 'Paylaşım bu cihazda açılamadı.',
    sekmeAnilar: 'Anılar',
    sekmeYerler: 'Yerler',
    kezSayisi: '{{sayi}} kez',
    bosYerBaslik: 'Henüz bir yere gitmedin',
    bosYerAciklama: 'Check-in yaptıkça en çok gittiğin yerler burada sıralanır.',
    ayarlar: 'Ayarlar',
    fotografEkle: 'Profil fotoğrafı ekle',
    fotografiBuyut: 'Profil fotoğrafını büyüt',
    fotografKaldir: 'Fotoğrafı kaldır',
    fotografKaldirOnay: 'Fotoğrafın kaldırılsın mı?',
    kapat: 'Kapat',
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
    // DOGRULAMA ARTIK E-POSTA ILE (kullanicinin karari 2026-09-01).
    geri: 'Geri',
    baslik: 'E-postanı doğrula',
    aciklama: '{{eposta}} adresine 6 haneli bir kod gönderdik.',
    kodEtiketi: 'Doğrulama kodu',
    gonder: 'Doğrula',
    gonderiliyor: 'Doğrulanıyor…',
    kodGelmedi: 'Kod gelmedi mi?',
    // Spam klasoru gercek bir sorun: dogrulama postalari siklikla
    // oraya duesuyor ve kullanici kodu hic gormeden vazgeciyor.
    spamNotu: 'Gelen kutunda yoksa spam klasörüne de bak.',
    tekrarGonder: 'Tekrar gönder',
    tekrarBekle: '{{saniye}} sn sonra tekrar gönderebilirsin',
    tekrarGonderildi: 'Yeni kod gönderildi.',
    hakKalmadi: 'Bu adres için çok fazla kod istendi. Bir saat sonra tekrar deneyebilirsin.',
    hataEksik: 'Kodu eksiksiz gir.',
    zatenKayitliBaslik: 'Bu adreste zaten bir hesap var',
    zatenKayitliAciklama:
      '{{eposta}} adresiyle daha önce hesap oluşturulmuş. Şifrenle giriş yapabilirsin.',
    girisYap: 'Giriş yap',
    baskaNumara: 'Başka bir adresle devam et',
  },

  kesfet: {
    // Listedeki satir dugmesi: dar alanda duruyor, kisa olmali.
    satirCheckIn: 'Check-in',
    sakin: 'Sakin',
    sekmeAra: 'Mekan ara',
    sekmeKesfet: 'Keşfet',
  },

  checkInHaritasi: {
    geri: 'Geri',
    haritaAcikla: 'Haritaya dokunarak yol tarifi al',
    // Dugme ZATEN yol tarifi aciyordu (Apple'da daddr, Google'da
    // dir/?api=1); metin ne yaptigini soylemiyordu. Kullanicinin
    // duzeltmesi 2026-09-01.
    haritadaAc: 'Yol tarifi al',
    secimBaslik: 'Hangi haritayla açalım?',
    appleHaritalar: 'Apple Haritalar',
    googleHaritalar: 'Google Haritalar',
    vazgec: 'Vazgeç',
  },

  giris: {
    // GIRIS ARTIK E-POSTA ILE (kullanicinin karari 2026-09-01).
    epostaYerTutucu: 'E-posta adresi',
    sifreYerTutucu: 'Şifre',
    gonder: 'Giriş yap',
    gonderiliyor: 'Giriş yapılıyor…',
    kayitOl: 'Yeni hesap oluştur',
    hataEposta: 'Geçerli bir e-posta adresi gir.',
    hataBos: 'E-posta adresini ve şifreni gir.',
  },
} as const
