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

import { cevir } from './dil'

/**
 * Veritabanindaki `raise exception` metinleri -> ceviri anahtari
 * (`hatalar.vt.<anahtar>`, sozluk `lib/ceviriler/*.ts`). i18n turu
 * 2026-09-13: metinler burada degil sozlukte, dile gore geliyor.
 */
const VERITABANI: Record<string, string> = {
  'Aski bitisi gelecekte olmali': 'aski_bitisi_gelecekte_olmali',
  'Bir moderatore islem uygulanamaz': 'bir_moderatore_islem_uygulanamaz',
  'Bu kisiye su an mesaj gonderemezsin': 'bu_kisiye_su_an_mesaj_gonderemezsin',
  'Bu kullanici adi alinmis': 'bu_kullanici_adi_alinmis',
  'Bu kullanici bulunamadi': 'bu_kullanici_bulunamadi',
  'Bu fotograf sana ait degil': 'bu_fotograf_sana_ait_degil',
  'Bu il listemizde yok': 'bu_il_listemizde_yok',
  'Bu mekan bulunamadi': 'bu_mekan_bulunamadi',
  'Bu mekan icin bekleyen bir talebin zaten var': 'bu_mekan_icin_bekleyen_bir_talebin_zaten_var',
  'Bu mekan kalici olarak kapandi': 'bu_mekan_kalici_olarak_kapandi',
  'Bu mekan zaten kapali olarak isaretli': 'bu_mekan_zaten_kapali_olarak_isaretli',
  'Bu tur listemizde yok': 'bu_tur_listemizde_yok',
  'En az bir alan doldurulmali': 'en_az_bir_alan_doldurulmali',
  'Gunluk duzenleme talebi sinirina ulastin': 'gunluk_duzenleme_talebi_sinirina_ulastin',
  'Hesabin su an bu islemi yapamaz': 'hesabin_su_an_bu_islemi_yapamaz',
  'Bu paylasim bulunamadi': 'bu_paylasim_bulunamadi',
  'Not en fazla 500 karakter olabilir': 'not_en_fazla_500_karakter_olabilir',
  'Bu mesaji sikayet edemezsin': 'bu_mesaji_sikayet_edemezsin',
  'Bugunluk istek sinirina ulastin': 'bugunluk_istek_sinirina_ulastin',
  'Check-in bulunamadi': 'check_in_bulunamadi',
  'Cok fazla kimlik': 'cok_fazla_kimlik',
  'En az 2 karakter gerekli': 'en_az_2_karakter_gerekli',
  'Gecersiz bulunurluk degeri': 'gecersiz_bulunurluk_degeri',
  'Gecersiz gorunurluk degeri': 'gecersiz_gorunurluk_degeri',
  'Gecersiz platform': 'gecersiz_platform',
  'Gecersiz sikayet durumu': 'gecersiz_sikayet_durumu',
  'Gecersiz sikayet hedefi': 'gecersiz_sikayet_hedefi',
  'Gerekce belirtilmeli': 'gerekce_belirtilmeli',
  'Geri cekilecek istek bulunamadi': 'geri_cekilecek_istek_bulunamadi',
  'Gunluk mekan ekleme limitine ulastin (5)': 'gunluk_mekan_ekleme_limitine_ulastin_5',
  'Hesabin su anda kullanilamiyor': 'hesabin_su_anda_kullanilamiyor',
  'Hesabin zaten kullanilamaz durumda': 'hesabin_zaten_kullanilamaz_durumda',
  'Istegin zaten gonderilmis': 'istegin_zaten_gonderilmis',
  'Jeton bos olamaz': 'jeton_bos_olamaz',
  'Jeton cok uzun': 'jeton_cok_uzun',
  'Kendi mesajini sikayet edemezsin': 'kendi_mesajini_sikayet_edemezsin',
  'Kendine islem uygulayamazsin': 'kendine_islem_uygulayamazsin',
  'Kendine istek gonderemezsin': 'kendine_istek_gonderemezsin',
  'Kendine mesaj gonderemezsin': 'kendine_mesaj_gonderemezsin',
  'Kendini engelleyemezsin': 'kendini_engelleyemezsin',
  'Kendini sikayet edemezsin': 'kendini_sikayet_edemezsin',
  'Kimlik dogrulamasi gerekli': 'kimlik_dogrulamasi_gerekli',
  'Konusma bulunamadi': 'konusma_bulunamadi',
  'Kullanici adi kurallara uymuyor': 'kullanici_adi_kurallara_uymuyor',
  'Kullanici belirtilmeli': 'kullanici_belirtilmeli',
  'Mekan bulunamadi': 'mekan_bulunamadi',
  'Gecersiz puan': 'gecersiz_puan',
  'Puan vermek icin once burada check-in yapmalisin': 'puan_vermek_icin_once_burada_check_in_yapmalisin',
  'Mekana cok uzaksin (~1 km icinde olmalisin)': 'mekana_cok_uzaksin_1_km_icinde_olmalisin',
  'Mekana yakin olmalisin (~200 m icinde)': 'mekana_yakin_olmalisin_200_m_icinde',
  'Mesaj bos olamaz': 'mesaj_bos_olamaz',
  'Mesaj bu konusmada bulunamadi': 'mesaj_bu_konusmada_bulunamadi',
  'Mesaj cok uzun': 'mesaj_cok_uzun',
  'Profil bulunamadi': 'profil_bulunamadi',
  'Sikayet bulunamadi': 'sikayet_bulunamadi',
  'Sikayet sebebi belirtilmeli': 'sikayet_sebebi_belirtilmeli',
  'Yanitlanacak istek bulunamadi': 'yanitlanacak_istek_bulunamadi',
  Yetkisiz: 'yetkisiz',
  'Zaten bu kullanici adini kullaniyorsun': 'zaten_bu_kullanici_adini_kullaniyorsun',
}

