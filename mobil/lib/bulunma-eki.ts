/**
 * TURKCE BULUNMA EKI ("Özdemir Kafe'de", "Park'ta", "Kültür Merkezi'nde").
 *
 * Akis karti basligi (kullanicinin referansi 2026-09-20): "<ad>, <mekan>'de
 * check-in yapti." Ek kesme isaretiyle, unlu uyumu ve sert unsuz
 * benzesmesiyle uretiliyor.
 *
 * 2026-09-13'te ek BILEREK yoktu: "Muayene İstasyonu'da" hatasi (dogrusu
 * "İstasyonu'nda") - iyelik ekli tamlamada kaynastirma n gerekir ve
 * "Dayı'da" ile "Merkezi'nde" sozluk olmadan ayirt edilemez. Referans
 * eki acikca istedigi icin SEZGISEL kural: son harf unlu VE ad birden
 * fazla kelime VE son unlu dar (ı i u ü) ise iyelik sayilir -> 'nda/'nde
 * ("Kültür Merkezi'nde", "Muayene İstasyonu'nda"); tek kelimede ya da
 * genis unluyle biterse dogrudan 'da/'de ("Kafe'de", "Dayı'da",
 * "Karpa Pide'de"). Yanilabilecegi yer: tek kelimelik iyelikler
 * ("Merkezi") - nadir, ad genelde tamlama.
 */
const ONLU_KALIN = new Set(['a', 'ı', 'o', 'u'])
const ONLU_INCE = new Set(['e', 'i', 'ö', 'ü'])
const DAR = new Set(['ı', 'i', 'u', 'ü'])
const SERT_UNSUZ = new Set(['f', 's', 't', 'k', 'ç', 'ş', 'h', 'p'])

function kucult(h: string): string {
  return h === 'I' ? 'ı' : h === 'İ' ? 'i' : h.toLocaleLowerCase('tr')
}

/** Sayiyla biten adlar: son bir-iki rakamin okunusuna gore ("34'te", "40'ta"). */
const RAKAM_EKI: Record<string, string> = {
  '0': "'da", '1': "'de", '2': "'de", '3': "'te", '4': "'te", '5': "'te", '6': "'da", '7': "'de", '8': "'de", '9': "'da",
  '10': "'da", '20': "'de", '30': "'da", '40': "'ta", '50': "'de", '60': "'ta", '70': "'te", '80': "'de", '90': "'da",
  '00': "'de",
}

export function bulunmaEki(ad: string): string {
  const temiz = ad.trim().replace(/[^\p{L}\p{N}]+$/u, '')
  if (!temiz) return "'de"
  if (/\d$/.test(temiz)) {
    const iki = temiz.slice(-2)
    if (/^\d0$/.test(iki) && RAKAM_EKI[iki]) return RAKAM_EKI[iki]
    return RAKAM_EKI[temiz.slice(-1)]
  }
  // KISALTMA (tamami buyuk, 2-4 harf: "AVM", "MVT", "TSE"): harf adiyla
  // okunur - unsuz adlari e ile biter ('de), unlu kendi sesiyle.
  if (/^[A-ZÇĞİÖŞÜ]{2,4}$/.test(temiz)) {
    const son = kucult(temiz.slice(-1))
    return ONLU_KALIN.has(son) ? "'da" : "'de"
  }
  const harfler = [...temiz].map(kucult)
  let sonUnlu: string | null = null
  for (let i = harfler.length - 1; i >= 0; i--) {
    if (ONLU_KALIN.has(harfler[i]) || ONLU_INCE.has(harfler[i])) {
      sonUnlu = harfler[i]
      break
    }
  }
  // Hic unlu yok = kisaltma ("AVM", "MVT"): harf adlari e ile biter -> 'de.
  if (!sonUnlu) return "'de"
  const unlu = ONLU_KALIN.has(sonUnlu) ? 'a' : 'e'
  const son = harfler[harfler.length - 1]
  if (ONLU_KALIN.has(son) || ONLU_INCE.has(son)) {
    const cokKelime = /\s/.test(temiz)
    return cokKelime && DAR.has(son) ? `'n${unlu === 'a' ? 'da' : 'de'}` : `'${unlu === 'a' ? 'da' : 'de'}`
  }
  if (SERT_UNSUZ.has(son)) return `'t${unlu}`
  return `'d${unlu}`
}
