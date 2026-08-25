import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from './tema'

/**
 * Kaydirmali tarih secici (gun / ay / yil).
 *
 * Kullanicinin karari (2026-08-25): dogum tarihi ELLE YAZILMAZ,
 * kaydirarak secilir. Onceki halde tek satirda "YYYY-AA-GG" bicimi
 * isteniyordu; kullaniciya bicim ezberletmek ve her seferinde yazim
 * hatasi riski almak demekti.
 *
 * Platform seciciler kullanilmadi: iOS'ta tekerlek, Android'de takvim,
 * web'de <select> ciziliyor - yani ayni ekran uc yerde uc turlu
 * gorunuyor. Tekerlek burada elle ciziliyor ki uc platformda da ayni
 * dursun ve kimlik jetonlarina uysun.
 *
 * Kaydirmanin bittigini anlamak icin `onMomentumScrollEnd`
 * KULLANILMIYOR: web'de guvenilir tetiklenmiyor. Bunun yerine son
 * kaydirma olayindan sonra kisa bir sessizlik olcuuluyor; sessizlik
 * dolunca en yakin satira oturuluyor.
 */

/** Bir satirin yuksekligi. Dokunma hedefi olarak da yeterli (>= 44). */
const OGE = 44
/** Kac satir gorunur - tek sayi olmali ki ortada bir satir kalsin. */
const GORUNUR = 5
const YUKSEKLIK = OGE * GORUNUR
/** Kaydirma durdu sayilana kadar beklenen sessizlik. */
const OTURMA_MS = 140

export type Tarih = { gun: number; ay: number; yil: number }

/** Bir ay kac gun cekiyor - artik yil dahil. */
export function aydakiGun(ay: number, yil: number): number {
  return new Date(Date.UTC(yil, ay, 0)).getUTCDate()
}

type Oge = { deger: number; etiket: string }

