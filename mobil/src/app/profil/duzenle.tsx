import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { kendiProfilimiGetir, profiliGuncelle } from '../../../lib/profil'
import {
  instagramNormallestir,
  instagramGecerliMi,
  INSTAGRAM_EN_FAZLA,
} from '../../../lib/instagram'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/** Biyografinin en fazla uzunlugu. */
const EN_FAZLA_BIYOGRAFI = 160

/**
 * PROFILINI DUZENLE.
 *
 * Kullanicinin istegi (2026-08-27): ad-soyad, kullanici adi ve
 * biyografi buradan degistirilsin.
 *
 * BIYOGRAFININ ILK GIRIS NOKTASI BURASI. Alan veritabaninda hep vardi
 * ama yalnizca hesap olusturma adiminda soruluyordu; o adim
 * sadelestirilince (kullanicinin karari) biyografi yazmanin hicbir
 * yolu kalmamisti.
 *
 * KULLANICI ADI BURADA DEGIL, kendi ekraninda degistiriliyor ve buradan
 * o ekrana gidiliyor. Sebebi: kullanici adinin 30 GUNDE BIR degisme
 * kurali, musaitlik sorgusu ve sunucu tarafi kisiti zaten o ekranda
 * kurulu; ayni mantigi burada ikinci kez yazmak iki yerde iki farkli
 * davranis riski demek.
 */
