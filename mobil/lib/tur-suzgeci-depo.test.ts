import AsyncStorage from '@react-native-async-storage/async-storage'
import { turSuzgeciniOku, turSuzgeciniYaz } from './tur-suzgeci-depo'
import { kendiKullaniciIdim } from './profil'

jest.mock('./profil', () => ({ kendiKullaniciIdim: jest.fn() }))

// Anahtar HESABA BAGLI (2026-09-13): ayni telefonda ikinci hesap
// oncekinin secimini gormemeli.
const ANAHTAR = 'slooin.tur-suzgeci.kisi-a'

beforeEach(async () => {
  await AsyncStorage.clear()
  ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue('kisi-a')
})

describe('tur suzgeci deposu', () => {
  it('yazilan suzgec geri okunuyor', async () => {
    await turSuzgeciniYaz(['Kafe', 'Restoran'])

    expect(await turSuzgeciniOku()).toEqual(['Kafe', 'Restoran'])
  })

  /*
   * BOS LISTE ANAHTARI SILIYOR. "Filtreyi kaldır" buradan geciyor;
   * anahtar kalsaydi bir sonraki acilista bos bir dizi okunur ve
   * gereksiz yere yazilmis bir kayit ortada dururdu.
   */
  it('bos liste anahtari siliyor', async () => {
    await turSuzgeciniYaz(['Kafe'])
    await turSuzgeciniYaz([])

    expect(await AsyncStorage.getItem(ANAHTAR)).toBeNull()
    expect(await turSuzgeciniOku()).toEqual([])
  })

  it('hicbir sey yazilmamissa bos donuyor', async () => {
    expect(await turSuzgeciniOku()).toEqual([])
  })

  /*
   * BILINMEYEN TUR SESSIZCE ATILIYOR. Depodaki deger eski bir
   * surumden kalmis ya da elle bozulmus olabilir; tanimadigimiz bir
   * tur sunucuya gidip BOS LISTE dondururdu ve kullanici sebebini
   * goremezdi.
   */
  it('bilinmeyen tur ayikleniyor, bilinenler kaliyor', async () => {
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify(['Kafe', 'Uzay Ussu']))

    expect(await turSuzgeciniOku()).toEqual(['Kafe'])
  })

  it('bozuk deger PATLAMIYOR, bos donuyor', async () => {
    await AsyncStorage.setItem(ANAHTAR, '{bu json degil')

    expect(await turSuzgeciniOku()).toEqual([])
  })

  it('dizi olmayan deger bos donuyor', async () => {
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify({ tur: 'Kafe' }))

    expect(await turSuzgeciniOku()).toEqual([])
  })

  /*
   * HESAP AYRIMI (kullanicinin bildirdigi kusur 2026-09-13): A'nin
   * kaydettigi suzgec B'ye gorunmuyor; oturum yokken hicbir sey
   * yazilmiyor; eski hesapsiz anahtar ilk okumada siliniyor.
   */
  it('baska hesabin suzgeci okunmuyor', async () => {
    await turSuzgeciniYaz(['Kafe'])
    ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue('kisi-b')

    expect(await turSuzgeciniOku()).toEqual([])
  })

  it('oturum yokken yazmiyor ve bos okuyor', async () => {
    ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue(null)
    await turSuzgeciniYaz(['Kafe'])

    expect(await turSuzgeciniOku()).toEqual([])
    expect((await AsyncStorage.getAllKeys()).length).toBe(0)
  })

  it('eski hesapsiz anahtar devredilmiyor, ilk okumada siliniyor', async () => {
    await AsyncStorage.setItem('slooin.tur-suzgeci', JSON.stringify(['Kafe']))

    expect(await turSuzgeciniOku()).toEqual([])
    expect(await AsyncStorage.getItem('slooin.tur-suzgeci')).toBeNull()
  })
})
