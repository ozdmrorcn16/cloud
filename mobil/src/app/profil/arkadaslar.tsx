import { useCallback, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { takibiBirak, type BagKisi } from '../../../lib/bag'
import { engelle } from '../../../lib/engelleme'
import { SITE_KOKU, sistemPaylasimi } from '../../../lib/paylasim'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Avatar } from '../../tasarim/Avatar'
import { SecimPenceresi, UcNoktaIkonu } from '../../tasarim/SecimPenceresi'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { KisilerIkonu } from '../../tasarim/mekan-ikonlari'
import { KisiIkonu, KisiEkleIkonu, KisiCikarIkonu, YasakIkonu, KonusmaBalonuIkonu } from '../../tasarim/arkadas-ikonlari'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { BuyutecIkonu } from '../../tasarim/BuyutecIkonu'

/**
 * ARKADASLARIM (kullanicinin referans gorseli 2026-09-20: "Arkadas'a
 * basilinca gorunecek arkadas listesi sayfasini bu sekilde yap").
 * Kendi profildeki "Arkadas" sayaci buraya gelir; oradaki satir-ici
 * liste kalkti. Duzen referanstan birebir: ust cubuk (geri, baslik,
 * sagda kisi-ekle -> kisi arama), arama kutusu (yerel suzgec), sayi
 * satiri, beyaz kartta satirlar (avatar, ad, @kullanici adi, sagda
 * mesaj ve uc nokta), altta davet karti. Uc nokta alttan sayfa: avatar
 * + ad basligi, Profili gor / Mesaj gonder / Arkadasliktan cikar /
 * Engelle / Vazgec.
 */
