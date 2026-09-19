import { useCallback, useState } from 'react'
import { View, ScrollView, StyleSheet, Text } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { profilGizliGetir } from '../../../lib/ayarlar'
import { bildirimJetonunuSil } from '../../../lib/bildirim'
import { supabase } from '../../../lib/supabase'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Bolum, Satir } from '../../tasarim/Liste'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { AnahtarIkonu, KalkanTikCizgiIkonu } from '../../tasarim/hesap-ikonlari'
import { ZilIkonu } from '../../tasarim/zil-ikonu'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { KonumIkonu } from '../../tasarim/ayar-ikonlari'
import { GunesAyIkonu, SoruIkonu, BilgiIkonu, KisiDisliIkonu } from '../../tasarim/uygulama-ikonlari'
import { CikisIkonu } from '../../tasarim/ayar-ikonlari'

/**
 * Ayarlar - YALNIZCA YONLENDIRME EKRANI (kullanicinin referans
 * gorselleri 2026-09-18/19). Her satir kendi alt ekranina gider; hicbir
 * anahtar ya da eylem burada durmuyor (Cikis yap haric). Dort bolum:
 *
 *   Hesabin                -> Hesap ve guvenlik
 *   Gizlilik ve etkilesim  -> Gizlilik / Konum ve check-in / Bildirimler
 *   Uygulama               -> Gorunum / Yardim merkezi / Slooin hakkinda
 *   Hesap islemleri        -> Hesap yonetimi (dondur, sil, verilerimi
 *                             indir) / Cikis yap (seftali satir)
 *
 * Onceki "Gizlilik metni" ve "Verilerimi indir" duz baglantilari KALKTI:
 * gizlilik metni "Slooin hakkinda"da, veri indirme "Hesap yonetimi"nde.
 * Kullanicinin karari (2026-08-25): Instagram ayarlari gibi gruplu
 * satirlar.
 */
export default function AyarlarEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  // Gizlilik satirinin sagindaki deger ("Herkese acik" / "Sadece
  // arkadaslar"); anahtarlarin kendisi Gizlilik ekraninda (2026-09-18).
  const [profilGizli, setProfilGizli] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  // Cikis ONAYLA calisir (kullanicinin istegi 2026-09-19: "hemen cikis
  // yapmasin, once sorsun"). Yikici degil - geri giris her zaman mumkun.
  const [cikisOnayi, setCikisOnayi] = useState(false)

  async function ayarlariYukle() {
    try {
      setProfilGizli(await profilGizliGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // Alt ekranlardan donunce satirdaki deger guncel olmali; useEffect
  // yalnizca ilk acilista cekerdi.
  useFocusEffect(
    useCallback(() => {
      ayarlariYukle()
    }, [])
  )

  async function cikisYap() {
    setCikisOnayi(false)
    // Cikistan once bu cihazin push jetonunu sil ki bir sonraki
    // kullaniciya ait bildirimler bu cihaza dusmesin.
    await bildirimJetonunuSil()
    await supabase.auth.signOut()
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('ayarlar.baslik')} geriEtiketi={t('ayarlar.geri')} />

      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {/* HESAP VE GUVENLIK - EN USTTE (kullanicinin istegi 2026-09-18). */}
        <Bolum baslik={t('hesapGuvenlik.bolumHesabin')}>
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <AnahtarIkonu />
              </View>
            }
            etiket={t('hesapGuvenlik.satirBaslik')}
            aciklama={t('hesapGuvenlik.satirAciklama')}
            sonuncu
            onPress={() => router.push('/profil/hesap-guvenlik')}
          />
        </Bolum>

        {/* GIZLILIK VE ETKILESIM (2026-09-18): uc satir, her biri kendi
            ekranina. Profil gorunurlugu satiri mevcut degeri gosterir. */}
        <Bolum baslik={t('gizlilikEtkilesim.bolum')}>
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <KalkanTikCizgiIkonu />
              </View>
            }
            etiket={t('gizlilikEtkilesim.gizlilik')}
            aciklama={t('gizlilikEtkilesim.gizlilikAciklama')}
            deger={profilGizli ? t('gizlilikEtkilesim.sadeceArkadaslar') : t('gizlilikEtkilesim.herkeseAcik')}
            onPress={() => router.push('/profil/gizlilik-ayarlari')}
          />
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <KonumIkonu />
              </View>
            }
            etiket={t('gizlilikEtkilesim.konum')}
            aciklama={t('gizlilikEtkilesim.konumAciklama')}
            onPress={() => router.push('/profil/konum-checkin')}
          />
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <ZilIkonu />
              </View>
            }
            etiket={t('gizlilikEtkilesim.bildirimler')}
            aciklama={t('gizlilikEtkilesim.bildirimlerAciklama')}
            sonuncu
            onPress={() => router.push('/profil/bildirim-ayarlari')}
          />
        </Bolum>

        {/* UYGULAMA (kullanicinin istegi 2026-09-19, uc referans gorsel):
            Gorunum (tema), Yardim merkezi (SSS + sorun bildir), Slooin
            hakkinda (topluluk kurallari + hukuki metinler). */}
        <Bolum baslik={t('uygulama.bolum')}>
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <GunesAyIkonu />
              </View>
            }
            etiket={t('uygulama.gorunum')}
            aciklama={t('uygulama.gorunumAciklama')}
            onPress={() => router.push('/profil/gorunum')}
          />
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <SoruIkonu />
              </View>
            }
            etiket={t('uygulama.yardim')}
            aciklama={t('uygulama.yardimAciklama')}
            onPress={() => router.push('/profil/yardim')}
          />
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <BilgiIkonu />
              </View>
            }
            etiket={t('uygulama.hakkinda')}
            aciklama={t('uygulama.hakkindaAciklama')}
            sonuncu
            onPress={() => router.push('/profil/hakkinda')}
          />
        </Bolum>

        {/* HESAP ISLEMLERI (referans 2026-09-19): Hesap yonetimi satiri
            (dondurma, silme, veri indirme oraya tasindi) ve seftali
            zeminli "Cikis yap" - ikon kutusuz, turuncu cikis oku. */}
        <Bolum baslik={t('hesapYonetimi.bolum')}>
          <Satir
            ikon={
              <View style={stiller.ikonKutusu}>
                <KisiDisliIkonu />
              </View>
            }
            etiket={t('hesapYonetimi.satirBaslik')}
            aciklama={t('hesapYonetimi.satirAciklama')}
            onPress={() => router.push('/profil/hesap-yonetimi')}
          />
          <Satir
            ikon={
              <View style={stiller.cikisIkonu}>
                <CikisIkonu renk={renk.turuncu} />
              </View>
            }
            etiket={t('ayarlar.cikisYap')}
            sonuncu
            vurgulu
            onPress={() => setCikisOnayi(true)}
          />
        </Bolum>
      </ScrollView>

      <OnayPenceresi
        acikMi={cikisOnayi}
        baslik={t('ayarlar.cikisOnayBaslik')}
        aciklama={t('ayarlar.cikisOnayAciklama')}
        eylemEtiketi={t('ayarlar.cikisYap')}
        yikici={false}
        onOnay={cikisYap}
        onVazgec={() => setCikisOnayi(false)}
      />
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  ikonKutusu: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Cikis satirinin ikonu kutusuz ama digerleriyle ayni hizada dursun
  // diye ayni genislikte bos kap.
  cikisIkonu: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginTop: bosluk.m,
  },
})
