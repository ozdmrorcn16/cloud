import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { BosDurum, Hata, Yukleniyor, hataMetni, zaman } from '../ortak/Durum'
import type { SikayetSatiri } from '../tipler'

const SAYFA = 50

export function Sikayetler() {
  const [satirlar, setSatirlar] = useState<SikayetSatiri[]>([])
  const [durum, setDurum] = useState('')
  const [hedefTur, setHedefTur] = useState('')
  const [sirala, setSirala] = useState('yeni_once')
  const [sayfa, setSayfa] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_sikayetleri_listele', {
        p_durum: durum || null,
        p_hedef_tur: hedefTur || null,
        p_sirala: sirala,
        p_limit: SAYFA,
        p_ofset: sayfa * SAYFA,
      })
      if (error) throw error
      setSatirlar((data ?? []) as SikayetSatiri[])
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setYukleniyor(false)
    }
  }, [durum, hedefTur, sirala, sayfa])

  useEffect(() => {
    yukle()
  }, [yukle])

  return (
    <section>
      <h2>Şikayetler</h2>

      <div className="filtreler">
        <select value={durum} onChange={(e) => { setSayfa(0); setDurum(e.target.value) }}>
          <option value="">Tüm durumlar</option>
          <option value="yeni">Yeni</option>
          <option value="incelendi">İncelendi</option>
          <option value="islem_yapildi">İşlem yapıldı</option>
          <option value="reddedildi">Reddedildi</option>
        </select>

        <select value={hedefTur} onChange={(e) => { setSayfa(0); setHedefTur(e.target.value) }}>
          <option value="">Tüm hedefler</option>
          <option value="kullanici">Kullanıcı</option>
          <option value="check_in">Check-in</option>
          <option value="mesaj">Mesaj</option>
        </select>

        <select value={sirala} onChange={(e) => setSirala(e.target.value)}>
          <option value="yeni_once">Önce yeni</option>
          <option value="eski_once">Önce eski</option>
        </select>
      </div>

      <Hata mesaj={hata} />

      {yukleniyor ? (
        <Yukleniyor ne="Şikayetler" />
      ) : satirlar.length === 0 ? (
        <BosDurum>Bu filtreyle şikayet yok.</BosDurum>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Hedef</th>
              <th>Sebep</th>
              <th>Şikayet eden</th>
              <th>Durum</th>
              <th>Toplam</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr key={s.id}>
                <td>{zaman(s.olusturuldu)}</td>
                <td>
                  <Link to={`/sikayetler/${s.id}`}>
                    {s.hedef_adi ?? s.hedef_id.slice(0, 8)}
                  </Link>
                  <span className="etiket">{s.hedef_tur}</span>
                </td>
                <td>{s.sebep}</td>
                <td>{s.sikayet_eden_adi ?? '—'}</td>
                <td>
                  <span className={`durum-rozet durum-${s.durum}`}>{s.durum}</span>
                </td>
                <td>
                  {/* Tekrar eden suclu goze carpsin. */}
                  <span className={s.hedefin_sikayeti > 1 ? 'rozet uyari' : 'rozet'}>
                    {s.hedefin_sikayeti}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="sayfalama">
        <button onClick={() => setSayfa((s) => Math.max(0, s - 1))} disabled={sayfa === 0}>
          Önceki
        </button>
        <span>Sayfa {sayfa + 1}</span>
        <button onClick={() => setSayfa((s) => s + 1)} disabled={satirlar.length < SAYFA}>
          Sonraki
        </button>
      </div>
    </section>
  )
}
