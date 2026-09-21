import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDil } from '../../lib/dil'
import { IFADELER, IFADE_KATEGORILERI, ifadeBul, type Ifade, type IfadeKategorisi } from '../../lib/ifadeler'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { SURE, useModalHareketi } from './hareket'

/**
 * CHECK-IN IFADE SECICI (2026-09-21, kullanicinin karari: "bu ifadeleri
 * check-in yaparken not ekleme kisminda kullanicilar kullanabilecek").
 *
 * 108 ifade, 12 kategori (lib/ifadeler.ts). Alttan gelen sayfa: ustte
 * yatay kategori cipleri, altta 3 sutunlu izgara (ikon 56 + etiket).
 * TEK ifade secilir; secim aninda sayfa kapanir. Seciliyken tekrar
 * basmak kaldirir. Hareket: SecimPenceresi ile ayni `useModalHareketi`
 * (320 ms giris / 240 ms cikis, cekmece egrisi).
 *
 * Etiketler sozlukten degil manifestten (lib/ifadeler.ts) - ifade
 * adlari uygulama dili degil setin kendi adi; 7 dile cevirisi ayri bir
 * is (once Turkce, ceviri sonra kurali).
 */

const SUTUN = 3

export function IfadeSecici({
  acikMi,
  secili,
  onSec,
  onKapat,
}: {
  acikMi: boolean
  secili: string | null
  onSec: (slug: string | null) => void
  onKapat: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)
  const baslangicKategori = (ifadeBul(secili ?? '')?.kategori ?? IFADE_KATEGORILERI[0].slug) as IfadeKategorisi
  const [kategori, setKategori] = useState<IfadeKategorisi>(baslangicKategori)
  /*
   * KATEGORILER YATAY SAYFALI (kullanicinin istegi 2026-09-21: "sayfa
   * elle yana kaydirilabilsin, kaydirinca obur ifadelere gecilsin").
   * Her sayfa bir kategorinin 3 sutunlu izgarasi; genislik olculuyor
   * (`sayfaEni`), `pagingEnabled` ile kaydirma sayfaya oturuyor.
   * Kaydirma bitince cip de ona geciyor; cipe basmak sayfayi kaydiriyor.
   */
  const sayfalar = useMemo(
    () => IFADE_KATEGORILERI.map((k) => ({ slug: k.slug as IfadeKategorisi, ifadeler: IFADELER.filter((i) => i.kategori === k.slug) })),
    []
  )
  const [olculenEn, setOlculenEn] = useState(0)
  // Olcum gelene kadar pencere genisligi - yan dolgu (ilk kare + jest).
  const pencereEni = useWindowDimensions().width
  const sayfaEni = olculenEn || Math.max(1, pencereEni - bosluk.m * 2)
  const sayfaListesi = useRef<FlatList<(typeof sayfalar)[number]>>(null)
  const baslangicIndeksi = Math.max(0, sayfalar.findIndex((s) => s.slug === baslangicKategori))
  /*
   * SECILI CIP GORUNUR ALANA KAYAR (kullanicinin bildirimi 2026-09-21:
   * "yana kaydirdikca basliklarda kaysin, hangi baslikta olundugu
   * gorulmuyor"). Her cipin x'i ve eni onLayout ile tutuluyor; kategori
   * degisince cip satiri onu ortalayacak sekilde kaydiriliyor.
   */
  const cipSeridi = useRef<ScrollView>(null)
  const cipKonumlari = useRef<Record<string, { x: number; en: number }>>({})
  useEffect(() => {
    const k = cipKonumlari.current[kategori]
    if (!k || !sayfaEni) return
    cipSeridi.current?.scrollTo({ x: Math.max(0, k.x + k.en / 2 - sayfaEni / 2), animated: true })
  }, [kategori, sayfaEni])

  function kategoriyeGit(slug: IfadeKategorisi) {
    setKategori(slug)
    const i = sayfalar.findIndex((s) => s.slug === slug)
    if (i >= 0) sayfaListesi.current?.scrollToIndex({ index: i, animated: true })
  }

  if (!gorunur) return null

  const girisY = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [600, 0] })

  function sec(ifade: Ifade) {
    onSec(ifade.slug === secili ? null : ifade.slug)
    onKapat()
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      <Pressable style={stiller.zemin} testID="ifade-zemini" onPress={onKapat}>
        <Animated.View
          style={[stiller.sayfa, { paddingBottom: Math.max(guvenliAlan.bottom, bosluk.s) + bosluk.s, transform: [{ translateY: girisY }] }]}
        >
          <Pressable testID="ifade-secici" onPress={() => {}} accessibilityViewIsModal style={stiller.icerik}>
            <View style={stiller.tutamac} />
            <Text style={stiller.baslik} accessibilityRole="header">
              {t('checkIn.ifadeBaslik')}
            </Text>
            <ScrollView ref={cipSeridi} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.kategoriler} testID="ifade-cipleri">
              {IFADE_KATEGORILERI.map((k) => {
                const seciliMi = k.slug === kategori
                return (
                  <Pressable
                    key={k.slug}
                    onPress={() => kategoriyeGit(k.slug as IfadeKategorisi)}
                    onLayout={(o) => {
                      cipKonumlari.current[k.slug] = { x: o.nativeEvent.layout.x, en: o.nativeEvent.layout.width }
                    }}
                    style={[stiller.kategori, seciliMi && stiller.kategoriSecili]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seciliMi }}
                    testID={`ifade-kategori-${k.slug}`}
                  >
                    <Text style={[stiller.kategoriYazi, seciliMi && stiller.kategoriYaziSecili]}>{k.ad}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <View style={stiller.sayfaAlani} onLayout={(o) => setOlculenEn(o.nativeEvent.layout.width)}>
              {(
                <FlatList
                  ref={sayfaListesi}
                  data={sayfalar}
                  keyExtractor={(sayfa) => sayfa.slug}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  initialScrollIndex={baslangicIndeksi}
                  // 12 sayfa, 108 yerel PNG: hepsi bastan ciziliyor ki cipe
                  // basip kaydirmak ve elle kaydirmak takilmadan calissin.
                  initialNumToRender={IFADE_KATEGORILERI.length}
                  windowSize={IFADE_KATEGORILERI.length}
                  getItemLayout={(_, index) => ({ length: sayfaEni, offset: sayfaEni * index, index })}
                  onMomentumScrollEnd={(o) => {
                    const i = Math.round(o.nativeEvent.contentOffset.x / sayfaEni)
                    const hedef = sayfalar[i]
                    if (hedef && hedef.slug !== kategori) setKategori(hedef.slug)
                  }}
                  testID="ifade-sayfalari"
                  renderItem={({ item: sayfa }) => (
                    <ScrollView style={{ width: sayfaEni }} contentContainerStyle={stiller.izgara} showsVerticalScrollIndicator={false}>
                      {satirlar(sayfa.ifadeler).map((satir, si) => (
                        <View key={si} style={stiller.satir}>
                          {satir.map((item) => {
                            const seciliMi = item.slug === secili
                            return (
                              <Pressable
                                key={item.slug}
                                onPress={() => sec(item)}
                                style={({ pressed }) => [stiller.ifade, seciliMi && stiller.ifadeSecili, pressed && stiller.ifadeBasili]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: seciliMi }}
                                accessibilityLabel={item.etiket}
                                testID={`ifade-${item.slug}`}
                              >
                                <Image source={item.kaynak} style={stiller.ikon} resizeMode="contain" />
                                <Text style={stiller.etiket} numberOfLines={2}>
                                  {item.etiket}
                                </Text>
                              </Pressable>
                            )
                          })}
                          {/* Eksik hucreler: son satir da uc sutuna bolunsun. */}
                          {satir.length < SUTUN &&
                            Array.from({ length: SUTUN - satir.length }).map((_, k) => <View key={`bos-${k}`} style={stiller.ifade} />)}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                />
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

/** Ifadeleri SUTUN'luk satirlara boler. */
function satirlar(ifadeler: Ifade[]): Ifade[][] {
  const sonuc: Ifade[][] = []
  for (let i = 0; i < ifadeler.length; i += SUTUN) sonuc.push(ifadeler.slice(i, i + SUTUN))
  return sonuc
}

/**
 * Formda ve kartta gorunen ifade cipi: ikon + etiket (+ kaldirma).
 * `onKaldir` verilmezse salt gosterim (kart).
 */
export function IfadeCipi({ slug, onKaldir, onPress }: { slug: string; onKaldir?: () => void; onPress?: () => void }) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const ifade = ifadeBul(slug)
  if (!ifade) return null
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={stiller.cip}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={ifade.etiket}
      testID={`ifade-cipi-${slug}`}
    >
      <Image source={ifade.kaynak} style={stiller.cipIkon} resizeMode="contain" />
      <Text style={stiller.cipYazi}>{ifade.etiket}</Text>
      {onKaldir && (
        <Pressable onPress={onKaldir} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('checkIn.ifadeKaldir')} testID="ifade-kaldir">
          <Text style={stiller.cipKaldir}>×</Text>
        </Pressable>
      )}
    </Pressable>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zeminRenk: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23, 19, 15, 0.45)' },
    zemin: { flex: 1, justifyContent: 'flex-end' },
    sayfa: {
      backgroundColor: renk.yuzey,
      borderTopLeftRadius: yuvarlak.buyuk,
      borderTopRightRadius: yuvarlak.buyuk,
      paddingTop: bosluk.s,
      paddingHorizontal: bosluk.m,
      maxHeight: '80%',
    },
    icerik: { flexShrink: 1 },
    tutamac: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: renk.cizgi, marginBottom: bosluk.m },
    baslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.altBaslik, letterSpacing: -0.3, color: renk.metin, marginBottom: bosluk.m, marginHorizontal: bosluk.xs },
    kategoriler: { gap: bosluk.s, paddingHorizontal: bosluk.xs, paddingBottom: bosluk.m },
    kategori: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: yuvarlak.hap, borderWidth: 1, borderColor: renk.cizgi },
    kategoriSecili: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
    kategoriYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },
    kategoriYaziSecili: { color: '#FFFFFF' },
    sayfaAlani: { flexShrink: 1 },
    izgara: { paddingBottom: bosluk.s },
    satir: { flexDirection: 'row', gap: bosluk.s, marginBottom: bosluk.s },
    ifade: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: bosluk.m,
      paddingHorizontal: bosluk.xs,
      borderRadius: yuvarlak.kart,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    ifadeSecili: { backgroundColor: renk.turuncuZemin, borderColor: renk.turuncu },
    ifadeBasili: { backgroundColor: renk.turuncuZemin },
    ikon: { width: 56, height: 56 },
    etiket: { fontFamily: yazi.govdeOrta, fontSize: olcek.minik + 1, color: renk.metin, textAlign: 'center', lineHeight: 15 },
    cip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.s,
      alignSelf: 'flex-start',
      backgroundColor: renk.turuncuZemin,
      borderRadius: yuvarlak.hap,
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: 12,
    },
    cipIkon: { width: 30, height: 30 },
    cipYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk + 1, color: renk.metin },
    cipKaldir: { fontFamily: yazi.govdeOrta, fontSize: 18, color: renk.metinIkincil, marginLeft: 2, lineHeight: 20 },
  })
