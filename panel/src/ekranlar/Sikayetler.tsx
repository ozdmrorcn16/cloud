import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  BosDurum, Hata, HedefEtiketi, SikayetRozeti, Yukleniyor, Zaman, hataMetni, sebepMetni, zaman,
} from '../ortak/Durum'
import type { SikayetSatiri } from '../tipler'

const SAYFA = 50

const DURUMLAR: { anahtar: string; etiket: string }[] = [
  { anahtar: 'yeni', etiket: 'Bekleyen' },
  { anahtar: 'incelendi', etiket: 'İncelendi' },
  { anahtar: 'islem_yapildi', etiket: 'İşlem yapıldı' },
  { anahtar: 'reddedildi', etiket: 'Reddedildi' },
  { anahtar: '', etiket: 'Tümü' },
]

/**
 * SIKAYETLER: filtre ciplerle (durum), hedef ve siralama secimle. Secim
 * adreste (`?durum=`) tasinir ki detaydan geri gelince filtre kalsin.
 * Varsayilan "Bekleyen": moderatorun isi olan liste.
 */
export function Sikayetler() {
  const navigate = useNavigate()
  const [arama, setArama] = useSearchParams()
  const durum = arama.get('durum') ?? 'yeni'
  const hedefTur = arama.get('hedef') ?? ''
  const sirala = arama.get('sira') ?? 'eski_once'
  const sayfa = Number(arama.get('sayfa') ?? '0')

  const [satirlar, setSatirlar] = useState<SikayetSatiri[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)

  function ayarla(anahtar: string, deger: string) {
    const yeni = new URLSearchParams(arama)
    if (deger) yeni.set(anahtar, deger)
    else yeni.delete(anahtar)
    if (anahtar !== 'sayfa') yeni.delete('sayfa')
    setArama(yeni, { replace: true })
  }

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
      <div className="sayfa-ust">
        <div>
          <h2>Şikayetler</h2>
          <div className="alt">Karar verilmemiş her şikayet "Bekleyen"de durur; en eskisi en üstte.</div>
        </div>
      </div>

      <div className="cipler" role="tablist" aria-label="Durum">
        {DURUMLAR.map((d) => (
          <button
            key={d.anahtar}
            type="button"
            role="tab"
            aria-selected={durum === d.anahtar}
            className={`cip${durum === d.anahtar ? ' aktif' : ''}`}
            onClick={() => ayarla('durum', d.anahtar)}
          >
            {d.etiket}
          </button>
        ))}
        <span className="ayrac" />
        <select className="dar" value={hedefTur} onChange={(e) => ayarla('hedef', e.target.value)} aria-label="Hedef türü">
          <option value="">Tüm hedefler</option>
          <option value="kullanici">Kullanıcı</option>
          <option value="check_in">Check-in</option>
          <option value="mesaj">Mesaj</option>
          <option value="yorum">Yorum</option>
        </select>
        <select className="dar" value={sirala} onChange={(e) => ayarla('sira', e.target.value)} aria-label="Sıralama">
          <option value="eski_once">Önce eski</option>
          <option value="yeni_once">Önce yeni</option>
        </select>
      </div>

      <Hata mesaj={hata} onTekrar={yukle} />

      {yukleniyor ? (
        <div className="blok"><Yukleniyor satir={6} /></div>
      ) : satirlar.length === 0 ? (
        <BosDurum baslik={durum === 'yeni' ? 'Bekleyen şikayet yok' : 'Bu filtreyle şikayet yok'}>
          {durum === 'yeni' ? 'Kuyruk temiz.' : 'Filtreyi değiştirerek diğer kayıtlara bakabilirsin.'}
        </BosDurum>
      ) : (
        <div className="tablo-kap">
          <table>
            <thead>
              <tr>
                <th>Geldi</th>
                <th>Hedef</th>
                <th>Sebep</th>
                <th>Şikayet eden</th>
                <th title="Aynı hedef hakkında toplam şikayet">Aynı hedef</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr
                  key={s.id}
                  className="satir-link"
                  tabIndex={0}
                  onClick={() => navigate(`/sikayetler/${s.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/sikayetler/${s.id}`)}
                >
                  <td title={zaman(s.olusturuldu)}><Zaman deger={s.olusturuldu} /></td>
                  <td>
                    <HedefEtiketi
                      tur={s.hedef_tur}
                      ad={s.hedef_adi ? (s.hedef_tur === 'kullanici' ? `@${s.hedef_adi}` : s.hedef_adi) : s.hedef_id.slice(0, 8)}
                    />
                  </td>
                  <td>{sebepMetni(s.sebep)}</td>
                  <td className="ikincil">{s.sikayet_eden_adi ? `@${s.sikayet_eden_adi}` : 'silinmiş'}</td>
                  <td>
                    {/* Tekrar eden hedef goze carpsin. */}
                    <span className={s.hedefin_sikayeti > 1 ? 'sayac uyari' : 'sayac'}>{s.hedefin_sikayeti}</span>
                  </td>
                  <td><SikayetRozeti durum={s.durum} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(sayfa > 0 || satirlar.length === SAYFA) && (
        <div className="sayfalama">
          <button type="button" className="kucuk" onClick={() => ayarla('sayfa', String(Math.max(0, sayfa - 1)))} disabled={sayfa === 0}>
            ← Önceki
          </button>
          <span>Sayfa {sayfa + 1}</span>
          <button type="button" className="kucuk" onClick={() => ayarla('sayfa', String(sayfa + 1))} disabled={satirlar.length < SAYFA}>
            Sonraki →
          </button>
        </div>
      )}
    </section>
  )
}
