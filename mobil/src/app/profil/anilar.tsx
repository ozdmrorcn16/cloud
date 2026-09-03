import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { kullanicininAnilariniGetir, checkIniSil, checkInNotunuGuncelle, type AniGorunumu } from '../../../lib/checkin'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { anidanAkisOgesi } from '../../../lib/akis'
import { kendiProfilimiGetir } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import { gorecelZaman } from '../../../lib/zaman'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { etiketiKaldir } from '../../../lib/etiket'
import { CheckInKarti } from '../../tasarim/CheckInKarti'
import { yazi, olcek, bosluk, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
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
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [kullaniciId, setKullaniciId] = useState('')
  // Kartta kullanici adi ve kendi avatarim gorunuyor; profil bir kez okunuyor.
  const [rumuz, setRumuz] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  // Silme geri alinamaz: once onay.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)

  async function anilariYukle() {
    try {
      const { data: kullaniciVerisi } = await supabase.auth.getUser()
      const kullaniciId = kullaniciVerisi.user?.id
      if (!kullaniciId) return
      setKullaniciId(kullaniciId)
      setAnilar(await kullanicininAnilariniGetir(kullaniciId))
      // Profil okunamazsa kart ada duser; anilar yine cizilir.
      const profil = await kendiProfilimiGetir().catch(() => null)
      setRumuz(profil?.kullaniciAdi ?? null)
      setAvatarUrl(
        profil?.fotograflar?.[0] ? await profilFotografiUrl(profil.fotograflar[0]) : null
      )
      setHata(null)
    } catch (e) {
      setHata(hataMetni(e))
    }
  }

  useEffect(() => {
    anilariYukle()
  }, [])

  // Hata pencereye birakiliyor (bkz. ana sayfadaki ayni desen):
  // kayit basarisizsa pencere acik kalsin, metin kaybolmasin.
  async function notuKaydet(checkInId: string, yeniNot: string) {
    await checkInNotunuGuncelle(checkInId, yeniNot)
    const temiz = yeniNot.trim()
    setAnilar((mevcut) =>
      mevcut.map((a) =>
        a.id === checkInId ? { ...a, notMetni: temiz === '' ? null : temiz } : a
      )
    )
  }

  async function etiketiSil(checkInId: string, kullaniciId: string) {
    await etiketiKaldir(checkInId, kullaniciId)
    setAnilar((mevcut) =>
      mevcut.map((a) =>
        a.id === checkInId
          ? { ...a, etiketler: (a.etiketler ?? []).filter((e) => e.kullaniciId !== kullaniciId) }
          : a
      )
    )
  }

  async function sil(checkInId: string) {
    try {
      await checkIniSil(checkInId)
      setAnilar((mevcut) => mevcut.filter((a) => a.id !== checkInId))
      setSilOnayi(null)
    } catch (e) {
      setHata(hataMetni(e))
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
            oge={anidanAkisOgesi(item, { kullaniciId, avatarUrl, rumuz })}
            zamanYazisi={gorecelZaman(item.olusturmaZamani, t)}
            silOnayiAcik={silOnayi === item.id}
            onSilOnayi={(id) => setSilOnayi(silOnayi === id ? null : id)}
            onSil={sil}
            onNotKaydet={notuKaydet}
            onEtiketKaldir={etiketiSil}
          />
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henüz bir anın yok</Text>}
      />
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    // Yatay dolgu YOK: check-in kartlari 2026-09-02'den beri tam
    // genislikte (kullanicinin istegi) ve kendi ic dolgusunu tasiyor.
    // Burada da dolgu olsaydi ayni kart ana sayfada kenara ulasip
    // burada ulasmazdi - ayni bilesen iki ekranda farkli gorunurdu.
    paddingBottom: ALT_GEZINME_PAYI,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginBottom: bosluk.s,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
})
