import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Share,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  baskasininProfiliniGetir,
  kendiKullaniciIdim,
  type BaskaProfil,
} from '../../../lib/profil'
import { engelle } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir, type AniGorunumu } from '../../../lib/checkin'
import { profilFotograflariUrl } from '../../../lib/fotograf-url'
import { anidanAkisOgesi } from '../../../lib/akis'
import {
  etkilesimOzetleriniGetir,
  begen,
  begeniyiKaldir,
  paylas,
  type EtkilesimOzeti,
} from '../../../lib/etkilesim'
import { gorecelZaman } from '../../../lib/zaman'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { ProfilSayaclari } from '../../tasarim/ProfilSayaclari'
import { ProfilHaritaZemini } from '../../tasarim/ProfilHaritaZemini'
import { BasHarfAvatar } from '../../tasarim/BasHarfAvatar'
import { InstagramSatiri } from '../../tasarim/InstagramSatiri'
import { PaylasIkonu } from '../../tasarim/etkilesim-ikonlari'
import { SiraRozeti } from '../../tasarim/SiraRozeti'
import { CheckInKarti } from '../../tasarim/CheckInKarti'
import { bolgeMetni } from '../../../lib/bolge'
import { SekmeHapi } from '../../tasarim/SekmeHapi'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import {
  bagDurumunuGetir,
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIsteginiYanitla,
} from '../../../lib/bag'

