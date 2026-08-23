import type { ReactNode } from 'react'

export function Yukleniyor({ ne = 'Veriler' }: { ne?: string }) {
  return <p className="durum">{ne} yükleniyor…</p>
}

export function Hata({ mesaj }: { mesaj: string | null }) {
  if (!mesaj) return null
  return <p className="durum hata">{mesaj}</p>
}

export function BosDurum({ children }: { children: ReactNode }) {
  return <p className="durum bos">{children}</p>
}

/** Hata mesajini kullaniciya gosterilebilir bir metne cevirir. */
export function hataMetni(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message)
  }
  return 'Bir sorun oluştu'
}

/** Sunucudan gelen zaman damgasini okunur hale getirir. */
export function zaman(deger: string | null): string {
  if (!deger) return '—'
  return new Date(deger).toLocaleString('tr-TR')
}
