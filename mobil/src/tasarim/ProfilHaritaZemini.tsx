import { View, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { ANA_YOLLAR, ORTA_YOLLAR, INCE_YOLLAR, YESIL_ALANLAR } from './karsilama-harita'
import { useRenk } from './tema-baglami'

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
  const renk = useRenk()
  return (
    <View style={[stiller.kap, { height: yukseklik }]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 60 320 200"
        preserveAspectRatio="xMidYMid slice"
      >
        {YESIL_ALANLAR.map((d, i) => (
          <Path key={`y${i}`} d={d} fill={renk.haritaYesil} />
        ))}
        {INCE_YOLLAR.map((d, i) => (
          <Path key={`i${i}`} d={d} stroke={renk.haritaYolInce} strokeWidth={1.6} fill="none" />
        ))}
        {ORTA_YOLLAR.map((d, i) => (
          <Path key={`o${i}`} d={d} stroke={renk.haritaYolOrta} strokeWidth={3.4} fill="none" />
        ))}
        {ANA_YOLLAR.map((d, i) => (
          <Path key={`a${i}`} d={d} stroke={renk.haritaYolAna} strokeWidth={6.5} fill="none" />
        ))}
      </Svg>
    </View>
  )
}

const stiller = StyleSheet.create({
  /*
   * RENKLER TEMAYLA DONUYOR (`haritaYol*` jetonlari).
   *
   * ILK YAZIMDA SABITTILER ve bu bir HATAYDI: "harita her modda acik
   * gorunsun" diye acik gri tonlar yazilmisti, koyu modda doku siyah
   * zeminde PARLADI. Canli ekran goruntusuyle yakalandi (2026-09-10).
   * Dogru olcut sabit renk degil, ZEMINE GORE HAFIF kalmak.
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
