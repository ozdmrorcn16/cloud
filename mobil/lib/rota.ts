/**
 * YOL ROTASI - kullanicinin bulundugu yerden mekana giden GERCEK yol.
 *
 * Kullanicinin istegi (2026-09-09): "boyle kesik cizgi olmaz, yol
 * tarifi al dendiginde en kisa yol nerden gosteriyorsa gercek
 * haritanin cizdigi gibi yol ciz yoldan". Ornek olarak Google
 * Haritalar'in mavi rota cizgisini gosterdi.
 *
 * ONCEKI HAL DUZ CIZGIYDI ve o karar geri alindi: iki nokta arasina
 * kesikli bir dogru cekiliyordu. Kullanici sokaklari takip eden bir
 * yol istiyor.
 *
 * SAGLAYICI: OSRM (Open Source Routing Machine) genel sunucusu.
 * Anahtar istemiyor, hesap istemiyor, OpenStreetMap verisiyle
 * calisiyor - bizim zaten kullandigimiz ve atif verdigimiz kaynak.
 *
 * ELENEN SECENEKLER, tekrar arastirilmasin:
 * - Google Directions: ucretli, sonucu SAKLAMAK yasak ve gosterirken
 *   GOOGLE HARITASI sarti var; biz iOS'ta Apple Haritalar
 *   kullaniyoruz, yani lisansla celisiyor (2026-08-31 arastirmasi).
 * - Apple MKDirections: yerel olarak var ama `react-native-maps` onu
 *   disari acmiyor; native modul yazmak yeni bir derleme demek, OTA
 *   ile gitmez.
 * - Mapbox / OpenRouteService: ucretsiz katmanlari var ama HESAP ve
 *   ANAHTAR gerektiriyor (kullanicinin elini gerektiren bir adim).
 *
 * ACIK BORC - MAGAZA ONCESI: OSRM'in genel sunucusu "demo" niteliginde
 * ve agir kullanim icin verilmis bir soz yok. Yayina cikmadan once ya
 * kendi OSRM ornegimiz ya da anahtarli bir saglayici (OpenRouteService
 * 2.000 istek/gun ucretsiz) baglanmali. Sozlesme burada tek yerde,
 * yani degisiklik bu dosyayla sinirli kalir.
 *
 * KVKK: bu cagri kullanicinin KOORDINATINI ucuncu bir tarafa
 * gonderiyor. Aydinlatma metnine yazildi (`gizlilik.tsx` madde 5 ve
 * `docs/gizlilik-metni.md`); harita saglayicisiyla ayni sinifta.
 * Cagri kimlik TASIMIYOR - yalnizca iki koordinat gidiyor.
 */

/** Istek en fazla bu kadar bekler; sonrasinda rota YOK sayilir. */
const ZAMAN_ASIMI_MS = 6000

const TABAN = 'https://router.project-osrm.org/route/v1/driving'

type Nokta = { lat: number; lng: number }

export type Rota = {
  /** Yolun kirilma noktalari; haritada cizgi olarak ciziliyor. */
  noktalar: Nokta[]
  /** Yol boyunca mesafe (metre) - kus ucusu DEGIL. */
  metre: number
}

/**
 * Iki nokta arasindaki surus rotasini getirir.
 *
 * Basarisiz olursa `null` doner ve ekran HICBIR SEY cizmez. Duz cizgi
 * yedegi bilerek YOK: kullanici tam olarak onu reddetti, ve yanlis bir
 * yol gostermektense hic gostermemek dogru (bkz. "guvenilmeyen veriyi
 * gosterme" kurali).
 */
export async function rotaGetir(baslangic: Nokta, bitis: Nokta): Promise<Rota | null> {
  // OSRM koordinati BOYLAM,ENLEM sirasiyla istiyor - alisilmis
  // "enlem, boylam" sirasinin TERSI. Ters yazilirsa sunucu hata
  // vermiyor, denizin ortasindan bir rota deniyor.
  const yol =
    `${TABAN}/${baslangic.lng},${baslangic.lat};${bitis.lng},${bitis.lat}` +
    '?overview=full&geometries=geojson&alternatives=false&steps=false'

  const kontrol = new AbortController()
  const sayac = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI_MS)
  try {
    const cevap = await fetch(yol, { signal: kontrol.signal })
    if (!cevap.ok) return null
    const veri = (await cevap.json()) as {
      code?: string
      routes?: { distance?: number; geometry?: { coordinates?: [number, number][] } }[]
    }
    if (veri.code !== 'Ok') return null

    const rota = veri.routes?.[0]
    const koordinatlar = rota?.geometry?.coordinates
    if (!koordinatlar || koordinatlar.length < 2) return null

    return {
      noktalar: koordinatlar.map(([lng, lat]) => ({ lat, lng })),
      metre: Math.round(rota?.distance ?? 0),
    }
  } catch {
    // Ag yok, zaman asimi, bozuk cevap - hepsi ayni sonuc: rota yok.
    return null
  } finally {
    clearTimeout(sayac)
  }
}
