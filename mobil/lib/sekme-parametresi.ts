import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

/**
 * SECILI SEKMEYI ROTA PARAMETRESINDE TUTAN KANCA.
 *
 * Kok duzen `Slot` kullaniyor: baska bir sayfaya gidince ekran
 * KALDIRILIYOR, geri donunce sifirdan kuruluyor ve `useState`
 * varsayilana donuyor. Kullanicinin bildirdigi hata (2026-09-18):
 * profilde "En sık" acikken bir mekana gidip geri gelince sekme
 * "Anılar"a atiyordu.
 *
 * Cozum: secim `router.setParams` ile rotanin kendi parametresine
 * yaziliyor (`/profil?sekme=yerler`). Geri donus AYNI rota kaydina
 * geldigi icin parametre de geliyor; alt cubuktan "Profil"e basmak ise
 * parametresiz yeni bir rota actigi icin varsayilan sekmede aciliyor -
 * iki davranis da beklenen bu. Modul duzeyinde bir degisken de
 * calisirdi ama o, alt cubuktan gelen taze acilisi da son sekmeye
 * kilitlerdi.
 *
 * Parametre BILINEN SEKMELERE suzuluyor: eski bir baglantidan ya da
 * elle yazilmis URL'den gelen deger ekrani bos bir sekmede birakmasin.
 */
export function useSekmeParametresi<S extends string>(sekmeler: readonly S[], varsayilan: S) {
  const router = useRouter()
  const { sekme: parametre } = useLocalSearchParams<{ sekme?: string }>()
  const gecerli = (deger: unknown): deger is S => sekmeler.includes(deger as S)
  const [sekme, sekmeyiYaz] = useState<S>(gecerli(parametre) ? parametre : varsayilan)

  function setSekme(yeni: S) {
    sekmeyiYaz(yeni)
    router.setParams({ sekme: yeni })
  }

  return [sekme, setSekme] as const
}
