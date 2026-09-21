import { useState } from 'react'
import { View, Text, Image, Modal, Pressable, StyleSheet, TextInput } from 'react-native'
import { Image as HizliImage } from 'expo-image'
import { useRouter } from 'expo-router'
import type { AkisOgesi } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { suAnBuradaMi } from '../../lib/zaman'
import { bulunmaEki } from '../../lib/bulunma-eki'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { OnayPenceresi } from './OnayPenceresi'
import { SecimPenceresi, UcNoktaIkonu, KalemIkonu, CopIkonu } from './SecimPenceresi'
import { YorumSayfasi } from './YorumSayfasi'
import { NOT_EN_FAZLA } from '../../lib/checkin'
import { takipcilerimiGetir } from '../../lib/bag-listeleri'
import type { BagKisi } from '../../lib/bag'
import { YorumIkonu, PaylasIkonu } from './etkilesim-ikonlari'
import { BegeniKalbi } from './BegeniKalbi'
import type { EtkilesimOzeti } from '../../lib/etkilesim'
import {
  YakinlastirilabilirGorsel,
  YakinlastirilabilirTamEkran,
} from './YakinlastirilabilirGorsel'
import { FotografAltyazisi } from './FotografAltyazisi'
import { Avatar } from './Avatar'
import { ArkadasSecici } from './ArkadasSecici'
import Svg, { Path, Circle } from 'react-native-svg'

/**
 * CHECK-IN KARTI - ana sayfada, profildeki anilarda ve Anilarim
 * ekraninda AYNI kart.
 *
 * Kullanicinin karari (2026-08-30, Anilarim ekraninin goruntusunu
 * gonderip): "Ayni bu gorunus: kullanici adi - check-in ismi, not
 * varsa yaninda not, fotograf varsa altina; ana sayfa akisinda ve
 * profil akisinda da bu gorunus olacak; mekan ismi turuncu ve
 * tiklanabilir." Zaman tuneli deseni (AniTuneli) bu kararla KALDIRILDI.
 *
 * Duzen: [profil resmi] KULLANICI ADI - MEKAN ADI (turuncu) - etiketlenenler
 *                       not
 *                       fotograf
 *        sagda gorece zaman ("7 saat önce") ya da "şu an burada"
 *
 * Kartta "byorcun" gibi KULLANICI ADI yazar, ad-soyad DEGIL
 * (kullanicinin karari 2026-08-30); bildirimlerde ise ad-soyad.
 *
 * Ad, mekan ve etiketler TEK metin akisinda: ayri View'lara bolununce
 * uzun mekan adlari satiri tasiriyordu. Ic ice `Text` ile parcalar
 * satir sonunda birlikte kiriliyor ve her parcanin kendi dokunma
 * hedefi kaliyor.
 *
 * TAM ZAMAN KALDIRILDI (2026-09-07): sagdaki gorece zamanla ayni bilgiyi
 * iki ayri bicimde tekrarliyordu. Tam tarih mekan sayfasinda duruyor.
 * Denetimden gelen degisikliklerden KORUNAN tek sey bu.
 */

