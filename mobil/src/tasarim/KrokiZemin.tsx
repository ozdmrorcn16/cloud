import { StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Path, Rect } from 'react-native-svg'
import { renk } from './tema'

/**
 * Acilis ekraninin arka plani: bir kroki (basitlestirilmis harita),
 * ustunde check-in ignesi, yayilan halkalar ve cevresinde insanlar.
 *
 * Kullanicinin karari (2026-08-25): "komple acilis sayfasinin arka
 * planini kapsayan bir harita kroki gibi birsey, uzerinde check-in
 * ikonlari ve insani temsil eden gorseller."
 *
 * FOTOGRAF DEGIL, CIZIM. Uc sebep:
 *   1. Uzerine metin biniyor; fotografin uzerinde metin okumak icin
 *      karartma gerekiyor, karartma da acik kimligi bozuyor.
 *      Cizimin tonunu istedigimiz kadar sonduruyoruz.
 *   2. Her ekran boyutuna kayipsiz uyuyor (SVG).
 *   3. Pakete agirlik eklemiyor - fotograf 100 KB+, bu birkac KB kod.
 *
 * Kroki bilerek SOLUK: yollar zemine cok yakin bir tonda, halkalar
 * %6-10 saydamlikta. Onde duran sey icerik, arka plan degil.
 */

// Cizim bu tuvale gore yapiliyor; ekrana 'slice' ile yayiliyor, yani
// oran korunarak kirpiliyor.
const EN = 390
const BOY = 844

/** Yayilan halkalarin ve ignenin merkezi.
 *
 * Icerigin BOS seridine konumlandi: ustte marka ve ozellik listesi,
 * altta butonlar var; arada kalan bant (y 560-700) bos. Ilk denemede
 * merkez yukaridaydi ve igne "Sohbeti orada baslat" satirinin uzerine
 * biniyordu. */
const MERKEZ = { x: 196, y: 626 }

/** Insan halkalari: konum ve boyut. Rastgele degil - ignenin cevresine
 *  dagitilmis, metnin en yogun oldugu orta seride girmeyecek sekilde. */
const KISILER = [
  // Marka kilidinin iki yani.
  { x: 46, y: 150, r: 24 },
  { x: 344, y: 186, r: 21 },
  // Ozellik listesiyle butonlarin arasindaki bos bant.
  { x: 58, y: 596, r: 23 },
  { x: 332, y: 578, r: 25 },
]

/** Krokideki ikincil check-in ignesi konumlari. */
// Igneler metnin USTUNE binmeyecek yerlerde: en ust serit ve alttaki
// bos bant. Ilk denemede ozellik satirlarinin uzerine geliyorlardi.
const IGNELER = [
  { x: 52, y: 86, olcek: 0.45 },
  { x: 340, y: 108, olcek: 0.4 },
  { x: 286, y: 690, olcek: 0.55 },
]

function IgneYolu({ x, y, olcek, renkKodu }: { x: number; y: number; olcek: number; renkKodu: string }) {
  // 24x24 tuvalde cizilmis igne; olcekle buyutulup konumlaniyor.
  return (
    <G transform={`translate(${x - 12 * olcek} ${y - 24 * olcek}) scale(${olcek})`}>
      <Path
        d="M12 0C5.9 0 1 4.9 1 11c0 8 11 19 11 19s11-11 11-19c0-6.1-4.9-11-11-11z"
        fill={renkKodu}
      />
      <Circle cx={12} cy={10.6} r={4.2} fill={renk.zemin} />
    </G>
  )
}

function KisiSiluet({ x, y, r }: { x: number; y: number; r: number }) {
  const s = r / 26
  return (
    <G>
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill={renk.yuzey}
        stroke={renk.turuncu}
        strokeWidth={1.6}
        opacity={0.75}
      />
      {/* Fotograf yok: insani temsil eden sade bir siluet. */}
      <Circle cx={x} cy={y - 5 * s} r={7 * s} fill={renk.turuncu} opacity={0.4} />
      <Path
        d={`M${x - 12 * s} ${y + 16 * s}c0-7 5.4-11 12-11s12 4 12 11z`}
        fill={renk.turuncu}
        opacity={0.55}
      />
    </G>
  )
}

export function KrokiZemin() {
  return (
    <View style={stiller.kok} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${EN} ${BOY}`} preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={EN} height={BOY} fill={renk.zemin} />

        {/* Yapi adalari: yollarin arasindaki bloklar. */}
        <G opacity={0.5}>
          {[
            [18, 92, 118, 96],
            [166, 60, 150, 118],
            [-20, 240, 132, 150],
            [246, 232, 170, 128],
            [30, 452, 120, 140],
            [232, 476, 150, 116],
            [66, 640, 128, 120],
            [242, 664, 140, 130],
          ].map(([x, y, w, h], i) => (
            <Rect key={i} x={x} y={y} width={w} height={h} rx={14} fill={renk.cizgi} />
          ))}
        </G>

        {/* Yollar: krokinin omurgasi. Zemine yakin bir ton - harita
            oldugunu soyluyor ama one cikmiyor. */}
        <G stroke={renk.cizgi} strokeWidth={16} strokeLinecap="round" opacity={0.9}>
          <Path d="M-20 210 L410 232" />
          <Path d="M-20 424 L410 404" />
          <Path d="M-20 618 L410 640" />
          <Path d="M150 -20 L166 864" />
          <Path d="M330 -20 L318 864" />
        </G>
        <G stroke={renk.cizgi} strokeWidth={7} strokeLinecap="round" opacity={0.8}>
          <Path d="M-20 316 L410 306" />
          <Path d="M-20 528 L410 540" />
          <Path d="M60 -20 L44 864" />
          <Path d="M240 -20 L252 864" />
          <Path d="M-20 60 L410 96" />
          <Path d="M-20 740 L410 726" />
        </G>

        {/* Yayilan halkalar: "su an burada" hissi. */}
        <G>
          <Circle cx={MERKEZ.x} cy={MERKEZ.y} r={150} fill={renk.turuncu} opacity={0.05} />
          <Circle cx={MERKEZ.x} cy={MERKEZ.y} r={104} fill={renk.turuncu} opacity={0.06} />
          <Circle cx={MERKEZ.x} cy={MERKEZ.y} r={62} fill={renk.turuncu} opacity={0.08} />
          <Circle
            cx={MERKEZ.x}
            cy={MERKEZ.y}
            r={150}
            stroke={renk.turuncu}
            strokeWidth={1.5}
            fill="none"
            opacity={0.18}
          />
          <Circle
            cx={MERKEZ.x}
            cy={MERKEZ.y}
            r={104}
            stroke={renk.turuncu}
            strokeWidth={1.5}
            fill="none"
            opacity={0.22}
          />
        </G>

        {IGNELER.map((igne, i) => (
          <IgneYolu key={i} {...igne} renkKodu={renk.turuncu} />
        ))}

        {KISILER.map((kisi, i) => (
          <KisiSiluet key={i} {...kisi} />
        ))}

        {/* Merkezdeki check-in ignesi: krokinin odagi. */}
        <IgneYolu x={MERKEZ.x} y={MERKEZ.y + 26} olcek={1.5} renkKodu={renk.turuncu} />
      </Svg>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
})
