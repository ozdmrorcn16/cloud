import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDil } from '../../lib/dil'
import type { AkisOgesi } from '../../lib/akis'
import type { BagKisi } from '../../lib/bag'
import { EN_FAZLA_FOTOGRAF, NOT_EN_FAZLA } from '../../lib/checkin'
import { takipcilerimiGetir } from '../../lib/bag-listeleri'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { SURE, useModalHareketi } from './hareket'
import { Avatar } from './Avatar'
import { IgneIkonu } from './mekan-ikonlari'
import { KapatIkonu } from './sikayet-ikonlari'
import { IfadeSecici, IfadeCipi } from './IfadeSecici'
import { ArkadasSecici } from './ArkadasSecici'
import { FotografIzgarasiDuzenle, type FotografKaresi } from './FotografIzgarasiDuzenle'

/**
 * Duzenleme sayfasinin Kaydet'e verdigi paket. Ekran lib cagrilarini
 * yapar ve listeyi yerinde gunceller; sayfa hicbir sunucu cagrisi yapmaz.
 */
export type DuzenlemeDegisiklikleri = {
  not: string
  ifade: string | null
  /** null = fotograflara dokunulmadi. */
  fotograflar: { kalanYollar: string[]; yeniUriler: string[] } | null
  etiketEkle: string[]
  etiketKaldir: string[]
}

/**
 * "CHECK-IN'I DUZENLE" SAYFASI (kullanicinin referansi 2026-09-21,
 * tasarim/checkin-duzenle-referans.png). Alttan gelen sayfa: tutamac,
 * baslik + X, mekan karti (salt gosterim), Notun, Fotograflar (izgara),
 * Ifade (+ Degistir/Ekle), Birlikte (+ Ekle), "Degisiklikler
 * kaydedildiginde uygulanir.", Vazgec / Kaydet.
 *
 * 2026-09-05'in "yerinde duzenleme"si bu sayfayla KALKTI. Kural ayni:
 * Kaydet'e basilana kadar sunucuya hicbir sey gitmez; Vazgec (ve X)
 * taslagi atar. Kaydet basarisiz olursa sayfa acik kalir, hata
 * dugmenin ustunde gorunur, yazilanlar kaybolmaz.
 */
