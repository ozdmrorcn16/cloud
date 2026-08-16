import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ikiKullaniciIleBaglan,
  esitMi,
  sonucuBildirVeCik,
  bosTemizlenecekler,
  temizle,
  type Temizlenecekler,
} from './yardimcilar'

// Iki test mekani birbirinden >500 m (check-in yaricapi) uzakta, boylece
// "farkli mekanda canli gorunmez" senaryosu gercekten farkli mekanlarla
// test edilebiliyor. Ayni koordinatlar hem mekanin kendi konumu hem de
// mekan_ekle/check_in_yap'in bekledigi "cihaz konumu" olarak kullaniliyor
// (~200 m / ~500 m yakinlik kontrollerini gecmek icin).
const MEKAN_1 = { ad: 'GORUNURLUK-TEST-MEKAN-1', lat: 39.0, lng: 35.0 }
const MEKAN_2 = { ad: 'GORUNURLUK-TEST-MEKAN-2', lat: 39.01, lng: 35.02 }

async function mekanGetirVeyaOlustur(istemci: SupabaseClient, ad: string, lat: number, lng: number) {
  const { data: mevcut, error: selErr } = await istemci
    .from('mekanlar')
    .select('id')
    .eq('ad', ad)
    .limit(1)
  if (selErr) throw new Error(`mekan sorgu hatasi (${ad}): ${selErr.message}`)
  if (mevcut && mevcut.length > 0) return mevcut[0].id as string

  const { data: yeni, error } = await istemci.rpc('mekan_ekle', {
    p_ad: ad,
    p_tur: 'test',
    p_lat: lat,
    p_lng: lng,
    p_cihaz_lat: lat,
    p_cihaz_lng: lng,
  })
  if (error) throw new Error(`mekan olusturma hatasi (${ad}): ${error.message}`)
  return (yeni as { id: string }).id
}

async function checkInYap(
  istemci: SupabaseClient,
  mekanId: string,
  lat: number,
  lng: number,
  gizliMi = false
) {
  const { data, error } = await istemci.rpc('check_in_yap', {
    p_mekan_id: mekanId,
    p_lat: lat,
    p_lng: lng,
    p_gizli_mi: gizliMi,
  })
  if (error) throw new Error(`check-in hatasi: ${error.message}`)
  return data as { id: string; konum: string | null }
}

async function canliSakinIdleri(istemci: SupabaseClient, mekanId: string) {
  const { data, error } = await istemci
    .from('check_inler')
    .select('kullanici_id')
    .eq('mekan_id', mekanId)
    .not('konum', 'is', null)
  if (error) throw new Error(`canli sakin sorgusu hatasi: ${error.message}`)
  return (data as { kullanici_id: string }[]).map((r) => r.kullanici_id).sort()
}

async function anilariGetir(istemci: SupabaseClient, sahipId: string, mekanId: string) {
  const { data, error } = await istemci
    .from('check_inler')
    .select('id, kullanici_id')
    .eq('kullanici_id', sahipId)
    .eq('mekan_id', mekanId)
    .is('konum', null)
  if (error) throw new Error(`ani sorgusu hatasi: ${error.message}`)
  return data as { id: string; kullanici_id: string }[]
}

async function senaryo(isim: string, fn: () => Promise<void>) {
  console.log(`\n--- Senaryo: ${isim} ---`)
  try {
    await fn()
  } catch (e) {
    esitMi(`beklenmeyen hata: ${(e as Error).message}`, 'hatasiz calisma', isim)
  }
}

