import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiniDegistir,
} from '../../../lib/kullanici-adi'
import { kullaniciAdiDurumunuGetir } from '../../../lib/ayarlar'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

function tarihiBicimlendir(tarih: Date): string {
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

/**
 * Kullanici adi degistirme.
 *
 * Ayarlar listesinden ayri bir ekrana alindi: metin girdisi olan bir
 * alan liste satirinin icinde durmamali, klavye acilinca liste
 * kayiyor. 30 gun kurali burada yalnizca GOSTERILIYOR; baglayici
 * kontrol sunucuda (kullanici_adi_degistir RPC'si).
 */
export default function KullaniciAdiEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [yeniAd, setYeniAd] = useState('')
  const [sonuc, setSonuc] = useState<string | null>(null)
  const [odakli, setOdakli] = useState(false)
  const [durum, setDurum] = useState<{
    kullaniciAdi: string
    sonrakiDegisimTarihi: Date | null
  } | null>(null)

  async function durumuYukle() {
    try {
      setDurum(await kullaniciAdiDurumunuGetir())
    } catch (e) {
      setSonuc(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  useEffect(() => {
    durumuYukle()
  }, [])

  async function guncelle() {
    const normal = kullaniciAdiniNormallestir(yeniAd)
    if (!kullaniciAdiGecerliMi(normal)) {
      setSonuc(KULLANICI_ADI_KURALI)
      return
    }
    try {
      await kullaniciAdiniDegistir(normal)
      setSonuc(t('kullaniciAdiEkrani.guncellendi'))
      setYeniAd('')
      // Tazeleme BEKLENMIYOR: sonucu gostermek icin sunucuya ikinci kez
      // gitmeyi beklemek gereksiz, ustelik ic ice await zinciri testlerde
      // cakisan act() cagrilari uretiyordu.
      void durumuYukle()
    } catch (e) {
      setSonuc(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  const beklemeVar =
    durum?.sonrakiDegisimTarihi != null && durum.sonrakiDegisimTarihi > new Date()

  return (
    <View style={stiller.kok}>
      <UstCubuk
        baslik={t('kullaniciAdiEkrani.baslik')}
        geriEtiketi={t('kullaniciAdiEkrani.geri')}
      />

      <View style={stiller.icerik}>
        <Text style={stiller.etiket}>{t('kullaniciAdiEkrani.mevcut')}</Text>
        <Text style={stiller.mevcut}>{durum?.kullaniciAdi ?? ''}</Text>

        <TextInput
          style={[stiller.girdi, odakli && stiller.girdiOdakli]}
          placeholder={t('kullaniciAdiEkrani.yerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          autoCapitalize="none"
          autoCorrect={false}
          value={yeniAd}
          onChangeText={setYeniAd}
          onFocus={() => setOdakli(true)}
          onBlur={() => setOdakli(false)}
        />

        <Text style={stiller.ipucu}>{sonuc ?? KULLANICI_ADI_KURALI}</Text>

        {beklemeVar && (
          <Text style={stiller.ipucu}>
            {t('kullaniciAdiEkrani.sonrakiDegisim', {
              tarih: tarihiBicimlendir(durum!.sonrakiDegisimTarihi!),
            })}
          </Text>
        )}

        <Pressable style={stiller.birincil} onPress={guncelle} accessibilityRole="button">
          <Text style={stiller.birincilYazi}>{t('kullaniciAdiEkrani.kaydet')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingHorizontal: bosluk.xl, paddingTop: bosluk.s, paddingBottom: ALT_GEZINME_PAYI },

  etiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  mevcut: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: bosluk.xl,
  },

  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },

  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.xl,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
