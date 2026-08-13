import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { OturumSaglayici, useOturum } from '../../lib/oturum'

function YonlendirmeKontrolu() {
  const { oturum, profilVarMi, yukleniyor } = useOturum()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (yukleniyor) return
    const authGrubunda = segments[0] === '(auth)'
    const profilOlusturEkraninda = segments[0] === 'profil-olustur'

    if (!oturum && !authGrubunda) {
      router.replace('/giris')
    } else if (oturum && profilVarMi === false && !profilOlusturEkraninda) {
      router.replace('/profil-olustur')
    } else if (oturum && profilVarMi && (authGrubunda || profilOlusturEkraninda)) {
      router.replace('/')
    }
  }, [oturum, profilVarMi, yukleniyor, segments])

  return <Slot />
}

export default function KokLayout() {
  return (
    <OturumSaglayici>
      <YonlendirmeKontrolu />
    </OturumSaglayici>
  )
}
