import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { BosDurum, Hata, HesapRozeti, hataMetni } from '../ortak/Durum'
import type { KullaniciOzeti } from '../tipler'

export function Kullanicilar() {
  const navigate = useNavigate()
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
      const { data, error } = await supabase.rpc('moderasyon_kullanici_ara', { p_metin: metin.trim() })
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
      <div className="sayfa-ust">
        <div>
          <h2>Kullanıcılar</h2>
          <div className="alt">
            Arama, kullanıcının "aramada görünme" tercihini ve engellemeleri dikkate almaz. Liste ize düşmez; detayı açmak düşer.
          </div>
        </div>
      </div>

      <form
        className="arama"
        style={{ marginBottom: 14 }}
        onSubmit={(e) => {
          e.preventDefault()
          ara()
        }}
      >
        <input
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Kullanıcı adı ya da isim"
          aria-label="Kullanıcı ara"
          autoFocus
        />
        <button className="birincil" type="submit" disabled={calisiyor}>
          {calisiyor ? 'Aranıyor…' : 'Ara'}
        </button>
      </form>

      <Hata mesaj={hata} />

      {arandi && sonuclar.length === 0 && (
        <BosDurum baslik="Kimse bulunamadı">Kullanıcı adının bir parçasını ya da ismi dene.</BosDurum>
      )}

      {sonuclar.length > 0 && (
        <div className="tablo-kap">
          <table>
            <thead>
              <tr>
                <th>Kullanıcı adı</th>
                <th>Ad</th>
                <th>Hesap durumu</th>
                <th title="Hakkındaki şikayet sayısı">Hakkında şikayet</th>
              </tr>
            </thead>
            <tbody>
              {sonuclar.map((k) => (
                <tr
                  key={k.id}
                  className="satir-link"
                  tabIndex={0}
                  onClick={() => navigate(`/kullanicilar/${k.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/kullanicilar/${k.id}`)}
                >
                  <td><b>@{k.kullanici_adi}</b></td>
                  <td>{k.ad}</td>
                  <td><HesapRozeti durum={k.durum} /></td>
                  <td><span className={k.sikayet_sayisi > 0 ? 'sayac uyari' : 'sayac'}>{k.sikayet_sayisi}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
