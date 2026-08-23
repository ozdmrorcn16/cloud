import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { Hata, Yukleniyor, hataMetni, zaman } from '../ortak/Durum'
import { GerekceSor } from '../ortak/GerekceSor'
import type { KullaniciDetayi as Detay } from '../tipler'

type AcikKutu = 'askiya_al' | 'yasakla' | 'kaldir' | null

export function KullaniciDetayi() {
  const { id } = useParams<{ id: string }>()
  const [detay, setDetay] = useState<Detay | null>(null)
  const [kutu, setKutu] = useState<AcikKutu>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    if (!id) return
    setYukleniyor(true)
    setHata(null)
    try {
      // Bu cagri denetim izine bir satir yazar (karar 61): kisisel
      // veriye erisim kaydedilir.
      const { data, error } = await supabase.rpc('moderasyon_kullanici_detayi', {
        p_kullanici_id: id,
      })
      if (error) throw error
      setDetay(data as Detay)
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setYukleniyor(false)
    }
  }, [id])

  useEffect(() => {
    yukle()
  }, [yukle])

  async function aksiyon(rpc: string, parametre: Record<string, unknown>) {
    setHata(null)
    try {
      const { error } = await supabase.rpc(rpc, parametre)
      if (error) throw error
      setBilgi('İşlem uygulandı ve denetim izine yazıldı.')
      setKutu(null)
      await yukle()
    } catch (e) {
      setHata(hataMetni(e))
      setKutu(null)
    }
  }

  if (yukleniyor) return <Yukleniyor ne="Kullanıcı" />
  if (!detay) return <Hata mesaj={hata ?? 'Kullanıcı bulunamadı'} />

  const p = detay.profil

  return (
    <section>
      <Link to="/kullanicilar">← Kullanıcılar</Link>

      {/* Sunucu bu goruntulemeyi zaten ize yazdi; uyari o gercegin
          arayuzdeki karsiligi. */}
      <p className="uyari-serit">Bu görüntüleme denetim izine kaydedildi.</p>

      <h2>{p ? `${p.ad} (@${p.kullanici_adi})` : 'Profili silinmiş kullanıcı'}</h2>

      <Hata mesaj={hata} />
      {bilgi && <p className="durum bilgi">{bilgi}</p>}

      <h3>Hesap durumu</h3>
      {detay.hesap_durumu ? (
        <dl className="ozet">
          <dt>Durum</dt><dd>{detay.hesap_durumu.durum}</dd>
          <dt>Bitiş</dt><dd>{zaman(detay.hesap_durumu.aski_bitisi)}</dd>
          <dt>Gerekçe</dt><dd>{detay.hesap_durumu.gerekce}</dd>
        </dl>
      ) : (
        <p>Aktif (kısıt yok).</p>
      )}

      <div className="aksiyonlar">
        <button onClick={() => setKutu('askiya_al')}>Askıya al (7 gün)</button>
        <button className="yikici" onClick={() => setKutu('yasakla')}>Yasakla</button>
        {detay.hesap_durumu && (
          <button onClick={() => setKutu('kaldir')}>Kısıtı kaldır</button>
        )}
      </div>

      <h3>Şikayet özeti</h3>
      <p>
        Hakkında: <strong>{detay.sikayet_ozeti.hakkinda}</strong> · Açtığı:{' '}
        <strong>{detay.sikayet_ozeti.actigi}</strong>
      </p>

      <h3>Check-in ve anı geçmişi ({detay.check_inler.length})</h3>
      <table>
        <thead>
          <tr><th>Zaman</th><th>Mekan</th><th>Not</th><th>Tür</th><th>Gizli</th></tr>
        </thead>
        <tbody>
          {detay.check_inler.map((c) => (
            <tr key={c.id} className={c.moderasyon_gizli ? 'gizlenmis' : ''}>
              <td>{zaman(c.olusturma_zamani)}</td>
              <td>{c.mekan_adi}</td>
              <td>{c.not_metni ?? '—'}</td>
              <td>{c.canli_mi ? 'canlı' : 'anı'}</td>
              <td>{c.moderasyon_gizli ? 'evet' : 'hayır'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Bağlar</h3>
      <p>
        Takip: <strong>{detay.takipler.length}</strong> · Engellediği:{' '}
        <strong>{detay.engelledikleri.length}</strong> · Onu engelleyen:{' '}
        <strong>{detay.onu_engelleyenler.length}</strong> · Sohbet isteği:{' '}
        <strong>{detay.sohbet_istekleri.length}</strong>
      </p>
      <p>
        Bugünkü istek sayısı: <strong>{detay.bugunku_istek_sayisi}</strong> ·
        Kayıtlı bildirim cihazı: <strong>{detay.bildirim_cihazi}</strong>
      </p>

      <h3>Konuşmalar ({detay.konusmalar.length})</h3>
      <p className="not">
        Burada yalnızca üst veri var; içerik ayrı bir erişimdir ve denetim
        izine ayrı olarak yazılır.
      </p>
      <table>
        <thead>
          <tr><th>Karşı taraf</th><th>Mesaj</th><th>İlk</th><th>Son</th><th></th></tr>
        </thead>
        <tbody>
          {detay.konusmalar.map((k) => (
            <tr key={k.konusma_id}>
              <td>
                {k.karsi_taraf ? (
                  <Link to={`/kullanicilar/${k.karsi_taraf}`}>
                    {k.karsi_taraf.slice(0, 8)}
                  </Link>
                ) : (
                  'silinmiş'
                )}
              </td>
              <td>{k.mesaj_sayisi}</td>
              <td>{zaman(k.ilk_mesaj)}</td>
              <td>{zaman(k.son_mesaj)}</td>
              <td>
                {/* Buradan acilan her konusma KADEME 2'dir: ortada
                    sikayet baglami yok (karar 75). */}
                <Link to={`/konusma/${k.konusma_id}`}>Tüm konuşmayı aç</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {kutu === 'askiya_al' && id && (
        <GerekceSor
          baslik="Hesabı askıya al"
          aciklama="Askı süresi boyunca kullanıcı hiçbir şey yazamaz ve kimseye görünmez."
          eylemEtiketi="7 gün askıya al"
          onayGerekli
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_hesabi_askiya_al', {
              p_kullanici_id: id,
              p_bitis: new Date(Date.now() + 7 * 86400000).toISOString(),
              p_gerekce: gerekce,
            })
          }
        />
      )}

      {kutu === 'yasakla' && id && (
        <GerekceSor
          baslik="Hesabı kalıcı olarak yasakla"
          aciklama="Süresiz. Kaldırılana kadar geçerli."
          eylemEtiketi="Yasakla"
          onayGerekli
          onayMetni="Bu hesabı süresiz yasaklamak istediğimi onaylıyorum."
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_hesabi_yasakla', {
              p_kullanici_id: id,
              p_gerekce: gerekce,
            })
          }
        />
      )}

      {kutu === 'kaldir' && id && (
        <GerekceSor
          baslik="Kısıtı kaldır"
          aciklama="Hesap yeniden aktif olur. Geçmiş denetim izinde kalır."
          eylemEtiketi="Kaldır"
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_hesap_durumunu_kaldir', {
              p_kullanici_id: id,
              p_gerekce: gerekce,
            })
          }
        />
      )}
    </section>
  )
}
