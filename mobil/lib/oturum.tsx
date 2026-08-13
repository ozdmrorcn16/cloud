import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type OturumDurumu = {
  oturum: Session | null
  profilVarMi: boolean | null
  yukleniyor: boolean
}

const OturumBaglami = createContext<OturumDurumu>({
  oturum: null,
  profilVarMi: null,
  yukleniyor: true,
})

async function profilVarMiKontrolEt(kullaniciId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiller')
    .select('id')
    .eq('id', kullaniciId)
    .maybeSingle()
  return data !== null
}

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const [oturum, setOturum] = useState<Session | null>(null)
  const [profilVarMi, setProfilVarMi] = useState<boolean | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function baslangicOturumunuYukle() {
      const { data } = await supabase.auth.getSession()
      setOturum(data.session)
      if (data.session) {
        setProfilVarMi(await profilVarMiKontrolEt(data.session.user.id))
      }
      setYukleniyor(false)
    }
    baslangicOturumunuYukle()

    const { data: dinleyici } = supabase.auth.onAuthStateChange(async (_olay, yeniOturum) => {
      setOturum(yeniOturum)
      if (yeniOturum) {
        setProfilVarMi(await profilVarMiKontrolEt(yeniOturum.user.id))
      } else {
        setProfilVarMi(null)
      }
    })

    return () => dinleyici.subscription.unsubscribe()
  }, [])

  return (
    <OturumBaglami.Provider value={{ oturum, profilVarMi, yukleniyor }}>
      {children}
    </OturumBaglami.Provider>
  )
}

export function useOturum() {
  return useContext(OturumBaglami)
}
