import { useRef, useState } from 'react'
import { View, Text, TextInput, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { kisiAra, type KisiSonucu } from '../../lib/kisi-ara'
import { profilFotografiUrl } from '../../lib/fotograf-url'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { AltGezinme, ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

type SatirVerisi = KisiSonucu & { fotografUrl: string | null }

export default function KisilerEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [metin, setMetin] = useState('')
  const [sonuclar, setSonuclar] = useState<SatirVerisi[]>([])
  const [durum, setDurum] = useState<string | null>(null)
  const [odakli, setOdakli] = useState(false)

  // Her arama istegine artan bir sira numarasi veriyoruz. Cevap dondugunde
  // hala en son istek miyiz diye bakiyoruz; degilsek sonucu atiyoruz.
  // Aksi halde yavas donen eski bir istek, yeni sorgunun sonuclarinin
  // uzerine yazabilir. Imzalama da async oldugu icin kontrol imzalamadan
  // sonra da yapiliyor, yoksa imzalanirken gecen surede daha yeni bir
  // istek baslamis olabilir.
  const sonIstekRef = useRef(0)

  async function metinDegisti(yeni: string) {
    setMetin(yeni)
    const istekNo = ++sonIstekRef.current

    if (yeni.trim().length < 2) {
      setSonuclar([])
      setDurum(yeni.trim().length === 0 ? null : t('kisiler.enAzIki'))
      return
    }

    try {
      const bulunanlar = await kisiAra(yeni)
      if (istekNo !== sonIstekRef.current) return

      const satirlar: SatirVerisi[] = await Promise.all(
        bulunanlar.map(async (kisi) => ({
          ...kisi,
          fotografUrl: kisi.fotograf ? await profilFotografiUrl(kisi.fotograf) : null,
        }))
      )
      if (istekNo !== sonIstekRef.current) return

      setSonuclar(satirlar)
      setDurum(satirlar.length === 0 ? t('kisiler.bulunamadi') : null)
    } catch (e) {
      if (istekNo !== sonIstekRef.current) return
      setSonuclar([])
      setDurum(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <View style={stiller.icerik}>
        <Text style={stiller.baslik}>{t('kisiler.baslik')}</Text>

        <TextInput
          style={[stiller.arama, odakli && stiller.aramaOdakli]}
          placeholder={t('kisiler.yerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          autoCapitalize="none"
          autoCorrect={false}
          value={metin}
          onChangeText={metinDegisti}
          onFocus={() => setOdakli(true)}
          onBlur={() => setOdakli(false)}
        />

        {durum && <Text style={stiller.durum}>{durum}</Text>}

        {/* Bos ekran yon veriyor: arama kutusu bosken ne yapilacagini
            soyluyor, sessiz bir bosluk birakmiyor. */}
        {!durum && sonuclar.length === 0 && metin.trim().length === 0 && (
          <Text style={stiller.ipucu}>{t('kisiler.ipucu')}</Text>
        )}

        <FlatList
          data={sonuclar}
          keyExtractor={(k) => k.id}
          contentContainerStyle={stiller.liste}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={stiller.satir}
              onPress={() => router.push(`/kullanici/${item.id}`)}
              accessibilityRole="button"
            >
              {item.fotografUrl ? (
                <Image
                  testID="kisi-fotografi"
                  source={{ uri: item.fotografUrl }}
                  style={stiller.fotograf}
                />
              ) : (
                // Fotografi olmayan icin bas harf: bos bir daire
                // birakmak satiri eksik gosteriyor.
                <View style={[stiller.fotograf, stiller.fotografYok]}>
                  <Text style={stiller.basHarf}>
                    {(item.ad || item.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
                  </Text>
                </View>
              )}
              <View style={stiller.satirOrta}>
                <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                  {item.kullaniciAdi}
                </Text>
                <Text style={stiller.ad} numberOfLines={1}>
                  {item.ad}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>

      <AltGezinme />
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    flex: 1,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
  },

  baslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.l,
  },

  arama: {
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
  aramaOdakli: { borderColor: renk.turuncu },

  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinSoluk,
    marginTop: bosluk.m,
  },

  liste: { paddingTop: bosluk.m, paddingBottom: ALT_GEZINME_PAYI },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  fotograf: { width: 44, height: 44, borderRadius: 22 },
  fotografYok: {
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.baslikKalin,
    fontSize: olcek.altBaslik,
    color: renk.turuncu,
  },
  satirOrta: { flex: 1 },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  ad: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
})
