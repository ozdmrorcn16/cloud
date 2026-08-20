import { ikiKullaniciIleBaglan, anonIstemciOlustur, esitMi, sonucuBildirVeCik } from './yardimcilar'

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

  sonucuBildirVeCik()
}

main()
