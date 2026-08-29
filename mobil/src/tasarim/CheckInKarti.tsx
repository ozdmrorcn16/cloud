import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import type { AkisOgesi } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { suAnBuradaMi, tamZaman } from '../../lib/zaman'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from './tema'

/**
 * CHECK-IN KARTI - ana sayfada ve profildeki anilarda AYNI kart.
 *
 * Kullanicinin karari (2026-08-26): "Anasayfaya dusen, kullanicinin
 * profilinde anilarda gorunecek" ve "ortak olsun". Kart onceden
 * yalnizca ana sayfada duruyordu; iki yerde iki ayri duzen, ayni
 * icerigin iki farkli okunusu demekti.
 *
 * Duzen: [profil resmi] kullanici adi - MEKAN ADI (turuncu) -
 * etiketlenen arkadaslar, altinda fotograf ve not.
 *
 * Ad, mekan ve etiketler TEK metin akisinda: ayri View'lara bolununce
 * uzun mekan adlari satiri tasiriyordu. Ic ice `Text` ile parcalar
 * satir sonunda birlikte kiriliyor ve her parcanin kendi dokunma
 * hedefi kaliyor.
 */

/** Silme dugmesinin ikonu. */
function CopIkonu() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M5 7h14M10 7V5.5h4V7M6.5 7l.8 12h9.4l.8-12"
        stroke={renk.metinSoluk}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export function CheckInKarti({
  oge,
  zamanYazisi,
  silOnayiAcik = false,
  onSilOnayi,
  onSil,
}: {
  oge: AkisOgesi
  /** "1 sa" gibi gorece zaman; kart bicimlendirmeyi ustlenmiyor. */
  zamanYazisi: string
  silOnayiAcik?: boolean
  /** Verilmezse silme dugmesi hic cizilmez. */
  onSilOnayi?: (id: string) => void
  onSil?: (id: string) => void
}) {
  const router = useRouter()
  const { t } = useDil()

  const kisiYolu = oge.benimMi ? '/profil' : `/kullanici/${oge.kullaniciId}`
  const silinebilir = oge.benimMi && Boolean(onSilOnayi)

  return (
    <Pressable
      style={stiller.kart}
      onPress={() => router.push(`/harita/${oge.mekanId}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`${oge.mekanAdi} konumunu haritada gör`}
    >
      <View style={stiller.kartUst}>
        <Pressable
          // `as never`: uretilen rota tipleri profil ana ekranini
          // "/profil/index" diye yaziyor, calisma zamaninda ise yol
          // "/profil".
          onPress={() => router.push(kisiYolu as never)}
          accessibilityRole="button"
          accessibilityLabel={oge.kullaniciAdi ?? ''}
        >
          <View style={stiller.avatar}>
            <Text style={stiller.basHarf}>
              {(oge.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
            </Text>
          </View>
        </Pressable>

        <View style={stiller.orta}>
        <Text style={stiller.satir}>
          <Text
            style={stiller.kullaniciAdi}
            onPress={() => router.push(kisiYolu as never)}
          >
            {oge.kullaniciAdi ?? ''}
          </Text>
          <Text style={stiller.ayirac}> - </Text>
          <Text
            style={stiller.mekanAdi}
            onPress={() => router.push(`/mekanlar/${oge.mekanId}`)}
          >
            {oge.mekanAdi}
          </Text>
          {oge.etiketler.length > 0 && (
            <>
              <Text style={stiller.ayirac}> - </Text>
              {oge.etiketler.map((etiket, sira) => (
                <Text key={etiket.kullaniciId}>
                  {sira > 0 ? <Text style={stiller.ayirac}>, </Text> : null}
                  <Text
                    style={stiller.etiket}
                    onPress={() => router.push(`/kullanici/${etiket.kullaniciId}`)}
                  >
                    {etiket.ad ?? ''}
                  </Text>
                </Text>
              ))}
            </>
          )}
        </Text>
        {/* Tam zaman: gorece etiket "ne kadar once" der, bu da "tam
            olarak ne zaman". */}
        <Text style={stiller.tamZaman}>{tamZaman(oge.olusturmaZamani)}</Text>
        </View>

        {silinebilir && (
          <Pressable
            onPress={() => onSilOnayi?.(oge.id)}
            accessibilityRole="button"
            accessibilityLabel={t('ortak.sil')}
            hitSlop={10}
            style={stiller.silDugmesi}
          >
            <CopIkonu />
          </Pressable>
        )}

        {/* "Şu an burada" YALNIZCA ILK BIR SAAT (kullanicinin karari
            2026-08-27). Check-in artik 30 dakika canli kaliyor; bir saatten
            sonra "2 saat önce" yaziyor - "su an" iddiasi o kadar
            surmuyor. */}
        {suAnBuradaMi(oge.olusturmaZamani, oge.canliMi) ? (
          // Turuncunun mesru kullanimi: "su an oluyor". YALNIZCA NOKTA
          // YETMIYOR - renk tek basina anlam tasimamali.
          <View style={stiller.canliRozet}>
            <View style={stiller.canliNokta} />
            <Text style={stiller.canliYazi}>{t('anaSayfa.suAnBurada')}</Text>
          </View>
        ) : (
          <Text style={stiller.zaman}>{zamanYazisi}</Text>
        )}
      </View>

      {oge.fotografUrl && (
        <Image
          testID="akis-fotografi"
          source={{ uri: oge.fotografUrl }}
          style={stiller.fotograf}
          resizeMode="cover"
        />
      )}

      {oge.notMetni && <Text style={stiller.not}>{oge.notMetni}</Text>}

      {/* SILME GERI ALINAMAZ: tek dokunusla degil, onayla. Onay satiri
          kartin icinde aciliyor - ayri bir ekran ya da sistem uyarisi
          akisi kesiyordu. */}
      {silOnayiAcik && (
        <View style={stiller.silOnayAlani}>
          <Text style={stiller.silOnaySoru}>{t('anaSayfa.silOnay')}</Text>
          <View style={stiller.silOnayDugmeleri}>
            <Pressable
              onPress={() => onSilOnayi?.(oge.id)}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={stiller.vazgecYazi}>{t('ortak.vazgec')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onSil?.(oge.id)}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={stiller.silYazi}>{t('ortak.sil')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  )
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginBottom: bosluk.m,
    ...golge.kart,
  },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },

  orta: { flex: 1 },
  tamZaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    marginTop: 2,
  },
  satir: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
  },
  kullaniciAdi: { fontFamily: yazi.govdeKalin, color: renk.metin },
  ayirac: { color: renk.metinSoluk },
  // Mekan adi TURUNCU (kullanicinin istegi): satirdaki tek renkli oge
  // ve ayni zamanda tiklanabilir - turuncu kurali bozulmuyor.
  mekanAdi: { fontFamily: yazi.govdeKalin, color: renk.turuncu },
  etiket: { fontFamily: yazi.govdeOrta, color: renk.metin },

  silDugmesi: { padding: 4, marginRight: 2 },
  silOnayAlani: { marginTop: bosluk.m, gap: bosluk.s },
  silOnaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silOnayDugmeleri: { flexDirection: 'row', gap: 20 },
  vazgecYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },

  zaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },
  canliRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.s,
    paddingVertical: 4,
  },
  canliNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: renk.turuncu },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuKoyu,
  },

  fotograf: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: yuvarlak.kart - 4,
    marginTop: bosluk.m,
    backgroundColor: renk.cizgi,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: bosluk.m,
  },
})
