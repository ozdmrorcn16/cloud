import { ikiKullaniciIleBaglan, esitMi, sonucuBildirVeCik } from './yardimcilar'

const KULLANICI_ADI_DESENI = /^[a-z0-9._]{3,20}$/

async function main() {
  const { a, aId } = await ikiKullaniciIleBaglan()

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
  esitMi(adHatasi !== null, true, 'kullanici_adi dogrudan guncellenemiyor')

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

  sonucuBildirVeCik()
}

main()
