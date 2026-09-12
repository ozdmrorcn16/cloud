import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  FlatList,
  Dimensions,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useRouter } from 'expo-router'
import { mekanFotograflariniGetir, MEKAN_FOTOGRAF_SAYFA, type MekanFotografi } from '../../lib/mekan-sayfasi'
import { gorecelZaman } from '../../lib/zaman'
import { useDil } from '../../lib/dil'
import { YakinlastirilabilirGorsel } from './YakinlastirilabilirGorsel'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'

/**
 * MEKANIN FOTOGRAF ALANI (kullanicinin istegi 2026-09-13).
 *
 * "Konumlara bir fotograf alani olustur, check-in'lere konan fotograflar
 * orada gorunecek." Uc sutunlu kare izgara; dokununca BUYUK GORUNUM:
 * siyah zemin, ustte "1 / N" sayaci, kaydirarak sonraki fotograf, altta
 * kim / nerede / ne zaman (kullanicinin verdigi ornek: avatar,
 * "Muhammed G 'de Salepci Dayi", "13 yil once").
 *
 * ALTYAZIDA BULUNMA EKI YOK ("...'da"), bilerek: ek unlu uyumuyla
 * uretildi ve test gercek bir hata yakaladi - "Muayene Istasyonu'da"
 * yazdi, dogrusu "Istasyonu'nda" (iyelik ekli tamlamada kaynastirma n).
 * "Dayi'da" ile "Merkezi'nde"yi sozluk olmadan ayirt etmek mumkun
 * degil; yanlis ek gostermektense uc satir: ad, mekan, zaman.
 *
 * GORUNURLUK BU BILESENDE KURULMUYOR: RPC `security invoker`, kova
 * politikasi ayni satira bagli. Gelen her fotograf zaten cagiranin
 * gorebildigi bir check-in'e ait.
 *
 * BUYUK GORUNUMDE KAYDIRMA TEK PARMAK, YAKINLASTIRILMIS GORUNTUYU
 * GEZMEK IKI PARMAK: yatay sayfa listesi tek parmagi kullaniyor;
 * yakinlastirma bileseni tek parmagi da alsaydi iki hareket cakisirdi.
 * Akis kartinda da ayni ayrim var (`kaydirmaParmagi={2}`).
 */

const SUTUN = 3
const ARALIK = 2

type Props = {
  mekanId: string
  mekanAdi: string
  /** Kimlik -> imzali profil fotografi; sayfa tek sozlukte biriktiriyor. */
  avatarlar: Record<string, string | null>
  /** Yeni kimlikler gorulunce sayfadan avatar istenir. */
  onKimlikler?: (kimlikler: string[]) => void
}

