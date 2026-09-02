/**
 * SUNUCU HATALARININ TEK CEVIRI KAPISI.
 *
 * Ekranlar hatayi kullaniciya `e.message` ile basiyor. O metin iki
 * yerden geliyor ve ikisi de kullaniciya GOSTERILECEK halde degil:
 *
 *  1. Veritabanindaki `raise exception` metinleri. 45 tanesi var ve
 *     hepsi aksansiz yazilmis ("Mekana cok uzaksin"). Ekran metinleri
 *     duzgun Turkce yazilir (karar 74), yani bunlar oldugu gibi
 *     gosterilemez.
 *  2. Supabase kimlik katmaninin INGILIZCE mesajlari ("Unable to get
 *     SMS provider", "Token has expired or is invalid"). Bunlar
 *     kullaniciya oldugu gibi cikiyordu.
 *
 * NEDEN MIGRASYON DEGIL: 45 metin onlarca fonksiyonun govdesinde
 * duruyor; hepsini migrasyonla yeniden yazmak o fonksiyonlari bastan
 * olusturmak demek ve RPC davranisini bozma riski tasiyor. Ayrica
 * `test:sema` ve `test:gorunurluk` bu metinler uzerinden dogrulama
 * yapiyor. Istemcide tek kapi hem daha guvenli, hem de ileride diger
 * dillere cevrilebilir - veritabani mesaji kullanicinin diline gore
 * degisemez, buradaki tablo degisebilir.
 *
 * Bilinmeyen bir mesaj gelirse: metin zaten duzgun Turkce gorunuyorsa
 * (aksanli harf tasiyorsa) oldugu gibi gecer - bunlar bizim istemci
 * tarafindaki mesajlarimiz. Aksi halde genel bir metin doner ve asil
 * hata konsola yazilir, yoksa gelistirirken hatanin ne oldugu
 * kaybolur.
 */

/** Veritabanindaki `raise exception` metinlerinin karsiliklari. */
const VERITABANI: Record<string, string> = {
  'Aski bitisi gelecekte olmali': 'Askı bitişi gelecekte olmalı.',
  'Bir moderatore islem uygulanamaz': 'Bir moderatöre işlem uygulanamaz.',
  'Bu kisiye su an mesaj gonderemezsin': 'Bu kişiye şu an mesaj gönderemezsin.',
  'Bu kullanici adi alinmis': 'Bu kullanıcı adı alınmış, başka bir tane dene.',
  'Bu kullanici bulunamadi': 'Bu kullanıcı bulunamadı.',
  'Bu paylasim bulunamadi': 'Bu paylaşım bulunamadı.',
  'Not en fazla 500 karakter olabilir': 'Not en fazla 500 karakter olabilir.',
  'Bu mesaji sikayet edemezsin': 'Bu mesajı şikayet edemezsin.',
  'Bugunluk istek sinirina ulastin': 'Bugünlük istek sınırına ulaştın.',
  'Check-in bulunamadi': 'Check-in bulunamadı.',
  'Cok fazla kimlik': 'Çok fazla kimlik gönderildi.',
  'En az 2 karakter gerekli': 'En az 2 karakter yazmalısın.',
  'Gecersiz bulunurluk degeri': 'Geçersiz bulunurluk değeri.',
  'Gecersiz gorunurluk degeri': 'Geçersiz görünürlük değeri.',
  'Gecersiz platform': 'Geçersiz platform.',
  'Gecersiz sikayet durumu': 'Geçersiz şikayet durumu.',
  'Gecersiz sikayet hedefi': 'Geçersiz şikayet hedefi.',
  'Gerekce belirtilmeli': 'Gerekçe belirtmelisin.',
  'Geri cekilecek istek bulunamadi': 'Geri çekilecek istek bulunamadı.',
  'Gunluk mekan ekleme limitine ulastin (5)':
    'Günlük mekan ekleme sınırına ulaştın (5). Yarın tekrar deneyebilirsin.',
  'Hesabin su anda kullanilamiyor': 'Hesabın şu anda kullanılamıyor.',
  'Hesabin zaten kullanilamaz durumda': 'Hesabın zaten kullanılamaz durumda.',
  'Istegin zaten gonderilmis': 'İsteğin zaten gönderilmiş.',
  'Jeton bos olamaz': 'Bildirim jetonu boş olamaz.',
  'Jeton cok uzun': 'Bildirim jetonu çok uzun.',
  'Kendi mesajini sikayet edemezsin': 'Kendi mesajını şikayet edemezsin.',
  'Kendine islem uygulayamazsin': 'Kendine işlem uygulayamazsın.',
  'Kendine istek gonderemezsin': 'Kendine istek gönderemezsin.',
  'Kendine mesaj gonderemezsin': 'Kendine mesaj gönderemezsin.',
  'Kendini engelleyemezsin': 'Kendini engelleyemezsin.',
  'Kendini sikayet edemezsin': 'Kendini şikayet edemezsin.',
  'Kimlik dogrulamasi gerekli': 'Bu işlem için giriş yapmış olman gerekiyor.',
  'Konusma bulunamadi': 'Konuşma bulunamadı.',
  'Kullanici adi kurallara uymuyor': 'Kullanıcı adı kurallara uymuyor.',
  'Kullanici belirtilmeli': 'Kullanıcı belirtilmeli.',
  'Mekan bulunamadi': 'Mekan bulunamadı.',
  'Mekana cok uzaksin (~500 m icinde olmalisin)':
    'Mekana çok uzaksın. Check-in yapmak için yaklaşık 500 metre içinde olmalısın.',
  'Mekana yakin olmalisin (~200 m icinde)':
    'Mekan eklemek için ona yaklaşık 200 metre kadar yakın olmalısın.',
  'Mesaj bos olamaz': 'Mesaj boş olamaz.',
  'Mesaj bu konusmada bulunamadi': 'Mesaj bu konuşmada bulunamadı.',
  'Mesaj cok uzun': 'Mesaj çok uzun.',
  'Profil bulunamadi': 'Profil bulunamadı.',
  'Sikayet bulunamadi': 'Şikayet bulunamadı.',
  'Sikayet sebebi belirtilmeli': 'Şikayet sebebini belirtmelisin.',
  'Yanitlanacak istek bulunamadi': 'Yanıtlanacak istek bulunamadı.',
  Yetkisiz: 'Bu işlem için yetkin yok.',
  'Zaten bu kullanici adini kullaniyorsun': 'Zaten bu kullanıcı adını kullanıyorsun.',
}

