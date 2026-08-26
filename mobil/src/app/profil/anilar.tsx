import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { kullanicininAnilariniGetir, checkIniSil, type AniGorunumu } from '../../../lib/checkin'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import type { AkisOgesi } from '../../../lib/akis'
import { gorecelZaman } from '../../../lib/zaman'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { CheckInKarti } from '../../tasarim/CheckInKarti'
import { renk, yazi, olcek, bosluk } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'

/**
 * ANILARIM.
 *
 * Kullanicinin karari (2026-08-26): "Anasayfaya dusen, kullanicinin
 * profilinde anilarda gorunecek" ve "ortak olsun". Ekran artik kendi
 * satir duzenini cizmiyor, ana sayfadaki `CheckInKarti`'nin AYNISINI
 * kullaniyor - ayni icerigin iki farkli okunusu olmasin diye.
 *
 * Onceki duzende "Haritada ac" cihazin harita uygulamasini aciyordu;
 * artik karta basmak uygulama ICINDEKI harita ekranini aciyor, oradan
 * da harita uygulamasina cikilabiliyor.
 */
export default function AnilarEkrani() {
  const { t } = useDil()
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [hata, setHata] = useState<string | null>(null)
  // Silme geri alinamaz: once onay.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)

  async function anilariYukle() {
    try {
      const { data: kullaniciVerisi } = await supabase.auth.getUser()
      const kullaniciId = kullaniciVerisi.user?.id
      if (!kullaniciId) return
      setAnilar(await kullanicininAnilariniGetir(kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(hataMetni(e))
    }
  }

  useEffect(() => {
    anilariYukle()
  }, [])

  async function sil(checkInId: string) {
    try {
      await checkIniSil(checkInId)
      setAnilar((mevcut) => mevcut.filter((a) => a.id !== checkInId))
      setSilOnayi(null)
    } catch (e) {
      setHata(hataMetni(e))
    }
  }

  /**
   * Ani satirini kartin bekledigi bicime cevirir.
   *
   * Burasi HEP kendi anilarim: `benimMi` sabit true, dolayisiyla silme
   * dugmesi her satirda var.
   */
  function karta(ani: AniGorunumu): AkisOgesi {
    return {
      id: ani.id,
      kullaniciId: '',
      kullaniciAdi: ani.kullaniciAdi,
      mekanId: ani.mekanId,
      mekanAdi: ani.mekanAdi,
      notMetni: ani.notMetni,
      fotografUrl: ani.fotografUrl,
      olusturmaZamani: ani.olusturmaZamani,
      canliMi: ani.canliMi,
      benimMi: true,
      etiketler: ani.etiketler,
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <UstCubuk baslik="Anılarım" geriEtiketi="Geri" />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <FlatList
        data={anilar}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CheckInKarti
            oge={karta(item)}
            zamanYazisi={gorecelZaman(item.olusturmaZamani, t)}
            silOnayiAcik={silOnayi === item.id}
            onSilOnayi={(id) => setSilOnayi(silOnayi === id ? null : id)}
            onSil={sil}
          />
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henüz bir anın yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.l,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.s,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
})
