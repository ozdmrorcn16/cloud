import { Fragment } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { goreceZamanGosterilir, gorecelZaman, saatYazisi } from '../../lib/zaman'
import { renk, yazi, olcek, bosluk, yuvarlak } from './tema'

/**
 * ZAMAN TUNELI - anilarin ve akisin ortak gosterimi.
 *
 * Kullanicinin karari (2026-08-28): once profil ekranindaki anilar,
 * ardindan ANA SAYFADAKI AKIS bu desene gecirildi. Desen eski
 * Swarm'dan; kullanici o ekranlari gonderip alti oneri icinden bunu
 * secti.
 *
 * NEDEN IZGARA DEGIL: bizim kayitlarimiz FOTOGRAF DEGIL, YER VE ZAMAN.
 * Cogunda fotograf olmayacak; Instagram tipi bir izgarada bu bos
 * kareler demek. Tunelde fotografsiz bir satir da kendi basina
 * anlamli: mekan adi, semt, saat, not.
 *
 * SWARM'DAN ALINMAYAN: renkli kutular. Slooin'de turuncu bir anlam
 * tasiyor - bir sey turuncuysa ya tiklanabilir ya "su an oluyor"
 * demektir. Alti ayri renk o anlami siler.
 *
 * IKI KULLANIM BICIMI VAR:
 *   `AniTuneli`   - listeyi kendisi ciziyor (profil: kisa onizleme).
 *   `TunelSatiri` - tek satir; ana sayfa bunu FlatList icinde
 *                   kullaniyor, boylece sanallastirma ve asagi cekip
 *                   yenileme korunuyor.
 */

export type TunelAnisi = {
  id: string
  mekanId: string
  mekanAdi: string
  semt?: string | null
  notMetni: string | null
  fotografUrl: string | null
  olusturmaZamani: string
  /**
   * AKISTA: kimin kaydi. Bu ALAN ADIDIR, kullanici adi degil -
   * isaretteki bas harf de buradan aliniyor (kullanicinin karari
   * 2026-08-28: "kullanici adinin bas harfi degil, yazdigi isim
   * yerindeki isminin bas harfi").
   */
  kisiAdi?: string | null
  /** AKISTA: kisinin guncel profil fotografi; yoksa bas harf cizilir. */
  avatarUrl?: string | null
  /** AKISTA: kisi su an orada mi. */
  canliMi?: boolean
  /** AKISTA: kendi kaydi mi (silme yalnizca kendi kayitlarinda). */
  benimMi?: boolean
}

function Igne() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path
        d="M12 2.4a7.4 7.4 0 0 0-7.4 7.4c0 5.5 7.4 11.8 7.4 11.8s7.4-6.3 7.4-11.8A7.4 7.4 0 0 0 12 2.4z"
        fill="#FFFFFF"
      />
      <Circle cx={12} cy={9.7} r={2.8} fill={renk.turuncu} />
    </Svg>
  )
}

/** Gunun basina konan ayrac metni: Bugun / Dun / 12 Ağustos. */
export function gunEtiketi(iso: string, simdi = new Date()): string {
  const tarih = new Date(iso)
  const gunFarki = Math.floor(
    (yeniGun(simdi).getTime() - yeniGun(tarih).getTime()) / 86400000
  )
  if (gunFarki <= 0) return 'Bugün'
  if (gunFarki === 1) return 'Dün'

  const aylar = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ]
  const gun = `${tarih.getDate()} ${aylar[tarih.getMonth()]}`
  // Yil ancak GECEN yillarda yaziliyor; bu yil icin gereksiz gurultu.
  return tarih.getFullYear() === simdi.getFullYear()
    ? gun
    : `${gun} ${tarih.getFullYear()}`
}

/** Gunun basi - gun farkini saat kaymalarindan bagimsiz hesaplamak icin. */
function yeniGun(t: Date): Date {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}



export function GunAyraci({ etiket }: { etiket: string }) {
  return (
    <View style={stiller.gunSatiri}>
      <Text style={stiller.gunYazi}>{etiket}</Text>
    </View>
  )
}

