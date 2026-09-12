import { useEffect, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { mekaniGetir, TEMEL_TUR_GRUPLARI, type Mekan } from '../../../../lib/mekan'
import {
  duzenlemeTalebiGonder,
  mekanFotografiYukle,
  bekleyenTalebimVarMi,
  AD_EN_FAZLA,
  ADRES_EN_FAZLA,
  MAHALLE_EN_FAZLA,
  IL_ILCE_EN_FAZLA,
} from '../../../../lib/mekan-duzenleme'
import { supabase } from '../../../../lib/supabase'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from '../../../tasarim/tema'
import { useRenk, useStiller } from '../../../tasarim/tema-baglami'
import { UstCubuk } from '../../../tasarim/UstCubuk'
import { SecimPenceresi } from '../../../tasarim/SecimPenceresi'
import { ALT_GEZINME_PAYI } from '../../../tasarim/AltGezinme'

/**
 * MEKAN DUZENLEME TALEBI EKRANI.
 *
 * Kullanicinin istegi (2026-09-09): "konumlara duzenleme talebi gonder
 * ekle; talebe basan kisi konum ismi, adresi, kapak fotografi, turunu
 * secebilsin, moderatore talebini gondersin."
 *
 * ALANLAR MEVCUT DEGERLE DOLU BASLIYOR ve gonderilirken YALNIZCA
 * DEGISENLER yollaniyor. Bos formla baslamak kisiye adi bastan
 * yazdirirdi; her alani degismis gibi gondermek ise moderatorun onune
 * degismemis satirlar cikarirdi.
 *
 * TALEP DOGRUDAN UYGULANMIYOR - ekranda da bu yaziyor. Kullanici
 * "duzelttim" sanip degismedigini gorurse guveni kirilir.
 */
import { useDil } from '../../../../lib/dil'
import { turEtiketi, turGrupEtiketi } from '../../../../lib/tur-etiketi'
export default function MekanDuzenleEkrani() {
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const router = useRouter()
  const { t } = useDil()
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()

  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [ad, setAd] = useState('')
  const [mahalle, setMahalle] = useState('')
  const [adres, setAdres] = useState('')
  const [il, setIl] = useState('')
  const [ilce, setIlce] = useState('')
  const [tur, setTur] = useState<string | null>(null)
  const [yerelFoto, setYerelFoto] = useState<string | null>(null)
  const [kapali, setKapali] = useState(false)
  const [kaynakSecimi, setKaynakSecimi] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [bekleyenVar, setBekleyenVar] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  /*
   * IKI ISTEK TEK ZINCIRDE. Ayri ayri `then` yazildiginda ikisi ayni
   * anda state guncelliyor ve React "overlapping act() calls" diye
   * uyariyor; testler de o yuzden kirilmisti. Tek `Promise.all` hem
   * uyariyi kaldiriyor hem de ekrani tek seferde dolduruyor.
   */
  useEffect(() => {
    let gecerli = true
    Promise.all([mekaniGetir(mekanId), bekleyenTalebimVarMi(mekanId)])
      .then(([bulunan, bekleyen]) => {
        if (!gecerli) return
        setBekleyenVar(bekleyen)
        if (!bulunan) return
        setMekan(bulunan)
        setAd(bulunan.ad)
        setMahalle(bulunan.mahalle ?? '')
        setAdres(bulunan.adres ?? '')
        setIl(bulunan.il ?? '')
        // `semt` sutununun adi tarihsel; icerigi 2026-08-31'den beri
        // ILCE (poligon testiyle atanmis).
        setIlce(bulunan.semt ?? '')
        setTur(bulunan.tur ?? null)
      })
      .catch((e) => {
        if (gecerli) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      })
    return () => {
      gecerli = false
    }
  }, [mekanId])

  /**
   * Secici, KAYNAK PENCERESI KAPANDIKTAN SONRA aciliyor.
   *
   * Kullanicinin bildirdigi hata (2026-09-09): "galeriden sec diyince
   * galeriden secme acilmiyor". Sebep: iOS bir modal kapanirken uzerine
   * ikinci bir native ekran SUNAMIYOR; cagri sessizce hicbir sey
   * yapmadan donuyor. Pencereyi kapatip bir sonraki kareyi beklemek
   * yetiyor.
   *
   * Hatalar da YUTULMUYOR: dugmeye basip hicbir sey olmamasi
   * "uygulama bozuk" diye okunur - tam da bu hatada oldugu gibi.
   */
  function kaynakSec(kaynak: 'kamera' | 'galeri') {
    setKaynakSecimi(false)
    setTimeout(() => {
      const cagri = kaynak === 'kamera' ? kameradanCek : galeridenSec
      cagri().catch((e) =>
        setHata(e instanceof Error ? e.message : t('mekanDuzenle.fotografSecilemedi'))
      )
    }, 350)
  }

  async function kameradanCek() {
    // Izin REDDEDILIRSE sessizce gecmiyoruz.
    const izin = await ImagePicker.requestCameraPermissionsAsync()
    if (!izin.granted) {
      setHata(t('checkIn.kameraIzni'))
      return
    }
    const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!sonuc.canceled) setYerelFoto(sonuc.assets[0].uri)
  }

  async function galeridenSec() {
    // GALERI IZNI DE ACIKCA ISTENIYOR. iOS'ta izin verilmemisse
    // `launchImageLibraryAsync` hicbir sey gostermeden donuyor; ekranda
    // sebep gorunmuyordu.
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!izin.granted) {
      setHata(t('mekanDuzenle.galeriIzni'))
      return
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })
    if (!sonuc.canceled) setYerelFoto(sonuc.assets[0].uri)
  }

  const degisenAd = mekan && ad.trim() !== mekan.ad ? ad.trim() : null
  const degisenMahalle =
    mekan && mahalle.trim() !== (mekan.mahalle ?? '') ? mahalle.trim() : null
  const degisenAdres = mekan && adres.trim() !== (mekan.adres ?? '') ? adres.trim() : null
  const degisenIl = mekan && il.trim() !== (mekan.il ?? '') ? il.trim() : null
  const degisenIlce = mekan && ilce.trim() !== (mekan.semt ?? '') ? ilce.trim() : null
  const degisenTur = mekan && tur && tur !== mekan.tur ? tur : null
  const degisiklikVar = Boolean(
    degisenAd ||
      degisenMahalle ||
      degisenAdres ||
      degisenIl ||
      degisenIlce ||
      degisenTur ||
      yerelFoto ||
      kapali
  )

  async function gonder() {
    if (!degisiklikVar || gonderiliyor) return
    setGonderiliyor(true)
    setHata(null)
    try {
      let fotografYolu: string | null = null
      if (yerelFoto) {
        const { data } = await supabase.auth.getUser()
        const kisi = data.user?.id
        if (!kisi) throw new Error(t('mekanDuzenle.oturumYok'))
        fotografYolu = await mekanFotografiYukle(kisi, yerelFoto)
      }
      await duzenlemeTalebiGonder(mekanId, {
        ad: degisenAd,
        mahalle: degisenMahalle,
        adres: degisenAdres,
        il: degisenIl,
        ilce: degisenIlce,
        tur: degisenTur,
        fotograf: fotografYolu,
        kapali,
      })
      setGonderildi(true)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('mekanDuzenle.baslik')} geriEtiketi={t('ortak.geri')} />

      {/* KLAVYE KAYDIRINCA KAPANIYOR, kok bir Pressable ILE DEGIL.
          Ilk halde ekranin koku `Pressable`di (bos yere basinca klavye
          kapansin diye) ve o Pressable dokunma yanitini kapiyordu:
          parmak surukleyince liste HIC kaymiyordu - kullanicinin
          bildirdigi hata. `keyboardDismissMode` ayni isi kaydirma
          hareketinin kendisiyle yapiyor. */}
      <ScrollView
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {gonderildi ? (
          /* SONUC EKRANI. Formu acik birakip ustune "gonderildi" yazmak
             kisiye ikinci kez gonderebilecegini dusuendueruerdue. */
          <View style={stiller.sonuc} testID="talep-gonderildi">
            <Text style={stiller.sonucBaslik}>{t('mekanDuzenle.gonderildiBaslik')}</Text>
            <Text style={stiller.sonucMetin}>{t('mekanDuzenle.gonderildiMetin')}</Text>
            <Pressable style={stiller.birincil} onPress={() => router.back()}>
              <Text style={stiller.birincilYazi}>{t('ortak.tamam')}</Text>
            </Pressable>
          </View>
        ) : bekleyenVar ? (
          <View style={stiller.sonuc} testID="bekleyen-talep">
            <Text style={stiller.sonucBaslik}>{t('mekanDuzenle.bekleyenBaslik')}</Text>
            <Text style={stiller.sonucMetin}>{t('mekanDuzenle.bekleyenMetin')}</Text>
          </View>
        ) : (
          <>
            <Text style={stiller.aciklama}>{t('mekanDuzenle.aciklama')}</Text>

            <Text style={stiller.etiket}>{t('mekanDuzenle.adEtiket')}</Text>
            <TextInput
              style={stiller.alan}
              value={ad}
              onChangeText={(d) => setAd(d.slice(0, AD_EN_FAZLA))}
              placeholder={t('mekanDuzenle.adYerTutucu')}
              testID="duzenle-ad"
            />

            {/* MAHALLE ADRESIN BASINDA (kullanicinin istegi
                2026-09-09). Turkiye'de adres mahalleyle basliyor;
                ayri bir alan olmasi hem yazmayi kolaylastiriyor hem de
                veriyi aranabilir tutuyor - adres serbest metin, mahalle
                ise tek basina bir alan. */}
            <Text style={stiller.etiket}>{t('mekanDuzenle.mahalle')}</Text>
            <TextInput
              style={stiller.alan}
              value={mahalle}
              onChangeText={(d) => setMahalle(d.slice(0, MAHALLE_EN_FAZLA))}
              placeholder={t('mekanDuzenle.mahalleYerTutucu')}
              testID="duzenle-mahalle"
            />

            <Text style={stiller.etiket}>{t('mekanDuzenle.adres')}</Text>
            <TextInput
              style={[stiller.alan, stiller.cokSatirli]}
              value={adres}
              onChangeText={(d) => setAdres(d.slice(0, ADRES_EN_FAZLA))}
              placeholder={t('mekanDuzenle.adresYerTutucu')}
              multiline
              testID="duzenle-adres"
            />

            {/* IL VE ILCE AYRI SATIRDA, yan yana: ikisi de kisa ve
                birlikte okunuyor. */}
            <View style={stiller.ikili}>
              <View style={stiller.yariAlan}>
                <Text style={stiller.etiket}>{t('mekanDuzenle.il')}</Text>
                <TextInput
                  style={stiller.alan}
                  value={il}
                  onChangeText={(d) => setIl(d.slice(0, IL_ILCE_EN_FAZLA))}
                  placeholder={t('mekanDuzenle.ilYerTutucu')}
                  testID="duzenle-il"
                />
              </View>
              <View style={stiller.yariAlan}>
                <Text style={stiller.etiket}>{t('mekanDuzenle.ilce')}</Text>
                <TextInput
                  style={stiller.alan}
                  value={ilce}
                  onChangeText={(d) => setIlce(d.slice(0, IL_ILCE_EN_FAZLA))}
                  placeholder={t('mekanDuzenle.ilceYerTutucu')}
                  testID="duzenle-ilce"
                />
              </View>
            </View>

            <Text style={stiller.etiket}>{t('mekanDuzenle.tur')}</Text>
            {/* TUR SERBEST METIN DEGIL: onay verildiginde deger dogrudan
                mekan kaydina yaziliyor ve butun suzgecleri besliyor.
                Liste suzgectekiyle AYNI kaynaktan (TEMEL_TUR_GRUPLARI) -
                iki yerde iki farkli tur listesi olmasin. */}
            {TEMEL_TUR_GRUPLARI.map((grup) => (
              <View key={grup.baslik} style={stiller.grup}>
                <Text style={stiller.grupBaslik}>{turGrupEtiketi(grup.baslik)}</Text>
                <View style={stiller.cipler}>
                  {grup.turler.map((secenek) => (
                    <Pressable
                      key={secenek}
                      style={[stiller.cip, tur === secenek && stiller.cipSecili]}
                      onPress={() => setTur(secenek)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: tur === secenek }}
                    >
                      <Text style={[stiller.cipYazi, tur === secenek && stiller.cipYaziSecili]}>{turEtiketi(secenek)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <Text style={stiller.etiket}>{t('mekanDuzenle.kapakFotografi')}</Text>
            {yerelFoto ? (
              <View>
                <Image source={{ uri: yerelFoto }} style={stiller.onizleme} />
                <Pressable onPress={() => setYerelFoto(null)} testID="fotografi-kaldir">
                  <Text style={stiller.kaldirYazi}>{t('mekanDuzenle.fotografiKaldir')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={stiller.ikincil}
                onPress={() => setKaynakSecimi(true)}
                testID="fotograf-ekle"
              >
                <Text style={stiller.ikincilYazi}>{t('mekanDuzenle.fotografEkle')}</Text>
              </Pressable>
            )}

            {/* KAPANDI BILDIRIMI (kullanicinin sorusu 2026-09-10:
                "kapali, gercekte olmayan yerler var, bunlari tespit
                etmek mumkun mu?").

                OTOMATIK TESPIT OLCULDU VE ELENDI: Foursquare'in
                `date_closed` alani indirme sirasinda zaten
                filtrelenmis, elimizdeki tek dolayli sinyal olan
                `date_refreshed` ise zayif - kayitlarin %61'i 2020
                oncesi ve "guncellenmemis" ile "kapandi" ayni sey
                degil. Orada bulunan kisi bunu her sinyalden iyi
                biliyor.

                EN ALTTA ve DIGER ALANLARDAN AYRI: en agir sonucu olan
                secim bu - onaylanirsa mekan butun listelerden duesueyor.
                Yanlislikla acilmasin diye adres/tur alanlarinin arasina
                karistirilmadi. */}
            <View style={stiller.ayirici} />
            {mekan?.kapali ? (
              <Text style={stiller.kapaliNot} testID="zaten-kapali">
                {t('mekanDuzenle.zatenKapali')}
              </Text>
            ) : (
              <View style={stiller.kapaliSatir}>
                <View style={stiller.kapaliMetin}>
                  <Text style={stiller.kapaliBaslik}>{t('mekanDuzenle.kapaliBaslik')}</Text>
                  <Text style={stiller.kapaliAciklama}>{t('mekanDuzenle.kapaliAciklama')}</Text>
                </View>
                <Switch
                  accessibilityLabel={t('mekanDuzenle.kapaliBaslik')}
                  value={kapali}
                  onValueChange={setKapali}
                  trackColor={{ true: renk.turuncu, false: renk.cizgi }}
                  thumbColor={renk.yuzey}
                  {...({ activeThumbColor: renk.yuzey } as object)}
                  testID="kapali-anahtari"
                />
              </View>
            )}

            {/* Dugme DEGISIKLIK YOKKEN de basilabilir kaliyor ve sebebini
                soyluyor: tamamen devre disi birakmak kisiyi "neden
                calismiyor" sorusuyla bas basa birakiyordu (ayni ders
                hesap olusturma ekraninda ogrenildi). */}
            <Pressable
              style={[stiller.birincil, !degisiklikVar && stiller.birincilSolu]}
              onPress={degisiklikVar ? gonder : () => setHata(t('mekanDuzenle.onceDegistir'))}
              testID="talebi-gonder"
              accessibilityRole="button"
            >
              <Text style={[stiller.birincilYazi, !degisiklikVar && stiller.birincilYaziSolu]}>
                {gonderiliyor ? t('ortak.gonderiliyor') : t('mekanDuzenle.talebiGonder')}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <SecimPenceresi
        acikMi={kaynakSecimi}
        secimler={[
          { etiket: t('checkIn.fotografCek'), testID: 'foto-kamera', onSec: () => kaynakSec('kamera') },
          { etiket: t('checkIn.galeridenSec'), testID: 'foto-galeri', onSec: () => kaynakSec('galeri') },
        ]}
        onKapat={() => setKaynakSecimi(false)}
      />
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { flex: 1, backgroundColor: renk.zemin },
    icerik: {
      paddingHorizontal: bosluk.sayfa,
      paddingBottom: ALT_GEZINME_PAYI,
      gap: bosluk.s,
    },
    aciklama: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      marginBottom: bosluk.s,
    },
    hata: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.yikici },
    etiket: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.kucuk,
      color: renk.metin,
      marginTop: bosluk.m,
    },
    alan: {
      borderWidth: 1,
      borderColor: renk.cizgi,
      borderRadius: yuvarlak.kart,
      paddingHorizontal: bosluk.m,
      paddingVertical: bosluk.m,
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      color: renk.metin,
    },
    cokSatirli: { minHeight: 66, textAlignVertical: 'top' },
    ikili: { flexDirection: 'row', gap: bosluk.m },
    yariAlan: { flex: 1 },
    grup: { marginTop: bosluk.s, gap: bosluk.xs },
    grupBaslik: { fontFamily: yazi.govde, fontSize: olcek.minik, color: renk.metinIkincil },
    cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s },
    cip: {
      paddingHorizontal: bosluk.m,
      paddingVertical: bosluk.s,
      borderRadius: yuvarlak.hap,
      borderWidth: 1,
      borderColor: renk.cizgi,
    },
    cipSecili: { backgroundColor: renk.turuncuZemin, borderColor: renk.turuncu },
    cipYazi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
    cipYaziSecili: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },
    onizleme: {
      width: '100%',
      height: 180,
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.cizgi,
    },
    kaldirYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.kucuk,
      color: renk.yikici,
      marginTop: bosluk.s,
    },
    ayirici: {
      height: 1,
      backgroundColor: renk.cizgi,
      marginTop: bosluk.xl,
    },
    kapaliSatir: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.m,
      marginTop: bosluk.m,
    },
    kapaliMetin: { flex: 1, gap: bosluk.xs },
    kapaliBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
    kapaliAciklama: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
    },
    kapaliNot: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      marginTop: bosluk.m,
    },
    ikincil: {
      borderWidth: 1.5,
      borderColor: renk.turuncuYazi,
      borderRadius: yuvarlak.hap,
      paddingVertical: bosluk.m,
      alignItems: 'center',
    },
    ikincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi },
    birincil: {
      backgroundColor: renk.turuncu,
      borderRadius: yuvarlak.hap,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: bosluk.xl,
    },
    // Eksikken YALNIZCA DOLGU notre cekiliyor; opaklikla soldurmak
    // etiketi de okunmaz yapiyordu (2026-09-07 olcumu: 1,57:1).
    birincilSolu: { backgroundColor: renk.cizgi },
    birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
    birincilYaziSolu: { color: renk.metinIkincil },
    sonuc: { gap: bosluk.m, paddingTop: bosluk.xl },
    sonucBaslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.altBaslik, color: renk.metin },
    sonucMetin: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  })
