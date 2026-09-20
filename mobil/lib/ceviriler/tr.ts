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
  // HUKUKI EKRANLAR (i18n E asamasi, 2026-09-13): basliklar ve
  // "Turkce metin esastir" notu. Belgelerin kendisi lib/hukuki/ altinda.
  hukuki: {
    gizlilikBaslik: 'Gizlilik metni',
    kosullarBaslik: 'Kullanım koşulları',
    sonGuncelleme: 'Son güncelleme: {{tarih}}',
    ustunlukNotu: 'Bu belgenin bağlayıcı metni Türkçedir; çeviri bilgilendirme amaçlıdır.',
  },

  ortak: {
    devam: 'Devam et',
    iptal: 'İptal',
    tumunuSec: 'Tümünü seç',
    temizle: 'Temizle',
    kaydet: 'Kaydet',
    tekrarDene: 'Tekrar dene',
    yukleniyor: 'Yükleniyor…',
    birSorunOldu: 'Bir sorun oluştu.',
    // Ag hatasi - ekranlarda tek metin (2026-09-13, i18n turu).
    agYok: 'İnternet bağlantısı yok, tekrar dene',
    gonder: 'Gönder',
    gonderiliyor: 'Gönderiliyor…',
    tamam: 'Tamam',
    sira: '{{sira}}. sıra',
    sil: 'Sil',
    vazgec: 'Vazgeç',
    geri: 'Geri',
    kapat: 'Kapat',
    ara: 'Ara',
    sonucYok: 'Sonuç yok.',
  },

  karsilama: {
    // ACILIS EKRANI - kullanicinin 2026-09-08'de gonderdigi referans
    // gorsele gore yeniden yazildi.
    baslik: 'Yakınında kim var, ',
    baslikVurgu: 'keşfet.',
    aciklama: 'Check-in yap, yeni insanlarla tanış.\nYakınındaki popüler yerleri keşfet.',

    // Sahnedeki igne etiketleri ve sayilari. Bunlar ORNEK bir sahnedir,
    // veri degildir - referans gorseldeki kompozisyonun parcasi.
    kisiSayisi: '{{sayi}} kişi',
    disarida: 'Yakınında {{sayi}} kişi dışarıda',
    turKafe: 'Kafe',
    turRestoran: 'Restoran',
    turBar: 'Bar',

    // Dort tanitim karti: baslik + tek satirlik aciklama.
    adim1Baslik: 'Check-in Yap',
    adim1Aciklama: 'Bulunduğun mekanda görün',
    adim2Baslik: 'Yakınında kimler var',
    adim2Aciklama: 'Aynı yerdeki insanları keşfet',
    adim3Baslik: 'Sohbet Et',
    adim3Aciklama: 'Yeni insanlarla tanış',
    adim4Baslik: 'Popüler yerleri keşfet',
    adim4Aciklama: 'Şehrindeki trend mekanları gör',

    hesapOlustur: 'Hesap oluştur',
    hesabinVarMi: 'Hesabın var mı?',
    girisYap: 'Giriş yap',
    // Yol agi OpenStreetMap verisinden turetildi; ODbL atfi sart.
    haritaAtfi: 'Harita verisi © OpenStreetMap katkıcıları',

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
    // HUKUKI BILGILENDIRME BU EKRANDAN KALDIRILDI (kullanicinin karari
    // 2026-09-13): yalnizca hesabin GERCEKTEN olustugu son adimda
    // (profil olusturma, adim 3) duruyor ve orada iki bagl antiyla
    // okunabiliyor. Ispat kaydi (kvkk_onaylari) zaten o adimda
    // yaziliyordu, degismedi.
  },

  profilOlustur: {
    baslik: 'Hesap oluştur',

    adYerTutucu: 'Adın ve soyadın',
    adHata: 'Adını ve soyadını yaz.',

    dogumEtiket: 'Doğum tarihin',
    // Etiket zaten "Doğum tarihin" diyor; yer tutucu ayni metni
    // tekrar etmesin, ne bicimde beklendigini soylesin.
    dogumSec: 'Gün / Ay / Yıl',
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
    // Bicim kurali artik adim basliginin altinda (adim2Aciklama); bu
    // metin yalnizca HATA olarak, kutunun altinda gorunuyor.
    kullaniciAdiIpucu: 'Kullanıcı adı bu biçime uymuyor.',
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


    // UC ADIM (kullanicinin secimi 2026-09-04): bes alan tek ekranda
    // degil, uc kisa adimda soruluyor. Her adimin kendi basligi ve tek
    // cumlelik aciklamasi var.
    adimSayaci: 'Adım {{simdiki}} / {{toplam}}',

    adim1Baslik: 'Seni tanıyalım',
    adim1Aciklama: 'Adın profilinde görünür. Doğum tarihin kimseye gösterilmez.',
    adEtiket: 'Adın ve soyadın',
    adOrnek: 'Örn. Deniz Yılmaz',
    // Yas kurali ARTIK ONCEDEN soyleniyor. Onceden yalnizca hata
    // metninde vardi; 18 yasindan kucuk biri butun formu doldurup en
    // sonda ogreniyordu.
    yasNotu: 'Slooin 18 yaş ve üzeri içindir.',

    adim2Baslik: 'Kullanıcı adını seç',
    // Kullanicinin istegi (2026-09-13): "Insanlar seni bu adla bulacak..."
    // satiri kalkti, yerine bicim kurali basliga tasindi; kutunun
    // altindaki tekrar da kaldirildi.
    adim2Aciklama: '3-20 karakter; küçük harf, rakam, nokta ve alt çizgi içerebilir.',
    kullaniciAdiEtiket: 'Kullanıcı adın',

    // BOLGE ADIMI (2026-09-18): ulke -> il -> ilce; ZORUNLU. Aksam karari: profilde HIC gosterilmez, gizleme ayari yok, yalnizca veri.
    adim3Baslik: 'Oturduğun bölge',
    adim3Aciklama: 'Profilinde gösterilmez; yalnızca hesabınla birlikte saklanır.',
    bolgeUlkeEtiket: 'Ülke',
    bolgeUlkeSec: 'Ülke seç',
    bolgeIlEtiket: 'İl ve ilçe',
    bolgeIlSec: 'İl seç',
    bolgeIlceSec: 'İlçe seç',
    bolgeYalnizcaUlke: 'Bu ülke için il ve ilçe listesi yok; yalnızca ülke kaydedilir.',
    bolgeHata: 'İl ve ilçeni seç.',

    adim4Baslik: 'Şifreni belirle',
    adim4Aciklama: 'Hesabına bu şifreyle gireceksin.',
    sifreUygun: 'Şifre yeterince uzun.',
    sifrelerAyni: 'Şifreler eşleşiyor.',

    devam: 'Devam',
    // HUKUKI BILGILENDIRME YALNIZCA BURADA (kullanicinin karari
    // 2026-09-13); kayit ekranindaki kopyasi kaldirildi. Iki parca
    // BAGLANTI: Kullanim kosullari -> /kosullar, Gizlilik Politikasi ->
    // /gizlilik. Metin uc parcaya bolundu ki baglantilar ayri
    // dokunulabilir olsun.
    sozlesmeNotuOn: 'Hesabı oluşturarak ',
    sozlesmeKosullar: 'Kullanım koşullarını',
    sozlesmeNotuOrta: ' kabul ettiğini ve ',
    sozlesmeGizlilik: 'Gizlilik Politikasını',
    sozlesmeNotuSon: ' okuduğunu onaylıyorsun.',

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

  arkadaslar: {
    baslik: 'Arkadaşlarım',
    ara: 'İsim veya kullanıcı adı ara',
    sayi: '{{sayi}} arkadaş',
    profiliGor: 'Profili gör',
    mesajGonder: 'Mesaj gönder',
    davetBaslik: 'Arkadaşlarınla keşfet',
    davetMetin: "Slooin'e arkadaşlarını davet et.",
    davetDugme: 'Arkadaş davet et',
    davetMesaji: "Slooin'de bana katıl 👋",
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
    sil: 'Sil',
    istekler: 'İstekler',
    istekRozeti: 'İstek',
    silBaslik: 'Konuşmayı sil',
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
  // HESABI SIL EKRANI (i18n turu 2026-09-13; iki paragraf ASCII'ydi).
  hesabiSil: {
    baslik: 'Hesabı sil',
    soru: 'Hesabını silmek istediğine emin misin?',
    uyari: 'Bu işlem geri alınamaz. Yeniden katılmak istersen yeni bir hesap oluşturman gerekir.',
    araSoru: 'Sadece ara vermek mi istiyorsun?',
    dondur: 'Hesabımı dondur',
    dogrulaBaslik: 'Kimliğini doğrula',
    dogrulaAciklama: 'Silme işlemine devam etmek için hesabını doğrula.',
    epostaEtiket: 'E-posta adresin',
    kodNot: '6 haneli kod bu adrese gönderilir.',
    gizliAppleAdresi: '6 haneli kod, Apple hesabına bağlı e-posta adresine yönlendirilir.',
    kodGonder: 'Onay kodu gönder',
    kodGonderildi: 'Kod gönderildi; 10 dakika geçerli.',
    kodYerTutucu: '6 haneli kod',
    kodEksik: '6 haneli kodun tamamını gir.',
    tekrarGonder: 'Kodu tekrar gönder',
    epostaYok: 'Hesabında e-posta adresi yok. destek@slooin.com adresine yaz.',
    appleIleDogrula: 'Apple ile onayla',
    googleIleDogrula: 'Google ile onayla',
    sil: 'Hesabımı kalıcı olarak sil',
  },
  // SOHBET EKRANI (i18n turu 2026-09-13).
  sohbet: {
    baslik: 'Sohbet',
    istekSeridi: "Bu bir mesaj isteği. Cevap yazarsan sohbet Mesajlar'a taşınır.",
    kabulEt: 'Kabul et',
    reddet: 'Reddet',
    mesajYok: 'Henüz mesaj yok',
    yerTutucu: 'Bir mesaj yaz...',
    kapaliKapi: 'Bu kişiye şu an mesaj gönderemezsin.',
    teslimEdildi: 'Teslim edildi',
    bugun: 'Bugün',
    dun: 'Dün',
  },

  etkilesim: {
    profiliGor: '{{ad}} profilini gör',
    begen: 'Beğen',
    begeniyiKaldir: 'Beğeniyi kaldır',
    yorumlar: 'Yorumlar',
    yorumSayisi: '{{sayi}} yorum',
    yorumYaz: 'Yorum yaz…',
    gonder: 'Gönder',
    paylas: 'Paylaş',
    yorumSil: 'Yorumu sil',
    yorumSilOnay: 'Bu yorum silinsin mi?',
    yorumSikayet: 'Şikâyet et',
    // Sikayet edilen yorum ANINDA gizleniyor (kullanicinin karari); bu
    // metin ne olacagini onceden soyluyor, sonradan degil.
    yorumSikayetOnay:
      'Bu yorum şikâyet edilsin mi? Şikâyet edilen yorum hemen gizlenir ve moderasyon ekibi inceler.',
    yorumSikayetEdildi: 'Şikâyetin alındı, yorum gizlendi.',
    bosYorumBaslik: 'Henüz yorum yok',
    bosYorumAciklama: 'İlk yorumu sen yazabilirsin.',
    silinmisKullanici: 'Silinmiş kullanıcı',
  },

  anaSayfa: {
    birlikte: 'Birlikte',
    aramaYerTutucu: 'Ara',
    // "SU AN DISARIDA" SERIDI (2026-09-07, referans gorselden).
    suAnDisarida: 'Şu an dışarıda',
    disaridaSayi: '{{sayi}} kişi',
    disaridaDiger: 'Diğer',
    disaridaErisim: '{{ad}}, {{mekan}} konumunda',
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
    // Onay penceresinin kisa bilgilendirmesi: geri alinamayan
    // islemde ne kaybedildigi ONCEDEN yaziyor.
    silAciklama:
      'Check-in, notu ve fotoğrafı kalıcı olarak silinir. Anılarında da kalmaz; bu işlem geri alınamaz.',
    silAriza: 'Check-in silinemedi.',
    haritadaGor: '{{ad}} konumunu haritada gör',
    // UC NOKTA MENUSU (kullanicinin karari 2026-09-02): baslikta tek
    // ikon var, silme de duzenleme de onun icinde.
    secenekler: 'Paylaşım seçenekleri',
    fotografiBuyut: 'Fotoğrafı büyüt',
    duzenle: 'Düzenle',
    arkadasEtiketle: 'Arkadaş etiketle',
    duzenleBaslik: 'Paylaşımı düzenle',
    notEtiketi: 'Not',
    notYerTutucu: 'Bir not ekle',
    etiketlenenler: 'Etiketlenenler',
    // Mekan ve zamanin neden kapali oldugu ekranda YAZIYOR; kullanici
    // eksik bir ozellik sanmasin.
    etiketiKaldirEtiketi: '{{ad}} etiketini kaldır',
    duzenleAriza: 'Paylaşım güncellenemedi.',
  },

  kullanici: {
    bulunamadi: 'Bu profil bulunamadı',
    // "Takip et" -> "Arkadaş ekle" (kullanicinin istegi 2026-09-08).
    // Ekran metninde iliski "takip" ya da "bag" degil ARKADASLIK.
    takipEt: 'Arkadaş ekle',
    // Istek gonderildikten sonra birincil dugmenin yerini alan DURUM.
    // Basilamaz: karar karsi tarafta.
    istekBeklemede: 'Beklemede',
    istegiGeriCek: 'İsteği geri çek',
    geriCekOnayi: 'Arkadaşlık isteğini geri çekmek istiyor musun?',
    geriCekEvet: 'Evet, geri çek',
    bagiKopar: 'Arkadaşlıktan çıkar',
    gelenIstekAciklama:
      "Kabul edersen birbirinizin check-in'lerini görebilir ve mesajlaşabilirsiniz.",
    kabulEt: 'Kabul et',
    reddet: 'Reddet',
    anilar: 'Anılar',
    enSik: 'En sık',
    aniYok: 'Henüz bir anısı yok',
    // KAPALI PROFIL: kisi "profilim gizli" demis ve aranizda arkadaslik
    // yok. Ekran duzeni AYNI kaliyor, yalnizca icerik kapali.
    profilKapali: 'Bu profil kapalı',
    profilKapaliAciklama: 'Anılarını görmek için arkadaş olmalısın.',
    yerYok: 'Henüz bir yeri yok',
    fotografYok: 'Henüz fotoğrafı yok',
    arkadasYok: 'Henüz arkadaşı yok',
    secenekler: 'Profil seçenekleri',
    sikayetEt: 'Şikâyet et',
    sikayetEttinNotu: 'Bu kullanıcıyı şikâyet ettin',
    sikayetEttinAciklama: 'Şikâyetin inceleniyor. Aynı kullanıcı için yeniden şikâyet gönderemezsin.',
    engelle: 'Engelle',
    engelleOnayi:
      'Engellersen birbirinizi hiçbir yerde göremezsiniz ve aranızdaki bütün mesajlar kalıcı olarak silinir. Bu işlem geri alınamaz.',
    engelleEvet: 'Evet, engelle',
    vazgec: 'Vazgeç',
    geri: 'Geri',
    fotografiAc: 'Fotoğrafı büyüt',
    mesajYaz: 'Mesaj yaz',
    arkadassin: 'Arkadaşsın',
    paylas: 'Profili paylaş',
    paylasMetni: '{{ad}} Slooin\'de: @{{kullaniciAdi}}',
  },

  profilDuzenle: {
    // "Profilini" -> "Profili" (kullanicinin istegi 2026-09-11).
    // Profil ekranindaki dugme zaten "Profili düzenle" diyor; ayni
    // eylemin iki farkli adi olmasin.
    baslik: 'Profili düzenle',
    adEtiket: 'Ad ve soyad',
    adYerTutucu: 'Adın ve soyadın',
    adHata: 'Adını ve soyadını yaz.',
    kullaniciAdiEtiket: 'Kullanıcı adı',
    biyografiEtiket: 'Biyografi',
    biyografiYerTutucu: 'Kendinden kısaca bahset',
    // INSTAGRAM BEYAN, DOGRULAMA DEGIL (2026-09-11). Ipucu bunu ACIKCA
    // soyluyor: Meta kisisel hesaplar icin OAuth yolunu kapatti, yani
    // "bu gercekten onun hesabi" garantisini veremiyoruz. Kullaniciya
    // dogrulanmis bir bag izlenimi vermek yanlis olurdu.
    instagramEtiket: 'Instagram',
    instagramYerTutucu: 'kullanıcı adın',
    instagramIpucu:
      'Bağlantı da yapıştırabilirsin. Doğrulanmaz; profilinde bağlantı olarak görünür.',
    // YASADIGIN BOLGE (2026-09-11). OPSIYONEL ve bu ekranda da
    // yaziyor: kisi konumunu paylasmak zorunda degil.
    instagramHata:
      'Instagram kullanıcı adı harf, rakam, nokta ve alt çizgiden oluşur; nokta ile başlayamaz ya da bitemez.',
    kaydediliyor: 'Kaydediliyor…',
    kaydedildi: 'Profilin güncellendi.',
  },

  ayarlar: {
    baslik: 'Ayarlar',
    geri: 'Geri',

    profilGizli: 'Profilim gizli',
    profilGizliAciklama:
      'Açıkken anıların ve check-in’lerin yalnızca arkadaşlarına görünür. Adın, kullanıcı adın ve fotoğrafın herkese açık kalır; böylece seni bulup arkadaşlık isteği gönderebilirler.',
    // ERISIM HAKKI (KVKK m.11, 2026-09-11). Gizlilik metninin hemen
    // yaninda duruyor: ikisi de "verim ne oluyor" sorusunun cevabi.
    verilerimiIndir: 'Verilerimi indir',
    verilerimiIndirHazirlaniyor: 'Hazırlanıyor…',
    verilerimiIndirHata: 'Veriler hazırlanamadı. Tekrar dene.',
    gizlilikMetni: 'Gizlilik metni',

    bolumGorunurluk: 'Gizlilik ayarları',
    // ETIKET ONAYI (kullanicinin karari 2026-09-06). Varsayilan
    // KAPALI: arkadasin seni direk etiketleyebiliyor.
    etiketOnayi: 'Etiketlemeden önce bana sor',
    etiketOnayiAciklama:
      'Kapalıyken arkadaşların seni doğrudan etiketleyebilir. Açtığında etiket önce sana sorulur; onaylayana kadar kimse görmez.',
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
    cikisOnayBaslik: 'Çıkış yapılsın mı?',
    cikisOnayAciklama: 'Hesabından çıkış yapacaksın. İstediğin zaman tekrar giriş yapabilirsin.',

    secilmedi: 'Seçilmedi',
  },

  // ADI YANILTICI KALDI: ortada bir EKRAN yok. `/profil/kullanici-adi`
  // 2026-09-12'de silindi (ayarlardaki tek girisi kaldirilinca oksuz
  // kaldi) ve kullanici adi duzenlemesi `profil/duzenle` icinde SATIR
  // ICI yapiliyor. Kalan iki anahtari o ekran kullaniyor; ekrana ait
  // bes anahtar (baslik, geri, mevcut, kaydet, guncellendi) silindi.
  // Yeniden adlandirma bu isin kapsami disindaydi - ayni durum
  // `SekmeHapi` bileseninde de var.
  kullaniciAdiEkrani: {
    yerTutucu: 'Yeni kullanıcı adı',
    sonrakiDegisim: 'Tekrar değiştirebileceğin tarih: {{tarih}}',
  },

  engellenenler: {
    baslik: 'Engellenen kişiler',
    engeliKaldir: 'Engeli kaldır',
    bosBaslik: 'Kimseyi engellemedin',
    bosAciklama: 'Birini engellersen burada görünür ve buradan geri alabilirsin.',
    geri: 'Geri',
    altBaslik: 'Engellediğin kişiler sana mesaj veya arkadaşlık isteği gönderemez.',
    engellendi: 'Engellendi',
  },

  profil: {
    yerSayisi: 'Yer',
    duzenle: 'Profili düzenle',
    paylas: 'Paylaş',
    paylasMetni: 'Slooin\'de beni ekle 👋',
    paylasilamadi: 'Paylaşım bu cihazda açılamadı.',
    sekmeAnilar: 'Anılar',
    // Sekme adi "Yerler" -> "En sık" (kullanicinin karari 2026-09-05).
    // Liste zaten en cok gidilenden siralaniyor; yeni ad ne oldugunu
    // dogrudan soyluyor.
    sekmeYerler: 'En sık',
    sekmeFotograflar: 'Fotoğraflar',
    // "Yer" sayaci kalkti, yerine bu geldi (kullanicinin istegi
    // 2026-09-05). Yer bilgisi kaybolmadi - "En sık" sekmesi duruyor.
    fotografSayisi: 'Fotoğraf',
    bosFotografBaslik: 'Henüz fotoğrafın yok',
    bosFotografAciklama: 'Check-in yaparken fotoğraf eklersen hepsi burada toplanır.',
    bosArkadasBaslik: 'Henüz arkadaşın yok',
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
    bagSayisi: 'Arkadaş',
    canliEtiket: 'Şu an buradasın',
    ayril: 'Ayrıl',
    canliSil: 'Sil',
    canliSilOnay: 'Bu check-in kalıcı olarak silinsin mi? Anılarında da kalmaz.',
    bosCanliBaslik: 'Şu an bir yerde değilsin',
    bosCanliAciklama:
      'Bulunduğun yere check-in yap, tam o anda orada olan insanları gör.',
    checkInYap: 'Bir yere check-in yap',
    anilarBaslik: 'Anılar',
    bosAniBaslik: 'Henüz bir anın yok',
    bosAniAciklama: 'Check-in’lerin burada bir anı olarak kalır.',
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

  // ALT GEZINME (i18n turu 2026-09-13).
  altGezinme: {
    anaSayfa: 'Ana sayfa',
    bildirimler: 'Bildirimler',
    mesajlar: 'Mesajlar',
    profil: 'Profil',
  },
  // ARKADAS SECICI (check-in etiketleme, i18n turu 2026-09-13).
  // HESAP VE GUVENLIK (kullanicinin referans gorselleri 2026-09-18).
  // GIZLILIK VE ETKILESIM (kullanicinin referans gorselleri 2026-09-18).
  gizlilikEtkilesim: {
    bolum: 'Gizlilik ve etkileşim',
    gizlilik: 'Gizlilik',
    gizlilikAciklama: 'Profil, etiketler ve engellenenler',
    konum: 'Konum ve check-in',
    konumAciklama: 'Konum izni ve mekânda görünürlük',
    bildirimler: 'Bildirimler',
    bildirimlerAciklama: 'Mesajlar, arkadaşlar ve anılar',
    gizlilikAlt: 'Neyi, kimlerle paylaştığına sen karar ver.',
    kartBaslik: 'Paylaşımın sınırlarını sen belirle',
    kartMetin: 'Her tercih, neyin görüneceğini açıkça söyler.',
    gorunurlugun: 'Görünürlüğün',
    profilGorunurlugu: 'Profil görünürlüğü',
    profilGorunurluguAciklama: "Anıların ve check-in'lerin",
    herkeseAcik: 'Herkese açık',
    sadeceArkadaslar: 'Sadece arkadaşlar',
    aramaGorunurlugu: 'Aramada görünürlük',
    aramaGorunurluguAciklama: 'Kullanıcı adınla bulunabilirsin',
    acik: 'Açık',
    kapali: 'Kapalı',
    sosyalIzinlerin: 'Sosyal izinlerin',
    etiketler: 'Etiketler',
    etiketlerAciklama: 'Onay ve bekleyen etiketler',
    onayli: 'Onaylı',
    otomatik: 'Otomatik',
    mesajIzinleri: 'Mesaj izinleri',
    mesajIzinleriAciklama: 'Sana kimler mesaj gönderebilir?',
    herkes: 'Herkes',
    arkadaslar: 'Arkadaşlar',
    engellenenKisiler: 'Engellenen kişiler',
    engellenenAciklama: 'Engelleri görüntüle ve yönet',
    konumAlt: 'Konum izni ve mekânda nasıl göründüğün.',
    konumIzni: 'Konum izni',
    konumIzniAciklama: 'Yakınındaki mekânlar ve check-in için gerekli',
    izinVerildi: 'Verildi',
    izinYok: 'Verilmedi',
    ayarlariAc: 'Ayarları aç',
    mekandaGorunurluk: 'Mekânda görünürlük',
    mekandaGorunurlukAciklama: 'Check-in yaptığında mekânda kim görsün',
    kimse: 'Kimse',
    mesajIzinleriAlt: 'Sana kimlerin yeni mesaj gönderebileceğini seç.',
    herkesAciklama: 'Arkadaşın olmayan kişiler de mesaj isteği gönderebilir.',
    yalnizcaArkadaslarim: 'Yalnızca arkadaşlarım',
    yalnizcaArkadaslarimAciklama: 'Yeni konuşmaları yalnızca arkadaşların başlatabilir.',
    hicKimse: 'Hiç kimse',
    hicKimseAciklama: 'Yeni mesaj istekleri alma.',
    etiketOnayBaslik: 'Etiketleri önce ben onaylayayım',
    etiketOnayAciklama: 'Arkadaşların seni etiketlediğinde, onay verene kadar etiketin görünmez.',
    bekleyenEtiketler: 'Bekleyen etiketler',
    bekleyenEtiketlerAciklama: 'Onayla veya reddet',
    bekleyenYok: 'Bekleyen etiket yok.',
    profilGorunurluguAlt: "Anılarını ve check-in'lerini kimlerin göreceğini seç.",
    profilAcikAciklama: "Anıların ve check-in'lerin herkese görünür.",
    profilArkadasAciklama: 'Yalnızca arkadaşların görür. Adın, kullanıcı adın ve fotoğrafın açık kalır.',
    aramaGorunurluguAlt: 'Kişi aramasında bulunup bulunamayacağını seç.',
    aramaAcikAciklama: 'Kullanıcı adınla veya adınla aranınca çıkarsın.',
    aramaKapaliAciklama: 'Aramada çıkmazsın; yalnızca bağlantınla bulunursun.',
    etiketlerAlt: 'Arkadaşlarının seni etiketlemesini yönet.',
    mekanHerkesAciklama: 'Mekândaki herkes seni görür.',
    mekanArkadasAciklama: 'Yalnızca arkadaşların görür.',
    mekanKimseAciklama: 'Mekânda görünmezsin; check-in yine anılarına düşer.',
    konumErisimi: 'Konum erişimi',
    uygulamayiKullanirken: 'Uygulamayı kullanırken',
    izinSorulmadi: 'Henüz sorulmadı',
    konumIzniYonet: 'Konum iznini yönet',
    konumIzniYol: 'Telefonunun Ayarlar → Slooin → Konum bölümünden iznini değiştirebilirsin.',
    anladim: 'Anladım',
  },
  hesapGuvenlik: {
    satirBaslik: 'Hesap ve güvenlik',
    satirAciklama: 'E-posta, şifre ve açık oturumlar',
    bolumHesabin: 'Hesabın',
    baslik: 'Hesap ve güvenlik',
    altBaslik: 'Giriş bilgilerini ve hesabının güvenliğini yönet.',
    girisBilgilerin: 'Giriş bilgilerin',
    epostaAdresi: 'E-posta adresi',
    sifreyiDegistir: 'Şifreyi değiştir',
    sifreAciklama: 'Hesabına özel bir şifre kullan',
    guvenlik: 'Güvenlik',
    acikOturumlar: 'Açık oturumlar',
    acikOturumlarAciklama: 'Giriş yaptığın cihazları yönet',
    cihazSayisi: '{{sayi}} cihaz',
    koruBaslik: 'Hesabını koru',
    koruMetin: 'Şifreni ve doğrulama kodlarını kimseyle paylaşma.',
    epostaAlt: 'Hesabına ulaşmak için kullandığın adres.',
    mevcutAdres: 'Mevcut adres',
    yeniAdres: 'Yeni e-posta adresin',
    yeniAdresYerTutucu: 'ad@ornek.com',
    epostaNot: 'Önce mevcut adresini, ardından yeni adresini doğrulamanı isteyeceğiz. Yeni adres doğrulanana kadar giriş adresin değişmez.',
    devamEt: 'Devam et',
    epostaGecersiz: 'Geçerli bir e-posta adresi yaz.',
    epostaAyni: 'Bu zaten mevcut adresin.',
    mevcutKodBaslik: 'Mevcut adresini doğrula',
    yeniKodBaslik: 'Yeni adresini doğrula',
    kodMetin: '{{eposta}} adresine 6 haneli bir kod gönderdik.',
    kodYerTutucu: '6 haneli kod',
    dogrula: 'Doğrula',
    tekrarGonder: 'Kodu tekrar gönder',
    kodEksik: '6 haneli kodu yaz.',
    epostaDegisti: 'E-posta adresin güncellendi.',
    sifreAlt: 'Hesabına özel, güçlü bir şifre belirle.',
    mevcutSifre: 'Mevcut şifren',
    yeniSifre: 'Yeni şifren',
    yeniSifreTekrar: 'Yeni şifreni tekrar yaz',
    sifreIpucu: "En az 12 karakter kullan. Uzun ve yalnızca Slooin'de kullandığın bir şifre seç.",
    sifreGuncelle: 'Şifreyi güncelle',
    sifremiUnuttum: 'Şifremi unuttum',
    sifreNot: 'Şifren değiştiğinde diğer cihazlardaki oturumların kapatılır.',
    sifreKisa: 'Yeni şifre en az 12 karakter olmalı.',
    sifreEslesmiyor: 'Yeni şifreler birbiriyle aynı değil.',
    mevcutSifreYanlis: 'Mevcut şifren yanlış.',
    sifreDegisti: 'Şifren güncellendi. Diğer cihazlardaki oturumlar kapatıldı.',
    digerCihazlarKapatilamadi: 'Şifren güncellendi ama diğer cihazlar kapatılamadı.',
    oturumlarAlt: 'Hesabının açık olduğu cihazları kontrol et.',
    buCihaz: 'Bu cihaz',
    sonEtkinlik: 'Son etkinlik: {{zaman}}',
    digerCihazlardanCik: 'Diğer oturumlardan çıkış yap',
    cihazBilinmeyen: 'Bilinmeyen cihaz',
    oturumKapatildi: 'Oturum kapatıldı.',
    digerleriKapatildi: 'Diğer cihazlardaki oturumlar kapatıldı.',
    suAndaKullaniliyor: 'Şu anda kullanılıyor',
    kapat: 'Kapat',
    oturumNot: 'Tanımadığın bir cihaz görürsen oturumu kapatıp şifreni değiştir.',
  },
  arkadasSecici: {
    baslik: 'Arkadaşlarını etiketle',
    bos: 'Henüz arkadaşın yok. Arkadaşlık isteği gönderip kabul edildiğinde burada görünür ve check-in’lerinde etiketleyebilirsin.',
    tamamSayili: 'Tamam ({{sayi}})',
  },
  // HARITA ERISILEBILIRLIK ETIKETLERI (i18n turu 2026-09-13).
  harita: {
    cevre: 'Çevrendeki mekanlar',
    kisiBurada: '{{ad}}, {{sayi}} kişi burada',
    buMekan: 'Bu mekan, {{durum}}',
    buradasin: 'Buradasın',
    kumeEtiketi: '{{sayi}} mekân, yakınlaştırmak için dokun',
    konumaDon: 'Konumuma dön',
    adEtiketi: '{{ad}} etiketi',
  },
  // SIKAYET EKRANI (i18n turu 2026-09-13). Sebep etiketleri anahtara
  // gore: `lib/sikayet.ts` yalnizca anahtarlari tasiyor.
  sikayet: {
    sebepSec: 'Bir sebep seç',
    mesajBaglami: 'İncelemede bu mesajın çevresindeki mesajlar da moderasyona açılır.',
    baslik: 'Şikâyet et',
    kahramanBaslik: 'Bize ne olduğunu anlat',
    altBaslikHesap: 'Bu hesabı neden şikâyet ediyorsun?',
    altBaslikMesaj: 'Bu mesajı neden şikâyet ediyorsun?',
    ekAciklama: 'Ek açıklama',
    istegeBagli: 'İsteğe bağlı',
    aciklamaYerTutucu: 'Durumu kısaca açıklayabilirsin.',
    aciklamaIpucu: 'Paylaştığın bilgiler değerlendirmemize yardımcı olur.',
    fotografEkle: 'Fotoğraf ekle',
    fotografDegistir: 'Fotoğrafı değiştir',
    fotografKaldir: 'Fotoğrafı kaldır',
    fotografCek: 'Fotoğraf çek',
    galeridenSec: 'Galeriden seç',
    kameraIzni: 'Fotoğraf çekmek için kamera izni gerekiyor.',
    fotografYuklenemedi: 'Fotoğraf yüklenemedi, tekrar dene.',
    gonder: 'Şikâyeti gönder',
    alindi: 'Şikâyetin alındı',
    tesekkur: 'Bize bildirdiğin için teşekkürler.\nŞikâyetin incelenmek üzere iletildi.',
    engelleSoru: 'Bu hesabı engellemek ister misin?',
    engelleAciklama: 'Sana mesaj göndermesini ve seninle etkileşime geçmesini engelleyebilirsin.',
    hesabiEngelle: 'Hesabı engelle',
    engellendi: 'Hesap engellendi',
    tamam: 'Tamam',
    sebepler: {
      taciz: 'Taciz veya rahatsız etme',
      uygunsuz_icerik: 'Uygunsuz içerik',
      sahte_hesap: 'Sahte hesap',
      spam: 'Spam veya reklam',
      diger: 'Diğer',
    },
  },

  // ASKIDAKI / YASAKLI HESAP EKRANI (i18n turu 2026-09-13; metinler
  // onceden ASCII'ydi, karar 74 ihlali de burada kapandi).
  hesapDurumu: {
    askida: 'Hesabın askıya alındı',
    yasakli: 'Hesabın kalıcı olarak kapatıldı',
    sebep: 'Sebep: {{sebep}}',
    bitis: 'Bitiş: {{tarih}}',
    ipucu: 'Bu süre boyunca profilin başkalarına görünmez ve yeni içerik paylaşamazsın. Verilerin silinmedi.',
    yenile: 'Yenile',
    cikisYapilamadi: 'Çıkış yapılamadı',
  },

  // CHECK-IN EKRANI - metinler 2026-09-13'e kadar koda gomuluydu
  // (i18n turu). Ilk kullanim uyarisi 2026-09-18'de kaldirildi.
  checkIn: {
    baslik: 'Yeni check-in',
    notYerTutucu: 'Bir not ekle (opsiyonel)',
    arkadasEkle: 'Arkadaş ekle (opsiyonel)',
    arkadasEkleSecili: 'Arkadaş ekle ({{sayi}} seçili)',
    etiketiKaldir: '{{ad}} etiketini kaldır',
    fotografEkle: 'Fotoğraf ekle (opsiyonel)',
    fotografDegistir: 'Fotoğrafı değiştir',
    fotografCek: 'Fotoğraf çek',
    galeridenSec: 'Galeriden seç',
    kameraIzni: 'Fotoğraf çekmek için kamera izni gerekiyor.',
    fotografYuklenemedi: 'Fotoğraf yüklenemedi, notunla check-in yapıldı',
    etiketlenemedi: 'Check-in yapıldı ama arkadaşların etiketlenemedi.',
    gonder: 'Check-in yap',
    gonderiliyor: 'Check-in yapılıyor...',
  },

  // MEKAN BILGILERINI DUZELT (i18n turu 2026-09-13).
  mekanDuzenle: {
    baslik: 'Bilgileri düzelt',
    aciklama: 'Yanlış bir bilgi mi var? Düzeltmen moderatöre gider; onaylanınca herkes için güncellenir.',
    gonderildiBaslik: 'Talebin gönderildi',
    gonderildiMetin: 'Moderatör inceleyip onayladığında mekân bilgileri güncellenecek.',
    bekleyenBaslik: 'Bekleyen talebin var',
    bekleyenMetin: 'Bu mekân için gönderdiğin talep hâlâ inceleniyor. Sonuçlanınca yeni bir düzeltme gönderebilirsin.',
    adEtiket: 'Mekân adı',
    adYerTutucu: 'Mekânın adı',
    mahalle: 'Mahalle',
    mahalleYerTutucu: 'Örnek: Alaaddinbey',
    adres: 'Adres',
    adresYerTutucu: 'Cadde, sokak, numara',
    il: 'İl',
    ilYerTutucu: 'Bursa',
    ilce: 'İlçe',
    ilceYerTutucu: 'Nilüfer',
    tur: 'Tür',
    kapakFotografi: 'Kapak fotoğrafı',
    fotografiKaldir: 'Fotoğrafı kaldır',
    fotografEkle: 'Fotoğraf ekle',
    fotografSecilemedi: 'Fotoğraf seçilemedi.',
    galeriIzni: 'Galeriden seçmek için fotoğraf izni gerekiyor.',
    oturumYok: 'Oturum bulunamadı',
    zatenKapali: 'Bu mekân kalıcı olarak kapandı olarak işaretli.',
    kapaliBaslik: 'Burası kalıcı olarak kapandı',
    kapaliAciklama: "Onaylanırsa bu mekân listelerden ve aramadan kaldırılır. Buraya yapılmış check-in'ler silinmez.",
    onceDegistir: 'Önce bir bilgiyi değiştir.',
    talebiGonder: 'Talebi gönder',
  },

  // YENI MEKAN EKLE (i18n turu 2026-09-13).
  mekanEkle: {
    baslik: 'Yeni mekan ekle',
    adYerTutucu: 'Mekan adı',
    turuSec: 'Türü seç',
    adresYerTutucu: 'Adres (opsiyonel)',
    adresSoru: 'Bu adres doğru mu?',
    adresAciklama: 'Konumundan bulundu. Yanlışsa yukarıdaki alanı düzeltebilirsin.',
    dogru: 'Doğru',
    benzerBaslik: 'Bunlardan biri mi demek istedin?',
    konumAlinamadi: 'Konum alınamadı, tekrar dene',
    adVeTurGerekli: 'Mekan adı ve türü gerekli',
    ekle: 'Ekle',
    ekleniyor: 'Ekleniyor...',
  },

  // MEKAN TURLERI (i18n turu 2026-09-13): anahtar VERITABANI DEGERI,
  // deger ekranda gorunen etiket. Turkce'de ikisi ayni. Liste
  // `lib/mekan.ts` TEMEL_TUR_GRUPLARI + `mekanlar/ekle` listesi.
  turGruplari: {
    'Yeme içme': 'Yeme içme',
    'Gece': 'Gece',
    'Açık alan': 'Açık alan',
    'Kültür': 'Kültür',
    'Spor': 'Spor',
    'Alışveriş': 'Alışveriş',
    'Diğer': 'Diğer',
  },
  turler: {
    'Kafe': 'Kafe',
    'Kahveci': 'Kahveci',
    'Çay evi': 'Çay evi',
    'Restoran': 'Restoran',
    'Lokanta': 'Lokanta',
    'Türk mutfağı': 'Türk mutfağı',
    'Kebapçı': 'Kebapçı',
    'Balık restoranı': 'Balık restoranı',
    'Ocakbaşı': 'Ocakbaşı',
    'Kahvaltı salonu': 'Kahvaltı salonu',
    'Fırın': 'Fırın',
    'Fast food': 'Fast food',
    'Burgerci': 'Burgerci',
    'Pizzacı': 'Pizzacı',
    'Tatlıcı': 'Tatlıcı',
    'Dondurmacı': 'Dondurmacı',
    'Bar': 'Bar',
    'Pub': 'Pub',
    'Gece kulübü': 'Gece kulübü',
    'Meyhane': 'Meyhane',
    'Nargile kafe': 'Nargile kafe',
    'Kokteyl barı': 'Kokteyl barı',
    'Park': 'Park',
    'Halk bahçesi': 'Halk bahçesi',
    'Doğal alan': 'Doğal alan',
    'Plaj': 'Plaj',
    'Meydan': 'Meydan',
    'Kamp alanı': 'Kamp alanı',
    'Göl': 'Göl',
    'Müze': 'Müze',
    'Sinema': 'Sinema',
    'Tiyatro': 'Tiyatro',
    'Sanat galerisi': 'Sanat galerisi',
    'Kütüphane': 'Kütüphane',
    'Tarihi yer': 'Tarihi yer',
    'Konser salonu': 'Konser salonu',
    'Kültür merkezi': 'Kültür merkezi',
    'Spor salonu': 'Spor salonu',
    'Stadyum': 'Stadyum',
    'Yüzme havuzu': 'Yüzme havuzu',
    'Halı saha': 'Halı saha',
    'AVM': 'AVM',
    'Market': 'Market',
    'Bakkal': 'Bakkal',
    'Giyim mağazası': 'Giyim mağazası',
    'Kitapçı': 'Kitapçı',
    'Kuyumcu': 'Kuyumcu',
    'Otel': 'Otel',
    'Eczane': 'Eczane',
    'Hastane': 'Hastane',
    'Banka': 'Banka',
    'Kuaför': 'Kuaför',
    'Güzellik salonu': 'Güzellik salonu',
    'Üniversite': 'Üniversite',
    'Canlı müzik': 'Canlı müzik',
  },

  kesfet: {
    // REFERANS GORSELE GORE (kullanicinin istegi 2026-09-06).
    baslik: 'Check-in',
    harita: 'Harita',
    liste: 'Liste',
    turSuzgeci: 'Tür filtresi',
    turFiltresi: 'Tür filtresi',
    turBulunamadi: 'Çevrende gösterilecek tür yok.',
    filtreyiKaldir: 'Filtreyi kaldır',
    tumunuSec: 'Tümünü seç',
    temizle: 'Temizle',
    kaydet: 'Kaydet',
    kaydetSayili: 'Kaydet ({{sayi}})',
    tumu: 'Tümü',
    sakin: 'Sakin',
    yogun: 'Yoğun',
    populer: 'Popüler',
    yakinindakiMekanlar: 'Yakınındaki mekânlar',
    mesafeyeGore: 'Mesafeye göre',
    mesafeSec: 'Mesafe seç',
    mesafeIcinde: '{{mesafe}} içinde',
    mesafeTumu: '1 km içinde (tümü)',
    digerMekanlar: 'Diğer mekânları göster',
    paneliKapat: 'Listeyi kapat',
    yolTarifi: 'Yol tarifi',
    sonuclar: 'Sonuçlar',
    kisiBurada: '{{sayi}} kişi burada',
    checkIn: 'Check-in',
    konumuGor: 'Konumu gör',
    checkInYap: 'Buraya check-in yap',
    // i18n turu 2026-09-13: onceden koda gomulu olan metinler.
    mekanAra: 'Mekan ara',
    kisi: '{{sayi}} kişi',
    taraniyor: 'Çevren taranıyor…',
    cevreGorunmuyor: 'Çevreni göremiyoruz',
    konumIzniAciklama:
      'Yakınındaki mekanları gösterebilmek için konum iznine ihtiyacımız var. Tarayıcı ayarlarından izni açıp tekrar dene.',
    konumuAc: '{{ad}} konumunu aç',
    konumuGorEtiketi: '{{ad}} konumunu gör',
    checkInEtiketi: '{{ad}} için check-in yap',
    filtreyiKaldirEtiketi: '{{tur}} filtresini kaldır',
    kisiBuradaEtiket: 'kişi burada',
    suAnBuradasin: 'Şu an buradasın',
    ayrildim: 'Ayrıldım',
    araniyor: 'Aranıyor…',
    aramaBulunamadi: '“{{arama}}” için bir yer bulunamadı. Adın yazılışını değiştirmeyi deneyebilirsin.',
    sonucSayisi: '{{sayi}} sonuç',
    bosArama: '"{{arama}}" için bu ilde sonuç yok.',
    bosFiltre: 'Bu filtreyle 500 m içinde mekân yok.',
    bosCevre: 'Yakınında mekân yok.',
    mekanEkle: 'Mekan bulamadın mı? Ekle',
    atif: 'Mekan verileri: Foursquare · Mahalle ve ilçe: © OpenStreetMap katkıda bulunanlar',
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

  // MEKAN SAYFASI (kullanicinin istegi 2026-09-06). Konum ekrani
  // mekanin kendisini anlatan bir sayfaya donustu.
  mekanSayfasi: {
    fotografEtiketi: '{{ad}} fotoğrafı',
    menu: 'Seçenekler',
    yolTarifi: 'Yol tarifi al',
    buradaCheckIn: 'Buraya check-in yap',
    // Uzakken buton basilamiyor ve SEBEBINI soyluyor. Bos bir "check-in
    // yapamazsin" yerine mesafeyi vermek kullaniciya ne yapacagini
    // anlatiyor.
    yaklas: 'Check-in için yaklaş · {{mesafe}}',
    buradasinAyril: 'Buradasın · Ayrıl',
    // KAPANMIS MEKAN (2026-09-11). Kayit listelerden duesueyor ama
    // sayfasi aciliyor: eski bir check-in kartindan buraya gelinebilir
    // ve o ani silinmemeli. Sayfa sebebini SOYLUYOR - sessizce
    // calismayan bir buton "uygulama bozuk" diye okunurdu.
    kapandi: 'Bu mekân kalıcı olarak kapandı',
    kapandiAciklama:
      'Buraya artık check-in yapılamıyor ve mekân listelerde görünmüyor. Geçmiş anıların duruyor.',
    kisiBurada: 'kişi burada',
    bugun: 'Bugün',
    haritadaGoster: 'Konumu haritada göster',
    checkInSayisi: '{{sayi}} check-in',
    kisiSayisi: '{{sayi}} kişi',
    // Siralamanin evreni ILCE: o ilcenin yerleri arasinda kacinci.
    ilcedekiYerler: "{{ilce}}'deki yerler",
    // Ilce bilinmiyorsa ya da ilcede hic check-in yoksa siralamanin
    // bir evreni yok; uydurma bir "#1" yerine bunu yaziyoruz.
    siralamaYok: 'Sıralama yok',
    suAnBurada: 'Şu an burada',
    diger: 'Diğer',
    biri: 'Biri',
    suAn: 'şu an',
    // Uc sekme (Liderlik / Son gelenler / Fotograflar) tek satira
    // sigsin diye kisaltildi (2026-09-13); "Liderlik Tablosu" ve
    // "Son Check-inler" 390 px'te iki satira kiriliyordu.
    liderlik: 'Liderlik',
    sonCheckInler: 'Son gelenler',
    // Bos durum metinleri neden bos oldugunu SOYLEMIYOR, cunku iki
    // sebep var ve ayirt edilemez: gercekten kimse gelmemis olabilir
    // ya da gorunurluk tercihleri yuzunden sana gorunmuyor olabilir.
    // Ikinciyi ima etmek de bir sizinti olurdu.
    liderlikBos: 'Burada henüz gösterilecek bir check-in yok.',
    sonBos: 'Burada henüz gösterilecek bir check-in yok.',
    // FOTOGRAF ALANI (kullanicinin istegi 2026-09-13): check-in'lere
    // konan fotograflar burada. Bos durum yine sebep soylemiyor.
    fotograflar: 'Fotoğraflar',
    fotografBos: 'Burada henüz fotoğraf yok.',
    fotografAc: 'Fotoğrafı büyüt',
    dahaFazlaFotograf: 'Daha fazla fotoğraf',
    // PUANLAMA (kullanicinin istegi 2026-09-13, Swarm'daki gibi).
    puan: 'Puan',
    puanlamaSayisi: '{{sayi}} puanlama',
    puanYok: 'Henüz puan yok',
    puanAzOy: 'Puan için en az 3 puanlama gerekiyor',
    puanKotu: 'Kötü',
    puanIyi: 'İyi',
    puanHarika: 'Harika',
    puanSoru: 'Bu mekânı nasıl buldun?',
    puanSart: 'Puan vermek için önce burada check-in yap.',
    puanGonder: 'Gönder',
    puanGuncelle: 'Puanını güncelle',
    puanGonderiliyor: 'Gönderiliyor…',
    puanTesekkur: 'Puanın kaydedildi.',
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
    // SIFREMI UNUTTUM (kullanicinin istegi 2026-09-12).
    sifremiUnuttum: 'Şifreni mi unuttun?',
  },

  sifreSifirla: {
    // SIFRE SIFIRLAMA - uc asama tek ekranda (2026-09-12).
    geri: 'Geri',
    baslik: 'Şifreni sıfırla',
    aciklama: 'Hesabının e-posta adresini yaz, sana 6 haneli bir kod gönderelim.',
    epostaYerTutucu: 'E-posta adresi',
    kodGonder: 'Kodu gönder',
    gonderiliyor: 'Gönderiliyor…',
    hataEposta: 'Geçerli bir e-posta adresi gir.',
    hataHesapYok: 'Bu e-posta adresiyle bir hesap bulunamadı.',
    kodBaslik: 'Kodu gir',
    kodAciklama: '{{eposta}} adresine 6 haneli bir kod gönderdik.',
    kodEtiketi: 'Doğrulama kodu',
    dogrula: 'Doğrula',
    dogrulaniyor: 'Doğrulanıyor…',
    hataEksik: 'Kodu eksiksiz gir.',
    kodGelmedi: 'Kod gelmedi mi?',
    spamNotu: 'Gelen kutunda yoksa spam klasörüne de bak.',
    tekrarGonder: 'Tekrar gönder',
    tekrarBekle: '{{saniye}} sn sonra tekrar gönderebilirsin',
    tekrarGonderildi: 'Yeni kod gönderildi.',
    hakKalmadi: 'Bu adres için çok fazla kod istendi. Bir saat sonra tekrar deneyebilirsin.',
    yeniBaslik: 'Yeni şifreni belirle',
    yeniAciklama: 'Kod doğrulandı. Şimdi yeni bir şifre seç.',
    sifreYerTutucu: 'Yeni şifre (en az {{adet}} karakter)',
    sifreTekrarYerTutucu: 'Yeni şifre (tekrar)',
    kaydet: 'Şifreyi kaydet',
    kaydediliyor: 'Kaydediliyor…',
    hataSifreKisa: 'Şifre en az {{adet}} karakter olmalı.',
    hataSifreEslesmiyor: 'Şifreler birbirini tutmuyor.',
  },

  // SUNUCU HATALARI (i18n turu 2026-09-13). Anahtarlar sunucudaki
  // `raise exception` metninin ASCII slug'i (`lib/hata-metni.ts`
  // haritaliyor); Supabase kodlari ve Ingilizce desenler ayri.
  hatalar: {
    genel: 'Bir şeyler ters gitti. Biraz sonra tekrar dene.',
    kullaniciAdi30Gun: 'Kullanıcı adını 30 günde bir değiştirebilirsin. {{gun}} gün kaldı.',
    vt: {
      parola_yanlis: 'Parola yanlış.',
      su_anda_dogrulanamadi: 'Şu anda doğrulanamadı, biraz sonra tekrar dene.',
      silme_su_anda_tamamlanamadi: 'Silme şu anda tamamlanamadı, tekrar dene.',
      giris_taze_degil: 'Onay kodu doğrulanmadı ya da süresi geçti; kodu tekrar gönder.',
      silme_onayi_gerekli: 'Silmek için önce onay kodunu doğrula.',
      aski_bitisi_gelecekte_olmali: 'Askı bitişi gelecekte olmalı.',
      bir_moderatore_islem_uygulanamaz: 'Bir moderatöre işlem uygulanamaz.',
      bu_kisiye_su_an_mesaj_gonderemezsin: 'Bu kişiye şu an mesaj gönderemezsin.',
      bu_kullanici_adi_alinmis: 'Bu kullanıcı adı alınmış, başka bir tane dene.',
      bu_kullanici_bulunamadi: 'Bu kullanıcı bulunamadı.',
      bu_fotograf_sana_ait_degil: 'Bu fotoğraf sana ait değil.',
      bu_il_listemizde_yok: 'Bu il listemizde yok.',
      bu_mekan_bulunamadi: 'Bu mekân bulunamadı.',
      bu_mekan_icin_bekleyen_bir_talebin_zaten_var: 'Bu mekân için gönderdiğin talep hâlâ inceleniyor.',
      bu_mekan_kalici_olarak_kapandi: 'Bu mekân kalıcı olarak kapandı.',
      bu_mekan_zaten_kapali_olarak_isaretli: 'Bu mekân zaten kapalı olarak işaretli.',
      bu_tur_listemizde_yok: 'Bu tür listemizde yok.',
      en_az_bir_alan_doldurulmali: 'En az bir bilgiyi değiştirmelisin.',
      gunluk_duzenleme_talebi_sinirina_ulastin: 'Günlük düzeltme sınırına ulaştın (5). Yarın tekrar deneyebilirsin.',
      hesabin_su_an_bu_islemi_yapamaz: 'Hesabın şu an bu işlemi yapamaz.',
      bu_paylasim_bulunamadi: 'Bu paylaşım bulunamadı.',
      not_en_fazla_500_karakter_olabilir: 'Not en fazla 500 karakter olabilir.',
      bu_mesaji_sikayet_edemezsin: 'Bu mesajı şikayet edemezsin.',
      bugunluk_istek_sinirina_ulastin: 'Bugünlük istek sınırına ulaştın.',
      check_in_bulunamadi: 'Check-in bulunamadı.',
      cok_fazla_kimlik: 'Çok fazla kimlik gönderildi.',
      en_az_2_karakter_gerekli: 'En az 2 karakter yazmalısın.',
      gecersiz_bulunurluk_degeri: 'Geçersiz bulunurluk değeri.',
      gecersiz_gorunurluk_degeri: 'Geçersiz görünürlük değeri.',
      gecersiz_platform: 'Geçersiz platform.',
      gecersiz_sikayet_durumu: 'Geçersiz şikayet durumu.',
      gecersiz_sikayet_hedefi: 'Geçersiz şikayet hedefi.',
      gerekce_belirtilmeli: 'Gerekçe belirtmelisin.',
      geri_cekilecek_istek_bulunamadi: 'Geri çekilecek istek bulunamadı.',
      gunluk_mekan_ekleme_limitine_ulastin_5: 'Günlük mekan ekleme sınırına ulaştın (5). Yarın tekrar deneyebilirsin.',
      hesabin_su_anda_kullanilamiyor: 'Hesabın şu anda kullanılamıyor.',
      hesabin_zaten_kullanilamaz_durumda: 'Hesabın zaten kullanılamaz durumda.',
      istegin_zaten_gonderilmis: 'İsteğin zaten gönderilmiş.',
      jeton_bos_olamaz: 'Bildirim jetonu boş olamaz.',
      jeton_cok_uzun: 'Bildirim jetonu çok uzun.',
      kendi_mesajini_sikayet_edemezsin: 'Kendi mesajını şikayet edemezsin.',
      kendine_islem_uygulayamazsin: 'Kendine işlem uygulayamazsın.',
      kendine_istek_gonderemezsin: 'Kendine istek gönderemezsin.',
      kendine_mesaj_gonderemezsin: 'Kendine mesaj gönderemezsin.',
      kendini_engelleyemezsin: 'Kendini engelleyemezsin.',
      kendini_sikayet_edemezsin: 'Kendini şikayet edemezsin.',
      kimlik_dogrulamasi_gerekli: 'Bu işlem için giriş yapmış olman gerekiyor.',
      konusma_bulunamadi: 'Konuşma bulunamadı.',
      kullanici_adi_kurallara_uymuyor: 'Kullanıcı adı kurallara uymuyor.',
      kullanici_belirtilmeli: 'Kullanıcı belirtilmeli.',
      mekan_bulunamadi: 'Mekan bulunamadı.',
      gecersiz_puan: 'Geçersiz puan.',
      puan_vermek_icin_once_burada_check_in_yapmalisin: 'Puan vermek için önce burada check-in yapmalısın.',
      mekana_cok_uzaksin_1_km_icinde_olmalisin: 'Mekana çok uzaksın. Check-in yapmak için yaklaşık 1 kilometre içinde olmalısın.',
      mekana_yakin_olmalisin_200_m_icinde: 'Mekan eklemek için ona yaklaşık 200 metre kadar yakın olmalısın.',
      mesaj_bos_olamaz: 'Mesaj boş olamaz.',
      mesaj_bu_konusmada_bulunamadi: 'Mesaj bu konuşmada bulunamadı.',
      mesaj_cok_uzun: 'Mesaj çok uzun.',
      profil_bulunamadi: 'Profil bulunamadı.',
      sikayet_bulunamadi: 'Şikayet bulunamadı.',
      sikayet_sebebi_belirtilmeli: 'Şikayet sebebini belirtmelisin.',
      yanitlanacak_istek_bulunamadi: 'Yanıtlanacak istek bulunamadı.',
      yetkisiz: 'Bu işlem için yetkin yok.',
      zaten_bu_kullanici_adini_kullaniyorsun: 'Zaten bu kullanıcı adını kullanıyorsun.',
    },
    kod: {
      'otp_expired': 'Kod geçersiz ya da süresi dolmuş. Yeni bir kod iste.',
      'user_already_exists': 'Bu adreste zaten bir hesap var. Giriş yapabilirsin.',
      'invalid_credentials': 'E-posta adresi ya da şifre hatalı.',
      'over_request_rate_limit': 'Çok sık denedin. Biraz bekleyip tekrar dene.',
      'over_sms_send_rate_limit': 'Çok fazla kod istendi. Biraz bekleyip tekrar dene.',
      'weak_password': 'Şifre çok zayıf. Daha güçlü bir şifre seç.',
      'same_password': 'Yeni şifren eskisinden farklı olmalı.',
      'signup_disabled': 'Şu anda yeni kayıt alınamıyor.',
      'phone_provider_disabled': 'Şu anda bu numaraya kod gönderilemiyor. Biraz sonra tekrar dene.',
      '23505': 'Bu kayıt zaten var.',
      '57014': 'İşlem zaman aşımına uğradı. Tekrar dene.',
    },
    metin: {
      sms_saglayici: 'Şu anda bu numaraya kod gönderilemiyor. Biraz sonra tekrar dene.',
      sms_saglayici2: 'Şu anda bu numaraya kod gönderilemiyor. Biraz sonra tekrar dene.',
      kod_gecersiz: 'Kod geçersiz ya da süresi dolmuş. Yeni bir kod iste.',
      zaten_kayitli: 'Bu adreste zaten bir hesap var. Giriş yapabilirsin.',
      giris_hatali: 'E-posta adresi ya da şifre hatalı.',
      cok_sik: 'Çok sık denedin. Biraz bekleyip tekrar dene.',
      sifre_kisa: 'Şifre çok kısa.',
      sifre_ayni: 'Yeni şifren eskisinden farklı olmalı.',
      kayit_kapali: 'Şu anda yeni kayıt alınamıyor.',
      ag_yok: 'İnternet bağlantına ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
      oturum_dustu: 'Oturumun düşmüş. Tekrar giriş yap.',
    },
  },

  bildirimAyarlari: {
    altBaslik: "Sana ne zaman ve ne için haber verelim?",
    anlik: "Anlık bildirimler",
    anlikAciklama: "Telefonuna gelen Slooin bildirimleri.",
    insanlar: "İnsanlar ve etkileşim",
    arkadaslik: "Arkadaşlık istekleri",
    arkadaslikAciklama: "Yeni istekler ve kabul edilen arkadaşlıklar.",
    mesajlar: "Mesajlar",
    mesajlarAciklama: "Yeni mesajlar ve mesaj istekleri.",
    etiketler: "Etiketler",
    etiketlerAciklama: "Etiket istekleri ve onayları.",
    kesif: "Keşif ve anılar",
    aniHatirlatma: "Anı hatırlatmaları",
    aniHatirlatmaAciklama: "Güzel anlarını yeniden hatırla.",
    sessiz: "Sessiz saatler",
    geceSessiz: "Gece sessize al",
    geceSessizAciklama: "22.00–08.00 arasında anlık bildirim gönderilmez.",
    sessizNot: "Sessiz saatler cihazının yerel saatine göre çalışır. Uygulama içi bildirimler ve okunmamış mesajlar korunur.",
    cihazAyarlari: "Cihaz bildirim ayarları",
    izinYonet: "Bildirim iznini yönet",
    izinYol: "Telefonunun Ayarlar → Bildirimler → Slooin bölümünden bildirimlere izin verebilir veya izni kapatabilirsin.",
  },

  uygulama: {
    bolum: "Uygulama",
    gorunum: "Görünüm",
    gorunumAciklama: "Tema ve hareket tercihleri",
    tema: "Tema",
    temaSistem: "Sistemle aynı",
    temaSistemAciklama: "Cihazının görünümünü takip et.",
    temaAcik: "Açık",
    temaAcikAciklama: "Aydınlık ve sade görünüm.",
    temaKoyu: "Koyu",
    temaKoyuAciklama: "Düşük ışıkta daha yumuşak görünüm.",
    yardim: "Yardım merkezi",
    yardimAciklama: "Yanıt bul veya sorun bildir",
    yardimAlt: "Aklındaki sorulara birlikte yanıt bulalım.",
    sikSorulanlar: "Sık sorulanlar",
    sorunBildir: "Sorun bildir",
    sorunKonu: "Slooin sorun bildirimi",
    soru1: "Gizli profil nasıl çalışır?",
    cevap1: "Profilin gizliyken anıların ve check-in'lerin yalnızca arkadaşlarına görünür. Adın, kullanıcı adın ve profil fotoğrafın herkese açık kalır; böylece seni bulup arkadaşlık isteği gönderebilirler. Gizli bir profile arkadaş eklemek istek gerektirir, açık profilde ekleme doğrudan olur. Ayarlar → Gizlilik → Profil görünürlüğü'nden değiştirebilirsin.",
    soru2: "Konumum sürekli paylaşılır mı?",
    cevap2: "Hayır. Konumun yalnızca check-in yaptığında paylaşılır. Check-in bir saat sonra ya da \"Ayrıl\" dediğinde anıya dönüşür; o anda koordinatın silinir, geriye yalnızca hangi mekânda olduğun kalır. Mekân ararken cihaz konumun sunucuya gönderilir ama saklanmaz.",
    soru3: "Birini nasıl engellerim?",
    cevap3: "Kişinin profilinde sağ üstteki menüden Engelle'ye dokun. Engellediğin kişi sana mesaj ve arkadaşlık isteği gönderemez; aranızdaki sohbet iki taraftan da silinir. Engeli Ayarlar → Gizlilik → Engellenen kişiler'den kaldırabilirsin.",
    soru4: "Hesap dondurma ile silme arasındaki fark ne?",
    cevap4: "Dondurmak geçicidir: profilin görünmez olur, verilerin saklanır ve tekrar giriş yaptığında hesabın kendiliğinden açılır. Silmek kalıcıdır: hesabın ve verilerin geri getirilemez; mesajların ve şikâyetlerin anonimleşir. İkisi de Ayarlar → Hesap yönetimi'nde.",
    hakkinda: "Slooin hakkında",
    hakkindaAciklama: "Topluluk kuralları ve yasal bilgiler",
    hakkindaAlt: "Slooin'i birlikte iyi bir yer yapan kurallar ve belgeler.",
    birlikteDahaIyi: "Birlikte daha iyi",
    toplulukKurallari: "Topluluk kuralları",
    toplulukAciklama: "Saygılı ve güvenli bir alan",
    gizlilikPolitikasi: "Gizlilik politikası",
    gizlilikPolitikasiAciklama: "Verilerin nasıl işlenir?",
    kullanimKosullari: "Kullanım koşulları",
    kullanimKosullariAciklama: "Kullanıma ilişkin kurallar",
    surum: "Slooin {{surum}}",
  },

  toplulukKurallari: {
    baslik: "Topluluk kuralları",
    giris: "Slooin, yeni insanlarla gerçek mekânlarda tanışmak için var. Bunun güvenli olması herkesin bu kurallara uymasına bağlı.",
    k1b: "Saygılı ol",
    k1m: "Hakaret, taciz, tehdit ve nefret söylemi yasaktır. Kimse istemediği bir konuşmayı sürdürmek zorunda değildir.",
    k2b: "Gerçek ol",
    k2m: "Kendini başkası gibi tanıtma, sahte hesap açma, başkasının fotoğrafını profil fotoğrafı olarak kullanma.",
    k3b: "Başkalarının gizliliğine saygı göster",
    k3m: "Birinin fotoğrafını, konumunu ya da kişisel bilgisini izni olmadan paylaşma. Etiketlediğin kişi etiketi kaldırabilir.",
    k4b: "Güvenli buluş",
    k4m: "Yeni tanıştığın kişilerle kalabalık ve açık mekânlarda buluş. Kendini güvende hissetmiyorsan ayrıl, kişiyi engelle ve şikâyet et.",
    k5b: "Yanıltıcı içerik paylaşma",
    k5m: "Sahte check-in, yanlış mekân bilgisi, reklam ve spam yasaktır. Mekân düzeltmeleri moderatör onayından geçer.",
    k6b: "18 yaşından büyük ol",
    k6m: "Slooin yalnızca 18 yaş ve üzeri içindir. Yaşını yanlış beyan eden hesaplar kapatılır.",
    kapanis: "Kuralları ihlal eden hesaplar uyarılabilir, askıya alınabilir ya da kalıcı olarak kapatılabilir. Bir sorun gördüğünde şikâyet et; her şikâyet bir moderatör tarafından incelenir.",
  },

  hesapYonetimi: {
    bolum: "Hesap işlemleri",
    satirBaslik: "Hesap yönetimi",
    satirAciklama: "Dondurma ve silme seçenekleri",
    baslik: "Hesap yönetimi",
    altBaslik: "Hesabına ara ver ya da kalıcı olarak kapat.",
    dondur: "Hesabı dondur",
    dondurAciklama: "İstediğin zaman geri dönebilirsin",
    sil: "Hesabı sil",
    silAciklama: "Kalıcı silme talebi oluştur",
    kartBaslik: "Anıların sende kalsın",
    kartMetin: "İşlemden önce bilgilerinin bir kopyasını alabilirsin.",
  },
} as const
