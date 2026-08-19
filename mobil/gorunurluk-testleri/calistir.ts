import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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

// anilariGetir sahip+mekan bazinda TUM anilari listeler; bir sahibin
// birden fazla anisi biriktigi senaryolarda (ör. senaryo 6, A'nin
// baska bir anisini da olusturuyor) belirli BIR satirin gorunup
// gorunmedigini net sekilde sormak icin id'ye gore dogrudan sorgu:
async function aniGorulebiliyorMu(istemci: SupabaseClient, checkInId: string): Promise<boolean> {
  const { data, error } = await istemci.from('check_inler').select('id').eq('id', checkInId)
  if (error) throw new Error(`ani gorunurluk sorgusu hatasi: ${error.message}`)
  return (data as { id: string }[]).length > 0
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
  let aCheckIn2Id: string | null = null

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
    aCheckIn2Id = aCi.id
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

  await senaryo('10 - Gizli check-in aniya donusunce baskasina gorunmez', async () => {
    // Senaryo 5'ten beri A, B'yi engellemis durumda; bu blok tek basina
    // B'nin A'nin anilarini gormesini engeller ve gorunurluk kuralinin
    // gercekten calisip calismadigini test edilemez hale getirir. Bloku
    // gecici olarak kaldiriyoruz (senaryo 6'daki desenin ayni), sonunda
    // geri kuruyoruz.
    const { error: kaldirErr } = await a.rpc('engeli_kaldir', { p_kullanici_id: bId })
    if (kaldirErr) throw new Error(`engeli_kaldir hatasi: ${kaldirErr.message}`)

    // Bolum 1: gizli check-in -> ayrildim -> ani kimseye gorunmemeli.
    const aGizliCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng, true)
    t.checkInler.push({ istemci: a, id: aGizliCi.id })

    const { error: ayril1Err } = await a.rpc('check_inden_ayril', { p_check_in_id: aGizliCi.id })
    if (ayril1Err) throw new Error(`check_inden_ayril hatasi (gizli): ${ayril1Err.message}`)

    const bGizliAniGorurMu = await aniGorulebiliyorMu(b, aGizliCi.id)
    esitMi(bGizliAniGorurMu, false, 'B, gizli check-in\'ten donusen aniyi goremez')

    const aGizliAniGorurMu = await aniGorulebiliyorMu(a, aGizliCi.id)
    esitMi(aGizliAniGorurMu, true, 'A, kendi gizli anisini (ani haline gelmis olsa da) hala gorur')

    // Bolum 2 (ters yon kontrolu): gizli OLMAYAN check-in -> ayrildim ->
    // ani yine herkese_acik gorunmeli. Bu kontrol olmadan senaryo, kuralin
    // yalniz gizli check-in'leri kapattigini degil, her aniyi kapattigini
    // da (yanlislikla) "gecti" sayabilirdi.
    const aAcikCi = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng, false)
    t.checkInler.push({ istemci: a, id: aAcikCi.id })

    const { error: ayril2Err } = await a.rpc('check_inden_ayril', { p_check_in_id: aAcikCi.id })
    if (ayril2Err) throw new Error(`check_inden_ayril hatasi (acik): ${ayril2Err.message}`)

    const bAcikAniGorurMu = await aniGorulebiliyorMu(b, aAcikCi.id)
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
      const { error: silHata } = await a.storage.from('profil-fotograflari').remove([dosyaYolu])
      if (silHata) {
        console.error(`  gorunurluk-testleri: yuklenen test dosyasi silinemedi: ${silHata.message}`)
      }
    }
  })

  await temizle(t)
  sonucuBildirVeCik()
}

main()
