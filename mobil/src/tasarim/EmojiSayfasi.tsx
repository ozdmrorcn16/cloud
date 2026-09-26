import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Path } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { emojiAra, tumEmojiler } from '../../lib/emoji-veri'
import { useHareket } from './hareket'
import { yazi, olcek } from './tema'

/**
 * EMOJI SAYFASI (2026-09-26, kullanicinin referansi: anlik izleyicide
 * arti basinca). Koyu, kenarlardan boslukla yuzen sayfa: tutamac, "Ara"
 * kutusu, "Onerilenler" (en sik 18) ve "Tumu" (1870 emoji, 6 sutun).
 * Yarim yukseklikte acilir; tutamactan YUKARI cekince tam ekran, ASAGI
 * cekince kapanir. Aramaya dokununca da tam ekrana cikar. Secince kapanir.
 *
 * Renkler SABIT (koyu): referans boyle ve sayfa her iki temada siyah
 * anlik izleyicinin ustunde aciliyor.
 */
const SUTUN = 6
type Satir = { tur: 'baslik'; metin: string; anahtar: string } | { tur: 'emojiler'; emojiler: string[]; anahtar: string }

function satirlaraBol(emojiler: string[], onEk: string): Satir[] {
  const satirlar: Satir[] = []
  for (let i = 0; i < emojiler.length; i += SUTUN) {
    satirlar.push({ tur: 'emojiler', emojiler: emojiler.slice(i, i + SUTUN), anahtar: `${onEk}-${i}` })
  }
  return satirlar
}

