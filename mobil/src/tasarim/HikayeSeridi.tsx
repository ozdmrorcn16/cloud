import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { yatayAlan } from '../../lib/yatay-kilit'
import { useRouter } from 'expo-router'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { Image } from 'expo-image'
import type { HikayeGrubu } from '../../lib/hikaye'
import { useDil } from '../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { Avatar } from './Avatar'

/**
 * HIKAYE SERIDI (2026-09-22, kullanicinin istegi "ana sayfaya Instagram
 * gibi hikaye ekleme akisi"). Ana sayfada akisin ustunde
 * (ListHeaderComponent), "Su an disarida"nin USTUNDE.
 *
 * Ilk daire HER ZAMAN "Hikayen": avatarim SADE bir dairede, sag altinda
 * turuncu arti rozeti (2026-09-22 referansi - eski kesikli halka kalkti).
 * Hikayem varsa daireye dokunmak izleyiciyi, rozet her halde ekleme
 * ekranini aciyor. Sonra arkadaslar:
 * gorulmemis hikayesi olan TURUNCU halka, hepsi gorulmus GRI halka
 * (siralama `hikayeGruplariniSirala`: gorulmemisler once).
 *
 * Kimse hikaye paylasmamissa serit yine cizilir (kendi dairem tek
 * basina) - "Su an disarida"nin "bos ise gizle" kuralindan farkli,
 * cunku buradaki daire bir EYLEM (paylas), bilgi degil.
 */

/**
 * ANLIK KARTI (2026-09-26, kullanicinin secimi B: "yuvarlak degil,
 * anlik cekiminin karesine benzer kucugu"): daire yerine cekim kartinin
 * KUCUGU - dikey 3:4, oval koseler. Icinde kisinin EN YENI anliginin
 * fotografi, sol altta kucuk profil resmi. Halka kartin kenarinda,
 * ayni dilim kurali. Anligi olmayan kendi kartimda profil resmim.
 */
const KART_EN = 72
const KART_BOY = 96
const KART_KOSE = 18
/** Halka (3) + zemin boslugu (3). */
const IC_PAY = 6

/**
 * YENI ANLIK GORUNUMU (2026-09-25, kullanicinin secimi "A ile C"):
 * halka kisinin anlik SAYISI kadar dilime bolunur; gorulmemis dilim
 * kalin (3) turuncu->sari->pembe gradyan, gorulmus dilim ince (2) gri.
 * Avatarla halka arasinda beyaz bosluk; gorulmemisi olanin adi kalin.
 */
const HALKA_KALIN = 3
const HALKA_INCE = 2
/** Dilimler arasi bosluk (yuvarlak uclar icin kalinliktan buyuk). */
const DILIM_BOSLUK = 6

