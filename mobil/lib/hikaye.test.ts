import {
  konumuDuzelt,
  hikayeAkisiniGetir,
  hikayeEkle,
  hikayeSil,
  hikayeGoruntuleyenleriGetir,
  hikayeGruplariniSirala,
  hikayeyeYanitVer,
  hikayeSeridiVerisiniGetir,
  seritOnbelleginiOku,
  SERIT_ONBELLEK_OMRU_MS,
  type HikayeGrubu,
} from './hikaye'
import { supabase } from './supabase'
import { profilOzetleriniGetir } from './akis'
import { mesajGonder } from './sohbet'
import { dosyayiOku } from './dosya-oku'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn(), getSession: jest.fn() },
    storage: { from: jest.fn() },
  },
}))
jest.mock('./akis', () => ({ profilOzetleriniGetir: jest.fn() }))
jest.mock('./sohbet', () => ({ mesajGonder: jest.fn() }))
jest.mock('./dosya-oku', () => ({ dosyayiOku: jest.fn() }))

const createSignedUrls = jest.fn()
const upload = jest.fn()
const remove = jest.fn()

function satir(ek: Record<string, unknown>) {
  return {
    id: 'h1',
    kullanici_id: 'ben',
    fotograf: 'ben/1.jpg',
    yazi: null,
    ifade: null,
    etiketler: [],
    mekan_id: null,
    mekan_adi: null,
    olusturuldu: '2026-09-22T10:00:00Z',
    bitis: '2026-09-23T10:00:00Z',
    gordum: true,
    goruntulenme_sayisi: 0,
    ...ek,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'ben' } } })
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'ben' } } } })
  ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls, upload, remove })
  createSignedUrls.mockImplementation(async (yollar: string[]) => ({
    data: yollar.map((y) => ({ path: y, signedUrl: `https://imzali/${y}`, error: null })),
    error: null,
  }))
  upload.mockResolvedValue({ data: { path: 'ben/123.jpg' }, error: null })
  remove.mockResolvedValue({ data: [], error: null })
  ;(dosyayiOku as jest.Mock).mockResolvedValue(new Uint8Array([1]))
  ;(profilOzetleriniGetir as jest.Mock).mockImplementation(async (ids: string[]) =>
    Object.fromEntries(ids.filter((id) => id !== 'engelli').map((id) => [id, { ad: `Ad ${id}`, rumuz: `k_${id}`, avatarUrl: null }]))
  )
})

describe('hikayeAkisiniGetir', () => {
  it('kisi kisi gruplar, benimki ilk, gorulmemis once, imzali adresleri baglar', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        satir({ id: 'a1', kullanici_id: 'ayse', gordum: true, olusturuldu: '2026-09-22T11:00:00Z' }),
        satir({ id: 'b2', kullanici_id: 'burak', gordum: false, olusturuldu: '2026-09-22T09:00:00Z', fotograf: 'burak/2.jpg' }),
        satir({ id: 'b1', kullanici_id: 'burak', gordum: true, olusturuldu: '2026-09-22T08:00:00Z', fotograf: 'burak/1.jpg' }),
        satir({ id: 'h1', kullanici_id: 'ben', goruntulenme_sayisi: 3, mekan_adi: 'Hozee' }),
      ],
      error: null,
    })
    const gruplar = await hikayeAkisiniGetir()
    expect(gruplar.map((g) => g.kullaniciId)).toEqual(['ben', 'burak', 'ayse'])
    expect(gruplar[0].benimMi).toBe(true)
    expect(gruplar[0].gorulmemisVar).toBe(false)
    expect(gruplar[0].hikayeler[0].goruntulenmeSayisi).toBe(3)
    expect(gruplar[0].hikayeler[0].mekanAdi).toBe('Hozee')
    // Burak: eskiden yeniye sirali, gorulmemis var.
    expect(gruplar[1].hikayeler.map((h) => h.id)).toEqual(['b1', 'b2'])
    expect(gruplar[1].gorulmemisVar).toBe(true)
    expect(gruplar[1].hikayeler[1].fotografUrl).toBe('https://imzali/burak/2.jpg')
    expect(gruplar[1].kullaniciAdi).toBe('k_burak')
    // Imzalar TEK cagriyla.
    expect(createSignedUrls).toHaveBeenCalledTimes(1)
  })

  it('profil ozeti gelmeyen kisi (engelli/askida) atlanir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [satir({ id: 'e1', kullanici_id: 'engelli' }), satir({ id: 'a1', kullanici_id: 'ayse' })],
      error: null,
    })
    const gruplar = await hikayeAkisiniGetir()
    expect(gruplar.map((g) => g.kullaniciId)).toEqual(['ayse'])
  })

  it('bos akista imza ve profil istegi atmaz', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null })
    expect(await hikayeAkisiniGetir()).toEqual([])
    expect(createSignedUrls).not.toHaveBeenCalled()
    expect(profilOzetleriniGetir).not.toHaveBeenCalled()
  })
})

