import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  engellediklerimiListele,
  engeliKaldir,
  type EngelliKisi,
} from '../../../lib/engelleme'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { AltGezinme, ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

function GeriIkonu() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={renk.metin}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Engellenenler listesi.
 *
 * Kullanicinin istegi (2026-08-25): engellenenler ayarlarin altinda bir
 * liste olarak dursun. Bu ekran olmadan engelleme TEK YONLU bir kapiydi
 * - engelleyebiliyordun ama kimi engelledigini goremiyor, geri de
 * alamiyordun.
 *
 * Isimler ayri bir RPC'den (engellediklerim) geliyor: profiller'in
 * RLS'i baskasinin satirini gostermiyor ve kimlikleri ada ceviren
 * bag_kisileri engellenmisleri bilerek eliyor.
 */
export default function EngellenenlerEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [kisiler, setKisiler] = useState<EngelliKisi[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function yukle() {
    try {
      setKisiler(await engellediklerimiListele())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    yukle()
  }, [])

  // Iyimser guncelleme YOK: satir yalnizca sunucu onayladiktan sonra
  // listeden kalkiyor. Basarisiz bir kaldirma, engel kalkmis gibi
  // gostermemeli.
  async function kaldir(kullaniciId: string) {
    try {
      await engeliKaldir(kullaniciId)
      setKisiler((mevcut) => mevcut.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <View style={stiller.ustCubuk}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('engellenenler.geri')}
          hitSlop={12}
        >
          <GeriIkonu />
        </Pressable>
        <Text style={stiller.baslik} accessibilityRole="header">
          {t('engellenenler.baslik')}
        </Text>
      </View>

      <FlatList
        data={kisiler}
        keyExtractor={(k) => k.id}
        contentContainerStyle={stiller.liste}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={hata ? <Text style={stiller.hata}>{hata}</Text> : null}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.avatar}>
              <Text style={stiller.basHarf}>
                {(item.ad || item.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
              </Text>
            </View>
            <View style={stiller.satirOrta}>
              <Text style={stiller.ad} numberOfLines={1}>
                {item.ad}
              </Text>
              <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                @{item.kullaniciAdi}
              </Text>
            </View>
            <Pressable onPress={() => kaldir(item.id)} accessibilityRole="button" hitSlop={8}>
              <Text style={stiller.kaldirYazi}>{t('engellenenler.engeliKaldir')}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          yukleniyor ? null : (
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('engellenenler.bosBaslik')}</Text>
              <Text style={stiller.bosAciklama}>{t('engellenenler.bosAciklama')}</Text>
            </View>
          )
        }
      />

      <AltGezinme />
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },

  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.m,
  },
  baslik: {
    flexShrink: 1,
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },

  liste: { paddingHorizontal: bosluk.xl, paddingBottom: ALT_GEZINME_PAYI },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },

  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // Engellenen kisinin avatari turuncu DEGIL: turuncu eylem ve
    // canlilik demek, burada ikisi de yok.
    backgroundColor: renk.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.baslikKalin,
    fontSize: olcek.altBaslik,
    color: renk.metinIkincil,
  },
  satirOrta: { flex: 1 },
  ad: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  kullaniciAdi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
  kaldirYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.m,
    paddingVertical: 7,
    overflow: 'hidden',
  },

  bosAlan: { paddingTop: bosluk.xl },
  bosBaslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
})