function Sutun({
  ogeler,
  secili,
  onSecim,
  esnek,
  etiket,
}: {
  ogeler: Oge[]
  secili: number
  onSecim: (deger: number) => void
  esnek: number
  etiket: string
}) {
  const ref = useRef<ScrollView>(null)
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [aktif, setAktif] = useState(() => Math.max(0, ogeler.findIndex((o) => o.deger === secili)))

  // Acilista secili degerin uzerine konumlan.
  useEffect(() => {
    const indeks = ogeler.findIndex((o) => o.deger === secili)
    if (indeks >= 0) {
      setAktif(indeks)
      // Bir kare sonraya birakiliyor: ScrollView ilk cizimde henuz
      // olculmemis oluyor ve scrollTo sessizce dusuyor.
      const zaman = setTimeout(() => ref.current?.scrollTo({ y: indeks * OGE, animated: false }), 0)
      return () => clearTimeout(zaman)
    }
    // Liste degistigi icin (ornegin Subat'a gecince) yalnizca ilk
    // cizimde calismasi yetmiyor; sutun disaridan `key` ile
    // yenileniyor.
    return undefined
  }, [])

  useEffect(() => {
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current)
    }
  }, [])

  function kaydirdi(olay: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = olay.nativeEvent.contentOffset.y
    const indeks = Math.max(0, Math.min(ogeler.length - 1, Math.round(y / OGE)))
    if (indeks !== aktif) setAktif(indeks)

    if (zamanlayici.current) clearTimeout(zamanlayici.current)
    zamanlayici.current = setTimeout(() => {
      ref.current?.scrollTo({ y: indeks * OGE, animated: true })
      onSecim(ogeler[indeks].deger)
    }, OTURMA_MS)
  }

  return (
    <ScrollView
      ref={ref}
      style={[stiller.sutun, { flexGrow: esnek, flexShrink: 1, flexBasis: 0 }]}
      contentContainerStyle={{ paddingVertical: OGE * ((GORUNUR - 1) / 2) }}
      showsVerticalScrollIndicator={false}
      snapToInterval={OGE}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={kaydirdi}
      accessibilityLabel={etiket}
    >
      {ogeler.map((oge, i) => (
        <View key={oge.deger} style={stiller.oge}>
          <Text style={[stiller.ogeYazi, i === aktif && stiller.ogeYaziAktif]} numberOfLines={1}>
            {oge.etiket}
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}

export function TarihSecici({
  gorunur,
  baslangic,
  enGecYil,
  enErkenYil,
  onKapat,
  onSec,
}: {
  gorunur: boolean
  baslangic: Tarih
  /** Listedeki en buyuk yil (dahil). */
  enGecYil: number
  /** Listedeki en kucuk yil (dahil). */
  enErkenYil: number
  onKapat: () => void
  onSec: (tarih: Tarih) => void
}) {
  const { t } = useDil()
  const [gun, setGun] = useState(baslangic.gun)
  const [ay, setAy] = useState(baslangic.ay)
  const [yil, setYil] = useState(baslangic.yil)

  // Secici her acilista disaridaki degerle baslasin.
  useEffect(() => {
    if (!gorunur) return
    setGun(baslangic.gun)
    setAy(baslangic.ay)
    setYil(baslangic.yil)
  }, [gorunur, baslangic.gun, baslangic.ay, baslangic.yil])

  const enFazlaGun = aydakiGun(ay, yil)
  // 31 Ocak secilip Subat'a gecilirse gun gecersiz kalir; kirpiliyor.
  const gecerliGun = Math.min(gun, enFazlaGun)

  const gunler: Oge[] = Array.from({ length: enFazlaGun }, (_, i) => ({
    deger: i + 1,
    etiket: String(i + 1),
  }))
  const aylar: Oge[] = Array.from({ length: 12 }, (_, i) => ({
    deger: i + 1,
    etiket: t(`profilOlustur.aylar.${i + 1}`),
  }))
  const yillar: Oge[] = Array.from({ length: enGecYil - enErkenYil + 1 }, (_, i) => ({
    deger: enErkenYil + i,
    etiket: String(enErkenYil + i),
  }))

  return (
    <Modal visible={gorunur} transparent animationType="slide" onRequestClose={onKapat}>
      <Pressable style={stiller.perde} onPress={onKapat} accessibilityRole="button" />
      <View style={stiller.tabaka}>
        <View style={stiller.tutamak} />
        <Text style={stiller.baslik}>{t('profilOlustur.dogumEtiket')}</Text>

        <View style={stiller.tekerlek}>
          {/* Ortadaki secim seridi - tekerlegin nereye oturdugunu
              soyleyen tek gorsel ipucu. */}
          <View style={stiller.serit} pointerEvents="none" />
          <Sutun
            ogeler={gunler}
            secili={gecerliGun}
            onSecim={setGun}
            esnek={1}
            etiket={t('profilOlustur.tarihGun')}
            key={`gun-${ay}-${yil}`}
          />
          <Sutun
            ogeler={aylar}
            secili={ay}
            onSecim={setAy}
            esnek={1.6}
            etiket={t('profilOlustur.tarihAy')}
          />
          <Sutun
            ogeler={yillar}
            secili={yil}
            onSecim={setYil}
            esnek={1.2}
            etiket={t('profilOlustur.tarihYil')}
          />
        </View>

        <Pressable
          style={stiller.birincil}
          onPress={() => onSec({ gun: gecerliGun, ay, yil })}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>{t('profilOlustur.tarihTamam')}</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const stiller = StyleSheet.create({
  perde: { flex: 1, backgroundColor: renk.kapakKarartma },
  tabaka: {
    backgroundColor: renk.yuzey,
    borderTopLeftRadius: yuvarlak.buyuk + 8,
    borderTopRightRadius: yuvarlak.buyuk + 8,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.m,
    paddingBottom: bosluk.xxl,
    ...golge.yuzer,
  },
  tutamak: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: renk.cizgi,
    marginBottom: bosluk.l,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: bosluk.m,
  },

  tekerlek: { flexDirection: 'row', gap: bosluk.s, height: YUKSEKLIK },
  serit: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: OGE * ((GORUNUR - 1) / 2),
    height: OGE,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
  },
  sutun: { height: YUKSEKLIK },
  oge: { height: OGE, alignItems: 'center', justifyContent: 'center' },
  ogeYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinSoluk,
  },
  ogeYaziAktif: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.xl,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
