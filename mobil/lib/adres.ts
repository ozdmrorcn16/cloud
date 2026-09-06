import * as Location from 'expo-location'

/**
 * CIHAZDAN ADRES ONERISI - yalnizca "yeni mekan ekle" ekraninda.
 *
 * BU BIR KEZ KALDIRILMISTI (2026-08-31) ve sebebi gizlilik ya da
 * maliyet degil DOGRULUKTU: saglayici yanlis mahalle donduruyordu.
 * Kullanicinin gosterdigi ornek - Nilufer'deki bir mekan icin Apple
 * "Ertugrul" diyordu, dogrusu ALAADDINBEY. O gun adres GOSTERILEN bir
 * bilgiydi ve kimse dogrulamiyordu, yani yanlis veri sessizce ekrana
 * ciciyordu.
 *
 * SIMDI FARKLI: sonuc bir ONERI, kullanici goruyor, degistirebiliyor ve
 * onayliyor (kullanicinin istegi 2026-09-06: "adres kismina bulundugu
 * adresi otomatik doldurma yapilabilir mi, dogru mu diye de sorsun ve
 * degistirilebilsin"). Makine tahmin ediyor, insan dogruluyor - eski
 * itiraz tam da bu adimla kapaniyor.
 *
 * MEKAN LISTESINDE HALA KULLANILMIYOR: orada gosterilen konum ilce ve
 * il, ve o ikisi poligon testiyle atandigi icin kesin (kullanicinin
 * karari 2026-08-31, "TAM DOGRULUK ADINA"). Bu modul yalnizca kisinin
 * kendi girdigi mekana yardim ediyor.
 */

/** Cozulen adresin ekranda gosterilecek hali; hicbir sey bulunamazsa null. */
export function adresiBirlestir(a: Location.LocationGeocodedAddress): string | null {
  // Sokak + kapi numarasi + mahalle. Ulke ve il BILEREK yok: mekan
  // zaten kullanicinin bulundugu yerde ve ekranda ilce/il ayrica
  // gosteriliyor; tekrar etmek satiri uzatiyor.
  const parcalar = [
    a.street ?? undefined,
    // `name` cogu zaman kapi numarasi ya da bina adi. Sokakla ayni
    // seyse tekrar etmiyor.
    a.name && a.name !== a.street ? a.name : undefined,
    a.district ?? undefined,
  ].filter((p): p is string => Boolean(p && p.trim()))

  if (parcalar.length === 0) return null
  return parcalar.join(' ')
}

/**
 * Verilen koordinat icin adres onerisi.
 *
 * Cozulemezse `null` doner ve cagiran sessizce devam eder: adres alani
 * ZATEN opsiyonel, oneri gelmemesi bir hata degil. Web'de bu API yok,
 * orada da null donuyor.
 */
export async function adresOnerisiAl(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const sonuclar = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    })
    const ilk = sonuclar[0]
    return ilk ? adresiBirlestir(ilk) : null
  } catch {
    return null
  }
}
