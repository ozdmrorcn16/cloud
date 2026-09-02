import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { renk, yazi, olcek, bosluk, yuvarlak } from './tema'

/**
 * Ayar listesi bilesenleri.
 *
 * Kullanicinin karari (2026-08-25): ayarlar Instagram'daki gibi
 * gruplanmis satirlar halinde olsun - bolum basligi, solda ikon, sagda
 * deger ya da ok. Onceki hali serbest yerlesimli dugmeler yiginiydi;
 * ne gruplu ne taranabilirdi.
 *
 * Desen bilerek sade: bir satir ya BASKA BIR EKRANA gider (ok), ya bir
 * degeri gosterir (deger + ok), ya da yerinde bir anahtar tasir. Ucu
 * ayni gorsel ritimde durur.
 */

export function Bolum({ baslik, children }: { baslik?: string; children: ReactNode }) {
  return (
    <View style={stiller.bolum}>
      {baslik && <Text style={stiller.bolumBasligi}>{baslik}</Text>}
      <View style={stiller.kart}>{children}</View>
    </View>
  )
}

export function Satir({
  ikon,
  etiket,
  aciklama,
  deger,
  sagBilesen,
  sonuncu = false,
  tehlikeli = false,
  okYok = false,
  onPress,
}: {
  ikon?: ReactNode
  etiket: string
  /**
   * Etiketin altinda duran aciklama. Gizlilik ayarlarinda SART:
   * "Profilim gizli" tek basina neyin gizlenecegini soylemiyor -
   * kullanici anahtari cevirmeden once ne olacagini bilmeli.
   */
  aciklama?: string
  deger?: string
  /** Anahtar gibi yerinde duran bir denetim. Verilirse ok cizilmez. */
  sagBilesen?: ReactNode
  sonuncu?: boolean
  /**
   * Baska bir ekrana GITMEYEN eylemler icin (cikis yapmak, yerinde
   * acilan bir onay). Ok bir yere gidildigini soyler; gidilmiyorsa
   * yalan soyler.
   */
  okYok?: boolean
  /** Hesabi silmek gibi geri donusu olmayan eylemler icin. */
  tehlikeli?: boolean
  onPress?: () => void
}) {
  const govde = (
    <View style={[stiller.satir, !sonuncu && stiller.satirCizgili]}>
      {ikon && <View style={stiller.ikon}>{ikon}</View>}
      <View style={stiller.metinAlani}>
        <Text
          style={[stiller.etiket, tehlikeli && stiller.etiketTehlikeli]}
          numberOfLines={1}
        >
          {etiket}
        </Text>
        {aciklama && <Text style={stiller.aciklama}>{aciklama}</Text>}
      </View>
      {deger && (
        <Text style={stiller.deger} numberOfLines={1}>
          {deger}
        </Text>
      )}
      {sagBilesen ?? (onPress && !okYok ? <Ok /> : null)}
    </View>
  )

  if (!onPress) return govde
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {govde}
    </Pressable>
  )
}

/** Bir listeden tek deger secmek icin: secili olan tik alir. */
export function SecenekSatiri({
  etiket,
  aciklama,
  secili,
  sonuncu = false,
  onPress,
}: {
  etiket: string
  aciklama?: string
  secili: boolean
  sonuncu?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={etiket}
      accessibilityState={{ selected: secili }}
    >
      <View style={[stiller.satir, !sonuncu && stiller.satirCizgili]}>
        <View style={stiller.secenekOrta}>
          <Text style={[stiller.etiket, secili && stiller.etiketSecili]}>{etiket}</Text>
          {aciklama && <Text style={stiller.aciklama}>{aciklama}</Text>}
        </View>
        {/* Secim yalnizca renkle degil, tikle de anlatiliyor. */}
        {secili && (
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.5 4.5L19 7"
              stroke={renk.turuncu}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        )}
      </View>
    </Pressable>
  )
}

function Ok() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M9 5l7 7-7 7"
        stroke={renk.metinSoluk}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

const stiller = StyleSheet.create({
  // Etiket ve aciklama tek sutun; aciklama varsa satir yukseliyor.
  metinAlani: { flex: 1 },

  bolum: { marginTop: bosluk.xl },
  bolumBasligi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.s,
    marginLeft: bosluk.xs,
  },
  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    overflow: 'hidden',
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    // 44 pt'lik dokunma hedefi: 14 + 14 + metin yuksekligi.
    paddingVertical: 14,
    paddingHorizontal: bosluk.l,
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  ikon: { width: 22, alignItems: 'center' },
  etiket: {
    flex: 1,
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  etiketSecili: { fontFamily: yazi.govdeKalin },
  etiketTehlikeli: { color: '#C0392B' },
  deger: {
    flexShrink: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  secenekOrta: { flex: 1 },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    marginTop: 2,
  },
})
