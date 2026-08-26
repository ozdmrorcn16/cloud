import { useCallback, useState } from 'react'
import { View, Switch, ScrollView, StyleSheet, Text } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import {
  varsayilanBulunurluguGetir,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
  kullaniciAdiDurumunuGetir,
} from '../../../lib/ayarlar'
import type { Bulunurluk } from '../../../lib/checkin'
import { hesabiDondur } from '../../../lib/hesap'
import { bildirimJetonunuSil } from '../../../lib/bildirim'
import { supabase } from '../../../lib/supabase'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Bolum, Satir } from '../../tasarim/Liste'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import {
  KisiIkonu,
  BelgeIkonu,
  EngelIkonu,
  KonumIkonu,
  GozIkonu,
  AramaIkonu,
  DurdurIkonu,
  CopIkonu,
  CikisIkonu,
} from '../../tasarim/ayar-ikonlari'

/**
 * Ayarlar.
 *
 * Kullanicinin karari (2026-08-25): duzen Instagram ayarlarindaki gibi
 * gruplanmis satirlar olsun. Onceki hali serbest yerlesimli dugmeler
 * yiginiydi; kullanici adi girdisi, gorunurluk cipleri ve hesap
 * eylemleri ayni duzlemde duruyordu.
 *
 * Deger secen iki ayar (check-in gorunurlugu ve ani gorunurlugu) kendi
 * ekranlarina tasindi. Sebep yalnizca duzen degil: ikisinin de bir
 * aciklamasi var ve o aciklama satir icinde okunmuyordu. Kullanici adi
 * da ayri bir ekrana gitti - metin girdisi olan bir alan, liste
 * satirinin icinde durmamali (klavye acilinca liste kayiyor).
 */
