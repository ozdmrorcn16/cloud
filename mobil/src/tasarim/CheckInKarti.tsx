import { useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
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
import { YorumIkonu, PaylasIkonu } from './etkilesim-ikonlari'
import { BegeniKalbi } from './BegeniKalbi'
import { ifadeBul } from '../../lib/ifadeler'
import type { EtkilesimOzeti } from '../../lib/etkilesim'
import { FotografAltyazisi } from './FotografAltyazisi'
import { FotografSeridi } from './FotografSeridi'
import { FotografGezgini } from './FotografGezgini'
import { Avatar } from './Avatar'

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
  onDuzenle,
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
   * Verilirse menude "Düzenle" satiri cizilir ve basinca cagrilir; ekran
   * "Check-in'i düzenle" sayfasini acar (referans, 2026-09-21). Kartin
   * icindeki yerinde duzenleme (2026-09-05) bu sayfayla KALKTI.
   */
  onDuzenle?: (id: string) => void
  /**
   * Verilirse fotografa dokunmak kartin KENDI gezginini acmaz, dokunulan
   * fotografin indeksiyle bunu cagirir: profil ekranlari butun
   * fotograflari tek bir gezginde (saga-sola kaydirmali) aciyor
   * (kullanicinin istegi 2026-09-18). Akista verilmiyor; kart kendi
   * fotograflarini kendisi acar.
   */
  onFotografAc?: (indeks: number) => void
}) {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t, dil } = useDil()

  // Menu ve duzenleme penceresi KARTIN KENDI durumu; silme onayi ise
  // ekrandan geliyor (o desen degismedi, uc cagiran ekran da onu
  // kullaniyor). Modal zaten ekranda tek basina durdugu icin "ayni anda
  // yalnizca bir kart acik olsun" kaygisi burada yok.
  const [menuAcik, setMenuAcik] = useState(false)
  const renk = useRenk()
  // YORUMLAR ARTIK ALTTAN ACILIYOR (kullanicinin karari 2026-09-03,
  // secenek "A"). Onceden `/yorumlar/<id>` sayfasina gidiliyordu.
  const [yorumlarAcik, setYorumlarAcik] = useState(false)
  // FOTOGRAFA DOKUNMAK BUYUK GORUNUM ACAR (kullanicinin bildirdigi hata
  // 2026-09-03): "gorselin uzerine basinca checkinin haritasina gidiyor,
  // sadece gorseli buyuk ekran acmasi gerek". Kartin kendisi haritayi
  // aciyordu ve fotograf duz bir Image oldugu icin dokunus karta
  // gidiyordu.
  // COKLU FOTOGRAF (2026-09-21): acik fotografin indeksi; null kapali.
  const [buyukIndeks, setBuyukIndeks] = useState<number | null>(null)

  const kisiYolu = oge.benimMi ? '/profil' : `/kullanici/${oge.kullaniciId}`
  // UC NOKTA MENUSU (kullanicinin karari 2026-09-02): silme de duzenleme
  // de bunun icinde. Onceden baslikta dogrudan cop kutusu vardi.
  const menuVar = oge.benimMi && Boolean(onSilOnayi || onDuzenle)
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
      {(oge.notMetni || oge.ifade) && (
        /* IFADE (2026-09-21): notun basinda 32 pt ikon, YAZISI YOK
           (kullanicinin istegi ayni gun: "yaninda ifadenin yazisi
           eklenmesin, sadece ifade"); etiket erisilebilirlik icin
           ikonun accessibilityLabel'inda. Not yoksa yalnizca ikon.
           Sozlukte olmayan (silinmis) slug sessizce cizilmez. */
        <View style={stiller.notSatiri} testID="not-satiri">
          {oge.ifade && ifadeBul(oge.ifade) && (
            <Image
              source={ifadeBul(oge.ifade)!.kaynak}
              style={stiller.ifadeIkon}
              resizeMode="contain"
              accessibilityLabel={ifadeBul(oge.ifade)!.etiket}
              testID={`kart-ifade-${oge.ifade}`}
            />
          )}
          {oge.notMetni ? <Text style={stiller.not}>{oge.notMetni}</Text> : null}
        </View>
      )}

      {oge.fotografUrller.length > 0 && (
        /* COKLU FOTOGRAF (2026-09-21): 2:1 alanda yana kaydirmali serit;
           dokununca ya ekranin gezgini (profil) ya kartin kendi gezgini
           acilir, dokunulan fotograftan baslayarak. */
        <FotografSeridi
          urller={oge.fotografUrller}
          onDokun={(i) => (onFotografAc ? onFotografAc(i) : setBuyukIndeks(i))}
        />
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

      {/* BUYUK GORUNUM: ortak gezgin (siyah zemin, × ve "2 / 3" sayaci,
          saga-sola kaydirma, iki parmakla yakinlastirma), SOL ALTTA
          paylasan kisi (kullanicinin istegi 2026-09-17). "Kaldir" yok:
          bu fotograf baskasinin olabilir; silme duzenleme sayfasinda. */}
      <FotografGezgini
        testID="akis"
        fotograflar={oge.fotografUrller.map((url, i) => ({ id: `${oge.id}-${i}`, url }))}
        acikIndeks={buyukIndeks}
        onIndeks={setBuyukIndeks}
        onKapat={() => setBuyukIndeks(null)}
        altyazi={() => (
          <FotografAltyazisi
            testID="akis-fotograf-altyazisi"
            avatarUrl={oge.avatarUrl}
            kullaniciAdi={gosterilenAd || null}
            mekanAdi={oge.mekanAdi}
            zamanYazisi={zamanYazisi}
            onKisi={() => {
              setBuyukIndeks(null)
              router.push(kisiYolu as never)
            }}
            onMekan={() => {
              setBuyukIndeks(null)
              router.push(`/harita/${oge.mekanId}` as never)
            }}
          />
        )}
      />

      {/* SILME GERI ALINAMAZ: tek dokunusla degil, onayla.
          Onay ekranin ORTASINDA aciliyor (kullanicinin istegi
          2026-09-02). Onceden kartin icinde aciliyordu; uzun bir kartta
          onay satiri ekranin disinda kalabiliyor ve kullanici "sil"e
          bastigini sanip hicbir sey olmadigini goruyordu. */}
      <SecimPenceresi
        acikMi={menuAcik}
        secimler={[
          ...(onDuzenle
            ? [
                {
                  etiket: t('anaSayfa.duzenle'),
                  testID: 'menu-duzenle',
                  ikon: <KalemIkonu />,
                  onSec: () => {
                    setMenuAcik(false)
                    onDuzenle(oge.id)
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
  // × SOLDA (kullanicinin istegi 2026-09-18: butun buyuk gorunumlerde ayni yer; gezginle ayni).

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
  // Not satiri: ifade ikonu + metin yan yana; kenar payi eski notunki.
  notSatiri: { flexDirection: 'row', alignItems: 'flex-start', gap: bosluk.s, marginTop: bosluk.m, marginLeft: AVATAR_CAPI + bosluk.m },
  ifadeIkon: { width: 32, height: 32, marginTop: -4 },
  not: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
  },
  // Fotograf alani artik `FotografSeridi` (coklu fotograf, 2026-09-21);
  // 2:1 oran ve yuvarlak kose orada.
})
