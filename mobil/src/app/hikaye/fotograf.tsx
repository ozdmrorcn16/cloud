import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import { sonFotograflariGetir, galeriKullanilabilirMi } from '../../../lib/galeri'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * HIKAYEYE EKLE - FOTOGRAF SEC (2026-09-22 referansi "02 / Fotoğraf seç").
 * Ust cubuk × + ortali baslik; seftali kartta "Fotoğraf çek / Kamerayı aç";
 * altinda "Son fotoğraflar" basligi ve telefonun SON FOTOGRAFLARI 3 sutunlu
 * izgarada. Secilen kare turuncu cerceve + turuncu tik aliyor; altta
 * "1 fotoğraf seçildi" ve turuncu "İleri" -> duzenleme ekrani.
 *
 * TEK SECIM: bir hikaye tek fotograf (sunucu modeli de oyle).
 *
 * ESKI DERLEMELERDE IZGARA YOK: `expo-media-library` NATIVE bir modul,
 * OTA ile gelmiyor. Modul yoksa ya da izin verilmediyse izgaranin
 * yerinde "Galeriden seç" karti duruyor ve sistem secicisi aciliyor -
 * ekran hicbir halde bos kalmiyor ve cokmuyor.
 */
export default function HikayeFotografSecEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const [fotograflar, setFotograflar] = useState<{ id: string; uri: string }[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [izgaraVar, setIzgaraVar] = useState(galeriKullanilabilirMi())
  const [secili, setSecili] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  const ARA = 3
  const kare = Math.floor((width - bosluk.sayfa * 2 - ARA * 2) / 3)

  useEffect(() => {
    let gecerli = true
    if (!galeriKullanilabilirMi()) {
      setYukleniyor(false)
      return
    }
    sonFotograflariGetir(30)
      .then((liste) => {
        if (!gecerli) return
        setFotograflar(liste)
        setIzgaraVar(liste.length > 0)
        setYukleniyor(false)
      })
      .catch(() => {
        if (!gecerli) return
        setIzgaraVar(false)
        setYukleniyor(false)
      })
    return () => {
      gecerli = false
    }
  }, [])

  function geri() {
    if (router.canGoBack()) router.back()
    else router.replace('/' as never)
  }

  function duzenlemeyeGec(uri: string) {
    router.replace(`/hikaye/ekle?foto=${encodeURIComponent(uri)}` as never)
  }

  async function kameradanCek() {
    const izin = await ImagePicker.requestCameraPermissionsAsync()
    if (!izin.granted) {
      setHata(t('hikaye.kameraIzni'))
      return
    }
    const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (sonuc.canceled || !sonuc.assets[0]) return
    duzenlemeyeGec(sonuc.assets[0].uri)
  }

  async function sistemSecicisi() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (sonuc.canceled || !sonuc.assets[0]) return
    duzenlemeyeGec(sonuc.assets[0].uri)
  }

  return (
    <View style={[stiller.zemin, { paddingTop: guvenliAlan.top }]} testID="hikaye-fotograf-sec">
      <View style={stiller.ustCubuk}>
        <Pressable onPress={geri} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('ortak.kapat')} testID="fotograf-kapat">
          <Text style={stiller.kapatYazi}>×</Text>
        </Pressable>
        <Text style={stiller.baslik}>{t('hikaye.fotografSecBaslik')}</Text>
        <View style={stiller.kapatYer} />
      </View>

      <FlatList
        data={izgaraVar ? fotograflar : []}
        keyExtractor={(f) => f.id}
        numColumns={3}
        columnWrapperStyle={fotograflar.length > 0 ? { gap: ARA } : undefined}
        contentContainerStyle={[stiller.icerik, { paddingBottom: guvenliAlan.bottom + 96, gap: ARA }]}
        ListHeaderComponent={
          <View style={stiller.ust}>
            {hata && (
              <Text style={stiller.hata} testID="fotograf-hata">
                {hata}
              </Text>
            )}

            <Pressable
              onPress={kameradanCek}
              accessibilityRole="button"
              testID="fotograf-kamera"
              style={({ pressed }) => [stiller.kamera, pressed && stiller.basili]}
            >
              <View style={stiller.kameraIkon}>
                <KameraCizimi />
              </View>
              <View style={stiller.kameraMetin}>
                <Text style={stiller.kameraBaslik}>{t('hikaye.kamera')}</Text>
                <Text style={stiller.kameraAlt}>{t('hikaye.kamerayiAc')}</Text>
              </View>
              <Text style={stiller.ok}>›</Text>
            </Pressable>

            {!izgaraVar && !yukleniyor && (
              /* Izgara yoksa (eski derleme ya da izin verilmedi) galeri
                 yine bir kartla aciliyor - ekran yarim kalmiyor. */
              <Pressable
                onPress={sistemSecicisi}
                accessibilityRole="button"
                testID="fotograf-galeri"
                style={({ pressed }) => [stiller.kamera, stiller.galeriKarti, pressed && stiller.basili]}
              >
                <View style={[stiller.kameraIkon, stiller.galeriIkon]}>
                  <ResimCizimi />
                </View>
                <View style={stiller.kameraMetin}>
                  <Text style={stiller.kameraBaslik}>{t('hikaye.galeri')}</Text>
                  <Text style={stiller.kameraAlt}>{t('hikaye.galeriyiAc')}</Text>
                </View>
                <Text style={stiller.ok}>›</Text>
              </Pressable>
            )}

            {izgaraVar && (
              <View style={stiller.izgaraBasligi}>
                <Text style={stiller.bolumBaslik}>{t('hikaye.sonFotograflar')}</Text>
                <Text style={stiller.bolumIpucu}>{t('hikaye.birFotografSec')}</Text>
              </View>
            )}
            {yukleniyor && <ActivityIndicator style={stiller.bekleme} testID="fotograf-bekleme" />}
          </View>
        }
        renderItem={({ item }) => {
          const secilidir = secili === item.uri
          return (
            <Pressable
              onPress={() => setSecili(item.uri)}
              accessibilityRole="button"
              accessibilityState={{ selected: secilidir }}
              accessibilityLabel={t('hikaye.birFotografSec')}
              testID={`fotograf-${item.id}`}
              style={[stiller.kare, { width: kare, height: kare }, secilidir && stiller.kareSecili]}
            >
              <Image source={{ uri: item.uri }} style={stiller.kareResim} contentFit="cover" />
              {secilidir && (
                <View style={stiller.tik} testID="fotograf-tik">
                  <TikCizimi />
                </View>
              )}
            </Pressable>
          )
        }}
      />

      {izgaraVar && (
        <View style={[stiller.altCubuk, { paddingBottom: guvenliAlan.bottom + bosluk.s }]}>
          <Text style={stiller.sayac}>
            {secili ? t('hikaye.fotografSecildi', { sayi: 1 }) : t('hikaye.birFotografSec')}
          </Text>
          <Pressable
            onPress={() => secili && duzenlemeyeGec(secili)}
            disabled={!secili}
            accessibilityRole="button"
            accessibilityState={{ disabled: !secili }}
            testID="fotograf-ileri"
            style={({ pressed }) => [stiller.ileri, !secili && stiller.ileriPasif, pressed && stiller.basili]}
          >
            <Text style={stiller.ileriYazi}>{t('hikaye.ileri')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function KameraCizimi() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M4 8h3l1.4-2h7.2L17 8h3v11H4V8z"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.6} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
    </Svg>
  )
}

function ResimCizimi() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Rect x={3.5} y={5} width={17} height={14} rx={2.4} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.6} fill="#FFFFFF" />
      <Path d="M5 17l4.5-4.5 3 3 3-2.5L19 17" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
    </Svg>
  )
}

