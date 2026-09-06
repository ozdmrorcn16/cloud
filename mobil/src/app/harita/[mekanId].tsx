import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  Modal,
  Platform,
  ActionSheetIOS,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir, type Mekan } from '../../../lib/mekan'
import {
  mekanIstatistikleriniGetir,
  mekanLiderligiGetir,
  mekanSonCheckInleriGetir,
  type MekanIstatistikleri,
  type LiderlikSatiri,
  type SonCheckIn,
} from '../../../lib/mekan-sayfasi'
import { suAnBurdakileriGetir, type CheckInGorunumu } from '../../../lib/checkin'
import { gorecelZaman } from '../../../lib/zaman'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { CanliHarita, type HaritaMekani } from '../../tasarim/CanliHarita'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import {
  KisilerIkonu,
  CubukIkonu,
  YildizIkonu,
  KupaIkonu,
  SaatIkonu,
  ArabaIkonu,
  NavigasyonIkonu,
  DikeyUcNoktaIkonu,
  SiraMadalyasi,
} from '../../tasarim/mekan-ikonlari'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/**
 * MEKAN SAYFASI.
 *
 * Akistaki ya da profildeki bir check-in'in mekan adina basilinca
 * aciliyor. Onceden yalnizca harita + ad + "Yol tarifi al" tasiyordu;
 * kullanicinin istegi (2026-09-06, referans gorselle): sayfa mekanin
 * KENDISINI anlatsin - kac kisi orada, bugun kac check-in olmus,
 * ilcesinde kacinci, kimler orada ve kimler en cok gelmis.
 *
 * IKI FARKLI GORUNURLUK REJIMI VAR, bilerek:
 *
 *   SAYILAR herkese ayni. `mekan_istatistikleri` `security definer` -
 *   bir sayi kimseyi tanimlamiyor, mevcut yogunluk sayaciyla ayni
 *   sinifta (karar 71).
 *
 *   KISI LISTELERI cagirana gore. `check_inler` RLS'i isliyor: canli
 *   bir check-in'de "herkese acik" bile ancak AYNI MEKANDA CANLIYSAN ya
 *   da ARKADASINSA gorunuyor.
 *
 * Yani ustte "7 kisi burada" yazarken asagida 2 avatar gorunebilir.
 * Bu bir kusur DEGIL: fark "+5" rozetiyle anlatiliyor, sayi sizmaya
 * devam ediyor ama kimlikler sizmiyor.
 *
 * HARITADA VE LISTEDE YUZ YOK - avatarlar bas harfli daireler.
 * Uygulamanin kalici kurali bu ve referans gorseldeki fotograflar
 * bilerek alinmadi.
 *
 * HARITA DOKUNMATIK DEGIL, BIR DUGME. Ustune basinca hangi harita
 * uygulamasiyla acilacagi soruluyor (kullanicinin istegi 2026-08-30);
 * bu yuzden kaydirma ve yakinlastirma kapali.
 *
 * Kullanicinin kendi konumu BURADA KULLANILMIYOR: check-in baska bir
 * gun baska bir yerde yapilmis olabilir, "sana uzakligi" yaniltici
 * olurdu.
 */

/** Secim penceresi: iOS'ta Apple Haritalar da var, diger yerlerde yok. */
function haritaSecenekleri(): ('apple' | 'google')[] {
  return Platform.OS === 'ios' ? ['apple', 'google'] : ['google']
}

/**
 * Uygulamanin KURULU olup olmadigini sormak icin kullanilan semalar.
 *
 * iOS'ta `canOpenURL` yalnizca Info.plist'teki
 * LSApplicationQueriesSchemes listesinde BEYAN EDILEN semalari
 * sorabiliyor (app.json > ios.infoPlist). Beyan edilmezse cagri hata
 * vermeden HER ZAMAN false doner - yani beyan olmadan butun secenekler
 * gizlenirdi. Bu beyan NATIVE bir ayar: OTA ile gitmez, yeni derleme
 * ister.
 */
const SEMA: Record<'apple' | 'google', string> = {
  apple: 'maps://',
  google: 'comgooglemaps://',
}

/**
 * Yalnizca CIHAZDA KURULU olan haritalari dondurur (kullanicinin istegi
 * 2026-09-01: kurulu olmayan harita listede gorunmesin).
 *
 * `canOpenURL` bir nedenle patlarsa (web, izin, beklenmeyen durum) o
 * secenek ELENMIYOR, listede kaliyor: yol tarifi bulunmaz bir uygulama
 * icin gosterilse bile en fazla tarayicida acilir, ama yanlislikla
 * hepsini eleyip kullaniciyi yolsuz birakmak daha kotu olurdu.
 */