export function CheckInDuzenle({
  acikMi,
  oge,
  zamanYazisi,
  onKapat,
  onKaydet,
}: {
  acikMi: boolean
  oge: AkisOgesi | null
  zamanYazisi: string
  onKapat: () => void
  onKaydet: (degisiklikler: DuzenlemeDegisiklikleri) => Promise<void>
}) {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)

  const [not, setNot] = useState('')
  const [ifade, setIfade] = useState<string | null>(null)
  const [kareler, setKareler] = useState<FotografKaresi[]>([])
  const [fotografDokunuldu, setFotografDokunuldu] = useState(false)
  const [kaldirilan, setKaldirilan] = useState<string[]>([])
  const [eklenen, setEklenen] = useState<string[]>([])
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [ifadeSecici, setIfadeSecici] = useState(false)
  const [arkadasSecici, setArkadasSecici] = useState(false)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  // Taslak her ACILISTA ogeden yeniden kurulur: onceki duzenlemeden
  // kalan metin ya da secim tasinmamali. Bagimlilik oge'nin KIMLIGI,
  // nesnenin kendisi degil: profil ekrani ogeyi her render'da yeniden
  // uretiyor (anidanAkisOgesi); nesneye baglansaydi ekranin her
  // yeniden cizilisi yazilani silerdi.
  useEffect(() => {
    if (!acikMi || !oge) return
    setNot(oge.notMetni ?? '')
    setIfade(oge.ifade)
    setKareler(oge.fotograflar.map((yol, i) => ({ yol, uri: oge.fotografUrller[i] ?? '' })))
    setFotografDokunuldu(false)
    setKaldirilan([])
    setEklenen([])
    setHata(null)
    // Arkadas listesi yalnizca sayfa acilinca cekiliyor.
    takipcilerimiGetir()
      .then(setArkadaslar)
      .catch(() => setArkadaslar([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acikMi, oge?.id])

  if (!gorunur || !oge) return null
  const mevcut = oge

  const girisY = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [700, 0] })
  const gosterilenAd = mevcut.rumuz ?? mevcut.kullaniciAdi ?? ''
  const kalanEtiketler = mevcut.etiketler.filter((e) => !kaldirilan.includes(e.kullaniciId))

  async function kaydet() {
    setKaydediliyor(true)
    setHata(null)
    try {
      await onKaydet({
        not,
        ifade,
        fotograflar: fotografDokunuldu
          ? {
              kalanYollar: kareler.filter((k) => k.yol).map((k) => k.yol as string),
              yeniUriler: kareler.filter((k) => !k.yol).map((k) => k.uri),
            }
          : null,
        etiketEkle: eklenen,
        etiketKaldir: kaldirilan,
      })
      onKapat()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      {/* KLAVYE SAYFAYI ITMEZ (kullanicinin istegi 2026-09-22: "klavye
          acilinca Vazgec/Kaydet ustune gelmesin, asagida kalsin"):
          KeyboardAvoidingView yok; alt serit yerinde durur, klavye onu
          orter. Icerik klavye kadar kaydirilabilir
          (`automaticallyAdjustKeyboardInsets`) - yazilan satir gorunur
          kalir, dugmeler klavye kapaninca yine yerinde. */}
      <View style={stiller.zemin}>
        <Pressable style={stiller.disari} onPress={onKapat} accessibilityLabel={t('ortak.kapat')} />
        <Animated.View
          style={[
            stiller.sayfa,
            { paddingBottom: Math.max(guvenliAlan.bottom, bosluk.s) + bosluk.s, transform: [{ translateY: girisY }] },
          ]}
          testID="duzenle-sayfasi"
        >
          <View style={stiller.tutamac} />
          <View style={stiller.baslikSatiri}>
            <Text style={stiller.baslik} accessibilityRole="header">
              {t('checkIn.duzenleBaslik')}
            </Text>
            <Pressable
              onPress={onKapat}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('ortak.kapat')}
              testID="duzenle-kapat"
              disabled={kaydediliyor}
            >
              <KapatIkonu boyut={22} />
            </Pressable>
          </View>

          <ScrollView
            style={stiller.kaydirma}
            contentContainerStyle={stiller.icerik}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            {/* MEKAN KARTI: avatar, igne + mekan adi, kullanici adi · zaman. */}
            <View style={stiller.mekanKarti}>
              <Avatar fotografUrl={mevcut.avatarUrl} ad={mevcut.kullaniciAdi} kullaniciAdi={gosterilenAd} cap={60} />
              <View style={stiller.mekanMetinler}>
                <View style={stiller.mekanAdSatiri}>
                  <IgneIkonu boyut={18} />
                  <Text style={stiller.mekanAdi} numberOfLines={1}>
                    {mevcut.mekanAdi}
                  </Text>
                </View>
                <Text style={stiller.mekanAlt} numberOfLines={1}>
                  {gosterilenAd} · {zamanYazisi}
                </Text>
              </View>
            </View>

            {/* NOTUN */}
            <Text style={stiller.etiket}>{t('checkIn.notEtiket')}</Text>
            <TextInput
              testID="duzenle-not"
              style={stiller.notKutusu}
              value={not}
              onChangeText={(d) => setNot(d.slice(0, NOT_EN_FAZLA))}
              maxLength={NOT_EN_FAZLA}
              placeholder={t('checkIn.notYerTutucu')}
              placeholderTextColor={renk.metinSoluk}
              multiline
              editable={!kaydediliyor}
            />

            {/* FOTOGRAFLAR */}
            <Text style={stiller.etiket}>{t('checkIn.fotograflar')}</Text>
            <FotografIzgarasiDuzenle
              testID="duzenle-foto"
              kareler={kareler}
              pasif={kaydediliyor}
              onEklendi={(uriler) => {
                setFotografDokunuldu(true)
                setKareler((m) => [...m, ...uriler.map((uri) => ({ uri }))].slice(0, EN_FAZLA_FOTOGRAF))
              }}
              onDegistirildi={(i, uri) => {
                setFotografDokunuldu(true)
                setKareler((m) => m.map((k, j) => (j === i ? { uri } : k)))
              }}
              onKaldir={(i) => {
                setFotografDokunuldu(true)
                setKareler((m) => m.filter((_, j) => j !== i))
              }}
              onHata={setHata}
            />

            {/* IFADE: baslik + sagda Degistir/Ekle; altinda cip. */}
            <View style={stiller.bolumBaslik}>
              <Text style={stiller.etiketSatirIci}>{t('checkIn.ifade')}</Text>
              <Pressable
                onPress={() => setIfadeSecici(true)}
                hitSlop={8}
                accessibilityRole="button"
                testID="duzenle-ifade-degistir"
                disabled={kaydediliyor}
              >
                <Text style={stiller.baglanti}>{ifade ? t('checkIn.degistir') : t('checkIn.ekle')}</Text>
              </Pressable>
            </View>
            {ifade && (
              <View style={stiller.cipler}>
                <IfadeCipi slug={ifade} onPress={() => setIfadeSecici(true)} onKaldir={() => setIfade(null)} />
              </View>
            )}

            {/* BIRLIKTE: baslik + sagda "+ Ekle"; altinda kullanici adi cipleri. */}
            <View style={stiller.bolumBaslik}>
              <Text style={stiller.etiketSatirIci}>{t('checkIn.birlikte')}</Text>
              <Pressable
                onPress={() => setArkadasSecici(true)}
                hitSlop={8}
                accessibilityRole="button"
                testID="duzenle-birlikte-ekle"
                disabled={kaydediliyor}
              >
                <Text style={stiller.baglanti}>+ {t('checkIn.ekle')}</Text>
              </Pressable>
            </View>
            {(kalanEtiketler.length > 0 || eklenen.length > 0) && (
              <View style={stiller.cipler}>
                {kalanEtiketler.map((e) => (
                  <View key={e.kullaniciId} style={stiller.cip} testID={`duzenle-etiket-${e.kullaniciId}`}>
                    <Avatar fotografUrl={e.avatarUrl} ad={e.ad} kullaniciAdi={e.kullaniciAdi ?? e.ad ?? ''} cap={26} />
                    <Text style={stiller.cipYazi}>{e.kullaniciAdi ?? e.ad ?? ''}</Text>
                    <Pressable
                      onPress={() => setKaldirilan((m) => [...m, e.kullaniciId])}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('checkIn.etiketiKaldir', { ad: e.kullaniciAdi ?? e.ad ?? '' })}
                      testID={`duzenle-etiket-kaldir-${e.kullaniciId}`}
                      disabled={kaydediliyor}
                    >
                      <Text style={stiller.cipCarpi}>×</Text>
                    </Pressable>
                  </View>
                ))}
                {eklenen.map((id) => {
                  const kisi = arkadaslar.find((a) => a.id === id)
                  return (
                    <View key={id} style={stiller.cip} testID={`duzenle-etiket-${id}`}>
                      <Avatar fotografUrl={kisi?.avatarUrl ?? null} ad={kisi?.ad} kullaniciAdi={kisi?.kullaniciAdi ?? ''} cap={26} />
                      <Text style={stiller.cipYazi}>{kisi?.kullaniciAdi ?? ''}</Text>
                      <Pressable
                        onPress={() => setEklenen((m) => m.filter((x) => x !== id))}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={t('checkIn.etiketiKaldir', { ad: kisi?.kullaniciAdi ?? '' })}
                        testID={`duzenle-etiket-kaldir-${id}`}
                        disabled={kaydediliyor}
                      >
                        <Text style={stiller.cipCarpi}>×</Text>
                      </Pressable>
                    </View>
                  )
                })}
              </View>
            )}
          </ScrollView>

          <View style={stiller.altBolum}>
            <Text style={stiller.altNot}>{t('checkIn.kaydedinceUygulanir')}</Text>
            {hata && (
              <Text style={stiller.hata} testID="duzenle-hata">
                {hata}
              </Text>
            )}
            <View style={stiller.eylemler}>
              <Pressable
                testID="duzenle-vazgec"
                style={[stiller.dugme, stiller.ikincil]}
                onPress={onKapat}
                disabled={kaydediliyor}
                accessibilityRole="button"
              >
                <Text style={stiller.ikincilYazi}>{t('ortak.vazgec')}</Text>
              </Pressable>
              <Pressable
                testID="duzenle-kaydet"
                style={[stiller.dugme, stiller.birincil, kaydediliyor && stiller.basili]}
                onPress={kaydet}
                disabled={kaydediliyor}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilYazi}>{t('ortak.kaydet')}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      <IfadeSecici acikMi={ifadeSecici} secili={ifade} onSec={setIfade} onKapat={() => setIfadeSecici(false)} />
      {/* Zaten etiketli olanlar (kaldirilmadiysa) listede yok. */}
      <ArkadasSecici
        acikMi={arkadasSecici}
        arkadaslar={arkadaslar.filter((a) => !kalanEtiketler.some((e) => e.kullaniciId === a.id))}
        secili={eklenen}
        onDegistir={(id) => setEklenen((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))}
        onKapat={() => setArkadasSecici(false)}
      />
    </Modal>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zeminRenk: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23, 19, 15, 0.45)' },
    zemin: { flex: 1, justifyContent: 'flex-end' },
    disari: { flex: 1 },
    sayfa: {
      backgroundColor: renk.yuzey,
      borderTopLeftRadius: yuvarlak.buyuk,
      borderTopRightRadius: yuvarlak.buyuk,
      paddingTop: bosluk.s,
      paddingHorizontal: bosluk.m,
      maxHeight: '92%',
    },
    tutamac: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: renk.cizgi, marginBottom: bosluk.m },
    baslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: bosluk.m, marginHorizontal: bosluk.xs },
    baslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.altBaslik + 2, letterSpacing: -0.3, color: renk.metin },
    kaydirma: { flexShrink: 1 },
    icerik: { paddingHorizontal: bosluk.xs, paddingBottom: bosluk.m },
    // Mekan karti: cerceveli, seftali zeminsiz (referans: acik gri kart).
    mekanKarti: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.m,
      padding: bosluk.m,
      borderRadius: yuvarlak.kart,
      borderWidth: 1,
      borderColor: renk.cizgi,
      backgroundColor: renk.karsilamaZemini,
      marginBottom: bosluk.l,
    },
    mekanMetinler: { flex: 1, gap: 4 },
    mekanAdSatiri: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    mekanAdi: { flex: 1, fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
    mekanAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk + 1, color: renk.metinIkincil, marginLeft: 24 },
    etiket: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metin, marginBottom: bosluk.s },
    etiketSatirIci: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metin },
    notKutusu: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: renk.cizgi,
      borderRadius: yuvarlak.kart,
      padding: bosluk.m,
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      color: renk.metin,
      textAlignVertical: 'top',
      backgroundColor: renk.yuzey,
      marginBottom: bosluk.l,
    },
    bolumBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: bosluk.l, marginBottom: bosluk.s },
    baglanti: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi },
    cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s },
    cip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.s,
      paddingVertical: 8,
      paddingLeft: 8,
      paddingRight: bosluk.m,
      borderRadius: yuvarlak.kart,
      borderWidth: 1,
      borderColor: renk.cizgi,
      backgroundColor: renk.yuzey,
    },
    cipYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: renk.metin },
    cipCarpi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin, marginLeft: 4 },
    altBolum: { borderTopWidth: 1, borderTopColor: renk.cizgi, paddingTop: bosluk.m, marginTop: bosluk.s },
    altNot: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinSoluk, textAlign: 'center', marginBottom: bosluk.m },
    hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, textAlign: 'center', marginBottom: bosluk.s },
    eylemler: { flexDirection: 'row', gap: bosluk.m },
    dugme: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: yuvarlak.kart },
    ikincil: { borderWidth: 1, borderColor: renk.cizgi, backgroundColor: renk.yuzey },
    ikincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metin },
    birincil: { flex: 1.4, backgroundColor: renk.turuncu },
    birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: '#FFFFFF' },
    basili: { opacity: 0.7 },
  })
