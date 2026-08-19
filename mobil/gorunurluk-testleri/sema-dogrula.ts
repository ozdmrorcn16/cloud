import { ikiKullaniciIleBaglan, esitMi, sonucuBildirVeCik } from './yardimcilar'

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

  sonucuBildirVeCik()
}

main()