async function kuruluHaritalar(): Promise<('apple' | 'google')[]> {
  const adaylar = haritaSecenekleri()
  const sonuclar = await Promise.all(
    adaylar.map((secim) => Linking.canOpenURL(SEMA[secim]).catch(() => true))
  )
  const kurulular = adaylar.filter((_, i) => sonuclar[i])

  // HICBIRI cikmadiysa suzgeci UYGULAMIYORUZ, hepsini donduruyoruz.
  //
  // Sebep somut: Info.plist beyani NATIVE bir ayar ve OTA ile gitmiyor.
  // Bu kod beyansiz bir derlemeye OTA ile inerse canOpenURL her sema
  // icin false doner; suzgeci korumasiz uygulasaydik butun harita
  // secenekleri kaybolur ve yol tarifi hep tarayicida acilirdi - yani
  // calisan bir ozelligi bozmus olurduk.
  return kurulular.length > 0 ? kurulular : adaylar
}

/** Yol tarifi adresleri. Ikisi de HEDEFI verir, yani yol tarifi acilir. */
function yolTarifiAdresi(secim: 'apple' | 'google', mekan: Mekan) {
  const { lat, lng } = mekan.konum
  if (secim === 'apple') {
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(mekan.ad)}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/** Bas harf: ad yoksa kullanici adi, o da yoksa soru isareti. */
function basHarf(ad: string | null): string {
  return (ad || '?').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'
}

type Sekme = 'liderlik' | 'son'

export default function MekanSayfasi() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()

  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [cevre, setCevre] = useState<HaritaMekani[]>([])
  const [istatistik, setIstatistik] = useState<MekanIstatistikleri | null>(null)
  const [burdakiler, setBurdakiler] = useState<CheckInGorunumu[]>([])
  const [liderlik, setLiderlik] = useState<LiderlikSatiri[]>([])
  const [sonlar, setSonlar] = useState<SonCheckIn[]>([])
  const [sekme, setSekme] = useState<Sekme>('liderlik')
  const [hata, setHata] = useState<string | null>(null)
  const [secimAcik, setSecimAcik] = useState(false)
  const [menuAcik, setMenuAcik] = useState(false)

  useEffect(() => {
    let gecerli = true

    mekaniGetir(mekanId)
      .then(async (bulunan) => {
        if (!gecerli) return
        setMekan(bulunan)
        if (!bulunan) return
        // Cevre baglami; okunamazsa harita yine ciziliyor.
        const yakinlar = await yakinMekanlariYogunlukIleGetir(
          bulunan.konum.lat,
          bulunan.konum.lng,
          1000
        ).catch(() => [])
        if (gecerli) setCevre(yakinlar)
      })
      .catch((e) => {
        if (gecerli) setHata(hataMetni(e))
      })

    // Sayfanin geri kalani BAGIMSIZ yukleniyor: biri patlarsa digerleri
    // yine geliyor. Mekanin kendisi olmadan sayfa cizilemez, ama
    // istatistik olmadan cizilebilir - bu yuzden hatalari yutuyorlar.
    mekanIstatistikleriniGetir(mekanId).then((d) => gecerli && setIstatistik(d)).catch(() => {})
    suAnBurdakileriGetir(mekanId).then((d) => gecerli && setBurdakiler(d)).catch(() => {})
    mekanLiderligiGetir(mekanId).then((d) => gecerli && setLiderlik(d)).catch(() => {})
    mekanSonCheckInleriGetir(mekanId).then((d) => gecerli && setSonlar(d)).catch(() => {})

    return () => {
      gecerli = false
    }
  }, [mekanId])

  function ac(secim: 'apple' | 'google') {
    setSecimAcik(false)
    if (!mekan) return
    Linking.openURL(yolTarifiAdresi(secim, mekan))
  }

  function secenekEtiketi(secim: 'apple' | 'google'): string {
    return secim === 'apple'
      ? t('checkInHaritasi.appleHaritalar')
      : t('checkInHaritasi.googleHaritalar')
  }

  /**
   * Secim penceresi PLATFORMA GORE (kullanicinin karari 2026-09-01):
   *
   *   iOS      -> sistemin KENDI ActionSheet'i. Kullanicinin telefonun
   *               her yerinde gordugu pencerenin aynisi.
   *   Android  -> Apple Haritalar zaten yok, yani secenek TEK; pencere
   *               hic acilmiyor, dogrudan Google Haritalar aciliyor.
   *   web      -> yerel karsiligi yok, kendi Modal'imiz kaliyor.
   */
  async function haritayaDokunuldu() {
    const secenekler = await kuruluHaritalar()

    // Hicbir harita uygulamasi yoksa yol tarifi TARAYICIDA aciliyor.
    if (secenekler.length === 0) {
      ac('google')
      return
    }

    if (secenekler.length === 1) {
      ac(secenekler[0])
      return
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...secenekler.map(secenekEtiketi), t('checkInHaritasi.vazgec')],
          cancelButtonIndex: secenekler.length,
        },
        (secilen) => {
          if (secilen < secenekler.length) ac(secenekler[secilen])
        }
      )
      return
    }

    setSecimAcik(true)
  }

  /**
   * YALNIZCA ilce ve il. Kullanicinin karari (2026-08-31): "Mahalle
   * adres bilgisi aktarimini durdur ve sil, sadece konumlarin ilce ve
   * il bilgisini gosterecegiz TAM DOGRULUK ADINA."
   */
  const adresSatiri = [mekan?.semt, mekan?.il].filter(Boolean).join(', ') || null

  // Avatar seridinde en fazla ALTI kisi; gerisi "+N" rozetine giriyor.
  // Sayi ustteki istatistikten geliyor, listeden DEGIL - liste RLS ile
  // suzuldugu icin daha kisa olabilir ve "+N" o farki da kapsiyor.
  const GORUNEN_AVATAR = 6
  const gorunenler = burdakiler.slice(0, GORUNEN_AVATAR)
  const toplamBurada = istatistik?.suAnKisi ?? burdakiler.length
  const kalanBurada = Math.max(0, toplamBurada - gorunenler.length)

  return (
    <View style={stiller.kok}>
      <UstCubuk
        baslik={mekan?.ad ?? ''}
        geriEtiketi={t('checkInHaritasi.geri')}
        sag={
          mekan ? (
            <Pressable
              onPress={() => setMenuAcik(true)}
              accessibilityRole="button"
              accessibilityLabel={t('mekanSayfasi.menu')}
              testID="mekan-menu"
              hitSlop={10}
            >
              <DikeyUcNoktaIkonu />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {mekan && (
          <>
            <View>
              <Pressable
                onPress={haritayaDokunuldu}
                accessibilityRole="button"
                accessibilityLabel={t('checkInHaritasi.haritaAcikla')}
              >
                {/* Dokunuslar haritaya degil bu Pressable'a gitsin diye
                    harita katmani dokunusa kapali. */}
                <View pointerEvents="none" style={stiller.haritaCercevesi}>
                  <CanliHarita merkez={mekan.konum} mekanlar={cevre} yukseklik={280} />
                </View>
              </Pressable>

              {/* Haritanin uzerindeki TEK yuvarlak dugme: yol tarifi.
                  Referans gorselde bir de "konumuma git" dugmesi vardi;
                  bizim haritamiz etkilesimsiz oldugu icin onun bir
                  karsiligi yok - islevi olmayan bir dugme koymuyoruz. */}
              <Pressable
                style={stiller.haritaDugmesi}
                onPress={haritayaDokunuldu}
                accessibilityRole="button"
                accessibilityLabel={t('mekanSayfasi.yolTarifi')}
                testID="harita-yol-tarifi"
              >
                <NavigasyonIkonu />
              </Pressable>
            </View>

            <View style={stiller.baslikSatiri}>
              <View style={stiller.bilgi}>
                <Text style={stiller.ad}>{mekan.ad}</Text>
                {adresSatiri && <Text style={stiller.adres}>{adresSatiri}</Text>}
              </View>
              <Pressable
                style={stiller.tarifDugmesi}
                onPress={haritayaDokunuldu}
                accessibilityRole="button"
                testID="yol-tarifi-al"
              >
                <ArabaIkonu />
                <Text style={stiller.tarifYazi}>{t('mekanSayfasi.yolTarifi')}</Text>
              </Pressable>
            </View>

            {/* UC SAYI. Sayfanin tek amaci bu serit: "burasi canli mi,
                bugun hareket var mi, cevrede ne kadar one cikiyor".

                UCU DE AYNI YAPIDA: ikon ustte, buyuk sayi ortada, kucuk
                etiket altta. Ilk denemede orta kutu farkli kurulmustu
                ("Bugun" ustte, "23 check-in" altta) ve 390 px'lik bir
                ekranda ikiye bolunuyordu - uc sutuna bolunmus bir seritte
                yan yana yazi icin yer yok. */}
            <View style={stiller.olcuSeridi}>
              <View style={stiller.olcu}>
                <KisilerIkonu boyut={20} />
                <View style={stiller.olcuSayiSatiri}>
                  <Text style={stiller.olcuSayi}>{toplamBurada}</Text>
                  {toplamBurada > 0 && <View style={stiller.canliNokta} />}
                </View>
                <Text style={stiller.olcuEtiket} numberOfLines={1}>
                  {t('mekanSayfasi.kisiBurada')}
                </Text>
              </View>

              <View style={stiller.olcuAyirac} />

              <View style={stiller.olcu}>
                <CubukIkonu boyut={20} />
                <Text style={stiller.olcuSayi}>{istatistik?.bugunCheckIn ?? 0}</Text>
                <Text style={stiller.olcuEtiket} numberOfLines={1}>
                  {t('mekanSayfasi.bugunCheckIn')}
                </Text>
              </View>

              <View style={stiller.olcuAyirac} />

              <View style={stiller.olcu}>
                <YildizIkonu boyut={20} />
                {/* Sira YOKSA (ilce bilinmiyor ya da hic check-in yok)
                    uydurma bir "#1" gostermiyoruz - cizgi koyuyoruz. */}
                <Text style={stiller.olcuSayi}>
                  {istatistik?.ilceSirasi ? `#${istatistik.ilceSirasi}` : '—'}
                </Text>
                <Text style={stiller.olcuEtiket} numberOfLines={1}>
                  {istatistik?.ilce
                    ? t('mekanSayfasi.ilcede', { ilce: istatistik.ilce })
                    : t('mekanSayfasi.siralamaYok')}
                </Text>
              </View>
            </View>

            {/* SU AN BURADA. Kimse gorunmuyorsa bolum HIC cizilmiyor -
                bos bir serit "burada kimse yok" demek degil, "senin
                gorme hakkin yok" da demek olabilir; ikisini birbirine
                karistiran bir bosluk gostermektense hic gostermiyoruz.
                Sayi zaten ustteki seritte duruyor. */}
            {gorunenler.length > 0 && (
              <View style={stiller.bolum}>
                <View style={stiller.bolumBasligi}>
                  <View style={stiller.canliNoktaBuyuk} />
                  <Text style={stiller.bolumBaslikYazi}>{t('mekanSayfasi.suAnBurada')}</Text>
                  <Text style={stiller.bolumSag}>
                    {t('mekanSayfasi.kisiSayisi', { sayi: toplamBurada })}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={stiller.avatarSeridi}
                >
                  {gorunenler.map((kisi) => (
                    <Pressable
                      key={kisi.id}
                      style={stiller.avatarKutu}
                      onPress={() => router.push(`/kullanici/${kisi.kullaniciId}` as never)}
                      accessibilityRole="button"
                      accessibilityLabel={kisi.kullaniciAdi ?? t('mekanSayfasi.biri')}
                    >
                      <View style={stiller.avatar}>
                        <Text style={stiller.avatarHarf}>{basHarf(kisi.kullaniciAdi)}</Text>
                        <View style={stiller.avatarCanli} />
                      </View>
                      <Text style={stiller.avatarAd} numberOfLines={1}>
                        {kisi.kullaniciAdi ?? t('mekanSayfasi.biri')}
                      </Text>
                    </Pressable>
                  ))}

                  {kalanBurada > 0 && (
                    <View style={stiller.avatarKutu}>
                      <View style={[stiller.avatar, stiller.avatarKalan]}>
                        <Text style={stiller.avatarKalanYazi}>+{kalanBurada}</Text>
                      </View>
                      <Text style={stiller.avatarAd}>{t('mekanSayfasi.diger')}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* IKI SEKME */}
            <View style={stiller.sekmeler}>
              <Pressable
                style={[stiller.sekme, sekme === 'liderlik' && stiller.sekmeAktif]}
                onPress={() => setSekme('liderlik')}
                accessibilityRole="button"
                testID="sekme-liderlik"
              >
                <KupaIkonu renk={sekme === 'liderlik' ? '#FFFFFF' : renk.metinIkincil} />
                <Text style={[stiller.sekmeYazi, sekme === 'liderlik' && stiller.sekmeYaziAktif]}>
                  {t('mekanSayfasi.liderlik')}
                </Text>
              </Pressable>
              <Pressable
                style={[stiller.sekme, sekme === 'son' && stiller.sekmeAktif]}
                onPress={() => setSekme('son')}
                accessibilityRole="button"
                testID="sekme-son"
              >
                <SaatIkonu renk={sekme === 'son' ? '#FFFFFF' : renk.metinIkincil} />
                <Text style={[stiller.sekmeYazi, sekme === 'son' && stiller.sekmeYaziAktif]}>
                  {t('mekanSayfasi.sonCheckInler')}
                </Text>
              </Pressable>
            </View>

            <View style={stiller.liste}>
              {sekme === 'liderlik' ? (
                liderlik.length === 0 ? (
                  <Text style={stiller.bos}>{t('mekanSayfasi.liderlikBos')}</Text>
                ) : (
                  liderlik.map((satir, sira) => (
                    <Pressable
                      key={satir.kullaniciId}
                      style={[stiller.listeSatiri, sira > 0 && stiller.listeAyirac]}
                      onPress={() => router.push(`/kullanici/${satir.kullaniciId}` as never)}
                      accessibilityRole="button"
                    >
                      <SiraMadalyasi sira={sira + 1} />
                      <View style={stiller.kucukAvatar}>
                        <Text style={stiller.kucukAvatarHarf}>
                          {basHarf(satir.kullaniciAdi)}
                        </Text>
                      </View>
                      <View style={stiller.listeOrta}>
                        <Text style={stiller.listeAd} numberOfLines={1}>
                          {satir.kullaniciAdi ?? t('mekanSayfasi.biri')}
                        </Text>
                        <Text style={stiller.listeAlt}>
                          {t('mekanSayfasi.checkInSayisi', { sayi: satir.checkInSayisi })}
                        </Text>
                      </View>
                      <Text style={stiller.listeSayi}>{satir.checkInSayisi}</Text>
                    </Pressable>
                  ))
                )
              ) : sonlar.length === 0 ? (
                <Text style={stiller.bos}>{t('mekanSayfasi.sonBos')}</Text>
              ) : (
                sonlar.map((satir, sira) => (
                  <Pressable
                    key={satir.id}
                    style={[stiller.listeSatiri, sira > 0 && stiller.listeAyirac]}
                    onPress={() => router.push(`/kullanici/${satir.kullaniciId}` as never)}
                    accessibilityRole="button"
                  >
                    <View style={stiller.kucukAvatar}>
                      <Text style={stiller.kucukAvatarHarf}>{basHarf(satir.kullaniciAdi)}</Text>
                      {satir.canliMi && <View style={stiller.avatarCanli} />}
                    </View>
                    <View style={stiller.listeOrta}>
                      <Text style={stiller.listeAd} numberOfLines={1}>
                        {satir.kullaniciAdi ?? t('mekanSayfasi.biri')}
                      </Text>
                      {/* Not VARSA gosteriliyor - o da RLS'ten gecmis
                          bir icerik, yani gormeye hakkimiz var.
                          Not yoksa satir HIC cizilmiyor: ilk halde
                          oraya gorece zaman konuyordu ve sagdaki zamanla
                          birebir ayni metni tekrar ediyordu. */}
                      {satir.notMetni && (
                        <Text style={stiller.listeAlt} numberOfLines={1}>
                          {satir.notMetni}
                        </Text>
                      )}
                    </View>
                    <Text style={stiller.listeZaman}>
                      {satir.canliMi
                        ? t('mekanSayfasi.suAn')
                        : gorecelZaman(satir.olusturmaZamani, t)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <SecimPenceresi
        acikMi={menuAcik}
        onKapat={() => setMenuAcik(false)}
        secimler={[
          {
            etiket: t('mekanSayfasi.buradaCheckIn'),
            onSec: () => {
              setMenuAcik(false)
              router.push(`/check-in/${mekanId}` as never)
            },
            testID: 'menu-check-in',
          },
          {
            etiket: t('checkInHaritasi.haritadaAc'),
            onSec: () => {
              setMenuAcik(false)
              haritayaDokunuldu()
            },
            testID: 'menu-haritada-ac',
          },
        ]}
      />

      {/* Harita secim penceresi ekranin ALTINDAN geliyor.
          `Alert.alert` kullanilmadi: react-native-web'de calismiyor ve
          uygulama tarayicidan da aciliyor.
          MODAL kullanildi cunku alt gezinme cubugu kokte `<Slot />`den
          SONRA ciziliyor; ekranin kendi icine konan bir pencere cubugun
          ALTINDA kaliyor ve ust uste biniyordu (2026-08-30). */}
      <Modal
        visible={secimAcik}
        transparent
        animationType="fade"
        onRequestClose={() => setSecimAcik(false)}
      >
        <View style={stiller.modalKok}>
          <Pressable
            style={stiller.perde}
            onPress={() => setSecimAcik(false)}
            accessibilityRole="button"
            accessibilityLabel={t('checkInHaritasi.vazgec')}
          />
          <View style={stiller.sayfa}>
            <Text style={stiller.sayfaBaslik}>{t('checkInHaritasi.secimBaslik')}</Text>

            {haritaSecenekleri().map((secenek) => (
              <Pressable
                key={secenek}
                style={stiller.secenek}
                onPress={() => ac(secenek)}
                accessibilityRole="button"
              >
                <Text style={stiller.secenekYazi}>{secenekEtiketi(secenek)}</Text>
              </Pressable>
            ))}

            <Pressable
              style={stiller.vazgec}
              onPress={() => setSecimAcik(false)}
              accessibilityRole="button"
            >
              <Text style={stiller.vazgecYazi}>{t('checkInHaritasi.vazgec')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
    gap: bosluk.l,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },
  haritaCercevesi: {
    borderRadius: yuvarlak.kart,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  haritaDugmesi: {
    position: 'absolute',
    right: bosluk.m,
    bottom: bosluk.m,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    ...golge.yuzer,
  },

  baslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
  },
  bilgi: { flex: 1, gap: 2 },
  ad: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  adres: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
  },
  // Turuncu KENARLIKLI, dolu degil: sayfadaki tek dolu turuncu alt
  // gezinmedeki check-in dugmesi ve o baska bir eylem. Ikisi de dolu
  // olsaydi hangisinin asil eylem oldugu belirsizlesirdi.
  tarifDugmesi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tarifYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncu,
  },

  olcuSeridi: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingVertical: 14,
    paddingHorizontal: bosluk.m,
  },
  olcu: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  olcuAyirac: {
    width: 1,
    height: 44,
    backgroundColor: renk.cizgi,
  },
  olcuSayiSatiri: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  olcuSayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },
  olcuEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    textAlign: 'center',
  },
  canliNokta: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2FBF5B',
  },

  bolum: { gap: bosluk.s },
  bolumBasligi: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  canliNoktaBuyuk: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: renk.turuncu,
  },
  bolumBaslikYazi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  bolumSag: {
    marginLeft: 'auto',
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  avatarSeridi: { gap: bosluk.m, paddingVertical: 2 },
  avatarKutu: { alignItems: 'center', width: 60, gap: 5 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: renk.turuncuZemin,
    borderWidth: 2,
    borderColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.turuncu,
  },
  // Yesil nokta "su an burada" demek; turuncu cemberin uzerinde ayri
  // bir renk olmasi lazim ki halkayla karismasin.
  avatarCanli: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#2FBF5B',
    borderWidth: 2,
    borderColor: renk.zemin,
  },
  avatarKalan: { borderColor: 'transparent' },
  avatarKalanYazi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  avatarAd: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    maxWidth: 60,
  },

  sekmeler: {
    flexDirection: 'row',
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    padding: 4,
    gap: 4,
  },
  sekme: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: yuvarlak.hap,
  },
  sekmeAktif: { backgroundColor: renk.turuncu },
  sekmeYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  sekmeYaziAktif: { color: '#FFFFFF' },

  liste: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingHorizontal: bosluk.m,
  },
  listeSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    paddingVertical: 12,
  },
  listeAyirac: { borderTopWidth: 1, borderTopColor: renk.cizgi },
  kucukAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kucukAvatarHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  listeOrta: { flex: 1, minWidth: 0 },
  listeAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  listeAlt: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  listeSayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.turuncu,
  },
  listeZaman: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  bos: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingVertical: bosluk.l,
    textAlign: 'center',
  },

  modalKok: { flex: 1, justifyContent: 'flex-end' },
  perde: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 19, 15, 0.35)',
  },
  sayfa: {
    marginHorizontal: bosluk.m,
    marginBottom: bosluk.xl,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    padding: bosluk.l,
    gap: bosluk.s,
    ...golge.yuzer,
  },
  sayfaBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metin,
    textAlign: 'center',
    marginBottom: bosluk.xs,
  },
  secenek: {
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secenekYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  vazgec: { paddingVertical: 12, alignItems: 'center' },
  vazgecYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
})
