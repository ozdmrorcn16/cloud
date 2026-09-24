/**
 * ETIKETLENENLER CUMLENIN DEVAMINDA (kullanicinin karari 2026-09-24):
 * "<ad>, <mekan>'de check-in yapti." cumlesinin SON SATIRININ bittigi
 * yerden, biraz boslukla, etiketlenenlerin profil resimleri (kullanici
 * adi YOK, 1 kiside de) ve "ile birlikte". Resimler ust uste biner;
 * satir dolunca ALT SATIRDAN devam eder (sikistirma yok). Yazi hic
 * tek basina alt satira dusmez - bagli oldugu resimle birlikte iner.
 * Ornek: `tasarim/etiket-satir-ici/ornekler-son.png`.
 *
 * React Native satir ici gorunumlerde ust uste bindirmeyi guvenilir
 * cizmiyor; bu yuzden baslik `onTextLayout` ile olculuyor ve konumlar
 * burada, saf olarak hesaplaniyor (iOS ve Android ayni sonuc).
 *
 * Dil sirasi sablondan: Turkce "<resimler> ile birlikte" (son ek),
 * Ingilizce "with <resimler>" (on ek). On ek ilk resimle, son ek son
 * resimle BOLUNMEZ birim.
 */

export type MetinSatiri = { x: number; y: number; width: number; height: number }
export type Nokta = { x: number; y: number }

export type EtiketYerlesimi = {
  onEk: Nokta | null
  resimler: Nokta[]
  sonEk: Nokta | null
  /** Baslik + etiketlerin kapladigi toplam yukseklik. */
  boy: number
}

export const ETIKET_RESIM_CAPI = 24
/** Ust uste binen resimler arasi adim (cap - binme payi). */
export const ETIKET_ADIMI = 15
const CUMLE_BOSLUGU = 8
const YAZI_ARASI = 6
const SATIR_ARASI = 4

export function etiketYerlesimi({
  satirlar,
  kapEn,
  adet,
  onEkEn,
  sonEkEn,
}: {
  satirlar: MetinSatiri[]
  kapEn: number
  adet: number
  /** 0 ise on ek yok. */
  onEkEn: number
  /** 0 ise son ek yok. */
  sonEkEn: number
}): EtiketYerlesimi {
  const cap = ETIKET_RESIM_CAPI
  const son = satirlar[satirlar.length - 1] ?? { x: 0, y: 0, width: 0, height: cap }
  const metinAlti = son.y + son.height
  let x = son.x + son.width + CUMLE_BOSLUGU
  let y = son.y + Math.max(0, (son.height - cap) / 2)
  let satirBasi = false
  const yeniSatir = () => {
    y = Math.max(metinAlti, y + cap) + SATIR_ARASI
    x = 0
    satirBasi = true
  }
  const sigar = (gerekli: number) => satirBasi || x + gerekli <= kapEn

  let onEk: Nokta | null = null
  if (onEkEn > 0 && adet > 0) {
    if (!sigar(onEkEn + YAZI_ARASI + cap)) yeniSatir()
    onEk = { x, y }
    x += onEkEn + YAZI_ARASI
    satirBasi = false
  }

  const resimler: Nokta[] = []
  for (let i = 0; i < adet; i++) {
    const sonMu = i === adet - 1
    const gerekli = cap + (sonMu && sonEkEn > 0 ? YAZI_ARASI + sonEkEn : 0)
    // On ekten hemen sonraki ilk resim on ekle ayni satirda kalir.
    if (!(i === 0 && onEk) && !sigar(gerekli)) yeniSatir()
    resimler.push({ x, y })
    satirBasi = false
    x += sonMu ? cap : ETIKET_ADIMI
  }

  let sonEk: Nokta | null = null
  if (sonEkEn > 0 && adet > 0) {
    sonEk = { x: x + YAZI_ARASI, y }
  }

  return { onEk, resimler, sonEk, boy: Math.max(metinAlti, adet > 0 ? y + cap : 0) }
}

/** "{{adlar}}" sablonunu resimlerin oncesi ve sonrasi olarak boler. */
export function birlikteParcalari(sablon: string): { onEk: string; sonEk: string } {
  const [once = '', sonra = ''] = sablon.split('{{adlar}}')
  return { onEk: once.trim(), sonEk: sonra.trim() }
}