export default function ProfilDuzenleEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()

  const [ad, setAd] = useState('')
  const [biyografi, setBiyografi] = useState('')
  const [instagram, setInstagram] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [odakli, setOdakli] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [kaydediliyor, setKaydediliyor] = useState(false)

  useEffect(() => {
    let gecerli = true
    kendiProfilimiGetir()
      .then((profil) => {
        if (!gecerli || !profil) return
        setAd(profil.ad)
        setBiyografi(profil.biyografi ?? '')
        setInstagram(profil.instagram ?? '')
        setKullaniciAdi(profil.kullaniciAdi)
      })
      .catch((e) => {
        if (gecerli) setHata(hataMetni(e))
      })
    return () => {
      gecerli = false
    }
  }, [])

  async function kaydet() {
    setHata(null)
    setBilgi(null)

    if (ad.trim().length === 0) {
      setHata(t('profilDuzenle.adHata'))
      return
    }

    /*
     * INSTAGRAM ONCE NORMALLESTIRILIYOR, sonra dogrulaniyor. Insanlar
     * bu alana `@orcun` ya da yapistirilmis bir adres yaziyor; ucunu
     * de kabul edip ayni degere indirmek "yanlis yazdin" demekten iyi.
     * Bos birakmak alani TEMIZLIYOR - kisi baglantisini kaldirabilmeli.
     */
    const instagramSade = instagramNormallestir(instagram)
    if (instagramSade.length > 0 && !instagramGecerliMi(instagramSade)) {
      setHata(t('profilDuzenle.instagramHata'))
      return
    }

    setKaydediliyor(true)
    try {
      await profiliGuncelle({
        ad: ad.trim(),
        biyografi: biyografi.trim() || null,
        instagram: instagramSade || null,
      })
      // Normallesmis hali ekrana yaziliyor: kisi ne kaydedildigini
      // gorsun, "@" ile yazdiysa onun duestuegunu anlasin.
      setInstagram(instagramSade)
      setBilgi(t('profilDuzenle.kaydedildi'))
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('profilDuzenle.baslik')} geriEtiketi={t('ortak.geri')} />

      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        {hata && <Text style={stiller.hata}>{hata}</Text>}
        {bilgi && !hata && <Text style={stiller.bilgi}>{bilgi}</Text>}

        <Text style={stiller.etiket}>{t('profilDuzenle.adEtiket')}</Text>
        <TextInput
          style={[stiller.girdi, odakli === 'ad' && stiller.girdiOdakli]}
          placeholder={t('profilDuzenle.adYerTutucu')}
          placeholderTextColor={renk.metinIkincil}
          value={ad}
          onChangeText={(y) => {
            setAd(y)
            setBilgi(null)
          }}
          onFocus={() => setOdakli('ad')}
          onBlur={() => setOdakli(null)}
        />

        {/* Kullanici adi kendi ekraninda: 30 gun kurali ve musaitlik
            sorgusu orada kurulu. */}
        <Text style={stiller.etiket}>{t('profilDuzenle.kullaniciAdiEtiket')}</Text>
        <Pressable
          style={[stiller.girdi, stiller.satir]}
          onPress={() => router.push('/profil/kullanici-adi')}
          accessibilityRole="button"
          accessibilityLabel={t('profilDuzenle.kullaniciAdiEtiket')}
        >
          <Text style={stiller.satirYazi}>{kullaniciAdi ?? ''}</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M9 6l6 6-6 6"
              stroke={renk.metinSoluk}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Pressable>

        <View style={stiller.etiketSatiri}>
          <Text style={stiller.etiket}>{t('profilDuzenle.biyografiEtiket')}</Text>
          <Text style={stiller.sayac}>
            {biyografi.length}/{EN_FAZLA_BIYOGRAFI}
          </Text>
        </View>
        <TextInput
          style={[stiller.girdi, stiller.cokSatirli, odakli === 'bio' && stiller.girdiOdakli]}
          placeholder={t('profilDuzenle.biyografiYerTutucu')}
          placeholderTextColor={renk.metinIkincil}
          value={biyografi}
          onChangeText={(y) => {
            setBiyografi(y)
            setBilgi(null)
          }}
          onFocus={() => setOdakli('bio')}
          onBlur={() => setOdakli(null)}
          multiline
          maxLength={EN_FAZLA_BIYOGRAFI}
        />
        <Text style={stiller.etiket}>{t('profilDuzenle.instagramEtiket')}</Text>
        <View style={[stiller.girdi, stiller.onekli, odakli === 'ig' && stiller.girdiOdakli]}>
          {/* "@" ALANIN ICINDE, SABIT: kullanicinin onu yazmasi
              gerekmiyor ve alanin ne bekledigi bakar bakmaz anlasiliyor.
              Yine de yazan olursa normallestirme onu atiyor. */}
          <Text style={stiller.onek}>@</Text>
          <TextInput
            style={stiller.oneksizGirdi}
            placeholder={t('profilDuzenle.instagramYerTutucu')}
            placeholderTextColor={renk.metinIkincil}
            value={instagram}
            onChangeText={(y) => {
              setInstagram(y)
              setBilgi(null)
            }}
            onFocus={() => setOdakli('ig')}
            onBlur={() => setOdakli(null)}
            autoCapitalize="none"
            autoCorrect={false}
            // Yapistirilan bir adres 30 karakteri asabiliyor; sinir
            // normallestirmeden SONRA dogrulaniyor, girdide degil.
            maxLength={INSTAGRAM_EN_FAZLA + 40}
            testID="instagram-girdisi"
          />
        </View>
        <Text style={stiller.ipucu}>{t('profilDuzenle.instagramIpucu')}</Text>

        <Pressable
          style={stiller.birincil}
          onPress={kaydet}
          disabled={kaydediliyor}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>
            {kaydediliyor ? t('profilDuzenle.kaydediliyor') : t('ortak.kaydet')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  etiketSatiri: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.xs,
    marginTop: bosluk.l,
  },
  sayac: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },

  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 15,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },
  cokSatirli: { height: 96, textAlignVertical: 'top', paddingTop: 14 },
  /*
   * ONEKLI GIRDI: "@" alanin icinde sabit duruyor, yazi onun sagindan
   * basliyor. Dikey dolgu SIFIRLANIYOR cunku artik yuksekligi iceride
   * duran `TextInput` belirliyor; `girdi`nin 15'lik dolgusu ustune
   * binseydi alan digerlerinden uzun olurdu.
   */
  onekli: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 0,
  },
  onek: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  oneksizGirdi: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 2,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },

  satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  satirYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginTop: bosluk.m,
  },
  bilgi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    marginTop: bosluk.m,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