type SatirProps = {
  ani: TunelAnisi
  onAniSec: (ani: TunelAnisi) => void
  /** Verilirse kisi adina dokununca cagriliyor (akis). */
  onKisiSec?: (ani: TunelAnisi) => void
  /** Silme iki adimli: once onay satiri acilir. */
  silOnayiAcik?: boolean
  onSilOnayi?: (id: string) => void
  onSil?: (id: string) => void
  /** Son satirda serit asagi sarkmasin. */
  sonuncu?: boolean
}

export function TunelSatiri({
  ani,
  onAniSec,
  onKisiSec,
  silOnayiAcik,
  onSilOnayi,
  onSil,
  sonuncu,
}: SatirProps) {
  const { t } = useDil()
  const silinebilir = Boolean(ani.benimMi && onSilOnayi)
  const basHarf = (ani.kisiAdi ?? '').trim().charAt(0).toLocaleUpperCase('tr-TR')

  // Canlilik alt satirin ICINDE degil, AYRI bir rozet: hem gozle
  // ayirt ediliyor hem de erisilebilirlik agacinda kendi ogesi oluyor.
  //
  // ZAMAN UC KADEMELI (kullanicinin karari 2026-08-29):
  //   rozet varken (ilk 30 dk)  -> saat
  //   30-60 dk arasi            -> "35 dk önce"
  //   1 saatten eski            -> saat (tarihi gun ayraci veriyor)
  const zaman =
    !ani.canliMi && goreceZamanGosterilir(ani.olusturmaZamani)
      ? gorecelZaman(ani.olusturmaZamani, t)
      : saatYazisi(ani.olusturmaZamani)

  const altParcalar = [ani.semt ?? '', zaman].filter(Boolean)

  return (
    <View style={stiller.satirKok}>
      {/* Serit her satirin icinde ciziliyor; satirlar bitisik oldugu
          icin kesintisiz tek bir cizgi gibi gorunuyor. Son satirda
          asagi sarkmamasi icin kisaltiliyor. */}
      <View style={[stiller.serit, sonuncu && stiller.seritSon]} />

      <Pressable
        style={stiller.ani}
        onPress={() => onAniSec(ani)}
        accessibilityRole="button"
        accessibilityLabel={`${ani.mekanAdi}, ${altParcalar.join(', ')}`}
      >
        <View style={[stiller.isaret, Boolean(ani.avatarUrl) && stiller.isaretFotografli]}>
          {ani.avatarUrl ? (
            <Image
              source={{ uri: ani.avatarUrl }}
              style={stiller.avatar}
              contentFit="cover"
              transition={120}
              testID="akis-avatari"
            />
          ) : ani.kisiAdi ? (
            <Text style={stiller.basHarf}>{basHarf}</Text>
          ) : (
            <Igne />
          )}
        </View>

        <View style={stiller.ustSatir}>
          <Text style={stiller.mekanAdi} numberOfLines={1}>
            {ani.mekanAdi}
          </Text>
          {ani.canliMi && (
            <View style={stiller.canliRozet}>
              <View style={stiller.canliNokta} />
              <Text style={stiller.canliYazi}>{t('anaSayfa.suAnBurada')}</Text>
            </View>
          )}
        </View>

        <Text style={stiller.bilgi} numberOfLines={1}>
          {ani.kisiAdi ? (
            <Text
              style={stiller.kisi}
              onPress={onKisiSec ? () => onKisiSec(ani) : undefined}
            >
              {ani.kisiAdi}
            </Text>
          ) : null}
          {ani.kisiAdi && altParcalar.length > 0 ? ' · ' : ''}
          {altParcalar.join(' · ')}
        </Text>

        {ani.notMetni ? <Text style={stiller.not}>{ani.notMetni}</Text> : null}

        {ani.fotografUrl ? (
          <Image
            source={{ uri: ani.fotografUrl }}
            style={stiller.fotograf}
            contentFit="cover"
            transition={150}
            testID="akis-fotografi"
          />
        ) : null}

        {silinebilir && !silOnayiAcik && (
          <Pressable
            onPress={() => onSilOnayi?.(ani.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('ortak.sil')}
          >
            <Text style={stiller.silAc}>{t('ortak.sil')}</Text>
          </Pressable>
        )}

        {silinebilir && silOnayiAcik && (
          <View style={stiller.silOnayi}>
            <Text style={stiller.silSoru}>{t('anaSayfa.silOnay')}</Text>
            <View style={stiller.silDugmeleri}>
              <Pressable onPress={() => onSilOnayi?.(ani.id)} accessibilityRole="button">
                <Text style={stiller.vazgec}>{t('ortak.vazgec')}</Text>
              </Pressable>
              <Pressable onPress={() => onSil?.(ani.id)} accessibilityRole="button">
                <Text style={stiller.silOnayla}>{t('ortak.sil')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  )
}

type Props = {
  anilar: readonly TunelAnisi[]
  onAniSec: (ani: TunelAnisi) => void
  /** Verilirse yalnizca ilk bu kadar kayit ciziliyor (profil onizlemesi). */
  enFazla?: number
}

export function AniTuneli({ anilar, onAniSec, enFazla }: Props) {
  const gosterilecek = enFazla ? anilar.slice(0, enFazla) : anilar
  let oncekiGun: string | null = null

  return (
    <View>
      {gosterilecek.map((ani, i) => {
        const etiket = gunEtiketi(ani.olusturmaZamani)
        const gunDegisti = etiket !== oncekiGun
        oncekiGun = etiket

        return (
          <Fragment key={ani.id}>
            {gunDegisti && <GunAyraci etiket={etiket} />}
            <TunelSatiri
              ani={ani}
              onAniSec={onAniSec}
              sonuncu={i === gosterilecek.length - 1}
            />
          </Fragment>
        )
      })}
    </View>
  )
}

const SERIT_SOL = 15
const ISARET_CAP = 30

const stiller = StyleSheet.create({
  satirKok: { paddingLeft: 40, position: 'relative' },
  serit: {
    position: 'absolute',
    left: SERIT_SOL,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFD9B8',
  },
  seritSon: { bottom: undefined, height: ISARET_CAP / 2 },

  gunSatiri: {
    alignSelf: 'flex-start',
    marginTop: bosluk.m,
    marginBottom: bosluk.s,
    backgroundColor: '#F6F1EB',
    borderRadius: yuvarlak.hap,
    paddingVertical: 4,
    paddingHorizontal: bosluk.m,
  },
  gunYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },

  ani: { paddingBottom: bosluk.l, position: 'relative' },
  isaret: {
    position: 'absolute',
    left: -40,
    top: 0,
    width: ISARET_CAP,
    height: ISARET_CAP,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    // Beyaz halka seridi isaretin arkasinda kesiyor.
    borderWidth: 3,
    borderColor: renk.zemin,
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },
  // Fotograf varsa turuncu dolgu gorunmemeli: fotograf cerceveyi
  // tamamen dolduruyor, arkasindaki turuncu yalnizca yuklenirken
  // gorunurdu ve kenarda turuncu bir halka birakiyordu.
  isaretFotografli: { backgroundColor: '#F6F1EB', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },

  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  mekanAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
    flexShrink: 1,
  },
  canliRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 3,
    paddingHorizontal: bosluk.s,
  },
  canliNokta: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: renk.turuncu,
  },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuKoyu,
  },

  bilgi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  kisi: { fontFamily: yazi.govdeKalin, color: renk.metin },

  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    marginTop: bosluk.s,
    lineHeight: 21,
  },
  fotograf: {
    height: 150,
    borderRadius: yuvarlak.kart,
    marginTop: bosluk.s,
    backgroundColor: '#F6F1EB',
  },

  silAc: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    marginTop: bosluk.s,
  },
  silOnayi: { marginTop: bosluk.s, gap: bosluk.s },
  silSoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silDugmeleri: { flexDirection: 'row', gap: 20 },
  vazgec: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },
  silOnayla: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: '#C0392B' },
})
