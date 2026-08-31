import { reverseGeocodeAsync } from 'expo-location'

/**
 * KOORDINATTAN TAM ADRES.
 *
 * Kullanicinin istegi (2026-08-31): konum ekraninda mekanin tam adresi
 * gorunsun. Veritabanindaki `mekanlar.adres` alani bunu karsilamiyor:
 * kayitlarin yalnizca %39'unda dolu ve dolu olanlar da yarim
 * ("Toros Mahallesi 79001 Sokak" - kapi no ve ilce yok).
 *
 * Bu yuzden adres CIHAZDA cozuluyor: `expo-location` iOS'ta Apple
 * Haritalar'in, Android'de Google'in adres servisini kullaniyor. Ek
 * ucret ve API anahtari gerekmiyor.
 *
 * GIZLILIK: servise giden sey MEKANIN koordinatidir, kullanicinin
 * konumu DEGIL. Cozum bir check-in'in ya da mekanin ekranini acinca
 * calisir; arka planda toplu sorgu yapilmaz. Aydinlatma metnindeki
 * karsiligi `docs/gizlilik-metni.md` madde 5.
 */

/**
 * `expo-location`in dondurdugu alanlardan bizim kullandiklarimiz.
 * Kendi tipimizi yaziyoruz ki bicimlendirme cihaz API'sinden bagimsiz
 * test edilebilsin.
 */
export type AdresParcalari = {
  /** Mahalle. iOS bunu cogu zaman veriyor, Android bazen bos birakiyor. */
  district?: string | null
  /** Cadde / sokak. */
  street?: string | null
  /** Kapi numarasi. */
  streetNumber?: string | null
  /** Sehir. Turkiye'de saglayici buraya bazen ILCE yaziyor. */
  city?: string | null
  /** Ilce. */
  subregion?: string | null
  /** Il. */
  region?: string | null
}

function temiz(deger?: string | null): string | null {
  const s = deger?.trim()
  return s ? s : null
}

/**
 * Adres parcalarini tek satira cevirir:
 *   "Ataevler Mahallesi, İzmir Yolu Caddesi No:12, Nilüfer/Bursa"
 *
 * Eksik parcalar sessizce elenir - yarim bir adres, hic adres
 * olmamasindan iyidir ama "undefined" ya da bosluklu virgul
 * gorunmemelidir.
 */
export function adresYaz(parcalar: AdresParcalari): string | null {
  const mahalle = temiz(parcalar.district)
  const cadde = temiz(parcalar.street)
  const kapiNo = temiz(parcalar.streetNumber)
  // Saglayici ilceyi bazen `subregion`, bazen `city` alanina yaziyor.
  const ilce = temiz(parcalar.subregion) ?? temiz(parcalar.city)
  const il = temiz(parcalar.region)

  const caddeSatiri = cadde && kapiNo ? `${cadde} No:${kapiNo}` : cadde
  // Buyuksehirde ilce ve il ayni gelebiliyor; "Bursa/Bursa" yazmayalim.
  const yerSatiri = ilce && il ? (ilce === il ? il : `${ilce}/${il}`) : (ilce ?? il)

  const satir = [mahalle, caddeSatiri, yerSatiri].filter(Boolean).join(', ')
  return satir || null
}

/**
 * Bir koordinatin tam adresini cihazin harita servisinden ister.
 *
 * Cozulemezse `null` doner ve HATA FIRLATMAZ: adres bir suslemedir,
 * yoklugu ekrani bozmamali. Web surumunde servis desteklenmedigi icin
 * bu yol her zaman `null` verir - orada mekanin semti gorunmeye devam
 * eder.
 */
export async function adresCoz(lat: number, lng: number): Promise<string | null> {
  try {
    const sonuclar = await reverseGeocodeAsync({ latitude: lat, longitude: lng })
    const ilk = sonuclar?.[0]
    return ilk ? adresYaz(ilk) : null
  } catch {
    return null
  }
}
