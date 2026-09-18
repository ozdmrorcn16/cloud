import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { Giris } from './ekranlar/Giris'
import { Ozet } from './ekranlar/Ozet'
import { Sikayetler } from './ekranlar/Sikayetler'
import { SikayetDetayi } from './ekranlar/SikayetDetayi'
import { Kullanicilar } from './ekranlar/Kullanicilar'
import { KullaniciDetayi } from './ekranlar/KullaniciDetayi'
import { Konusma } from './ekranlar/Konusma'
import { DenetimIzi } from './ekranlar/DenetimIzi'
import { DuzenlemeTalepleri } from './ekranlar/DuzenlemeTalepleri'
import { Yukleniyor } from './ortak/Durum'
import type { Ozet as OzetTipi } from './tipler'

/** Hareketsizlik siniri: bu kadar sure hicbir tiklama/tus yoksa cikis. */
const HAREKETSIZLIK_MS = 30 * 60 * 1000

export default function App() {
  // null = henuz sorulmadi. Yetki sorusunu SUNUCU cevaplar
  // (moderator_muyum); panel kendi kararini vermez.
  const [yetkili, setYetkili] = useState<boolean | null>(null)
  const [eposta, setEposta] = useState<string>('')

  useEffect(() => {
    let iptal = false

    async function kontrolEt() {
      const { data } = await supabase.rpc('moderator_muyum')
      const { data: oturum } = await supabase.auth.getUser()
      if (!iptal) {
        setYetkili(data === true)
        setEposta(oturum.user?.email ?? '')
      }
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

  const cikis = useCallback(async () => {
    await supabase.auth.signOut()
    setYetkili(false)
  }, [])

  // HAREKETSIZLIKTE CIKIS: moderator oturumu acik bir ekranda birakirsa
  // ozel veriye ulasan bir konsol ortada kalmasin. Kapi yine
  // veritabaninda (AAL2); bu yalnizca ekranin kendini kapatmasi.
  useEffect(() => {
    if (!yetkili) return
    let zamanlayici = setTimeout(cikis, HAREKETSIZLIK_MS)
    const tazele = () => {
      clearTimeout(zamanlayici)
      zamanlayici = setTimeout(cikis, HAREKETSIZLIK_MS)
    }
    const olaylar = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const
    olaylar.forEach((o) => window.addEventListener(o, tazele, { passive: true }))
    return () => {
      clearTimeout(zamanlayici)
      olaylar.forEach((o) => window.removeEventListener(o, tazele))
    }
  }, [yetkili, cikis])

  if (yetkili === null) {
    return (
      <div className="giris-sayfa">
        <div className="giris"><Yukleniyor satir={3} /></div>
      </div>
    )
  }

  if (!yetkili) {
    return <Giris onGirildi={() => setYetkili(true)} />
  }

  return (
    <BrowserRouter>
      <Kabuk eposta={eposta} onCikis={cikis}>
        <Routes>
          <Route path="/" element={<Navigate to="/ozet" replace />} />
          <Route path="/ozet" element={<Ozet />} />
          <Route path="/sikayetler" element={<Sikayetler />} />
          <Route path="/sikayetler/:id" element={<SikayetDetayi />} />
          <Route path="/kullanicilar" element={<Kullanicilar />} />
          <Route path="/kullanicilar/:id" element={<KullaniciDetayi />} />
          <Route path="/konusma/:id" element={<Konusma />} />
          <Route path="/talepler" element={<DuzenlemeTalepleri />} />
          <Route path="/iz" element={<DenetimIzi />} />
          <Route path="*" element={<Navigate to="/ozet" replace />} />
        </Routes>
      </Kabuk>
    </BrowserRouter>
  )
}

/**
 * KABUK: sol kenar cubugu (dar ekranda ust sekmeler), sayfa icerigi.
 * Rozetler `moderasyon_ozet`ten; her rota degisiminde tazelenir ki bir
 * karar verilince sayi hemen dussun.
 */
function Kabuk({ eposta, onCikis, children }: { eposta: string; onCikis: () => void; children: React.ReactNode }) {
  const [ozet, setOzet] = useState<OzetTipi | null>(null)
  const konum = useLocation()

  useEffect(() => {
    let iptal = false
    supabase.rpc('moderasyon_ozet').then(({ data }) => {
      const satir = (data as OzetTipi[] | null)?.[0]
      if (!iptal && satir) setOzet(satir)
    })
    return () => {
      iptal = true
    }
  }, [konum.pathname])

  const sinif = ({ isActive }: { isActive: boolean }) => (isActive ? 'aktif' : undefined)

  return (
    <div className="kabuk">
      <aside className="kenar">
        <div className="marka">
          <span className="marka-isaret" aria-hidden>S</span> Moderasyon
        </div>
        <nav aria-label="Ana menü">
          <NavLink to="/ozet" className={sinif}>Özet</NavLink>
          <NavLink to="/sikayetler" className={sinif}>
            Şikayetler
            {ozet && ozet.bekleyen_sikayet > 0 && <span className="sayi-rozeti">{ozet.bekleyen_sikayet}</span>}
          </NavLink>
          <NavLink to="/kullanicilar" className={sinif}>Kullanıcılar</NavLink>
          <NavLink to="/talepler" className={sinif}>
            Düzenleme talepleri
            {ozet && ozet.bekleyen_talep > 0 && <span className="sayi-rozeti">{ozet.bekleyen_talep}</span>}
          </NavLink>
          <NavLink to="/iz" className={sinif}>Denetim izi</NavLink>
        </nav>
        <div className="moderator">
          <b title={eposta}>{eposta || 'Moderatör'}</b>
          <span className="aal">TOTP doğrulandı · AAL2</span>
          <button type="button" className="kucuk hayalet" onClick={onCikis} style={{ justifySelf: 'start' }}>
            Çıkış yap
          </button>
        </div>
      </aside>
      <main className="icerik">{children}</main>
    </div>
  )
}
