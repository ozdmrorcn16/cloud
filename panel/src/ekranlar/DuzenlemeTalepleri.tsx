import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { BosDurum, Hata, Pencere, TalepRozeti, Yukleniyor, Zaman, hataMetni, zaman } from '../ortak/Durum'

/**
 * MEKAN DUZENLEME TALEPLERI.
 *
 * Kisiler mekanin adini, adresini, turunu ve kapak fotografini
 * duzeltmek icin talep gonderiyor; moderator onaylayana kadar mekan
 * kaydi DEGISMIYOR. Karar bir insanda: dis kaynagin tur verisi
 * guvenilmez ama ad kalibiyla otomatik duzeltmek de yanlis sonuc
 * uretiyor.
 *
 * ALAN ALAN ONAY: talebin ucunden ikisi dogru, biri yanlis olabilir.
 * Hepsini birden reddetmek dogru duzeltmeyi de cope atardi.
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
  // bu - onaylanirsa mekan butun listelerden ve aramadan dusuyor.
  // Ayni kural SUNUCUDA da var: RPC'nin varsayilan `p_alanlar` listesi
  // 'kapali' tasimiyor.
  { anahtar: 'kapali', etiket: 'Kapandı olarak işaretle', varsayilan: false },
]

const TUM_ALANLAR = ALANLAR.filter((a) => a.varsayilan !== false).map((a) => a.anahtar)

const DURUMLAR = [
  { anahtar: 'beklemede', etiket: 'Bekleyen' },
  { anahtar: 'onaylandi', etiket: 'Onaylanan' },
  { anahtar: 'reddedildi', etiket: 'Reddedilen' },
  { anahtar: '', etiket: 'Tümü' },
]

function onerilenOzeti(s: TalepSatiri): string[] {
  return [
    s.onerilen_ad && `Ad: ${s.onerilen_ad}`,
    s.onerilen_mahalle && `Mahalle: ${s.onerilen_mahalle}`,
    s.onerilen_adres && `Adres: ${s.onerilen_adres}`,
    s.onerilen_il && `İl: ${s.onerilen_il}`,
    s.onerilen_ilce && `İlçe: ${s.onerilen_ilce}`,
    s.onerilen_tur && `Tür: ${s.onerilen_tur}`,
    s.kapali_bildirimi && 'KAPANDI bildirimi',
    s.fotograf && 'Kapak fotoğrafı',
  ].filter(Boolean) as string[]
}

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
        p_durum: durum || null, p_limit: 50, p_offset: 0,
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
    const { data, error } = await supabase.rpc('moderasyon_duzenleme_talebi_detayi', { p_id: id })
    if (error) {
      setHata(hataMetni(error))
      return
    }
    const detay = ((data ?? []) as Detay[])[0] ?? null
    setAcik(detay)
    // Kova private: fotografi gormek icin imzali adres gerekiyor.
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
        p_id: acik.id, p_karar: karar, p_alanlar: secili, p_not: not || null,
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
      const { error } = await supabase.rpc('moderasyon_mekani_geri_ac', { p_mekan_id: acik.mekan_id })
      if (error) throw error
      setAcik(null)
      await yukle()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setIsliyor(false)
    }
  }

  const bekliyor = acik?.durum === 'beklemede'

  return (
    <section>
      <div className="sayfa-ust">
        <div>
          <h2>Düzenleme talepleri</h2>
          <div className="alt">Kullanıcıların mekân düzeltmeleri. Onaylanana kadar mekân kaydı değişmez; alanlar tek tek onaylanır.</div>
        </div>
      </div>

      <div className="cipler" role="tablist">
        {DURUMLAR.map((d) => (
          <button key={d.anahtar} type="button" role="tab" aria-selected={durum === d.anahtar}
            className={`cip${durum === d.anahtar ? ' aktif' : ''}`} onClick={() => setDurum(d.anahtar)}>
            {d.etiket}
          </button>
        ))}
      </div>

      <Hata mesaj={hata} onTekrar={yukle} />

      {yukleniyor ? (
        <div className="blok"><Yukleniyor satir={5} /></div>
      ) : satirlar.length === 0 ? (
        <BosDurum baslik={durum === 'beklemede' ? 'Bekleyen talep yok' : 'Bu durumda talep yok'} />
      ) : (
        <div className="tablo-kap">
          <table>
            <thead>
              <tr><th>Mekân</th><th>Önerilen değişiklik</th><th>Geldi</th><th>Durum</th><th /></tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr key={s.id} className="satir-link" tabIndex={0} onClick={() => detayAc(s.id)}
                  onKeyDown={(e) => e.key === 'Enter' && detayAc(s.id)}>
                  <td><b>{s.mekan_adi}</b><br /><span className="k">{s.mekan_turu}</span></td>
                  <td>
                    <div className="satir" style={{ gap: 6 }}>
                      {onerilenOzeti(s).map((o) => (
                        <span key={o} className={`rozet noktasiz ${o.startsWith('KAPANDI') ? 'kirmizi' : 'gri'}`}>{o}</span>
                      ))}
                    </div>
                  </td>
                  <td title={zaman(s.olusturuldu)}><Zaman deger={s.olusturuldu} /></td>
                  <td><TalepRozeti durum={s.durum} /></td>
                  <td className="sag k">İncele →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {acik && (
        <Pencere
          baslik={acik.mevcut_ad}
          aciklama={`${[acik.mevcut_semt, acik.mevcut_il].filter(Boolean).join(', ')} · ${acik.gonderen_adi ? `@${acik.gonderen_adi}` : 'silinmiş kullanıcı'} · ${zaman(acik.olusturuldu)}`}
          onKapat={() => !isliyor && setAcik(null)}
          genis
        >
          {/* MEVCUT ve ONERILEN YAN YANA: moderator karsilastirma
              yapmadan karar veremez. Degisen satir turuncu. */}
          <div className="tablo-kap" style={{ marginBottom: 12 }}>
            <table className="kiyas">
              <thead><tr><th>Alan</th><th>Mevcut</th><th>Önerilen</th></tr></thead>
              <tbody>
                {([
                  ['Ad', acik.mevcut_ad, acik.onerilen_ad],
                  ['Mahalle', acik.mevcut_mahalle, acik.onerilen_mahalle],
                  ['Adres', acik.mevcut_adres, acik.onerilen_adres],
                  ['İl', acik.mevcut_il, acik.onerilen_il],
                  ['İlçe', acik.mevcut_semt, acik.onerilen_ilce],
                  ['Tür', acik.mevcut_tur, acik.onerilen_tur],
                  ['Durum', acik.mevcut_kapali ? 'Kapalı' : 'Açık', acik.kapali_bildirimi ? 'Kapandı bildirimi' : null],
                ] as [string, string | null, string | null][]).map(([etiket, mevcut, onerilen]) => (
                  <tr key={etiket}>
                    <th>{etiket}</th>
                    <td className="ikincil">{mevcut ?? '—'}</td>
                    <td className={onerilen ? 'degisti' : 'ikincil'}>{onerilen ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fotoUrl && <img className="onizleme" src={fotoUrl} alt="Önerilen kapak fotoğrafı" />}

          {bekliyor ? (
            <>
              <fieldset>
                <legend>Onaylanacak alanlar</legend>
                {ALANLAR.filter((a) => a.anahtar !== 'kapali' || acik.kapali_bildirimi).map((a) => (
                  <label key={a.anahtar}>
                    <input
                      type="checkbox"
                      checked={secili.includes(a.anahtar)}
                      onChange={(e) =>
                        setSecili((m) => (e.target.checked ? [...m, a.anahtar] : m.filter((x) => x !== a.anahtar)))
                      }
                    />
                    {a.etiket}
                    {a.anahtar === 'kapali' && <span className="k"> · mekân bütün listelerden düşer</span>}
                  </label>
                ))}
              </fieldset>

              <label className="alan" htmlFor="talep-not">Karar notu · isteğe bağlı</label>
              <textarea id="talep-not" value={not} onChange={(e) => setNot(e.target.value)} rows={2} placeholder="Neden onaylandı ya da reddedildi" />

              <div className="pencere-dugmeler">
                <button type="button" className="hayalet" onClick={() => setAcik(null)} disabled={isliyor}>Kapat</button>
                <button type="button" onClick={() => kararVer('reddedildi')} disabled={isliyor}>Reddet</button>
                <button type="button" className="birincil" onClick={() => kararVer('onaylandi')} disabled={isliyor || secili.length === 0}>
                  {isliyor ? 'Kaydediliyor…' : `Seçili ${secili.length} alanı onayla`}
                </button>
              </div>
            </>
          ) : (
            <div className="pencere-dugmeler">
              {/* KAPATMA GERI ALINABILIR. Yanlis bir bildirim mekani butun
                  listelerden dusuruyor; geri alinamayan bir moderasyon
                  eylemi birakmak tek bir hatali onayi kalici yapardi. */}
              {acik.mevcut_kapali && (
                <button type="button" onClick={geriAc} disabled={isliyor}>Mekânı geri aç</button>
              )}
              <TalepRozeti durum={acik.durum} />
              <button type="button" className="hayalet" onClick={() => setAcik(null)}>Kapat</button>
            </div>
          )}
        </Pencere>
      )}
    </section>
  )
}
