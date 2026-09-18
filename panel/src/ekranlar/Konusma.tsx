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
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setKutuAcik(false)
      setGenisKutuAcik(false)
    }
  }

  // Uyeleri sirayla renklendirmek yerine ilk uyeyi solda, digerini
  // sagda hizala: kimin ne dedigi bir bakista okunsun.
  const ilkUye = icerik?.uyeler[0]

  return (
    <section>
      <Link to="/sikayetler" className="geri">← Şikayetler</Link>
      <div className="sayfa-ust">
        <div>
          <h2>Konuşma</h2>
          <div className="alt">Salt okunur. Panel mesajlara asla yazmaz.</div>
        </div>
        {icerik && (
          <span className={icerik.kademe === 2 ? 'rozet kirmizi' : 'rozet turuncu'}>
            {icerik.kademe === 1 ? 'Şikayet bağlamı' : 'Tüm konuşma'}
          </span>
        )}
      </div>

      <Hata mesaj={hata} />

      {!icerik && (
        <div className="kapi">
          <p>İçerik gerekçe girilmeden yüklenmez. Bu erişim moderatör kimliğinle denetim izine yazılır.</p>
          {merkez ? (
            <button type="button" className="birincil" onClick={() => setKutuAcik(true)}>
              Şikayet bağlamını aç · bu mesajın çevresi
            </button>
          ) : (
            <button type="button" className="yikici" onClick={() => setGenisKutuAcik(true)}>
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
              : 'Tüm konuşma açıldı — bu erişim denetim izinde ayrı türde görünür.'}
          </p>

          {icerik.kademe === 1 && (
            <p style={{ margin: '0 0 14px' }}>
              <button type="button" className="kucuk" onClick={() => setGenisKutuAcik(true)}>
                Tüm konuşmayı aç · ayrı gerekçe ister
              </button>
            </p>
          )}

          <ol className="mesajlar">
            {icerik.mesajlar.map((m) => (
              <li
                key={m.id}
                className={m.id === merkez ? 'mesaj vurgulu' : 'mesaj'}
                style={m.gonderen_id && m.gonderen_id !== ilkUye ? { marginLeft: 'auto' } : undefined}
              >
                <span className="mesaj-ust">
                  {m.gonderen_id ? <code>{m.gonderen_id.slice(0, 8)}</code> : 'silinmiş hesap'} · {zaman(m.olusturuldu)}
                  {m.id === merkez && <> · <b>şikayet edilen mesaj</b></>}
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
          aciklama="Şikayet bağlamından daha geniş bir erişim: konuşmanın tamamı açılır ve denetim izinde ayrı türde görünür."
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