export default function ArkadaslarEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [arama, setArama] = useState('')
  const [secenekKisi, setSecenekKisi] = useState<BagKisi | null>(null)
  const [engelOnayiKisi, setEngelOnayiKisi] = useState<BagKisi | null>(null)

  // Her odaklanmada yeniden okunuyor: baskasinin profilinden
  // "Arkadasliktan cikar" ile donunce liste guncel olsun.
  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      takipcilerimiGetir()
        .then((liste) => {
          if (!gecerli) return
          setArkadaslar(liste)
          setHata(null)
        })
        .catch((e) => {
          if (gecerli) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
        })
        .finally(() => {
          if (gecerli) setYukleniyor(false)
        })
      return () => {
        gecerli = false
      }
    }, [])
  )

  const temizArama = arama.trim().toLocaleLowerCase('tr')
  const gorunenler = temizArama
    ? arkadaslar.filter(
        (k) =>
          k.ad.toLocaleLowerCase('tr').includes(temizArama) ||
          k.kullaniciAdi.toLocaleLowerCase('tr').includes(temizArama)
      )
    : arkadaslar

  async function arkadasliktanCikar(kisi: BagKisi) {
    try {
      await takibiBirak(kisi.id)
      setArkadaslar((mevcut) => mevcut.filter((k) => k.id !== kisi.id))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function arkadasiEngelle(kisi: BagKisi) {
    try {
      await engelle(kisi.id)
      setArkadaslar((mevcut) => mevcut.filter((k) => k.id !== kisi.id))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setEngelOnayiKisi(null)
    }
  }

  async function davetEt() {
    try {
      await sistemPaylasimi({ message: `${t('arkadaslar.davetMesaji')}\n${SITE_KOKU}` })
    } catch {
      setHata(t('profil.paylasilamadi'))
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk
        baslik={t('arkadaslar.baslik')}
        geriEtiketi={t('ortak.geri')}
        sag={
          <Pressable
            onPress={() => router.push('/kisiler')}
            accessibilityRole="button"
            accessibilityLabel={t('kisiler.baslik')}
            hitSlop={8}
            testID="kisi-ekle"
          >
            <KisiEkleIkonu />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="arkadaslar-kaydirma"
      >
        <View style={stiller.aramaKutusu}>
          <BuyutecIkonu boyut={20} renk={renk.metinIkincil} />
          <TextInput
            style={stiller.aramaGirdisi}
            placeholder={t('arkadaslar.ara')}
            placeholderTextColor={renk.metinIkincil}
            autoCapitalize="none"
            autoCorrect={false}
            value={arama}
            onChangeText={setArama}
            testID="arkadas-ara"
          />
        </View>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {!yukleniyor && (
          <Text style={stiller.sayi} testID="arkadas-sayisi">
            {t('arkadaslar.sayi', { sayi: arkadaslar.length })}
          </Text>
        )}

        {!yukleniyor && arkadaslar.length === 0 ? (
          <Text style={stiller.bos}>{t('baglar.bosArkadas')}</Text>
        ) : gorunenler.length > 0 ? (
          <View style={stiller.kart}>
            {gorunenler.map((kisi, i) => (
              <View
                key={kisi.id}
                style={[stiller.satir, i < gorunenler.length - 1 && stiller.satirCizgi]}
                testID={`arkadas-satir-${kisi.id}`}
              >
                <Pressable
                  style={stiller.satirSol}
                  onPress={() => router.push(`/kullanici/${kisi.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={kisi.ad || kisi.kullaniciAdi}
                >
                  <Avatar
                    fotografUrl={kisi.avatarUrl ?? null}
                    ad={kisi.ad}
                    kullaniciAdi={kisi.kullaniciAdi}
                    cap={AVATAR_CAPI}
                    testID={`arkadas-avatar-${kisi.id}`}
                  />
                  <View style={stiller.satirOrta}>
                    <Text style={stiller.ad} numberOfLines={1}>{kisi.ad}</Text>
                    <Text style={stiller.kullaniciAdi} numberOfLines={1}>@{kisi.kullaniciAdi}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={stiller.kareDugme}
                  onPress={() => router.push(`/sohbet/${kisi.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={t('arkadaslar.mesajGonder')}
                  testID={`arkadas-mesaj-${kisi.id}`}
                >
                  <KonusmaBalonuIkonu boyut={22} renk={renk.turuncu} />
                </Pressable>
                <Pressable
                  style={stiller.kareDugme}
                  onPress={() => setSecenekKisi(kisi)}
                  accessibilityRole="button"
                  accessibilityLabel={t('anaSayfa.secenekler')}
                  testID={`arkadas-secenekler-${kisi.id}`}
                >
                  <UcNoktaIkonu boyut={22} renk={renk.metin} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : arkadaslar.length > 0 ? (
          <Text style={stiller.bos}>{t('kisiler.bulunamadi')}</Text>
        ) : null}

        {/* DAVET KARTI (referans): seftali zemin, iki kisi ikonu, baslik +
            alt satir, cerceveli dugme -> sistem paylasim sayfasi. */}
        <View style={stiller.davetKarti}>
          <KisilerIkonu boyut={34} />
          <View style={stiller.davetMetinler}>
            <Text style={stiller.davetBaslik}>{t('arkadaslar.davetBaslik')}</Text>
            <Text style={stiller.davetMetin}>{t('arkadaslar.davetMetin')}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [stiller.davetDugme, pressed && stiller.davetDugmeBasili]}
            onPress={davetEt}
            accessibilityRole="button"
            testID="arkadas-davet"
          >
            <Text style={stiller.davetDugmeYazi}>{t('arkadaslar.davetDugme')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SecimPenceresi
        acikMi={secenekKisi !== null}
        baslik={
          secenekKisi ? (
            <View style={stiller.menuBaslik}>
              <Avatar
                fotografUrl={secenekKisi.avatarUrl ?? null}
                ad={secenekKisi.ad}
                kullaniciAdi={secenekKisi.kullaniciAdi}
                cap={MENU_AVATAR_CAPI}
              />
              <View style={stiller.satirOrta}>
                <Text style={stiller.menuAd} numberOfLines={1}>{secenekKisi.ad}</Text>
                <Text style={stiller.kullaniciAdi} numberOfLines={1}>@{secenekKisi.kullaniciAdi}</Text>
              </View>
            </View>
          ) : null
        }
        secimler={
          secenekKisi
            ? [
                {
                  etiket: t('arkadaslar.profiliGor'),
                  testID: 'arkadas-profil',
                  ikon: <KisiIkonu />,
                  onSec: () => router.push(`/kullanici/${secenekKisi.id}`),
                },
                {
                  etiket: t('arkadaslar.mesajGonder'),
                  testID: 'arkadas-mesaj-gonder',
                  ikon: <KonusmaBalonuIkonu />,
                  onSec: () => router.push(`/sohbet/${secenekKisi.id}`),
                },
                {
                  etiket: t('baglar.arkadasliktanCikar'),
                  testID: 'arkadas-cikar',
                  ikon: <KisiCikarIkonu />,
                  yikici: true,
                  onSec: () => arkadasliktanCikar(secenekKisi),
                },
                {
                  etiket: t('baglar.engelle'),
                  testID: 'arkadas-engelle',
                  ikon: <YasakIkonu />,
                  yikici: true,
                  onSec: () => setEngelOnayiKisi(secenekKisi),
                },
              ]
            : []
        }
        onKapat={() => setSecenekKisi(null)}
      />
      <OnayPenceresi
        acikMi={engelOnayiKisi !== null}
        baslik={t('kullanici.engelle')}
        aciklama={t('kullanici.engelleOnayi')}
        eylemEtiketi={t('kullanici.engelleEvet')}
        onOnay={() => engelOnayiKisi && arkadasiEngelle(engelOnayiKisi)}
        onVazgec={() => setEngelOnayiKisi(null)}
      />
    </View>
  )
}

const AVATAR_CAPI = 48
const MENU_AVATAR_CAPI = 52
const KARE_DUGME = 40

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingHorizontal: bosluk.sayfa, paddingBottom: ALT_GEZINME_PAYI, gap: bosluk.m },

  // Referans: dolgulu, kenarliksiz, yuvarlak arama kutusu.
  aramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    height: 46,
  },
  aramaGirdisi: { flex: 1, fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin },
  hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici },
  sayi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  bos: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil, paddingVertical: bosluk.l },

  // Satirlar beyaz kartta; kart zeminle ayni renk oldugu icin ayrim
  // ince cerceve + satir cizgileri (2026-08-27 notu).
  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingHorizontal: bosluk.m,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s, paddingVertical: bosluk.m },
  satirCizgi: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  satirSol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  satirOrta: { flex: 1 },
  ad: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  kullaniciAdi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, marginTop: 1 },
  kareDugme: {
    width: KARE_DUGME,
    height: KARE_DUGME,
    borderRadius: 12,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },

  davetKarti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginTop: bosluk.s,
  },
  davetMetinler: { flex: 1 },
  davetBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  davetMetin: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, marginTop: 2 },
  davetDugme: {
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.m,
    paddingVertical: 10,
  },
  davetDugmeBasili: { backgroundColor: renk.yuzey },
  davetDugmeYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.turuncu },

  menuBaslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: bosluk.m,
  },
  menuAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.altBaslik, color: renk.metin },
})