/** Supabase hata KODLARI - metinden daha guvenilir, once bunlara bakiliyor. */
const KOD: Record<string, string> = {
  otp_expired: 'Kod geçersiz ya da süresi dolmuş. Yeni bir kod iste.',
  user_already_exists: 'Bu numarada zaten bir hesap var. Giriş yapabilirsin.',
  invalid_credentials: 'Telefon numarası ya da şifre hatalı.',
  over_request_rate_limit: 'Çok sık denedin. Biraz bekleyip tekrar dene.',
  over_sms_send_rate_limit: 'Çok fazla kod istendi. Biraz bekleyip tekrar dene.',
  weak_password: 'Şifre çok zayıf. Daha güçlü bir şifre seç.',
  same_password: 'Yeni şifren eskisinden farklı olmalı.',
  signup_disabled: 'Şu anda yeni kayıt alınamıyor.',
  phone_provider_disabled: 'Şu anda bu numaraya kod gönderilemiyor. Biraz sonra tekrar dene.',
  // Postgres: benzersizlik kisiti.
  '23505': 'Bu kayıt zaten var.',
  // Postgres: statement_timeout.
  '57014': 'İşlem zaman aşımına uğradı. Tekrar dene.',
}

/**
 * Kodu olmayan hatalar icin metin eslesmeleri.
 *
 * Supabase surumleri arasinda mesaj metni degisebiliyor, bu yuzden
 * desenler bilerek gevsek yazildi ve KOD tablosundan SONRA
 * deneniyorlar.
 */