export function EmojiSayfasi({
  acikMi,
  onerilenler,
  secili,
  onSec,
  onKapat,
}: {
  acikMi: boolean
  onerilenler: string[]
  secili: string | null
  onSec: (emoji: string) => void
  onKapat: () => void
}) {
  const { t, dil } = useDil()
  const hareket = useHareket()
  const guvenliAlan = useSafeAreaInsets()
  const { height: ekranBoyu } = useWindowDimensions()
  const [gorunur, setGorunur] = useState(acikMi)
  const [sorgu, setSorgu] = useState('')

  // Sayfa HEP tam boyda cizilir; yarim durumda asagi itilmistir (native
  // driver ile yalnizca translateY).
  const tamBoy = ekranBoyu - guvenliAlan.top - 8
  const yarimY = Math.round(tamBoy * 0.42)
  const kapaliY = tamBoy + 40
  const y = useRef(new Animated.Value(kapaliY)).current
  const perde = useRef(new Animated.Value(0)).current
  const durum = useRef<'yarim' | 'tam'>('yarim')
  const suruklemeBasi = useRef(0)

  function git(hedef: number, sonra?: () => void) {
    if (!hareket) {
      y.setValue(hedef)
      sonra?.()
      return
    }
    Animated.spring(y, { toValue: hedef, speed: 16, bounciness: hedef === kapaliY ? 0 : 5, useNativeDriver: true }).start(
      () => sonra?.()
    )
  }

  useEffect(() => {
    if (acikMi) {
      setGorunur(true)
      setSorgu('')
      durum.current = 'yarim'
      y.setValue(kapaliY)
      Animated.timing(perde, { toValue: 1, duration: hareket ? 200 : 0, useNativeDriver: true }).start()
      git(yarimY)
      return
    }
    if (!gorunur) return
    Keyboard.dismiss()
    Animated.timing(perde, { toValue: 0, duration: hareket ? 180 : 0, useNativeDriver: true }).start()
    git(kapaliY, () => setGorunur(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acikMi])

  const surukleyici = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          y.stopAnimation((v) => (suruklemeBasi.current = v))
        },
        onPanResponderMove: (_, g) => {
          y.setValue(Math.max(0, suruklemeBasi.current + g.dy))
        },
        onPanResponderRelease: (_, g) => {
          const simdi = Math.max(0, suruklemeBasi.current + g.dy)
          if (g.vy > 0.9 || simdi > yarimY + 90) {
            onKapat()
            return
          }
          if (g.vy < -0.5 || simdi < yarimY / 2) {
            durum.current = 'tam'
            git(0)
          } else {
            durum.current = 'yarim'
            git(yarimY)
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yarimY, kapaliY]
  )

  const satirlar = useMemo<Satir[]>(() => {
    if (sorgu.trim()) {
      const sonuc = emojiAra(sorgu, dil)
      return sonuc.length ? satirlaraBol(sonuc, 'ara') : [{ tur: 'baslik', metin: t('emoji.sonucYok'), anahtar: 'yok' }]
    }
    return [
      ...(onerilenler.length
        ? [{ tur: 'baslik' as const, metin: t('emoji.onerilenler'), anahtar: 'b-oneri' }, ...satirlaraBol(onerilenler.slice(0, 18), 'oneri')]
        : []),
      { tur: 'baslik', metin: t('emoji.tumu'), anahtar: 'b-tumu' },
      ...satirlaraBol(tumEmojiler(), 'tumu'),
    ]
  }, [sorgu, dil, onerilenler, t])

  if (!gorunur) return null

  function sec(emoji: string) {
    onSec(emoji)
    onKapat()
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.perde, { opacity: perde }]} />
      <Pressable style={StyleSheet.absoluteFill} testID="emoji-zemini" onPress={onKapat} />
      <Animated.View
        style={[stiller.sayfa, { height: tamBoy, bottom: 0, transform: [{ translateY: y }] }]}
        testID="emoji-sayfasi"
        accessibilityViewIsModal
      >
        {/* Surukleme alani: tutamac + arama satiri (duz View - Pressable
            responder'lari PanResponder'i ezer). */}
        <View {...surukleyici.panHandlers} style={stiller.ust}>
          <View style={stiller.tutamac} />
          <View style={stiller.ara}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Circle cx={11} cy={11} r={6.5} stroke="rgba(235,235,245,0.6)" strokeWidth={2.2} fill="none" />
              <Path d="M16 16l4 4" stroke="rgba(235,235,245,0.6)" strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
            <TextInput
              value={sorgu}
              onChangeText={setSorgu}
              placeholder={t('emoji.ara')}
              placeholderTextColor="rgba(235,235,245,0.6)"
              style={stiller.araGirdi}
              onFocus={() => {
                durum.current = 'tam'
                git(0)
              }}
              autoCorrect={false}
              returnKeyType="search"
              testID="emoji-ara"
            />
          </View>
        </View>
        <FlatList
          data={satirlar}
          keyExtractor={(s) => s.anahtar}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={12}
          windowSize={7}
          contentContainerStyle={{ paddingBottom: guvenliAlan.bottom + yarimY + 16 }}
          renderItem={({ item }) =>
            item.tur === 'baslik' ? (
              <Text style={stiller.baslik}>{item.metin}</Text>
            ) : (
              <View style={stiller.satir}>
                {item.emojiler.map((emoji) => (
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
                {Array.from({ length: SUTUN - item.emojiler.length }, (_, i) => (
                  <View key={`bos-${i}`} style={stiller.hucre} />
                ))}
              </View>
            )
          }
        />
      </Animated.View>
    </Modal>
  )
}

const stiller = StyleSheet.create({
  perde: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sayfa: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: '#2A2A2E',
    borderRadius: 30,
    overflow: 'hidden',
  },
  ust: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 6 },
  tutamac: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  ara: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(118,118,128,0.32)',
  },
  araGirdi: { flex: 1, color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.govde + 2, paddingVertical: 0 },
  baslik: { color: '#FFFFFF', fontFamily: yazi.ekranBasligi, fontSize: olcek.govde + 1, marginTop: 16, marginBottom: 6, marginHorizontal: 18 },
  satir: { flexDirection: 'row', paddingHorizontal: 10 },
  hucre: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  hucreSecili: { backgroundColor: 'rgba(254,120,19,0.25)', borderWidth: 2, borderColor: '#FE7813' },
  hucreBasili: { backgroundColor: 'rgba(255,255,255,0.12)' },
  emoji: { fontSize: 38, lineHeight: 46 },
})