function GeriIkonu() {
  const renk = useRenk()
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={renk.metin}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * KAPALI PROFIL KILIDI - BUYUK.
 *
 * Kullanicinin tarifi (2026-09-13): "asagi bos kismada buyuk bir kilit
 * ikonu koyabilirsin". 2026-09-10'da 34 px'lik kucuk bir kilit
 * konmustu; artik 72 px ve sayfanin bos kalan alt yarisinin ortasinda
 * duruyor. Ikon `metinSoluk` degil `metinIkincil`: bu bir SEBEP
 * bildirimi, pasif bir suesleme degil - kullanicinin neden akis
 * gormedigini anlatan tek isaret.
 */
const KILIT_BOYU = 72

function KilitIkonu() {
  const renk = useRenk()
  return (
    <Svg width={KILIT_BOYU} height={KILIT_BOYU} viewBox="0 0 24 24">
      <Path
        d="M7 10V7a5 5 0 0 1 10 0v3"
        stroke={renk.metinIkincil}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M5 10h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"
        stroke={renk.metinIkincil}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Baskasinin profilinde "En sik" listesinde gosterilen yer sayisi.
 *
 * Bes, kisinin aliskanligini anlatmaya yetiyor ama tam bir ziyaret
 * dokumu vermiyor - iki sey arasindaki dogru denge kullanicinin karari
 * (2026-09-10). KENDI profilinde boyle bir sinir YOK.
 */
const EN_SIK_GORUNEN = 5

/**
 * Akista ILK ACILISTA kac kart cizilir; kaydirdikca pencere buyur.
 * Kendi profil ekranindaki desenin aynisi - bu bir veri siniri degil
 * cizim penceresi.
 */
const ILK_CIZIM_ADEDI = 10
const CIZIM_ADIMI = 10

/**
 * Ust bloktaki harita dokusunun olculeri - KENDI PROFILLE AYNI
 * (`profil/index.tsx`): kuyruk 50, ust cubugun arkasina tasma 96,
 * olcum gelmeden onceki varsayilan yukseklik 94.
 */
const HARITA_KUYRUGU = 50
const HARITA_UST_TASMA = 96
const KIMLIK_VARSAYILAN = 94
const AVATAR_CAPI = 88

/**
 * Baskasinin profili.
 *
 * KENDI PROFIL EKRANIYLA AYNI DUZEN (kullanicinin tarifi 2026-09-13,
 * kendi profilinin ekran goruntusuyle): avatar solda, ad / @kullanici
 * adi / biyografi saginda, arkada isimsiz harita dokusu, altinda eylem
 * satiri, sayac karti, sekme hapi ve AKIS. Farklar:
 *
 *   - "Profili duzenle"nin yerinde "ARKADAS EKLE", yaninda "MESAJ YAZ".
 *   - Paylas ikonu SAG USTTE (kendi profildeki dislinin yerinde) -
 *     "bu profilini birine paylasmak icin kullanilir".
 *   - Ani / Fotograf / Arkadas sayaclari yalnizca SAYI (bolum secmez).
 *   - GIZLI profil: akis yerine bos alanda BUYUK bir kilit.
 *   - ACIK profil: akis kendi profildeki gibi kartlarla gorunur.
 *
 * "MESAJ YAZ" HER ZAMAN VAR ve dogrudan sohbet ekranini aciyor. Ayri
 * bir "sohbet iste" adimi YOK: mesaj istekleri modeli (2026-09-01)
 * geregi yabanci zaten TEK mesaj yazabiliyor, mesaj karsi tarafin
 * Istekler kutusuna dusuyor ve cevap yazmak kabul anlamina geliyor.
 * Sunucu (`mesaj_gonder`) kurali kendisi uyguluyor; ekranin onceden
 * bir istek gondermesi ayni isi iki kez yapmak olurdu.
 *
 * Engelleme iki adimli. Tek dokunusla engellemek geri alinamaz bir
 * eylemi kazayla tetikliyordu.
 */
export default function KullaniciProfiliEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profil, setProfil] = useState<BaskaProfil | null>(null)
  const [fotografUrlleri, setFotografUrlleri] = useState<string[]>([])
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [bagDurum, setBagDurum] = useState<Awaited<ReturnType<typeof bagDurumunuGetir>> | null>(
    null
  )
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [engelleOnayi, setEngelleOnayi] = useState(false)
  // Kendi profil ekranindaki gibi iki bakis: zaman sirasi ve en cok
  // gidilen yerler.
  const [sekme, setSekme] = useState<'anilar' | 'yerler'>('anilar')
  const [gorunenAdet, setGorunenAdet] = useState(ILK_CIZIM_ADEDI)
  const [ozetler, setOzetler] = useState<Record<string, EtkilesimOzeti>>({})
  /** Sunucuya SORULMUS kimlikler; ayni istegi iki kez atmamak icin. */
  const istenenOzetler = useRef<Set<string>>(new Set())
  const [kimlikYuksekligi, setKimlikYuksekligi] = useState(KIMLIK_VARSAYILAN)

  async function verileriYukle() {
    try {
      const [profilVerisi, anilarVerisi, bagVerisi] = await Promise.all([
        baskasininProfiliniGetir(id),
        kullanicininAnilariniGetir(id),
        bagDurumunuGetir(id),
      ])
      setProfil(profilVerisi)
      setFotografUrlleri(await profilFotograflariUrl(profilVerisi?.fotograflar ?? []))
      // Fotograf adresi `kullanicininAnilariniGetir` icinde zaten
      // imzalaniyor; burada yeniden imzalamak ayni isi iki kez yapmakti.
      setAnilar(anilarVerisi)
      setBagDurum(bagVerisi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  /**
   * KENDI PROFILIM BU EKRANDA ACILMAZ - `/profil`e yonlendiriliyor.
   *
   * Kullanicinin bildirdigi hata (2026-09-09): "yorumda kendi profilime
   * basinca sanki baskasinin profiliymis gibi gosteriyor." Gercekten
   * oyleydi: ekran kendi kimligini tanimadigi icin kisiye KENDISI icin
   * "Arkadaş ekle" gosteriyordu.
   *
   * KURAL BURADA, GIRIS NOKTALARINDA DEGIL. Onceden her cagiran taraf
   * `kisi.benimMi ? '/profil' : ...` diye kendi kontrolunu yapiyordu ve
   * ON UC yerin yalnizca IKISINDE vardi. Kontrolu buraya almak hepsini
   * birden duzeltiyor ve yarin eklenecek yeni bir giris de
   * kendiliginden dogru olur.
   *
   * `replace`, `push` DEGIL: geri tusu kullaniciyi geldigi yere
   * dondurmeli, arada olu bir ekran kalmamali.
   *
   * VERI CEKME YONLENDIRMEDEN SONRAYA BIRAKILIYOR: kimlik eslesirse
   * uc istek de bosa giderdi ("bosa is yaptirma" kurali).
   *
   * Kimlik okunamazsa (oturum yok, ag hatasi) eski davranisa duesuluyor
   * - bilmedigimiz bir sey yuzunden ekrani bos birakmak yanlis olurdu.
   */
  useEffect(() => {
    let gecerli = true
    kendiKullaniciIdim().then((benimId) => {
      if (!gecerli) return
      if (benimId && benimId === id) {
        router.replace('/profil')
        return
      }
      verileriYukle()
    })
    return () => {
      gecerli = false
    }
  }, [id])

  /*
   * BEGENI / YORUM SAYILARI - kendi profil ekranindaki desenin AYNISI:
   * yalnizca cizim penceresindeki kartlar icin soruluyor, sorulan
   * kimlikler bir ref'te tutuluyor, cevap gelmeyenler sifirla
   * dolduruluyor (sonsuz dongu korumasi; 2026-09-09'da testte
   * yakalanmisti).
   */
  useEffect(() => {
    const eksikler = anilar
      .slice(0, gorunenAdet)
      .map((a) => a.id)
      .filter((aniId) => !istenenOzetler.current.has(aniId))
    if (eksikler.length === 0) return

    eksikler.forEach((aniId) => istenenOzetler.current.add(aniId))
    let gecerli = true
    etkilesimOzetleriniGetir(eksikler)
      .then((gelen) => {
        if (!gecerli) return
        const tam: Record<string, EtkilesimOzeti> = { ...gelen }
        for (const aniId of eksikler) {
          if (!tam[aniId]) tam[aniId] = { begeni: 0, yorum: 0, begendim: false }
        }
        setOzetler((mevcut) => ({ ...mevcut, ...tam }))
      })
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [anilar, gorunenAdet])

  async function begeniDegistir(checkInId: string) {
    const onceki = ozetler[checkInId]
    if (!onceki) return
    const yeni = {
      ...onceki,
      begendim: !onceki.begendim,
      begeni: onceki.begeni + (onceki.begendim ? -1 : 1),
    }
    setOzetler((o) => ({ ...o, [checkInId]: yeni }))
    try {
      if (onceki.begendim) await begeniyiKaldir(checkInId)
      else await begen(checkInId)
    } catch {
      setOzetler((o) => ({ ...o, [checkInId]: onceki }))
    }
  }

  async function aniyiPaylas(checkInId: string) {
    const ani = anilar.find((a) => a.id === checkInId)
    if (!ani || !profil) return
    await paylas(ani.mekanAdi, profil.kullaniciAdi).catch(() => {})
  }

  function dibeYaklasinca(olay: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = olay.nativeEvent
    const dibeUzaklik = contentSize.height - (contentOffset.y + layoutMeasurement.height)
    if (dibeUzaklik > layoutMeasurement.height) return
    setGorunenAdet((mevcut) => (mevcut >= anilar.length ? mevcut : mevcut + CIZIM_ADIMI))
  }

  async function kullaniciyiEngelle() {
    try {
      await engelle(id)
      setHata(null)
      setProfil(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setEngelleOnayi(false)
    }
  }

  function sikayetEt() {
    router.push(`/sikayet?hedefTur=kullanici&hedefId=${id}`)
  }

  /**
   * PROFILI PAYLAS - sag ustteki ikon. Kendi profildeki paylasimla
   * ayni baglanti bicimi; metin ucuncu sahis ("X Slooin'de").
   */
  async function profiliPaylas() {
    if (!profil) return
    try {
      await Share.share({
        message: `${t('kullanici.paylasMetni', { ad: profil.ad, kullaniciAdi: profil.kullaniciAdi })}\nhttps://slooin.expo.app/kullanici/${profil.id}`,
      })
    } catch {
      // Web'de paylasim penceresi olmayabilir; akisi kilitlemiyoruz.
      setHata(t('profil.paylasilamadi'))
    }
  }

  async function takipEt() {
    try {
      await takipIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: 'beklemede' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function takibiBirakEt() {
    try {
      await takibiBirak(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: 'yok' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function takipIstegineYanitVer(kabul: boolean) {
    try {
      await takipIsteginiYanitla(id, kabul)
      setBagDurum((onceki) =>
        onceki ? { ...onceki, gelenTakip: kabul ? 'kabul' : 'yok' } : onceki
      )
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function sohbetIstegineYanitVer(kabul: boolean) {
    try {
      await sohbetIsteginiYanitla(id, kabul)
      setBagDurum((onceki) =>
        onceki ? { ...onceki, gelenSohbet: kabul ? 'kabul' : 'yok' } : onceki
      )
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // Aramizda bir bag var mi: arkadaslik ya da kabul edilmis sohbet.
  // Kapali profili ACAN sey bu.
  const bagVar =
    bagDurum?.takip === 'kabul' ||
    bagDurum?.sohbet === 'kabul' ||
    bagDurum?.gelenSohbet === 'kabul'

  /**
   * "En sik" gorunumu: ayni anilardan gruplaniyor, sunucuda yeni bir
   * sorgu yok. BASKASININ PROFILINDE YALNIZCA ILK BES (kullanicinin
   * karari 2026-09-10). SINIR ISTEMCIDE ve bu bir GIZLILIK SINIRI
   * DEGIL - anilarin gercek korumasi `check_inler` RLS'inde.
   */
  const yerler = (() => {
    const sayac = new Map<string, { ad: string; semt: string | null; adet: number }>()
    anilar.forEach((a) => {
      const mevcut = sayac.get(a.mekanId)
      if (mevcut) mevcut.adet += 1
      else sayac.set(a.mekanId, { ad: a.mekanAdi, semt: a.mekanSemti, adet: 1 })
    })
    return [...sayac.entries()]
      .map(([mekanId, v]) => ({ mekanId, ...v }))
      .sort((a, b) => b.adet - a.adet || a.ad.localeCompare(b.ad, 'tr'))
      .slice(0, EN_SIK_GORUNEN)
  })()

  /**
   * KAPALI PROFIL. Kisi "profilim gizli" demis ve aranizda bag yok.
   * Ust blok AYNI kaliyor, akisin yerinde buyuk bir kilit duruyor.
   * Bu bir GORUNUM karari, guvenlik siniri degil: anilarin gercek
   * korumasi `check_inler` RLS'inde ve o zaten devrede.
   */
  const kapali = (profil?.profilGizli ?? false) && !bagVar

  const fotografUrl = fotografUrlleri[0] ?? null

  const ustCubuk = (
    <View style={stiller.ustCubuk}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('kullanici.geri')}
        hitSlop={12}
      >
        <GeriIkonu />
      </Pressable>
      {/* PAYLAS SAG USTTE (kullanicinin tarifi 2026-09-13) - kendi
          profildeki dislinin yerinde. Ust cubukta baslik YOK: kendi
          profilde de yok, kullanici adi avatarin yaninda. */}
      {profil && (
        <Pressable
          onPress={profiliPaylas}
          accessibilityRole="button"
          accessibilityLabel={t('kullanici.paylas')}
          hitSlop={12}
          testID="profili-paylas"
        >
          <PaylasIkonu boyut={24} />
        </Pressable>
      )}
    </View>
  )

  if (!profil) {
    return (
      <View style={stiller.kok}>
        {ustCubuk}
        <View style={stiller.icerik}>
          {hata && <Text style={stiller.hata}>{hata}</Text>}
          {!yukleniyor && <Text style={stiller.durum}>{t('kullanici.bulunamadi')}</Text>}
        </View>
      </View>
    )
  }

  return (
    <View style={stiller.kok}>
      {ustCubuk}

      <ScrollView
        testID="kullanici-kaydirma"
        contentContainerStyle={stiller.icerik}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={160}
        onScroll={dibeYaklasinca}
      >
        {/* KIMLIK BLOGU - kendi profille AYNI: avatar solda, bilgiler
            saginda, arkada isimsiz harita dokusu. Doku kimlik blogunun
            OLCUELEN yuksekligine gore uzuyor (biyografi 1-5 satir). */}
        <View style={stiller.kimlikKap}>
          <ProfilHaritaZemini
            yukseklik={kimlikYuksekligi + HARITA_KUYRUGU}
            ustTasma={HARITA_UST_TASMA}
          />

          <View
            style={stiller.kimlik}
            onLayout={(o) => setKimlikYuksekligi(o.nativeEvent.layout.height)}
          >
            {fotografUrl ? (
              <Image
                testID="profil-fotografi"
                source={{ uri: fotografUrl }}
                style={stiller.avatar}
              />
            ) : (
              <BasHarfAvatar
                ad={profil.ad || profil.kullaniciAdi}
                cap={AVATAR_CAPI}
                testID="bos-avatar"
              />
            )}

            <View style={stiller.kimlikBilgi}>
              <Text style={stiller.ad} numberOfLines={1}>
                {profil.ad}
              </Text>
              <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                @{profil.kullaniciAdi}
              </Text>
              {profil.biyografi ? <Text style={stiller.biyografi}>{profil.biyografi}</Text> : null}
              {bolgeMetni(profil.yasadigiIl, profil.yasadigiIlce) ? (
                <Text style={stiller.bolge} testID="profil-bolgesi">
                  {bolgeMetni(profil.yasadigiIl, profil.yasadigiIlce)}
                </Text>
              ) : null}
              {/* INSTAGRAM BEYANI - KAPALI PROFILDE DE gorunuyor:
                  biyografi gibi kisinin kendi yayinladigi bir bilgi;
                  gizlilik ayari AKISI kapatiyor, kimlik satirini degil. */}
              {profil.instagram ? <InstagramSatiri kullaniciAdi={profil.instagram} /> : null}
            </View>
          </View>

          {/* EYLEM SATIRI: "Arkadas ekle" + "Mesaj yaz", kendi
              profildeki "Profili duzenle" olcusunde (yukseklik 40).
              Arkadas butonu baga gore uc halde: ekle / beklemede /
              arkadassin. Beklemede ve arkadassin BASILAMAZ - karar
              karsi tarafta ya da zaten verilmis; geri cekmek ve
              cikmak asagidaki ikincil satirda. */}
          <View style={stiller.eylemler}>
            {bagDurum?.takip === 'kabul' ? (
              <View style={[stiller.eylemButonu, stiller.eylemDurum]} testID="arkadas-durumu">
                <Text style={stiller.eylemDurumYazi}>{t('kullanici.arkadassin')}</Text>
              </View>
            ) : bagDurum?.takip === 'beklemede' ? (
              <View style={[stiller.eylemButonu, stiller.eylemDurum]} testID="arkadas-durumu">
                <Text style={stiller.eylemDurumYazi}>{t('kullanici.istekBeklemede')}</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [stiller.eylemButonu, pressed && stiller.eylemBasili]}
                onPress={takipEt}
                accessibilityRole="button"
                testID="arkadas-ekle"
              >
                <Text style={stiller.eylemYazi}>{t('kullanici.takipEt')}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [stiller.eylemButonu, pressed && stiller.eylemBasili]}
              onPress={() => router.push(`/sohbet/${id}`)}
              accessibilityRole="button"
              testID="mesaj-yaz"
            >
              <Text style={stiller.eylemYazi}>{t('kullanici.mesajYaz')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Ikincil bag eylemleri: yalnizca gerektiginde ciziliyor. */}
        {(bagDurum?.takip === 'beklemede' || bagDurum?.takip === 'kabul') && (
          <View style={stiller.ikincilSatir}>
            {bagDurum.takip === 'beklemede' && (
              <Pressable onPress={takibiBirakEt} accessibilityRole="button" hitSlop={8}>
                <Text style={stiller.ikincilYazi}>{t('kullanici.istegiGeriCek')}</Text>
              </Pressable>
            )}
            {bagDurum.takip === 'kabul' && (
              <Pressable onPress={takibiBirakEt} accessibilityRole="button" hitSlop={8}>
                <Text style={stiller.ikincilYazi}>{t('kullanici.bagiKopar')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {bagDurum?.gelenTakip === 'beklemede' && (
          <View style={stiller.istekKarti}>
            <Text style={stiller.istekAciklama}>{t('kullanici.gelenIstekAciklama')}</Text>
            <View style={stiller.istekButonlari}>
              <Pressable
                style={stiller.birincilKucuk}
                onPress={() => takipIstegineYanitVer(true)}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilKucukYazi}>{t('kullanici.kabulEt')}</Text>
              </Pressable>
              <Pressable
                onPress={() => takipIstegineYanitVer(false)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={stiller.ikincilYazi}>{t('kullanici.reddet')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {bagDurum?.gelenSohbet === 'beklemede' && (
          <View style={stiller.istekKarti}>
            <View style={stiller.istekButonlari}>
              <Pressable
                style={stiller.birincilKucuk}
                onPress={() => sohbetIstegineYanitVer(true)}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilKucukYazi}>{t('kullanici.kabulEt')}</Text>
              </Pressable>
              <Pressable
                onPress={() => sohbetIstegineYanitVer(false)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={stiller.ikincilYazi}>{t('kullanici.reddet')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* FOTOGRAF SERIDI: ilk fotograf avatarda, kalanlar burada.
            Kendi profilde fotograflar ayri bir sekme; burada sekmeler
            Anilar/En sik ile dolu. */}
        {fotografUrlleri.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={stiller.serit}
          >
            {fotografUrlleri.slice(1).map((url) => (
              <Image
                key={url}
                testID="profil-fotografi"
                source={{ uri: url }}
                style={stiller.seritFotografi}
              />
            ))}
          </ScrollView>
        )}

        {/* SAYACLAR YALNIZCA SAYI (kullanicinin tarifi 2026-09-13):
            `onSec` verilmedigi icin satir salt okunur, bolum secmiyor. */}
        <ProfilSayaclari
          sayilar={{
            anilar: anilar.length,
            fotograflar: fotografUrlleri.length,
            arkadaslar: profil.arkadasSayisi,
          }}
        />

        {/* SEKME HAPI KAPALI PROFILDE CIZILMIYOR: secilecek bir sey
            yokken secici gostermek bozuk bir kontrol sunar. */}
        {!kapali && (
          <SekmeHapi
            sekmeler={[
              { anahtar: 'anilar' as const, etiket: t('kullanici.anilar') },
              { anahtar: 'yerler' as const, etiket: t('kullanici.enSik') },
            ]}
            secili={sekme}
            onSec={setSekme}
          />
        )}

        {kapali ? (
          <View style={stiller.kilitAlani} testID="profil-kilitli">
            <KilitIkonu />
            <Text style={stiller.bosBaslik}>{t('kullanici.profilKapali')}</Text>
            <Text style={stiller.bosAciklama}>{t('kullanici.profilKapaliAciklama')}</Text>
          </View>
        ) : sekme === 'yerler' ? (
          yerler.length === 0 ? (
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('kullanici.yerYok')}</Text>
            </View>
          ) : (
            yerler.map((yer, i) => (
              <Pressable
                key={yer.mekanId}
                style={stiller.yerSatiri}
                onPress={() => router.push(`/harita/${yer.mekanId}` as never)}
                accessibilityRole="button"
              >
                <SiraRozeti sira={i + 1} />
                <View style={stiller.yerOrta}>
                  <Text style={stiller.yerAd} numberOfLines={1}>
                    {yer.ad}
                  </Text>
                  {yer.semt ? <Text style={stiller.yerSemt}>{yer.semt}</Text> : null}
                </View>
                <Text style={stiller.yerAdet}>{t('profil.kezSayisi', { sayi: yer.adet })}</Text>
              </Pressable>
            ))
          )
        ) : anilar.length === 0 ? (
          <View style={stiller.bosAlan}>
            <Text style={stiller.bosBaslik}>{t('kullanici.aniYok')}</Text>
          </View>
        ) : (
          /* AKIS KARTLARI - kendi profildekiyle AYNI bilesen (kullanicinin
             tarifi: "profili acik birinin ... akisi paylasimlari gorunur").
             `benimMi: false`: menu (duzenle/sil) yok, ad ve avatar bu
             kisinin profiline gidiyor. Kartlar sayfa payinin DISINDA, ana
             sayfadaki gibi tam genislikte. */
          <View style={stiller.aniListesi}>
            {anilar.slice(0, gorunenAdet).map((ani) => (
              <CheckInKarti
                key={ani.id}
                oge={anidanAkisOgesi(ani, {
                  kullaniciId: profil.id,
                  avatarUrl: fotografUrl,
                  rumuz: profil.kullaniciAdi,
                  benimMi: false,
                })}
                zamanYazisi={gorecelZaman(ani.olusturmaZamani, t)}
                ozet={ozetler[ani.id]}
                onBegen={begeniDegistir}
                onYorumSayisi={(aniId, sayi) =>
                  setOzetler((mevcut) =>
                    mevcut[aniId] ? { ...mevcut, [aniId]: { ...mevcut[aniId], yorum: sayi } } : mevcut
                  )
                }
                onPaylas={aniyiPaylas}
              />
            ))}
          </View>
        )}

        {/* SIKAYET VE ENGELLEME en altta: yikici eylemler kompozisyonda
            once gelmemeli. Engelleme iki adimli - geri alinamaz. */}
        <View style={stiller.guvenlikAlani}>
          <Pressable onPress={sikayetEt} accessibilityRole="button" hitSlop={8}>
            <Text style={stiller.guvenlikYazi}>{t('kullanici.sikayetEt')}</Text>
          </Pressable>
          <Pressable onPress={() => setEngelleOnayi(true)} accessibilityRole="button" hitSlop={8}>
            <Text style={stiller.guvenlikYazi}>{t('kullanici.engelle')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <OnayPenceresi
        acikMi={engelleOnayi}
        baslik={t('kullanici.engelle')}
        aciklama={t('kullanici.engelleOnayi')}
        eylemEtiketi={t('kullanici.engelleEvet')}
        onOnay={kullaniciyiEngelle}
        onVazgec={() => setEngelleOnayi(false)}
      />
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },

  /* Geri solda, paylas sagda. Ust pay kendi profildeki cubukla ayni
     hizada durmasi icin kok duzenin verdigi guvenli alanin ustune
     yalnizca kucuk bir pay. */
  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.l,
    paddingBottom: bosluk.xs,
    // Paylas ikonu sag kenardan "cok az" iceride - kendi profildeki
    // disliyle ayni (2026-09-13).
    paddingRight: bosluk.sayfa + 6,
  },

  icerik: {
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  /* KIMLIK KABI: harita dokusunun capasi; `position: relative` sart. */
  kimlikKap: { position: 'relative' as const },
  kimlik: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: bosluk.l,
    paddingTop: 0,
    paddingBottom: bosluk.l,
  },
  kimlikBilgi: { flex: 1, minWidth: 0 },
  avatar: {
    width: AVATAR_CAPI,
    height: AVATAR_CAPI,
    borderRadius: AVATAR_CAPI / 2,
    // Zeminden fotografi ayiran beyaz halka - kendi profille ayni.
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  ad: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kullaniciAdi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    marginTop: 1,
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: 4,
  },
  bolge: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  /* EYLEM SATIRI: iki esit buton, kendi profildeki olcude (40). */
  eylemler: { flexDirection: 'row' as const, gap: bosluk.s, marginTop: bosluk.m },
  eylemButonu: {
    flex: 1,
    height: 40,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  eylemYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  /* Basili hal: dolgu koyulasiyor (opaklik dusurmek "yukleniyor" gibi
     okunuyordu, 2026-09-07 dersi). */
  eylemBasili: { backgroundColor: renk.cizgi },
  /* DURUM (beklemede / arkadassin): basilamaz, dolgu notr. Turuncu
     birakip yalnizca opaklik dusurmek "yukleniyor" gibi okunurdu. */
  eylemDurum: { backgroundColor: renk.cizgi },
  eylemDurumYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },

  ikincilSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.xl,
    marginTop: bosluk.m,
  },
  ikincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },

  serit: { gap: bosluk.s, paddingVertical: bosluk.l },
  seritFotografi: { width: 88, height: 110, borderRadius: yuvarlak.kart - 4 },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginTop: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
  },

  istekKarti: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: bosluk.l,
    marginTop: bosluk.l,
    ...golge.kart,
  },
  istekAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginBottom: bosluk.m,
  },
  istekButonlari: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l },
  birincilKucuk: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 10,
    paddingHorizontal: bosluk.sayfa,
  },
  birincilKucukYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },

  /* KILIT ALANI: sayfanin bos alt yarisi; ikon buyuk ve ortada. */
  kilitAlani: {
    alignItems: 'center',
    paddingTop: bosluk.xxl + bosluk.xl,
    paddingBottom: bosluk.xxl,
    gap: bosluk.m,
  },
  bosAlan: { alignItems: 'center', paddingVertical: bosluk.xxl, gap: bosluk.s },
  bosBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    textAlign: 'center',
  },

  /* "En sik" satirlari - kendi profildeki desenin aynisi. */
  yerSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  yerOrta: { flex: 1 },
  yerAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  yerSemt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
  yerAdet: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 4,
    paddingHorizontal: bosluk.m,
    overflow: 'hidden',
  },

  /* Kartlar sayfa payinin disinda, ana sayfadaki gibi tam genislikte. */
  aniListesi: { marginHorizontal: -bosluk.sayfa },

  guvenlikAlani: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: bosluk.l,
    marginTop: bosluk.xxl,
  },
  guvenlikYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    // metinSoluk denendi ve birakildi: sayfa zemininde kontrast ~2.3:1
    // kaliyordu. Sikayet ve engelleme guvenlik eylemleri; sessiz
    // durabilirler ama okunmaz olamazlar.
    color: renk.metinIkincil,
  },
})
