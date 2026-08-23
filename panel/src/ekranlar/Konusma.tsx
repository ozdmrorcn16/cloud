import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { Hata, hataMetni, zaman } from '../ortak/Durum'
import { GerekceSor } from '../ortak/GerekceSor'
import type { KonusmaIcerigi } from '../tipler'

/**
 * Karar 75'in arayuz karsiligi.
 *
 * KADEME 1 - sikayet baglami: adreste `merkez` parametresi varsa, yani
 * bir mesaj sikayetinden gelinmisse. Yalnizca o mesajin cevresi acilir.
 *
 * KADEME 2 - tum konusma: ayri bir gerekce ve ayri bir onay ister.
 * Kademe 1'in gerekcesi DEVRALINMAZ; ikisi denetim izinde ayri turde
 * gorunur (mesaj_baglami / konusma_tam).
 *
 * Ekran salt-okunurdur: silme, duzenleme, gizleme yok. Panel mesajlara
 * asla yazmaz.
 */
export function Konusma() {
  const { id } = useParams<{ id: string }>()
  const [arama] = useSearchParams()
  const merkez = arama.get('merkez')

  const [icerik, setIcerik] = useState<KonusmaIcerigi | null>(null)
  const [kutuAcik, setKutuAcik] = useState(false)
  const [genisKutuAcik, setGenisKutuAcik] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  async function ac(gerekce: string, merkezMesajId: string | null) {
    if (!id) return
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_konusma_mesajlari', {
        p_konusma_id: id,
        p_gerekce: gerekce,
        p_merkez_mesaj_id: merkezMesajId,
        p_limit: 200,
        p_ofset: 0,
      })
      if (error) throw error
      setIcerik(data as KonusmaIcerigi)
      setKutuAcik(false)
      setGenisKutuAcik(false)
    } catch (e) {
      setHata(hataMetni(e))
      setKutuAcik(false)
      setGenisKutuAcik(false)
    }
  }

  return (
    <section>
      <Link to="/sikayetler">← Şikayetler</Link>
      <h2>Konuşma</h2>

      <Hata mesaj={hata} />

      {!icerik && (
        <div className="kapi">
          <p>
            İçerik gerekçe girilmeden yüklenmez. Bu erişim denetim izine
            kaydedilir.
          </p>
          {merkez ? (
            <button className="birincil" onClick={() => setKutuAcik(true)}>
              Şikayet bağlamını aç (bu mesajın çevresi)
            </button>
          ) : (
            <button className="birincil" onClick={() => setGenisKutuAcik(true)}>
              Tüm konuşmayı aç
            </button>
          )}
        </div>
      )}

      {icerik && (
        <>
          <p className={icerik.kademe === 2 ? 'uyari-serit genis' : 'uyari-serit'}>
            {icerik.kademe === 1
              ? 'Şikayet bağlamı: yalnızca bu mesajın çevresi açıldı.'
              : 'Tüm konuşma açıldı — bu erişim denetim izinde ayrı olarak görünür.'}
          </p>

          {icerik.kademe === 1 && (
            <p>
              <button onClick={() => setGenisKutuAcik(true)}>
                Tüm konuşmayı aç (ayrı gerekçe ister)
              </button>
            </p>
          )}

          <ol className="mesajlar">
            {icerik.mesajlar.map((m) => (
              <li
                key={m.id}
                className={m.id === merkez ? 'mesaj vurgulu' : 'mesaj'}
              >
                <span className="mesaj-ust">
                  {m.gonderen_id ? m.gonderen_id.slice(0, 8) : 'silinmiş'} ·{' '}
                  {zaman(m.olusturuldu)}
                </span>
                <span className="mesaj-metin">{m.metin}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {kutuAcik && merkez && (
        <GerekceSor
          baslik="Şikayet bağlamını aç"
          aciklama="Şikayet edilen mesaj, öncesindeki ve sonrasındaki 20 mesajla birlikte açılır."
          eylemEtiketi="Aç"
          onIptal={() => setKutuAcik(false)}
          onSonuc={(gerekce) => ac(gerekce, merkez)}
        />
      )}

      {genisKutuAcik && (
        <GerekceSor
          baslik="Tüm konuşmayı aç"
          aciklama="Bu, şikayet bağlamından daha geniş bir erişimdir: konuşmanın tamamı açılır ve denetim izinde ayrı türde görünür."
          eylemEtiketi="Tüm konuşmayı aç"
          onayGerekli
          onayMetni="Bu kişinin bütün konuşmasını açtığımı ve bunun kaydedildiğini biliyorum."
          onIptal={() => setGenisKutuAcik(false)}
          onSonuc={(gerekce) => ac(gerekce, null)}
        />
      )}
    </section>
  )
}
