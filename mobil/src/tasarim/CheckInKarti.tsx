import { useState } from 'react'
import { View, Text, Image, Modal, Pressable, StyleSheet } from 'react-native'
import { Image as HizliImage } from 'expo-image'
import { useRouter } from 'expo-router'
import type { AkisOgesi } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { suAnBuradaMi, tamZaman } from '../../lib/zaman'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { OnayPenceresi } from './OnayPenceresi'
import { SecimPenceresi, UcNoktaIkonu, KalemIkonu, CopIkonu } from './SecimPenceresi'
import { YorumSayfasi } from './YorumSayfasi'
import { PaylasimDuzenle } from './PaylasimDuzenle'
import { KalpIkonu, YorumIkonu, PaylasIkonu } from './etkilesim-ikonlari'
import type { EtkilesimOzeti } from '../../lib/etkilesim'

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
 *        (kullanicinin karari 2026-08-30: kartta "byorcun" gibi kullanici
 *        adi yazar, ad-soyad DEGIL; bildirimlerde ise ad-soyad)
 *        tam zaman
 *        not
 *        fotograf
 *        sagda gorece zaman ("7 saat önce") ya da "şu an burada"
 *
 * Ad, mekan ve etiketler TEK metin akisinda: ayri View'lara bolununce
 * uzun mekan adlari satiri tasiriyordu. Ic ice `Text` ile parcalar
 * satir sonunda birlikte kiriliyor ve her parcanin kendi dokunma
 * hedefi kaliyor.
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
  onEtiketKaldir,
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
  onEtiketKaldir?: (id: string, kullaniciId: string) => Promise<void> | void
}) {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()

  // Menu ve duzenleme penceresi KARTIN KENDI durumu; silme onayi ise
  // ekrandan geliyor (o desen degismedi, uc cagiran ekran da onu
  // kullaniyor). Modal zaten ekranda tek basina durdugu icin "ayni anda
  // yalnizca bir kart acik olsun" kaygisi burada yok.
  const [menuAcik, setMenuAcik] = useState(false)
  const [duzenleAcik, setDuzenleAcik] = useState(false)
  // YORUMLAR ARTIK ALTTAN ACILIYOR (kullanicinin karari 2026-09-03,
  // secenek "A"). Onceden `/yorumlar/<id>` sayfasina gidiliyordu.
  const [yorumlarAcik, setYorumlarAcik] = useState(false)
  // FOTOGRAFA DOKUNMAK BUYUK GORUNUM ACAR (kullanicinin bildirdigi hata
  // 2026-09-03): "gorselin uzerine basinca checkinin haritasina gidiyor,
  // sadece gorseli buyuk ekran acmasi gerek". Kartin kendisi haritayi
  // aciyordu ve fotograf duz bir Image oldugu icin dokunus karta
  // gidiyordu.
  const [buyukAcik, setBuyukAcik] = useState(false)

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

        <View style={stiller.orta}>
          <Text style={stiller.satir}>
            <Text
              style={stiller.kullaniciAdi}
              onPress={() => router.push(kisiYolu as never)}
            >
              {gosterilenAd}
            </Text>
            <Text style={stiller.ayirac}> - </Text>
            <Text
              style={stiller.mekanAdi}
              // Mekan adi KONUM EKRANINI aciyor (kullanicinin karari
              // 2026-08-30). Onceden yeni check-in formunu aciyordu;
              // konum etiketine basan kisi orayi gormek istiyor, oraya
              // check-in yapmak degil.
              //
              // 2026-09-04'ten beri haritanin TEK kapisi bu; kartin kok
              // Pressable'i kaldirildigi icin erisilebilirlik etiketi de
              // buraya tasindi.
              accessibilityRole="link"
              accessibilityLabel={`${oge.mekanAdi} konumunu haritada gör`}
              onPress={() => router.push(`/harita/${oge.mekanId}` as never)}
            >
              {oge.mekanAdi}
            </Text>
            {oge.etiketler.length > 0 && (
              <>
                <Text style={stiller.ayirac}> - </Text>
                {oge.etiketler.map((etiket, sira) => (
                  <Text key={etiket.kullaniciId}>
                    {sira > 0 ? <Text style={stiller.ayirac}>, </Text> : null}
                    <Text
                      style={stiller.etiket}
                      onPress={() => router.push(`/kullanici/${etiket.kullaniciId}`)}
                    >
                      {etiket.ad ?? ''}
                    </Text>
                  </Text>
                ))}
              </>
            )}
          </Text>
          {/* Tam zaman: gorece etiket "ne kadar once" der, bu da "tam
              olarak ne zaman". */}
          <Text style={stiller.tamZaman}>{tamZaman(oge.olusturmaZamani)}</Text>
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

        {/* "Şu an burada" yalnizca canlilik penceresinde (30 dk); sonra
            gorece zaman. Turuncunun mesru kullanimi: "su an oluyor".
            Yalnizca nokta yetmiyor - renk tek basina anlam tasimamali. */}
        {suAnBuradaMi(oge.olusturmaZamani, oge.canliMi) ? (
          <View style={stiller.canliRozet}>
            <View style={stiller.canliNokta} />
            <Text style={stiller.canliYazi}>{t('anaSayfa.suAnBurada')}</Text>
          </View>
        ) : (
          <Text style={stiller.zaman}>{zamanYazisi}</Text>
        )}
      </View>

      {/* NOT ONCE, FOTOGRAF ALTINDA (kullanicinin istegi 2026-08-30). */}
      {oge.notMetni && <Text style={stiller.not}>{oge.notMetni}</Text>}

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
            <KalpIkonu dolu={ozet.begendim} />
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
            style={stiller.eylem}
            onPress={() => onPaylas?.(oge.id)}
            accessibilityRole="button"
            accessibilityLabel={t('etkilesim.paylas')}
            hitSlop={8}
          >
            <PaylasIkonu />
          </Pressable>
        </View>
      )}

      {oge.fotografUrl && (
        <Pressable
          testID="akis-fotografi"
          onPress={() => setBuyukAcik(true)}
          accessibilityRole="button"
          accessibilityLabel={t('anaSayfa.fotografiBuyut')}
        >
          <Image
            source={{ uri: oge.fotografUrl }}
            style={stiller.fotograf}
            resizeMode="cover"
          />
        </Pressable>
      )}

      {/* BUYUK GORUNUM: siyah zemin, fotograf tam genislikte, ustte
          Kapat. Profildeki buyuk gorunumun ayni deseni - orada ayrica
          "Kaldir" var, burada yok: bu fotograf baskasinin olabilir. */}
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
          {oge.fotografUrl && (
            <Image
              source={{ uri: oge.fotografUrl }}
              style={stiller.buyukFotograf}
              resizeMode="contain"
            />
          )}
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
                    setDuzenleAcik(true)
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

      {/* Pencere ACILDIGINDA mount ediliyor: taslak metin ve kaldirilan
          etiketler onun ic durumu, bir onceki acilistan kalmamali. */}
      {duzenleAcik && onNotKaydet && (
        <PaylasimDuzenle
          acikMi
          baslikAltMetni={`${oge.mekanAdi} · ${tamZaman(oge.olusturmaZamani)}`}
          not={oge.notMetni ?? ''}
          etiketler={oge.etiketler}
          onNotKaydet={(yeniNot) => onNotKaydet(oge.id, yeniNot)}
          onEtiketKaldir={(kullaniciId) => onEtiketKaldir?.(oge.id, kullaniciId)}
          onKapat={() => setDuzenleAcik(false)}
        />
      )}

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