function TikCizimi() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFFFF" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: renk.zemin },
    ustCubuk: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: bosluk.sayfa,
      paddingVertical: bosluk.s,
    },
    kapatYazi: { fontFamily: yazi.govde, fontSize: 26, lineHeight: 28, color: renk.metin, width: 32 },
    kapatYer: { width: 32 },
    baslik: { flex: 1, textAlign: 'center', fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },

    icerik: { paddingHorizontal: bosluk.sayfa },
    ust: { gap: bosluk.m, paddingBottom: bosluk.s },
    hata: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.yikici },

    kamera: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.m,
      backgroundColor: renk.turuncuZemin,
      borderRadius: yuvarlak.kart,
      padding: bosluk.m,
    },
    galeriKarti: { backgroundColor: renk.yuzey, borderWidth: 1, borderColor: renk.cizgi },
    kameraIkon: {
      width: 52,
      height: 52,
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.turuncu,
      alignItems: 'center',
      justifyContent: 'center',
    },
    galeriIkon: { backgroundColor: renk.metinIkincil },
    kameraMetin: { flex: 1, gap: 2 },
    kameraBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
    kameraAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
    ok: { fontFamily: yazi.govde, fontSize: 22, color: renk.metinIkincil },

    izgaraBasligi: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: bosluk.s },
    bolumBaslik: { fontFamily: yazi.govdeKalin, fontSize: 19, color: renk.metin },
    bolumIpucu: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
    bekleme: { marginTop: bosluk.m },

    kare: { borderRadius: 10, overflow: 'hidden', backgroundColor: renk.turuncuZemin },
    kareSecili: { borderWidth: 3, borderColor: renk.turuncu },
    kareResim: { width: '100%', height: '100%' },
    tik: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.turuncu,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },

    altCubuk: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: bosluk.m,
      paddingHorizontal: bosluk.sayfa,
      paddingTop: bosluk.s,
      borderTopWidth: 1,
      borderTopColor: renk.cizgi,
      backgroundColor: renk.zemin,
    },
    sayac: { flex: 1, fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
    ileri: {
      paddingVertical: 14,
      paddingHorizontal: 38,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.turuncu,
    },
    ileriPasif: { opacity: 0.5 },
    ileriYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
    basili: { opacity: 0.85 },
  })
