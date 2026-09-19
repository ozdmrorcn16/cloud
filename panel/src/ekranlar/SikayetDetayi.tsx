import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  Bilgi, Hata, SikayetRozeti, Yukleniyor, hataMetni, hedefEtiketi, sebepMetni, zaman,
} from '../ortak/Durum'
import { GerekceSor } from '../ortak/GerekceSor'
import type {
  YorumOzeti, CheckInOzeti, Mesaj, Profil, SikayetDetayi as Detay, SikayetDurumu,
} from '../tipler'

type AcikKutu = 'askiya_al' | 'yasakla' | 'gizle' | 'yorum_gizle' | 'yorum_ac' | null

/**
 * SIKAYET DETAYI. Sol: sikayet, hedef icerik, hedefin gecmisi. Sag
 * (yapiskan): KARAR karti - sonuc + gerekce (bos birakilamaz) - ve
 * ayri, kirmizi "hesap islemleri" bolgesi. Yikici dugme birincil
 * turuncuyla hicbir zaman yan yana degil.
 */
export function SikayetDetayi() {
  const { id } = useParams<{ id: string }>()
  const [detay, setDetay] = useState<Detay | null>(null)
  const [gecmis, setGecmis] = useState<Detay['sikayet'][]>([])
  const [yeniDurum, setYeniDurum] = useState<SikayetDurumu>('incelendi')
  const [not, setNot] = useState('')
  const [kutu, setKutu] = useState<AcikKutu>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  // Sikayet edenin ekledigi fotograf: kova ozel, moderator kendi
  // oturumuyla imzali adres uretir (mekan-fotograflari ile ayni desen).
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)

  const yukle = useCallback(async () => {
    if (!id) return
    setYukleniyor(true)
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_sikayet_detayi', { p_sikayet_id: id })
      if (error) throw error
      const gelen = data as Detay
      setDetay(gelen)
      // Bekleyen sikayette varsayilan "Incelendi": moderator bakti,
      // henuz karar yok. Karar verilmisse mevcut durum.
      setYeniDurum(gelen.sikayet.durum === 'yeni' ? 'incelendi' : gelen.sikayet.durum)
      setNot(gelen.sikayet.moderator_notu ?? '')
      if (gelen.sikayet.fotograf) {
        const { data: imza } = await supabase.storage
          .from('sikayet-fotograflari')
          .createSignedUrl(gelen.sikayet.fotograf, 60 * 60)
        setFotoUrl(imza?.signedUrl ?? null)
      } else {
        setFotoUrl(null)
      }

      const { data: g } = await supabase.rpc('moderasyon_hedef_gecmisi', {
        p_hedef_tur: gelen.sikayet.hedef_tur,
        p_hedef_id: gelen.sikayet.hedef_id,
      })
      setGecmis((g ?? []) as Detay['sikayet'][])
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setYukleniyor(false)
    }
  }, [id])

  useEffect(() => {
    yukle()
  }, [yukle])

  async function kararVer() {
    if (!id || not.trim().length < 3) return
    setHata(null)
    setBilgi(null)
    setKaydediyor(true)
    try {
      const { error } = await supabase.rpc('moderasyon_sikayeti_karara_bagla', {
        p_sikayet_id: id,
        p_durum: yeniDurum,
        p_not: not.trim(),
      })
      if (error) throw error
      setBilgi('Karar kaydedildi ve denetim izine yazıldı.')
      await yukle()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setKaydediyor(false)
    }
  }

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
        <Link to="/sikayetler" className="geri">← Şikayetler</Link>
        <div className="blok"><Yukleniyor satir={6} /></div>
      </section>
    )
  }
  if (!detay) {
    return (
      <section>
        <Link to="/sikayetler" className="geri">← Şikayetler</Link>
        <Hata mesaj={hata ?? 'Şikayet bulunamadı'} onTekrar={yukle} />
      </section>
    )
  }

  const s = detay.sikayet
  // Aksiyonlarin hedefi HER ZAMAN bir kullanicidir: check-in'in sahibi,
  // mesajin gonderenidir. Gonderen null olabilir (hesabini silmis).
  const hedefKullaniciId: string | null =
    s.hedef_tur === 'kullanici'
      ? s.hedef_id
      : s.hedef_tur === 'check_in' || s.hedef_tur === 'yorum'
        ? ((detay.hedef as { kullanici_id?: string | null } | null)?.kullanici_id ?? null)
        : ((detay.hedef as Mesaj | null)?.gonderen_id ?? null)

  const kararVerildi = s.durum !== 'yeni'
  const notYeterli = not.trim().length >= 3

  return (
    <section>
      <Link to="/sikayetler" className="geri">← Şikayetler</Link>
      <div className="sayfa-ust">
        <div>
          <h2>{hedefEtiketi(s.hedef_tur)} şikayeti · {sebepMetni(s.sebep)}</h2>
          <div className="alt">
            {detay.sikayet_eden ? `@${detay.sikayet_eden.kullanici_adi}` : 'Hesabı silinmiş kullanıcı'} şikayet etti · {zaman(s.olusturuldu)}
            {kararVerildi && s.karar_zamani && ` · karar ${zaman(s.karar_zamani)}`}
          </div>
        </div>
        <SikayetRozeti durum={s.durum} />
      </div>

      <Hata mesaj={hata} />
      <Bilgi mesaj={bilgi} />

      <div className="iki-sutun">
        <div>
          <div className="blok">
            <h3>Şikayet</h3>
            <dl className="ozet">
              <dt>Şikayet eden</dt>
              <dd>
                {detay.sikayet_eden ? (
                  <Link to={`/kullanicilar/${detay.sikayet_eden.id}`}>
                    {detay.sikayet_eden.ad} (@{detay.sikayet_eden.kullanici_adi})
                  </Link>
                ) : 'Hesabı silinmiş'}
              </dd>
              <dt>Sebep</dt><dd>{sebepMetni(s.sebep)}</dd>
              <dt>Açıklama</dt><dd>{s.aciklama ? `"${s.aciklama}"` : <span className="k">yazılmamış</span>}</dd>
              <dt>Fotoğraf</dt>
              <dd>
                {s.fotograf
                  ? fotoUrl
                    ? <a href={fotoUrl} target="_blank" rel="noreferrer"><img className="onizleme" src={fotoUrl} alt="Şikayete eklenen fotoğraf" /></a>
                    : <span className="k">yükleniyor…</span>
                  : <span className="k">eklenmemiş</span>}
              </dd>
            </dl>
          </div>

          <div className="blok">
            <h3>Şikayet edilen {hedefEtiketi(s.hedef_tur).toLowerCase()}</h3>
            {!detay.hedef && <p className="k">İçerik artık yok (silinmiş).</p>}

            {s.hedef_tur === 'kullanici' && detay.hedef && (
              <dl className="ozet">
                <dt>Ad</dt><dd>{(detay.hedef as Profil).ad}</dd>
                <dt>Kullanıcı adı</dt>
                <dd><Link to={`/kullanicilar/${(detay.hedef as Profil).id}`}>@{(detay.hedef as Profil).kullanici_adi}</Link></dd>
                <dt>Biyografi</dt><dd>{(detay.hedef as Profil).biyografi ?? <span className="k">boş</span>}</dd>
              </dl>
            )}

            {s.hedef_tur === 'check_in' && detay.hedef && (
              <dl className="ozet">
                <dt>Mekân</dt><dd>{(detay.hedef as CheckInOzeti).mekan_adi}</dd>
                <dt>Not</dt><dd>{(detay.hedef as CheckInOzeti).not_metni ?? <span className="k">yok</span>}</dd>
                <dt>Zaman</dt><dd>{zaman((detay.hedef as CheckInOzeti).olusturma_zamani)}</dd>
                <dt>Durum</dt>
                <dd>{(detay.hedef as CheckInOzeti).moderasyon_gizli ? <span className="rozet kirmizi">Gizlendi</span> : <span className="rozet yesil">Görünür</span>}</dd>
              </dl>
            )}

            {s.hedef_tur === 'mesaj' && detay.hedef && (
              <>
                <div className="icerik-kutu">
                  {(detay.hedef as Mesaj).metin}
                  <span className="zaman">{zaman((detay.hedef as Mesaj).olusturuldu)}</span>
                </div>
                {/* KADEME 1: sikayet baglami. Varsayilan yol bu; tum konusma
                    ayri bir eylemdir ve izde ayri gorunur (karar 75). */}
                <div className="satir" style={{ marginTop: 10 }}>
                  <Link
                    to={`/konusma/${(detay.hedef as Mesaj).konusma_id}?merkez=${(detay.hedef as Mesaj).id}`}
                    className="dugme"
                  >
                    Bağlamı aç · bu mesajın çevresi
                  </Link>
                </div>
                <p className="ipucu">Konuşmayı açmak gerekçe ister ve denetim izine "özel mesaj okundu" kaydı düşer.</p>
              </>
            )}

            {s.hedef_tur === 'yorum' && detay.hedef && (
              <>
                <div className="icerik-kutu">
                  {(detay.hedef as YorumOzeti).metin}
                  <span className="zaman">{zaman((detay.hedef as YorumOzeti).olusturuldu)}</span>
                </div>
                <dl className="ozet" style={{ marginTop: 10 }}>
                  <dt>Yazıldığı paylaşım</dt>
                  <dd>
                    {(detay.hedef as YorumOzeti).mekan_adi}
                    {(detay.hedef as YorumOzeti).paylasim_notu ? ` — "${(detay.hedef as YorumOzeti).paylasim_notu}"` : ''}
                  </dd>
                  {/* IKI AYRI GIZLILIK: "sikayet uzerine gecici" ile "moderator
                      karari" ayni sey degil. Karar verilmezse gecici olan
                      sonsuza kadar surer. */}
                  <dt>Şu an</dt>
                  <dd className="satir">
                    {(detay.hedef as YorumOzeti).sikayet_gizli && <span className="rozet sari">Şikâyet üzerine geçici gizli</span>}
                    {(detay.hedef as YorumOzeti).moderasyon_gizli && <span className="rozet kirmizi">Moderasyon kararıyla gizli</span>}
                    {!(detay.hedef as YorumOzeti).sikayet_gizli && !(detay.hedef as YorumOzeti).moderasyon_gizli && <span className="rozet yesil">Görünür</span>}
                  </dd>
                </dl>
                <p className="ipucu">«Reddedildi» kararı yorumu geri getirir; «İşlem yapıldı» kalıcı olarak gizler.</p>
              </>
            )}
          </div>

          <div className="blok">
            <h3>Bu hedefin geçmişi <span className="sayac">{gecmis.length}</span></h3>
            {gecmis.length === 0 ? (
              <p className="k">Bu hedef hakkında başka şikayet yok.</p>
            ) : (
              <ul className="gecmis">
                {gecmis.map((g) => (
                  <li key={g.id}>
                    <span className="z">{zaman(g.olusturuldu)}</span>
                    <span>
                      <b>{sebepMetni(g.sebep)}</b>{' · '}
                      {g.id === s.id ? <span className="k">bu kayıt</span> : <SikayetRozeti durum={g.durum} />}
                      {g.moderator_notu && g.id !== s.id ? <span className="k"> · "{g.moderator_notu}"</span> : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="yapiskan">
          <div className="blok">
            <h3>Karar</h3>
            <label className="alan" htmlFor="sonuc">Sonuç</label>
            <select id="sonuc" value={yeniDurum} onChange={(e) => setYeniDurum(e.target.value as SikayetDurumu)}>
              <option value="incelendi">İncelendi · karar bekliyor</option>
              <option value="islem_yapildi">İşlem yapıldı</option>
              <option value="reddedildi">Reddedildi · şikayet yerinde değil</option>
            </select>
            <label className="alan" htmlFor="not">Gerekçe · zorunlu, denetim izine yazılır</label>
            <textarea
              id="not"
              value={not}
              onChange={(e) => setNot(e.target.value)}
              rows={4}
              placeholder="Kararın dayanağı: ne görüldü, hangi kurala aykırı, neden bu sonuç"
            />
            {!notYeterli && not.length > 0 && <p className="ipucu hata">En az 3 karakter yaz.</p>}
            <button
              type="button"
              className="birincil genis"
              onClick={kararVer}
              disabled={!notYeterli || kaydediyor}
              style={{ marginTop: 12 }}
            >
              {kaydediyor ? 'Kaydediliyor…' : kararVerildi ? 'Kararı güncelle' : 'Kararı kaydet'}
            </button>
          </div>

          {(hedefKullaniciId || s.hedef_tur === 'check_in' || s.hedef_tur === 'yorum') && (
            <div className="blok tehlike">
              <h3>Hesap ve içerik işlemleri</h3>
              <div className="satir">
                {hedefKullaniciId && (
                  <>
                    <button type="button" onClick={() => setKutu('askiya_al')}>Askıya al · 7 gün</button>
                    <button type="button" className="yikici" onClick={() => setKutu('yasakla')}>Yasakla</button>
                  </>
                )}
                {s.hedef_tur === 'check_in' && (
                  <button type="button" onClick={() => setKutu('gizle')}>İçeriği gizle</button>
                )}
                {s.hedef_tur === 'yorum' && detay.hedef && (
                  (detay.hedef as YorumOzeti).moderasyon_gizli ? (
                    <button type="button" onClick={() => setKutu('yorum_ac')}>Gizlemeyi kaldır</button>
                  ) : (
                    <button type="button" onClick={() => setKutu('yorum_gizle')}>Yorumu gizle</button>
                  )
                )}
              </div>
              <p className="ipucu" style={{ marginTop: 10 }}>
                Her işlem onay penceresi ve gerekçe ister. Askı ve gizleme geri alınabilir.
                {hedefKullaniciId && <> <Link to={`/kullanicilar/${hedefKullaniciId}`}>Kullanıcı detayı →</Link></>}
              </p>
            </div>
          )}
        </div>
      </div>

      {kutu === 'askiya_al' && hedefKullaniciId && (
        <GerekceSor
          baslik="Hesabı askıya al · 7 gün"
          aciklama="Askı süresince kullanıcı hiçbir şey yazamaz ve kimseye görünmez. Süre dolunca kendiliğinden aktif olur."
          eylemEtiketi="7 gün askıya al"
          onayGerekli
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_hesabi_askiya_al', {
              p_kullanici_id: hedefKullaniciId,
              p_bitis: new Date(Date.now() + 7 * 86400000).toISOString(),
              p_gerekce: gerekce,
            })
          }
        />
      )}

      {kutu === 'yasakla' && hedefKullaniciId && (
        <GerekceSor
          baslik="Hesabı kalıcı olarak yasakla"
          aciklama="Süresiz. Kaldırılana kadar kullanıcı hiçbir şey yazamaz ve kimseye görünmez."
          eylemEtiketi="Yasakla"
          onayGerekli
          onayMetni="Bu hesabı süresiz yasaklamak istediğimi onaylıyorum."
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_hesabi_yasakla', { p_kullanici_id: hedefKullaniciId, p_gerekce: gerekce })
          }
        />
      )}

      {kutu === 'gizle' && (
        <GerekceSor
          baslik="İçeriği gizle"
          aciklama="Gizlenen içerik sahibi dahil kimseye görünmez. Geri alınabilir."
          eylemEtiketi="Gizle"
          onayGerekli
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) => aksiyon('moderasyon_icerigi_gizle', { p_check_in_id: s.hedef_id, p_gerekce: gerekce })}
        />
      )}

      {kutu === 'yorum_gizle' && (
        <GerekceSor
          baslik="Yorumu gizle"
          aciklama="Gizlenen yorum yazanı dahil kimseye görünmez. Geri alınabilir."
          eylemEtiketi="Gizle"
          onayGerekli
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) => aksiyon('moderasyon_yorumu_gizle', { p_yorum_id: s.hedef_id, p_gerekce: gerekce })}
        />
      )}

      {kutu === 'yorum_ac' && (
        <GerekceSor
          baslik="Yorumun gizlemesini kaldır"
          aciklama="Yorum yeniden görünür olur. Şikâyet üzerine konan geçici gizlilik de kalkar."
          eylemEtiketi="Gizlemeyi kaldır"
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) => aksiyon('moderasyon_yorum_gizlemeyi_kaldir', { p_yorum_id: s.hedef_id, p_gerekce: gerekce })}
        />
      )}
    </section>
  )
}
