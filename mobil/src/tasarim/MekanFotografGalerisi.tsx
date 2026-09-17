import { useEffect, useRef, useState } from 'react'
import { View, Text, Image, Pressable, Dimensions, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { mekanFotograflariniGetir, MEKAN_FOTOGRAF_SAYFA, type MekanFotografi } from '../../lib/mekan-sayfasi'
import { gorecelZaman } from '../../lib/zaman'
import { useDil } from '../../lib/dil'
import { FotografGezgini } from './FotografGezgini'
import { FotografAltyazisi } from './FotografAltyazisi'
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

      {/* BUYUK GORUNUM: ortak gezgin (kaydirma, sayac, zoom). */}
      <FotografGezgini
        testID="galeri"
        fotograflar={fotograflar}
        acikIndeks={acikIndeks}
        onIndeks={setAcikIndeks}
        onKapat={() => setAcikIndeks(null)}
        altyazi={(i) => {
          const acik = fotograflar[i]
          return (
            <FotografAltyazisi
              testID="galeri-altyazi"
              avatarUrl={avatarlar[acik.kullaniciId] ?? null}
              kullaniciAdi={acik.kullaniciAdi ?? t('mekanSayfasi.biri')}
              /* Mekan adi BASILABILIR DEGIL: zaten o mekanin
                 sayfasindayiz, baglanti kendine gitmek olurdu. */
              mekanAdi={mekanAdi}
              zamanYazisi={gorecelZaman(acik.olusturmaZamani, t)}
              onKisi={() => {
                setAcikIndeks(null)
                router.push(`/kullanici/${acik.kullaniciId}` as never)
              }}
            />
          )
        }}
      />
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

  })
