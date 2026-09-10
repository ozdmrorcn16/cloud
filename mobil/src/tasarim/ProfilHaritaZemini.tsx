import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { ANA_YOLLAR, ORTA_YOLLAR, INCE_YOLLAR, YESIL_ALANLAR } from './karsilama-harita'

/**
 * PROFIL UST BLOGUNUN ARKASINDAKI HARITA DOKUSU.
 *
 * Kullanicinin istegi (2026-09-10): "attigim kisim kadarini kaplayan,
 * sadece o kismi, hicbiryerin ismi yazmayan gercek map goruntusu ekle
 * arka plana, hafif seffaf gibi bir goruntu gibi olsun."
 *
 * GEOMETRI YENIDEN CEKILMEDI: karsilama ekraninin `karsilama-harita.ts`
 * dosyasi kullaniliyor - Bursa/Nilufer'in GERCEK yol agi, OSM'den bir
 * kez cekilmis (9 ana + 24 orta + 141 ince yol, 49 yesil alan).
 *
 * NEDEN HAZIR HARITA DEGIL: hazir dosemelerde SOKAK ADLARI gomulu
 * geliyor ve kullanici tam olarak onlari istemedi ("hicbiryerin ismi
 * yazmayan"). Vektor cizim ayrica ag istegi de yapmiyor, yani profil
 * acilisini yavaslatmiyor. Ayni gerekce 2026-09-04'te karsilama
 * ekraninda da kayitliydi.
 *
 * ODbL ATFI: yol agi turetilmis bir eser ve atif karsilama ekraninda
 * zaten veriliyor (`karsilama.haritaAtfi`). Ayni geometrinin ikinci bir
 * ekranda gorunmesi yeni bir atif yukumlulugu dogurmuyor - kaynak ayni.
 *
 * SOLUK VE KIRPILMIS: opaklik 0,18 ve alt kenarda yumusak bir sonme
 * var; keskin bir kenar "yarim kalmis gorsel" gibi okunurdu. Yukseklik
 * disaridan geliyor cunku sinir bir TASARIM karari - kullanici
 * "profili duzenle yazisina kadar olsun yeter" dedi.
 */
export function ProfilHaritaZemini({ yukseklik }: { yukseklik: number }) {
  return (
    <View style={[stiller.kap, { height: yukseklik }]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 60 320 200"
        preserveAspectRatio="xMidYMid slice"
      >
        {YESIL_ALANLAR.map((d, i) => (
          <Path key={`y${i}`} d={d} fill="#E9EFE4" />
        ))}
        {INCE_YOLLAR.map((d, i) => (
          <Path key={`i${i}`} d={d} stroke="#E6DFD6" strokeWidth={1.6} fill="none" />
        ))}
        {ORTA_YOLLAR.map((d, i) => (
          <Path key={`o${i}`} d={d} stroke="#DED5C9" strokeWidth={3.4} fill="none" />
        ))}
        {ANA_YOLLAR.map((d, i) => (
          <Path key={`a${i}`} d={d} stroke="#D5C9BA" strokeWidth={6.5} fill="none" />
        ))}
      </Svg>
    </View>
  )
}

const stiller = StyleSheet.create({
  /*
   * TEMADAN BAGIMSIZ RENKLER ve bu bilincli: doku her iki modda da
   * ACIK bir harita gibi okunmali. Temayla donen jetonlar koyu modda
   * yollari beyaza cevirir ve doku bir agacik gibi gorunurdu.
   *
   * Opaklik burada, cizgilerde degil: tek yerden ayarlanabilsin.
   */
  kap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    opacity: 0.18,
  },
})
