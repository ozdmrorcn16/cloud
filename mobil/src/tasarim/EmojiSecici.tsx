import { useRef, useState } from 'react'
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDil } from '../../lib/dil'
import { EMOJI_KATEGORILERI, type EmojiKategorisi } from '../../lib/emojiler'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { SURE, useModalHareketi } from './hareket'

/**
 * EMOJI SECICI (2026-09-26): anlik izleyicinin arti dugmesi butun
 * standart emoji listesini buradan acar. Alttan gelen sayfa (IfadeSecici
 * ile ayni hareket ve tema jetonlari): ustte kategori cipleri, altta
 * bolumlu 8 sutunlu izgara; cipe basmak bolume kaydirir. TEK emoji;
 * secince sayfa kapanir, secili emojiye yeniden basmak kaldirir (null).
 */
export function EmojiSecici({
  acikMi,
  secili,
  onSec,
  onKapat,
}: {
  acikMi: boolean
  secili: string | null
  onSec: (emoji: string | null) => void
  onKapat: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)
  const [kategori, setKategori] = useState<EmojiKategorisi>('yuzler')
  const liste = useRef<ScrollView>(null)
  const bolumY = useRef<Record<string, number>>({})

  if (!gorunur) return null

  const girisY = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [600, 0] })

  function sec(emoji: string) {
    onSec(emoji === secili ? null : emoji)
    onKapat()
  }

  function kategoriyeGit(slug: EmojiKategorisi) {
    setKategori(slug)
    liste.current?.scrollTo({ y: bolumY.current[slug] ?? 0, animated: true })
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      <Pressable style={stiller.zemin} testID="emoji-zemini" onPress={onKapat}>
        <Animated.View
          style={[stiller.sayfa, { paddingBottom: Math.max(guvenliAlan.bottom, bosluk.s) + bosluk.s, transform: [{ translateY: girisY }] }]}
        >
          <Pressable testID="emoji-secici" onPress={() => {}} accessibilityViewIsModal style={stiller.icerik}>
            <View style={stiller.tutamac} />
            <Text style={stiller.baslik} accessibilityRole="header">
              {t('emoji.baslik')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.kategoriler}>
              {EMOJI_KATEGORILERI.map((k) => {
                const seciliMi = k.slug === kategori
                return (
                  <Pressable
                    key={k.slug}
                    onPress={() => kategoriyeGit(k.slug)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seciliMi }}
                    testID={`emoji-kategori-${k.slug}`}
                    style={[stiller.kategori, seciliMi && stiller.kategoriSecili]}
                  >
                    <Text style={[stiller.kategoriYazi, seciliMi && stiller.kategoriYaziSecili]}>{t(`emoji.${k.slug}`)}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <ScrollView ref={liste} style={stiller.liste} showsVerticalScrollIndicator={false}>
              {EMOJI_KATEGORILERI.map((k) => (
                <View key={k.slug} onLayout={(o) => (bolumY.current[k.slug] = o.nativeEvent.layout.y)}>
                  <Text style={stiller.bolumBasligi}>{t(`emoji.${k.slug}`)}</Text>
                  <View style={stiller.izgara}>
                    {k.emojiler.map((emoji) => (
                      <Pressable
                        key={emoji}
                        onPress={() => sec(emoji)}
                        accessibilityRole="button"
                        accessibilityLabel={emoji}
                        accessibilityState={{ selected: emoji === secili }}
                        testID={`emoji-${emoji}`}
                        style={({ pressed }) => [stiller.hucre, emoji === secili && stiller.hucreSecili, pressed && stiller.hucreBasili]}
                      >
                        <Text style={stiller.emoji}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zeminRenk: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23, 19, 15, 0.45)' },
    zemin: { flex: 1, justifyContent: 'flex-end' },
    sayfa: {
      backgroundColor: renk.yuzey,
      borderTopLeftRadius: yuvarlak.buyuk,
      borderTopRightRadius: yuvarlak.buyuk,
      paddingTop: bosluk.s,
      paddingHorizontal: bosluk.m,
      maxHeight: '75%',
    },
    icerik: { flexShrink: 1 },
    tutamac: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: renk.cizgi, marginBottom: bosluk.m },
    baslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.altBaslik, color: renk.metin, marginBottom: bosluk.m, marginHorizontal: bosluk.xs },
    kategoriler: { gap: bosluk.s, paddingHorizontal: bosluk.xs, paddingBottom: bosluk.m },
    kategori: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: yuvarlak.hap, borderWidth: 1, borderColor: renk.cizgi },
    kategoriSecili: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
    kategoriYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },
    kategoriYaziSecili: { color: '#FFFFFF' },
    liste: { flexShrink: 1 },
    bolumBasligi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.metinIkincil, marginTop: bosluk.s, marginBottom: bosluk.xs, marginHorizontal: bosluk.xs },
    izgara: { flexDirection: 'row', flexWrap: 'wrap' },
    hucre: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    hucreSecili: { backgroundColor: renk.turuncuZemin, borderWidth: 1.5, borderColor: renk.turuncu },
    hucreBasili: { backgroundColor: renk.turuncuZemin },
    emoji: { fontSize: 28, lineHeight: 34 },
  })
