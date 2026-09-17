import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { yazi, olcek, bosluk } from './tema'

/**
 * BUYUK ACILAN FOTOGRAFIN ALTYAZISI - paylasan kisi, mekan, zaman.
 *
 * Kullanicinin istegi (2026-09-17, Swarm ekran goruntusuyle):
 * "paylasilan fotografin sol altinda paylasanin resmi, kullanici adi,
 * konumu ve tarihi gosterilsin fotograf buyuk acildigi zaman".
 *
 * Daha once yalnizca MEKAN SAYFASININ galerisinde vardi; akistaki ve
 * profildeki buyuk gorunum fotografi ciplak aciyordu - ayni fotograf
 * uc yerde uc turlu goruenuyordu. Bilesen o galerinin icinden cikarildi,
 * yani gorunum degismedi, tasindi.
 *
 * SIYAH ZEMINE GORE: butun renkler burada sabit (#FFFFFF, #B3B3B3,
 * #333333). Tema jetonlari kullanilmiyor cunku zemin her iki modda da
 * siyah - acik modda tema metni siyah oldugu icin yazi kaybolurdu.
 *
 * MEKAN ADINDA BULUNMA EKI YOK (2026-09-13 karari): "Istasyonu'da" gibi
 * yanlis ekler ureten kural silindi, ad kendi satirinda duruyor.
 */
export function FotografAltyazisi({
  avatarUrl,
  kullaniciAdi,
  mekanAdi,
  zamanYazisi,
  onKisi,
  onMekan,
  testID,
}: {
  avatarUrl: string | null
  /** Ekranda kalin yazilan ad; yoksa bas harf "?" olur. */
  kullaniciAdi: string | null
  /** Check-in'in yapildigi mekan. Yoksa satir cizilmiyor. */
  mekanAdi: string | null
  /** "7 saat önce" gibi gorece zaman - bicimlendirmeyi cagiran yapar. */
  zamanYazisi: string
  /** Verilirse avatar VE ad kisinin profiline gidiyor. */
  onKisi?: () => void
  /** Verilirse mekan adi mekan sayfasina gidiyor. */
  onMekan?: () => void
  testID?: string
}) {
  const basHarf = (kullaniciAdi ?? '?').trim().charAt(0).toUpperCase() || '?'
  const avatar = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={stiller.avatar} />
  ) : (
    <View style={[stiller.avatar, stiller.avatarBos]}>
      <Text style={stiller.basHarf}>{basHarf}</Text>
    </View>
  )

  return (
    <View style={stiller.kok} testID={testID}>
      {onKisi ? (
        <Pressable
          onPress={onKisi}
          accessibilityRole="button"
          accessibilityLabel={kullaniciAdi ?? ''}
          testID={testID ? `${testID}-avatar` : undefined}
        >
          {avatar}
        </Pressable>
      ) : (
        avatar
      )}
      <View style={stiller.metinler}>
        {/* AD ve MEKAN AYRI HEDEFLER (kullanicinin istegi 2026-09-17):
            ad kisinin profiline, mekan adi mekan sayfasina gidiyor.
            Dokunus hedefi YAZININ KENDISI kadar (`alignSelf: 'flex-start'`)
            - satirin bos sagina basmak bir sey acmamali. */}
        {kullaniciAdi &&
          (onKisi ? (
            <Pressable
              onPress={onKisi}
              accessibilityRole="button"
              style={stiller.hedef}
              hitSlop={6}
              testID={testID ? `${testID}-kisi` : undefined}
            >
              <Text style={stiller.ad} numberOfLines={1}>
                {kullaniciAdi}
              </Text>
            </Pressable>
          ) : (
            <Text style={stiller.ad} numberOfLines={1}>
              {kullaniciAdi}
            </Text>
          ))}
        {mekanAdi &&
          (onMekan ? (
            <Pressable
              onPress={onMekan}
              accessibilityRole="button"
              style={stiller.hedef}
              hitSlop={6}
              testID={testID ? `${testID}-mekan` : undefined}
            >
              <Text style={stiller.mekan} numberOfLines={2}>
                {mekanAdi}
              </Text>
            </Pressable>
          ) : (
            <Text style={stiller.mekan} numberOfLines={2}>
              {mekanAdi}
            </Text>
          ))}
        <Text style={stiller.zaman}>{zamanYazisi}</Text>
      </View>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.m,
    paddingBottom: 40,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarBos: { backgroundColor: '#333333', alignItems: 'center', justifyContent: 'center' },
  basHarf: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.govde },
  metinler: { flex: 1, gap: 2 },
  hedef: { alignSelf: 'flex-start' },
  ad: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
  mekan: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: '#FFFFFF' },
  zaman: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: '#B3B3B3' },
})