export function HikayeSeridi({
  gruplar,
  ben,
}: {
  gruplar: HikayeGrubu[]
  /** Kendi kimligim ve gorunumum; profil okunamadiysa null (daire yine cizilir). */
  ben: { id: string; ad: string; kullaniciAdi: string; avatarUrl: string | null } | null
}) {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()

  const benimGrubum = gruplar.find((g) => g.benimMi) ?? null
  const digerleri = gruplar.filter((g) => !g.benimMi)

  function izle(kullaniciId: string) {
    router.push(`/hikaye/izle?kullanici=${kullaniciId}` as never)
  }
  function ekle() {
    router.push('/hikaye/ekle' as never)
  }

  return (
    <View style={stiller.kok} testID="hikaye-seridi">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.serit} {...yatayAlan}>
        {/* Kendi dairem */}
        <View style={stiller.kisi}>
          <Pressable
            onPress={() => (benimGrubum ? izle(benimGrubum.kullaniciId) : ekle())}
            accessibilityRole="button"
            accessibilityLabel={benimGrubum ? t('hikaye.hikayen') : t('hikaye.hikayeEkle')}
            testID="hikaye-benim"
            style={({ pressed }) => [pressed && stiller.basili]}
          >
            {/* Anligim varsa arkadaslarinki gibi bolumlu halka + en yeni
                anligimin fotografi; yoksa kartta profil resmim. */}
            <AnlikKarti
              kimlik={benimGrubum?.kullaniciId ?? 'ben'}
              goruldu={benimGrubum ? benimGrubum.hikayeler.map((h) => h.gordum) : null}
              fotografUrl={benimGrubum ? sonFotograf(benimGrubum) : null}
              avatarUrl={ben?.avatarUrl ?? benimGrubum?.avatarUrl ?? null}
              ad={ben?.ad ?? benimGrubum?.ad ?? ''}
              kullaniciAdi={ben?.kullaniciAdi ?? benimGrubum?.kullaniciAdi ?? ''}
            />
            {/* Arti rozeti: hikayem varken de ekleme yolu acik kalsin. */}
            <Pressable
              onPress={ekle}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('hikaye.hikayeEkle')}
              testID="hikaye-ekle-rozeti"
              style={stiller.artiRozeti}
            >
              <ArtiCizimi />
            </Pressable>
          </Pressable>
          <Text style={[stiller.ad, stiller.adBenim]} numberOfLines={1} testID="hikaye-benim-etiketi">
            {t('hikaye.hikayen')}
          </Text>
        </View>

        {digerleri.map((grup) => (
          <View key={grup.kullaniciId} style={stiller.kisi}>
            <Pressable
              onPress={() => izle(grup.kullaniciId)}
              accessibilityRole="button"
              accessibilityLabel={t('hikaye.kisininHikayesi', { ad: grup.kullaniciAdi })}
              accessibilityState={{ selected: grup.gorulmemisVar }}
              testID={`hikaye-${grup.kullaniciId}`}
              style={({ pressed }) => [pressed && stiller.basili]}
            >
              <AnlikKarti
                kimlik={grup.kullaniciId}
                goruldu={grup.hikayeler.map((h) => h.gordum)}
                fotografUrl={sonFotograf(grup)}
                avatarUrl={grup.avatarUrl}
                ad={grup.ad}
                kullaniciAdi={grup.kullaniciAdi}
              />
            </Pressable>
            <Text style={[stiller.ad, grup.gorulmemisVar ? stiller.adBenim : stiller.adSoluk]} numberOfLines={1}>
              {grup.kullaniciAdi}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

/** Kisinin en yeni anliginin fotografi (hikayeler eskiden yeniye). */
function sonFotograf(grup: HikayeGrubu): string | null {
  for (let i = grup.hikayeler.length - 1; i >= 0; i--) {
    const url = grup.hikayeler[i].fotografUrl
    if (url) return url
  }
  return null
}

function AnlikKarti({
  kimlik,
  goruldu,
  fotografUrl,
  avatarUrl,
  ad,
  kullaniciAdi,
}: {
  kimlik: string
  /** null: anlik yok, halka cizilmez. */
  goruldu: boolean[] | null
  fotografUrl: string | null
  avatarUrl: string | null
  ad: string
  kullaniciAdi: string
}) {
  const stiller = useStiller(stilleriYap)
  return (
    <View style={stiller.kartKap}>
      {goruldu && goruldu.length > 0 ? (
        <DilimliHalka kimlik={kimlik} goruldu={goruldu} griRenk={stiller.halkaGri.borderColor as string} />
      ) : null}
      <View style={stiller.kartIc}>
        {fotografUrl ? (
          <>
            <Image
              source={{ uri: fotografUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={fotografUrl}
              transition={0}
              testID={`hikaye-kapak-${kimlik}`}
            />
            <View style={stiller.miniAvatar}>
              <Avatar fotografUrl={avatarUrl} ad={ad} kullaniciAdi={kullaniciAdi} cap={22} />
            </View>
          </>
        ) : avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={stiller.kartBosAvatar}>
            <Avatar fotografUrl={null} ad={ad} kullaniciAdi={kullaniciAdi} cap={40} />
          </View>
        )}
      </View>
    </View>
  )
}

/**
 * Bolumlu halka kartin kenarinda: her anlik bir dilim, izleme sirasiyla
 * saat yonunde, UST ORTADAN baslar. Tek anlikta kesintisiz.
 */
function DilimliHalka({ kimlik, goruldu, griRenk }: { kimlik: string; goruldu: boolean[]; griRenk: string }) {
  const n = Math.max(1, goruldu.length)
  const y0 = HALKA_KALIN / 2
  const w = KART_EN - HALKA_KALIN
  const h = KART_BOY - HALKA_KALIN
  const r = KART_KOSE - HALKA_KALIN / 2
  const x0 = y0
  // Ust ortadan saat yonunde yuvarlak dikdortgen.
  const yol =
    `M ${x0 + w / 2} ${y0} H ${x0 + w - r} A ${r} ${r} 0 0 1 ${x0 + w} ${y0 + r} V ${y0 + h - r} ` +
    `A ${r} ${r} 0 0 1 ${x0 + w - r} ${y0 + h} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y0 + h - r} ` +
    `V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`
  const cevre = 2 * (w + h) - (8 - 2 * Math.PI) * r
  const bosluk = n > 1 ? DILIM_BOSLUK : 0
  const uzunluk = cevre / n - bosluk
  const gradyanId = `anlikHalka-${kimlik.replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <Svg width={KART_EN} height={KART_BOY} style={StyleSheet.absoluteFill} testID={`hikaye-halka-${kimlik}`}>
      <Defs>
        <LinearGradient id={gradyanId} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#FE7813" />
          <Stop offset="0.55" stopColor="#FFB23F" />
          <Stop offset="1" stopColor="#FF4E6A" />
        </LinearGradient>
      </Defs>
      {goruldu.map((gordum, i) => (
        <Path
          key={i}
          testID={`hikaye-dilim-${kimlik}-${i}-${gordum ? 'goruldu' : 'yeni'}`}
          d={yol}
          fill="none"
          stroke={gordum ? griRenk : `url(#${gradyanId})`}
          strokeWidth={gordum ? HALKA_INCE : HALKA_KALIN}
          strokeLinecap={n > 1 ? 'round' : 'butt'}
          strokeDasharray={n > 1 ? `${uzunluk} ${cevre - uzunluk}` : undefined}
          strokeDashoffset={n > 1 ? -((i * cevre) / n + bosluk / 2) : undefined}
        />
      ))}
    </Svg>
  )
}

function ArtiCizimi() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { paddingTop: bosluk.xs, paddingBottom: bosluk.s },
    serit: { paddingHorizontal: bosluk.sayfa, gap: bosluk.m },
    kisi: { width: KART_EN, alignItems: 'center' },
    kartKap: { width: KART_EN, height: KART_BOY },
    kartIc: {
      position: 'absolute',
      left: IC_PAY,
      top: IC_PAY,
      right: IC_PAY,
      bottom: IC_PAY,
      borderRadius: KART_KOSE - IC_PAY + 1,
      overflow: 'hidden',
      backgroundColor: renk.turuncuZemin,
    },
    kartBosAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    miniAvatar: {
      position: 'absolute',
      left: 4,
      bottom: 4,
      borderRadius: yuvarlak.hap,
      borderWidth: 2,
      borderColor: renk.zemin,
    },
    halkaGri: { borderColor: renk.cizgi },
    artiRozeti: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 24,
      height: 24,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.turuncu,
      borderWidth: 2,
      borderColor: renk.zemin,
      alignItems: 'center',
      justifyContent: 'center',
    },
    basili: { opacity: 0.8 },
    ad: {
      marginTop: 6,
      fontFamily: yazi.govde,
      fontSize: olcek.minik,
      color: renk.metin,
      maxWidth: KART_EN,
    },
    adSoluk: { color: renk.metinIkincil },
    /** Kendi dairemin "Anlık" yazisi ve yeni anligi olanin adi kalin (2026-09-25). */
    adBenim: { fontFamily: yazi.ekranBasligi },
  })
