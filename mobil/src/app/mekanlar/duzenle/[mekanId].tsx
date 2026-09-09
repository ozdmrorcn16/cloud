import { useEffect, useState } from 'react'
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
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
} from '../../../../lib/mekan-duzenleme'
import { supabase } from '../../../../lib/supabase'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from '../../../tasarim/tema'
import { useStiller } from '../../../tasarim/tema-baglami'
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
export default function MekanDuzenleEkrani() {
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const router = useRouter()
  const stiller = useStiller(stilleriYap)

  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [ad, setAd] = useState('')
  const [adres, setAdres] = useState('')
  const [tur, setTur] = useState<string | null>(null)
  const [yerelFoto, setYerelFoto] = useState<string | null>(null)
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
        setAdres(bulunan.adres ?? '')
        setTur(bulunan.tur ?? null)
      })
      .catch((e) => {
        if (gecerli) setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
      })
    return () => {
      gecerli = false
    }
  }, [mekanId])

  async function kameradanCek() {
    setKaynakSecimi(false)
    const izin = await ImagePicker.requestCameraPermissionsAsync()
    if (!izin.granted) {
      setHata('Fotoğraf çekmek için kamera izni gerekiyor.')
      return
    }
    const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!sonuc.canceled) setYerelFoto(sonuc.assets[0].uri)
  }

  async function galeridenSec() {
    setKaynakSecimi(false)
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    })
    if (!sonuc.canceled) setYerelFoto(sonuc.assets[0].uri)
  }

  const degisenAd = mekan && ad.trim() !== mekan.ad ? ad.trim() : null
  const degisenAdres = mekan && adres.trim() !== (mekan.adres ?? '') ? adres.trim() : null
  const degisenTur = mekan && tur && tur !== mekan.tur ? tur : null
  const degisiklikVar = Boolean(degisenAd || degisenAdres || degisenTur || yerelFoto)

  async function gonder() {
    if (!degisiklikVar || gonderiliyor) return
    setGonderiliyor(true)
    setHata(null)
    try {
      let fotografYolu: string | null = null
      if (yerelFoto) {
        const { data } = await supabase.auth.getUser()
        const kisi = data.user?.id
        if (!kisi) throw new Error('Oturum bulunamadı')
        fotografYolu = await mekanFotografiYukle(kisi, yerelFoto)
      }
      await duzenlemeTalebiGonder(mekanId, {
        ad: degisenAd,
        adres: degisenAdres,
        tur: degisenTur,
        fotograf: fotografYolu,
      })
      setGonderildi(true)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <Pressable style={stiller.kok} onPress={Keyboard.dismiss} accessible={false}>
      <UstCubuk baslik="Bilgileri düzelt" geriEtiketi="Geri" />

      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {gonderildi ? (
          /* SONUC EKRANI. Formu acik birakip ustune "gonderildi" yazmak
             kisiye ikinci kez gonderebilecegini dusuendueruerdue. */
          <View style={stiller.sonuc} testID="talep-gonderildi">
            <Text style={stiller.sonucBaslik}>Talebin gönderildi</Text>
            <Text style={stiller.sonucMetin}>
              Moderatör inceleyip onayladığında mekân bilgileri güncellenecek.
            </Text>
            <Pressable style={stiller.birincil} onPress={() => router.back()}>
              <Text style={stiller.birincilYazi}>Tamam</Text>
            </Pressable>
          </View>
        ) : bekleyenVar ? (
          <View style={stiller.sonuc} testID="bekleyen-talep">
            <Text style={stiller.sonucBaslik}>Bekleyen talebin var</Text>
            <Text style={stiller.sonucMetin}>
              Bu mekân için gönderdiğin talep hâlâ inceleniyor. Sonuçlanınca yeni bir
              düzeltme gönderebilirsin.
            </Text>
          </View>
        ) : (
          <>
            <Text style={stiller.aciklama}>
              Yanlış bir bilgi mi var? Düzeltmen moderatöre gider; onaylanınca herkes için
              güncellenir.
            </Text>

            <Text style={stiller.etiket}>Mekân adı</Text>
            <TextInput
              style={stiller.alan}
              value={ad}
              onChangeText={(d) => setAd(d.slice(0, AD_EN_FAZLA))}
              placeholder="Mekânın adı"
              testID="duzenle-ad"
            />

            <Text style={stiller.etiket}>Adres</Text>
            <TextInput
              style={[stiller.alan, stiller.cokSatirli]}
              value={adres}
              onChangeText={(d) => setAdres(d.slice(0, ADRES_EN_FAZLA))}
              placeholder="Cadde, sokak, numara"
              multiline
              testID="duzenle-adres"
            />

            <Text style={stiller.etiket}>Tür</Text>
            {/* TUR SERBEST METIN DEGIL: onay verildiginde deger dogrudan
                mekan kaydina yaziliyor ve butun suzgecleri besliyor.
                Liste suzgectekiyle AYNI kaynaktan (TEMEL_TUR_GRUPLARI) -
                iki yerde iki farkli tur listesi olmasin. */}
            {TEMEL_TUR_GRUPLARI.map((grup) => (
              <View key={grup.baslik} style={stiller.grup}>
                <Text style={stiller.grupBaslik}>{grup.baslik}</Text>
                <View style={stiller.cipler}>
                  {grup.turler.map((t) => (
                    <Pressable
                      key={t}
                      style={[stiller.cip, tur === t && stiller.cipSecili]}
                      onPress={() => setTur(t)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: tur === t }}
                    >
                      <Text style={[stiller.cipYazi, tur === t && stiller.cipYaziSecili]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <Text style={stiller.etiket}>Kapak fotoğrafı</Text>
            {yerelFoto ? (
              <View>
                <Image source={{ uri: yerelFoto }} style={stiller.onizleme} />
                <Pressable onPress={() => setYerelFoto(null)} testID="fotografi-kaldir">
                  <Text style={stiller.kaldirYazi}>Fotoğrafı kaldır</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={stiller.ikincil}
                onPress={() => setKaynakSecimi(true)}
                testID="fotograf-ekle"
              >
                <Text style={stiller.ikincilYazi}>Fotoğraf ekle</Text>
              </Pressable>
            )}

            {/* Dugme DEGISIKLIK YOKKEN de basilabilir kaliyor ve sebebini
                soyluyor: tamamen devre disi birakmak kisiyi "neden
                calismiyor" sorusuyla bas basa birakiyordu (ayni ders
                hesap olusturma ekraninda ogrenildi). */}
            <Pressable
              style={[stiller.birincil, !degisiklikVar && stiller.birincilSolu]}
              onPress={degisiklikVar ? gonder : () => setHata('Önce bir bilgiyi değiştir.')}
              testID="talebi-gonder"
              accessibilityRole="button"
            >
              <Text style={[stiller.birincilYazi, !degisiklikVar && stiller.birincilYaziSolu]}>
                {gonderiliyor ? 'Gönderiliyor…' : 'Talebi gönder'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <SecimPenceresi
        acikMi={kaynakSecimi}
        secimler={[
          { etiket: 'Fotoğraf çek', testID: 'foto-kamera', onSec: kameradanCek },
          { etiket: 'Galeriden seç', testID: 'foto-galeri', onSec: galeridenSec },
        ]}
        onKapat={() => setKaynakSecimi(false)}
      />
    </Pressable>
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
