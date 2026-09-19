import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

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
  const stiller = useStiller(stilleriYap)
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
  vurgulu = false,
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
  /**
   * Seftali zeminli satir (referans 2026-09-19: "Cikis yap"). Kartin
   * icinde bir satiri digerlerinden ayirir; ikon kutusuz cizilir.
   */
  vurgulu?: boolean
  onPress?: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const govde = (
    <View style={[stiller.satir, !sonuncu && stiller.satirCizgili, vurgulu && stiller.satirVurgulu]}>
      {ikon && <View style={stiller.ikon}>{ikon}</View>}
      <View style={stiller.metinAlani}>
        <Text
          style={[stiller.etiket, tehlikeli && stiller.etiketTehlikeli]}
          numberOfLines={2}
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
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
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
  const renk = useRenk()
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

const stilleriYap = (renk: Renk) => StyleSheet.create({
  // Etiket ve aciklama tek sutun; aciklama varsa satir yukseliyor.
  metinAlani: { flex: 1 },

  bolum: { marginTop: bosluk.xl },
  // 2026-09-19 (kullanicinin istegi "yazilar biraz daha belirgin"):
  // bolum basligi 13 -> 14, satir etiketi 500/15 -> 600/16, aciklama
  // 13 -> 14. Satir bileseni butun ayar ekranlarinda ortak; hepsi
  // birlikte degisti.
  bolumBasligi: {
    fontFamily: yazi.govdeKalin,
    fontSize: 14,
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
  satirVurgulu: { backgroundColor: renk.turuncuZemin },
  // Genislik SABIT DEGIL (2026-09-19, kullanicinin bildirimi "ikonlar
  // yazilar birbirine girmis"): 44'luk seftali ikon kutulari 22'lik
  // sabit kaba sigmiyor, tasan 11 px yazinin ustune biniyordu. Kap
  // icerigine gore buyur; ciplak 20'lik ikonlar icin alt sinir kalir.
  ikon: { minWidth: 22, alignItems: 'center', justifyContent: 'center' },
  etiket: {
    flex: 1,
    fontFamily: yazi.govdeKalin,
    fontSize: 16,
    color: renk.metin,
  },
  etiketSecili: { fontFamily: yazi.govdeKalin },
  etiketTehlikeli: { color: renk.yikici },
  // Deger DARALMAZ, etiket iki satira sarar (cihaz uyumu 2026-09-19:
  // 375 px'te "Profil gorunurlu..." diye kirpiliyordu).
  deger: {
    flexShrink: 0,
    maxWidth: '45%',
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  secenekOrta: { flex: 1 },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: 14,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: 2,
  },
})
