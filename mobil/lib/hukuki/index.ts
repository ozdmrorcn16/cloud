import type { Dil } from '../dil'
import type { HukukiMetin, HukukiBolum } from './tur'
import tr from './tr'
import en from './en'
import de from './de'
import es from './es'
import fr from './fr'
import ru from './ru'
import ar from './ar'

export type { HukukiBolum, HukukiMetin } from './tur'

/**
 * HUKUKI METINLER - gizlilik metni ve kullanim kosullari, yedi dilde.
 *
 * i18n turunun E asamasi (2026-09-13, kullanicinin karari "uygulama
 * herseyi tam bitsin"). Ekran metinleri sozlukten geliyor ama iki
 * hukuki belge uzun, bolumlu ve Turkce kaynak metinle birebir uyumlu
 * kalmasi gereken icerik; sozluge yaprak anahtar olarak sikistirmak
 * yerine ayri dosyalarda tutuluyor.
 *
 * TURKCE METIN ESASTIR: ceviriler bilgilendirme amacli. Ekran, Turkce
 * disindaki her dilde belgenin basina bunu soyleyen bir not koyuyor
 * (`hukuki.ustunlukNotu` anahtari) - ceviri ile kaynak arasinda bir
 * fark cikarsa hangi metnin baglayici oldugu belirsiz kalmasin.
 *
 * Kaynak dosyalar: `docs/gizlilik-metni.md` ve
 * `site/src/pages/[...dil]/kosullar.astro`. Turkce dizi degisirse alti
 * ceviri de AYNI TURDA guncellenmeli; `lib/hukuki/hukuki.test.ts`
 * yapisal esitligi (bolum sayisi, paragraf sayisi) kilitliyor.
 */
const METINLER: Record<Dil, HukukiMetin> = { tr, en, de, es, fr, ru, ar }

export function hukukiMetin(dil: Dil): HukukiMetin {
  return METINLER[dil] ?? tr
}

export function gizlilikBolumleri(dil: Dil): HukukiBolum[] {
  return hukukiMetin(dil).gizlilik
}

export function kosulBolumleri(dil: Dil): HukukiBolum[] {
  return hukukiMetin(dil).kosullar
}

/** Testler ve denetim icin: butun diller. */
export const HUKUKI_METINLER = METINLER
