import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { hesapDurumunuGetir, hesabiGeriAc, type HesapDurumu } from './hesap'

type OturumDurumu = {
  oturum: Session | null
  profilVarMi: boolean | null
  hesapDurumu: HesapDurumu | null
  yukleniyor: boolean
  profilKontrolunuYenile: () => Promise<void>
  hesapDurumunuYenile: () => Promise<void>
}

const OturumBaglami = createContext<OturumDurumu>({
  oturum: null,
  profilVarMi: null,
  hesapDurumu: null,
  yukleniyor: true,
  profilKontrolunuYenile: async () => {},
  hesapDurumunuYenile: async () => {},
})

async function profilVarMiKontrolEt(kullaniciId: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('profiller')
    .select('id')
    .eq('id', kullaniciId)
    .maybeSingle()
  if (error) return null
  return data !== null
}

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const [oturum, setOturum] = useState<Session | null>(null)
  const [profilVarMi, setProfilVarMi] = useState<boolean | null>(null)
  const [hesapDurumu, setHesapDurumu] = useState<HesapDurumu | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  // Sira onemli: ONCE geri acma denenir, SONRA durum okunur. Tersi
  // olsaydi dondurulmus kullanici bir kez "hesabin dondurulmus"
  // ekranini gorurdu. hesabiGeriAc yalnizca 'dondurulmus' satirini
  // siler; askiya alinmis bir hesap bu cagridan etkilenmez (Task 9,
  // senaryo 54).
  async function hesapDurumunuCoz(): Promise<HesapDurumu | null> {
    await hesabiGeriAc()
    try {
      return await hesapDurumunuGetir()
    } catch {
      // Durum okunamazsa uygulamayi kilitlemiyoruz: veritabani
      // kapilari zaten baglayici, bu ekran yalnizca aciklama.
      return null
    }
  }

  useEffect(() => {
    async function baslangicOturumunuYukle() {
      const { data } = await supabase.auth.getSession()
      setOturum(data.session)
      if (data.session) {
        setProfilVarMi(await profilVarMiKontrolEt(data.session.user.id))
        setHesapDurumu(await hesapDurumunuCoz())
      }
      setYukleniyor(false)
    }
    baslangicOturumunuYukle()

    const { data: dinleyici } = supabase.auth.onAuthStateChange(async (_olay, yeniOturum) => {
      setOturum(yeniOturum)
      if (yeniOturum) {
        setProfilVarMi(await profilVarMiKontrolEt(yeniOturum.user.id))
        setHesapDurumu(await hesapDurumunuCoz())
      } else {
        setProfilVarMi(null)
        setHesapDurumu(null)
      }
    })

    return () => dinleyici.subscription.unsubscribe()
  }, [])

  async function profilKontrolunuYenile() {
    if (oturum) {
      setProfilVarMi(await profilVarMiKontrolEt(oturum.user.id))
    }
  }

  async function hesapDurumunuYenile() {
    if (oturum) {
      setHesapDurumu(await hesapDurumunuCoz())
    }
  }

  return (
    <OturumBaglami.Provider
      value={{
        oturum,
        profilVarMi,
        hesapDurumu,
        yukleniyor,
        profilKontrolunuYenile,
        hesapDurumunuYenile,
      }}
    >
      {children}
    </OturumBaglami.Provider>
  )
}

export function useOturum() {
  return useContext(OturumBaglami)
}