describe('hikayeGruplariniSirala', () => {
  const grup = (id: string, benimMi: boolean, gorulmemisVar: boolean, zaman: string): HikayeGrubu => ({
    kullaniciId: id,
    ad: id,
    kullaniciAdi: id,
    avatarUrl: null,
    benimMi,
    gorulmemisVar,
    hikayeler: [
      {
        id: `${id}-1`,
        kullaniciId: id,
        fotograf: 'x',
        fotografUrl: null,
        yazi: null,
        ifade: null,
        etiketler: [],
        mekanId: null,
        mekanAdi: null,
        olusturuldu: zaman,
        bitis: zaman,
        gordum: !gorulmemisVar,
        goruntulenmeSayisi: 0,
    gorunurluk: 'arkadaslar' as const,
    yerlesim: null,
      },
    ],
  })

  it('ben > gorulmemis (yeni once) > gorulmus (yeni once)', () => {
    const s = hikayeGruplariniSirala([
      grup('eskiGorulmus', false, false, '2026-09-22T01:00:00Z'),
      grup('yeniGorulmus', false, false, '2026-09-22T05:00:00Z'),
      grup('eskiYeni', false, true, '2026-09-22T02:00:00Z'),
      grup('ben', true, false, '2026-09-21T00:00:00Z'),
      grup('yeniYeni', false, true, '2026-09-22T06:00:00Z'),
    ])
    expect(s.map((g) => g.kullaniciId)).toEqual(['ben', 'yeniYeni', 'eskiYeni', 'yeniGorulmus', 'eskiGorulmus'])
  })
})

describe('hikayeEkle', () => {
  it('once kovaya yukler, sonra RPC; yaziyi kirpar, bos yaziyi null gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: { id: 'h-yeni' }, error: null })
    const id = await hikayeEkle('file:///a.jpg', '  selam  ', 'mekan-1')
    expect(id).toBe('h-yeni')
    expect(supabase.storage.from).toHaveBeenCalledWith('hikaye-medyalari')
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^ben\/\d+\.jpg$/), expect.anything(), { contentType: 'image/jpeg' })
    expect(supabase.rpc).toHaveBeenCalledWith('hikaye_ekle', {
      p_fotograf: 'ben/123.jpg',
      p_yazi: 'selam',
      p_mekan_id: 'mekan-1',
      p_ifade: null,
      p_etiketler: null,
      p_gorunurluk: 'arkadaslar',
      p_yerlesim: null,
    })

    await hikayeEkle('file:///a.jpg', '   ', null)
    expect(supabase.rpc).toHaveBeenLastCalledWith('hikaye_ekle', {
      p_fotograf: 'ben/123.jpg',
      p_yazi: null,
      p_mekan_id: null,
      p_ifade: null,
      p_etiketler: null,
      p_gorunurluk: 'arkadaslar',
      p_yerlesim: null,
    })
  })

  it('IFADE ve ETIKETLER gonderiliyor (2026-09-22); bos etiket listesi null gider', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: { id: 'h-yeni' }, error: null })

    await hikayeEkle('file:///a.jpg', 'selam', 'mekan-1', 'kahve-keyfi', ['k1', 'k2'])

    expect(supabase.rpc).toHaveBeenCalledWith('hikaye_ekle', {
      p_fotograf: 'ben/123.jpg',
      p_yazi: 'selam',
      p_mekan_id: 'mekan-1',
      p_ifade: 'kahve-keyfi',
      p_etiketler: ['k1', 'k2'],
      p_gorunurluk: 'arkadaslar',
      p_yerlesim: null,
    })
  })

  it('RPC reddederse yuklenen dosyayi geri siler ve hatayi firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Ayni anda en fazla 10 hikayen olabilir' } })
    await expect(hikayeEkle('file:///a.jpg', null, null)).rejects.toThrow()
    expect(remove).toHaveBeenCalledWith(['ben/123.jpg'])
  })
})

describe('hikayeSil / goruntuleyenler / yanit', () => {
  it('hikayeSil: RPC yolu doner, dosya kovadan silinir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'ben/1.jpg', error: null })
    await hikayeSil('h1')
    expect(supabase.rpc).toHaveBeenCalledWith('hikaye_sil', { p_hikaye_id: 'h1' })
    expect(remove).toHaveBeenCalledWith(['ben/1.jpg'])
  })

  it('goruntuleyenler: profil ozetiyle birlestirir, en yeni once', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { kullanici_id: 'ayse', goruldu: '2026-09-22T10:00:00Z' },
        { kullanici_id: 'burak', goruldu: '2026-09-22T11:00:00Z' },
      ],
      error: null,
    })
    const liste = await hikayeGoruntuleyenleriGetir('h1')
    expect(liste.map((k) => k.id)).toEqual(['burak', 'ayse'])
    expect(liste[0].kullaniciAdi).toBe('k_burak')
  })

  it('yanit: on ekle sohbet mesaji olarak gider', async () => {
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')
    const k = await hikayeyeYanitVer('ayse', 'Hikâyene yanıt:', ' harika ')
    expect(k).toBe('konusma-1')
    expect(mesajGonder).toHaveBeenCalledWith('ayse', 'Hikâyene yanıt: harika')
  })
})