/** Supabase hata KODLARI - metinden daha guvenilir, once bunlara bakiliyor. */
const KOD: Record<string, string> = {
  'otp_expired': 'otp_expired',
  'user_already_exists': 'user_already_exists',
  'invalid_credentials': 'invalid_credentials',
  'over_request_rate_limit': 'over_request_rate_limit',
  'over_sms_send_rate_limit': 'over_sms_send_rate_limit',
  'weak_password': 'weak_password',
  'same_password': 'same_password',
  'signup_disabled': 'signup_disabled',
  'phone_provider_disabled': 'phone_provider_disabled',
  '23505': '23505',
  '57014': '57014',
}

/**
 * Kodu olmayan hatalar icin metin eslesmeleri.
 *
 * Supabase surumleri arasinda mesaj metni degisebiliyor, bu yuzden
 * desenler bilerek gevsek yazildi ve KOD tablosundan SONRA
 * deneniyorlar.
 */
const METIN: [RegExp, string][] = [
  [/unable to get sms provider/i, 'sms_saglayici'],
  [/sms provider|phone provider/i, 'sms_saglayici2'],
  [/token has expired or is invalid|invalid token/i, 'kod_gecersiz'],
  [/user already registered/i, 'zaten_kayitli'],
  [/invalid login credentials/i, 'giris_hatali'],
  [/for security purposes.*after|rate limit/i, 'cok_sik'],
  [/password should be at least|password.*too short/i, 'sifre_kisa'],
  [/new password should be different/i, 'sifre_ayni'],
  [/signups? not allowed|signup.*disabled/i, 'kayit_kapali'],
  [/network request failed|failed to fetch|networkerror/i, 'ag_yok'],
  [/jwt|session.*expired|refresh token/i, 'oturum_dustu'],
]

/**
 * Icinde degisken tasiyan mesajlar. Sabit tabloya konamiyorlar.
 */
const DESENLI: [RegExp, (e: RegExpMatchArray) => string][] = [
  [
    /^Kullanici adini 30 gunde bir degistirebilirsin\. Kalan sure: (\d+) gun$/,
    (e) => cevir('hatalar.kullaniciAdi30Gun', { gun: e[1] }),
  ],
]

/** Son care metni (anahtar). */
const GENEL = 'hatalar.genel'

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

  if (kod && KOD[kod]) return cevir(`hatalar.kod.${KOD[kod]}`)
  if (metin && VERITABANI[metin]) return cevir(`hatalar.vt.${VERITABANI[metin]}`)

  for (const [desen, uret] of DESENLI) {
    const eslesme = metin.match(desen)
    if (eslesme) return uret(eslesme)
  }

  for (const [desen, karsilik] of METIN) {
    if (desen.test(metin)) return cevir(`hatalar.metin.${karsilik}`)
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
  return cevir(GENEL)
}
