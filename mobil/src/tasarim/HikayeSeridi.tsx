import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.serit}>
        {/* Kendi dairem */}
        <View style={stiller.kisi}>
          <Pressable
            onPress={() => (benimGrubum ? izle(benimGrubum.kullaniciId) : ekle())}
            accessibilityRole="button"
            accessibilityLabel={benimGrubum ? t('hikaye.hikayen') : t('hikaye.hikayeEkle')}
            testID="hikaye-benim"
            style={({ pressed }) => [pressed && stiller.basili]}
          >
            <View style={[stiller.halka, stiller.halkaSade]}>
              {ben ? (
                <Avatar fotografUrl={ben.avatarUrl} ad={ben.ad} kullaniciAdi={ben.kullaniciAdi} cap={AVATAR} />
              ) : (
                <View style={stiller.bosAvatar} />
              )}
            </View>
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
          <Text style={stiller.ad} numberOfLines={1}>
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
              <View style={[stiller.halka, grup.gorulmemisVar ? stiller.halkaTuruncu : stiller.halkaGri]}>
                <Avatar fotografUrl={grup.avatarUrl} ad={grup.ad} kullaniciAdi={grup.kullaniciAdi} cap={AVATAR} />
              </View>
            </Pressable>
            <Text style={[stiller.ad, !grup.gorulmemisVar && stiller.adSoluk]} numberOfLines={1}>
              {grup.kullaniciAdi}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
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
    halkaTuruncu: { borderColor: renk.turuncu },
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
  })