const METIN: [RegExp, string][] = [
  [/unable to get sms provider/i, 'Şu anda bu numaraya kod gönderilemiyor. Biraz sonra tekrar dene.'],
  [/sms provider|phone provider/i, 'Şu anda bu numaraya kod gönderilemiyor. Biraz sonra tekrar dene.'],
  [/token has expired or is invalid|invalid token/i, 'Kod geçersiz ya da süresi dolmuş. Yeni bir kod iste.'],
  [/user already registered/i, 'Bu numarada zaten bir hesap var. Giriş yapabilirsin.'],
  [/invalid login credentials/i, 'Telefon numarası ya da şifre hatalı.'],
  [/for security purposes.*after|rate limit/i, 'Çok sık denedin. Biraz bekleyip tekrar dene.'],
  [/password should be at least|password.*too short/i, 'Şifre çok kısa.'],
  [/new password should be different/i, 'Yeni şifren eskisinden farklı olmalı.'],
  [/signups? not allowed|signup.*disabled/i, 'Şu anda yeni kayıt alınamıyor.'],
  [/network request failed|failed to fetch|networkerror/i,
    'İnternet bağlantına ulaşılamadı. Bağlantını kontrol edip tekrar dene.'],
  [/jwt|session.*expired|refresh token/i, 'Oturumun düşmüş. Tekrar giriş yap.'],
]

/**
 * Icinde degisken tasiyan mesajlar. Sabit tabloya konamiyorlar.
 */
const DESENLI: [RegExp, (e: RegExpMatchArray) => string][] = [
  [
    /^Kullanici adini 30 gunde bir degistirebilirsin\. Kalan sure: (\d+) gun$/,
    (e) => `Kullanıcı adını 30 günde bir değiştirebilirsin. ${e[1]} gün kaldı.`,
  ],
]

/** Son care metni. */
const GENEL = 'Bir şeyler ters gitti. Biraz sonra tekrar dene.'

/**
 * Metin INGILIZCE mi gorunuyor?
 *
 * Ilk denemede olcut "aksanli harf tasiyor mu" idi ve YANLISTI: bizim
 * kendi dogru Turkce mesajlarimizin bir kismi aksansiz ("Konum izni
 * verilmedi", "Sunucuya ulasilamadi") ve genel metinle eziliyorlardi.
 *
 * Dogru soru "Turkce mi" degil, "kullaniciya gosterilemeyecek kadar
 * yabanci mi". Tanimadigimiz Turkce bir metni oldugu gibi gostermek,
 * genel bir metinle degistirmekten iyi; tanimadigimiz Ingilizce bir
 * metni gostermek ise kotu.
 */
const INGILIZCE =
  /\b(the|is|are|not|invalid|failed|error|unable|provider|request|token|password|user|please|must|cannot|expired|already|registered|credentials|rate|limit|network|fetch|session|refresh|denied|forbidden|unauthorized)\b/i

type OlasiHata = {
  message?: unknown
  code?: unknown
  error_code?: unknown
  status?: unknown
}

/** Hata nesnesinden metin ve kod cikarir. */
function ayikla(hata: unknown): { metin: string; kod: string | null } {
  if (typeof hata === 'string') return { metin: hata, kod: null }
  if (hata && typeof hata === 'object') {
    const h = hata as OlasiHata
    const metin = typeof h.message === 'string' ? h.message : ''
    const kod =
      typeof h.code === 'string'
        ? h.code
        : typeof h.error_code === 'string'
          ? h.error_code
          : null
    return { metin, kod }
  }
  return { metin: '', kod: null }
}

/**
 * Sunucudan gelen bir hatayi kullaniciya gosterilecek Turkce metne
 * cevirir. Ekranlar `e.message` yerine bunu kullanir.
 */
export function hataMetni(hata: unknown): string {
  const { metin, kod } = ayikla(hata)

  if (kod && KOD[kod]) return KOD[kod]
  if (metin && VERITABANI[metin]) return VERITABANI[metin]

  for (const [desen, uret] of DESENLI) {
    const eslesme = metin.match(desen)
    if (eslesme) return uret(eslesme)
  }

  for (const [desen, karsilik] of METIN) {
    if (desen.test(metin)) return karsilik
  }

  if (metin && !INGILIZCE.test(metin)) {
    // Tanimadigimiz ama Turkce gorunen metin: oldugu gibi gecer.
    return metin
  }

  if (metin) {
    // Bilinmeyen hatayi yutmuyoruz: kullaniciya genel metin, gelistirene
    // asil metin.
    console.warn('[hata-metni] cevrilmemis hata:', kod ?? '-', metin)
  }
  return GENEL
}
