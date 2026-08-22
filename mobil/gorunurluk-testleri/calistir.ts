import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  ikiKullaniciIleBaglan,
  ucuncuKullaniciIleBaglan,
  esitMi,
  sonucuBildirVeCik,
  bosTemizlenecekler,
  temizle,
  yoneticiIstemcisi,
  hesapDurumunuTemizle,
  type Temizlenecekler,
} from './yardimcilar'

// --tavan: senaryo 29'u (gunluk istek tavani) TAM KOSUMA EKLER, otuz
// senaryonun hepsi calisir (yalnizca 29'u degil). Bu senaryo A'nin
// istek_gunlugu kaydina 50'ye yakin KALICI (silinemeyen) satir ekliyor;
// varsayilan kosumda calissaydi bir sonraki normal kosum senaryo
// 19/20/26/28'in A'dan gonderdigi istekleri tavana takilarak bozardi.
// Bu yuzden ayri, acikca isaretlenmis bir bayrakla calisiyor.
const TAVAN_MODU = process.argv.includes('--tavan')

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
  bulunurluk = 'herkese_acik'
): Promise<string> {
  const { data, error } = await istemci.rpc('check_in_yap', {
    p_mekan_id: mekanId,
    p_lat: lat,
    p_lng: lng,
    p_bulunurluk: bulunurluk,
  })
  if (error) throw new Error(`check-in hatasi: ${error.message}`)
  return (data as { id: string }).id
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

// anilariGetir sahip+mekan bazinda TUM anilari listeler; bir sahibin
// birden fazla anisi biriktigi senaryolarda (ör. senaryo 6, A'nin
// baska bir anisini da olusturuyor) belirli BIR satirin gorunup
// gorunmedigini net sekilde sormak icin id'ye gore dogrudan sorgu:
async function aniGorulebiliyorMu(istemci: SupabaseClient, checkInId: string): Promise<boolean> {
  const { data, error } = await istemci.from('check_inler').select('id').eq('id', checkInId)
  if (error) throw new Error(`ani gorunurluk sorgusu hatasi: ${error.message}`)
  return (data as { id: string }[]).length > 0
}

type KonusmaSatiri = {
  konusma_id: string
  kisi_id: string
  kullanici_adi: string
  ad: string
  son_mesaj: string | null
  son_mesaj_zamani: string | null
  okunmamis: number
  yazilabilir_mi: boolean
}

// Iki yon de ayri sorgulanip birlestiriliyor: "x ile y arasinda hicbir
// takip satiri yok" gibi bir on kosulun/temizlik dogrulamasinin, iki
// yonelimden yalnizca birine bakip digerini kacirmasini onlemek icin.
async function ikiYonTakipSatirlari(istemci: SupabaseClient, x: string, y: string) {
  const { data: xy, error: xyHata } = await istemci
    .from('takipler')
    .select('takip_eden_id')
    .eq('takip_eden_id', x)
    .eq('takip_edilen_id', y)
  if (xyHata) throw new Error(`takip sorgu hatasi: ${xyHata.message}`)

  const { data: yx, error: yxHata } = await istemci
    .from('takipler')
    .select('takip_eden_id')
    .eq('takip_eden_id', y)
    .eq('takip_edilen_id', x)
  if (yxHata) throw new Error(`takip sorgu hatasi: ${yxHata.message}`)

  return [...(xy ?? []), ...(yx ?? [])]
}

// Ayni desen sohbet_istekleri icin.
async function ikiYonSohbetSatirlari(istemci: SupabaseClient, x: string, y: string) {
  const { data: xy, error: xyHata } = await istemci
    .from('sohbet_istekleri')
    .select('gonderen_id')
    .eq('gonderen_id', x)
    .eq('alan_id', y)
  if (xyHata) throw new Error(`sohbet sorgu hatasi: ${xyHata.message}`)

  const { data: yx, error: yxHata } = await istemci
    .from('sohbet_istekleri')
    .select('gonderen_id')
    .eq('gonderen_id', y)
    .eq('alan_id', x)
  if (yxHata) throw new Error(`sohbet sorgu hatasi: ${yxHata.message}`)

  return [...(xy ?? []), ...(yx ?? [])]
}

// engellemeler icin ayni sey YAPILAMAZ: select politikasi yalnizca
// "engelleyen_id = auth.uid()" satirlarini aciyor, yani karsi yon her
// zaman bos donerdi ve "iki yon de temiz" iddiasi yariya kadar sahte
// olurdu. Bu yuzden sorgu bilerek tek yonlu ve her zaman ENGELLEYEN
// tarafin istemcisiyle yapiliyor.
async function engellemeSatirlari(
  istemci: SupabaseClient,
  engelleyenId: string,
  engellenenId: string
) {
  const { data, error } = await istemci
    .from('engellemeler')
    .select('engelleyen_id')
    .eq('engelleyen_id', engelleyenId)
    .eq('engellenen_id', engellenenId)
  if (error) throw new Error(`engelleme sorgu hatasi: ${error.message}`)
  return data ?? []
}

// mesaj_gonder'in yazdigi konusmalar/konusma_uyeleri/mesajlar satirlarini
// silmenin TEK yolu: istemcinin konusmalar uzerinde delete yetkisi yok
// (insert/update/delete authenticated'dan geri alindi, Faz 3b Task 3-5).
// Yonetici istemcisiyle siliniyor ve silmenin GERCEKTEN calistigi ayrica
// bir select ile dogrulaniyor - yalnizca "hata donmedi" degil, "satir
// artik yok" iddia ediliyor. konusma_uyeleri ve mesajlar CASCADE ile
// birlikte gidiyor (Faz 3b Task 3 semasi).
async function konusmaTemizleVeDogrula(konusmaId: string) {
  const yonetici = yoneticiIstemcisi()
  esitMi(
    yonetici !== null,
    true,
    'temizlik: yonetici istemcisi (service role) mevcut, konusma silinebilir'
  )
  if (!yonetici) return

  const { error: silHata } = await yonetici.from('konusmalar').delete().eq('id', konusmaId)
  esitMi(silHata, null, 'temizlik: konusma yonetici istemcisiyle silinebiliyor')

  const { data: kalan, error: kontrolHata } = await yonetici
    .from('konusmalar')
    .select('id')
    .eq('id', konusmaId)
  if (kontrolHata) throw new Error(`konusma kontrol sorgu hatasi: ${kontrolHata.message}`)
  esitMi(kalan, [], 'temizlik: konusma gercekten silinmis (dogrulama, sessiz birakilmiyor)')
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
  t.hesapKimlikleri.push(aId, bId)

  const mekan1 = await mekanGetirVeyaOlustur(a, MEKAN_1.ad, MEKAN_1.lat, MEKAN_1.lng)
  const mekan2 = await mekanGetirVeyaOlustur(a, MEKAN_2.ad, MEKAN_2.lat, MEKAN_2.lng)

  let aCheckIn1Id: string | null = null
  let aCheckIn2Id: string | null = null

  await senaryo('1 - Ayni mekanda karsilikli canli gorunurluk', async () => {
    const aCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: a, id: aCi })
    aCheckIn1Id = aCi

    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: b, id: bCi })

    const aGorenler = await canliSakinIdleri(a, mekan1)
    esitMi(aGorenler, [aId, bId].sort(), 'A, ayni mekanda B\'yi (ve kendini) gorur')

    const bGorenler = await canliSakinIdleri(b, mekan1)
    esitMi(bGorenler, [aId, bId].sort(), 'B, ayni mekanda A\'yi (ve kendini) gorur')
  })

  await senaryo('2 - Farkli mekanda canli gorunmez', async () => {
    // B mekan-2'ye gecer; check_in_yap onceki aktif check-in'ini kapatir.
    const bCi2 = await checkInYap(b, mekan2, MEKAN_2.lat, MEKAN_2.lng)
    t.checkInler.push({ istemci: b, id: bCi2 })

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

    // Madde 1'in revoke'undan sonra check_inler'a dogrudan update artik
    // reddediliyor (bkz. sema-dogrula.ts). Tek yazma yolu
    // ani_gorunurlugunu_ayarla RPC'si; bu noktada A'nin tek anisi
    // aCheckIn1Id oldugu icin RPC'nin butun anilarina uygulanmasi bu
    // satiri hedefliyor demek. 'kimse' zaten en dar deger oldugu icin
    // kelepce onu aynen geciriyor (daraltma degil, esitlik).
    const { error } = await a.rpc('ani_gorunurlugunu_ayarla', { p_deger: 'kimse' })
    if (error) throw new Error(`ani_gorunurlugunu_ayarla hatasi: ${error.message}`)

    const bGorenAnilar = await anilariGetir(b, aId, mekan1)
    esitMi(bGorenAnilar.map((r) => r.id), [], 'B, gorunurluk=kimse olan aniyi goremez')

    const aGorenAnilar = await anilariGetir(a, aId, mekan1)
    esitMi(aGorenAnilar.map((r) => r.id), [aCheckIn1Id], 'A, kendi gizli anisini hala gorur')
  })

  await senaryo('5 - Engelleme canli gorunurlugu keser', async () => {
    // Her ikisi de mekan-1'de canli olsun (yeni check-in, oncekini kapatir).
    const aCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: a, id: aCi })
    aCheckIn2Id = aCi
    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    t.checkInler.push({ istemci: b, id: bCi })

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
    if (!aCheckIn2Id) throw new Error('senaryo 5 A check-in id\'si yok, onkosul basarisiz')

    // ONEMLI: bu senaryonun kendi anisi var — senaryo 4'un gorunurlugunu
    // 'kimse' yaptigi aCheckIn1Id degil, senaryo 5'te acilan aCheckIn2Id
    // kullaniliyor. aCheckIn1Id'yi tekrar kullanmak senaryoyu bosa
    // cikarirdi: o satir zaten gorunurluk='kimse' oldugu icin B onu her
    // halukarda goremez, engellemenin bir etkisi olup olmadigini test
    // edemezdik (blok kaldirilsa bile ayni sonuc cikardi).
    //
    // aCheckIn2Id hala senaryo 5'ten kalma varsayilan gorunurluk =
    // 'herkese_acik' degerinde ve daha once hic degistirilmedi.

    // Pozitif kontrol icin, senaryo 5'in koydugu bloku GECICI olarak
    // kaldiriyoruz. Boylece "B gormuyor" sonucunun sebebinin gercekten
    // engelleme oldugunu, baska bir kuraldan (gorunurluk, mesafe vb.)
    // kaynaklanmadigini kanitlayabiliyoruz.
    const { error: kaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    if (kaldirErr) throw new Error(`engeli_kaldir hatasi: ${kaldirErr.message}`)

    // A'nin senaryo 5'teki canli check-in'ini aniya cevir (konum null).
    const { error: ayrilErr } = await a.rpc('check_inden_ayril', { p_check_in_id: aCheckIn2Id })
    if (ayrilErr) throw new Error(`check_inden_ayril hatasi: ${ayrilErr.message}`)

    // Pozitif kontrol: blok yokken B bu herkese_acik aniyi GERCEKTEN
    // gorebiliyor mu? Bu kontrol gecmezse asagidaki negatif kontrolun
    // hicbir kaniti yok demektir (satir zaten hic gorunmuyor olabilirdi).
    const blokOncesiGorunurMu = await aniGorulebiliyorMu(b, aCheckIn2Id)
    esitMi(
      blokOncesiGorunurMu,
      true,
      'pozitif kontrol: blok yokken B, A\'nin herkese_acik anisini gorur'
    )

    // Simdi bloku tekrar kur (senaryo 7/8/9'un varsaydigi "A, B'yi
    // engellemis" durumunu geri getirir) ve asil iddiayi dogrula.
    const { error: engelErr } = await a.rpc('engelle', { p_kullanici_id: bId })
    if (engelErr) throw new Error(`engelle hatasi: ${engelErr.message}`)

    const blokSonrasiGorunurMu = await aniGorulebiliyorMu(b, aCheckIn2Id)
    esitMi(
      blokSonrasiGorunurMu,
      false,
      'A, B\'yi (yeniden) engelledikten sonra B, ayni herkese_acik aniyi artik goremez'
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

    // Bu noktada mekan-1'de canli olan tek kisi B: A'nin tek canli
    // check-in'i senaryo 6'da aniya cevrildi ve senaryo 9'a kadar yeniden
    // canli check-in acmiyor. Sadece esitlik degil, somut bir bekleneni de
    // dogrulamak (senaryo 9'daki === 2 gibi) "yanlis ama esit" bir sayimi
    // yakalayabilmek icin gerekli.
    esitMi(aSayi, 1, 'yakin_mekanlar_yogunluk (A\'nin gorusu), mekan-1 icin dogru kisi sayisini (1) doner')
    esitMi(bSayi, 1, 'yakin_mekanlar_yogunluk (B\'nin gorusu), mekan-1 icin dogru kisi sayisini (1) doner')
    esitMi(bSayi, aSayi, 'yakin_mekanlar_yogunluk, A engellemis olsa da A ve B icin ayni sayiyi doner')
  })

  await senaryo('9 - Gizli check-in yogunluk sayisina dahildir', async () => {
    // A, gizli bir check-in yapar (mekan-1'deki onceki canli check-in'ini kapatir).
    const aGizliCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'gizli')
    t.checkInler.push({ istemci: a, id: aGizliCi })

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

  await senaryo('10 - Gizli check-in aniya donusunce baskasina gorunmez', async () => {
    // Senaryo 5'ten beri A, B'yi engellemis durumda; bu blok tek basina
    // B'nin A'nin anilarini gormesini engeller ve gorunurluk kuralinin
    // gercekten calisip calismadigini test edilemez hale getirir. Bloku
    // gecici olarak kaldiriyoruz (senaryo 6'daki desenin ayni), sonunda
    // geri kuruyoruz.
    const { error: kaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    if (kaldirErr) throw new Error(`engeli_kaldir hatasi: ${kaldirErr.message}`)

    // Bolum 1: gizli check-in -> ayrildim -> ani kimseye gorunmemeli.
    const aGizliCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'gizli')
    t.checkInler.push({ istemci: a, id: aGizliCi })

    const { error: ayril1Err } = await a.rpc('check_inden_ayril', { p_check_in_id: aGizliCi })
    if (ayril1Err) throw new Error(`check_inden_ayril hatasi (gizli): ${ayril1Err.message}`)

    const bGizliAniGorurMu = await aniGorulebiliyorMu(b, aGizliCi)
    esitMi(bGizliAniGorurMu, false, 'B, gizli check-in\'ten donusen aniyi goremez')

    const aGizliAniGorurMu = await aniGorulebiliyorMu(a, aGizliCi)
    esitMi(aGizliAniGorurMu, true, 'A, kendi gizli anisini (ani haline gelmis olsa da) hala gorur')

    // Bolum 2 (ters yon kontrolu): gizli OLMAYAN check-in -> ayrildim ->
    // ani yine herkese_acik gorunmeli. Bu kontrol olmadan senaryo, kuralin
    // yalniz gizli check-in'leri kapattigini degil, her aniyi kapattigini
    // da (yanlislikla) "gecti" sayabilirdi.
    const aAcikCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'herkese_acik')
    t.checkInler.push({ istemci: a, id: aAcikCi })

    const { error: ayril2Err } = await a.rpc('check_inden_ayril', { p_check_in_id: aAcikCi })
    if (ayril2Err) throw new Error(`check_inden_ayril hatasi (acik): ${ayril2Err.message}`)

    const bAcikAniGorurMu = await aniGorulebiliyorMu(b, aAcikCi)
    esitMi(bAcikAniGorurMu, true, 'B, gizli OLMAYAN check-in\'ten donusen aniyi gorur (kural sadece gizlileri kapatiyor)')

    // Bloku geri kur.
    const { error: engelErr } = await a.rpc('engelle', { p_kullanici_id: bId })
    if (engelErr) throw new Error(`engelle hatasi: ${engelErr.message}`)
  })

  // Senaryo 10, kendi ic mantigi geregi A -> B blogunu yeniden kurarak
  // bitiyor. Kimlik ve arama senaryolari (11-15) bu bloktan bagimsiz
  // calismali; blogun arama uzerindeki etkisini test eden senaryo 16
  // kendi bloguna acikca kuruyor ve kendi temizligini t.engellemeler'e
  // ekliyor. Burada onceki bloku kaldirmazsak senaryo 14/15'teki pozitif
  // aramalar (A, B'yi bulmali) blok yuzunden yanlislikla basarisiz olur —
  // bu bir uygulama kusuru degil, senaryolar arasi durum sizintisi olurdu.
  const { error: aramaOncesiKaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
  if (aramaOncesiKaldirErr) {
    throw new Error(`senaryo 11 oncesi engeli_kaldir hatasi: ${aramaOncesiKaldirErr.message}`)
  }

  await senaryo('11 - Kullanici adi benzersizligi', async () => {
    // Aktor bilerek A: RPC'de 30 gun kontrolu benzersizlik kontrolunden
    // once geliyor, dolayisiyla adi degistirilmis bir hesapla denenirse
    // beklenen "alinmis" mesaji yerine 30 gun mesaji doner ve test
    // betigin kacinci calismasi oldugu bilgisine bagimli hale gelir.
    // A'nin kullanici adi hicbir senaryoda degistirilmiyor.
    const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
    const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi

    const { error } = await a.rpc('kullanici_adi_degistir', { p_yeni_ad: bAdi })
    esitMi(
      error?.message?.includes('alinmis') ?? false,
      true,
      "A, B'nin kullanici adini alamaz"
    )
  })

  await senaryo('12 - Bicim kurallari sunucuda zorunlu', async () => {
    for (const gecersiz of ['ORCUN', 'or', 'a'.repeat(21), 'orcun ozdemir', 'orcun-x']) {
      const { error } = await b.rpc('kullanici_adi_degistir', { p_yeni_ad: gecersiz })
      esitMi(
        error?.message?.includes('kurallara uymuyor') ?? false,
        true,
        `gecersiz ad reddedilir: ${JSON.stringify(gecersiz)}`
      )
    }

    const { data: musait } = await b.rpc('kullanici_adi_musait_mi', { p_ad: 'ORCUN' })
    esitMi(musait, false, 'musait_mi buyuk harfli adi musait saymaz')
  })

  await senaryo('13 - 30 gun kurali sunucuda tutar', async () => {
    // Bkz. yukaridaki tekrarlanabilirlik notu: basarili degistirme
    // dogrudan iddia edilemez, cunku bir kez basarili olunca hesap
    // 30 gun kilitlenir ve betik tekrar calistirilamaz hale gelirdi.
    const ilkAd = `test_${Math.floor(Date.now() / 1000)}`.slice(0, 20)
    const { error: ilkHata } = await b.rpc('kullanici_adi_degistir', { p_yeni_ad: ilkAd })
    esitMi(
      ilkHata === null || (ilkHata.message?.includes('30 gunde bir') ?? false),
      true,
      'ilk cagri ya kabul edilir ya da yalnizca 30 gun kuraliyla reddedilir'
    )

    if (ilkHata === null) {
      const { data: sonrasi } = await b.from('profiller').select('kullanici_adi').single()
      esitMi(
        (sonrasi as { kullanici_adi: string }).kullanici_adi,
        ilkAd,
        'degistirme basarili oldugunda ad gercekten guncelleniyor'
      )
    }

    const ikinciAd = `${ilkAd}x`.slice(0, 20)
    const { error: ikinciHata } = await b.rpc('kullanici_adi_degistir', { p_yeni_ad: ikinciAd })
    esitMi(
      ikinciHata?.message?.includes('30 gunde bir') ?? false,
      true,
      'ardisik ikinci cagri her durumda 30 gun kuraliyla reddedilir'
    )
  })

  await senaryo('14 - Arama kullanici adi ve isimle bulur', async () => {
    const { data: bProfil } = await b.from('profiller').select('kullanici_adi, ad').single()
    const { kullanici_adi: bAdi, ad: bIsim } = bProfil as { kullanici_adi: string; ad: string }

    // Tam deger kullaniliyor (kisaltma degil): bir onek "kull" gibi
    // baska hesaplarla da paylasilan bir onek olabilir (varsayilan
    // kullanici_adi bicimi "kullanici_<8 hane>"), bu yuzden kisa bir
    // dilim "B'yi bulduk" yerine "bu onekle baslayan biri var" demis
    // olurdu. Tam deger, ozellikle B'nin id'siyle eslesmeyi kanitlar.
    const { data: adaGore } = await a.rpc('kisi_ara', { p_metin: bAdi })
    esitMi(
      ((adaGore ?? []) as { id: string }[]).some((s) => s.id === bId),
      true,
      'kullanici adiyla bulunur'
    )

    const { data: isimeGore } = await a.rpc('kisi_ara', { p_metin: bIsim })
    esitMi(
      ((isimeGore ?? []) as { id: string }[]).some((s) => s.id === bId),
      true,
      'isim soyisimle bulunur'
    )

    const { data: kisa } = await a.rpc('kisi_ara', { p_metin: 'b' })
    esitMi((kisa ?? []).length, 0, 'tek karakterlik arama bos doner')

    const { data: kendisi } = await a.rpc('kisi_ara', { p_metin: bAdi })
    esitMi(
      ((kendisi ?? []) as { id: string }[]).some((s) => s.id === aId),
      false,
      'arama kullanicinin kendisini sonuclara koymaz'
    )
  })

  await senaryo('15 - Aramada gorunme kapatilinca cikmaz', async () => {
    const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
    const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi

    await b.from('profiller').update({ aramada_gorunsun: false }).eq('id', bId)
    const { data: kapali } = await a.rpc('kisi_ara', { p_metin: bAdi })
    esitMi(
      ((kapali ?? []) as { id: string }[]).some((s) => s.id === bId),
      false,
      'aramada_gorunsun = false olan kullanici cikmaz'
    )

    await b.from('profiller').update({ aramada_gorunsun: true }).eq('id', bId)
    const { data: acik } = await a.rpc('kisi_ara', { p_metin: bAdi })
    esitMi(
      ((acik ?? []) as { id: string }[]).some((s) => s.id === bId),
      true,
      'tercih geri acilinca yeniden gorunur (pozitif kontrol)'
    )
  })

  await senaryo('16 - Engelleme aramayi iki yonde de keser', async () => {
    const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
    const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi
    const { data: aProfil } = await a.from('profiller').select('kullanici_adi').single()
    const aAdi = (aProfil as { kullanici_adi: string }).kullanici_adi

    // Pozitif saglama: engellemeden ONCE her iki taraf da digerini
    // aramada gercekten buluyor mu? Bu kontrol olmadan asagidaki
    // negatif sonuc (goremez) arama zaten hicbir zaman bulamiyor
    // olsaydi da "gecti" gorunurdu.
    const { data: oncesiA } = await a.rpc('kisi_ara', { p_metin: bAdi })
    esitMi(
      ((oncesiA ?? []) as { id: string }[]).some((s) => s.id === bId),
      true,
      "saglama: engellemeden once A, B'yi aramada buluyor"
    )

    const { data: oncesiB } = await b.rpc('kisi_ara', { p_metin: aAdi })
    esitMi(
      ((oncesiB ?? []) as { id: string }[]).some((s) => s.id === aId),
      true,
      "saglama: engellemeden once B, A'yi aramada buluyor"
    )

    await a.rpc('engelle', { p_kullanici_id: bId })
    t.engellemeler.push({ istemci: a, engellenenId: bId })

    const { data: aninGorusu } = await a.rpc('kisi_ara', { p_metin: bAdi })
    esitMi(
      ((aninGorusu ?? []) as { id: string }[]).some((s) => s.id === bId),
      false,
      'engelleyen, engelledigini aramada goremez'
    )

    const { data: bninGorusu } = await b.rpc('kisi_ara', { p_metin: aAdi })
    esitMi(
      ((bninGorusu ?? []) as { id: string }[]).some((s) => s.id === aId),
      false,
      'engellenen de engelleyeni aramada goremez (cift taraflilik)'
    )
  })

  await senaryo('17 - Kimliksiz cagrilar reddedilir', async () => {
    // Giris yapmamis, ham anon istemci. RPC'lerde hem auth.uid() null
    // kontrolu hem de "revoke execute from anon" var; ikisinden biri
    // bile calissa cagri hata donmeli.
    const anonim = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { error: musaitHatasi } = await anonim.rpc('kullanici_adi_musait_mi', {
      p_ad: 'herhangibiri',
    })
    esitMi(musaitHatasi !== null, true, 'kimliksiz musait_mi cagrisi reddedilir')

    const { error: aramaHatasi } = await anonim.rpc('kisi_ara', { p_metin: 'ab' })
    esitMi(aramaHatasi !== null, true, 'kimliksiz kisi_ara cagrisi reddedilir')
  })

  await senaryo('18 - Profil fotografi imzali URL ile okunabiliyor', async () => {
    // Senaryo 16, A -> B blogunu kurup t.engellemeler'e ekleyerek bitti; bu
    // blok temizle() cagrilana kadar kalici. Pozitif kontrolun anlamli
    // olmasi icin (blok yuzunden degil, kural geregi imza alinabildigini
    // kanitlamak icin) senaryo 6/10'daki desenin ayni: once gecici olarak
    // kaldiriyoruz, sonunda t.engellemeler ile yeniden kurup temizle()'ye
    // birakiyoruz.
    const { error: kaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    if (kaldirErr) throw new Error(`onceki blok kaldirilamadi: ${kaldirErr.message}`)

    const dosyaYolu = `${aId}/gorunurluk-test-${Date.now()}.txt`
    const icerik = Buffer.from('gorunurluk-testi')

    const { error: yukleHata } = await a.storage
      .from('profil-fotograflari')
      .upload(dosyaYolu, icerik, { contentType: 'text/plain' })
    if (yukleHata) throw new Error(`fotograf yukleme hatasi: ${yukleHata.message}`)

    try {
      const { data: imza1, error: imza1Hata } = await b.storage
        .from('profil-fotograflari')
        .createSignedUrl(dosyaYolu, 60)
      if (imza1Hata) throw new Error(`B imza alma hatasi: ${imza1Hata.message}`)

      const yanit1 = await fetch(imza1!.signedUrl)
      esitMi(
        yanit1.status,
        200,
        "B, A'nin profil fotografi icin imzali URL alip icerigi gercekten okuyabiliyor"
      )

      const { error: engelErr } = await a.rpc('engelle', { p_kullanici_id: bId })
      if (engelErr) throw new Error(`engelle hatasi: ${engelErr.message}`)
      t.engellemeler.push({ istemci: a, engellenenId: bId })

      const { data: imza2, error: imza2Hata } = await b.storage
        .from('profil-fotograflari')
        .createSignedUrl(dosyaYolu, 60)

      if (imza2Hata) {
        esitMi(true, true, "A, B'yi engelledikten sonra B imza ALAMIYOR (RLS reddediyor)")
      } else {
        const yanit2 = await fetch(imza2!.signedUrl)
        esitMi(
          yanit2.status === 400 || yanit2.status === 403,
          true,
          "A, B'yi engelledikten sonra imzali URL artik icerigi vermiyor (400/403 doner)"
        )
      }
    } finally {
      // Sessiz temizlik, temizlik degildir: silme hatasi artik bir iddia,
      // sadece console.error'a dusen bir log degil. Bucket'ta hicbir
      // "for delete" politikasi yokken (20260819162119'dan once) bu
      // cagri hep sessizce basarisiz oluyordu ve her kosum bucket'a
      // kalici bir dosya birakiyordu.
      const { error: silmeHatasi } = await a.storage.from('profil-fotograflari').remove([dosyaYolu])
      esitMi(silmeHatasi, null, 'test dosyasi silinebiliyor')
    }
  })

  // Senaryo 18, kendi ic mantigi geregi A -> B blogunu yeniden kurarak
  // bitiyor (deferred cleanup icin t.engellemeler'e eklendi). Bag ve
  // bulunurluk senaryolari (19-28) bu bloktan bagimsiz baslamali;
  // aksi halde takip_istegi_gonder her seferinde "Bu kullanici
  // bulunamadi" ile reddedilir ve asagidaki senaryolarin hicbiri
  // gercek anlamda calismamis olur. Ayni desen (11 oncesi) yukarida da
  // kullanildi.
  const { error: bagOncesiKaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
  if (bagOncesiKaldirErr) {
    throw new Error(`senaryo 19 oncesi engeli_kaldir hatasi: ${bagOncesiKaldirErr.message}`)
  }

  await senaryo('19 - Istek gonderilir', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'A istegi gonderebiliyor')

    const { data: aGorusu, error: aHata } = await a
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', aId)
      .eq('takip_edilen_id', bId)
    if (aHata) throw new Error(`A takip sorgu hatasi: ${aHata.message}`)
    esitMi(
      (aGorusu ?? []).map((r) => r.durum),
      ['beklemede'],
      'A, kendi gonderdigi istegi takipler-de beklemede olarak gorur'
    )

    const { data: bGorusu, error: bHata } = await b
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', aId)
      .eq('takip_edilen_id', bId)
    if (bHata) throw new Error(`B takip sorgu hatasi: ${bHata.message}`)
    esitMi(
      (bGorusu ?? []).map((r) => r.durum),
      ['beklemede'],
      "B, A'nin gonderdigi istegi takipler-de beklemede olarak gorur"
    )

    // Senaryo 20/21'in ayni A->B ciftiyle temiz baslayabilmesi icin
    // burada hemen temizleniyor (final temizle()'ye birakilmiyor).
    const { error: temizlikHatasi } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(temizlikHatasi, null, 'senaryo 19 kendi istegini temizleyebiliyor')
  })

  await senaryo('20 - Kabul edilmeden uzaktan gorunmez', async () => {
    // B mekan-1'de canli; A hicbir yere check-in yapmamis, yani "uzakta".
    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'herkese_acik')
    t.checkInler.push({ istemci: b, id: bCi })

    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'senaryo 20 on kosulu: A istegi gonderebiliyor')

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      false,
      "istek beklemedeyken A, B'nin canli check-in'ini goremez"
    )

    // Senaryo 21'in kendi taze istegini gonderebilmesi icin burada hemen
    // temizleniyor (final temizle()'ye birakilmiyor); ayni desen senaryo
    // 19'da da kullanildi. Bu satir eklenmeden once senaryo 21'in kendi
    // gonder cagrisi burada birakilan bekleyen istege carpip
    // "Istegin zaten gonderilmis" hatasi veriyordu; hata destructure
    // edilmedigi icin sessizce yutuluyordu (Item 2'nin duzeltmesiyle
    // ortaya cikan gercek bir senaryolar-arasi durum sizintisiydi).
    const { error: temizlikHatasi } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(temizlikHatasi, null, 'senaryo 20 kendi istegini temizleyebiliyor')
  })

  await senaryo('21 - Kabul edilince uzaktan gorunur', async () => {
    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'herkese_acik')
    t.checkInler.push({ istemci: b, id: bCi })

    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'senaryo 21 on kosulu: A istegi gonderebiliyor')
    t.takipler.push({ istemci: a, hedefId: bId })

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      false,
      'saglama: kabulden once goremiyor'
    )

    const { error: kabulHatasi } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHatasi, null, 'B istegi kabul edebiliyor')

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      true,
      "kabulden sonra A, B'nin canli check-in'ini mekana gitmeden goruyor"
    )
  })

  // Senaryo 21'in sonunda A -> B takibi 'kabul' durumunda ve kalici;
  // senaryo 22/23/24 bu takibi kullaniyor. Ucuncu hesap yalnizca burada
  // gerekiyor (bkz. yardimcilar.ts'teki ucuncuKullaniciIleBaglan yorumu).
  const { c, cId } = await ucuncuKullaniciIleBaglan()
  t.hesapKimlikleri.push(cId)

  await senaryo("22 - 'takipcilerim' yabanciyi disari birakir", async () => {
    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'takipcilerim')
    t.checkInler.push({ istemci: b, id: bCi })

    const cCi = await checkInYap(c, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'herkese_acik')
    t.checkInler.push({ istemci: c, id: cCi })

    esitMi(
      await aniGorulebiliyorMu(c, cCi),
      true,
      'saglama: C kendi canli check-in-ini gorebiliyor (istemcisi gercekten okuyor)'
    )

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      true,
      "saglama: takipcisi olan A, B'nin takipcilerim check-in'ini gorur"
    )

    esitMi(
      await aniGorulebiliyorMu(c, bCi),
      false,
      "C, B'nin takipcisi olmadigi icin ayni mekanda olsa da takipcilerim check-in'i goremez"
    )
  })

  await senaryo("23 - 'gizli' kimseye gorunmez", async () => {
    // Senaryo 22'nin biraktigi cCi'ye sessizce miras alinmiyor: bu
    // senaryo tek basina okundugunda "C mekandaydi" onkosulu kanitsiz
    // kalmasin diye C icin taze bir check-in aciyor ve C'nin gercekten
    // canli oldugunu esitMi ile ayrica dogruluyor.
    const cCi = await checkInYap(c, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'herkese_acik')
    t.checkInler.push({ istemci: c, id: cCi })
    esitMi(
      await aniGorulebiliyorMu(c, cCi),
      true,
      'saglama: C bu senaryoda gercekten mekanda ve canli'
    )

    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'gizli')
    t.checkInler.push({ istemci: b, id: bCi })

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      false,
      "A, B'yi takip ediyor olsa da B'nin gizli check-in'ini goremez"
    )

    esitMi(
      await aniGorulebiliyorMu(c, bCi),
      false,
      "C, ayni mekanda olsa da B'nin gizli check-in'ini goremez"
    )

    esitMi(
      await aniGorulebiliyorMu(b, bCi),
      true,
      'saglama: B kendi gizli check-in-ini hala gorur'
    )
  })

  await senaryo('24 - Engelleme takibi kaldirir', async () => {
    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'takipcilerim')
    t.checkInler.push({ istemci: b, id: bCi })

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      true,
      "saglama: engellemeden once A, takipcisi oldugu B'nin takipcilerim check-in'ini gorur"
    )

    const { error: engelHata } = await a.rpc('engelle', { p_kullanici_id: bId })
    if (engelHata) throw new Error(`engelle hatasi: ${engelHata.message}`)
    t.engellemeler.push({ istemci: a, engellenenId: bId })

    const { data: takipSatiri, error: takipHata } = await a
      .from('takipler')
      .select('takip_eden_id')
      .eq('takip_eden_id', aId)
      .eq('takip_edilen_id', bId)
    if (takipHata) throw new Error(`takip sorgu hatasi: ${takipHata.message}`)
    esitMi(takipSatiri, [], "A, B'yi engelledikten sonra takipler satiri kayboluyor")

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      false,
      "A, B'yi engelledikten sonra artik B'nin check-in'ini goremez"
    )
  })

  await senaryo('25 - Engelliyken istek gonderilemez', async () => {
    // Senaryo 24'ten beri A, B'yi engellemis durumda (cift yonlu kontrol
    // oldugu icin hangi taraf gonderirse gondersin reddedilir).
    const { error } = await b.rpc('takip_istegi_gonder', { p_kullanici_id: aId })
    esitMi(error !== null, true, "B, kendisini engellemis A'ya istek gonderemez")
    esitMi(
      error?.message?.includes('bulunamadi') ?? false,
      true,
      'hata mesaji "bulunamadi" iceriyor'
    )
    esitMi(
      error?.message?.includes('engellendin') ?? false,
      false,
      'hata mesaji "engellendin" demiyor (sessizlik ilkesi)'
    )
  })

  await senaryo('26 - Baskasinin istegi kabul edilemez', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: cId })
    esitMi(gonderHata, null, "A, C'ye istek gonderebiliyor")

    const { error: kabulHata } = await a.rpc('takip_istegini_yanitla', {
      p_kullanici_id: cId,
      p_kabul: true,
    })
    esitMi(kabulHata !== null, true, 'A, kendi gonderdigi istegi kabul edemez (yalnizca alici kabul edebilir)')

    const { error: temizlikHatasi } = await a.rpc('takibi_birak', { p_kullanici_id: cId })
    esitMi(temizlikHatasi, null, 'senaryo 26 kendi istegini temizleyebiliyor')
  })

  await senaryo('27 - Ani donusumu genisletmez', async () => {
    const bTakipCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'takipcilerim')
    t.checkInler.push({ istemci: b, id: bTakipCi })

    const { error: ayril1Hata } = await b.rpc('check_inden_ayril', { p_check_in_id: bTakipCi })
    if (ayril1Hata) throw new Error(`check_inden_ayril hatasi: ${ayril1Hata.message}`)

    const { data: takipSonrasi, error: takipSonrasiHata } = await b
      .from('check_inler')
      .select('gorunurluk')
      .eq('id', bTakipCi)
      .single()
    if (takipSonrasiHata) throw new Error(`sorgu hatasi: ${takipSonrasiHata.message}`)
    esitMi(
      (takipSonrasi as { gorunurluk: string }).gorunurluk,
      'takipcilerim',
      "'takipcilerim' check-in ayrilinca ani 'takipcilerim' kalir (genislemez)"
    )

    const bGizliCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'gizli')
    t.checkInler.push({ istemci: b, id: bGizliCi })

    const { error: ayril2Hata } = await b.rpc('check_inden_ayril', { p_check_in_id: bGizliCi })
    if (ayril2Hata) throw new Error(`check_inden_ayril hatasi: ${ayril2Hata.message}`)

    const { data: gizliSonrasi, error: gizliSonrasiHata } = await b
      .from('check_inler')
      .select('gorunurluk')
      .eq('id', bGizliCi)
      .single()
    if (gizliSonrasiHata) throw new Error(`sorgu hatasi: ${gizliSonrasiHata.message}`)
    esitMi(
      (gizliSonrasi as { gorunurluk: string }).gorunurluk,
      'kimse',
      "'gizli' check-in ayrilinca ani 'kimse' olur (daralir)"
    )
  })

  await senaryo('28 - Bagi koparinca akis kesilir', async () => {
    // Senaryo 24'un koydugu blok hala etkili; yeni bir takip iliskisi
    // kurabilmek icin gecici olarak kaldiriyoruz. t.engellemeler zaten
    // bu ciftin engeli_kaldir'ini final temizle()'ye biriktirdi, o
    // yuzden burada tekrar t.engellemeler'e eklemiyoruz; ayni cagrinin
    // iki kez calismasi zararsiz (delete, satir yoksa da hata vermez).
    const { error: kaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    if (kaldirErr) throw new Error(`engeli_kaldir hatasi: ${kaldirErr.message}`)

    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    if (gonderHata) throw new Error(`takip_istegi_gonder hatasi: ${gonderHata.message}`)

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    if (kabulHata) throw new Error(`takip_istegini_yanitla hatasi: ${kabulHata.message}`)

    const bCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'takipcilerim')
    t.checkInler.push({ istemci: b, id: bCi })

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      true,
      "saglama: bagliyken A, B'nin takipcilerim check-in'ini gorur"
    )

    // Takip artik karsilikli (karar 42): kabul YUKARIDA iki satir yazdi
    // (A->B ve B->A, ikisi de 'kabul'). takipciyi_cikar dusuruldu -
    // takibi_birak ile ayni ise indigi icin (Faz 3b Task 2) - dolayisiyla
    // "yalnizca tek yonu sil" diye ayri bir RPC kalmadi: bagi kopartmak
    // HER ZAMAN iki yonu birden siliyor.
    const { error: birakHata } = await b.rpc('takibi_birak', { p_kullanici_id: aId })
    esitMi(birakHata, null, 'B bagi koparabiliyor')

    const kalanlar = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(kalanlar, [], 'B bagi kopardiktan sonra iki yon de (A->B ve B->A) takipler\'den gitti')

    esitMi(
      await aniGorulebiliyorMu(a, bCi),
      false,
      "bag koptuktan sonra A artik B'nin check-in'ini goremez"
    )
  })

  if (TAVAN_MODU) {
    await senaryo('29 - Gunluk tavan', async () => {
      // istek_gunlugu ekle-only oldugu icin (silinen istekler sayaci
      // dusurmuyor), A'nin gunluk sayaci nereden basliyorsa basla,
      // dongu hatayla karsilasana kadar gonderip hemen temizliyor.
      // Boylece hem gercek FK'li bir hedefe (B) gonderiliyor hem de
      // "zaten gonderilmis" catismasi olmadan tekrar tekrar denenebiliyor.
      let sonHata: { message: string } | null = null
      for (let i = 0; i < 55; i++) {
        const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
        if (gonderHata) {
          sonHata = gonderHata
          break
        }
        const { error: birakHata } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
        if (birakHata) {
          throw new Error(`takibi_birak hatasi (dongu ${i}): ${birakHata.message}`)
        }
      }

      esitMi(sonHata !== null, true, 'gunluk tavan asilinca istek reddediliyor')
      esitMi(
        sonHata?.message?.includes('istek sinirina') ?? false,
        true,
        'hata mesaji "istek sinirina" iceriyor'
      )
    })
  } else {
    console.log(
      "\n--- Senaryo: 29 - Gunluk tavan --- ATLANDI (--tavan bayragiyla ayrica calistirilir; A'nin gunluk sayacina kalici satir ekledigi icin varsayilan kosumda calismaz)"
    )
  }

  await senaryo('30 - Kimliksiz cagrilar reddedilir', async () => {
    const anonim = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    // Yalnizca "bir hata olustu" iddiasi, adi degismis bir RPC ya da
    // yanlis yazilmis bir parametreyle de gecerdi (bkz. Task 17'nin
    // p_gizli_mi/p_bulunurluk hatasi). Hata KODU iddia ediliyor; kod
    // canli veritabanina karsi gozlemlenerek dogrulandi: her iki cagri
    // da 42501 ("permission denied for function ...") donuyor, ayni
    // kodu sema-dogrula.ts'teki RLS iddialari da kullaniyor.
    const { error: istekHata } = await anonim.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(istekHata?.code, '42501', 'kimliksiz takip_istegi_gonder cagrisi 42501 ile reddedilir')

    const { error: kisilerHata } = await anonim.rpc('bag_kisileri', { p_kimlikler: [bId] })
    esitMi(kisilerHata?.code, '42501', 'kimliksiz bag_kisileri cagrisi 42501 ile reddedilir')
  })

  await senaryo("31 - ani_gorunurlugunu_ayarla genisletmeyi kelepceler", async () => {
    // Madde 2'nin asil kanitladigi sey: check_inler'a dogrudan yazma
    // artik reddedildigi icin (Madde 1) ayarlardaki "Herkes gorsun"
    // eylemi bu RPC'ye tasindi. RPC gizli kokenli bir aniyi ASLA
    // 'herkese_acik'a genisletmemeli; bag.ani_gorunurlugu bu kelepceyi
    // ('gizli' -> her zaman 'kimse') zaten uyguluyordu, burada RPC'nin
    // gercekten o yardimciyi cagirdigini uctan uca dogruluyoruz.
    const bGizliCi = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng, 'gizli')
    t.checkInler.push({ istemci: b, id: bGizliCi })

    const { error: ayrilHata } = await b.rpc('check_inden_ayril', { p_check_in_id: bGizliCi })
    if (ayrilHata) throw new Error(`check_inden_ayril hatasi: ${ayrilHata.message}`)

    const { data: ayrildiktanSonra, error: sorguHata1 } = await b
      .from('check_inler')
      .select('gorunurluk')
      .eq('id', bGizliCi)
      .single()
    if (sorguHata1) throw new Error(`sorgu hatasi: ${sorguHata1.message}`)
    esitMi(
      (ayrildiktanSonra as { gorunurluk: string }).gorunurluk,
      'kimse',
      "on kosul: gizli check-in'ten donen ani 'kimse' ile basliyor"
    )

    const { error: ayarlaHata } = await b.rpc('ani_gorunurlugunu_ayarla', {
      p_deger: 'herkese_acik',
    })
    if (ayarlaHata) throw new Error(`ani_gorunurlugunu_ayarla hatasi: ${ayarlaHata.message}`)

    const { data: genisletmeSonrasi, error: sorguHata2 } = await b
      .from('check_inler')
      .select('gorunurluk')
      .eq('id', bGizliCi)
      .single()
    if (sorguHata2) throw new Error(`sorgu hatasi: ${sorguHata2.message}`)
    esitMi(
      (genisletmeSonrasi as { gorunurluk: string }).gorunurluk,
      'kimse',
      "'Herkes gorsun' cagrisindan sonra bile gizli kokenli ani 'kimse' kaliyor (genislemiyor)"
    )

    esitMi(
      await aniGorulebiliyorMu(a, bGizliCi),
      false,
      'A, genisletme denemesinden sonra bile bu aniyi goremez'
    )
  })

  // 32-44: Faz 3b (birebir sohbet). Bu noktada A-B arasinda hicbir bag
  // yok (senaryo 28 kopardi) ve hicbir engel yok (28'in preamble'i
  // kaldirdi). bagsizHataMetni, 36'da yakalanip 37 ve 39'da BIREBIR
  // karsilastirilacak (sessizlik ilkesi: "engellendin" ile "bagsizsin"
  // ayni hatayi verir).
  let bagsizHataMetni: string | null = null

  await senaryo('32 - Kabul iki satir yazar', async () => {
    // Pozitif kontrol / on kosul: bu iddianin degerli olmasi icin
    // basta gercekten HICBIR takip satiri olmamali - aksi halde
    // asagidaki "iki satir" sayimi onceki bir kosumdan kalan satirlari
    // sayiyor olabilirdi.
    const oncesi = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(oncesi, [], 'on kosul: A-B arasinda hicbir takip satiri yok')

    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'A istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'B istegi kabul edebiliyor')

    const { data: abSatiri, error: abHata } = await a
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', aId)
      .eq('takip_edilen_id', bId)
    if (abHata) throw new Error(`A->B sorgu hatasi: ${abHata.message}`)
    esitMi((abSatiri ?? []).map((r) => r.durum), ['kabul'], "A->B satiri 'kabul' durumunda")

    const { data: baSatiri, error: baHata } = await a
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', bId)
      .eq('takip_edilen_id', aId)
    if (baHata) throw new Error(`B->A sorgu hatasi: ${baHata.message}`)
    esitMi(
      (baSatiri ?? []).map((r) => r.durum),
      ['kabul'],
      "B->A ayna satiri da kendiliginden 'kabul' durumunda yazildi (karar 42)"
    )
  })

  await senaryo('33 - Bagi koparmak iki satiri da siler', async () => {
    // Senaryo 32'nin biraktigi karsilikli bagi (iki 'kabul' satiri)
    // kullaniyor. On kosul BURADA da soruluyor: 32 kabul kolunda tek
    // satir yazsaydi (gercek bir hata) 32 gurultulu duserdi ama kosum
    // durmadigi icin asagidaki "iki yonun ikisi de gitti" iddiasi
    // yaniltici bir OK basardi. Bu iki satirlik on kosul 33'u kendi
    // basina ayakta tutuyor.
    const oncesi = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(oncesi.length, 2, "on kosul: 32'nin kurdugu karsilikli bagin IKI satiri da duruyor")

    const { error: birakHata } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(birakHata, null, 'A bagi koparabiliyor')

    const kalanlar = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(kalanlar, [], 'tek cagriyla iki yonun ikisi de takipler\'den gitti')
  })

  await senaryo('34 - Karsilikli takipliler yazabilir', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'on kosul: A istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'on kosul: B istegi kabul edebiliyor (karsilikli bag kuruldu)')

    const { data: konusmaId, error: mesajHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 34 - karsilikli takip mesaji',
    })
    esitMi(mesajHata, null, "karsilikli takipli A, B'ye mesaj gonderebiliyor")

    const { data: bGorusu, error: getirHata } = await b.rpc('mesajlari_getir', {
      p_konusma_id: konusmaId,
    })
    if (getirHata) throw new Error(`mesajlari_getir hatasi: ${getirHata.message}`)
    esitMi(
      ((bGorusu ?? []) as { metin: string }[]).some(
        (m) => m.metin === 'senaryo 34 - karsilikli takip mesaji'
      ),
      true,
      "B, A'nin gonderdigi mesaji gercekten goruyor"
    )

    const { error: birakHata } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(birakHata, null, 'temizlik: bag koparilabiliyor')

    const takipKalan = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKalan, [], "temizlik: iki yonun ikisi de takipler'den gercekten gitti")

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('35 - Sohbet istegiyle baglananlar yazabilir', async () => {
    // On kosul: takip bagi yok (34 sonunda koparildi).
    const takipKontrol = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKontrol, [], 'on kosul: A-B arasinda takip bagi yok')

    const { error: gonderHata } = await a.rpc('sohbet_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'A sohbet istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('sohbet_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'B sohbet istegini kabul edebiliyor')

    const { data: konusmaId, error: mesajHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 35 - sohbet istegi mesaji',
    })
    esitMi(mesajHata, null, "takip olmadan, kabul edilmis sohbet istegiyle A mesaj gonderebiliyor")

    const { data: bGorusu, error: getirHata } = await b.rpc('mesajlari_getir', {
      p_konusma_id: konusmaId,
    })
    if (getirHata) throw new Error(`mesajlari_getir hatasi: ${getirHata.message}`)
    esitMi(
      ((bGorusu ?? []) as { metin: string }[]).some((m) => m.metin === 'senaryo 35 - sohbet istegi mesaji'),
      true,
      'B, mesaji gercekten goruyor'
    )

    // Temizlik: kabul edilmis bir sohbet istegini kaldiran ayri bir RPC
    // yok (sohbet_istegini_geri_cek yalnizca HALA beklemede olan istegi
    // kaldirir). engelle() iki yonu de kosulsuz siler; hemen ardindan
    // engeli_kaldir() engeli kaldirir, net etki yalnizca sohbet bagini
    // kaldirmak olur.
    const { error: engelHata } = await a.rpc('engelle', { p_kullanici_id: bId })
    esitMi(engelHata, null, 'temizlik: gecici engelleme ile sohbet bagi kaldirilabiliyor')

    const { error: kaldirHata } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    esitMi(kaldirHata, null, 'temizlik: engel kaldirilabiliyor')

    const sohbetKalan = await ikiYonSohbetSatirlari(a, aId, bId)
    esitMi(sohbetKalan, [], 'temizlik: sohbet_istekleri satiri gercekten gitti')

    const engelKalan = await engellemeSatirlari(a, aId, bId)
    esitMi(engelKalan, [], 'temizlik: gecici engelleme satiri gercekten gitti')

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('36 - Bagsiz kisi yazamaz', async () => {
    // On kosul: takip yok, sohbet istegi yok (35 kendi bagini kaldirdi).
    const takipKontrol = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKontrol, [], 'on kosul: takip bagi yok')

    const sohbetKontrol = await ikiYonSohbetSatirlari(a, aId, bId)
    esitMi(sohbetKontrol, [], 'on kosul: sohbet bagi yok')

    const { data, error } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 36 - bagsiz mesaj denemesi',
    })
    esitMi(data ?? null, null, 'bagsiz gonderim basarisiz oldugu icin konusma id donmuyor')
    esitMi(error !== null, true, "bagsiz A, B'ye mesaj gonderemez")
    esitMi(
      error?.message?.includes('mesaj gonderemezsin') ?? false,
      true,
      'hata mesaji "mesaj gonderemezsin" iceriyor'
    )
    bagsizHataMetni = error?.message ?? null

    // error MUTLAKA destructure edilip firlatiliyor: aksi halde
    // konusmalarim tamamen kirilsa `data` null gelir, `(liste ?? [])`
    // bos diziye duser ve asagidaki negatif iddia vakumda gecerdi.
    const { data: liste, error: listeHata } = await a.rpc('konusmalarim')
    if (listeHata) throw new Error(`konusmalarim hatasi: ${listeHata.message}`)
    esitMi(
      ((liste ?? []) as KonusmaSatiri[]).some((k) => k.kisi_id === bId),
      false,
      'basarisiz gonderim hicbir konusma satiri olusturmadi'
    )
  })

  await senaryo('37 - Engelli yazamaz, hata AYNI', async () => {
    // Bu senaryonun ayirt edici olabilmesi icin ENGELIN tek degisken
    // olmasi sart. Engeli BAGSIZ bir ciftin uzerine koymak yeterli
    // degildi: 36 zaten "bagsiz yazamaz"i kanitliyor, yani bag
    // yokken red, bag.yazabilir_mi'nin engelleme dali tamamen silinse
    // bile ayni metinle gelirdi ve senaryo yine gecerdi.
    //
    // "Engelli AMA bagli" durumu genel RPC'lerle kurulamaz: engelle()
    // iki yondeki takip ve sohbet satirlarini KOSULSUZ siliyor
    // (20260819194743_engelle_baglari_kaldir.sql). Bu yuzden bag,
    // yonetici istemcisiyle dogrudan takipler tablosuna yaziliyor.
    //
    // DIKKAT - senaryonun butun degeri bu ayrintida: engelle() kendi
    // calistiginda bu satirlari da siler, yani bagi yalnizca ENGELDEN
    // ONCE yazmak yetmez. O halde ikinci gonderim sirasinda cift hem
    // engelli hem BAGSIZ olurdu ve engelleme dali silinse bile red
    // yine gelirdi. Bu yuzden bag, engelden SONRA bir kez daha yazilir
    // ve yazildigi ayrica dogrulanir; ancak o zaman redin tek olasi
    // sebebi engel olur.
    const yonetici = yoneticiIstemcisi()
    esitMi(
      yonetici !== null,
      true,
      'yonetici istemcisi (service role) mevcut, engelli-AMA-bagli durum kurulabilir'
    )
    if (!yonetici) return

    const oncesi = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(oncesi, [], 'on kosul: baslangicta A-B arasinda hicbir takip satiri yok')

    const { error: ekleHata } = await yonetici.from('takipler').insert([
      { takip_eden_id: aId, takip_edilen_id: bId, durum: 'kabul' },
      { takip_eden_id: bId, takip_edilen_id: aId, durum: 'kabul' },
    ])
    esitMi(ekleHata, null, 'kurulum: karsilikli kabul satirlari yonetici istemcisiyle yazildi')

    const kurulan = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(kurulan.length, 2, 'kurulum: iki yonlu bag gercekten kuruldu (istemci de goruyor)')

    // POZITIF SAGLAMA: engel KONMADAN once ayni cift yazabiliyor.
    // Bu olmadan asagidaki red, engelden degil bozuk bir kurulumdan
    // geliyor olabilirdi.
    const { data: konusmaId, error: oncekiHata } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: 'senaryo 37 - engel konmadan once',
    })
    esitMi(oncekiHata, null, "saglama: engel KONMADAN once bagli B, A'ya yazabiliyor")
    esitMi(
      typeof konusmaId === 'string',
      true,
      'saglama: basarili gonderim gercek bir konusma id donduruyor'
    )

    const { error: engelHata } = await a.rpc('engelle', { p_kullanici_id: bId })
    esitMi(engelHata, null, "A, B'yi engelleyebiliyor")

    // engelle() bagi da sildi. Bu bir temizlik iddiasi DEGIL, senaryonun
    // kurulumunun bir parcasi: asagida bagi yeniden yazmamiz gerektigini
    // kanitlayan sey bu.
    const engelSonrasiBag = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(
      engelSonrasiBag,
      [],
      'ara durum: engelle, yonetici istemcisiyle yazilan iki takip satirini da sildi'
    )

    // Bag YENIDEN kuruluyor: cift artik hem ENGELLI hem BAGLI. Redin
    // tek olasi sebebi bundan sonra engeldir.
    const { error: yenidenEkleHata } = await yonetici.from('takipler').insert([
      { takip_eden_id: aId, takip_edilen_id: bId, durum: 'kabul' },
      { takip_eden_id: bId, takip_edilen_id: aId, durum: 'kabul' },
    ])
    esitMi(
      yenidenEkleHata,
      null,
      'kurulum: engelden SONRA karsilikli kabul satirlari yeniden yazildi'
    )

    const engelliyken = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(
      engelliyken.length,
      2,
      'kurulum: cift su an hem ENGELLI hem BAGLI (iki kabul satiri yerinde)'
    )

    const engelliykenSohbet = await ikiYonSohbetSatirlari(a, aId, bId)
    esitMi(
      engelliykenSohbet,
      [],
      'kurulum: sohbet bagi yok, yani yazma yetkisinin tek kaynagi karsilikli takip'
    )

    const { data, error } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: 'senaryo 37 - engelliyken mesaj denemesi',
    })
    esitMi(data ?? null, null, 'engelliyken gonderim basarisiz oldugu icin konusma id donmuyor')
    esitMi(
      error !== null,
      true,
      "BAGLI olmasina ragmen engellenen B, A'ya mesaj gonderemez (engelleme dali)"
    )
    esitMi(
      error?.message ?? null,
      bagsizHataMetni,
      "hata mesaji, senaryo 36'daki bagsizlik hatasiyla BIREBIR ayni (sessizlik ilkesi)"
    )

    const { error: kaldirHata } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    esitMi(kaldirHata, null, 'temizlik: engel kaldirilabiliyor')

    const engelKalan = await engellemeSatirlari(a, aId, bId)
    esitMi(engelKalan, [], 'temizlik: engelleme satiri gercekten gitti')

    // engeli_kaldir bu satirlari SILMEZ: onlari engelden sonra biz
    // yazdik. Yonetici istemcisiyle acikca siliniyor ve gittikleri
    // ayrica iddia ediliyor.
    const { error: silHata } = await yonetici
      .from('takipler')
      .delete()
      .in('takip_eden_id', [aId, bId])
      .in('takip_edilen_id', [aId, bId])
    esitMi(silHata, null, 'temizlik: yeniden yazilan takip satirlari yonetici istemcisiyle silindi')

    const sonKontrol = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(sonKontrol, [], 'temizlik: A-B arasinda hicbir takip satiri kalmadi')

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('38 - Engelleme konusmayi gizler', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'on kosul: A istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'on kosul: B istegi kabul edebiliyor')

    const { data: konusmaId, error: aMesajHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: "senaryo 38 - A'nin mesaji",
    })
    esitMi(aMesajHata, null, 'A mesaj gonderebiliyor')

    const { error: bMesajHata } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: "senaryo 38 - B'nin mesaji",
    })
    esitMi(bMesajHata, null, 'B de mesaj gonderebiliyor')

    // Pozitif kontrol: engellemeden ONCE B, kendi mesaji YANINDA A'nin
    // mesajini da goruyor mu? Bu olmadan asagidaki "goremiyor" iddiasi,
    // konusmanin zaten hic gorunmedigi bozuk bir kurulumdan da gelebilirdi.
    const { data: oncesi, error: oncesiHata } = await b
      .from('mesajlar')
      .select('gonderen_id')
      .eq('konusma_id', konusmaId)
    if (oncesiHata) throw new Error(`mesaj sorgu hatasi: ${oncesiHata.message}`)
    esitMi(
      (oncesi ?? []).map((m) => m.gonderen_id).sort(),
      [aId, bId].sort(),
      "saglama: engellemeden once B hem kendi hem A'nin mesajini gorur"
    )

    const { error: engelHata } = await a.rpc('engelle', { p_kullanici_id: bId })
    esitMi(engelHata, null, "A, B'yi engelleyebiliyor")

    const { data: sonrasi, error: sonrasiHata } = await b
      .from('mesajlar')
      .select('gonderen_id')
      .eq('konusma_id', konusmaId)
    if (sonrasiHata) throw new Error(`mesaj sorgu hatasi (sonrasi): ${sonrasiHata.message}`)
    esitMi(
      (sonrasi ?? []).map((m) => m.gonderen_id),
      [bId],
      "B, A'nin mesajlarini artik goremiyor, ama kendi mesaji hala goruluyor"
    )

    const { error: kaldirHata } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    esitMi(kaldirHata, null, 'temizlik: engel kaldirilabiliyor (bu, takip bagini geri getirmez)')

    const engelKalan = await engellemeSatirlari(a, aId, bId)
    esitMi(engelKalan, [], 'temizlik: engelleme satiri gercekten gitti')

    // engelle() takip bagini da kosulsuz sildi (Faz 3a karar); ayri bir
    // takibi_birak cagrisina gerek yok, yalnizca dogruluyoruz.
    const takipKontrol = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKontrol, [], 'temizlik: engelleme takip bagini da kaldirmisti')

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('39 - Bag kopunca salt-okunur', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'on kosul: A istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'on kosul: B istegi kabul edebiliyor')

    const { data: konusmaId, error: mesajHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 39 - bag kopmadan once',
    })
    esitMi(mesajHata, null, 'bagli A mesaj gonderebiliyor')

    // Pozitif kontrol: bag kopmadan once A gecmisi okuyabiliyor mu?
    const { data: oncesi, error: oncesiHata } = await a.rpc('mesajlari_getir', {
      p_konusma_id: konusmaId,
    })
    if (oncesiHata) throw new Error(`mesajlari_getir hatasi: ${oncesiHata.message}`)
    esitMi((oncesi ?? []).length, 1, 'saglama: bag varken A gecmisi okuyabiliyor')

    // yazilabilir_mi, istemci ekraninin yazma kutusunu acip kapatan alan.
    // Once bag VARKEN true oldugu gosteriliyor; asagida bag koptuktan
    // sonra false'a dondugu iddia ediliyor. Yalnizca "false" iddiasi
    // olsaydi, alan her zaman false donse de gecerdi.
    const { data: kutuBagliyken, error: kutuBagliykenHata } = await a.rpc('konusmalarim')
    if (kutuBagliykenHata) throw new Error(`konusmalarim hatasi: ${kutuBagliykenHata.message}`)
    const satirBagliyken = ((kutuBagliyken ?? []) as KonusmaSatiri[]).find((k) => k.kisi_id === bId)
    esitMi(
      satirBagliyken?.yazilabilir_mi,
      true,
      'saglama: bag varken konusmalarim satirinda yazilabilir_mi = true'
    )

    const { error: birakHata } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(birakHata, null, 'A bagi koparabiliyor')

    const kalanlar = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(kalanlar, [], "bag koptuktan sonra iki yon de takipler'den gitti")

    const { data: kutuKopunca, error: kutuKopuncaHata } = await a.rpc('konusmalarim')
    if (kutuKopuncaHata) throw new Error(`konusmalarim hatasi: ${kutuKopuncaHata.message}`)
    const satirKopunca = ((kutuKopunca ?? []) as KonusmaSatiri[]).find((k) => k.kisi_id === bId)
    esitMi(
      satirKopunca !== undefined,
      true,
      'bag koptuktan sonra konusma mesaj kutusunda DURUYOR (salt-okunur, kaybolmuyor)'
    )
    esitMi(
      satirKopunca?.yazilabilir_mi,
      false,
      'bag koptuktan sonra yazilabilir_mi = false (istemcide yazma kutusu kapanir)'
    )

    const { data: sonrasi, error: sonrasiHata } = await a.rpc('mesajlari_getir', {
      p_konusma_id: konusmaId,
    })
    if (sonrasiHata) throw new Error(`mesajlari_getir hatasi (sonrasi): ${sonrasiHata.message}`)
    esitMi((sonrasi ?? []).length, 1, 'bag koptuktan sonra bile gecmis okunabiliyor (salt-okunur)')

    const { data: yeniData, error: yeniHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 39 - bag koptuktan sonra',
    })
    esitMi(yeniData ?? null, null, 'reddedilen gonderim konusma id dondurmuyor')
    esitMi(yeniHata !== null, true, 'bag koptuktan sonra yeni mesaj gonderme reddediliyor')
    esitMi(
      yeniHata?.message ?? null,
      bagsizHataMetni,
      "red mesaji senaryo 36'daki bagsizlik hatasiyla ayni"
    )

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('40 - Iki yol ayni konusmaya cikar', async () => {
    // On kosul: temiz, hicbir bag yok (39 takip bagini kopardi; sohbet
    // istegi bu ciftte bu noktaya kadar hic acilmadi).
    const sohbetOncesi = await ikiYonSohbetSatirlari(a, aId, bId)
    esitMi(sohbetOncesi, [], 'on kosul: sohbet bagi yok')

    // Yol 1: sohbet istegiyle mesajlas.
    const { error: sohbetGonderHata } = await a.rpc('sohbet_istegi_gonder', { p_kullanici_id: bId })
    esitMi(sohbetGonderHata, null, 'A sohbet istegi gonderebiliyor')

    const { error: sohbetKabulHata } = await b.rpc('sohbet_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(sohbetKabulHata, null, 'B sohbet istegini kabul edebiliyor')

    const { data: konusmaId1, error: mesaj1Hata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 40 - sohbet istegi yoluyla',
    })
    esitMi(mesaj1Hata, null, 'sohbet istegi yoluyla mesaj gonderiliyor')

    // Yol 2: ayrica takiples (karsilikli bag).
    const { error: takipGonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(takipGonderHata, null, 'A ayrica takip istegi de gonderebiliyor')

    const { error: takipKabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(takipKabulHata, null, 'B takip istegini de kabul edebiliyor')

    const { data: konusmaId2, error: mesaj2Hata } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: 'senaryo 40 - takip yoluyla',
    })
    esitMi(mesaj2Hata, null, 'takip yoluyla da mesaj gonderiliyor')

    esitMi(konusmaId2, konusmaId1, "iki yol da AYNI konusma id'sine cikiyor (birebir_anahtar benzersiz)")

    const { data: aListesi, error: aListesiHata } = await a.rpc('konusmalarim')
    if (aListesiHata) throw new Error(`konusmalarim hatasi: ${aListesiHata.message}`)
    const bIleOlanlar = ((aListesi ?? []) as KonusmaSatiri[]).filter((k) => k.kisi_id === bId)
    esitMi(bIleOlanlar.length, 1, "A'nin konusmalarim listesinde B ile TEK satir var (iki degil)")

    // Temizlik: tek cagriyla hem sohbet hem takip bagini kaldir. Bu, iki
    // bagi birden birakan tek senaryo; her uc tablonun da bosaldigi
    // ayri ayri dogrulaniyor, hicbiri baska bir senaryonun on kosuluna
    // birakilmiyor.
    const { error: engelHata } = await a.rpc('engelle', { p_kullanici_id: bId })
    esitMi(engelHata, null, 'temizlik: gecici engelleme ile iki bag birden kaldirilabiliyor')

    const { error: kaldirHata } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    esitMi(kaldirHata, null, 'temizlik: engel kaldirilabiliyor')

    const takipKalan = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKalan, [], 'temizlik: takipler tablosunda iki yonde de satir kalmadi')

    const sohbetKalan = await ikiYonSohbetSatirlari(a, aId, bId)
    esitMi(sohbetKalan, [], 'temizlik: sohbet_istekleri tablosunda iki yonde de satir kalmadi')

    const engelKalan = await engellemeSatirlari(a, aId, bId)
    esitMi(engelKalan, [], 'temizlik: gecici engelleme satiri gercekten gitti')

    await konusmaTemizleVeDogrula(konusmaId1 as string)
  })

  await senaryo('41 - Gizlenen konusma geri gelir', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'on kosul: A istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'on kosul: B istegi kabul edebiliyor')

    const { data: konusmaId, error: mesajHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'senaryo 41 - ilk mesaj',
    })
    esitMi(mesajHata, null, 'A mesaj gonderebiliyor')

    // Pozitif kontrol: gizlemeden once A'nin kutusunda B gercekten var mi?
    const { data: gizlemeOncesi, error: gizlemeOncesiHata } = await a.rpc('konusmalarim')
    if (gizlemeOncesiHata) throw new Error(`konusmalarim hatasi: ${gizlemeOncesiHata.message}`)
    esitMi(
      ((gizlemeOncesi ?? []) as KonusmaSatiri[]).some((k) => k.kisi_id === bId),
      true,
      "saglama: gizlemeden once A'nin kutusunda B var"
    )

    const { error: gizleHata } = await a.rpc('konusmayi_gizle', { p_konusma_id: konusmaId })
    esitMi(gizleHata, null, 'A konusmayi gizleyebiliyor')

    const { data: gizlemeSonrasi, error: gizlemeSonrasiHata } = await a.rpc('konusmalarim')
    if (gizlemeSonrasiHata) throw new Error(`konusmalarim hatasi: ${gizlemeSonrasiHata.message}`)
    esitMi(
      ((gizlemeSonrasi ?? []) as KonusmaSatiri[]).some((k) => k.kisi_id === bId),
      false,
      "gizledikten sonra A'nin kutusunda B artik yok"
    )

    const { error: bMesajHata } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: "senaryo 41 - B'nin cevabi",
    })
    esitMi(bMesajHata, null, 'B yazinca gonderim basarili oluyor')

    const { data: bYazincaSonrasi, error: bYazincaSonrasiHata } = await a.rpc('konusmalarim')
    if (bYazincaSonrasiHata) throw new Error(`konusmalarim hatasi: ${bYazincaSonrasiHata.message}`)
    esitMi(
      ((bYazincaSonrasi ?? []) as KonusmaSatiri[]).some((k) => k.kisi_id === bId),
      true,
      "B yazinca konusma A'nin kutusunda tekrar goruluyor"
    )

    const { error: birakHata } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(birakHata, null, 'temizlik: bag koparilabiliyor')

    const takipKalan = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKalan, [], "temizlik: iki yonun ikisi de takipler'den gercekten gitti")

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('42 - Okunmamis sayisi dogru', async () => {
    const { error: gonderHata } = await a.rpc('takip_istegi_gonder', { p_kullanici_id: bId })
    esitMi(gonderHata, null, 'on kosul: A istegi gonderebiliyor')

    const { error: kabulHata } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, 'on kosul: B istegi kabul edebiliyor')

    const { data: konusmaId, error: mesaj1Hata } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: 'senaryo 42 - birinci mesaj',
    })
    esitMi(mesaj1Hata, null, 'B ilk mesaji gonderebiliyor')

    const { error: mesaj2Hata } = await b.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: 'senaryo 42 - ikinci mesaj',
    })
    esitMi(mesaj2Hata, null, 'B ikinci mesaji gonderebiliyor')

    const { data: okumadan, error: okumadanHata } = await a.rpc('konusmalarim')
    if (okumadanHata) throw new Error(`konusmalarim hatasi: ${okumadanHata.message}`)
    const satirOkumadan = ((okumadan ?? []) as KonusmaSatiri[]).find((k) => k.kisi_id === bId)
    esitMi(satirOkumadan?.okunmamis, 2, "A'nin okunmamis sayaci 2 (B iki mesaj yazdi)")
    esitMi(
      satirOkumadan?.son_mesaj,
      'senaryo 42 - ikinci mesaj',
      'saglama: son_mesaj gercekten ikinci mesaja isaret ediyor (dogru satir sayiliyor)'
    )

    const { error: isaretleHata } = await a.rpc('konusmayi_okundu_isaretle', {
      p_konusma_id: konusmaId,
    })
    esitMi(isaretleHata, null, 'A konusmayi okundu isaretleyebiliyor')

    const { data: okuduktanSonra, error: okuduktanSonraHata } = await a.rpc('konusmalarim')
    if (okuduktanSonraHata) throw new Error(`konusmalarim hatasi: ${okuduktanSonraHata.message}`)
    const satirOkuduktanSonra = ((okuduktanSonra ?? []) as KonusmaSatiri[]).find((k) => k.kisi_id === bId)
    esitMi(satirOkuduktanSonra?.okunmamis, 0, 'okundu isaretlenince sayac sifirlaniyor')

    const { error: birakHata } = await a.rpc('takibi_birak', { p_kullanici_id: bId })
    esitMi(birakHata, null, 'temizlik: bag koparilabiliyor')

    // 42, bag kuran SON senaryo: buradaki temizligi kosum icinde baska
    // hicbir senaryonun on kosulu kapatmiyor, bu yuzden satirlarin
    // gittigi burada acikca soruluyor.
    const takipKalan = await ikiYonTakipSatirlari(a, aId, bId)
    esitMi(takipKalan, [], "temizlik: iki yonun ikisi de takipler'den gercekten gitti")

    await konusmaTemizleVeDogrula(konusmaId as string)
  })

  await senaryo('43 - Kimliksiz cagrilar reddedilir', async () => {
    const anonim = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { error: mesajHata } = await anonim.rpc('mesaj_gonder', {
      p_kullanici_id: bId,
      p_metin: 'kimliksiz deneme',
    })
    esitMi(mesajHata?.code, '42501', 'kimliksiz mesaj_gonder cagrisi 42501 ile reddedilir')

    const { error: listeHata } = await anonim.rpc('konusmalarim')
    esitMi(listeHata?.code, '42501', 'kimliksiz konusmalarim cagrisi 42501 ile reddedilir')
  })

  await senaryo('44 - Kendine mesaj yok', async () => {
    const { data, error } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: aId,
      p_metin: 'kendime mesaj',
    })
    esitMi(data ?? null, null, 'kendine gonderim basarisiz oldugu icin konusma id donmuyor')
    esitMi(error !== null, true, 'A kendine mesaj gonderemez')
    esitMi(
      error?.message?.includes('Kendine mesaj gonderemezsin') ?? false,
      true,
      'hata mesaji "Kendine mesaj gonderemezsin" iceriyor'
    )

    // error yine destructure ediliyor: sessizce yutulsaydi konusmalarim
    // kirildiginda bos dizi donerdi ve asagidaki negatif iddia vakumda
    // gecerdi.
    const { data: liste, error: listeHatasi } = await a.rpc('konusmalarim')
    if (listeHatasi) throw new Error(`konusmalarim hatasi: ${listeHatasi.message}`)
    esitMi(
      ((liste ?? []) as KonusmaSatiri[]).some((k) => k.kisi_id === aId),
      false,
      'basarisiz kendine-gonderim hicbir konusma satiri olusturmadi'
    )
  })

  await senaryo('45 - Askidaki kullanici istek gonderemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '45 kurulum: aski satiri yazildi')

    const { error } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(error !== null, true, '45: askidaki A istek gonderemez')

    // Kapi henuz baglanmamisken (migration oncesi kirmizi kosum) bu
    // cagri gercekten basariyla gecip A->B 'beklemede' bir takip satiri
    // birakabiliyor. O satir temizlenmezse senaryo 46'nin kendi istegi
    // "Istegin zaten gonderilmis" hatasina carpar ve 46 askida-hedef
    // kontrolunu degil, bu alakasiz cift-gonderim korumasini test etmis
    // olur (vakum halinde gecen bir dogrulama). takibi_birak migration
    // sonrasi da zararsiz: satir hic olusmadigi icin sessizce hicbir
    // sey silmez.
    await a.rpc('takibi_birak', { p_kullanici_id: bId })

    await hesapDurumunuTemizle([aId])
  })

  await senaryo('46 - Askidaki kisiye istek gonderilemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '46 kurulum: aski satiri yazildi')

    const { error } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(error !== null, true, '46: askidaki B istek alamaz')

    await hesapDurumunuTemizle([bId])
  })

  await senaryo('47 - Askidaki kullanici icerik uretemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '47 kurulum: aski satiri yazildi')

    const { error: checkInHata } = await a.rpc('check_in_yap', {
      p_mekan_id: mekan1,
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
    })
    esitMi(checkInHata !== null, true, '47: askidaki A check-in yapamaz')

    const { error: mekanHata } = await a.rpc('mekan_ekle', {
      p_ad: 'GORUNURLUK-TEST-ASKI-MEKAN',
      p_tur: 'test',
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
      p_cihaz_lat: MEKAN_1.lat,
      p_cihaz_lng: MEKAN_1.lng,
    })
    esitMi(mekanHata !== null, true, '47: askidaki A mekan ekleyemez')

    const { error: adHata } = await a.rpc('kullanici_adi_degistir', {
      p_yeni_ad: 'aski_kacis_denemesi',
    })
    esitMi(adHata !== null, true, '47: askidaki A kullanici adi degistiremez')

    await hesapDurumunuTemizle([aId])
  })

  await senaryo('48 - Askidaki kullanici istek kabul edemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }

    // A -> B bekleyen bir takip istegi kur (A aktifken).
    await a.rpc('takibi_birak', { p_kullanici_id: bId })
    const { error: istekHata } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(istekHata, null, '48 kurulum: istek gonderildi')

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '48 kurulum: B askiya alindi')

    const { error } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(error !== null, true, '48: askidaki B istegi kabul edemez')

    await hesapDurumunuTemizle([bId])
    // takip_istegini_yanitla(..., false) yalnizca durum='beklemede'
    // satirini siler. Kirmizi kosumda (migrasyon henuz yokken) B'nin
    // kabulu gercekten basarili olur, yani durum 'kabul' olur ve bu
    // temizlik hicbir sey silmeden hata dondurup A-B arasinda
    // karsilikli bir takip birakir. takibi_birak durum'a bakmadan iki
    // yonu de sildigi icin hem kirmizi hem yesil kosumda dogru calisir.
    await b.rpc('takibi_birak', { p_kullanici_id: aId })

    // Ikinci bolum: KARSI TARAF (istegi gonderen) askidaysa da yanitlama
    // basarili olmamali. A -> B beklemede bir istek kurup A'yi askiya
    // aliyoruz; B aktifken kabul etmeye calisiyor.
    const { error: istekHata2 } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(istekHata2, null, '48b kurulum: istek gonderildi')

    const { error: kurulumHata2 } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata2, null, '48b kurulum: A askiya alindi')

    const { error: error2 } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(
      error2 !== null,
      true,
      '48b: aktif B, askidaki A\'nin istegini kabul edemez',
    )

    // Yalniz "hata dondu" demek yetmez: kismi bir yazma kalmadigini da
    // dogruluyoruz.
    const { data: kabulSatirlari, error: kontrolHata } = await yonetici
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', aId)
      .eq('takip_edilen_id', bId)
      .eq('durum', 'kabul')
    esitMi(kontrolHata, null, '48b kontrol: takipler sorgulanabildi')
    esitMi(
      kabulSatirlari?.length ?? -1,
      0,
      '48b: kabul edilmis satir olusmadi (kismi yazma yok)',
    )

    await hesapDurumunuTemizle([aId])
    // Kirmizi kosumda (yeni kontrol henuz yokken) B'nin kabulu gercekten
    // basarili olur ve karsilikli takip kurulur. takibi_birak durum'a
    // bakmadan iki yonu de sildigi icin hem kirmizi hem yesil kosumda
    // dogru toparlar.
    await b.rpc('takibi_birak', { p_kullanici_id: aId })
  })

  await senaryo('49 - Askidaki kullanici profilini degistiremez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { data: onceki, error: okumaHata } = await a
      .from('profiller')
      .select('biyografi')
      .eq('id', aId)
      .single()
    esitMi(okumaHata, null, '49 kurulum: mevcut biyografi okundu')

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '49 kurulum: aski satiri yazildi')

    // RLS bir update'i eslesen satir bulamayinca hata DEGIL, sifir satir
    // doner. Bu yuzden asil iddia yazmaHata'nin dolu olmasi degil,
    // biyografinin DEGISMEMIS olmasi; yazmaHata yine de alinip await
    // edilir, sadece bilgi amaclidir.
    const { error: yazmaHata } = await a
      .from('profiller')
      .update({ biyografi: 'ASKIDA-DEGISTIRME-DENEMESI' })
      .eq('id', aId)
    void yazmaHata

    const { data: sonraki, error: ikinciOkumaHata } = await a
      .from('profiller')
      .select('biyografi')
      .eq('id', aId)
      .single()
    esitMi(ikinciOkumaHata, null, '49 kontrol: guncel biyografi okundu')

    esitMi(
      sonraki?.biyografi ?? null,
      onceki?.biyografi ?? null,
      '49: askidaki A biyografisini degistiremedi'
    )

    await hesapDurumunuTemizle([aId])
  })

  await temizle(t)
  sonucuBildirVeCik()
}

main()
