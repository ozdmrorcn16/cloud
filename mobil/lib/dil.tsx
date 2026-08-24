import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'
import tr from './ceviriler/tr'
import en from './ceviriler/en'

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

export const DESTEKLENEN_DILLER = ['tr', 'en'] as const
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
}

const i18n = new I18n({ tr, en })
// Eksik anahtar ham anahtari ("kayit.baslik") basmak yerine kaynak
// dile duser: yarim cevrilmis bir ekran, kod gorunen bir ekrandan iyi.
i18n.enableFallback = true
i18n.defaultLocale = 'tr'

function cihazDili(): Dil {
  const kod = getLocales()[0]?.languageCode
  return kod === 'tr' ? 'tr' : kod ? 'en' : 'tr'
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
        setDil(secilen)
      })
      // Saklama okunamazsa cihaz diline dusuyoruz; dil yuzunden
      // uygulamanin acilmamasi kabul edilemez.
      .catch(() => {
        if (!gecerli) return
        i18n.locale = cihazDili()
        setDil(cihazDili())
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