export function CheckInKarti({
  oge,
  zamanYazisi,
  ozet,
  onBegen,
  onYorum,
  onYorumSayisi,
  onPaylas,
  silOnayiAcik = false,
  onSilOnayi,
  onSil,
  onNotKaydet,
  onEtiketEkle,
  onEtiketKaldir,
  onFotografAc,
}: {
  oge: AkisOgesi
  /** "7 saat önce" gibi gorece zaman; kart bicimlendirmeyi ustlenmiyor. */
  zamanYazisi: string
  /**
   * Begeni ve yorum sayilari. Kart bunu KENDI CEKMIYOR: akista otuz
   * kart otuz ayri sorgu demek olurdu. Ekran hepsini tek cagrida alip
   * buraya veriyor (etiketlerdeki desenin aynisi).
   *
   * Verilmezse eylem satiri hic cizilmiyor - profil gecmisi gibi
   * etkilesimin anlamsiz oldugu yerlerde kart sade kaliyor.
   */
  ozet?: EtkilesimOzeti
  onBegen?: (id: string) => void
  /**
   * Yorum ikonuna basildiginda ALT SAYFA aciliyor; bu geri cagri
   * yalnizca ekranin haberdar olmasi icin (istege bagli).
   */
  onYorum?: (id: string) => void
  /** Alt sayfada yorum eklenip silindikce karttaki sayaci tazeler. */
  onYorumSayisi?: (id: string, sayi: number) => void
  onPaylas?: (id: string) => void
  silOnayiAcik?: boolean
  /** Verilmezse menude "Sil" satiri cizilmez. */
  onSilOnayi?: (id: string) => void
  onSil?: (id: string) => void
  /**
   * Verilmezse menude "Düzenle" satiri cizilmez - profil gecmisi gibi
   * salt okunur yerlerde kart sade kaliyor.
   */
  onNotKaydet?: (id: string, yeniNot: string) => Promise<void> | void
  /** Yerinde duzenlemede secilen arkadaslari etiketler. */
  onEtiketEkle?: (id: string, kullaniciIdler: string[]) => Promise<void> | void
  onEtiketKaldir?: (id: string, kullaniciId: string) => Promise<void> | void
  /**
   * Verilirse fotografa dokunmak kartin KENDI tam ekranini acmaz, bunu
   * cagirir: profil ekranlari butun fotograflari tek bir gezginde
   * (saga-sola kaydirmali) aciyor (kullanicinin istegi 2026-09-18).
   * Akista verilmiyor; kart tek fotografini kendisi acar.
   */
  onFotografAc?: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t, dil } = useDil()

  // Menu ve duzenleme penceresi KARTIN KENDI durumu; silme onayi ise
  // ekrandan geliyor (o desen degismedi, uc cagiran ekran da onu
  // kullaniyor). Modal zaten ekranda tek basina durdugu icin "ayni anda
  // yalnizca bir kart acik olsun" kaygisi burada yok.
  const [menuAcik, setMenuAcik] = useState(false)
  // YERINDE DUZENLEME (kullanicinin istegi 2026-09-05: "bu ekran hic
  // gelmesin, direk paylasimin oldugu ekranda uzerine yapilsin").
  // Onceden ayri bir pencere (`PaylasimDuzenle`) aciliyordu; kart
  // arkada kaliyor ve neyi duzenledigin gorunmuyordu.
  const renk = useRenk()
  const [duzenleAcik, setDuzenleAcik] = useState(false)
  const [taslakNot, setTaslakNot] = useState('')
  // Kaldirilacak etiketler ve eklenecekler; Kaydet'e basilana kadar
  // sunucuya HICBIR SEY gitmiyor - Vazgec gercekten vazgeciyor.
  const [kaldirilan, setKaldirilan] = useState<string[]>([])
  const [eklenen, setEklenen] = useState<string[]>([])
  const [seciciAcik, setSeciciAcik] = useState(false)
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [duzenleHatasi, setDuzenleHatasi] = useState<string | null>(null)
  // YORUMLAR ARTIK ALTTAN ACILIYOR (kullanicinin karari 2026-09-03,
  // secenek "A"). Onceden `/yorumlar/<id>` sayfasina gidiliyordu.
  const [yorumlarAcik, setYorumlarAcik] = useState(false)
  // FOTOGRAFA DOKUNMAK BUYUK GORUNUM ACAR (kullanicinin bildirdigi hata
  // 2026-09-03): "gorselin uzerine basinca checkinin haritasina gidiyor,
  // sadece gorseli buyuk ekran acmasi gerek". Kartin kendisi haritayi
  // aciyordu ve fotograf duz bir Image oldugu icin dokunus karta
  // gidiyordu.
  const [buyukAcik, setBuyukAcik] = useState(false)

  function duzenlemeyiAc() {
    // Taslak her acilista SIFIRLANIYOR: bir onceki duzenlemeden kalan
    // metin ya da secim tasinmamali.
    setTaslakNot(oge.notMetni ?? '')
    setKaldirilan([])
    setEklenen([])
    setDuzenleHatasi(null)
    setDuzenleAcik(true)
    // Arkadas listesi yalnizca duzenleme acilinca cekiliyor; akistaki
    // her kart icin onceden cekmek bosuna istek olurdu.
    takipcilerimiGetir()
      .then(setArkadaslar)
      .catch(() => setArkadaslar([]))
  }

  async function duzenlemeyiKaydet() {
    if (!onNotKaydet) return
    setKaydediliyor(true)
    setDuzenleHatasi(null)
    try {
      // SUNUCUYA KART DEGIL EKRAN YAZIYOR. Kart saf sunum: ekran hem
      // yaziyor hem kendi listesini guncelliyor, boylece kaldirilan
      // etiket aninda karttan dusuyor. Kart dogrudan lib'i cagirsaydi
      // ekranin haberi olmazdi (denendi, etiket ekranda kaliyordu).
      for (const kullaniciId of kaldirilan) {
        await onEtiketKaldir?.(oge.id, kullaniciId)
      }
      if (eklenen.length > 0) {
        await onEtiketEkle?.(oge.id, eklenen)
      }
      // Not en son: etiketler yazilamazsa kullanici notu da kaybetmesin
      // diye pencere acik kaliyor ve hata gorunuyor.
      await onNotKaydet(oge.id, taslakNot)
      setDuzenleAcik(false)
    } catch (hata) {
      setDuzenleHatasi(hata instanceof Error ? hata.message : t('ortak.birSorunOldu'))
    } finally {
      setKaydediliyor(false)
    }
  }

  const kisiYolu = oge.benimMi ? '/profil' : `/kullanici/${oge.kullaniciId}`
  // UC NOKTA MENUSU (kullanicinin karari 2026-09-02): silme de duzenleme
  // de bunun icinde. Onceden baslikta dogrudan cop kutusu vardi.
  const menuVar = oge.benimMi && Boolean(onSilOnayi || onNotKaydet)
  // Bas harf ADDAN (kullanicinin karari 2026-08-28): `kullaniciAdi`
  // alani check_inler'de denormalize duran ADI tasiyor (karar #18).
  const basHarf = (oge.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase('tr-TR')
  // Kullanici adi okunamadiysa (engel, askidaki hesap, ag) ada dusuyor.
  // KARTTA @ ISARETI YOK (kullanicinin karari 2026-08-30). Bir ara
  // profildeki kartlara @ konmustu, ayni gun geri alindi. @ yalnizca
  // profil basliginda ve baskasinin profilinde duruyor - orada kimlik
  // basligi, burada bir cumlenin oznesi.
  const gosterilenAd = oge.rumuz ?? oge.kullaniciAdi ?? ''

  /** Sablonu belirteclerden bolup ic ice Text uretir. */
  function basligiCiz() {
    const ek = dil === 'tr' ? bulunmaEki(oge.mekanAdi) : ''
    // Yer tutuculara NOBETCI degerler: `t` parametresiz cagrilinca
    // "[missing ... value]" yaziyor (webde goruldu); nobetciden bolunuyor.
    const sablon = t('anaSayfa.checkInYapti', { ad: '', mekan: '', ek: '' })
    return sablon.split(/(||)/).map((parca, i) => {
      if (parca === '')
        return (
          <Text key={i} style={stiller.baslikAd} onPress={() => router.push(kisiYolu as never)}>
            {gosterilenAd}
          </Text>
        )
      if (parca === '')
        return (
          <Text
            key={i}
            style={stiller.baslikMekan}
            accessibilityRole="link"
            accessibilityLabel={t('anaSayfa.haritadaGor', { ad: oge.mekanAdi })}
            onPress={() => router.push(`/harita/${oge.mekanId}` as never)}
          >
            {oge.mekanAdi}
          </Text>
        )
      if (parca === '') return <Text key={i}>{ek}</Text>
      return <Text key={i}>{parca}</Text>
    })
  }

  function ileBirlikteCiz() {
    const sablon = t('anaSayfa.ileBirlikte', { adlar: '' })
    const adlar = oge.etiketler.map((e) => e.kullaniciAdi ?? e.ad ?? '')
    return sablon.split(/()/).map((parca, i) =>
      parca === '' ? (
        <Text key={i}>
          {oge.etiketler.map((e, k) => (
            <Text key={e.kullaniciId}>
              {k > 0 ? ', ' : ''}
              <Text style={stiller.birlikteAd} onPress={() => router.push(`/kullanici/${e.kullaniciId}`)}>
                {adlar[k]}
              </Text>
            </Text>
          ))}
        </Text>
      ) : (
        <Text key={i}>{parca}</Text>
      )
    )
  }

  return (
    // KART BIR BUTON DEGIL (kullanicinin bildirdigi hata 2026-09-04):
    // "Paylasimda bos biryere basinca konumun icine gidiyor, sadece
    // konum yazisinin uzerine basinca haritasina gitsin". Kok Pressable
    // butun govdeyi haritaya bagliyordu - not metni, tarih, bos alan,
    // hepsi. Fotograf ve mekan adi zaten kendi dokunus hedefleriydi;
    // simdi kartta basilabilir olan YALNIZCA o hedefler: avatar ve
    // kullanici adi (profil), mekan adi (harita), etiketler (profil),
    // uc nokta (menu), begeni/yorum/paylas, fotograf (buyuk gorunum).
    <View style={stiller.kart}>
      <View style={stiller.kartUst}>
        <Pressable
          // `as never`: uretilen rota tipleri profil ana ekranini
          // "/profil/index" diye yaziyor, calisma zamaninda ise yol
          // "/profil".
          onPress={() => router.push(kisiYolu as never)}
          accessibilityRole="button"
          accessibilityLabel={gosterilenAd}
        >
          {oge.avatarUrl ? (
            <HizliImage
              testID="akis-avatari"
              source={{ uri: oge.avatarUrl }}
              style={stiller.avatar}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <View style={[stiller.avatar, stiller.avatarYok]}>
              <Text style={stiller.basHarf}>{basHarf}</Text>
            </View>
          )}
        </Pressable>

        {/* REFERANS DUZENI (kullanicinin gorseli 2026-09-18): avatar
            solda; sagda KULLANICI ADI, altinda gorece zaman (ya da
            "su an burada"); uc nokta sag ustte. Mekan adi bir alt
            satirda igne ikonuyla, turuncu (marka tonu). Etiketler
            "Birlikte" satirinda YALNIZCA avatar olarak - ad yazmiyor,
            avatara basinca profil aciliyor (kullanicinin karari). */}
        <View style={stiller.orta}>
          {/* BASLIK TEK CUMLE (kullanicinin referansi 2026-09-20):
              "<ad>, <mekan>'de check-in yapti." - ad kalin siyah
              (profil), mekan kalin turuncu (harita), ek ve fiil duz.
              Sablon sozlukte; parcalar {{ad}}/{{mekan}}/{{ek}}
              belirteclerinden bolunerek ic ice Text'le ciziliyor. Ek
              yalnizca Turkce'de (`bulunmaEki`), digerlerinde bos. */}
          <Text style={stiller.baslik} testID="akis-basligi">
            {basligiCiz()}
          </Text>
          {suAnBuradaMi(oge.olusturmaZamani, oge.canliMi) ? (
            <View style={stiller.canliSatir}>
              <View style={stiller.canliNokta} />
              <Text style={stiller.canliYazi}>{t('anaSayfa.suAnBurada')}</Text>
            </View>
          ) : (
            <Text style={stiller.zaman}>{zamanYazisi}</Text>
          )}
        </View>

        {menuVar && (
          <Pressable
            onPress={() => setMenuAcik(true)}
            accessibilityRole="button"
            accessibilityLabel={t('anaSayfa.secenekler')}
            hitSlop={10}
            style={stiller.silDugmesi}
          >
            <UcNoktaIkonu />
          </Pressable>
        )}
      </View>

      {/* "<adlar> ile birlikte" (referans): kucuk avatarlar + kullanici
          adlari kalin, geri kalan gri; metin sutunuyla hizali. Her
          avatar/ad o kisinin profiline gider. */}
      {oge.etiketler.length > 0 && (
        <View style={stiller.birlikteSatiri} testID="birlikte-satiri">
          <View style={stiller.birlikteAvatarlar}>
            {oge.etiketler.slice(0, 3).map((etiket, i) => (
              <Pressable
                key={etiket.kullaniciId}
                onPress={() => router.push(`/kullanici/${etiket.kullaniciId}`)}
                accessibilityRole="button"
                accessibilityLabel={etiket.kullaniciAdi ?? etiket.ad ?? ''}
                hitSlop={4}
                testID={`birlikte-${etiket.kullaniciId}`}
                style={i > 0 && stiller.birlikteAvatarUstUste}
              >
                <Avatar
                  fotografUrl={etiket.avatarUrl}
                  ad={etiket.ad}
                  kullaniciAdi={etiket.kullaniciAdi ?? etiket.ad ?? ''}
                  cap={ETIKET_AVATAR_CAPI}
                />
              </Pressable>
            ))}
          </View>
          <Text style={stiller.birlikteYazi} numberOfLines={2}>
            {ileBirlikteCiz()}
          </Text>
        </View>
      )}

      {/* NOT ONCE, FOTOGRAF ALTINDA (kullanicinin istegi 2026-08-30). */}
      {duzenleAcik ? (
        /* YERINDE DUZENLEME. Kart yerinde duruyor; degistirilen sey ne
           ise onun uzerinde calisiliyor. Sunucuya hicbir sey Kaydet'e
           basilana kadar gitmiyor. */
        <View style={stiller.duzenleAlani} testID="yerinde-duzenle">
          <TextInput
            testID="duzenle-not"
            style={stiller.duzenleGirdi}
            value={taslakNot}
            onChangeText={(d) => setTaslakNot(d.slice(0, NOT_EN_FAZLA))}
            maxLength={NOT_EN_FAZLA}
            placeholder={t('anaSayfa.notYerTutucu')}
            placeholderTextColor={renk.metinIkincil}
            multiline
            editable={!kaydediliyor}
          />

          {/* Mevcut etiketler: carpiyla kaldirilir. Kaldirma da
              Kaydet'e kadar bekliyor. */}
          {oge.etiketler.filter((e) => !kaldirilan.includes(e.kullaniciId)).length > 0 && (
            <View style={stiller.cipler}>
              {oge.etiketler
                .filter((e) => !kaldirilan.includes(e.kullaniciId))
                .map((e) => (
                  <Pressable
                    key={e.kullaniciId}
                    style={stiller.cip}
                    onPress={() => setKaldirilan((m) => [...m, e.kullaniciId])}
                    accessibilityRole="button"
                    accessibilityLabel={t('checkIn.etiketiKaldir', { ad: e.kullaniciAdi ?? e.ad ?? '' })}
                  >
                    {/* CIPTE KULLANICI ADI, ad-soyad DEGIL (kullanicinin karari 2026-09-18). */}
                    <Avatar fotografUrl={e.avatarUrl} ad={e.ad} kullaniciAdi={e.kullaniciAdi ?? e.ad ?? ''} cap={22} />
                    <Text style={stiller.cipYazi}>{e.kullaniciAdi ?? e.ad ?? ''}</Text>
                    <Text style={stiller.cipCarpi}>×</Text>
                  </Pressable>
                ))}
            </View>
          )}

          {/* ARKADAS ETIKETLE DUGMESI (kullanicinin istegi 2026-09-18):
              basinca alttan aranabilir arkadas listesi (profil resmi +
              kullanici adi) aciliyor; secilenler altta cip olarak duruyor
              ve Kaydet'e basilana kadar sunucuya gitmiyor. Etiket, karsi
              tarafin "etiket onayi" ayarina gore sunucuda ya hemen
              onaylaniyor ya da onaya dusuyor (trigger, 2026-09-06);
              onaylaninca akis yenilenince kartta gorunur.
              2026-09-05'ten kalan satir ici "+ ad" cipleri kalkti. */}
          <Pressable
            style={stiller.etiketleDugmesi}
            onPress={() => setSeciciAcik(true)}
            accessibilityRole="button"
            testID="arkadas-etiketle"
          >
            <Text style={stiller.etiketleDugmesiYazi}>{t('anaSayfa.arkadasEtiketle')}</Text>
          </Pressable>

          {/* Eklenmek uzere secilenler */}
          {eklenen.length > 0 && (
            <View style={stiller.cipler}>
              {eklenen.map((id) => {
                const kisi = arkadaslar.find((a) => a.id === id)
                return (
                  <Pressable
                    key={id}
                    style={stiller.cip}
                    onPress={() => setEklenen((m) => m.filter((x) => x !== id))}
                    accessibilityRole="button"
                    accessibilityLabel={t('checkIn.etiketiKaldir', { ad: kisi?.kullaniciAdi ?? '' })}
                  >
                    <Avatar
                      fotografUrl={kisi?.avatarUrl ?? null}
                      ad={kisi?.ad}
                      kullaniciAdi={kisi?.kullaniciAdi ?? ''}
                      cap={22}
                    />
                    <Text style={stiller.cipYazi}>{kisi?.kullaniciAdi ?? ''}</Text>
                    <Text style={stiller.cipCarpi}>×</Text>
                  </Pressable>
                )
              })}
            </View>
          )}

          {duzenleHatasi && <Text style={stiller.duzenleHata}>{duzenleHatasi}</Text>}

          <View style={stiller.duzenleEylemler}>
            <Pressable
              testID="duzenle-vazgec"
              style={[stiller.duzenleDugme, stiller.duzenleIkincil]}
              onPress={() => setDuzenleAcik(false)}
              disabled={kaydediliyor}
              accessibilityRole="button"
            >
              <Text style={stiller.duzenleIkincilYazi}>{t('ortak.vazgec')}</Text>
            </Pressable>
            <Pressable
              testID="duzenle-kaydet"
              style={[stiller.duzenleDugme, stiller.duzenleBirincil]}
              onPress={duzenlemeyiKaydet}
              disabled={kaydediliyor}
              accessibilityRole="button"
            >
              <Text style={stiller.duzenleBirincilYazi}>{t('ortak.kaydet')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        oge.notMetni && <Text style={stiller.not}>{oge.notMetni}</Text>
      )}

      {oge.fotografUrl && (
        <Pressable
          testID="akis-fotografi"
          onPress={() => (onFotografAc ? onFotografAc() : setBuyukAcik(true))}
          accessibilityRole="button"
          accessibilityLabel={t('anaSayfa.fotografiBuyut')}
          // NEGATIF PAY SARMALAYICIDA, gorselde DEGIL. Gorselde
          // oldugunda `Pressable` kartin ic genisliginde kaliyor ve
          // gorsel yalnizca SOLA tasiyordu; sagda kartin dolgusu kadar
          // (16 px) beyaz bir serit kaliyordu - kullanicinin bildirdigi
          // kusur (2026-09-08).
          style={stiller.fotografKabi}
        >
          {/* KART ICINDE DE ZOOM (kullanicinin istegi 2026-09-08: "tam
              ekran acilmadan da zoom yapma ekle"). Parmak kalkinca 1x'e
              donuyor - kart sabit yukseklikte ve listenin icinde, kalici
              zoom komsu kartlarin uzerine tasardi.

              TEK DOKUNUS hala tam ekrani aciyor: `Pressable` disarida,
              hareketler icerideki katmanda. */}
          <YakinlastirilabilirGorsel
            uri={oge.fotografUrl}
            stil={stiller.fotograf}
            birakincaSifirla
          />
        </Pressable>
      )}

      {/* EYLEM SATIRI FOTOGRAFIN USTUNDE (kullanicinin karari
          2026-09-02, "A" duzeni). Onceden fotografin ALTINDAYDI; harita
          ekran goruntusu gibi uzun bir gorselde kart ekrani tasiyor ve
          begeni satiri hic gorunmuyordu - kullanici bunu ekran
          goruntusuyle bildirdi. Notun hemen altinda durunca fotograf ne
          kadar uzun olursa olsun eylemler ekranda kaliyor.

          Sayilar yalnizca
          sifirdan buyukse yaziliyor: "0" gostermek bos bir paylasimi
          daha da bos gosteriyor. Ikonlar notr, yalnizca BEGENILMIS kalp
          turuncu - Slooin'de turuncu "eylem ya da su an oluyor" demek,
          uc ikonu birden turuncu yapmak o anlami tuketirdi. */}
      {ozet && (
        <View style={stiller.eylemler}>
          <Pressable
            style={stiller.eylem}
            onPress={() => onBegen?.(oge.id)}
            accessibilityRole="button"
            accessibilityLabel={
              ozet.begendim ? t('etkilesim.begeniyiKaldir') : t('etkilesim.begen')
            }
            hitSlop={8}
          >
            <BegeniKalbi dolu={ozet.begendim} />
            {ozet.begeni > 0 && <Text style={stiller.sayac}>{ozet.begeni}</Text>}
          </Pressable>

          <Pressable
            style={stiller.eylem}
            onPress={() => {
              setYorumlarAcik(true)
              onYorum?.(oge.id)
            }}
            accessibilityRole="button"
            accessibilityLabel={t('etkilesim.yorumlar')}
            hitSlop={8}
          >
            <YorumIkonu />
            {ozet.yorum > 0 && <Text style={stiller.sayac}>{ozet.yorum}</Text>}
          </Pressable>

          <Pressable
            style={[stiller.eylem, stiller.eylemSag]}
            onPress={() => onPaylas?.(oge.id)}
            accessibilityRole="button"
            accessibilityLabel={t('etkilesim.paylas')}
            hitSlop={8}
          >
            <PaylasIkonu />
          </Pressable>
        </View>
      )}

      {/* Arkadas secici: zaten etiketli olanlar listede yok. */}
      <ArkadasSecici
        acikMi={seciciAcik}
        arkadaslar={arkadaslar.filter(
          (a) => !oge.etiketler.some((e) => e.kullaniciId === a.id && !kaldirilan.includes(a.id))
        )}
        secili={eklenen}
        onDegistir={(id) =>
          setEklenen((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))
        }
        onKapat={() => setSeciciAcik(false)}
      />

      {/* BUYUK GORUNUM: siyah zemin, fotograf tam genislikte, ustte
          Kapat, SOL ALTTA paylasan kisi (kullanicinin istegi
          2026-09-17). Profildeki buyuk gorunumun ayni deseni - orada
          ayrica "Kaldir" var, burada yok: bu fotograf baskasinin
          olabilir. */}
      <Modal
        visible={buyukAcik && Boolean(oge.fotografUrl)}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setBuyukAcik(false)}
      >
        <View style={stiller.buyukZemin} testID="fotograf-gorunumu">
          <Pressable
            style={stiller.buyukKapat}
            onPress={() => setBuyukAcik(false)}
            accessibilityRole="button"
            accessibilityLabel={t('ortak.kapat')}
            hitSlop={12}
          >
            <Text style={stiller.buyukKapatYazi}>×</Text>
          </Pressable>
          {/* IKI PARMAKLA YAKINLASTIRMA (kullanicinin istegi
              2026-09-08). Cift dokunus sifirliyor. */}
          {oge.fotografUrl && (
            <YakinlastirilabilirTamEkran uri={oge.fotografUrl} stil={stiller.buyukFotograf} />
          )}
          {/* Altyazi fotografin USTUNDE duruyor (mutlak): fotograf
              ekranin ortasinda ve %70 yuksekliginde, altta akisla
              birlikte kayan bir satir olsaydi kadraj daralirdi. */}
          <View style={stiller.buyukAltyazi}>
            <FotografAltyazisi
              testID="akis-fotograf-altyazisi"
              avatarUrl={oge.avatarUrl}
              kullaniciAdi={gosterilenAd || null}
              mekanAdi={oge.mekanAdi}
              zamanYazisi={zamanYazisi}
              onKisi={() => {
                setBuyukAcik(false)
                router.push(kisiYolu as never)
              }}
              onMekan={() => {
                setBuyukAcik(false)
                router.push(`/harita/${oge.mekanId}` as never)
              }}
            />
          </View>
        </View>
      </Modal>

      {/* SILME GERI ALINAMAZ: tek dokunusla degil, onayla.
          Onay ekranin ORTASINDA aciliyor (kullanicinin istegi
          2026-09-02). Onceden kartin icinde aciliyordu; uzun bir kartta
          onay satiri ekranin disinda kalabiliyor ve kullanici "sil"e
          bastigini sanip hicbir sey olmadigini goruyordu. */}
      <SecimPenceresi
        acikMi={menuAcik}
        secimler={[
          ...(onNotKaydet
            ? [
                {
                  etiket: t('anaSayfa.duzenle'),
                  testID: 'menu-duzenle',
                  ikon: <KalemIkonu />,
                  onSec: () => {
                    setMenuAcik(false)
                    duzenlemeyiAc()
                  },
                },
              ]
            : []),
          ...(onSilOnayi
            ? [
                {
                  etiket: t('ortak.sil'),
                  testID: 'menu-sil',
                  ikon: <CopIkonu />,
                  yikici: true,
                  onSec: () => {
                    setMenuAcik(false)
                    onSilOnayi(oge.id)
                  },
                },
              ]
            : []),
        ]}
        onKapat={() => setMenuAcik(false)}
      />

      <YorumSayfasi
        acikMi={yorumlarAcik}
        checkInId={oge.id}
        onKapat={() => setYorumlarAcik(false)}
        onSayiDegisti={(sayi) => onYorumSayisi?.(oge.id, sayi)}
      />


      <OnayPenceresi
        acikMi={silOnayiAcik}
        baslik={t('anaSayfa.silOnay')}
        aciklama={t('anaSayfa.silAciklama')}
        eylemEtiketi={t('ortak.sil')}
        onOnay={() => onSil?.(oge.id)}
        onVazgec={() => onSilOnayi?.(oge.id)}
      />
    </View>
  )
}

const AVATAR_CAPI = 52
/** "Birlikte" satirindaki etiket avatarlari. */
const ETIKET_AVATAR_CAPI = 28


const stilleriYap = (renk: Renk) => StyleSheet.create({
  // YERINDE DUZENLEME (kullanicinin istegi 2026-09-05). Ayri bir
  // pencere yerine kartin kendi icinde aciliyor.
  duzenleAlani: {
    marginTop: bosluk.m,
    padding: bosluk.m,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.zemin,
    borderWidth: 1,
    borderColor: renk.cizgi,
    gap: bosluk.s,
  },
  duzenleGirdi: {
    minHeight: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    paddingHorizontal: bosluk.m,
    paddingVertical: bosluk.s,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    textAlignVertical: 'top',
  },
  duzenleEtiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: renk.metinSoluk,
  },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.xs },
  cip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: bosluk.s,
    paddingVertical: 4,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncuZemin,
  },
  cipYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.turuncuYazi },
  cipCarpi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi },
  // "Arkadas etiketle" dugmesi: check-in formundaki "Arkadas ekle" ile
  // ayni dil (hayalet, cerceveli).
  etiketleDugmesi: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.l,
    paddingVertical: 9,
  },
  etiketleDugmesiYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metin },
  duzenleHata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici },
  duzenleEylemler: { flexDirection: 'row', gap: bosluk.s, marginTop: bosluk.xs },
  duzenleDugme: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: yuvarlak.hap,
  },
  duzenleIkincil: { borderWidth: 1, borderColor: renk.cizgi },
  duzenleIkincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  duzenleBirincil: { backgroundColor: renk.turuncu },
  duzenleBirincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },

  eylemler: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.xxl,
    marginTop: bosluk.m,
  },
  eylem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Paylas sag uca (referans).
  eylemSag: { marginLeft: 'auto' },
  sayac: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  buyukZemin: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  // × SOLDA (kullanicinin istegi 2026-09-18: butun buyuk gorunumlerde ayni yer; gezginle ayni).
  buyukKapat: { position: 'absolute', top: bosluk.xxl + bosluk.xl, left: bosluk.sayfa, zIndex: 1 },
  buyukKapatYazi: { fontFamily: yazi.govde, fontSize: 34, color: '#FFFFFF', lineHeight: 38 },
  buyukFotograf: { width: '100%', height: '70%' },
  buyukAltyazi: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  kart: {
    // REFERANS KARTI (kullanicinin gorseli 2026-09-20 aksam, "akisi bu
    // sekilde yap"): yuvarlak koseli (16), ince cerceveli beyaz kart,
    // yanlardan 8 px payli, kartlar arasi 12 px. Ayni gunun "tam
    // genislik + gri bant" (B) secimi bu referansla KAPANDI; sayfa zemini
    // beyaz. Kart uc ekranda ortak: profil listeleri de boyle.
    backgroundColor: renk.yuzey,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: renk.cizgi,
    marginHorizontal: bosluk.s,
    marginTop: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
  },
  kartUst: { flexDirection: 'row', alignItems: 'flex-start', gap: bosluk.m },
  // Baslik cumlesi (referans 2026-09-20).
  baslik: { fontFamily: yazi.govde, fontSize: olcek.govde + 2, lineHeight: 24, color: renk.metin },
  baslikAd: { fontFamily: yazi.ekranBasligi, color: renk.metin, letterSpacing: -0.2 },
  baslikMekan: { fontFamily: yazi.ekranBasligi, color: renk.turuncuYazi, letterSpacing: -0.2 },
  // "<adlar> ile birlikte": metin sutunuyla hizali (avatar + aralik).
  birlikteSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    marginTop: bosluk.m,
    marginLeft: AVATAR_CAPI + bosluk.m,
  },
  birlikteAvatarlar: { flexDirection: 'row', alignItems: 'center' },
  birlikteAvatarUstUste: { marginLeft: -8 },
  birlikteYazi: { flex: 1, fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  birlikteAd: { fontFamily: yazi.govdeKalin, color: renk.metin },

  avatar: {
    width: AVATAR_CAPI,
    height: AVATAR_CAPI,
    borderRadius: AVATAR_CAPI / 2,
  },
  avatarYok: {
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },

  orta: { flex: 1 },
  // Mekan adi TURUNCU (kullanicinin istegi): satirdaki tek renkli oge
  // ve ayni zamanda tiklanabilir - turuncu kurali bozulmuyor.

  silDugmesi: { padding: 4, marginRight: 2 },

  zaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk + 1,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  // "Su an burada" adin altinda, zamanin yerinde: turuncu nokta + yazi.
  canliSatir: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  canliNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: renk.turuncu },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk + 1,
    color: renk.turuncuYazi,
  },

  // Not da metin sutunuyla hizali (referans).
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: bosluk.m,
    marginLeft: AVATAR_CAPI + bosluk.m,
  },
  // TAM GENISLIK (kullanicinin sectigi tasarim B, 2026-09-02):
  // Instagram'da fotografin durdugu gibi kenara yapisiyor. Negatif
  // yatay margin kartin kendi dolgusunu iptal ediyor - metin padding'li
  // kaliyor, yalnizca gorsel kenara ulasiyor.
  //
  // Pay SARMALAYICIDA: gorselde oldugunda `Pressable` kartin ic
  // genisliginde kaliyor ve gorsel yalnizca sola tasiyor, sagda 16 px
  // beyaz serit kaliyordu.
  // REFERANS (2026-09-18): fotograf kartin ICINDE, yuvarlak koseli ve
  // YATAY sabit oranli (16:7) - akista referanstaki boyutta gorunur;
  // basilinca acilan buyuk gorunum fotografi KENDI oraninda gosterir
  // (`contain`). 2026-09-02/18'in kenara yapisik tam genislik deseni bu
  // referansla degisti.
  fotografKabi: {
    marginTop: bosluk.m,
    borderRadius: 14,
    overflow: 'hidden',
  },
  // Referans olcusu 2:1 (16:7 idi, 2026-09-18).
  fotograf: {
    width: '100%',
    aspectRatio: 2,
    backgroundColor: renk.cizgi,
  },
})
