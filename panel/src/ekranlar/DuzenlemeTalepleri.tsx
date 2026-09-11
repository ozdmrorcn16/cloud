import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { BosDurum, Hata, Yukleniyor, hataMetni, zaman } from '../ortak/Durum'

/**
 * MEKAN DUZENLEME TALEPLERI.
 *
 * Kullanicinin istegi (2026-09-09): kisiler mekanin adini, adresini,
 * turunu ve kapak fotografini duzeltmek icin talep gonderiyor;
 * moderator onaylayana kadar mekan kaydi DEGISMIYOR.
 *
 * NEDEN INSAN KARARI: dis kaynagin tur verisi guvenilmez (Bursa'daki
 * 6.105 "Kafe" kaydinin 5.992'si tek bir genel kategoriden geliyor ve
 * icinde pub da kantin de var) ama ad kalibiyla otomatik duzeltmek de
 * yanlis sonuc uretiyor. Karar bir insanda olmali.
 *
 * ALAN ALAN ONAY: talebin ucunden ikisi dogru, biri yanlis olabilir.
 * Hepsini birden reddetmek dogru duzeltmeyi de coepe atardi.
 */

type TalepSatiri = {
  id: string
  mekan_id: string
  mekan_adi: string
  mekan_turu: string
  onerilen_ad: string | null
  onerilen_adres: string | null
  onerilen_tur: string | null
  onerilen_mahalle: string | null
  onerilen_il: string | null
  onerilen_ilce: string | null
  kapali_bildirimi: boolean
  fotograf: string | null
  durum: string
  olusturuldu: string
}

type Detay = {
  id: string
  mekan_id: string
  mevcut_ad: string
  mevcut_adres: string | null
  mevcut_tur: string
  mevcut_mahalle: string | null
  mevcut_semt: string | null
  mevcut_il: string | null
  mevcut_kapali: boolean
  onerilen_ad: string | null
  onerilen_adres: string | null
  onerilen_tur: string | null
  onerilen_mahalle: string | null
  onerilen_il: string | null
  onerilen_ilce: string | null
  kapali_bildirimi: boolean
  fotograf: string | null
  durum: string
  gonderen_adi: string | null
  olusturuldu: string
}

const ALANLAR = [
  { anahtar: 'ad', etiket: 'Ad' },
  { anahtar: 'mahalle', etiket: 'Mahalle' },
  { anahtar: 'adres', etiket: 'Adres' },
  { anahtar: 'il', etiket: 'İl' },
  { anahtar: 'ilce', etiket: 'İlçe' },
  { anahtar: 'tur', etiket: 'Tür' },
  { anahtar: 'fotograf', etiket: 'Kapak fotoğrafı' },
  // KAPATMA VARSAYILAN OLARAK SECILI DEGIL: sonucu en agir olan alan
  // bu - onaylanirsa mekan butun listelerden ve aramadan duesueyor.
  // Moderator onu ayrica isaretlemek zorunda kalsin; "hepsini onayla"
  // refleksiyle bir mekanin kazara kapanmasi en pahali hata olurdu.
  // Ayni kural SUNUCUDA da var: RPC'nin varsayilan `p_alanlar` listesi
  // 'kapali' tasimiyor.
  { anahtar: 'kapali', etiket: 'Kapandı olarak işaretle', varsayilan: false },
]

const TUM_ALANLAR = ALANLAR.filter((a) => a.varsayilan !== false).map((a) => a.anahtar)

