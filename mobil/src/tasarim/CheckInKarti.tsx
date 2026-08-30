import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Image as HizliImage } from 'expo-image'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import type { AkisOgesi } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { suAnBuradaMi, tamZaman } from '../../lib/zaman'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from './tema'

/**
 * CHECK-IN KARTI - ana sayfada, profildeki anilarda ve Anilarim
 * ekraninda AYNI kart.
 *
 * Kullanicinin karari (2026-08-30, Anilarim ekraninin goruntusunu
 * gonderip): "Ayni bu gorunus: kullanici adi - check-in ismi, not
 * varsa yaninda not, fotograf varsa altina; ana sayfa akisinda ve
 * profil akisinda da bu gorunus olacak; mekan ismi turuncu ve
 * tiklanabilir." Zaman tuneli deseni (AniTuneli) bu kararla KALDIRILDI.
 *
 * Duzen: [profil resmi] KULLANICI ADI - MEKAN ADI (turuncu) - etiketlenenler
 *        (kullanicinin karari 2026-08-30: kartta "byorcun" gibi kullanici
 *        adi yazar, ad-soyad DEGIL; bildirimlerde ise ad-soyad)
 *        tam zaman
 *        not
 *        fotograf
 *        sagda gorece zaman ("7 saat önce") ya da "şu an burada"
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
  /** "7 saat önce" gibi gorece zaman; kart bicimlendirmeyi ustlenmiyor. */
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
  // Bas harf ADDAN (kullanicinin karari 2026-08-28): `kullaniciAdi`
  // alani check_inler'de denormalize duran ADI tasiyor (karar #18).
  const basHarf = (oge.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase('tr-TR')
  // Kullanici adi okunamadiysa (engel, askidaki hesap, ag) ada dusuyor.
  // `rumuz` ONCEDEN BICIMLENMIS gelir: profil ekranlari basina @ koyup
  // gonderiyor (kullanicinin istegi 2026-08-30, yalnizca profil icin),
  // akis ekrani ham kullanici adini gonderiyor.
  const gosterilenAd = oge.rumuz ?? oge.kullaniciAdi ?? ''

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
          accessibilityLabel={gosterilenAd}
        >
          {oge.avatarUrl ? (
            <HizliImage
              testID="akis-avatari"
              source={{ uri: oge.avatarUrl }}
              style={stiller.avatar}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <View style={[stiller.avatar, stiller.avatarYok]}>
              <Text style={stiller.basHarf}>{basHarf}</Text>
            </View>
          )}
        </Pressable>

        <View style={stiller.orta}>
          <Text style={stiller.satir}>
            <Text
              style={stiller.kullaniciAdi}
              onPress={() => router.push(kisiYolu as never)}
            >
              {gosterilenAd}
            </Text>
            <Text style={stiller.ayirac}> - </Text>
            <Text
              style={stiller.mekanAdi}
              onPress={() => router.push(`/check-in/${oge.mekanId}`)}
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

        {/* "Şu an burada" yalnizca canlilik penceresinde (30 dk); sonra
            gorece zaman. Turuncunun mesru kullanimi: "su an oluyor".
            Yalnizca nokta yetmiyor - renk tek basina anlam tasimamali. */}
        {suAnBuradaMi(oge.olusturmaZamani, oge.canliMi) ? (
          <View style={stiller.canliRozet}>
            <View style={stiller.canliNokta} />
            <Text style={stiller.canliYazi}>{t('anaSayfa.suAnBurada')}</Text>
          </View>
        ) : (
          <Text style={stiller.zaman}>{zamanYazisi}</Text>
        )}
      </View>

      {/* NOT ONCE, FOTOGRAF ALTINDA (kullanicinin istegi 2026-08-30). */}
      {oge.notMetni && <Text style={stiller.not}>{oge.notMetni}</Text>}

      {oge.fotografUrl && (
        <Image
          testID="akis-fotografi"
          source={{ uri: oge.fotografUrl }}
          style={stiller.fotograf}
          resizeMode="cover"
        />
      )}

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

const AVATAR_CAPI = 40

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
    width: AVATAR_CAPI,
    height: AVATAR_CAPI,
    borderRadius: AVATAR_CAPI / 2,
  },
  avatarYok: {
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

  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: bosluk.m,
  },
  fotograf: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: yuvarlak.kart - 4,
    marginTop: bosluk.m,
    backgroundColor: renk.cizgi,
  },
})
