import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ikiKullaniciIleBaglan,
  anonIstemciOlustur,
  yoneticiIstemcisi,
  esitMi,
  sonucuBildirVeCik,
} from './yardimcilar'

const KULLANICI_ADI_DESENI = /^[a-z0-9._]{3,20}$/

async function main() {
  const { a, b, aId, bId } = await ikiKullaniciIleBaglan()

  console.log('\n--- Task 1: kullanici adi sutunlari ---')
  const { data, error } = await a
    .from('profiller')
    .select('id, kullanici_adi, kullanici_adi_degistirildi, aramada_gorunsun')
    .eq('id', aId)
    .single()

  esitMi(error, null, 'uc yeni sutun okunabiliyor')

  const satir = data as {
    kullanici_adi: string
    kullanici_adi_degistirildi: string | null
    aramada_gorunsun: boolean
  }
  esitMi(
    KULLANICI_ADI_DESENI.test(satir.kullanici_adi ?? ''),
    true,
    `mevcut profilin kullanici adi bicime uyuyor (${satir.kullanici_adi})`
  )
  esitMi(typeof satir.aramada_gorunsun, 'boolean', 'aramada_gorunsun boolean')
  esitMi(satir.aramada_gorunsun, true, 'aramada_gorunsun varsayilani true')

  console.log('\n--- Task 2: sutun duzeyinde update yetkisi ---')
  const { error: adHatasi } = await a
    .from('profiller')
    .update({ kullanici_adi: 'dogrudan_yazim' })
    .eq('id', aId)
  esitMi(adHatasi?.code === '42501', true, 'kullanici_adi dogrudan guncellenemiyor')

  const { error: gorunurlukHatasi } = await a
    .from('profiller')
    .update({ aramada_gorunsun: true })
    .eq('id', aId)
  esitMi(gorunurlukHatasi, null, 'aramada_gorunsun dogrudan guncellenebiliyor')

  console.log('\n--- Task 3: kullanici_adi_musait_mi ---')
  const { data: kendiProfil } = await a
    .from('profiller')
    .select('kullanici_adi')
    .eq('id', aId)
    .single()
  const kendiAd = (kendiProfil as { kullanici_adi: string }).kullanici_adi

  const { data: alinmis, error: musaitHatasi } = await a.rpc('kullanici_adi_musait_mi', {
    p_ad: kendiAd,
  })
  esitMi(musaitHatasi, null, 'musait_mi cagrilabiliyor')
  esitMi(alinmis, false, 'var olan ad musait degil')

  // Zaman damgali dinamik ad, kimsenin alamasi imkansiz.
  // Sabit ad kullanirsan, biri gercekten onu aldiginda test kirilir.
  const olmayanAd = `musait_${Date.now()}`.slice(0, 20)
  const { data: bos } = await a.rpc('kullanici_adi_musait_mi', {
    p_ad: olmayanAd,
  })
  esitMi(bos, true, 'alinmamis ad musait')

  const { data: buyukHarfli } = await a.rpc('kullanici_adi_musait_mi', { p_ad: 'ORCUN' })
  esitMi(buyukHarfli, false, 'bicime uymayan ad musait sayilmaz')

  console.log('\n--- Task 4: kullanici_adi_degistir ---')
  const { error: bicimHatasi } = await a.rpc('kullanici_adi_degistir', {
    p_yeni_ad: 'GECERSIZ AD',
  })
  esitMi(
    bicimHatasi?.message?.includes('kurallara uymuyor') ?? false,
    true,
    'bicime uymayan ad reddediliyor'
  )

  const { error: ayniAdHatasi } = await a.rpc('kullanici_adi_degistir', {
    p_yeni_ad: kendiAd,
  })
  esitMi(
    ayniAdHatasi?.message?.includes('Zaten bu kullanici adini') ?? false,
    true,
    'ayni ad yeniden yazilinca 30 gunluk hak harcanmiyor'
  )

  console.log('\n--- Task 5: kisi_ara ---')
  const { data: kisaSonuc, error: kisaHata } = await a.rpc('kisi_ara', { p_metin: 'a' })
  esitMi(kisaHata, null, 'kisi_ara cagrilabiliyor')
  esitMi((kisaSonuc ?? []).length, 0, 'tek karakterlik arama bos doner')

  const { data: uzunSonuc, error: uzunHata } = await a.rpc('kisi_ara', {
    p_metin: kendiAd.slice(0, 4),
  })
  esitMi(uzunHata, null, 'iki karakterden uzun arama hata vermiyor')
  esitMi(
    ((uzunSonuc ?? []) as { id: string }[]).some((s) => s.id === aId),
    false,
    'arama cagiranin kendisini sonuclara koymaz'
  )

  // Alt cizgi kullanici adinda gecerli bir karakter; kacirilmazsa `like`
  // icinde joker gibi davranir. B'nin adindaki gercek bir harfi alt
  // cizgiyle degistirip ariyoruz: harfi harfine eslesme kuralinda sonuc
  // BOS olmali, kacis bozuksa B geri doner.
  const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
  const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi

  // Deseni, gercek karakteri alt cizgi OLMAYAN bir konuma alt cizgi
  // koyarak uretiyoruz. Sabit bir konum (ornegin 5. karakter) kullanmak
  // kirilgan: kullanici adi degistiginde o konum gercekten alt cizgi
  // olabilir ve desen mesru olarak eslesir, iddia da yanlis yere duser.
  // (Bir kez yasandi: B'nin adi test_<zaman damgasi> olunca.)
  const jokerKonumu = [...bAdi].findIndex((karakter, sira) => sira >= 2 && karakter !== '_')
  const jokerDeseni = bAdi.slice(0, jokerKonumu) + '_'

  const { data: jokerSonuc, error: jokerHata } = await a.rpc('kisi_ara', { p_metin: jokerDeseni })
  esitMi(jokerHata, null, 'joker probu cagrilabiliyor')
  esitMi(
    ((jokerSonuc ?? []) as { id: string }[]).some((s) => s.id === bId),
    false,
    `alt cizgi joker gibi davranmiyor (desen: ${jokerDeseni})`
  )

  // Ters bolu iceren arama. Kacis dogruysa desen harfi harfine
  // "kull\a" olur ve hicbir sey eslesmez; ilk replace bozuksa "\a"
  // bir escape dizisi gibi yorumlanip "kulla" gibi davranir ve B doner.
  // Alt cizgi testi bu hatayi GORMEZ, cunku alt cizgiyi kaciran replace
  // her iki surumde de calisiyor.
  // Konum sabit degil (joker testindeki gibi): alt cizgiyle ayni sebep
  // gecerli, bAdi'nin 4. karakteri alt cizgi olursa (ornegin
  // test_<zaman damgasi> biciminde) sabit 4. indeks kullanmak iddiayi
  // her iki surumde de "gecti" gosterirdi.
  const tbKonumu = [...bAdi].findIndex((k, i) => i >= 2 && k !== '_' && k !== '\\')
  const tersBoluDeseni = bAdi.slice(0, tbKonumu) + '\\' + bAdi[tbKonumu]

  const { data: tersBoluSonuc, error: tersBoluHata } = await a.rpc('kisi_ara', {
    p_metin: tersBoluDeseni,
  })
  esitMi(tersBoluHata, null, 'ters bolu probu cagrilabiliyor')
  esitMi(
    ((tersBoluSonuc ?? []) as { id: string }[]).some((s) => s.id === bId),
    false,
    'ters bolu escape dizisi olarak yorumlanmiyor'
  )

  // Saglama: yukaridaki iki negatif iddia "hicbir sey bulunamiyor"
  // diyor ama kisi_ara'nin gercekten bir sey BULABILDIGINI hic
  // dogrulamiyordu. Tam kullanici adiyla arama B'yi donmeli.
  const { data: tamAdSonuc, error: tamAdHata } = await a.rpc('kisi_ara', { p_metin: bAdi })
  esitMi(tamAdHata, null, 'tam ad probu cagrilabiliyor')
  esitMi(
    ((tamAdSonuc ?? []) as { id: string }[]).some((s) => s.id === bId),
    true,
    "saglama: tam kullanici adiyla arama B'yi buluyor"
  )

  console.log('\n--- Task 6: baskasinin_profili ---')
  const { data: profilSatirlari, error: profilHatasi } = await a.rpc('baskasinin_profili', {
    p_kullanici_id: bId,
  })
  esitMi(profilHatasi, null, 'baskasinin_profili cagrilabiliyor')

  const ilk = ((profilSatirlari ?? []) as Record<string, unknown>[])[0] ?? {}
  esitMi('kullanici_adi' in ilk, true, 'donen satirda kullanici_adi var')
  esitMi('dogum_tarihi' in ilk, false, 'donen satirda dogum tarihi yok')

  console.log('\n--- Faz 3a Task 1: takipler tablosu ---')
  const { error: takipOkuma } = await a.from('takipler').select('takip_eden_id').limit(1)
  esitMi(takipOkuma, null, 'takipler tablosu okunabiliyor')

  const { error: takipYazma } = await a
    .from('takipler')
    .insert({ takip_eden_id: aId, takip_edilen_id: bId })
  esitMi(takipYazma?.code === '42501', true, 'takipler tablosuna dogrudan yazilamiyor')

  console.log('\n--- Task 2: sohbet_istekleri tablosu ---')
  const { error: sohbetOkuma } = await a.from('sohbet_istekleri').select('gonderen_id').limit(1)
  esitMi(sohbetOkuma, null, 'sohbet_istekleri tablosu okunabiliyor')

  const { error: sohbetYazma } = await a
    .from('sohbet_istekleri')
    .insert({ gonderen_id: aId, alan_id: bId })
  esitMi(sohbetYazma?.code === '42501', true, 'sohbet_istekleri tablosuna dogrudan yazilamiyor')

  console.log('\n--- Task 3: bag.takip_ediyor_mu ---')
  // Fonksiyon bag semasinda oldugu icin PostgREST uzerinden RPC olarak
  // cagrilamamali; cagrilabiliyorsa sema ayrimi ise yaramiyor demektir.
  const { error: bagRpcHatasi } = await a.rpc('takip_ediyor_mu', {
    p_takip_eden: aId,
    p_takip_edilen: bId,
  })
  esitMi(bagRpcHatasi !== null, true, 'bag yardimcisi istemciye RPC olarak acilmamis')

  console.log('\n--- Faz 3a Task 4: check_inler.bulunurluk ---')
  const { error: bulunurlukOkuma } = await a
    .from('check_inler')
    .select('id, bulunurluk, gorunurluk')
    .limit(1)
  esitMi(bulunurlukOkuma, null, 'bulunurluk sutunu okunabiliyor')

  const { error: gizliMiHatasi } = await a.from('check_inler').select('gizli_mi').limit(1)
  esitMi(gizliMiHatasi !== null, true, 'gizli_mi sutunu artik yok')

  console.log('\n--- Faz 3a Task 5: varsayilan_bulunurluk ---')
  const { error: varsayilanOkuma } = await a
    .from('profiller')
    .select('varsayilan_bulunurluk')
    .eq('id', aId)
    .single()
  esitMi(varsayilanOkuma, null, 'varsayilan_bulunurluk okunabiliyor')

  const { error: varsayilanYazma } = await a
    .from('profiller')
    .update({ varsayilan_bulunurluk: 'herkese_acik' })
    .eq('id', aId)
  esitMi(varsayilanYazma, null, 'varsayilan_bulunurluk dogrudan guncellenebiliyor')

  const { error: adYazma } = await a
    .from('profiller')
    .update({ kullanici_adi: 'dogrudan_yazim' })
    .eq('id', aId)
  esitMi(adYazma?.code === '42501', true, 'kullanici_adi hala dogrudan guncellenemiyor')

  console.log("\n--- Faz 3a Task 7: istek RPC'leri ---")
  const { error: kendineHatasi } = await a.rpc('takip_istegi_gonder', {
    p_kullanici_id: aId,
  })
  esitMi(
    kendineHatasi?.message?.includes('Kendine istek') ?? false,
    true,
    'kendine istek gonderilemiyor'
  )

  const { error: yanitHatasi } = await a.rpc('takip_istegini_yanitla', {
    p_kullanici_id: bId,
    p_kabul: true,
  })
  esitMi(
    yanitHatasi?.message?.includes('bulunamadi') ?? false,
    true,
    'olmayan istek yanitlanamiyor'
  )

  console.log('\n--- Task 8: check_in_yap bulunurluk ---')
  const { error: gecersizBulunurluk } = await a.rpc('check_in_yap', {
    p_mekan_id: '00000000-0000-0000-0000-000000000000',
    p_lat: 39.0,
    p_lng: 35.0,
    p_bulunurluk: 'sadece_annem',
  })
  esitMi(
    gecersizBulunurluk?.message?.includes('Gecersiz bulunurluk') ?? false,
    true,
    'gecersiz bulunurluk degeri reddediliyor'
  )

  console.log('\n--- Task 9 duzeltme: istek_gunlugu ---')
  // RLS acik, politika yok: gercekte calistirilip gozlemlendi. Select
  // hata vermiyor ama hicbir satir donmuyor (data bos dizi, error null);
  // Postgres'in RLS + politikasiz tablo davranisi budur, varsayilmadi.
  const { data: gunlukSatirlari } = await a.from('istek_gunlugu').select('id').limit(1)
  esitMi(gunlukSatirlari, [], 'istek_gunlugu tablosuna dogrudan select bos donuyor')

  const { error: gunlukYazmaHatasi } = await a
    .from('istek_gunlugu')
    .insert({ gonderen_id: aId })
  esitMi(gunlukYazmaHatasi?.code === '42501', true, 'istek_gunlugu tablosuna dogrudan yazilamiyor')

  console.log('\n--- Final inceleme Madde 1/2: check_inler sutun yetkisi ---')
  // Kod, varsayilmadan, canli veritabaninda gozlemlendi: her iki durumda
  // da 42501 ("permission denied for table check_inler") donuyor - ayni
  // kod profiller icin yukarida kullanilan kodla ayni.
  const { error: gorunurlukYazmaHatasi } = await a
    .from('check_inler')
    .update({ gorunurluk: 'herkese_acik' })
    .eq('kullanici_id', aId)
  esitMi(
    gorunurlukYazmaHatasi?.code === '42501',
    true,
    'check_inler.gorunurluk dogrudan guncellenemiyor'
  )

  // Kritik olan bu: mekan_id'yi dogrudan degistirebilmek, mekan kapisini
  // taklit edip suresiz canli check-in okumaya izin veriyordu (Madde 1).
  const { error: mekanIdYazmaHatasi } = await a
    .from('check_inler')
    .update({ mekan_id: '00000000-0000-0000-0000-000000000000' })
    .eq('kullanici_id', aId)
  esitMi(
    mekanIdYazmaHatasi?.code === '42501',
    true,
    'check_inler.mekan_id dogrudan guncellenemiyor (mekan kapisi taklit edilemiyor)'
  )

  console.log('\n--- Sertlestirme: NULL parametre korumasi ---')
  // `x not in (...)` x NULL oldugunda NULL doner (true degil), yani
  // korumasiz bir `if` sessizce atlanirdi ve deger sutunun `not null`
  // kisitina carpip ham 23502 dondururdu. Uc RPC de `is null or` ile
  // guclendirildi; burada dostane Turkce mesajin (kod P0001) hala
  // dondugu dogrulaniyor, ham 23502 degil.
  const { error: aniNullHatasi } = await a.rpc('ani_gorunurlugunu_ayarla', {
    p_deger: null,
  })
  esitMi(aniNullHatasi?.code, 'P0001', 'ani_gorunurlugunu_ayarla(null) ham 23502 degil')
  esitMi(
    aniNullHatasi?.message,
    'Gecersiz gorunurluk degeri',
    'ani_gorunurlugunu_ayarla(null) dostane mesaj donduruyor'
  )

  // check_in_yap(null): mesaj iddiasi NULL korumanin varligini kanitlar. Kod
  // iddiasi yeterli degildir: p_mekan_id gecersiz olunca 'Mekan bulunamadi' de P0001 doner.
  const { error: checkinNullHatasi } = await a.rpc('check_in_yap', {
    p_mekan_id: '00000000-0000-0000-0000-000000000000',
    p_lat: 39.0,
    p_lng: 35.0,
    p_bulunurluk: null,
  })
  esitMi(checkinNullHatasi?.code, 'P0001', 'check_in_yap(null) ham 23502 degil')
  esitMi(
    checkinNullHatasi?.message,
    'Gecersiz bulunurluk degeri',
    'check_in_yap(null) dostane mesaj donduruyor'
  )

  const { error: sikayetNullHatasi } = await a.rpc('sikayet_gonder', {
    p_hedef_tur: null,
    p_hedef_id: '00000000-0000-0000-0000-000000000000',
    p_sebep: 'test',
  })
  esitMi(sikayetNullHatasi?.code, 'P0001', 'sikayet_gonder(null) ham 23502 degil')
  esitMi(
    sikayetNullHatasi?.message,
    'Gecersiz sikayet hedefi',
    'sikayet_gonder(null) dostane mesaj donduruyor'
  )

  console.log('\n--- Faz 3a takip isleri Gorev 1: sohbet_istegini_geri_cek ---')
  // Kimliksiz istemci: revoke from public, anon fonksiyona hic erisim
  // vermiyor, cagri gorunun icine bile girmeden PostgREST/PostgreSQL
  // yetki katmaninda reddediliyor (gercekte gozlemlendi: 42501,
  // "permission denied for function sohbet_istegini_geri_cek").
  const anon = anonIstemciOlustur()
  const { error: anonGeriCekHatasi } = await anon.rpc('sohbet_istegini_geri_cek', {
    p_kullanici_id: bId,
  })
  esitMi(anonGeriCekHatasi?.code, '42501', 'kimliksiz sohbet_istegini_geri_cek cagrisi reddediliyor')

  console.log('\n--- Faz 3a takip isleri Gorev 1: sikayet_gonder dogrulama ---')
  // Gercekte gozlemlendi: her ikisi de P0001 (dostane raise exception),
  // sikayetler tablosunun `not null` kisitina carpan ham 23502 degil.
  const { error: sebepNullHatasi } = await a.rpc('sikayet_gonder', {
    p_hedef_tur: 'kullanici',
    p_hedef_id: bId,
    p_sebep: null,
  })
  esitMi(sebepNullHatasi?.code, 'P0001', 'sikayet_gonder(p_sebep: null) ham 23502 degil')
  esitMi(
    sebepNullHatasi?.message,
    'Sikayet sebebi belirtilmeli',
    'sikayet_gonder(p_sebep: null) dostane mesaj donduruyor'
  )

  const { error: hedefIdNullHatasi } = await a.rpc('sikayet_gonder', {
    p_hedef_tur: 'kullanici',
    p_hedef_id: null,
    p_sebep: 'test',
  })
  esitMi(hedefIdNullHatasi?.code, 'P0001', 'sikayet_gonder(p_hedef_id: null) ham 23502 degil')
  esitMi(
    hedefIdNullHatasi?.message,
    'Gecersiz sikayet hedefi',
    'sikayet_gonder(p_hedef_id: null) dostane mesaj donduruyor'
  )

  console.log('\n--- Faz 3b Task 9: sikayet_gonder mesaj hedef turu ---')
  // p_hedef_tur: 'mesaj' artik gecerli bir hedef turu (Task 9'dan once
  // burada 'Gecersiz sikayet hedefi' donerdi, ayni mesaji p_sebep: null
  // kontrolu de dondurur). p_sebep bilerek null birakiliyor: cagri
  // sebep kontrolune kadar ilerleyip ORADA duruyor, bu da tur kontrolunu
  // gectigini kanitliyor ama sikayetler tablosuna hicbir satir yazmiyor.
  const { error: mesajTuruHatasi } = await a.rpc('sikayet_gonder', {
    p_hedef_tur: 'mesaj',
    p_hedef_id: bId,
    p_sebep: null,
  })
  esitMi(mesajTuruHatasi?.code, 'P0001', "sikayet_gonder(p_hedef_tur: 'mesaj') ham 23502 degil")
  esitMi(
    mesajTuruHatasi?.message,
    'Sikayet sebebi belirtilmeli',
    "sikayet_gonder p_hedef_tur='mesaj' artik tur kontrolunu geciyor (sebep kontrolune ulasiyor)"
  )

  console.log('\n--- Faz 3b Task 3-5: konusmalar, konusma_uyeleri, mesajlar dogrudan yazma ---')
  // Uc tablo da RLS acik ve authenticated'tan insert/update/delete
  // revoke edilmis; yazma tamamen ileriki RPC'ler uzerinden olacak.
  // Kod gercekte gozlemlendi: 42501 ("permission denied for table
  // ..."), digerleriyle ayni kod.
  const { error: konusmalarInsertHatasi } = await a.from('konusmalar').insert({ tur: 'birebir' })
  esitMi(
    konusmalarInsertHatasi?.code === '42501',
    true,
    'konusmalar tablosuna dogrudan insert reddediliyor'
  )

  const { error: konusmalarUpdateHatasi } = await a
    .from('konusmalar')
    .update({ tur: 'mekan_odasi' })
    .eq('id', '00000000-0000-0000-0000-000000000000')
  esitMi(
    konusmalarUpdateHatasi?.code === '42501',
    true,
    'konusmalar tablosuna dogrudan update reddediliyor'
  )

  const { error: uyeleriInsertHatasi } = await a
    .from('konusma_uyeleri')
    .insert({ konusma_id: '00000000-0000-0000-0000-000000000000', kullanici_id: aId })
  esitMi(
    uyeleriInsertHatasi?.code === '42501',
    true,
    'konusma_uyeleri tablosuna dogrudan insert reddediliyor'
  )

  const { error: uyeleriUpdateHatasi } = await a
    .from('konusma_uyeleri')
    .update({ gizlendi_mi: true })
    .eq('kullanici_id', aId)
  esitMi(
    uyeleriUpdateHatasi?.code === '42501',
    true,
    'konusma_uyeleri tablosuna dogrudan update reddediliyor'
  )

  const { error: mesajlarInsertHatasi } = await a.from('mesajlar').insert({
    konusma_id: '00000000-0000-0000-0000-000000000000',
    gonderen_id: aId,
    metin: 'merhaba',
  })
  esitMi(
    mesajlarInsertHatasi?.code === '42501',
    true,
    'mesajlar tablosuna dogrudan insert reddediliyor'
  )

  const { error: mesajlarUpdateHatasi } = await a
    .from('mesajlar')
    .update({ metin: 'degistirildi' })
    .eq('gonderen_id', aId)
  esitMi(
    mesajlarUpdateHatasi?.code === '42501',
    true,
    'mesajlar tablosuna dogrudan update reddediliyor'
  )

  console.log('\n--- Faz 3b Task 6: bag.yazabilir_mi ---')
  // Fonksiyon bag semasinda oldugu icin PostgREST uzerinden RPC olarak
  // cagrilamamali; cagrilabiliyorsa sema ayrimi ise yaramiyor demektir.
  const { error: yazabilirRpcHatasi } = await a.rpc('yazabilir_mi', {
    p_hedef: bId,
  })
  esitMi(yazabilirRpcHatasi !== null, true, 'bag yazma kapisi istemciye RPC olarak acilmamis')

  console.log('\n--- Faz 3b Task 7: mesaj_gonder ---')
  // revoke from public, anon: cagri gorunun icine hic girmeden
  // PostgREST/PostgreSQL yetki katmaninda reddedilmeli (42501).
  const { error: anonMesajHatasi } = await anon.rpc('mesaj_gonder', {
    p_kullanici_id: bId,
    p_metin: 'merhaba',
  })
  esitMi(anonMesajHatasi?.code, '42501', 'kimliksiz mesaj_gonder cagrisi reddediliyor')

  console.log("\n--- Faz 3b Task 8: okuma RPC'leri ---")
  // Dorddu de revoke from public, anon: cagri gorunun icine hic girmeden
  // PostgREST/PostgreSQL yetki katmaninda reddedilmeli (42501). Canli
  // mesaj satiri gerektirmeyen tek ucuz iddia bu - satir gerektiren
  // senaryolar (okunmamis sayaci, sayfalama, gizleme) sonraki gorevin isi.
  const { error: anonKonusmalarimHatasi } = await anon.rpc('konusmalarim')
  esitMi(anonKonusmalarimHatasi?.code, '42501', 'kimliksiz konusmalarim cagrisi reddediliyor')

  const { error: anonMesajlariGetirHatasi } = await anon.rpc('mesajlari_getir', {
    p_konusma_id: '00000000-0000-0000-0000-000000000000',
  })
  esitMi(anonMesajlariGetirHatasi?.code, '42501', 'kimliksiz mesajlari_getir cagrisi reddediliyor')

  const { error: anonOkunduHatasi } = await anon.rpc('konusmayi_okundu_isaretle', {
    p_konusma_id: '00000000-0000-0000-0000-000000000000',
  })
  esitMi(
    anonOkunduHatasi?.code,
    '42501',
    'kimliksiz konusmayi_okundu_isaretle cagrisi reddediliyor'
  )

  const { error: anonGizleHatasi } = await anon.rpc('konusmayi_gizle', {
    p_konusma_id: '00000000-0000-0000-0000-000000000000',
  })
  esitMi(anonGizleHatasi?.code, '42501', 'kimliksiz konusmayi_gizle cagrisi reddediliyor')

  // Uyeligi olmayan bir konusma id'siyle mesajlari_getir: gercek uyesi
  // olunan bir konusma yaratmadan da "Konusma bulunamadi" dostane hatasi
  // dogrulanabilir - engelleme kontrolu ayni hatayi paylastigi icin
  // bu tek basina hangi dalin tetiklendigini ayirt etmiyor, ama RPC'nin
  // canli veritabaninda gercekten calistigini ve dostane hata dondugunu
  // (ham exception degil) gosteriyor.
  const { error: uyelikYokHatasi } = await a.rpc('mesajlari_getir', {
    p_konusma_id: '00000000-0000-0000-0000-000000000000',
  })
  esitMi(uyelikYokHatasi?.code, 'P0001', 'mesajlari_getir(uyesi olunmayan konusma) P0001 donuyor')
  esitMi(
    uyelikYokHatasi?.message,
    'Konusma bulunamadi',
    'mesajlari_getir(uyesi olunmayan konusma) dostane mesaj donduruyor'
  )

  console.log('\n--- Bildirimler Task 1: bildirim_jetonlari ---')
  // RLS acik, yalnizca kendi satirlarini SELECT edebilirsin; insert/update/
  // delete authenticated'dan tamamen geri alinmis, yazma yalnizca RPC ile.
  const { error: jetonSelectHatasi } = await a
    .from('bildirim_jetonlari')
    .select('jeton')
    .limit(1)
  esitMi(jetonSelectHatasi, null, 'bildirim_jetonlari tablosu okunabiliyor')

  const { error: jetonInsertHatasi } = await a
    .from('bildirim_jetonlari')
    .insert({ kullanici_id: aId, jeton: 'test-jeton', platform: 'ios' })
  esitMi(
    jetonInsertHatasi?.code === '42501',
    true,
    'bildirim_jetonlari tablosuna dogrudan insert reddediliyor'
  )

  const { error: jetonUpdateHatasi } = await a
    .from('bildirim_jetonlari')
    .update({ platform: 'android' })
    .eq('kullanici_id', aId)
  esitMi(
    jetonUpdateHatasi?.code === '42501',
    true,
    'bildirim_jetonlari tablosuna dogrudan update reddediliyor'
  )

  const { error: jetonDeleteHatasi } = await a
    .from('bildirim_jetonlari')
    .delete()
    .eq('kullanici_id', aId)
  esitMi(
    jetonDeleteHatasi?.code === '42501',
    true,
    'bildirim_jetonlari tablosuna dogrudan delete reddediliyor'
  )

  // revoke from public, anon: cagri govdeye hic girmeden PostgREST/
  // PostgreSQL yetki katmaninda reddedilmeli (42501), digerleriyle ayni kod.
  const { error: anonKaydetHatasi } = await anon.rpc('jeton_kaydet', {
    p_jeton: 'anon-jeton',
    p_platform: 'ios',
  })
  esitMi(anonKaydetHatasi?.code, '42501', 'kimliksiz jeton_kaydet cagrisi reddediliyor')

  const { error: anonSilHatasi } = await anon.rpc('jeton_sil', { p_jeton: 'anon-jeton' })
  esitMi(anonSilHatasi?.code, '42501', 'kimliksiz jeton_sil cagrisi reddediliyor')

  console.log('\n--- Bildirimler Task 1: jeton_kaydet dogrulama ---')
  const { error: bosJetonHatasi } = await a.rpc('jeton_kaydet', {
    p_jeton: '',
    p_platform: 'ios',
  })
  esitMi(
    bosJetonHatasi?.message?.includes('Jeton bos olamaz') ?? false,
    true,
    'bos jeton reddediliyor'
  )

  const { error: gecersizPlatformHatasi } = await a.rpc('jeton_kaydet', {
    p_jeton: 'gecerli-jeton',
    p_platform: 'windows',
  })
  esitMi(
    gecersizPlatformHatasi?.message?.includes('Gecersiz platform') ?? false,
    true,
    'gecersiz platform reddediliyor'
  )

  console.log('\n--- Bildirimler Task 1: jeton benzersizligi ve cihaz devri ---')
  // Zaman damgali jeton: baska bir kosumla ya da onceki kalintiyla
  // catismasin diye, sabit bir deger kullanmiyoruz.
  const paylasilanJeton = `paylasilan-${Date.now()}`

  const { error: aKaydetHatasi } = await a.rpc('jeton_kaydet', {
    p_jeton: paylasilanJeton,
    p_platform: 'ios',
  })
  esitMi(aKaydetHatasi, null, "A jeton kaydediyor")

  const { data: aOncesi } = await a
    .from('bildirim_jetonlari')
    .select('jeton')
    .eq('jeton', paylasilanJeton)
  esitMi((aOncesi ?? []).length, 1, "A'nin jetonu kayda gectikten sonra gorunuyor")

  // B ayni jetonu kaydedince, cihazi devraldigi varsayilir: A'nin ayni
  // jetonla kayitli satiri silinmeli, yoksa devredilen cihaz iki hesaba da
  // bildirim gonderirdi.
  const { error: bKaydetHatasi } = await b.rpc('jeton_kaydet', {
    p_jeton: paylasilanJeton,
    p_platform: 'android',
  })
  esitMi(bKaydetHatasi, null, "B ayni jetonu devraliyor")

  const { data: aSonrasi } = await a
    .from('bildirim_jetonlari')
    .select('jeton')
    .eq('jeton', paylasilanJeton)
  esitMi((aSonrasi ?? []).length, 0, "A'nin jetonu cihaz devri sonrasi silindi")

  // A'nin satirinin silindigini kanitlamak B'nin satir EDINDIGINI kanitlamaz
  // - jeton_kaydet basarisiz olup hicbir yeni satir yaratmasa bile A'nin
  // satiri yine silinmis olurdu. B'nin satirinin gercekten var oldugu ve
  // beklenen platformu tasidigi burada ayrica dogrulaniyor.
  const { data: bDevirSonrasi } = await b
    .from('bildirim_jetonlari')
    .select('jeton, platform')
    .eq('jeton', paylasilanJeton)
  esitMi((bDevirSonrasi ?? []).length, 1, "B'nin jetonu cihaz devri sonrasi gercekten var")
  esitMi(
    ((bDevirSonrasi ?? [])[0] as { platform: string } | undefined)?.platform,
    'android',
    "B'nin satiri kaydettigi platformu tasiyor"
  )

  console.log('\n--- Bildirimler Task 1: jeton_sil ---')
  // Capraz kullanici silme: A, B'nin jetonunu silmeye calisir. RPC gorunmez
  // sekilde basarili doner (kendi satirin yoksa hata yok, tasarim geregi)
  // ama B'nin satirini SILMEMELI - pozitif kontrolle dogrulaniyor.
  const { error: aCaprazSilHatasi } = await a.rpc('jeton_sil', { p_jeton: paylasilanJeton })
  esitMi(aCaprazSilHatasi, null, "A'nin capraz jeton_sil cagrisi hatasiz doner")

  const { data: bCaprazSonrasi } = await b
    .from('bildirim_jetonlari')
    .select('jeton')
    .eq('jeton', paylasilanJeton)
  esitMi(
    (bCaprazSonrasi ?? []).length,
    1,
    "B'nin satiri A'nin capraz silme denemesinden sonra hala yerinde"
  )

  const { error: bSilHatasi } = await b.rpc('jeton_sil', { p_jeton: paylasilanJeton })
  esitMi(bSilHatasi, null, "B kendi jetonunu siliyor")

  const { data: bSilSonrasi } = await b
    .from('bildirim_jetonlari')
    .select('jeton')
    .eq('jeton', paylasilanJeton)
  esitMi((bSilSonrasi ?? []).length, 0, "B'nin jetonu kendi silme cagrisindan sonra gercekten yok")

  // Cikis akisinda mukerrer cagri olabilir (ag hatasi sonrasi yeniden
  // deneme gibi); satir zaten yoksa da hata donmemeli.
  const { error: bMukerrerSilHatasi } = await b.rpc('jeton_sil', { p_jeton: paylasilanJeton })
  esitMi(bMukerrerSilHatasi, null, 'mukerrer jeton_sil cagrisi zararsiz')

  await bildirimTetikleyicileriniDogrula(a, anon)

  sonucuBildirVeCik()
}

