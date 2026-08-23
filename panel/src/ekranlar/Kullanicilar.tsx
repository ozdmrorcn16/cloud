import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { BosDurum, Hata, hataMetni } from '../ortak/Durum'
import type { KullaniciOzeti } from '../tipler'

export function Kullanicilar() {
  const [metin, setMetin] = useState('')
  const [sonuclar, setSonuclar] = useState<KullaniciOzeti[]>([])
  const [arandi, setArandi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  async function ara() {
    if (metin.trim().length < 2) {
      setHata('En az 2 karakter yaz.')
      return
    }
    setHata(null)
    setCalisiyor(true)
    try {
      const { data, error } = await supabase.rpc('moderasyon_kullanici_ara', {
        p_metin: metin.trim(),
      })
      if (error) throw error
      setSonuclar((data ?? []) as KullaniciOzeti[])
      setArandi(true)
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setCalisiyor(false)
    }
  }

  return (
    <section>
      <h2>Kullanıcılar</h2>
      <p className="not">
        Arama kullanıcının "beni aramada göster" tercihini ve engellemeleri
        dikkate almaz.
      </p>

      <form
        className="arama"
        onSubmit={(e) => {
          e.preventDefault()
          ara()
        }}
      >
        <input
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Kullanıcı adı ya da isim"
        />
        <button className="birincil" type="submit" disabled={calisiyor}>
          {calisiyor ? 'Aranıyor…' : 'Ara'}
        </button>
      </form>

      <Hata mesaj={hata} />

      {arandi && sonuclar.length === 0 && <BosDurum>Kimse bulunamadı.</BosDurum>}

      {sonuclar.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Kullanıcı adı</th>
              <th>Ad</th>
              <th>Hesap durumu</th>
              <th>Hakkındaki şikayet</th>
            </tr>
          </thead>
          <tbody>
            {sonuclar.map((k) => (
              <tr key={k.id}>
                <td>
                  <Link to={`/kullanicilar/${k.id}`}>@{k.kullanici_adi}</Link>
                </td>
                <td>{k.ad}</td>
                <td>
                  {k.durum ? (
                    <span className={`durum-rozet durum-${k.durum}`}>{k.durum}</span>
                  ) : (
                    'aktif'
                  )}
                </td>
                <td>
                  <span className={k.sikayet_sayisi > 0 ? 'rozet uyari' : 'rozet'}>
                    {k.sikayet_sayisi}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
