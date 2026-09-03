import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Linking,
  Modal,
  Platform,
  ActionSheetIOS,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir, type Mekan } from '../../../lib/mekan'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { CanliHarita, type HaritaMekani } from '../../tasarim/CanliHarita'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/**
 * BIR CHECK-IN'IN KONUMU.
 *
 * Akistaki ya da profildeki bir check-in'e VE mekan adina basilinca
 * aciliyor. Mekan adi onceden `/check-in/<id>` ekranini aciyordu
 * (yeni check-in formu); kullanicinin karari (2026-08-30): konum
 * etiketine basinca konumun kendisi gorunmeli.
 *
 * Harita MEKANA ODAKLI: merkezde check-in'in yapildigi yer duruyor,
 * cevresinde de yakin mekanlar - yalnizca tek bir nokta gostermek
 * "neresi burasi" sorusunu cevaplamiyor, cevre baglami gerekiyor.
 *
 * Kullanicinin kendi konumu BURADA KULLANILMIYOR: check-in baska bir
 * gun baska bir yerde yapilmis olabilir, "sana uzakligi" yaniltici
 * olurdu.
 *
 * HARITA BURADA DOKUNMATIK DEGIL, BIR DUGME. Ustune basinca hangi
 * harita uygulamasiyla acilacagi soruluyor (kullanicinin istegi
 * 2026-08-30). Bu yuzden kaydirma ve yakinlastirma bilerek kapali:
 * ayni alan hem kaydirilip hem "basilinca acilan" bir dugme olamaz.
 * Yol tarifi bizim isimiz degil, cihazin harita uygulamasi yapiyor.
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
  //
  // "Gercekten hicbiri kurulu degil" durumu da ayni yola duesuyor ve bu
  // zararsiz: iOS'ta Apple Haritalar neredeyse her zaman kurulu oldugu
  // icin bu pratikte "beyan yok" demek, ve kullanici yine bir secenek
  // secip hedefe ulasiyor (kurulu degilse tarayici aciliyor).
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

export default function CheckInHaritasiEkrani() {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [cevre, setCevre] = useState<HaritaMekani[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [secimAcik, setSecimAcik] = useState(false)

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
   *               her yerinde gordugu pencerenin aynisi; yazi tipi,
   *               renk ve duzen sistemden geliyor. Kendi Modal'imiz
   *               orada yabanci duruyordu. Marka rengimiz bu pencerede
   *               gorunmez - dogrusu da bu, pencere bize ait degil.
   *   Android  -> Apple Haritalar zaten yok, yani secenek TEK; pencere
   *               hic acilmiyor, dogrudan Google Haritalar aciliyor.
   *               Bos yere bir adim eklemek kullaniciyi yavaslatir.
   *   web      -> yerel karsiligi yok, kendi Modal'imiz kaliyor.
   *
   * ActionSheetIOS React Native cekirdeginde; native tarafta yeni bir
   * sey gerekmiyor, yani bu degisiklik OTA ile gidebiliyor.
   */
  async function haritayaDokunuldu() {
    const secenekler = await kuruluHaritalar()

    // Hicbir harita uygulamasi yoksa yol tarifi TARAYICIDA aciliyor.
    // Kullanici yine hedefe ulasiyor; pencere acip bos liste gostermek
    // ya da hicbir sey yapmamak ikisi de daha kotu olurdu.
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
   *
   * Bu ekranda once CIHAZDAN adres cozuluyordu (Apple/Google) ve YANLIS
   * mahalle uretiyordu; sonra mekanin KENDI adresi kullanildi, o da
   * kaynakta kirli cikti. Ilce ve il poligon testiyle atandigi icin
   * kesin. Liste ekrani da ayni ibareyi gosteriyor - tutarlilik burada.
   */
  const adresSatiri = [mekan?.semt, mekan?.il].filter(Boolean).join(', ') || null

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={mekan?.ad ?? ''} geriEtiketi={t('checkInHaritasi.geri')} />

      <View style={stiller.icerik}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {mekan && (
          <>
            <Pressable
              onPress={haritayaDokunuldu}
              accessibilityRole="button"
              accessibilityLabel={t('checkInHaritasi.haritaAcikla')}
            >
              {/* Dokunuslar haritaya degil bu Pressable'a gitsin diye
                  harita katmani dokunusa kapali. */}
              <View pointerEvents="none" style={stiller.haritaCercevesi}>
                <CanliHarita merkez={mekan.konum} mekanlar={cevre} yukseklik={320} />
              </View>
            </Pressable>

            <View style={stiller.bilgi}>
              <Text style={stiller.ad}>{mekan.ad}</Text>
              {adresSatiri && <Text style={stiller.adres}>{adresSatiri}</Text>}
            </View>

            <Pressable
              style={stiller.buton}
              onPress={haritayaDokunuldu}
              accessibilityRole="button"
            >
              <Text style={stiller.butonYazi}>{t('checkInHaritasi.haritadaAc')}</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Secim penceresi ekranin ALTINDAN geliyor.
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
  bilgi: { gap: 2 },
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
  buton: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
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
