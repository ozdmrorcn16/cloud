import { useState, type ReactNode } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sikayetGonder, SIKAYET_SEBEPLERI, type SikayetHedefTuru } from '../../lib/sikayet'
import { engelle } from '../../lib/engelleme'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { GeriOkIkonu } from '../tasarim/mekan-ikonlari'
import { OnayPenceresi } from '../tasarim/OnayPenceresi'
import {
  KalkanIkonu,
  KalkanTikIkonu,
  TacizIkonu,
  UygunsuzIcerikIkonu,
  SahteHesapIkonu,
  SpamIkonu,
  DigerIkonu,
  EngelleKisiIkonu,
  KapatIkonu,
} from '../tasarim/sikayet-ikonlari'
import { useDil } from '../../lib/dil'

/** Ek aciklama en fazla bu kadar karakter (referanstaki "0/500"). */
const ACIKLAMA_EN_FAZLA = 500

/**
 * SIKAYET AKISI - kullanicinin referans gorseli birebir (2026-09-18:
 * "Sikayet et'e basinca gelecek ekran ve sikayeti gondere basilinca
 * gelecek ekran; bu iki ekranin aynisini yap, hicbir seyi degistirme").
 *
 * 01 / Sikayet olustur: ortali baslik, kalkan rozeti, "Bize ne oldugunu
 *   anlat", tek kartta bes sebep (ikon + etiket + radyo; secili satir
 *   seftali zemin), "Ek aciklama / Istege bagli", 0/500 sayacli kutu,
 *   ipucu, "Sikayeti gonder".
 * 02 / Gonderim sonrasi: sag ustte x, buyuk kalkan-tik rozeti,
 *   "Sikayetin alindi", tesekkur, "Bu hesabi engellemek ister misin?"
 *   karti (cerceveli "Hesabi engelle"), altta "Tamam".
 *
 * Engelleme karti yalnizca engellenecek bir HESAP biliniyorsa cizilir:
 * kullanici sikayetinde hedefin kendisi, mesaj sikayetinde sohbet
 * ekraninin gonderdigi `kullaniciId` parametresi. Engelleme onay
 * penceresinden gecer (profildeki akisla ayni metinler).
 *
 * Sayfa zemini BEYAZ (2026-08-27 karari: karsilama disinda her ekran
 * beyaz); referanstaki krem ton kanvasin kendisi.
 */
