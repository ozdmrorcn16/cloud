import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { BosDurum, Hata, Yukleniyor, hataMetni, zaman } from '../ortak/Durum'
import type { IzSatiri } from '../tipler'

// Mesaj okumalari listede AYIRT EDILEBILIR olmali: karar 75'in tek somut
// ciktisi izdeki bu ayrim. Gorunmezse karar kagit uzerinde kalir.
const OKUMA_EYLEMLERI = new Set(['mesaj_baglami', 'konusma_tam'])

const ETIKETLER: Record<string, string> = {
  mesaj_baglami: 'şikayet bağlamı okundu',
  konusma_tam: 'TÜM KONUŞMA okundu',
  kullanici_detayi_goruntulendi: 'kullanıcı detayı görüntülendi',
  sikayet_karara_baglandi: 'şikayet karara bağlandı',
  hesap_askiya_alindi: 'hesap askıya alındı',
  hesap_yasaklandi: 'hesap yasaklandı',
  hesap_durumu_kaldirildi: 'hesap kısıtı kaldırıldı',
  icerik_gizlendi: 'içerik gizlendi',
  gizleme_kaldirildi: 'gizleme kaldırıldı',
}

export function DenetimIzi() {
  const [satirlar, setSatirlar] = useState<IzSatiri[]>([])
  const [hedefTur, setHedefTur] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_kayitlarini_listele', {
        p_hedef_tur: hedefTur || null,
        p_limit: 200,
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

  return (
    <section>
      <h2>Denetim izi</h2>
      <p className="not">
        Bu kayıtlar silinemez ve değiştirilemez; moderatör dahil hiç kimse
        kaldıramaz.
      </p>

      <div className="filtreler">
        <select value={hedefTur} onChange={(e) => setHedefTur(e.target.value)}>
          <option value="">Tüm hedefler</option>
          <option value="kullanici">Kullanıcı</option>
          <option value="check_in">Check-in</option>
          <option value="sikayet">Şikayet</option>
          <option value="konusma">Konuşma</option>
        </select>
      </div>

      <Hata mesaj={hata} />

      {yukleniyor ? (
        <Yukleniyor ne="Kayıtlar" />
      ) : satirlar.length === 0 ? (
        <BosDurum>Henüz kayıt yok.</BosDurum>
      ) : (
        <table>
          <thead>
            <tr><th>Zaman</th><th>Eylem</th><th>Hedef</th><th>Gerekçe</th></tr>
          </thead>
          <tbody>
            {satirlar.map((k) => (
              <tr key={k.id} className={OKUMA_EYLEMLERI.has(k.eylem) ? 'okuma' : ''}>
                <td>{zaman(k.olusturuldu)}</td>
                <td>
                  <span className={k.eylem === 'konusma_tam' ? 'etiket genis' : 'etiket'}>
                    {ETIKETLER[k.eylem] ?? k.eylem}
                  </span>
                </td>
                <td>
                  {k.hedef_tur} · {k.hedef_id.slice(0, 8)}
                </td>
                <td>
                  {(k.ayrinti?.gerekce as string | undefined) ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