const AVATAR_CAPI = 40

const stilleriYap = (renk: Renk) => StyleSheet.create({
  eylemler: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.xl,
    marginTop: bosluk.m,
  },
  eylem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sayac: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  buyukZemin: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  buyukKapat: { position: 'absolute', top: bosluk.xxl + bosluk.xl, right: bosluk.xl, zIndex: 1 },
  buyukKapatYazi: { fontFamily: yazi.govde, fontSize: 34, color: '#FFFFFF', lineHeight: 38 },
  buyukFotograf: { width: '100%', height: '70%' },

  kart: {
    // YANLARDAN SINIR YOK (kullanicinin istegi 2026-09-02). Kart artik
    // ekranin tam genisliginde: yuvarlak kose ve golge kalkti, cunku
    // ikisi de kartin kenarini gorunur kiliyordu. Kartlari birbirinden
    // ayiran tek sey alttaki ince cizgi - Instagram akisindaki desen.
    backgroundColor: renk.yuzey,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },

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
    color: renk.turuncu,
  },

  orta: { flex: 1 },
  tamZaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    marginTop: 2,
  },
  satir: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
  },
  kullaniciAdi: { fontFamily: yazi.govdeKalin, color: renk.metin },
  ayirac: { color: renk.metinSoluk },
  // Mekan adi TURUNCU (kullanicinin istegi): satirdaki tek renkli oge
  // ve ayni zamanda tiklanabilir - turuncu kurali bozulmuyor.
  mekanAdi: { fontFamily: yazi.govdeKalin, color: renk.turuncu },
  etiket: { fontFamily: yazi.govdeOrta, color: renk.metin },

  silDugmesi: { padding: 4, marginRight: 2 },

  zaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },
  canliRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.s,
    paddingVertical: 4,
  },
  canliNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: renk.turuncu },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuKoyu,
  },

  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: bosluk.m,
  },
  fotograf: {
    // TAM GENISLIK (kullanicinin sectigi tasarim B, 2026-09-02):
    // Instagram'da fotografin durdugu gibi kenara yapisiyor. Negatif
    // yatay margin, kartin kendi dolgusunu iptal ediyor - metin
    // padding'li kaliyor, yalnizca gorsel kenara ulasiyor.
    //
    // Kose yuvarlamasi da kalkti: kenara yapisan bir gorselde yuvarlak
    // kose, altindaki beyazi ucgen parcalar halinde gosteriyor.
    width: undefined,
    marginHorizontal: -bosluk.l,
    aspectRatio: 4 / 5,
    marginTop: bosluk.m,
    backgroundColor: renk.cizgi,
  },
})