export function MekanFotografGalerisi({ mekanId, mekanAdi, avatarlar, onKimlikler }: Props) {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()

  const [fotograflar, setFotograflar] = useState<MekanFotografi[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [dahaVar, setDahaVar] = useState(false)
  const [acikIndeks, setAcikIndeks] = useState<number | null>(null)
  const [genislik, setGenislik] = useState(Dimensions.get('window').width)
  // Buyuk gorunumde sayfa YUKSEKLIGI de acikca verilmek zorunda:
  // yatay bir listenin icindeki `flex: 1` sayfa yukseklik almiyor ve
  // fotograf 0 px yuksekliginde ciziliyordu (ekran goruntusuyle
  // yakalandi - siyah ekran, sayac ve altyazi var, fotograf yok).
  // Akis kartindaki "genislik sifir" tuzaginin dikey kardesi.
  const [sayfaYuksekligi, setSayfaYuksekligi] = useState(
    Math.round(Dimensions.get('window').height * 0.7)
  )
  const onKimliklerRef = useRef(onKimlikler)
  onKimliklerRef.current = onKimlikler

  useEffect(() => {
    let gecerli = true
    setYukleniyor(true)
    mekanFotograflariniGetir(mekanId)
      .then((d) => {
        if (!gecerli) return
        setFotograflar(d)
        setDahaVar(d.length >= MEKAN_FOTOGRAF_SAYFA)
        onKimliklerRef.current?.(d.map((f) => f.kullaniciId))
      })
      .catch(() => {})
      .finally(() => gecerli && setYukleniyor(false))
    return () => {
      gecerli = false
    }
  }, [mekanId])

  async function dahaFazla() {
    try {
      const yeni = await mekanFotograflariniGetir(mekanId, fotograflar.length)
      setFotograflar((onceki) => {
        // Ofset sayfalama araya giren yeni bir fotografla kayabilir;
        // ayni kimlik iki kez gelirse ikincisi atlanir.
        const var_ = new Set(onceki.map((f) => f.id))
        return [...onceki, ...yeni.filter((f) => !var_.has(f.id))]
      })
      setDahaVar(yeni.length >= MEKAN_FOTOGRAF_SAYFA)
      onKimliklerRef.current?.(yeni.map((f) => f.kullaniciId))
    } catch {
      setDahaVar(false)
    }
  }

  const kareBoyu = Math.floor((genislik - ARALIK * (SUTUN - 1)) / SUTUN)
  const acik = acikIndeks !== null ? fotograflar[acikIndeks] : null

  function sayfaDegisti(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / genislik)
    if (i !== acikIndeks && i >= 0 && i < fotograflar.length) setAcikIndeks(i)
  }

  if (yukleniyor) {
    return <Text style={stiller.bos}>{t('ortak.yukleniyor')}</Text>
  }
  if (fotograflar.length === 0) {
    return <Text style={stiller.bos}>{t('mekanSayfasi.fotografBos')}</Text>
  }

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && Math.abs(w - genislik) > 1) setGenislik(w)
      }}
      testID="mekan-fotograf-galerisi"
    >
      <View style={stiller.izgara}>
        {fotograflar.map((f, i) => (
          <Pressable
            key={f.id}
            onPress={() => setAcikIndeks(i)}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('mekanSayfasi.fotografAc')}
            testID="galeri-fotografi"
          >
            <Image source={{ uri: f.url }} style={{ width: kareBoyu, height: kareBoyu }} />
          </Pressable>
        ))}
      </View>

      {dahaVar && (
        <Pressable onPress={dahaFazla} style={stiller.dahaFazla} accessibilityRole="button">
          <Text style={stiller.dahaFazlaYazi}>{t('mekanSayfasi.dahaFazlaFotograf')}</Text>
        </Pressable>
      )}

      {/* BUYUK GORUNUM. Modal agacin disinda kaldigi icin kendi
          GestureHandlerRootView'ini tasiyor (akis kartiyla ayni ders). */}
      <Modal
        visible={acik !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setAcikIndeks(null)}
      >
        <GestureHandlerRootView style={stiller.buyukZemin} testID="galeri-buyuk-gorunum">
          <View style={stiller.ustCubuk}>
            <Pressable
              onPress={() => setAcikIndeks(null)}
              accessibilityRole="button"
              accessibilityLabel={t('ortak.kapat')}
              hitSlop={12}
            >
              <Text style={stiller.kapatYazi}>×</Text>
            </Pressable>
            <Text style={stiller.sayac} testID="galeri-sayac">
              {acikIndeks !== null ? acikIndeks + 1 : 0} / {fotograflar.length}
            </Text>
            <View style={stiller.ustCubukDenge} />
          </View>

          {acikIndeks !== null && (
            <View
              style={stiller.sayfalar}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height
                if (h > 0 && Math.abs(h - sayfaYuksekligi) > 1) setSayfaYuksekligi(h)
              }}
            >
            <FlatList
              data={fotograflar}
              keyExtractor={(f) => f.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={acikIndeks}
              getItemLayout={(_, i) => ({ length: genislik, offset: genislik * i, index: i })}
              onMomentumScrollEnd={sayfaDegisti}
              renderItem={({ item }) => (
                <View style={{ width: genislik, height: sayfaYuksekligi }}>
                  <YakinlastirilabilirGorsel
                    uri={item.url}
                    stil={{ width: genislik, height: sayfaYuksekligi }}
                    kaydirmaParmagi={2}
                    oturma="contain"
                  />
                </View>
              )}
            />
            </View>
          )}

          {acik && (
            <View style={stiller.altyazi} testID="galeri-altyazi">
              <Pressable
                onPress={() => {
                  setAcikIndeks(null)
                  router.push(`/kullanici/${acik.kullaniciId}` as never)
                }}
                accessibilityRole="button"
                style={stiller.altyaziAvatarKutu}
              >
                {avatarlar[acik.kullaniciId] ? (
                  <Image source={{ uri: avatarlar[acik.kullaniciId]! }} style={stiller.altyaziAvatar} />
                ) : (
                  <View style={[stiller.altyaziAvatar, stiller.altyaziAvatarBos]}>
                    <Text style={stiller.altyaziBasHarf}>
                      {(acik.kullaniciAdi ?? '?').trim().charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </Pressable>
              <View style={stiller.altyaziMetinler}>
                <Text style={stiller.altyaziAd} numberOfLines={1}>
                  {acik.kullaniciAdi ?? t('mekanSayfasi.biri')}
                </Text>
                <Text style={stiller.altyaziMekan} numberOfLines={2}>
                  {mekanAdi}
                </Text>
                <Text style={stiller.altyaziZaman}>{gorecelZaman(acik.olusturmaZamani, t)}</Text>
              </View>
            </View>
          )}
        </GestureHandlerRootView>
      </Modal>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    izgara: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ARALIK,
    },
    bos: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      paddingVertical: bosluk.l,
      textAlign: 'center',
    },
    dahaFazla: {
      alignSelf: 'center',
      paddingVertical: bosluk.s,
      paddingHorizontal: bosluk.l,
      marginTop: bosluk.m,
      borderRadius: yuvarlak.hap,
      borderWidth: 1,
      borderColor: renk.cizgi,
    },
    dahaFazlaYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
    },

    // Buyuk gorunum: siyah zemin iki modda da sabit - fotograf
    // izleyicisinin zemini temayla donmez.
    buyukZemin: { flex: 1, backgroundColor: '#000000' },
    ustCubuk: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 54,
      paddingHorizontal: bosluk.sayfa,
      paddingBottom: bosluk.s,
    },
    ustCubukDenge: { width: 28 },
    kapatYazi: { color: '#FFFFFF', fontSize: 30, lineHeight: 32, width: 28 },
    sayac: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.govde,
      color: '#FFFFFF',
    },
    sayfalar: { flex: 1 },
    altyazi: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.m,
      paddingHorizontal: bosluk.sayfa,
      paddingTop: bosluk.m,
      paddingBottom: 40,
    },
    altyaziAvatarKutu: {},
    altyaziAvatar: { width: 40, height: 40, borderRadius: 20 },
    altyaziAvatarBos: {
      backgroundColor: '#333333',
      alignItems: 'center',
      justifyContent: 'center',
    },
    altyaziBasHarf: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.govde },
    altyaziMetinler: { flex: 1, gap: 2 },
    altyaziAd: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.govde,
      color: '#FFFFFF',
    },
    altyaziMekan: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: '#FFFFFF',
    },
    altyaziZaman: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: '#B3B3B3',
    },
  })
