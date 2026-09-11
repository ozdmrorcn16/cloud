import { Linking, Pressable, StyleSheet, Text } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { instagramAdresi } from '../../lib/instagram'
import { bosluk, olcek, yazi, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * PROFILDEKI INSTAGRAM BAGLANTISI.
 *
 * Kullanicinin istegi (2026-09-11): "profiline kullanicilar
 * instagramini baglayabilir mi ya da instagram adresini
 * ekleyebilsinler."
 *
 * BEYAN, DOGRULAMA DEGIL: Meta kisisel hesaplar icin OAuth yolunu
 * 2024-12-04'te kapatti (ayrinti `lib/instagram.ts` basinda). Yani bu
 * satir "bu hesap dogrulandi" demiyor, "kisi bunu yazdi" diyor.
 *
 * ORTAK BILESEN: kendi profil ekrani ve baskasinin profili ayni
 * satiri kullaniyor. Iki kopya olsaydi biri degistiginde oteki geride
 * kalirdi - ayni ders `ProfilSayaclari` ve `SekmeHapi` ile ogrenildi.
 */
export function InstagramSatiri({ kullaniciAdi }: { kullaniciAdi: string }) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)

  return (
    <Pressable
      style={stiller.satir}
      onPress={() => {
        // Baglanti acilamazsa SESSIZ kaliyoruz: tarayici yoksa ya da
        // sema reddedilirse yapabilecegimiz bir sey yok ve bir hata
        // metni profilin ortasinda anlamsiz dururdu.
        Linking.openURL(instagramAdresi(kullaniciAdi)).catch(() => {})
      }}
      accessibilityRole="link"
      accessibilityLabel={`Instagram: ${kullaniciAdi}`}
      hitSlop={8}
      testID="instagram-baglantisi"
    >
      {/* Instagram'in GRADYANLI marka isareti DEGIL, tek renkli bir
          kamera cizimi: baglanti satirlarinin alisilmis dili bu ve
          marka renkleri profildeki turuncu kimlige yabanci duserdi. */}
      <Svg width={15} height={15} viewBox="0 0 24 24">
        <Path
          d="M7 2.8h10A4.2 4.2 0 0 1 21.2 7v10A4.2 4.2 0 0 1 17 21.2H7A4.2 4.2 0 0 1 2.8 17V7A4.2 4.2 0 0 1 7 2.8z"
          stroke={renk.turuncuYazi}
          strokeWidth={1.8}
          fill="none"
        />
        <Circle cx={12} cy={12} r={3.8} stroke={renk.turuncuYazi} strokeWidth={1.8} fill="none" />
        <Circle cx={17.3} cy={6.7} r={1.1} fill={renk.turuncuYazi} />
      </Svg>
      <Text style={stiller.yazi} numberOfLines={1}>
        {kullaniciAdi}
      </Text>
    </Pressable>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    satir: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.xs,
      marginTop: bosluk.xs,
      // Satir ICERIGI KADAR genis: `stretch` olsaydi dokunma alani
      // bos yere kadar uzar ve kisi metnin yanina basinca Instagram
      // acilirdi.
      alignSelf: 'flex-start',
    },
    yazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.kucuk,
      color: renk.turuncuYazi,
    },
  })