describe('hikayeSeridiVerisiniGetir', () => {
  it('grubum yoksa kendi gorunumumu akis_profilleri ile ayrica okur', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [satir({ id: 'a1', kullanici_id: 'ayse' })], error: null })
    const v = await hikayeSeridiVerisiniGetir()
    expect(v.gruplar.map((g) => g.kullaniciId)).toEqual(['ayse'])
    expect(v.ben).toEqual({ id: 'ben', ad: 'Ad ben', kullaniciAdi: 'k_ben', avatarUrl: null })
  })

  it('grubum varsa ikinci profil istegi atmaz', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [satir({ id: 'h1', kullanici_id: 'ben' })], error: null })
    const v = await hikayeSeridiVerisiniGetir()
    expect(v.ben?.id).toBe('ben')
    expect(profilOzetleriniGetir).toHaveBeenCalledTimes(1)
  })
})

/**
 * IMZA ONBELLEGI (kullanicinin bildirimi 2026-09-22: "hala biraz
 * gecikmeli geliyor hikayeler").
 *
 * Hikaye kovasi once KENDI imzalama fonksiyonunu kullaniyordu; her akis
 * cekilisinde ayni dosya icin YENI adres uretiliyordu. Gorsel onbellegi
 * (expo-image) adresi anahtar aldigi icin her seferinde iskaliyor ve
 * fotograf yeniden iniyordu.
 */
describe('hikaye fotograf adresleri - imza onbellegi', () => {
  it('ikinci akis cekilisinde AYNI adres doner ve sunucuya yeniden imzalatilmaz', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [satir({ id: 'h1', kullanici_id: 'ayse' })], error: null })

    const ilk = await hikayeAkisiniGetir()
    const imzaSayisi = createSignedUrls.mock.calls.length
    const ikinci = await hikayeAkisiniGetir()

    expect(ikinci[0].hikayeler[0].fotografUrl).toBe(ilk[0].hikayeler[0].fotografUrl)
    expect(createSignedUrls).toHaveBeenCalledTimes(imzaSayisi)
  })
})

/**
 * BAYAT SERIT ONBELLEGI (kullanicinin bildirimi 2026-09-22: "burda iki
 * hikaye var bir tane varmis gibi cubuk ilerliyor, ustte ikinci
 * sonradan beliriyor"). Izleyici seridin onbellegiyle aninda aciliyor;
 * hikaye eklendiginde/silindiginde o onbellek DUSMEZSE ekran bir
 * hikaye eksik acilir ve cubuk sayisi sonradan degisir.
 */
describe('serit onbellegi', () => {
  it('hikaye EKLENINCE onbellek dusuyor', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [satir({ kullanici_id: 'ben' })], error: null })
    await hikayeSeridiVerisiniGetir()
    expect(seritOnbelleginiOku()).not.toBeNull()

    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: { id: 'h-yeni' }, error: null })
    await hikayeEkle('file:///a.jpg', null, null)

    expect(seritOnbelleginiOku()).toBeNull()
  })

  it('hikaye SILININCE onbellek dusuyor', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [satir({ kullanici_id: 'ben' })], error: null })
    await hikayeSeridiVerisiniGetir()
    expect(seritOnbelleginiOku()).not.toBeNull()

    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'ben/1.jpg', error: null })
    await hikayeSil('h1')

    expect(seritOnbelleginiOku()).toBeNull()
  })

  it('YASLI onbellek okunmuyor', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [satir({ kullanici_id: 'ben' })], error: null })
    await hikayeSeridiVerisiniGetir()

    const gercek = Date.now
    Date.now = () => gercek() + SERIT_ONBELLEK_OMRU_MS + 1000
    try {
      expect(seritOnbelleginiOku()).toBeNull()
    } finally {
      Date.now = gercek
    }
  })
})

/**
 * Sunucudan gelen yerlesim istemcide TEMIZLENIYOR (2026-09-22): eski
 * surumden kalan, elle yazilmis ya da bozuk bir deger ekrani kirmamali.
 */
describe('konumuDuzelt', () => {
  const varsayilan = { x: 0.5, y: 0.5, olcek: 1 }

  it('eksik/bozuk degeri varsayilana dusurur', () => {
    expect(konumuDuzelt(null, varsayilan)).toEqual(varsayilan)
    expect(konumuDuzelt({ x: 'a', y: null }, varsayilan)).toEqual(varsayilan)
    expect(konumuDuzelt({ x: Number.NaN, y: 0.2, olcek: 2 }, varsayilan)).toEqual({ x: 0.5, y: 0.2, olcek: 2 })
  })

  it('ekran disini ve asiri olcegi kirpar', () => {
    expect(konumuDuzelt({ x: 5, y: -3, olcek: 99 }, varsayilan)).toEqual({ x: 1, y: 0, olcek: 3 })
  })
})
