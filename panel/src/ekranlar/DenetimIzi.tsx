import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { BosDurum, Hata, Yukleniyor, hataMetni, hedefEtiketi, zaman } from '../ortak/Durum'
import type { IzSatiri } from '../tipler'

// Mesaj okumalari listede AYIRT EDILEBILIR olmali: karar 75'in tek somut
// ciktisi izdeki bu ayrim. Gorunmezse karar kagit uzerinde kalir.
const OKUMA_EYLEMLERI = new Set(['mesaj_baglami', 'konusma_tam', 'kullanici_detayi_goruntulendi'])

const ETIKETLER: Record<string, { etiket: string; renk: string }> = {
  mesaj_baglami: { etiket: 'Şikayet bağlamı okundu', renk: 'turuncu' },
  konusma_tam: { etiket: 'TÜM KONUŞMA okundu', renk: 'kirmizi' },
  kullanici_detayi_goruntulendi: { etiket: 'Kullanıcı detayı görüntülendi', renk: 'turuncu' },
  sikayet_karara_baglandi: { etiket: 'Şikayet karara bağlandı', renk: 'yesil' },
  hesap_askiya_alindi: { etiket: 'Hesap askıya alındı', renk: 'sari' },
  hesap_yasaklandi: { etiket: 'Hesap yasaklandı', renk: 'kirmizi' },
  hesap_durumu_kaldirildi: { etiket: 'Hesap kısıtı kaldırıldı', renk: 'yesil' },
  icerik_gizlendi: { etiket: 'İçerik gizlendi', renk: 'sari' },
  gizleme_kaldirildi: { etiket: 'Gizleme kaldırıldı', renk: 'yesil' },
  icerik_gizlemesi_kaldirildi: { etiket: 'İçerik gizlemesi kaldırıldı', renk: 'yesil' },
  mekan_duzenleme_talebi_karara_baglandi: { etiket: 'Düzenleme talebi karara bağlandı', renk: 'yesil' },
  mekan_geri_acildi: { etiket: 'Mekân geri açıldı', renk: 'yesil' },
}

const EYLEM_GRUPLARI = [
  { anahtar: '', etiket: 'Tümü' },
  { anahtar: 'okuma', etiket: 'Okumalar' },
  { anahtar: 'karar', etiket: 'Kararlar' },
  { anahtar: 'hesap', etiket: 'Hesap işlemleri' },
]

function gruptaMi(eylem: string, grup: string): boolean {
  if (!grup) return true
  if (grup === 'okuma') return OKUMA_EYLEMLERI.has(eylem)
  if (grup === 'hesap') return eylem.startsWith('hesap_')
  if (grup === 'karar') return !OKUMA_EYLEMLERI.has(eylem) && !eylem.startsWith('hesap_')
  return true
}

function hedefBaglantisi(k: IzSatiri): string | null {
  if (k.hedef_tur === 'kullanici') return `/kullanicilar/${k.hedef_id}`
  if (k.hedef_tur === 'sikayet') return `/sikayetler/${k.hedef_id}`
  if (k.hedef_tur === 'konusma') return `/konusma/${k.hedef_id}`
  return null
}

export function DenetimIzi() {
  const [satirlar, setSatirlar] = useState<IzSatiri[]>([])
  const [hedefTur, setHedefTur] = useState('')
  const [grup, setGrup] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_kayitlarini_listele', {
        p_hedef_tur: hedefTur || null, p_limit: 200,
      })
      if (error) throw error
      setSatirlar((data ?? []) as IzSatiri[])
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setYukleniyor(false)
    }
  }, [hedefTur])

  useEffect(() => {
    yukle()
  }, [yukle])

  const gorunen = satirlar.filter((k) => gruptaMi(k.eylem, grup))

  return (
    <section>
      <div className="sayfa-ust">
        <div>
          <h2>Denetim izi</h2>
          <div className="alt">Kim, ne zaman, neye, neden. Bu kayıtlar silinemez ve değiştirilemez; moderatör dahil hiç kimse kaldıramaz.</div>
        </div>
      </div>

      <div className="cipler" role="tablist">
        {EYLEM_GRUPLARI.map((g) => (
          <button key={g.anahtar} type="button" role="tab" aria-selected={grup === g.anahtar}
            className={`cip${grup === g.anahtar ? ' aktif' : ''}`} onClick={() => setGrup(g.anahtar)}>
            {g.etiket}
          </button>
        ))}
        <span className="ayrac" />
        <select className="dar" value={hedefTur} onChange={(e) => setHedefTur(e.target.value)} aria-label="Hedef türü">
          <option value="">Tüm hedefler</option>
          <option value="kullanici">Kullanıcı</option>
          <option value="check_in">Check-in</option>
          <option value="yorum">Yorum</option>
          <option value="sikayet">Şikayet</option>
          <option value="konusma">Konuşma</option>
        </select>
      </div>

      <Hata mesaj={hata} onTekrar={yukle} />

      {yukleniyor ? (
        <div className="blok"><Yukleniyor satir={6} /></div>
      ) : gorunen.length === 0 ? (
        <BosDurum baslik="Kayıt yok">Bu filtreyle eşleşen bir denetim kaydı yok.</BosDurum>
      ) : (
        <div className="tablo-kap">
          <table>
            <thead>
              <tr><th>Zaman</th><th>Eylem</th><th>Hedef</th><th>Moderatör</th><th>Gerekçe</th></tr>
            </thead>
            <tbody>
              {gorunen.map((k) => {
                const e = ETIKETLER[k.eylem] ?? { etiket: k.eylem, renk: 'gri' }
                const yol = hedefBaglantisi(k)
                return (
                  <tr key={k.id} className={OKUMA_EYLEMLERI.has(k.eylem) ? 'okuma' : ''}>
                    <td style={{ whiteSpace: 'nowrap' }}>{zaman(k.olusturuldu)}</td>
                    <td><span className={`rozet ${e.renk}`}>{e.etiket}</span></td>
                    <td>
                      <span className="k">{hedefEtiketi(k.hedef_tur)} · </span>
                      {yol ? <Link to={yol}><code>{k.hedef_id.slice(0, 8)}</code></Link> : <code>{k.hedef_id.slice(0, 8)}</code>}
                    </td>
                    <td><code>{k.moderator_id ? k.moderator_id.slice(0, 8) : '—'}</code></td>
                    <td>{(k.ayrinti?.gerekce as string | undefined) ?? (k.ayrinti?.not as string | undefined) ?? <span className="k">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {!yukleniyor && satirlar.length >= 200 && (
        <p className="ipucu" style={{ marginTop: 8 }}>Son 200 kayıt gösteriliyor.</p>
      )}
    </section>
  )
}
