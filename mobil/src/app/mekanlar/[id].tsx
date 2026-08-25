import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import {
  suAnBurdakileriGetir,
  mekanAnilariniGetir,
  checkIndenAyril,
  type CheckInGorunumu,
} from '../../../lib/checkin'
import { mekaniGetir, turuGosterilir, type Mekan } from '../../../lib/mekan'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

/**
 * Mekan detayi.
 *
 * Once mekanin ADI ekranda hic gorunmuyordu - kullanici bir mekana
 * girdiginde nerede oldugunu okuyamiyordu. Artik baslik mekanin adi,
 * altinda semt (ve varsa tur: yalnizca kullanicinin ekledigi
 * mekanlarda, karar 2026-08-24).
 *
 * Ekranin tek birincil turuncu eylemi check-in. Kullanici zaten
 * buradaysa o eylem "Ayrildim"a doner ve sessiz bir butona duser:
 * ayrilmak bir davet degil, bir kapanis.
 */
export default function MekanDetayEkrani() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [suAnBurdakiler, setSuAnBurdakiler] = useState<CheckInGorunumu[]>([])
  const [anilar, setAnilar] = useState<CheckInGorunumu[]>([])
  const [kendiKullaniciId, setKendiKullaniciId] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  async function verileriYukle() {
    try {
      const [canlilar, gecmisAnilar, kullaniciVerisi] = await Promise.all([
        suAnBurdakileriGetir(id),
        mekanAnilariniGetir(id),
        supabase.auth.getUser(),
      ])
      setSuAnBurdakiler(canlilar)
      setAnilar(gecmisAnilar)
      setKendiKullaniciId(kullaniciVerisi.data.user?.id ?? null)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  useEffect(() => {
    verileriYukle()
    // Mekan bilgisi ayri: okunamazsa ekranin geri kalani yine calismali.
    mekaniGetir(id)
      .then(setMekan)
      .catch(() => setMekan(null))
  }, [id])

  const kendiCheckIni = suAnBurdakiler.find((c) => c.kullaniciId === kendiKullaniciId)

  async function ayril(checkInId: string) {
    await checkIndenAyril(checkInId)
    await verileriYukle()
  }

  const altSatir = mekan
    ? [mekan.semt, turuGosterilir(mekan) ? mekan.tur : null].filter(Boolean).join(' · ')
    : ''

  function Satirlar({ veri, bos }: { veri: CheckInGorunumu[]; bos: string }) {
    if (veri.length === 0) return <Text style={stiller.durum}>{bos}</Text>
    return (
      <>
        {veri.map((item) => {
          const benim = item.kullaniciId === kendiKullaniciId
          return (
            <View key={item.id} style={stiller.satir}>
              <Pressable
                style={stiller.satirIcerik}
                onPress={() => !benim && router.push(`/kullanici/${item.kullaniciId}`)}
                disabled={benim}
                accessibilityRole="button"
              >
                <View style={stiller.avatar}>
                  <Text style={stiller.basHarf}>
                    {(item.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
                  </Text>
                </View>
                <View style={stiller.satirOrta}>
                  <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                    {item.kullaniciAdi}
                  </Text>
                  {item.notMetni && (
                    <Text style={stiller.not} numberOfLines={2}>
                      {item.notMetni}
                    </Text>
                  )}
                </View>
              </Pressable>
              {!benim && (
                <Pressable
                  onPress={() => router.push(`/sikayet?hedefTur=check_in&hedefId=${item.id}`)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.sikayetLink}>Şikayet et</Text>
                </Pressable>
              )}
            </View>
          )
        })}
      </>
    )
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={mekan?.ad ?? ''} geriEtiketi="Geri" />

      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        {altSatir !== '' && <Text style={stiller.altSatir}>{altSatir}</Text>}
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {kendiCheckIni ? (
          <Pressable
            style={stiller.anahtarli}
            onPress={() => ayril(kendiCheckIni.id)}
            accessibilityRole="button"
          >
            <Text style={stiller.anahtarliYazi}>Ayrıldım</Text>
          </Pressable>
        ) : (
          <Pressable
            style={stiller.birincil}
            onPress={() => router.push(`/check-in/${id}`)}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>Check-in yap</Text>
          </Pressable>
        )}

        <View style={stiller.bolumBasligi}>
          {/* Turuncu nokta: burasi "su an oluyor" bolumu. */}
          <View style={stiller.canliNokta} />
          <Text style={stiller.bolumAd} accessibilityRole="header">
            Şu an burada
          </Text>
        </View>
        <Satirlar veri={suAnBurdakiler} bos="Şu an kimse yok" />

        <Text style={[stiller.bolumAd, stiller.ikinciBolum]} accessibilityRole="header">
          Anılar
        </Text>
        <Satirlar veri={anilar} bos="Henüz bir anı yok" />
      </ScrollView>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingHorizontal: bosluk.xl, paddingBottom: ALT_GEZINME_PAYI },

  altSatir: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.l,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingVertical: bosluk.s,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    ...golge.yuzer,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  anahtarli: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  anahtarliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  bolumBasligi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    marginTop: bosluk.xxl,
    marginBottom: bosluk.xs,
  },
  canliNokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: renk.turuncu },
  bolumAd: {
    fontFamily: yazi.baslik,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  ikinciBolum: { marginTop: bosluk.xxl, marginBottom: bosluk.xs },

  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  satirIcerik: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.baslikKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  satirOrta: { flex: 1 },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  sikayetLink: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
})
