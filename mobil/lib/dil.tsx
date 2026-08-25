import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'
import { I18nManager, Platform } from 'react-native'
import tr from './ceviriler/tr'
import en from './ceviriler/en'
import de from './ceviriler/de'
import es from './ceviriler/es'
import fr from './ceviriler/fr'
import ru from './ceviriler/ru'
import ar from './ceviriler/ar'

/**
 * Uygulama dili.
 *
 * Dil sirasi:
 *  1. Kullanicinin daha once sectigi dil (cihazda saklaniyor)
 *  2. Cihazin dili - Turkce degilse Ingilizce
 *  3. Turkce (varsayilan)
 *
 * Tercih CIHAZDA saklaniyor cunku dil, oturum acilmadan once de
 * gerekli: karsilama ve giris ekranlari da cevrilmis olmali. Oturum
 * acildiginda profildeki tercih varsa o gecerli olur.
 */

/**
 * Desteklenen diller.
 *
 * Kullanicinin karari (2026-08-25): dil kullaniciya SORULMUYOR, cihazin
 * dilinden aliniyor. Bunun dogal sonucu su: cihaz dili desteklenmiyorsa
 * kullanici yanlis dilde bir uygulama goruyor. Bu yuzden liste dunyada
 * en cok kullanilan dilleri kapsayacak sekilde genisletildi.
 *
 * Almanca ve Arapca ozellikle onemli: Almanya'da buyuk bir Turkiye
 * kokenli nufus var ve Arapca hem Turkiye'de hem bolgede yaygin.
 */
export const DESTEKLENEN_DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar'] as const
export type Dil = (typeof DESTEKLENEN_DILLER)[number]

const SAKLAMA_ANAHTARI = 'slooin.dil'

/**
 * Dillerin ekranda gorunen adlari. CEVRILMEZ: her dil kendi adiyla
 * yazilir. Ingilizce arayuzde "Turkish" yazmak yerine "Türkçe" yazmak
 * dogrudur - o secenegi arayan kisi zaten Turkce biliyor.
 */
export const DIL_ADI: Record<Dil, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
}

/** Sagdan sola yazilan diller. */
const SAGDAN_SOLA: readonly Dil[] = ['ar']

export function sagdanSolaMi(d: Dil): boolean {
  return SAGDAN_SOLA.includes(d)
}

/**
 * Yazi yonunu uygular.
 *
 * Web'de `dir` niteligi aninda etkili oluyor. Native'de `I18nManager`
 * yon degisikligi ancak uygulama yeniden baslatildiginda tam olarak
 * uygulaniyor; burada yalnizca izin veriliyor ve yon isaretleniyor,
 * zorla yeniden baslatma YAPILMIYOR - kullanicinin oturumunu kirmak
 * dilin aninda donmesinden daha kotu.
 */
function yonuUygula(d: Dil) {
  const sagdan = sagdanSolaMi(d)
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = sagdan ? 'rtl' : 'ltr'
      document.documentElement.lang = d
    }
    return
  }
  I18nManager.allowRTL(sagdan)
}

const i18n = new I18n({ tr, en, de, es, fr, ru, ar })
// Eksik anahtar ham anahtari ("kayit.baslik") basmak yerine yedek
// dile duser: yarim cevrilmis bir ekran, kod gorunen bir ekrandan iyi.
// Yedek dil INGILIZCE - kaynak dil Turkce olsa da: eksik bir ceviride
// Alman ya da Rus kullaniciya Turkce metin gostermek, Ingilizce
// gostermekten kotu.
i18n.enableFallback = true
i18n.defaultLocale = 'en'

/**
 * Cihazin dilini desteklenen bir dile esler.
 *
 * Cihaz "de-AT" ya da "pt-BR" gibi bolgeli bir kod verebiliyor;
 * yalnizca dil kismina bakiliyor. Desteklenmeyen bir dil gelirse
 * INGILIZCE'ye dusuluyor - Turkce'ye degil: uygulamayi Turkce
 * bilmeyen birine Turkce acmak, Ingilizce acmaktan kotu.
 */
function cihazDili(): Dil {
  for (const yerel of getLocales()) {
    const kod = yerel.languageCode?.toLowerCase()
    if (kod && (DESTEKLENEN_DILLER as readonly string[]).includes(kod)) {
      return kod as Dil
    }
  }
  return 'en'
}

type DilBaglami = {
  dil: Dil
  /** Metin anahtarini cevirir. `t('kayit.baslik')` */
  t: (anahtar: string, secenekler?: Record<string, unknown>) => string
  dilDegistir: (yeni: Dil) => Promise<void>
  hazir: boolean
}

const Baglam = createContext<DilBaglami | null>(null)

export function DilSaglayici({ children }: { children: React.ReactNode }) {
  const [dil, setDil] = useState<Dil>('tr')
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    let gecerli = true
    AsyncStorage.getItem(SAKLAMA_ANAHTARI)
      .then((kayitli) => {
        if (!gecerli) return
        const secilen =
          kayitli && (DESTEKLENEN_DILLER as readonly string[]).includes(kayitli)
            ? (kayitli as Dil)
            : cihazDili()
        i18n.locale = secilen
        yonuUygula(secilen)
        setDil(secilen)
      })
      // Saklama okunamazsa cihaz diline dusuyoruz; dil yuzunden
      // uygulamanin acilmamasi kabul edilemez.
      .catch(() => {
        if (!gecerli) return
        const yedek = cihazDili()
        i18n.locale = yedek
        yonuUygula(yedek)
        setDil(yedek)
      })
      .finally(() => {
        if (gecerli) setHazir(true)
      })
    return () => {
      gecerli = false
    }
  }, [])

  const deger = useMemo<DilBaglami>(
    () => ({
      dil,
      hazir,
      t: (anahtar, secenekler) => i18n.t(anahtar, secenekler),
      dilDegistir: async (yeni) => {
        i18n.locale = yeni
        yonuUygula(yeni)
        setDil(yeni)
        // Yazma basarisiz olsa bile dil bu oturumda degismis olur;
        // kullanicinin sectigi dil hemen uygulanmali.
        await AsyncStorage.setItem(SAKLAMA_ANAHTARI, yeni).catch(() => {})
      },
    }),
    [dil, hazir]
  )

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>
}

export function useDil(): DilBaglami {
  const deger = useContext(Baglam)
  if (!deger) throw new Error('useDil, DilSaglayici icinde kullanilmali')
  return deger
}

/** Saglayici disindan (ornegin bir lib fonksiyonundan) ceviri gerekirse. */
export function cevir(anahtar: string, secenekler?: Record<string, unknown>): string {
  return i18n.t(anahtar, secenekler)
}
