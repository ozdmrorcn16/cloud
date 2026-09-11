import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { profilFotografiUrl } from './fotograf-url'

/**
 * "VERILERIMI INDIR" - KVKK m.11 erisim hakki.
 *
 * Kisi kendi verisinin bir KOPYASINI alabiliyor. Silme hakki
 * 2026-08-22'de kapanmisti; erisim tarafi 2026-09-11'e kadar acikti ve
 * bir talep gelse elle SQL yazmak gerekiyordu.
 *
 * ------------------------------------------------------------------
 * DOSYANIN KAPSAMI BIR TASARIM TERCIHI DEGIL, KARAR
 *
 * Uc nokta baskasinin verisiyle kesisiyor ve kullanici karar verdi
 * (2026-09-11):
 *
 *   MESAJLAR    kendi yazdiklari TAM METINLE; karsi tarafinkiler
 *               METINSIZ (kiminle, kac mesaj, son tarih). Bir konusma
 *               iki kisiye ait; karsi tarafin cumleleri ONUN verisi.
 *   SIKAYETLER  kendi GONDERDIKLERI giriyor, HAKKINDAKILER GIRMIYOR.
 *   MODERASYON  denetim izi girmiyor; hesap durumu (aski/yasak,
 *               gerekce) giriyor.
 *
 * Ayrica KENDISINI ENGELLEYENLER asla girmiyor: uygulamanin sessizlik
 * ilkesi (engelli, engellendigini silinmis hesaptan ayirt edemiyor)
 * tek hamlede yikilirdi.
 *
 * Kural SUNUCUDA (`verilerimi_disa_aktar` RPC'si), istemcide degil -
 * burada yalnizca dosya hazirlanip teslim ediliyor.
 * ------------------------------------------------------------------
 */

/** Imzali baglantilarin omru. Kovadaki dosya da 24 saatte budanıyor. */
const BAGLANTI_SANIYE = 60 * 60 * 24

type DisaAktarim = Record<string, unknown> & {
  profil?: { fotograflar?: string[] } | null
  check_inler?: { fotograf?: string | null }[]
}

/**
 * Veriyi toplar, fotograflar icin imzali baglanti ekler, dosyayi
 * kovaya yukler ve ACILABILIR bir adres dondurur.
 *
 * NEDEN KOVA + BAGLANTI, dosya paylasimi degil: `expo-sharing` YENI
 * BIR NATIVE MODUL ve yeni derleme ister, yani OTA ile gitmez.
 * RN'in kendi `Share.share({ url })` cagrisi dosyayi yalnizca iOS'ta
 * paylasiyor - uygulama iki magazaya da cikacagi icin tek platformda
 * calisan bir cozum yarim is olurdu. Imzali baglanti uc platformda da
 * bugun calisiyor.
 */
export async function verilerimiDisaAktar(): Promise<string> {
  const { data, error } = await supabase.rpc('verilerimi_disa_aktar')
  if (error) throw new Error(hataMetni(error))

  const veri = (data ?? {}) as DisaAktarim

  // FOTOGRAFLAR DOSYAYA GOMULMUYOR, baglanti veriliyor: gomulu bir
  // gorsel dosyayi megabaytlara cikarirdi ve kova zaten imzali adresle
  // okunuyor. Baglanti uretilemezse yol oldugu gibi kaliyor - kisi en
  // azindan neyin var oldugunu goruyor.
  const fotograflar = veri.profil?.fotograflar ?? []
  if (fotograflar.length > 0 && veri.profil) {
    veri.profil.fotograflar = await Promise.all(
      fotograflar.map(async (yol) => (await profilFotografiUrl(yol)) ?? yol)
    )
  }

  const icerik = JSON.stringify(veri, null, 2)

  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kisi = kullaniciVerisi.user?.id
  if (!kisi) throw new Error('Oturumun düşmüş, tekrar giriş yap.')

  // ONCEKI DOSYA SILINIYOR: kisi basina en fazla BIR disa aktarim
  // kaliyor. Ayni desen profil fotografinda da var - eski dosyanin
  // kovada beklemesi, hele icinde butun gecmis varken, kabul edilemez.
  await eskiDosyalariSil(kisi)

  const yol = `${kisi}/slooin-verilerim-${Date.now()}.json`
  const { error: yuklemeHatasi } = await supabase.storage
    .from('veri-disa-aktarim')
    .upload(yol, new Blob([icerik], { type: 'application/json' }), {
      contentType: 'application/json',
    })
  if (yuklemeHatasi) throw new Error(hataMetni(yuklemeHatasi))

  const { data: imza, error: imzaHatasi } = await supabase.storage
    .from('veri-disa-aktarim')
    .createSignedUrl(yol, BAGLANTI_SANIYE)
  if (imzaHatasi || !imza?.signedUrl) {
    throw new Error('Dosya hazırlandı ama bağlantı oluşturulamadı. Tekrar dene.')
  }
  return imza.signedUrl
}

/**
 * Kisinin klasorunde ne varsa siler.
 *
 * En iyi caba: hata firlatilmiyor. Temizlik basarisiz olsa bile yeni
 * dosya yukleniyor ve eskisi 24 saatlik budama isiyle zaten
 * erisilemez hale geliyor.
 */
async function eskiDosyalariSil(kisi: string): Promise<void> {
  try {
    const { data } = await supabase.storage.from('veri-disa-aktarim').list(kisi)
    const yollar = (data ?? []).map((d) => `${kisi}/${d.name}`)
    if (yollar.length > 0) {
      await supabase.storage.from('veri-disa-aktarim').remove(yollar)
    }
  } catch {
    // Temizlik, disa aktarmayi bloke etmemeli.
  }
}
