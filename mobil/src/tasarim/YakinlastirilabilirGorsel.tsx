import { Image, ScrollView, StyleSheet, type ImageStyle, type StyleProp } from 'react-native'

/**
 * BUYUK GORUNUMDEKI FOTOGRAF - iki parmakla yakinlastirilabilir.
 *
 * Kullanicinin istegi (2026-09-08): "fotografa yakinlasma yapilabilsin
 * iki parmagimla zoomlamak istedigimde".
 *
 * YONTEM: `ScrollView`in KENDI yakinlastirmasi (`maximumZoomScale`).
 * Yakinlastirma, kaydirma ve sinirlarda geri yaylanma isletim
 * sisteminden geliyor - yani hareket her zaman sistemin geri kalaniyla
 * ayni hissediyor.
 *
 * REANIMATED + GESTURE-HANDLER DENENDI VE ELENDI. Ikisi de zaten
 * bagimliliklarda ve iki platformda calisirdi, ama:
 *   - reanimated 4 jest'te kurulu degil ve testler "Cannot read
 *     properties of undefined (reading 'loadUnpackers')" ile
 *     KOMPLE cokuyordu (olculdu);
 *   - ikisi de uygulamada ilk kez devreye girecekti, yani mevcut
 *     TestFlight derlemesinde calisip calismadigi belirsizdi.
 * `ScrollView` yolu saf JavaScript, OTA ile gidiyor ve testleri
 * bozmuyor.
 *
 * BILINEN SINIR: `ScrollView` yakinlastirmasi yalnizca iOS'ta var.
 * Android'de fotograf aciliyor ama yakinlastirilamiyor. Iki platformda
 * calisan surum gesture-handler + reanimated ister; o gun geldiginde
 * jest kurulumu da yapilmali.
 */
export function YakinlastirilabilirGorsel({
  uri,
  stil,
}: {
  uri: string
  stil?: StyleProp<ImageStyle>
}) {
  return (
    <ScrollView
      testID="yakinlastirilabilir"
      style={stiller.kok}
      contentContainerStyle={stiller.icerik}
      // 1 ile 4 arasi: 1'in altina inmek fotografi cerceveden
      // kucultur, 4'un ustu bu cozunurlukte bulanik.
      minimumZoomScale={1}
      maximumZoomScale={4}
      // Yakinlastirilmamis fotograf ortada dursun; kaydirma cubuklari
      // siyah zeminde gorsel gurultu.
      centerContent
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      // Cift dokunusla yakinlastirma iOS'ta yerlesik degil; ama pinch
      // ile buyutulen goruntu parmak kaldirilinca 1'e geri
      // yaylanmiyor - kullanici istedigi kadar inceleyebiliyor.
      bouncesZoom
    >
      <Image testID="buyuk-fotograf" source={{ uri }} style={stil} resizeMode="contain" />
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1 },
  icerik: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
})
