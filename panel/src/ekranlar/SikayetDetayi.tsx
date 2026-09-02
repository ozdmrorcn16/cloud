import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { Hata, Yukleniyor, hataMetni, zaman } from '../ortak/Durum'
import { GerekceSor } from '../ortak/GerekceSor'
import type { YorumOzeti, CheckInOzeti, Mesaj, Profil, SikayetDetayi as Detay, SikayetDurumu } from '../tipler'

type AcikKutu = 'askiya_al' | 'yasakla' | 'gizle' | 'yorum_gizle' | 'yorum_ac' | null

export function SikayetDetayi() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detay, setDetay] = useState<Detay | null>(null)
  const [gecmis, setGecmis] = useState<Detay['sikayet'][]>([])
  const [yeniDurum, setYeniDurum] = useState<SikayetDurumu>('incelendi')
  const [not, setNot] = useState('')
  const [kutu, setKutu] = useState<AcikKutu>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    if (!id) return
    setYukleniyor(true)
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_sikayet_detayi', {
        p_sikayet_id: id,
      })
      if (error) throw error
      const gelen = data as Detay
      setDetay(gelen)
      setYeniDurum(gelen.sikayet.durum)
      setNot(gelen.sikayet.moderator_notu ?? '')

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
    if (!id) return
    setHata(null)
    try {
      const { error } = await supabase.rpc('moderasyon_sikayeti_karara_bagla', {
        p_sikayet_id: id,
        p_durum: yeniDurum,
        p_not: not.trim() || null,
      })
      if (error) throw error
      setBilgi('Karar kaydedildi.')
      await yukle()
    } catch (e) {
      setHata(hataMetni(e))
    }
  }

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

  if (yukleniyor) return <Yukleniyor ne="Şikayet" />
  if (!detay) return <Hata mesaj={hata ?? 'Şikayet bulunamadı'} />

  const s = detay.sikayet
  // Aksiyonlarin hedefi HER ZAMAN bir kullanicidir: check-in'in sahibi,
  // mesajin gonderenidir. Gonderen null olabilir (hesabini silmis), o
  // durumda hesap aksiyonu gosterilmez.
  const hedefKullaniciId: string | null =
    s.hedef_tur === 'kullanici'
      ? s.hedef_id
      : s.hedef_tur === 'check_in' || s.hedef_tur === 'yorum'
        ? ((detay.hedef as { kullanici_id?: string | null } | null)?.kullanici_id ?? null)
        : ((detay.hedef as Mesaj | null)?.gonderen_id ?? null)

  return (
    <section>
      <Link to="/sikayetler">← Şikayetler</Link>
      <h2>Şikayet detayı</h2>

      <Hata mesaj={hata} />
      {bilgi && <p className="durum bilgi">{bilgi}</p>}

      <dl className="ozet">
        <dt>Tarih</dt><dd>{zaman(s.olusturuldu)}</dd>
        <dt>Sebep</dt><dd>{s.sebep}</dd>
        <dt>Açıklama</dt><dd>{s.aciklama ?? '—'}</dd>
        <dt>Durum</dt><dd>{s.durum}</dd>
        <dt>Şikayet eden</dt>
        <dd>
          {detay.sikayet_eden
            ? `${detay.sikayet_eden.ad} (@${detay.sikayet_eden.kullanici_adi})`
            : 'Hesabı silinmiş'}
        </dd>
      </dl>

      <h3>Şikayet edilen içerik</h3>
      {s.hedef_tur === 'kullanici' && detay.hedef && (
        <dl className="ozet">
          <dt>Ad</dt><dd>{(detay.hedef as Profil).ad}</dd>
          <dt>Kullanıcı adı</dt><dd>@{(detay.hedef as Profil).kullanici_adi}</dd>
          <dt>Biyografi</dt><dd>{(detay.hedef as Profil).biyografi ?? '—'}</dd>
        </dl>
      )}

      {s.hedef_tur === 'check_in' && detay.hedef && (
        <dl className="ozet">
          <dt>Mekan</dt><dd>{(detay.hedef as CheckInOzeti).mekan_adi}</dd>
          <dt>Not</dt><dd>{(detay.hedef as CheckInOzeti).not_metni ?? '—'}</dd>
          <dt>Zaman</dt><dd>{zaman((detay.hedef as CheckInOzeti).olusturma_zamani)}</dd>
          <dt>Gizli mi</dt>
          <dd>{(detay.hedef as CheckInOzeti).moderasyon_gizli ? 'Evet' : 'Hayır'}</dd>
        </dl>
      )}

      {s.hedef_tur === 'mesaj' && detay.hedef && (
        <>
          <blockquote className="mesaj">{(detay.hedef as Mesaj).metin}</blockquote>
          <p>
            {/* KADEME 1: sikayet baglami. Varsayilan yol bu; tum konusma
                ayri bir eylemdir ve izde ayri gorunur (karar 75). */}
            <Link
              to={`/konusma/${(detay.hedef as Mesaj).konusma_id}?merkez=${(detay.hedef as Mesaj).id}`}
              className="birincil dugme"
            >
              Bağlamı aç (bu mesajın çevresi)
            </Link>
          </p>
        </>
      )}

      {s.hedef_tur === 'yorum' && detay.hedef && (
        <>
          <blockquote className="mesaj">{(detay.hedef as YorumOzeti).metin}</blockquote>
          {/* BAGLAM: yorumun hangi paylasima yazildigi olmadan "bu taciz
              mi" sorusu cevaplanamaz. */}
          <dl className="ozet">
            <dt>Yazıldığı paylaşım</dt>
            <dd>
              {(detay.hedef as YorumOzeti).mekan_adi}
              {(detay.hedef as YorumOzeti).paylasim_notu
                ? ` — ${(detay.hedef as YorumOzeti).paylasim_notu}`
                : ''}
            </dd>
            <dt>Zaman</dt><dd>{zaman((detay.hedef as YorumOzeti).olusturuldu)}</dd>
            {/* IKI AYRI GIZLILIK: "sikayet uzerine gecici" ile
                "moderator karari" ayni sey degil. Karar verilmezse
                gecici olan sonsuza kadar surer - bu ayrimi gormek
                moderatorun isi. */}
            <dt>Şikâyet üzerine gizli</dt>
            <dd>{(detay.hedef as YorumOzeti).sikayet_gizli ? 'Evet (geçici)' : 'Hayır'}</dd>
            <dt>Moderasyon kararıyla gizli</dt>
            <dd>{(detay.hedef as YorumOzeti).moderasyon_gizli ? 'Evet' : 'Hayır'}</dd>
          </dl>
          <p className="ipucu">
            Kararı «Reddedildi» yaparsan yorum geri gelir; «İşlem yapıldı»
            yaparsan kalıcı olarak gizlenir.
          </p>
        </>
      )}

      <h3>Karar</h3>
      <div className="karar-formu">
        <select value={yeniDurum} onChange={(e) => setYeniDurum(e.target.value as SikayetDurumu)}>
          <option value="yeni">Yeni</option>
          <option value="incelendi">İncelendi</option>
          <option value="islem_yapildi">İşlem yapıldı</option>
          <option value="reddedildi">Reddedildi</option>
        </select>
        <textarea
          value={not}
          onChange={(e) => setNot(e.target.value)}
          rows={3}
          placeholder="Moderatör notu"
        />
        <button className="birincil" onClick={kararVer}>Kararı kaydet</button>
      </div>

      <h3>İşlemler</h3>
      <div className="aksiyonlar">
        {hedefKullaniciId && (
          <>
            <button onClick={() => setKutu('askiya_al')}>Hesabı askıya al</button>
            <button className="yikici" onClick={() => setKutu('yasakla')}>Hesabı yasakla</button>
            <Link to={`/kullanicilar/${hedefKullaniciId}`}>Kullanıcı detayı</Link>
          </>
        )}
        {s.hedef_tur === 'check_in' && (
          <button onClick={() => setKutu('gizle')}>İçeriği gizle</button>
        )}
        {s.hedef_tur === 'yorum' && detay.hedef && (
          (detay.hedef as YorumOzeti).moderasyon_gizli ? (
            <button onClick={() => setKutu('yorum_ac')}>Gizlemeyi kaldır</button>
          ) : (
            <button onClick={() => setKutu('yorum_gizle')}>Yorumu gizle</button>
          )
        )}
      </div>

      <h3>Bu hedefin geçmişi ({gecmis.length})</h3>
      <ul className="gecmis">
        {gecmis.map((g) => (
          <li key={g.id}>
            {zaman(g.olusturuldu)} — {g.sebep} — <strong>{g.durum}</strong>
            {g.moderator_notu ? ` — ${g.moderator_notu}` : ''}
          </li>
        ))}
      </ul>

      {kutu === 'askiya_al' && hedefKullaniciId && (
        <GerekceSor
          baslik="Hesabı askıya al"
          aciklama="Askı süresi boyunca kullanıcı hiçbir şey yazamaz ve kimseye görünmez. Süre dolunca kendiliğinden aktif olur."
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
            aksiyon('moderasyon_hesabi_yasakla', {
              p_kullanici_id: hedefKullaniciId,
              p_gerekce: gerekce,
            })
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
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_icerigi_gizle', {
              p_check_in_id: s.hedef_id,
              p_gerekce: gerekce,
            })
          }
        />
      )}

      {kutu === 'yorum_gizle' && (
        <GerekceSor
          baslik="Yorumu gizle"
          aciklama="Gizlenen yorum yazanı dahil kimseye görünmez. Geri alınabilir."
          eylemEtiketi="Gizle"
          onayGerekli
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_yorumu_gizle', {
              p_yorum_id: s.hedef_id,
              p_gerekce: gerekce,
            })
          }
        />
      )}

      {kutu === 'yorum_ac' && (
        <GerekceSor
          baslik="Yorumun gizlemesini kaldır"
          aciklama="Yorum yeniden görünür olur. Şikâyet üzerine konan geçici gizlilik de kalkar."
          eylemEtiketi="Gizlemeyi kaldır"
          onIptal={() => setKutu(null)}
          onSonuc={(gerekce) =>
            aksiyon('moderasyon_yorum_gizlemeyi_kaldir', {
              p_yorum_id: s.hedef_id,
              p_gerekce: gerekce,
            })
          }
        />
      )}

      <button className="gizli-dugme" onClick={() => navigate('/sikayetler')} hidden>
        geri
      </button>
    </section>
  )
}
