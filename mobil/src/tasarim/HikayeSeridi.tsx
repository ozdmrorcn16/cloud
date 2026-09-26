import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { yatayAlan } from '../../lib/yatay-kilit'
import { useRouter } from 'expo-router'
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
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

const HALKA = 64
const AVATAR = 56
/** Arkadas dairesinde avatar: halka (3) + beyaz bosluk (~3) payi. */
const ARKADAS_AVATAR = 52

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
            {/* Anligim varsa arkadaslarinki gibi bolumlu halka: yeni dilim
                gradyan, izledigim dilim gri (2026-09-26). */}
            {benimGrubum ? (
              <View style={stiller.dilimliKap}>
                <DilimliHalka
                  kimlik={benimGrubum.kullaniciId}
                  goruldu={benimGrubum.hikayeler.map((h) => h.gordum)}
                  griRenk={stiller.halkaGri.borderColor as string}
                />
                <Avatar
                  fotografUrl={ben?.avatarUrl ?? benimGrubum.avatarUrl}
                  ad={ben?.ad ?? benimGrubum.ad}
                  kullaniciAdi={ben?.kullaniciAdi ?? benimGrubum.kullaniciAdi}
                  cap={ARKADAS_AVATAR}
                />
              </View>
            ) : (
              <View style={[stiller.halka, stiller.halkaSade]}>
                {ben ? (
                  <Avatar fotografUrl={ben.avatarUrl} ad={ben.ad} kullaniciAdi={ben.kullaniciAdi} cap={AVATAR} />
                ) : (
                  <View style={stiller.bosAvatar} />
                )}
              </View>
            )}
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
              <View style={stiller.dilimliKap}>
                <DilimliHalka
                  kimlik={grup.kullaniciId}
                  goruldu={grup.hikayeler.map((h) => h.gordum)}
                  griRenk={stiller.halkaGri.borderColor as string}
                />
                <Avatar fotografUrl={grup.avatarUrl} ad={grup.ad} kullaniciAdi={grup.kullaniciAdi} cap={ARKADAS_AVATAR} />
              </View>
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

/**
 * Bolumlu halka: her anlik bir dilim, izleme sirasiyla saat yonunde,
 * tepeden baslar. Tek anlikta tam daire (bosluk yok).
 */
function DilimliHalka({ kimlik, goruldu, griRenk }: { kimlik: string; goruldu: boolean[]; griRenk: string }) {
  const n = Math.max(1, goruldu.length)
  const merkez = HALKA / 2
  const r = (HALKA - HALKA_KALIN) / 2
  const cevre = 2 * Math.PI * r
  const bosluk = n > 1 ? DILIM_BOSLUK : 0
  const uzunluk = cevre / n - bosluk
  const gradyanId = `anlikHalka-${kimlik.replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <Svg width={HALKA} height={HALKA} style={StyleSheet.absoluteFill} testID={`hikaye-halka-${kimlik}`}>
      <Defs>
        <LinearGradient id={gradyanId} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#FE7813" />
          <Stop offset="0.55" stopColor="#FFB23F" />
          <Stop offset="1" stopColor="#FF4E6A" />
        </LinearGradient>
      </Defs>
      {goruldu.map((gordum, i) => (
        <Circle
          key={i}
          testID={`hikaye-dilim-${kimlik}-${i}-${gordum ? 'goruldu' : 'yeni'}`}
          cx={merkez}
          cy={merkez}
          r={r}
          fill="none"
          stroke={gordum ? griRenk : `url(#${gradyanId})`}
          strokeWidth={gordum ? HALKA_INCE : HALKA_KALIN}
          strokeLinecap={n > 1 ? 'round' : 'butt'}
          strokeDasharray={n > 1 ? `${uzunluk} ${cevre - uzunluk}` : undefined}
          transform={`rotate(${-90 + (i * 360) / n + ((bosluk / 2) / cevre) * 360} ${merkez} ${merkez})`}
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
    kisi: { width: 68, alignItems: 'center' },
    halka: {
      width: HALKA,
      height: HALKA,
      borderRadius: yuvarlak.hap,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dilimliKap: { width: HALKA, height: HALKA, alignItems: 'center', justifyContent: 'center' },
    halkaGri: { borderColor: renk.cizgi },
    /** Kendi dairem: halka yok - ayirt eden sey arti rozeti. */
    halkaSade: { borderColor: 'transparent' },
    bosAvatar: { width: AVATAR, height: AVATAR, borderRadius: yuvarlak.hap, backgroundColor: renk.turuncuZemin },
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
      maxWidth: 68,
    },
    adSoluk: { color: renk.metinIkincil },
    /** Kendi dairemin "Anlık" yazisi ve yeni anligi olanin adi kalin (2026-09-25). */
    adBenim: { fontFamily: yazi.ekranBasligi },
  })
