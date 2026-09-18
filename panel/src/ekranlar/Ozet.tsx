import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  BosDurum, Hata, HedefEtiketi, SikayetRozeti, Yukleniyor, Zaman,
  goreceZaman, hataMetni, sebepMetni, zaman,
} from '../ortak/Durum'
import type { Ozet as OzetTipi, SikayetSatiri } from '../tipler'

/**
 * OZET: moderator giriste ne var ne yok tek bakista gorsun. Sayilar
 * `moderasyon_ozet`ten, "sirada" listesi en eski bekleyen bes sikayet
 * (eski once - kuyruk adaleti). Liste ekranlarinda gezinme ize dusmez.
 */
export function Ozet() {
  const navigate = useNavigate()
  const [ozet, setOzet] = useState<OzetTipi | null>(null)
  const [sirada, setSirada] = useState<SikayetSatiri[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [yenilendi, setYenilendi] = useState<string>('')

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const [{ data: o, error: oe }, { data: s, error: se }] = await Promise.all([
        supabase.rpc('moderasyon_ozet'),
        supabase.rpc('moderasyon_sikayetleri_listele', {
          p_durum: 'yeni', p_sirala: 'eski_once', p_limit: 5, p_ofset: 0,
        }),
      ])
      if (oe) throw oe
      if (se) throw se
      setOzet((o as OzetTipi[])[0] ?? null)
      setSirada((s ?? []) as SikayetSatiri[])
      setYenilendi(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => {
    yukle()
  }, [yukle])

  const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section>
      <div className="sayfa-ust">
        <div>
          <h2>Bugün</h2>
          <div className="alt">{bugun}{yenilendi && ` · son yenileme ${yenilendi}`}</div>
        </div>
        <button type="button" className="kucuk" onClick={yukle} disabled={yukleniyor}>Yenile</button>
      </div>

      <Hata mesaj={hata} onTekrar={yukle} />

      {yukleniyor && !ozet ? (
        <Yukleniyor satir={5} />
      ) : ozet && (
        <div className="kartlar">
          <div className="kart tikla" onClick={() => navigate('/sikayetler')} role="link" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/sikayetler')}>
            <div className="kart-etiket">Bekleyen şikayet</div>
            <div className={`kart-sayi${ozet.bekleyen_sikayet > 0 ? ' vurgu' : ''}`}>{ozet.bekleyen_sikayet}</div>
            <div className="kart-not">
              {ozet.en_eski_bekleyen ? `en eskisi ${goreceZaman(ozet.en_eski_bekleyen)}` : 'kuyruk boş'}
            </div>
          </div>
          <div className="kart">
            <div className="kart-etiket">Bugün karar</div>
            <div className="kart-sayi">{ozet.bugun_karar}</div>
            <div className="kart-not">7 günde {ozet.yedi_gun_karar}</div>
          </div>
          <div className="kart">
            <div className="kart-etiket">Askıda hesap</div>
            <div className="kart-sayi">{ozet.askida_hesap}</div>
            <div className="kart-not">yasaklı {ozet.yasakli_hesap}</div>
          </div>
          <div className="kart tikla" onClick={() => navigate('/talepler')} role="link" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/talepler')}>
            <div className="kart-etiket">Bekleyen talep</div>
            <div className={`kart-sayi${ozet.bekleyen_talep > 0 ? ' vurgu' : ''}`}>{ozet.bekleyen_talep}</div>
            <div className="kart-not">mekân düzenleme</div>
          </div>
        </div>
      )}

      <div className="sayfa-ust" style={{ marginBottom: 10 }}>
        <h3>Sırada</h3>
        <span className="k">En eski bekleyen şikayetler</span>
      </div>

      {!yukleniyor && sirada.length === 0 ? (
        <BosDurum baslik="Bekleyen şikayet yok">Kuyruk temiz. Yeni şikayet gelince burada görünür.</BosDurum>
      ) : (
        <div className="tablo-kap">
          <table>
            <thead>
              <tr><th>Geldi</th><th>Hedef</th><th>Sebep</th><th>Durum</th><th /></tr>
            </thead>
            <tbody>
              {sirada.map((s) => (
                <tr key={s.id} className="satir-link" onClick={() => navigate(`/sikayetler/${s.id}`)}>
                  <td title={zaman(s.olusturuldu)}><Zaman deger={s.olusturuldu} /></td>
                  <td><HedefEtiketi tur={s.hedef_tur} ad={s.hedef_adi ? (s.hedef_tur === 'kullanici' ? `@${s.hedef_adi}` : s.hedef_adi) : null} /></td>
                  <td>{sebepMetni(s.sebep)}</td>
                  <td><SikayetRozeti durum={s.durum} /></td>
                  <td className="sag k">İncele →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