/**
 * Bildirimler Task 2: `bildirim` semasi, Vault sirri okuma fonksiyonu ve
 * bes olay tetikleyicisi.
 *
 * Bunlarin hicbiri normal istemciden gorulemiyor (`bildirim` semasi
 * PostgREST'e acik degil, pg_catalog'a da PostgREST uzerinden
 * erisilemiyor). Bu yuzden kurulum, yalnizca service_role'un
 * cagirabildigi `bildirim_kurulum_ozeti()` penceresinden okunuyor.
 */
async function bildirimTetikleyicileriniDogrula(a: SupabaseClient, anon: SupabaseClient) {
  console.log('\n--- Bildirimler Task 2: sema, sir ve tetikleyiciler ---')

  // Sema PostgREST'e acilmadigi icin sir_oku hicbir istemciden
  // cagrilamamali - yetki katmanindan once bu katman reddetmeli.
  // PGRST106 acikca bekleniyor: "herhangi bir hata" kabul edersek, ag
  // hatasi ya da yanlis yazilmis bir fonksiyon adi da iddiayi gecirir ve
  // sir gercekten acilsa bile test yesil kalir.
  const { error: authSirHatasi } = await a.schema('bildirim').rpc('sir_oku')
  esitMi(
    authSirHatasi?.code,
    'PGRST106',
    'authenticated istemci bildirim.sir_oku cagiramiyor (sema acik degil)'
  )
  const { error: anonSirHatasi } = await anon.schema('bildirim').rpc('sir_oku')
  esitMi(anonSirHatasi?.code, 'PGRST106', 'kimliksiz istemci bildirim.sir_oku cagiramiyor')

  // Task 3: `bildirim.sir_oku()` uzerine public semasindaki sarmalayici.
  // Sarmalayici PostgREST'e ACIK bir semada duruyor (Edge Function siri
  // baska turlu okuyamaz), yani onu koruyan tek sey ACL. Bu iki iddia o
  // ACL'in yerinde oldugunu soyluyor: cagri govdeye hic girmeden yetki
  // katmaninda reddedilmeli (42501).
  const { error: authSarmalayiciHatasi } = await a.rpc('bildirim_siri_oku')
  esitMi(
    authSarmalayiciHatasi?.code,
    '42501',
    'authenticated bildirim_siri_oku cagiramiyor'
  )
  const { error: anonSarmalayiciHatasi } = await anon.rpc('bildirim_siri_oku')
  esitMi(anonSarmalayiciHatasi?.code, '42501', 'kimliksiz bildirim_siri_oku cagiramiyor')

  // Dogrulama penceresinin kendisi de kapali olmali.
  const { error: authOzetHatasi } = await a.rpc('bildirim_kurulum_ozeti')
  esitMi(authOzetHatasi?.code, '42501', 'authenticated bildirim_kurulum_ozeti cagiramiyor')
  const { error: anonOzetHatasi } = await anon.rpc('bildirim_kurulum_ozeti')
  esitMi(anonOzetHatasi?.code, '42501', 'kimliksiz bildirim_kurulum_ozeti cagiramiyor')

  const yonetici = yoneticiIstemcisi()
  if (!yonetici) {
    console.warn(
      '  UYARI: SUPABASE_SERVICE_ROLE_KEY yok; Task 2 kurulum dogrulamalari ATLANDI.\n' +
        '  Sema, sir yetkileri ve tetikleyici kosullari DOGRULANMADI.'
    )
    return
  }

  // Pozitif kontrol: kilit topyekun degil. Sarmalayici service_role'den
  // cagrilabiliyor VE bos olmayan bir sir donuyor - Edge Function'in sir
  // dogrulamasi bu cagriya dayaniyor, sir yoksa fonksiyon her istegi
  // 500 ile reddeder. Sirrin KENDISI degil, yalnizca "bos degil mi"
  // bilgisi iddiaya giriyor: esitMi basarisizlikta gercek degeri basar.
  const { data: sirVerisi, error: sirSarmalayiciHatasi } = await yonetici.rpc('bildirim_siri_oku')
  esitMi(sirSarmalayiciHatasi, null, 'service_role bildirim_siri_oku cagirabiliyor')
  esitMi(
    typeof sirVerisi === 'string' && sirVerisi.length > 0,
    true,
    'bildirim_siri_oku bos olmayan bir sir donduruyor'
  )

  const { data: ozetVerisi, error: ozetHatasi } = await yonetici.rpc('bildirim_kurulum_ozeti')
  esitMi(ozetHatasi, null, 'service_role bildirim_kurulum_ozeti cagirabiliyor')
  if (ozetHatasi) return

  const ozet = ozetVerisi as {
    sema_var: boolean
    sema_usage_anon: boolean
    sema_usage_authenticated: boolean
    sema_usage_service_role: boolean
    sir_oku_anon: boolean
    sir_oku_authenticated: boolean
    sir_oku_service_role: boolean
    olay_gonder_anon: boolean
    olay_gonder_authenticated: boolean
    olay_gonder_aktor_alani: boolean
    olay_gonder_search_path: string | null
    pg_net_kurulu: boolean
    net_usage_anon: boolean
    net_usage_authenticated: boolean
    net_kuyruk_anon: boolean | null
    net_kuyruk_authenticated: boolean | null
    net_yanit_anon: boolean | null
    net_yanit_authenticated: boolean | null
    net_usage_postgres: boolean
    net_kuyruk_postgres_insert: boolean | null
    tetikleyiciler: Record<string, string>
  }

  esitMi(ozet.sema_var, true, 'bildirim semasi var')
  esitMi(ozet.pg_net_kurulu, true, 'pg_net kurulu')

  esitMi(ozet.sema_usage_anon, false, 'anon bildirim semasini kullanamiyor')
  esitMi(ozet.sema_usage_authenticated, false, 'authenticated bildirim semasini kullanamiyor')
  // Pozitif kontrol: yetkiler topyekun kapali degil, service_role acik.
  esitMi(ozet.sema_usage_service_role, true, 'service_role bildirim semasini kullanabiliyor')

  esitMi(ozet.sir_oku_anon, false, 'anon sir_oku CAGIRAMIYOR')
  esitMi(ozet.sir_oku_authenticated, false, 'authenticated sir_oku CAGIRAMIYOR')
  esitMi(ozet.sir_oku_service_role, true, 'service_role sir_oku cagirabiliyor')

  esitMi(ozet.olay_gonder_anon, false, 'anon olay_gonder CAGIRAMIYOR')
  esitMi(ozet.olay_gonder_authenticated, false, 'authenticated olay_gonder CAGIRAMIYOR')

  // aktor_id: T3 "alici == aktor ise gonderme" kuralini buna dayandiriyor;
  // alan payload'dan dusesse butun oz-bildirim korumasi sessizce kalkar.
  esitMi(ozet.olay_gonder_aktor_alani, true, 'olay_gonder payload a aktor_id koyuyor')
  // search_path sertlestirmesi: `public` aramasi kalmamali.
  esitMi(
    (ozet.olay_gonder_search_path ?? '').startsWith('search_path='),
    true,
    'olay_gonder search_path ayarli'
  )
  esitMi(
    (ozet.olay_gonder_search_path ?? '').includes('public'),
    false,
    'olay_gonder search_path public icermiyor'
  )

  // Sir pg_net kuyrugunda (net.http_request_queue.headers) DUZ METIN
  // duruyor. Kurulusta bu tablolar PUBLIC'e ALL veriyor ve sirri gizleyen
  // tek sey PostgREST'in expose listesi oluyordu - tek config dugmesi.
  // Asagidaki bayraklarin hepsi false kalmali.
  esitMi(ozet.net_usage_anon, false, 'anon net semasini kullanamiyor')
  esitMi(ozet.net_usage_authenticated, false, 'authenticated net semasini kullanamiyor')
  esitMi(ozet.net_kuyruk_anon, false, 'anon net.http_request_queue okuyamiyor (sir baslikta)')
  esitMi(
    ozet.net_kuyruk_authenticated,
    false,
    'authenticated net.http_request_queue okuyamiyor (sir baslikta)'
  )
  esitMi(ozet.net_yanit_anon, false, 'anon net._http_response okuyamiyor')
  esitMi(ozet.net_yanit_authenticated, false, 'authenticated net._http_response okuyamiyor')

  // Pozitif kontrol: kilit topyekun degil. olay_gonder'in sahibi postgres
  // ve kuyruga INSERT yetkisi PUBLIC uzerinden geliyordu; duz bir revoke
  // butun bildirim yolunu sessizce kirardi.
  esitMi(ozet.net_usage_postgres, true, 'postgres net semasini hala kullanabiliyor')
  esitMi(
    ozet.net_kuyruk_postgres_insert,
    true,
    'postgres net.http_request_queue tablosuna hala yazabiliyor'
  )

  const tetikleyiciler = ozet.tetikleyiciler ?? {}
  const tanim = (ad: string) => tetikleyiciler[ad] ?? ''

  // pg_get_triggerdef ciktisi tam CREATE TRIGGER metnidir; kosullari
  // metin olarak dogruluyoruz.
  const mesaj = tanim('mesaj_bildirimi')
  esitMi(/AFTER INSERT ON public\.mesajlar/i.test(mesaj), true, 'mesaj_bildirimi: mesajlar AFTER INSERT')
  esitMi(/bildirim\.olay_gonder\(\)/.test(mesaj), true, 'mesaj_bildirimi: bildirim.olay_gonder cagiriyor')
  esitMi(/\bWHEN\b/i.test(mesaj), false, 'mesaj_bildirimi: kosulsuz (her mesaj bildirim uretir)')

  // KRITIK: karsilikli takipte kabul, takipler'e durum='kabul' olan bir
  // AYNA SATIR insert ediyor. WHEN kosulundaki 'beklemede' filtresi o
  // satirin ikinci bir bildirim uretmesini engelleyen tek sey.
  const takipIstegi = tanim('takip_istegi_bildirimi')
  esitMi(
    /AFTER INSERT ON public\.takipler/i.test(takipIstegi),
    true,
    'takip_istegi_bildirimi: takipler AFTER INSERT'
  )
  esitMi(
    /WHEN \(\(?new\.durum = 'beklemede'/i.test(takipIstegi),
    true,
    "takip_istegi_bildirimi: WHEN new.durum = 'beklemede' (ayna satiri disliyor)"
  )
  esitMi(
    /'kabul'/.test(takipIstegi),
    false,
    'takip_istegi_bildirimi: kosulda kabul gecmiyor (ayna satir kapsam disi)'
  )

  const takipKabul = tanim('takip_kabul_bildirimi')
  esitMi(
    /AFTER UPDATE ON public\.takipler/i.test(takipKabul),
    true,
    'takip_kabul_bildirimi: takipler AFTER UPDATE'
  )
  esitMi(
    /old\.durum = 'beklemede'/i.test(takipKabul) && /new\.durum = 'kabul'/i.test(takipKabul),
    true,
    "takip_kabul_bildirimi: WHEN beklemede -> kabul"
  )

  const sohbetIstegi = tanim('sohbet_istegi_bildirimi')
  esitMi(
    /AFTER INSERT ON public\.sohbet_istekleri/i.test(sohbetIstegi),
    true,
    'sohbet_istegi_bildirimi: sohbet_istekleri AFTER INSERT'
  )
  esitMi(
    /WHEN \(\(?new\.durum = 'beklemede'/i.test(sohbetIstegi),
    true,
    "sohbet_istegi_bildirimi: WHEN new.durum = 'beklemede'"
  )

  const sohbetKabul = tanim('sohbet_kabul_bildirimi')
  esitMi(
    /AFTER UPDATE ON public\.sohbet_istekleri/i.test(sohbetKabul),
    true,
    'sohbet_kabul_bildirimi: sohbet_istekleri AFTER UPDATE'
  )
  esitMi(
    /old\.durum = 'beklemede'/i.test(sohbetKabul) && /new\.durum = 'kabul'/i.test(sohbetKabul),
    true,
    'sohbet_kabul_bildirimi: WHEN beklemede -> kabul'
  )

  // Beklenmeyen bir tetikleyici eklenmis mi: bes olay disinda bildirim
  // ureten bir yol olmamali (karar 49). Ozet artik tabloya gore degil
  // FONKSIYONA gore (tgfoid) suzuyor, yani public semasindaki HERHANGI
  // bir tabloya eklenecek altinci bir tetikleyici de bu listeye duser.
  const bildirimTetikleyicileri = Object.keys(tetikleyiciler).sort()
  esitMi(
    bildirimTetikleyicileri,
    [
      'mesaj_bildirimi',
      'sohbet_istegi_bildirimi',
      'sohbet_kabul_bildirimi',
      'takip_istegi_bildirimi',
      'takip_kabul_bildirimi',
    ],
    'tam olarak bes bildirim tetikleyicisi kayitli'
  )
}

main()
