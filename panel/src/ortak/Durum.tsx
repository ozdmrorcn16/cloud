import type { ReactNode } from 'react'
import type { HedefTuru, SikayetDurumu } from '../tipler'

/* ---------- Durum metinleri ---------- */

export function Yukleniyor({ satir = 4 }: { satir?: number }) {
  return (
    <div className="iskelet" role="status" aria-label="Yükleniyor">
      {Array.from({ length: satir }).map((_, i) => (
        <span key={i} style={{ width: `${88 - (i % 3) * 14}%` }} />
      ))}
    </div>
  )
}

export function Hata({ mesaj, onTekrar }: { mesaj: string | null; onTekrar?: () => void }) {
  if (!mesaj) return null
  return (
    <p className="durum hata" role="alert">
      <span>{mesaj}</span>
      {onTekrar && (
        <button type="button" className="kucuk" onClick={onTekrar}>
          Yeniden dene
        </button>
      )}
    </p>
  )
}

export function Bilgi({ mesaj }: { mesaj: string | null }) {
  if (!mesaj) return null
  return <p className="durum bilgi">{mesaj}</p>
}

export function BosDurum({ baslik, children }: { baslik: string; children?: ReactNode }) {
  return (
    <div className="bos">
      <b>{baslik}</b>
      {children && <span className="k">{children}</span>}
    </div>
  )
}

/** Hata mesajini kullaniciya gosterilebilir bir metne cevirir. */
export function hataMetni(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message)
  }
  return 'Bir sorun oluştu'
}

/* ---------- Zaman ---------- */

/** Sunucudan gelen zaman damgasini okunur hale getirir (tam). */
export function zaman(deger: string | null): string {
  if (!deger) return '—'
  return new Date(deger).toLocaleString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** "3 saat önce" gibi gorece; listelerde tam tarih `title` ile verilir. */
export function goreceZaman(deger: string | null): string {
  if (!deger) return '—'
  const fark = Date.now() - new Date(deger).getTime()
  const dk = Math.round(fark / 60000)
  if (dk < 1) return 'az önce'
  if (dk < 60) return `${dk} dk önce`
  const saat = Math.round(dk / 60)
  if (saat < 24) return `${saat} saat önce`
  const gun = Math.round(saat / 24)
  if (gun < 30) return `${gun} gün önce`
  return new Date(deger).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export function Zaman({ deger }: { deger: string | null }) {
  return (
    <span className="zaman-hucre" title={zaman(deger)}>
      {goreceZaman(deger)}
    </span>
  )
}

/* ---------- Rozetler ---------- */

const SIKAYET_DURUMU: Record<SikayetDurumu, { etiket: string; renk: string }> = {
  yeni: { etiket: 'Yeni', renk: 'turuncu' },
  incelendi: { etiket: 'İncelendi', renk: 'sari' },
  islem_yapildi: { etiket: 'İşlem yapıldı', renk: 'yesil' },
  reddedildi: { etiket: 'Reddedildi', renk: 'gri' },
}

export function SikayetRozeti({ durum }: { durum: SikayetDurumu | string }) {
  const d = SIKAYET_DURUMU[durum as SikayetDurumu] ?? { etiket: durum, renk: 'gri' }
  return <span className={`rozet ${d.renk}`}>{d.etiket}</span>
}

const HESAP_DURUMU: Record<string, { etiket: string; renk: string }> = {
  askida: { etiket: 'Askıda', renk: 'sari' },
  yasakli: { etiket: 'Yasaklı', renk: 'kirmizi' },
  dondurulmus: { etiket: 'Dondurulmuş', renk: 'mavi' },
}

export function HesapRozeti({ durum }: { durum: string | null }) {
  if (!durum) return <span className="rozet yesil">Aktif</span>
  const d = HESAP_DURUMU[durum] ?? { etiket: durum, renk: 'gri' }
  return <span className={`rozet ${d.renk}`}>{d.etiket}</span>
}

const TALEP_DURUMU: Record<string, { etiket: string; renk: string }> = {
  beklemede: { etiket: 'Bekliyor', renk: 'turuncu' },
  onaylandi: { etiket: 'Onaylandı', renk: 'yesil' },
  reddedildi: { etiket: 'Reddedildi', renk: 'gri' },
}

export function TalepRozeti({ durum }: { durum: string }) {
  const d = TALEP_DURUMU[durum] ?? { etiket: durum, renk: 'gri' }
  return <span className={`rozet ${d.renk}`}>{d.etiket}</span>
}

const HEDEF: Record<HedefTuru, { etiket: string; ikon: string }> = {
  kullanici: { etiket: 'Kullanıcı', ikon: '👤' },
  check_in: { etiket: 'Check-in', ikon: '📍' },
  mesaj: { etiket: 'Mesaj', ikon: '💬' },
  yorum: { etiket: 'Yorum', ikon: '💭' },
  hikaye: { etiket: 'Hikâye', ikon: '🕘' },
}

export function hedefEtiketi(tur: string): string {
  return HEDEF[tur as HedefTuru]?.etiket ?? tur
}

export function HedefEtiketi({ tur, ad }: { tur: HedefTuru | string; ad?: string | null }) {
  const h = HEDEF[tur as HedefTuru] ?? { etiket: tur, ikon: '•' }
  return (
    <span className="hedef">
      <span className="hedef-ikon" aria-hidden>{h.ikon}</span>
      <span>
        <span className="hedef-ad">{ad ?? h.etiket}</span>
        {ad && <span className="hedef-tur"> · {h.etiket}</span>}
      </span>
    </span>
  )
}

/** Sikayet sebebi kodlari kullanicinin uygulamada sectigi metinler. */
const SEBEP: Record<string, string> = {
  taciz: 'Taciz',
  spam: 'Spam',
  uygunsuz_icerik: 'Uygunsuz içerik',
  sahte_hesap: 'Sahte hesap',
  nefret_soylemi: 'Nefret söylemi',
  siddet: 'Şiddet',
  diger: 'Diğer',
}

export function sebepMetni(sebep: string): string {
  return SEBEP[sebep] ?? sebep
}

/* ---------- Pencere (modal) ---------- */

export function Pencere({
  baslik,
  aciklama,
  onKapat,
  genis = false,
  children,
}: {
  baslik: string
  aciklama?: string
  onKapat: () => void
  genis?: boolean
  children: ReactNode
}) {
  return (
    <div
      className="kaplama"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onKapat()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onKapat()
      }}
    >
      <div className={genis ? 'pencere genis-pencere' : 'pencere'} role="dialog" aria-modal="true" aria-label={baslik}>
        <h3>{baslik}</h3>
        {aciklama && <p className="aciklama">{aciklama}</p>}
        {children}
      </div>
    </div>
  )
}