export default function SikayetEkrani() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const { hedefTur, hedefId, kullaniciId } = useLocalSearchParams<{
    hedefTur: SikayetHedefTuru
    hedefId: string
    kullaniciId?: string
  }>()
  const [secilenSebep, setSecilenSebep] = useState<string | null>(null)
  const [aciklama, setAciklama] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)
  const [engelleOnayi, setEngelleOnayi] = useState(false)
  const [engellendi, setEngellendi] = useState(false)

  // Engellenecek hesap: kullanici sikayetinde hedef, mesaj sikayetinde
  // sohbetten gelen kisi. Bilinmiyorsa kart hic cizilmez.
  const engellenecekId = hedefTur === 'kullanici' ? hedefId : kullaniciId ?? null

  async function gonder() {
    if (!secilenSebep) {
      setHata(t('sikayet.sebepSec'))
      return
    }
    setHata(null)
    setGonderiliyor(true)
    try {
      await sikayetGonder(hedefTur, hedefId, secilenSebep, aciklama.trim() || undefined)
      setGonderildi(true)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setGonderiliyor(false)
    }
  }

  async function hesabiEngelle() {
    if (!engellenecekId) return
    try {
      await engelle(engellenecekId)
      setEngellendi(true)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setEngelleOnayi(false)
    }
  }

  // ---------------------------------------------------------------
  // 02 / Gonderim sonrasi
  // ---------------------------------------------------------------
  if (gonderildi) {
    return (
      <View style={[stiller.kok, { paddingTop: guvenliAlan.top + bosluk.m }]}>
        <View style={stiller.kapatSatiri}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('ortak.kapat')}
            hitSlop={12}
            testID="sikayet-kapat"
          >
            <KapatIkonu />
          </Pressable>
        </View>

        {/* KAYDIRMASIZ (kullanicinin istegi 2026-09-18): rozet, metin ve
            kart dikeyde ortalanir; Tamam altta, gezinme cubugunun ustunde. */}
        <View style={stiller.teyitIcerik}>
          <View style={stiller.buyukRozet}>
            <KalkanTikIkonu boyut={84} />
          </View>
          <Text style={stiller.teyitBaslik}>{t('sikayet.alindi')}</Text>
          <Text style={stiller.teyitMetni}>{t('sikayet.tesekkur')}</Text>

          {engellenecekId && (
            <View style={stiller.engelKarti} testID="engelleme-karti">
              <View style={stiller.engelUst}>
                <View style={stiller.engelIkonDairesi}>
                  <EngelleKisiIkonu boyut={34} />
                </View>
                <View style={stiller.engelMetinler}>
                  <Text style={stiller.engelBaslik}>{t('sikayet.engelleSoru')}</Text>
                  <Text style={stiller.engelAciklama}>{t('sikayet.engelleAciklama')}</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  stiller.cerceveliButon,
                  engellendi && stiller.cerceveliButonPasif,
                  pressed && !engellendi && stiller.cerceveliButonBasili,
                ]}
                onPress={() => setEngelleOnayi(true)}
                disabled={engellendi}
                accessibilityRole="button"
                testID="hesabi-engelle"
              >
                <Text style={[stiller.cerceveliButonYazi, engellendi && stiller.cerceveliButonYaziPasif]}>
                  {engellendi ? t('sikayet.engellendi') : t('sikayet.hesabiEngelle')}
                </Text>
              </Pressable>
            </View>
          )}

          {hata && <Text style={stiller.hata}>{hata}</Text>}
        </View>

        <View style={[stiller.altButonAlani, { paddingBottom: ALT_GEZINME_PAYI }]}>
          <Pressable
            style={({ pressed }) => [stiller.birincil, stiller.birincilTeyit, pressed && stiller.birincilBasili]}
            onPress={() => router.back()}
            accessibilityRole="button"
            testID="sikayet-tamam"
          >
            <Text style={stiller.birincilYazi}>{t('sikayet.tamam')}</Text>
          </Pressable>
        </View>

        <OnayPenceresi
          acikMi={engelleOnayi}
          baslik={t('kullanici.engelle')}
          aciklama={t('kullanici.engelleOnayi')}
          eylemEtiketi={t('kullanici.engelleEvet')}
          onOnay={hesabiEngelle}
          onVazgec={() => setEngelleOnayi(false)}
        />
      </View>
    )
  }

  // ---------------------------------------------------------------
  // 01 / Sikayet olustur
  // ---------------------------------------------------------------
  const sebepIkonlari: Record<string, (secili: boolean) => ReactNode> = {
    taciz: (s) => <TacizIkonu renk={s ? renk.turuncu : renk.metin} />,
    uygunsuz_icerik: (s) => <UygunsuzIcerikIkonu renk={s ? renk.turuncu : renk.metin} />,
    sahte_hesap: (s) => <SahteHesapIkonu renk={s ? renk.turuncu : renk.metin} />,
    spam: (s) => <SpamIkonu renk={s ? renk.turuncu : renk.metin} />,
    diger: (s) => <DigerIkonu renk={s ? renk.turuncu : renk.metin} />,
  }

  return (
    <View style={[stiller.kok, { paddingTop: guvenliAlan.top + bosluk.m }]}>
      {/* UST CUBUK: geri oku solda, baslik ORTADA (referans). Ortak
          UstCubuk basligi sola yaslar; burada referans birebir. */}
      <View style={stiller.ustCubuk}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('ortak.geri')}
          hitSlop={12}
          style={stiller.geriDugmesi}
        >
          <GeriOkIkonu />
        </Pressable>
        <Text style={stiller.ustBaslik} accessibilityRole="header" numberOfLines={1}>
          {t('sikayet.baslik')}
        </Text>
      </View>

      {/* KAYDIRMASIZ (kullanicinin istegi 2026-09-18: "asagi kaydirmaya
          gerek kalmadan oldugu alana sigdir"): ScrollView yok; dikey
          boslular sikilastirildi, aciklama kutusu kalan yeri dolduruyor
          (flex), dugme en altta gezinme cubugunun ustunde. */}
      <View style={stiller.icerik}>
        <View style={stiller.rozet}>
          <KalkanIkonu boyut={28} />
        </View>
        <Text style={stiller.kahramanBaslik}>{t('sikayet.kahramanBaslik')}</Text>
        <Text style={stiller.kahramanAlt}>
          {hedefTur === 'mesaj' ? t('sikayet.altBaslikMesaj') : t('sikayet.altBaslikHesap')}
        </Text>
        {/* Karar 76: kademe 1 baglami sikayet edenin kendi konusmasindan
            da mesaj tasir, bu yuzden bildirilir. Ayri bir onay kutusu YOK -
            sikayeti gondermek zaten iradi bir eylem ve ek surtunme sikayet
            etmeyi caydirir. */}
        {hedefTur === 'mesaj' && (
          <Text style={stiller.baglamBildirimi}>{t('sikayet.mesajBaglami')}</Text>
        )}

        <View style={stiller.sebepKarti}>
          {SIKAYET_SEBEPLERI.map((sebep, sira) => {
            const secili = secilenSebep === sebep.anahtar
            return (
              <Pressable
                key={sebep.anahtar}
                style={[
                  stiller.sebepSatiri,
                  sira < SIKAYET_SEBEPLERI.length - 1 && stiller.sebepSatiriAyirici,
                  secili && stiller.sebepSatiriSecili,
                ]}
                onPress={() => {
                  setSecilenSebep(sebep.anahtar)
                  setHata(null)
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: secili }}
                testID={`sebep-${sebep.anahtar}`}
              >
                <View style={stiller.sebepIkon}>
                  {(sebepIkonlari[sebep.anahtar] ?? sebepIkonlari.diger)(secili)}
                </View>
                <Text style={stiller.sebepYazi}>{t(`sikayet.sebepler.${sebep.anahtar}`)}</Text>
                <View style={[stiller.radyo, secili && stiller.radyoSecili]}>
                  {secili && <View style={stiller.radyoIc} />}
                </View>
              </Pressable>
            )
          })}
        </View>

        <View style={stiller.etiketSatiri}>
          <Text style={stiller.etiket}>{t('sikayet.ekAciklama')}</Text>
          <Text style={stiller.istegeBagli}>{t('sikayet.istegeBagli')}</Text>
        </View>
        <View style={stiller.girdiKabi}>
          <TextInput
            style={stiller.girdi}
            placeholder={t('sikayet.aciklamaYerTutucu')}
            placeholderTextColor={renk.metinSoluk}
            value={aciklama}
            onChangeText={setAciklama}
            multiline
            maxLength={ACIKLAMA_EN_FAZLA}
            textAlignVertical="top"
            testID="aciklama-girdisi"
          />
          <Text style={stiller.sayac} testID="aciklama-sayaci">
            {aciklama.length}/{ACIKLAMA_EN_FAZLA}
          </Text>
        </View>
        <Text style={stiller.ipucu}>{t('sikayet.aciklamaIpucu')}</Text>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <View style={stiller.esnekBosluk} />
        <Pressable
          style={({ pressed }) => [stiller.birincil, stiller.birincilAltta, pressed && stiller.birincilBasili]}
          onPress={gonder}
          disabled={gonderiliyor}
          accessibilityRole="button"
          testID="sikayeti-gonder"
        >
          <Text style={stiller.birincilYazi}>
            {gonderiliyor ? t('ortak.gonderiliyor') : t('sikayet.gonder')}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    flex: 1,
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  esnekBosluk: { flexGrow: 1, minHeight: bosluk.s },
  birincilAltta: { marginTop: bosluk.m },

  // Ust cubuk: ok solda, baslik mutlak konumla ortada.
  ustCubuk: {
    height: 44,
    justifyContent: 'center',
  },
  geriDugmesi: {
    position: 'absolute',
    left: bosluk.sayfa,
    top: 12,
    zIndex: 1,
  },
  ustBaslik: {
    textAlign: 'center',
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    marginHorizontal: bosluk.sayfa + 32,
  },

  // Kahraman: rozet + baslik + alt baslik, ortali.
  rozet: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: bosluk.xs,
    marginBottom: bosluk.m,
  },
  kahramanBaslik: {
    textAlign: 'center',
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik - 2,
    color: renk.metin,
    letterSpacing: -0.5,
  },
  kahramanAlt: {
    textAlign: 'center',
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
    marginBottom: bosluk.l,
  },
  baglamBildirimi: {
    textAlign: 'center',
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 18,
    color: renk.metinIkincil,
    marginTop: -bosluk.s,
    marginBottom: bosluk.l,
  },

  // Sebep karti: tek cerceve, satirlar ayirici cizgiyle.
  sebepKarti: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  sebepSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: 11,
    backgroundColor: renk.yuzey,
  },
  sebepSatiriAyirici: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  sebepSatiriSecili: { backgroundColor: renk.turuncuZemin },
  sebepIkon: { width: 28, alignItems: 'center' },
  sebepYazi: {
    flex: 1,
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde + 1,
    color: renk.metin,
  },
  // Radyo: bos halde ince gri halka; secili halde turuncu dolu, icinde
  // beyaz halka (referans).
  radyo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: renk.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radyoSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncu },
  radyoIc: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },

  // Ek aciklama.
  etiketSatiri: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: bosluk.l,
    marginBottom: bosluk.s,
  },
  etiket: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde + 1,
    color: renk.metin,
  },
  istegeBagli: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
  girdiKabi: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.yuzey,
    // Kalan dikey alani kutu dolduruyor; en az iki satir.
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 72,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.m,
    paddingBottom: 26,
  },
  girdi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 20,
    color: renk.metin,
    padding: 0,
  },
  sayac: {
    position: 'absolute',
    right: bosluk.l,
    bottom: bosluk.m,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    textAlign: 'center',
    marginTop: bosluk.s,
  },

  // Birincil dugme (iki ekranda da ayni).
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilBasili: { opacity: 0.92 },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 2,
    color: '#FFFFFF',
  },

  // 02 / Gonderim sonrasi
  kapatSatiri: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: bosluk.sayfa,
  },
  teyitIcerik: {
    flex: 1,
    paddingHorizontal: bosluk.sayfa,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: bosluk.m,
  },
  buyukRozet: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: bosluk.xl,
  },
  teyitBaslik: {
    textAlign: 'center',
    fontFamily: yazi.ekranBasligi,
    fontSize: 28,
    color: renk.metin,
    letterSpacing: -0.6,
    marginBottom: bosluk.s,
  },
  teyitMetni: {
    textAlign: 'center',
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },
  engelKarti: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.yuzey,
    padding: bosluk.l,
  },
  engelUst: { flexDirection: 'row', gap: bosluk.m, marginBottom: bosluk.m },
  engelIkonDairesi: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: renk.karsilamaZemini,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engelMetinler: { flex: 1 },
  engelBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde + 2,
    lineHeight: 23,
    color: renk.metin,
    marginBottom: bosluk.xs,
  },
  engelAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
  },
  cerceveliButon: {
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cerceveliButonBasili: { backgroundColor: renk.turuncuZemin },
  cerceveliButonPasif: { borderColor: renk.cizgi },
  cerceveliButonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 2,
    color: renk.turuncuYazi,
  },
  cerceveliButonYaziPasif: { color: renk.metinSoluk },
  altButonAlani: { paddingHorizontal: bosluk.sayfa },
  birincilTeyit: { marginTop: 0 },
})
