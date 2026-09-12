import AsyncStorage from '@react-native-async-storage/async-storage'
import { TEMEL_TURLER } from './mekan'
import { kendiKullaniciIdim } from './profil'

/**
 * TUR SUZGECI CIHAZDA SAKLANIYOR.
 *
 * Kullanicinin istegi (2026-09-09): "check-in sayfasinda yaptigim
 * filtreyi kaydet yapinca kayitli kalsin, baska sayfada ekranda
 * gezsem de uygulamadan ciksam da kayitli dursun."
 *
 * Onceden secim yalnizca ekranin state'indeydi: baska bir sekmeye
 * gecip donmek bile suzgeci sifirliyordu, cunku ekran yeniden
 * kuruluyordu.
 *
 * CIHAZDA, SUNUCUDA DEGIL. Bu bir tercih degil bir GORUNUM AYARI:
 * kisinin hesabina bagli bir sey degil, o telefonda o an neye baktigi.
 * Sunucuya yazmak hem gereksiz bir tablo hem de her acilista bir
 * istek demekti.
 *
 * KISISEL VERI DEGIL: yalnizca tur adlari (ornegin "Kafe") duruyor;
 * konum, kimlik ya da arama gecmisi saklanmiyor.
 *
 * ANAHTAR HESABA BAGLI (kullanicinin bildirdigi kusur 2026-09-13):
 * "yeni bir uyelik acmama ragmen kafe filtresi secili cikti - her
 * kullanici kendi secimini yapmali." Tek anahtar ayni telefondaki
 * ikinci hesaba onceki hesabin secimini devrediyordu. Artik anahtar
 * `slooin.tur-suzgeci.<kullanici id>`; oturum yoksa hicbir sey
 * okunmuyor/yazilmiyor. Eski tek anahtar okundugu ilk anda SILINIYOR
 * ki kimseye devredilmesin.
 */

const ESKI_ANAHTAR = 'slooin.tur-suzgeci'

async function anahtar(): Promise<string | null> {
  const kimlik = await kendiKullaniciIdim()
  return kimlik ? `${ESKI_ANAHTAR}.${kimlik}` : null
}

/**
 * Okurken BILINEN TURLERE SUZULUYOR.
 *
 * Depodaki deger eski bir surumden kalmis olabilir ya da elle
 * bozulabilir; tanimadigimiz bir tur sunucuya gidip bos liste
 * dondururdu ve kullanici sebebini goremezdi. Bilinmeyen degerler
 * sessizce atiliyor - suzgec dar kalir ama ekran calisir.
 */
export async function turSuzgeciniOku(): Promise<string[]> {
  try {
    // Eski surumden kalan hesapsiz anahtar: kime ait oldugu belli
    // degil, devredilmesin diye siliniyor.
    await AsyncStorage.removeItem(ESKI_ANAHTAR)
    const k = await anahtar()
    if (!k) return []
    const ham = await AsyncStorage.getItem(k)
    if (!ham) return []
    const cozulmus = JSON.parse(ham)
    if (!Array.isArray(cozulmus)) return []
    return cozulmus.filter((t): t is string => typeof t === 'string' && TEMEL_TURLER.includes(t))
  } catch {
    // Bozuk deger ya da depo hatasi: suzgecsiz baslamak dogru davranis.
    return []
  }
}

export async function turSuzgeciniYaz(turler: string[]): Promise<void> {
  try {
    const k = await anahtar()
    if (!k) return
    if (turler.length === 0) await AsyncStorage.removeItem(k)
    else await AsyncStorage.setItem(k, JSON.stringify(turler))
  } catch {
    // Yazilamamasi ekranin calismasini engellemiyor; yalnizca secim
    // bir sonraki acilista hatirlanmaz.
  }
}
