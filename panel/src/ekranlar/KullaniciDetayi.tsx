import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { Bilgi, Hata, HesapRozeti, Yukleniyor, hataMetni, zaman } from '../ortak/Durum'
import { GerekceSor } from '../ortak/GerekceSor'
import type { KullaniciDetayi as Detay } from '../tipler'

type AcikKutu = 'askiya_al' | 'yasakla' | 'kaldir' | null

/**
 * KULLANICI DETAYI. Bu ekrani acmak denetim izine yazilir (karar 61):
 * kisisel veriye erisim. Ust serit bunu her zaman gorunur tutar.
 * Sag sutun: hesap durumu + islemler (kirmizi bolge). Sol: sayilar,
 * check-in gecmisi, konusma ust verisi (icerik AYRI erisim).
 */
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
      const { data, error } = await supabase.rpc('moderasyon_kullanici_detayi', { p_kullanici_id: id })
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
    setBilgi(null)
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

  if (yukleniyor && !detay) {
    return (
      <section>
        <Link to="/kullanicilar" className="geri">← Kullanıcılar</Link>
        <div className="blok"><Yukleniyor satir={6} /></div>
      </section>
    )
  }
  if (!detay) {
    return (
      <section>
        <Link to="/kullanicilar" className="geri">← Kullanıcılar</Link>
        <Hata mesaj={hata ?? 'Kullanıcı bulunamadı'} onTekrar={yukle} />
      </section>
    )
  }

  const p = detay.profil
  const h = detay.hesap_durumu

  return (
    <section>
      <Link to="/kullanicilar" className="geri">← Kullanıcılar</Link>
      <div className="sayfa-ust">
        <div>
          <h2>{p ? p.ad : 'Profili silinmiş kullanıcı'}</h2>
          <div className="alt">{p ? `@${p.kullanici_adi}` : id}</div>
        </div>
        <HesapRozeti durum={h?.durum ?? null} />
      </div>

      {/* Sunucu bu goruntulemeyi zaten ize yazdi; serit o gercegin
          arayuzdeki karsiligi. */}
      <p className="uyari-serit">Bu görüntüleme denetim izine kaydedildi.</p>

      <Hata mesaj={hata} />
      <Bilgi mesaj={bilgi} />

      <div className="iki-sutun">
        <div>
          <div className="kartlar">
            <div className="kart"><div className="kart-etiket">Hakkında şikayet</div><div className={`kart-sayi${detay.sikayet_ozeti.hakkinda > 0 ? ' vurgu' : ''}`}>{detay.sikayet_ozeti.hakkinda}</div></div>
            <div className="kart"><div className="kart-etiket">Açtığı şikayet</div><div className="kart-sayi">{detay.sikayet_ozeti.actigi}</div></div>
            <div className="kart"><div className="kart-etiket">Arkadaş</div><div className="kart-sayi">{detay.takipler.length}</div><div className="kart-not">engellediği {detay.engelledikleri.length} · onu engelleyen {detay.onu_engelleyenler.length}</div></div>
            <div className="kart"><div className="kart-etiket">Sohbet isteği</div><div className="kart-sayi">{detay.sohbet_istekleri.length}</div><div className="kart-not">bugün {detay.bugunku_istek_sayisi} · cihaz {detay.bildirim_cihazi}</div></div>
          </div>

          {p?.biyografi && (
            <div className="blok"><h3>Biyografi</h3><div className="icerik-kutu">{p.biyografi}</div></div>
          )}

          <div className="blok">
            <h3>Check-in ve anı geçmişi <span className="sayac">{detay.check_inler.length}</span></h3>
            {detay.check_inler.length === 0 ? (
              <p className="k">Henüz check-in yok.</p>
            ) : (
              <div className="tablo-kap" style={{ border: 0 }}>
                <table>
                  <thead>
                    <tr><th>Zaman</th><th>Mekân</th><th>Not</th><th>Tür</th><th>Durum</th></tr>
                  </thead>
                  <tbody>
                    {detay.check_inler.map((c) => (
                      <tr key={c.id} className={c.moderasyon_gizli ? 'gizlenmis' : ''}>
                        <td>{zaman(c.olusturma_zamani)}</td>
                        <td>{c.mekan_adi}</td>
                        <td>{c.not_metni ?? <span className="k">—</span>}</td>
                        <td>{c.canli_mi ? <span className="rozet turuncu">Canlı</span> : <span className="rozet gri noktasiz">Anı</span>}</td>
                        <td>{c.moderasyon_gizli ? <span className="rozet kirmizi">Gizlendi</span> : <span className="k">görünür</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="blok">
            <h3>Konuşmalar <span className="sayac">{detay.konusmalar.length}</span></h3>
            <p className="ipucu" style={{ margin: '0 0 8px' }}>
              Burada yalnızca üst veri var; içerik ayrı bir erişimdir, gerekçe ister ve denetim izine ayrı yazılır.
            </p>
            {detay.konusmalar.length === 0 ? (
              <p className="k">Konuşma yok.</p>
            ) : (
              <div className="tablo-kap" style={{ border: 0 }}>
                <table>
                  <thead>
                    <tr><th>Karşı taraf</th><th>Mesaj</th><th>İlk</th><th>Son</th><th /></tr>
                  </thead>
                  <tbody>
                    {detay.konusmalar.map((k) => (
                      <tr key={k.konusma_id}>
                        <td>
                          {k.karsi_taraf ? (
                            <Link to={`/kullanicilar/${k.karsi_taraf}`}><code>{k.karsi_taraf.slice(0, 8)}</code></Link>
                          ) : <span className="k">silinmiş</span>}
                        </td>
                        <td>{k.mesaj_sayisi}</td>
                        <td>{zaman(k.ilk_mesaj)}</td>
                        <td>{zaman(k.son_mesaj)}</td>
                        <td className="sag">
                          {/* Buradan acilan her konusma KADEME 2'dir: ortada
                              sikayet baglami yok (karar 75). */}
                          <Link to={`/konusma/${k.konusma_id}`} className="dugme kucuk">Tüm konuşmayı aç</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="yapiskan">
          <div className="blok">
            <h3>Hesap durumu</h3>
            {h ? (
              <dl className="ozet">
                <dt>Durum</dt><dd><HesapRozeti durum={h.durum} /></dd>
                <dt>Bitiş</dt><dd>{h.aski_bitisi ? zaman(h.aski_bitisi) : 'süresiz'}</dd>
                <dt>Gerekçe</dt><dd>"{h.gerekce}"</dd>
                <dt>Güncellendi</dt><dd>{zaman(h.guncellendi)}</dd>
              </dl>
            ) : (
              <p className="k">Aktif · kısıt yok.</p>
            )}
          </div>

          <div className="blok tehlike">
            <h3>Hesap işlemleri</h3>
            <div className="satir">
              {h && <button type="button" onClick={() => setKutu('kaldir')}>Kısıtı kaldır</button>}
              <button type="button" onClick={() => setKutu('askiya_al')}>Askıya al · 7 gün</button>
              <button type="button" className="yikici" onClick={() => setKutu('yasakla')}>Yasakla</button>
            </div>
            <p className="ipucu" style={{ marginTop: 10 }}>Her işlem onay penceresi ve gerekçe ister; geçmiş denetim izinde kalır.</p>
          </div>
        </div>
      </div>

      {kutu === 'askiya_al' && id && (
        <GerekceSor
          baslik="Hesabı askıya al · 7 gün"
          aciklama="Askı süresince kullanıcı hiçbir şey yazamaz ve kimseye görünmez."
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
          onSonuc={(gerekce) => aksiyon('moderasyon_hesabi_yasakla', { p_kullanici_id: id, p_gerekce: gerekce })}
        />
      )}

      {kutu === 'kaldir' && id && (
        <GerekceSor
          baslik="Kısıtı kaldır"
          aciklama="Hesap yeniden aktif olur. Geçmiş denetim izinde kalır."
          eylemEtiketi="Kaldır"
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) => aksiyon('moderasyon_hesap_durumunu_kaldir', { p_kullanici_id: id, p_gerekce: gerekce })}
        />
      )}
    </section>
  )
}