export default function AyarlarEkrani() {
  const { t } = useDil()
  const [varsayilanBulunurluk, setVarsayilanBulunurluk] = useState<Bulunurluk | null>(null)
  const [aramadaGorunsun, setAramadaGorunsun] = useState(true)
  const [kullaniciAdi, setKullaniciAdi] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [dondurmaOnayi, setDondurmaOnayi] = useState(false)

  const BULUNURLUK_ETIKETI: Record<Bulunurluk, string> = {
    herkese_acik: t('ayarlar.bulunurlukHerkeseAcik'),
    takipcilerim: t('ayarlar.bulunurlukTakipcilerim'),
    gizli: t('ayarlar.bulunurlukGizli'),
  }

  async function ayarlariYukle() {
    try {
      setVarsayilanBulunurluk(await varsayilanBulunurluguGetir())
      setAramadaGorunsun(await aramadaGorunsunGetir())
      setKullaniciAdi((await kullaniciAdiDurumunuGetir()).kullaniciAdi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // Alt ekranlardan (kullanici adi, gorunurluk) donunce satirdaki deger
  // guncel olmali; useEffect yalnizca ilk acilista cekerdi.
  useFocusEffect(
    useCallback(() => {
      ayarlariYukle()
    }, [])
  )

  async function aramadaGorunsunDegisti(deger: boolean) {
    const oncekiDeger = aramadaGorunsun
    setAramadaGorunsun(deger)
    try {
      await aramadaGorunsunAyarla(deger)
      setHata(null)
    } catch (e) {
      setAramadaGorunsun(oncekiDeger)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function hesabiDondurmayiOnayla() {
    try {
      await hesabiDondur()
      // Dondurmadan hemen sonra cikis: aksi halde kullanici dondurulmus
      // ama girisli bir ara durumda kalirdi (spec karar 66).
      await supabase.auth.signOut()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setDondurmaOnayi(false)
    }
  }

  async function cikisYap() {
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

        <Bolum baslik={t('ayarlar.bolumHesap')}>
          <Satir
            ikon={<KisiIkonu />}
            etiket={t('ayarlar.profiliDuzenle')}
            onPress={() => router.push('/profil/duzenle')}
          />
          <Satir
            ikon={<KisiIkonu />}
            etiket={t('ayarlar.kullaniciAdi')}
            deger={kullaniciAdi ? `@${kullaniciAdi}` : undefined}
            onPress={() => router.push('/profil/kullanici-adi')}
          />
          <Satir
            ikon={<BelgeIkonu />}
            etiket={t('ayarlar.gizlilikMetni')}
            sonuncu
            onPress={() => router.push('/gizlilik')}
          />
        </Bolum>

        <Bolum baslik={t('ayarlar.bolumGorunurluk')}>
          <Satir
            ikon={<KonumIkonu />}
            etiket={t('ayarlar.checkInGorunurlugu')}
            deger={varsayilanBulunurluk ? BULUNURLUK_ETIKETI[varsayilanBulunurluk] : undefined}
            onPress={() => router.push('/profil/check-in-gorunurlugu')}
          />
          <Satir
            ikon={<GozIkonu />}
            etiket={t('ayarlar.aniGorunurlugu')}
            onPress={() => router.push('/profil/ani-gorunurlugu')}
          />
          <Satir
            ikon={<AramaIkonu />}
            etiket={t('ayarlar.aramadaGorun')}
            sonuncu
            sagBilesen={
              <Switch
                accessibilityLabel={t('ayarlar.aramadaGorunEtiket')}
                value={aramadaGorunsun}
                onValueChange={aramadaGorunsunDegisti}
                trackColor={{ true: renk.turuncu, false: renk.cizgi }}
                // Web'de varsayilan dugme YESIL geliyor ve kimlikte yesil
                // yok. `thumbColor` react-native-web'de karsiligi olmayan
                // bir prop; RNW kendi `activeThumbColor`ini bekliyor, o da
                // RN'in tip tanimlarinda olmadigi icin ayri geciliyor.
                thumbColor={renk.yuzey}
                {...({ activeThumbColor: renk.yuzey } as object)}
              />
            }
          />
        </Bolum>

        <Bolum baslik={t('ayarlar.bolumKisiler')}>
          {/* Engelleme bu satir eklenmeden once TEK YONLU bir kapiydi:
              engelleyebiliyordun ama kimi engelledigini goremiyor, geri
              de alamiyordun (kullanicinin istegi, 2026-08-25). */}
          <Satir
            ikon={<EngelIkonu />}
            etiket={t('ayarlar.engellenenler')}
            sonuncu
            onPress={() => router.push('/profil/engellenenler')}
          />
        </Bolum>

        <Bolum baslik={t('ayarlar.bolumHesapIslemleri')}>
          <Satir
            ikon={<DurdurIkonu />}
            etiket={t('ayarlar.dondur')}
            okYok
            onPress={() => setDondurmaOnayi(true)}
          />
          {dondurmaOnayi && (
            <View style={stiller.onay}>
              <Text style={stiller.onayMetni}>{t('ayarlar.dondurAciklama')}</Text>
              <View style={stiller.onayButonlari}>
                <Text
                  style={stiller.onayEvet}
                  accessibilityRole="button"
                  onPress={hesabiDondurmayiOnayla}
                >
                  {t('ayarlar.dondurEvet')}
                </Text>
                <Text
                  style={stiller.onayVazgec}
                  accessibilityRole="button"
                  onPress={() => setDondurmaOnayi(false)}
                >
                  {t('ayarlar.vazgec')}
                </Text>
              </View>
            </View>
          )}
          <Satir
            ikon={<CopIkonu />}
            etiket={t('ayarlar.hesabiSil')}
            tehlikeli
            onPress={() => router.push('/profil/hesabi-sil')}
          />
          <Satir
            ikon={<CikisIkonu />}
            etiket={t('ayarlar.cikisYap')}
            sonuncu
            okYok
            onPress={cikisYap}
          />
        </Bolum>
      </ScrollView>

    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.m,
  },

  onay: {
    paddingHorizontal: bosluk.l,
    paddingBottom: bosluk.l,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  onayMetni: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
  },
  onayButonlari: { flexDirection: 'row', gap: bosluk.xl, marginTop: bosluk.m },
  onayEvet: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },
  onayVazgec: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
})
