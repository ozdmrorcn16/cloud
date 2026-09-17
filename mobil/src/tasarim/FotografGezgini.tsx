import { useState, type ReactNode } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useDil } from '../../lib/dil'
import { YakinlastirilabilirGorsel } from './YakinlastirilabilirGorsel'
import { yazi, olcek, bosluk, type Renk } from './tema'
import { useStiller } from './tema-baglami'

export type GezginFotografi = { id: string; url: string }

/**
 * FOTOGRAF GEZGINI: tam ekran, siyah zemin, ustte × ve "3 / 12" sayaci,
 * fotograflar arasinda SAGA-SOLA KAYDIRMA, iki parmakla yakinlastirma,
 * altta cagiranin verdigi altyazi.
 *
 * Mekan galerisinin buyuk gorunumu buradan cikarildi (kullanicinin
 * istegi 2026-09-18: "kendi profilimde ya da baskasinin profilinde
 * saga sola kaydirip fotograflar arasinda gezebileyim"). Onceden profil
 * izgarasi ve anı kartlari TEK fotografi aciyordu; artik uc yer de bu
 * bileseni kullaniyor - ayni sey her ekranda ayni gorunur.
 *
 * Altyazi cagirana birakildi: galeri "kisi + zaman"a, profil "mekan +
 * zaman"a baglanti veriyor; hangi baglantinin anlamli oldugu ekrana
 * gore degisiyor.
 */
export function FotografGezgini({
  fotograflar,
  acikIndeks,
  onIndeks,
  onKapat,
  altyazi,
  testID = 'fotograf',
}: {
  fotograflar: GezginFotografi[]
  /** null: kapali. */
  acikIndeks: number | null
  /** Kaydirmayla sayfa degisince. */
  onIndeks: (indeks: number) => void
  onKapat: () => void
  /** Acik fotografin altyazisi; cagiran FotografAltyazisi ile cizer. */
  altyazi?: (indeks: number) => ReactNode
  /** On ek: `${testID}-buyuk-gorunum` kok, `${testID}-sayac` sayac, `${testID}-sayfalar` liste. */
  testID?: string
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [genislik, setGenislik] = useState(Dimensions.get('window').width)
  // Sayfa YUKSEKLIGI de acikca verilmek zorunda: yatay bir listenin
  // icindeki `flex: 1` sayfa yukseklik almiyor ve fotograf 0 px
  // yuksekliginde ciziliyordu (galeride ekran goruntusuyle yakalandi).
  const [sayfaYuksekligi, setSayfaYuksekligi] = useState(
    Math.round(Dimensions.get('window').height * 0.7)
  )

  const acik = acikIndeks !== null && acikIndeks >= 0 && acikIndeks < fotograflar.length

  function sayfaDegisti(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / genislik)
    if (i !== acikIndeks && i >= 0 && i < fotograflar.length) onIndeks(i)
  }

  return (
    <Modal visible={acik} transparent={false} animationType="fade" onRequestClose={onKapat}>
      {/* Modal agacin disinda kaldigi icin kendi GestureHandlerRootView'ini
          tasiyor (akis kartiyla ayni ders). */}
      <GestureHandlerRootView
        style={stiller.zemin}
        testID={`${testID}-buyuk-gorunum`}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width
          if (w > 0 && Math.abs(w - genislik) > 1) setGenislik(w)
        }}
      >
        <View style={stiller.ustCubuk}>
          <Pressable
            onPress={onKapat}
            accessibilityRole="button"
            accessibilityLabel={t('ortak.kapat')}
            hitSlop={12}
          >
            <Text style={stiller.kapatYazi}>×</Text>
          </Pressable>
          <Text style={stiller.sayac} testID={`${testID}-sayac`}>
            {acik ? (acikIndeks as number) + 1 : 0} / {fotograflar.length}
          </Text>
          <View style={stiller.ustCubukDenge} />
        </View>

        {acik && (
          <View
            style={stiller.sayfalar}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height
              if (h > 0 && Math.abs(h - sayfaYuksekligi) > 1) setSayfaYuksekligi(h)
            }}
          >
            <FlatList
              testID={`${testID}-sayfalar`}
              data={fotograflar}
              keyExtractor={(f) => f.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={acikIndeks as number}
              getItemLayout={(_, i) => ({ length: genislik, offset: genislik * i, index: i })}
              onMomentumScrollEnd={sayfaDegisti}
              renderItem={({ item }) => (
                <View style={{ width: genislik, height: sayfaYuksekligi }}>
                  <YakinlastirilabilirGorsel
                    uri={item.url}
                    stil={{ width: genislik, height: sayfaYuksekligi }}
                    kaydirmaParmagi={2}
                    oturma="contain"
                  />
                </View>
              )}
            />
          </View>
        )}

        {acik && altyazi ? altyazi(acikIndeks as number) : null}
      </GestureHandlerRootView>
    </Modal>
  )
}

const stilleriYap = (_renk: Renk) =>
  StyleSheet.create({
    // Siyah zemin iki modda da sabit - fotograf izleyicisinin zemini
    // temayla donmez.
    zemin: { flex: 1, backgroundColor: '#000000' },
    ustCubuk: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 54,
      paddingHorizontal: bosluk.sayfa,
      paddingBottom: bosluk.s,
    },
    ustCubukDenge: { width: 28 },
    kapatYazi: { color: '#FFFFFF', fontSize: 30, lineHeight: 32, width: 28 },
    sayac: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.govde,
      color: '#FFFFFF',
    },
    sayfalar: { flex: 1 },
  })