async function main() {
  const { a, b, aId, bId } = await ikiKullaniciIleBaglan()
  const t: Temizlenecekler = bosTemizlenecekler()

  const mekan1 = await mekanGetirVeyaOlustur(a, MEKAN_1.ad, MEKAN_1.lat, MEKAN_1.lng)
  const mekan2 = await mekanGetirVeyaOlustur(a, MEKAN_2.ad, MEKAN_2.lat, MEKAN_2.lng)

  let aCheckIn1Id: string | null = null

  await senaryo('1 - Ayni mekanda karsilikli canli gorunurluk', async () => {
    const aCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: a, id: aCi.id })
    aCheckIn1Id = aCi.id

    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: b, id: bCi.id })

    const aGorenler = await canliSakinIdleri(a, mekan1)
    esitMi(aGorenler, [aId, bId].sort(), 'A, ayni mekanda B\'yi (ve kendini) gorur')

    const bGorenler = await canliSakinIdleri(b, mekan1)
    esitMi(bGorenler, [aId, bId].sort(), 'B, ayni mekanda A\'yi (ve kendini) gorur')
  })

  await senaryo('2 - Farkli mekanda canli gorunmez', async () => {
    // B mekan-2'ye gecer; check_in_yap onceki aktif check-in'ini kapatir.
    const bCi2 = await checkInYap(b, mekan2, MEKAN_2.lat, MEKAN_2.lng)
    t.checkInler.push({ istemci: b, id: bCi2.id })

    // A hala mekan-1'de canli; mekan-2'nin canli sakinlerini sorguladiginda
    // kendi canli check-in'i mekan-2'de olmadigi icin hicbir sey gormemeli.
    const aGorenler = await canliSakinIdleri(a, mekan2)
    esitMi(aGorenler, [], 'A, farkli mekandaki B\'nin canli satirini goremez')

    // Saglama: B kendi acisindan mekan-2'de kendini gorur.
    const bGorenler = await canliSakinIdleri(b, mekan2)
    esitMi(bGorenler, [bId], 'B, kendi bulundugu mekan-2\'de kendini gorur (saglama)')
  })

  await senaryo('3 - Ani herkese acik', async () => {
    if (!aCheckIn1Id) throw new Error('senaryo 1 A check-in id\'si yok, onkosul basarisiz')

    const { error } = await a.rpc('check_inden_ayril', { p_check_in_id: aCheckIn1Id })
    if (error) throw new Error(`check_inden_ayril hatasi: ${error.message}`)

    // B'nin mekan-1'de canli check-in'i yok (mekan-2'ye tasindi), yine de
    // herkese_acik anilar herkese gorunmeli.
    const bGorenAnilar = await anilariGetir(b, aId, mekan1)
    esitMi(
      bGorenAnilar.map((r) => r.id),
      [aCheckIn1Id],
      'B, hicbir yerde check-in\'i olmasa bile A\'nin herkese_acik anisini gorur'
    )
  })

  await senaryo('4 - gorunurluk = kimse olan ani gizlenir', async () => {
    if (!aCheckIn1Id) throw new Error('senaryo 1 A check-in id\'si yok, onkosul basarisiz')

    const { error } = await a
      .from('check_inler')
      .update({ gorunurluk: 'kimse' })
      .eq('id', aCheckIn1Id)
    if (error) throw new Error(`gorunurluk guncelleme hatasi: ${error.message}`)

    const bGorenAnilar = await anilariGetir(b, aId, mekan1)
    esitMi(bGorenAnilar.map((r) => r.id), [], 'B, gorunurluk=kimse olan aniyi goremez')

    const aGorenAnilar = await anilariGetir(a, aId, mekan1)
    esitMi(aGorenAnilar.map((r) => r.id), [aCheckIn1Id], 'A, kendi gizli anisini hala gorur')
  })

  await senaryo('5 - Engelleme canli gorunurlugu keser', async () => {
    // Her ikisi de mekan-1'de canli olsun (yeni check-in, oncekini kapatir).
    const aCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: a, id: aCi.id })
    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: b, id: bCi.id })

    // Engellemeden once: karsilikli gorunur oldugunu dogrula.
    const oncekiAGorenler = await canliSakinIdleri(a, mekan1)
    esitMi(oncekiAGorenler, [aId, bId].sort(), 'engellemeden once A, B\'yi gorur (saglama)')

    const { error } = await a.rpc('engelle', { p_kullanici_id: bId })
    if (error) throw new Error(`engelle hatasi: ${error.message}`)
    t.engellemeler.push({ istemci: a, engellenenId: bId })

    const aGorenler = await canliSakinIdleri(a, mekan1)
    esitMi(aGorenler, [aId], 'A, B\'yi engelledikten sonra B\'nin canli satirini goremez')

    const bGorenler = await canliSakinIdleri(b, mekan1)
    esitMi(bGorenler, [bId], 'B de A\'yi goremez (cift taraflilik)')
  })

  await senaryo('6 - Engelleme gecmis anilari da kapsar', async () => {
    if (!aCheckIn1Id) throw new Error('senaryo 1 A check-in id\'si yok, onkosul basarisiz')

    // Senaryo 3'te B bu aniyi goruyordu; senaryo 5'te A, B'yi engelledi.
    const bGorenAnilar = await anilariGetir(b, aId, mekan1)
    esitMi(
      bGorenAnilar.map((r) => r.id),
      [],
      'A, B\'yi engelledikten sonra B, A\'nin daha onceki (herkese_acik olsa da) anisini goremez'
    )
  })

  await senaryo('7 - Engellenen kisinin profili bulunamadi gibi davranir', async () => {
    const { data, error } = await b.rpc('baskasinin_profili', { p_kullanici_id: aId })
    if (error) throw new Error(`baskasinin_profili hatasi: ${error.message}`)
    esitMi(data, [], 'B, engelleyen A\'nin profilini sorguladiginda bos sonuc alir')
  })

  await senaryo('8 - Yogunluk sayisi engellemeden etkilenmez', async () => {
    const { data: aGoru, error: aErr } = await a.rpc('yakin_mekanlar_yogunluk', {
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
      p_yaricap_metre: 1000,
    })
    if (aErr) throw new Error(`yakin_mekanlar_yogunluk (A) hatasi: ${aErr.message}`)
    const { data: bGoru, error: bErr } = await b.rpc('yakin_mekanlar_yogunluk', {
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
      p_yaricap_metre: 1000,
    })
    if (bErr) throw new Error(`yakin_mekanlar_yogunluk (B) hatasi: ${bErr.message}`)

    const aSayi = (aGoru as { id: string; kisi_sayisi: number }[]).find((m) => m.id === mekan1)
      ?.kisi_sayisi
    const bSayi = (bGoru as { id: string; kisi_sayisi: number }[]).find((m) => m.id === mekan1)
      ?.kisi_sayisi

    esitMi(bSayi, aSayi, 'yakin_mekanlar_yogunluk, A engellemis olsa da A ve B icin ayni sayiyi doner')
  })

  await senaryo('9 - Gizli check-in yogunluk sayisina dahildir', async () => {
    // A, gizli bir check-in yapar (mekan-1'deki onceki canli check-in'ini kapatir).
    const aGizliCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng, true)
    t.checkInler.push({ istemci: a, id: aGizliCi.id })

    const { data: goru, error } = await b.rpc('yakin_mekanlar_yogunluk', {
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
      p_yaricap_metre: 1000,
    })
    if (error) throw new Error(`yakin_mekanlar_yogunluk hatasi: ${error.message}`)

    const sayi = (goru as { id: string; kisi_sayisi: number }[]).find((m) => m.id === mekan1)
      ?.kisi_sayisi
    // Mekan-1'de bu noktada canli olanlar: A (gizli) ve B (senaryo 5'ten beri).
    esitMi(sayi, 2, 'gizli check-in yapan A, mekanin kisi_sayisi\'na dahil edilir')
  })

  await temizle(t)
  sonucuBildirVeCik()
}

main()
