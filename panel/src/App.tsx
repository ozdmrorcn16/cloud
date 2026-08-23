import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './supabase'
import { Giris } from './ekranlar/Giris'
import { Sikayetler } from './ekranlar/Sikayetler'
import { SikayetDetayi } from './ekranlar/SikayetDetayi'
import { Kullanicilar } from './ekranlar/Kullanicilar'
import { KullaniciDetayi } from './ekranlar/KullaniciDetayi'
import { Konusma } from './ekranlar/Konusma'
import { DenetimIzi } from './ekranlar/DenetimIzi'
import { Yukleniyor } from './ortak/Durum'

export default function App() {
  // null = henuz sorulmadi. Yetki sorusunu SUNUCU cevaplar
  // (moderator_muyum); panel kendi kararini vermez.
  const [yetkili, setYetkili] = useState<boolean | null>(null)

  useEffect(() => {
    let iptal = false

    async function kontrolEt() {
      const { data } = await supabase.rpc('moderator_muyum')
      if (!iptal) setYetkili(data === true)
    }

    const { data: abone } = supabase.auth.onAuthStateChange(() => {
      kontrolEt()
    })
    kontrolEt()

    return () => {
      iptal = true
      abone.subscription.unsubscribe()
    }
  }, [])

  if (yetkili === null) return <Yukleniyor ne="Oturum" />

  if (!yetkili) {
    return <Giris onGirildi={() => setYetkili(true)} />
  }

  return (
    <BrowserRouter>
      <header>
        <strong>Slooin moderasyon</strong>
        <nav>
          <Link to="/sikayetler">Şikayetler</Link>
          <Link to="/kullanicilar">Kullanıcılar</Link>
          <Link to="/iz">Denetim izi</Link>
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            setYetkili(false)
          }}
        >
          Çıkış yap
        </button>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/sikayetler" replace />} />
          <Route path="/sikayetler" element={<Sikayetler />} />
          <Route path="/sikayetler/:id" element={<SikayetDetayi />} />
          <Route path="/kullanicilar" element={<Kullanicilar />} />
          <Route path="/kullanicilar/:id" element={<KullaniciDetayi />} />
          <Route path="/konusma/:id" element={<Konusma />} />
          <Route path="/iz" element={<DenetimIzi />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
