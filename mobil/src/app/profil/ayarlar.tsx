import { useCallback, useState } from 'react'
import { View, Switch, ScrollView, StyleSheet, Text, Linking } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { verilerimiDisaAktar } from '../../../lib/veri-disa-aktar'
import {
  varsayilanBulunurluguGetir,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
  profilGizliGetir,
  profilGizliAyarla,
  etiketOnayiGerekliGetir,
  etiketOnayiGerekliAyarla,
} from '../../../lib/ayarlar'
import type { Bulunurluk } from '../../../lib/checkin'
import { hesabiDondur } from '../../../lib/hesap'
import { bildirimJetonunuSil } from '../../../lib/bildirim'
import { supabase } from '../../../lib/supabase'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Bolum, Satir } from '../../tasarim/Liste'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import {
  BelgeIkonu,
  IndirIkonu,
  EngelIkonu,
  KonumIkonu,
  GozIkonu,
  AramaIkonu,
  EtiketIkonu,
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
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)

  /*
   * VERILERIMI INDIR. Sunucu JSON'u uretiyor, istemci onu kovaya
   * yukleyip IMZALI BAGLANTIYI aciyor.
   *
   * CIFT DOKUNUS KORUNUYOR (`disaAktariliyor`): islem birkac saniye
   * surebiliyor ve ikinci dokunus ikinci bir dosya uretirdi.
   */
  async function verilerimiIndir() {
    if (disaAktariliyor) return
    setDisaAktariliyor(true)
    setDisaAktarimHatasi(false)
    try {
      const adres = await verilerimiDisaAktar()
      await Linking.openURL(adres)
    } catch {
      // Hata SATIRIN ALTINDA gosteriliyor: `Alert` react-native-web'de
      // sessizce hicbir sey yapmiyor ve uygulama tarayicidan da
      // aciliyor (ayni gerekce OnayPenceresi'nde de var).
      setDisaAktarimHatasi(true)
    } finally {
      setDisaAktariliyor(false)
    }
  }

  const { t } = useDil()
  const [varsayilanBulunurluk, setVarsayilanBulunurluk] = useState<Bulunurluk | null>(null)
  const [aramadaGorunsun, setAramadaGorunsun] = useState(true)
  const [profilGizli, setProfilGizli] = useState(false)
  const [etiketOnayi, setEtiketOnayi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [dondurmaOnayi, setDondurmaOnayi] = useState(false)
  const [disaAktariliyor, setDisaAktariliyor] = useState(false)
  const [disaAktarimHatasi, setDisaAktarimHatasi] = useState(false)

  const BULUNURLUK_ETIKETI: Record<Bulunurluk, string> = {
    herkese_acik: t('ayarlar.bulunurlukHerkeseAcik'),
    takipcilerim: t('ayarlar.bulunurlukTakipcilerim'),
    gizli: t('ayarlar.bulunurlukGizli'),
  }

  async function ayarlariYukle() {
    try {
      setVarsayilanBulunurluk(await varsayilanBulunurluguGetir())
      setAramadaGorunsun(await aramadaGorunsunGetir())
      setProfilGizli(await profilGizliGetir())
      setEtiketOnayi(await etiketOnayiGerekliGetir())
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

  /**
   * Iyimser guncelleme, HATADA GERI ALINIYOR: anahtar once yeni haline
   * geciyor (dokunusa aninda cevap), sunucu reddederse eski degerine
   * donuyor. Aksi halde ekran "gizli" gorunurken paylasimlar aslinda
   * herkese acik kalirdi - gizlilik ayarinda bu kabul edilemez.
   */
  async function profilGizliDegisti(deger: boolean) {
    const oncekiDeger = profilGizli
    setProfilGizli(deger)
    try {
      await profilGizliAyarla(deger)
      setHata(null)
    } catch (e) {
      setProfilGizli(oncekiDeger)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  /**
   * ETIKET ONAYI (kullanicinin karari 2026-09-06).
   *
   * Kapaliyken karsilikli arkadasin seni DIREK etiketliyor; aciksa
   * once sana soruluyor ve onaylayana kadar etiket kimseye
   * gorunmuyor.
   *
   * Digger gizlilik anahtarlarindaki desen: hata olursa ekran ESKI
   * degere doner. Ayar gizlilikle ilgili oldugu icin ekranin
   * sunucudan farkli bir sey gostermesi kabul edilemez.
   */
  async function etiketOnayiDegisti(deger: boolean) {
    const oncekiDeger = etiketOnayi
    setEtiketOnayi(deger)
    try {
      await etiketOnayiGerekliAyarla(deger)
      setHata(null)
    } catch (e) {
      setEtiketOnayi(oncekiDeger)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

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
          {/* "Profili duzenle" ve "Kullanici adi" satirlari
              KALDIRILDI (kullanicinin istegi 2026-09-11).

              ONCE KONTROL EDILDI - bir girisi kaldirmadan once o
              islemin baska girisi var mi:
                /profil/duzenle       -> VAR, profil ekranindaki
                                         "Profili düzenle" butonu.
                /profil/kullanici-adi -> tek giris buydu; ama islev
                                         kaybolmuyor, kullanici adi
                                         ayni gun profil duzenleme
                                         ekranina SATIR ICI tasindi.
                                         Ekran oksuz kaldigi icin
                                         SILINDI.
              Ayni kontrol 2026-09-03'te ATLANMIS ve `/profil/duzenle`
              bir sure ulasilamaz kalmisti. */}
          <Satir
            ikon={<BelgeIkonu />}
            etiket={t('ayarlar.gizlilikMetni')}
            onPress={() => router.push('/gizlilik')}
          />
          {/* VERILERIMI INDIR (KVKK m.11 erisim hakki, 2026-09-11).
              Gizlilik metninin hemen altinda: ikisi de "verim ne
              oluyor" sorusunun cevabi.

              Dosya bir KOVAYA yuklenip IMZALI BAGLANTI aciliyor.
              `expo-sharing` secilmedi: yeni bir native modul ve OTA
              ile gitmez; RN'in kendi dosya paylasimi da yalnizca
              iOS'ta calisiyor. Ayrinti `lib/veri-disa-aktar.ts`. */}
          <Satir
            ikon={<IndirIkonu />}
            etiket={
              disaAktariliyor
                ? t('ayarlar.verilerimiIndirHazirlaniyor')
                : t('ayarlar.verilerimiIndir')
            }
            aciklama={disaAktarimHatasi ? t('ayarlar.verilerimiIndirHata') : undefined}
            sonuncu
            onPress={verilerimiIndir}
          />
        </Bolum>

        <Bolum baslik={t('ayarlar.bolumGorunurluk')}>
          <Satir
            ikon={<KonumIkonu />}
            etiket={t('ayarlar.checkInGorunurlugu')}
            deger={varsayilanBulunurluk ? BULUNURLUK_ETIKETI[varsayilanBulunurluk] : undefined}
            onPress={() => router.push('/profil/check-in-gorunurlugu')}
          />
          {/* "Gecmis anilarim" satiri KALDIRILDI (kullanicinin karari
              2026-08-30). Ekran (`/profil/ani-gorunurlugu`) duruyor ama
              artik menuden erisilmiyor; ani gorunurlugu, check-in
              yapilirken secilen bulunurlugun aniya donusmesiyle
              belirleniyor. */}
          {/* PROFIL GIZLILIGI (kullanicinin istegi 2026-09-02). Aramada
              gorunmenin USTUNDE duruyor: once "paylasimlarimi kim
              gorsun", sonra "beni aramada bulabilsinler mi". */}
          <Satir
            ikon={<GozIkonu />}
            etiket={t('ayarlar.profilGizli')}
            aciklama={t('ayarlar.profilGizliAciklama')}
            sagBilesen={
              <Switch
                accessibilityLabel={t('ayarlar.profilGizli')}
                value={profilGizli}
                onValueChange={profilGizliDegisti}
                trackColor={{ true: renk.turuncu, false: renk.cizgi }}
                thumbColor={renk.yuzey}
                {...({ activeThumbColor: renk.yuzey } as object)}
              />
            }
          />
          <Satir
            ikon={<EtiketIkonu />}
            etiket={t('ayarlar.etiketOnayi')}
            aciklama={t('ayarlar.etiketOnayiAciklama')}
            sagBilesen={
              <Switch
                accessibilityLabel={t('ayarlar.etiketOnayi')}
                value={etiketOnayi}
                onValueChange={etiketOnayiDegisti}
                trackColor={{ true: renk.turuncu, false: renk.cizgi }}
                thumbColor={renk.yuzey}
                {...({ activeThumbColor: renk.yuzey } as object)}
              />
            }
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

const stilleriYap = (renk: Renk) => StyleSheet.create({
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
    color: renk.yikici,
  },
  onayVazgec: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
})