export function DuzenlemeTalepleri() {
  const [satirlar, setSatirlar] = useState<TalepSatiri[]>([])
  const [durum, setDurum] = useState('beklemede')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [acik, setAcik] = useState<Detay | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [secili, setSecili] = useState<string[]>(TUM_ALANLAR)
  const [not, setNot] = useState('')
  const [isliyor, setIsliyor] = useState(false)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const { data, error } = await supabase.rpc('moderasyon_duzenleme_talepleri', {
        p_durum: durum || null,
        p_limit: 50,
        p_offset: 0,
      })
      if (error) throw error
      setSatirlar((data ?? []) as TalepSatiri[])
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setYukleniyor(false)
    }
  }, [durum])

  useEffect(() => {
    yukle()
  }, [yukle])

  async function detayAc(id: string) {
    setFotoUrl(null)
    setNot('')
    setSecili(TUM_ALANLAR)
    const { data, error } = await supabase.rpc('moderasyon_duzenleme_talebi_detayi', {
      p_id: id,
    })
    if (error) {
      setHata(hataMetni(error))
      return
    }
    const detay = ((data ?? []) as Detay[])[0] ?? null
    setAcik(detay)
    // Kova private: fotografi gormek icin imzali adres gerekiyor.
    // Moderator storage politikasinda ayrica yetkili.
    if (detay?.fotograf) {
      const { data: imza } = await supabase.storage
        .from('mekan-fotograflari')
        .createSignedUrl(detay.fotograf, 60 * 60)
      setFotoUrl(imza?.signedUrl ?? null)
    }
  }

  async function kararVer(karar: 'onaylandi' | 'reddedildi') {
    if (!acik || isliyor) return
    setIsliyor(true)
    try {
      const { error } = await supabase.rpc('moderasyon_duzenleme_talebini_karara_bagla', {
        p_id: acik.id,
        p_karar: karar,
        p_alanlar: secili,
        p_not: not || null,
      })
      if (error) throw error
      setAcik(null)
      await yukle()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setIsliyor(false)
    }
  }

  async function geriAc() {
    if (!acik || isliyor) return
    setIsliyor(true)
    try {
      const { error } = await supabase.rpc('moderasyon_mekani_geri_ac', {
        p_mekan_id: acik.mekan_id,
      })
      if (error) throw error
      setAcik(null)
      await yukle()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setIsliyor(false)
    }
  }

  if (yukleniyor) return <Yukleniyor ne="Talepler" />

  return (
    <section>
      <h2>Düzenleme talepleri</h2>

      <div className="filtreler">
        <select value={durum} onChange={(e) => setDurum(e.target.value)}>
          <option value="beklemede">Bekleyen</option>
          <option value="onaylandi">Onaylanan</option>
          <option value="reddedildi">Reddedilen</option>
          <option value="">Hepsi</option>
        </select>
      </div>

      {hata && <Hata mesaj={hata} />}

      {satirlar.length === 0 ? (
        <BosDurum>Bu durumda talep yok.</BosDurum>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Mekân</th>
              <th>Önerilen</th>
              <th>Tarih</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.mekan_adi}
                  <br />
                  <small>{s.mekan_turu}</small>
                </td>
                <td>
                  {[
                    s.onerilen_ad && `Ad: ${s.onerilen_ad}`,
                    s.onerilen_mahalle && `Mahalle: ${s.onerilen_mahalle}`,
                    s.onerilen_adres && `Adres: ${s.onerilen_adres}`,
                    s.onerilen_il && `İl: ${s.onerilen_il}`,
                    s.onerilen_ilce && `İlçe: ${s.onerilen_ilce}`,
                    s.onerilen_tur && `Tür: ${s.onerilen_tur}`,
                    s.kapali_bildirimi && 'KAPANDI bildirimi',
                    s.fotograf && 'Kapak fotoğrafı',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </td>
                <td>{zaman(s.olusturuldu)}</td>
                <td>
                  <button onClick={() => detayAc(s.id)}>İncele</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {acik && (
        <div className="detay">
          <h3>{acik.mevcut_ad}</h3>
          <p>
            <small>
              {[acik.mevcut_semt, acik.mevcut_il].filter(Boolean).join(', ')} ·{' '}
              {acik.gonderen_adi ?? 'silinmiş kullanıcı'} · {zaman(acik.olusturuldu)}
            </small>
          </p>

          {/* MEVCUT ve ONERILEN YAN YANA: moderator karsilastirma
              yapmadan karar veremez. */}
          <table>
            <tbody>
              <tr>
                <th>Ad</th>
                <td>{acik.mevcut_ad}</td>
                <td>{acik.onerilen_ad ?? '—'}</td>
              </tr>
              <tr>
                <th>Mahalle</th>
                <td>{acik.mevcut_mahalle ?? '—'}</td>
                <td>{acik.onerilen_mahalle ?? '—'}</td>
              </tr>
              <tr>
                <th>Adres</th>
                <td>{acik.mevcut_adres ?? '—'}</td>
                <td>{acik.onerilen_adres ?? '—'}</td>
              </tr>
              <tr>
                <th>İl</th>
                <td>{acik.mevcut_il ?? '—'}</td>
                <td>{acik.onerilen_il ?? '—'}</td>
              </tr>
              <tr>
                <th>İlçe</th>
                <td>{acik.mevcut_semt ?? '—'}</td>
                <td>{acik.onerilen_ilce ?? '—'}</td>
              </tr>
              <tr>
                <th>Tür</th>
                <td>{acik.mevcut_tur}</td>
                <td>{acik.onerilen_tur ?? '—'}</td>
              </tr>
              <tr>
                <th>Durum</th>
                <td>{acik.mevcut_kapali ? 'Kapalı' : 'Açık'}</td>
                <td>{acik.kapali_bildirimi ? 'Kapandı bildirimi' : '—'}</td>
              </tr>
            </tbody>
          </table>

          {fotoUrl && <img src={fotoUrl} alt="Önerilen kapak fotoğrafı" width={320} />}

          <fieldset>
            <legend>Onaylanacak alanlar</legend>
            {ALANLAR.filter((a) => a.anahtar !== 'kapali' || acik.kapali_bildirimi).map((a) => (
              <label key={a.anahtar}>
                <input
                  type="checkbox"
                  checked={secili.includes(a.anahtar)}
                  onChange={(e) =>
                    setSecili((m) =>
                      e.target.checked ? [...m, a.anahtar] : m.filter((x) => x !== a.anahtar)
                    )
                  }
                />
                {a.etiket}
              </label>
            ))}
          </fieldset>

          <textarea
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Karar notu (isteğe bağlı)"
          />

          <div className="eylemler">
            <button onClick={() => kararVer('onaylandi')} disabled={isliyor}>
              Onayla
            </button>
            <button onClick={() => kararVer('reddedildi')} disabled={isliyor}>
              Reddet
            </button>
            {/* KAPATMA GERI ALINABILIR. Yanlis bir bildirim mekani
                butun listelerden duesueruyor; geri alinamayan bir
                moderasyon eylemi birakmak tek bir hatali onayi kalici
                yapardi (ayni gerekce yorum gizlemede de var). */}
            {acik.mevcut_kapali && (
              <button onClick={geriAc} disabled={isliyor}>
                Mekânı geri aç
              </button>
            )}
            <button onClick={() => setAcik(null)}>Kapat</button>
          </div>
        </div>
      )}
    </section>
  )
}
