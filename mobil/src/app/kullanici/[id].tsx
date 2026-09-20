import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
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
import { kullaniciyiSikayetEttimMi } from '../../../lib/sikayet'
import { SiraRozeti } from '../../tasarim/SiraRozeti'
import { CheckInKarti } from '../../tasarim/CheckInKarti'
import { SekmeHapi } from '../../tasarim/SekmeHapi'
import { AnilarSekmeIkonu, EnSikSekmeIkonu } from '../../tasarim/sekme-ikonlari'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { FotografGezgini } from '../../tasarim/FotografGezgini'
import { FotografAltyazisi } from '../../tasarim/FotografAltyazisi'
import { useSekmeParametresi } from '../../../lib/sekme-parametresi'
import { profilBaglantisi, sistemPaylasimi } from '../../../lib/paylasim'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SecimPenceresi, UcNoktaIkonu } from '../../tasarim/SecimPenceresi'
import { DurumGecisi } from '../../tasarim/DurumGecisi'
import {
  bagDurumunuGetir,
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIsteginiYanitla,
} from '../../../lib/bag'

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
/* Uc nokta dugmesinin capi. Eskiden ust cubuktaydi ve geri okuyla ayni
   agirlikta olsun diye 40 idi; cubuk kalkinca olcu korundu. */
const MENU_CAPI = 40
/* Ust cubuk kalktiktan sonra kimlik blogunun guvenli alandan payi.
   Hem `kimlik` hem de kosedeki menu bunu kullaniyor ki avatarla dugme
   ayni hizada bassin. */
const KIMLIK_UST_PAYI = 16

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
const KULLANICI_SEKMELERI = ['anilar', 'yerler'] as const

export default function KullaniciProfiliEkrani() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
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
  const [guvenlikMenusu, setGuvenlikMenusu] = useState(false)
  // Bu kisiyi daha once sikayet ettiysem menudeki "Sikayet et" yine
  // durur; basinca sikayet ekrani yerine "Bu kullaniciyi sikayet ettin"
  // UYARISI acilir (kullanicinin istegi 2026-09-20 - 2026-09-19'un
  // kimlik blogundaki notu ve pasif "Sikayet edildi" satiri KALKTI:
  // sikayet etmis olmak profilde surekli gorunen bir damga olmasin).
  // Ekran her odaklandiginda yeniden okunuyor: sikayet ekranindan
  // donuste durum aninda degissin.
  const [sikayetEdildi, setSikayetEdildi] = useState(false)
  const [sikayetUyarisi, setSikayetUyarisi] = useState(false)
  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      kullaniciyiSikayetEttimMi(id).then((d) => {
        if (gecerli) setSikayetEdildi(d)
      })
      return () => {
        gecerli = false
      }
    }, [id])
  )
  // Ani kartindan acilan fotograf gezgini: bu kisinin fotografli
  // anilari arasinda saga-sola kaydirma (kullanicinin istegi 2026-09-18).
  const [acikFotografIndeksi, setAcikFotografIndeksi] = useState<number | null>(null)
  // Profil fotograflari (avatar + serit) icin AYRI gezgin: liste
  // farkli (kisinin profil fotograflari, anilar degil). Kullanicinin
  // istegi 2026-09-18: "basinca buyuk acilsin o da".
  const [acikProfilFotografi, setAcikProfilFotografi] = useState<number | null>(null)
  // Kendi profil ekranindaki gibi iki bakis: zaman sirasi ve en cok
  // gidilen yerler. Secim rota parametresinde (geri donuste korunur).
  const [sekme, setSekme] = useSekmeParametresi(KULLANICI_SEKMELERI, 'anilar')
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
    if (sikayetEdildi) {
      setSikayetUyarisi(true)
      return
    }
    router.push(`/sikayet?hedefTur=kullanici&hedefId=${id}`)
  }

  /**
   * PROFILI PAYLAS - sag ustteki ikon. Kendi profildeki paylasimla
   * ayni baglanti bicimi; metin ucuncu sahis ("X Slooin'de").
   */
  async function profiliPaylas() {
    if (!profil) return
    try {
      await sistemPaylasimi({
        message: `${t('kullanici.paylasMetni', { ad: profil.ad, kullaniciAdi: profil.kullaniciAdi })}\n${profilBaglantisi(profil.kullaniciAdi)}`,
      })
    } catch {
      // Web'de paylasim penceresi olmayabilir; akisi kilitlemiyoruz.
      setHata(t('profil.paylasilamadi'))
    }
  }

  async function takipEt() {
    try {
      // Sunucu karar verir (2026-09-18): ACIK profilde istek yok, bag
      // hemen kurulur ('kabul'); GIZLI profilde istek gider ('beklemede').
      const sonuc = await takipIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: sonuc } : onceki))
      if (sonuc === 'kabul') {
        // Arkadas sayaci da aninda bir artar; yeniden cekmeye gerek yok.
        setProfil((onceki) => (onceki ? { ...onceki, arkadasSayisi: onceki.arkadasSayisi + 1 } : onceki))
      }
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // "Arkadassin" dugmesi (kullanicinin istegi 2026-09-14): basinca
  // "Arkadasliktan cikar" secenegi acilir; ayri satir yok.
  const [arkadasMenusu, setArkadasMenusu] = useState(false)
  // Ust pay BURADA veriliyor, kok duzende degil (kendi profille ayni):
  // harita dokusu saatin ardina kadar uzaniyor.
  const guvenliAlan = useSafeAreaInsets()

  // "Beklemede"ye basinca once onay (kullanicinin istegi 2026-09-17):
  // istek bir dokunusla kazara geri cekilmesin.
  const [geriCekOnayi, setGeriCekOnayi] = useState(false)

  async function takibiBirakEt() {
    setArkadasMenusu(false)
    setGeriCekOnayi(false)
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

  // Kapali profili ACAN tek sey ARKADASLIK (kullanicinin bildirimi
  // 2026-09-20: "profili gizli birinin ekrani acik gorunuyor" - canlida
  // aralarinda arkadaslik yok, yalnizca kabul edilmis bir sohbet istegi
  // vardi ve o da bag sayiliyordu). Sohbet 2026-09-01'den beri
  // yabancinin da yazabildigi bir kapi; kimlik guvencesi degil. Sunucu
  // (check_inler RLS) anilari zaten yalnizca arkadasa aciyor - ekran o
  // kuralla ayni cizgiye cekildi.
  const bagVar = bagDurum?.takip === 'kabul'

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
  // Gezginin listesi: yalnizca fotografli anilar, akistaki sirayla.
  const fotografliAnilar = anilar.filter((a) => a.fotografUrl)

  /*
   * UST CUBUK YOK ARTIK (kullanicinin istegi 2026-09-18): "ustte soldaki
   * geri gitme dugmesini kaldir ve dizilimi tekrar duzenle".
   *
   * Geri oku kalkinca cubukta tek basina uc nokta kaliyordu ve o
   * cubuk sayfanin tepesinde 60 px'lik bos bir serit tutuyordu. Cubuk
   * tamamen kaldirildi; uc nokta kimlik blogunun SAG UST kosesine
   * MUTLAK konumlandi, boylece kimlik blogu (ve arkasindaki harita
   * dokusu) yukari kaydi. Blok SIRASI degismedi - kullanicinin secimi
   * "sira ayni, sadece yukari kaysin" idi.
   *
   * Geri donus: iOS'ta kenardan kaydirma, Android'de donanim tusu,
   * web'de tarayici geri. Ekran alt gezinmenin uzerinde durdugu icin
   * kimse sayfada kilitli kalmiyor.
   *
   * Ikon SEFTALI DAIREDE ve koyu (2026-09-17): soluk gri uc nokta
   * beyaz zeminde kayboluyordu. Daire kesfetteki suzgec dugmesiyle
   * ayni desen, 40 px.
   */
  const menuKosesi = profil && (
    <Pressable
      style={({ pressed }) => [
        stiller.menuKosesi,
        stiller.menuDugmesi,
        pressed && stiller.menuDugmesiBasili,
      ]}
      onPress={() => setGuvenlikMenusu(true)}
      accessibilityRole="button"
      accessibilityLabel={t('kullanici.secenekler')}
      hitSlop={8}
      testID="kullanici-menusu"
    >
      <UcNoktaIkonu boyut={24} renk={renk.metin} />
    </Pressable>
  )

  if (!profil) {
    return (
      <View style={[stiller.kok, { paddingTop: guvenliAlan.top }]}>
        <View style={stiller.icerik}>
          {hata && <Text style={stiller.hata}>{hata}</Text>}
          {!yukleniyor && <Text style={stiller.durum}>{t('kullanici.bulunamadi')}</Text>}
        </View>
      </View>
    )
  }

  /*
   * SIRA PROFILIN DURUMUNA GORE (kullanicinin istegi 2026-09-17):
   *
   *   GIZLI profil : kimlik -> SAYACLAR -> butonlar -> kilit
   *   ACIK profil  : kimlik -> butonlar -> ... -> sayaclar -> sekmeler
   *
   * Gizli profilde gorulecek bir akis yok; sayfada kalan tek bilgi
   * sayilar, o yuzden once onlar geliyor ve butonlar sayfanin
   * govdesine yapisiyor. Acik profilde eski duzen AYNEN duruyor -
   * kural yalnizca gizli hali degistirdi (kural 11).
   */
  /*
   * EYLEM SATIRI: "Arkadaş ekle" + "Mesaj yaz", kendi profildeki
   * "Profili düzenle" olcusunde (yukseklik 40). Arkadas butonu baga
   * gore uc halde: ekle / beklemede / arkadassin. Ucu de BASILABILIR
   * (kullanicinin istegi 2026-09-17): ekle dolu turuncu, istek gidince
   * ayni dugme "Beklemede" olur ve ona tekrar basmak istegi geri ceker;
   * ayri "Isteği geri cek" satiri yok. Arkadassin menu acar.
   */
  const eylemSatiri = (
    <View style={stiller.eylemler}>
      {/* DURUM GECISI (2026-09-20): uc hal arasinda teleport degil,
          110 ms sol + 110 ms belir. Dugmelerin kendisi degismedi. */}
      <DurumGecisi anahtar={bagDurum?.takip === 'kabul' ? 'arkadas' : bagDurum?.takip === 'beklemede' ? 'beklemede' : 'ekle'} style={stiller.eylemGecis}>
      {bagDurum?.takip === 'kabul' ? (
        <Pressable
          style={({ pressed }) => [stiller.eylemButonu, stiller.eylemArkadas, pressed && stiller.eylemArkadasBasili]}
          onPress={() => setArkadasMenusu(true)}
          accessibilityRole="button"
          testID="arkadas-durumu"
        >
          {/* TIK (kullanicinin istegi 2026-09-18): "arkadas oldugunu belli
              etsin". Yaziyla ayni turuncu, ayni satirda. */}
          <ArkadasTikIkonu />
          <Text style={stiller.eylemArkadasYazi}>{t('kullanici.arkadassin')}</Text>
        </Pressable>
      ) : bagDurum?.takip === 'beklemede' ? (
        <Pressable
          style={({ pressed }) => [stiller.eylemButonu, stiller.eylemDurum, pressed && stiller.eylemDurumBasili]}
          onPress={() => setGeriCekOnayi(true)}
          accessibilityRole="button"
          accessibilityLabel={t('kullanici.istegiGeriCek')}
          testID="arkadas-durumu"
        >
          <Text style={stiller.eylemDurumYazi}>{t('kullanici.istekBeklemede')}</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [stiller.eylemButonu, stiller.eylemBirincil, pressed && stiller.eylemBirincilBasili]}
          onPress={takipEt}
          accessibilityRole="button"
          testID="arkadas-ekle"
        >
          <Text style={stiller.eylemBirincilYazi}>{t('kullanici.takipEt')}</Text>
        </Pressable>
      )}
      </DurumGecisi>
      <Pressable
        style={({ pressed }) => [stiller.eylemButonu, stiller.eylemBirincil, pressed && stiller.eylemBirincilBasili]}
        onPress={() => router.push(`/sohbet/${id}`)}
        accessibilityRole="button"
        testID="mesaj-yaz"
      >
        <Text style={stiller.eylemBirincilYazi}>{t('kullanici.mesajYaz')}</Text>
      </Pressable>
    </View>
  )

  /*
   * SAYACLAR YALNIZCA SAYI (kullanicinin tarifi 2026-09-13):
   * `onSec` verilmedigi icin satir salt okunur, bolum secmiyor.
   */
  const sayacSatiri = (
    <ProfilSayaclari
      sayilar={{
        anilar: anilar.length,
        fotograflar: fotografUrlleri.length,
        arkadaslar: profil.arkadasSayisi,
      }}
    />
  )

  return (
    <View style={stiller.kok}>
      <ScrollView
        testID="kullanici-kaydirma"
        contentContainerStyle={[stiller.icerik, { paddingTop: guvenliAlan.top }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={160}
        onScroll={dibeYaklasinca}
      >
        {/* KIMLIK BLOGU - kendi profille AYNI: avatar solda, bilgiler
            saginda, arkada isimsiz harita dokusu. Doku kimlik blogunun
            OLCUELEN yuksekligine gore uzuyor (biyografi 1-5 satir).
            Ust tasma guvenli alani da kapsiyor: kenar ekranin DISINDA.
            Uc nokta menusu bu kabin sag ust kosesinde duruyor (ust
            cubuk kalktigi icin); doku onun da arkasindan geciyor. */}
        <View style={stiller.kimlikKap}>
          <ProfilHaritaZemini
            yukseklik={kimlikYuksekligi + HARITA_KUYRUGU}
            ustTasma={HARITA_UST_TASMA + guvenliAlan.top}
          />

          {menuKosesi}

          <View
            style={stiller.kimlik}
            onLayout={(o) => setKimlikYuksekligi(o.nativeEvent.layout.height)}
          >
            {fotografUrl ? (
              <Pressable
                onPress={() => setAcikProfilFotografi(0)}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('kullanici.fotografiAc')}
              >
                <Image
                  testID="profil-fotografi"
                  source={{ uri: fotografUrl }}
                  style={stiller.avatar}
                />
              </Pressable>
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
              {/* Oturdugu bolge GOSTERILMEZ (2026-09-18 aksam); sunucu
                  zaten dondurmuyor. */}
              {/* INSTAGRAM BEYANI - KAPALI PROFILDE DE gorunuyor:
                  biyografi gibi kisinin kendi yayinladigi bir bilgi;
                  gizlilik ayari AKISI kapatiyor, kimlik satirini degil. */}
              {profil.instagram ? <InstagramSatiri kullaniciAdi={profil.instagram} /> : null}
            </View>
          </View>

        </View>

        {kapali ? (
          <>
            {sayacSatiri}
            {eylemSatiri}
          </>
        ) : (
          eylemSatiri
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
            {fotografUrlleri.slice(1).map((url, i) => (
              <Pressable
                key={url}
                /* Seritteki i. fotograf listede i+1: ilki avatarda. */
                onPress={() => setAcikProfilFotografi(i + 1)}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('kullanici.fotografiAc')}
              >
                <Image
                  testID="profil-fotografi"
                  source={{ uri: url }}
                  style={stiller.seritFotografi}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {!kapali && sayacSatiri}

        {/* SEKME HAPI KAPALI PROFILDE CIZILMIYOR: secilecek bir sey
            yokken secici gostermek bozuk bir kontrol sunar. */}
        {!kapali && (
          <SekmeHapi
            sekmeler={[
              {
                anahtar: 'anilar' as const,
                etiket: t('kullanici.anilar'),
                ikon: (renk) => <AnilarSekmeIkonu renk={renk} />,
              },
              {
                anahtar: 'yerler' as const,
                etiket: t('kullanici.enSik'),
                ikon: (renk) => <EnSikSekmeIkonu renk={renk} />,
              },
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
                onFotografAc={() =>
                  setAcikFotografIndeksi(fotografliAnilar.findIndex((f) => f.id === ani.id))
                }
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

      </ScrollView>

      <SecimPenceresi
        acikMi={guvenlikMenusu}
        secimler={[
          { etiket: t('kullanici.paylas'), testID: 'menu-paylas', onSec: profiliPaylas },
          { etiket: t('kullanici.sikayetEt'), testID: 'menu-sikayet', onSec: sikayetEt },
          {
            etiket: t('kullanici.engelle'),
            testID: 'menu-engelle',
            yikici: true,
            onSec: () => setEngelleOnayi(true),
          },
        ]}
        onKapat={() => setGuvenlikMenusu(false)}
      />
      <SecimPenceresi
        acikMi={arkadasMenusu}
        secimler={[
          {
            etiket: t('kullanici.bagiKopar'),
            testID: 'menu-arkadasliktan-cik',
            yikici: true,
            onSec: takibiBirakEt,
          },
        ]}
        onKapat={() => setArkadasMenusu(false)}
      />
      {/* ANI KARTINDAN ACILAN BUYUK GORUNUM: ortak gezgin. Ad ve avatar
          basilabilir DEGIL - zaten bu kisinin profilindeyiz; mekan adi
          mekan sayfasina gidiyor. */}
      <FotografGezgini
        testID="kullanici"
        fotograflar={fotografliAnilar.map((a) => ({ id: a.id, url: a.fotografUrl as string }))}
        acikIndeks={acikFotografIndeksi}
        onIndeks={setAcikFotografIndeksi}
        onKapat={() => setAcikFotografIndeksi(null)}
        altyazi={(i) => {
          const acik = fotografliAnilar[i]
          return (
            <FotografAltyazisi
              testID="kullanici-fotograf-altyazisi"
              avatarUrl={fotografUrl}
              kullaniciAdi={profil?.kullaniciAdi ?? null}
              mekanAdi={acik.mekanAdi}
              zamanYazisi={gorecelZaman(acik.olusturmaZamani, t)}
              onMekan={() => {
                const mekanId = acik.mekanId
                setAcikFotografIndeksi(null)
                router.push(`/harita/${mekanId}` as never)
              }}
            />
          )
        }}
      />
      {/* PROFIL FOTOGRAFLARI GEZGINI: avatar ya da seritten acilir,
          kisinin butun profil fotograflari arasinda kaydirilir. Altyazi
          yalnizca ad - mekan ve zaman bu fotograflara ait degil. */}
      <FotografGezgini
        testID="profil-fotograflari"
        fotograflar={fotografUrlleri.map((url, i) => ({ id: String(i), url }))}
        acikIndeks={acikProfilFotografi}
        onIndeks={setAcikProfilFotografi}
        onKapat={() => setAcikProfilFotografi(null)}
        altyazi={() => (
          <FotografAltyazisi
            testID="profil-fotograflari-altyazisi"
            avatarUrl={fotografUrl}
            kullaniciAdi={profil?.kullaniciAdi ?? null}
            mekanAdi={null}
            zamanYazisi=""
          />
        )}
      />
      <OnayPenceresi
        acikMi={geriCekOnayi}
        baslik={t('kullanici.istegiGeriCek')}
        aciklama={t('kullanici.geriCekOnayi')}
        eylemEtiketi={t('kullanici.geriCekEvet')}
        yikici={false}
        onOnay={takibiBirakEt}
        onVazgec={() => setGeriCekOnayi(false)}
      />
      <OnayPenceresi
        acikMi={sikayetUyarisi}
        baslik={t('kullanici.sikayetEttinNotu')}
        aciklama={t('kullanici.sikayetEttinAciklama')}
        eylemEtiketi={t('ortak.tamam')}
        yikici={false}
        tekDugme
        onOnay={() => setSikayetUyarisi(false)}
        onVazgec={() => setSikayetUyarisi(false)}
      />
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

  menuDugmesi: {
    width: MENU_CAPI,
    height: MENU_CAPI,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuDugmesiBasili: { backgroundColor: renk.cizgi },
  /* Uc nokta, kimlik kabinin sag ust kosesinde MUTLAK: akista yer
     kaplamadigi icin kimlik blogu yukari kayabiliyor. Ust hizasi
     avatarin ust hizasiyla ayni (`kimlik` ile ayni paddingTop). Sag
     kenardan 6 px iceride - eski ust cubuktaki ile ayni. */
  menuKosesi: {
    position: 'absolute' as const,
    top: KIMLIK_UST_PAYI,
    right: 6,
    zIndex: 2,
  },

  icerik: {
    // Yan pay 8: akis kartiyla ayni hiza (kullanicinin istegi 2026-09-18).
    paddingHorizontal: bosluk.s,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  /* KIMLIK KABI: harita dokusunun capasi; `position: relative` sart. */
  kimlikKap: { position: 'relative' as const },
  kimlik: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: bosluk.l,
    // Ust cubuk kalkti; durum cubugunun altinda nefes payi birakan
    // tek pay bu. Menu dugmesi de ayni degeri kullaniyor ki avatarla
    // ayni hizada dursun.
    paddingTop: KIMLIK_UST_PAYI,
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
  /* AD ve @kullanici_adi kosedeki menu dugmesiyle AYNI hizada duruyor,
     o yuzden ikisi de dugmenin genisligi kadar sagdan iceride kaliyor -
     yoksa uzun bir ad dugmenin altina girer. Biyografi ve bolge
     dugmenin ALTINDA kaldigi icin tam genislikte. */
  ad: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    paddingRight: MENU_CAPI + bosluk.s,
  },
  kullaniciAdi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    marginTop: 1,
    paddingRight: MENU_CAPI + bosluk.s,
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: 4,
  },
  /* EYLEM SATIRI: iki esit buton, kendi profildeki olcude (40). */
  eylemler: { flexDirection: 'row' as const, gap: bosluk.s, marginTop: bosluk.m },
  /* Gecis sarmali dugmenin yerini tutar; icindeki dugme flex: 1 ile dolar. */
  eylemGecis: { flex: 1, flexDirection: 'row' as const },
  eylemButonu: {
    flex: 1,
    height: 40,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  /* MESAJ YAZ - birincil, dolu turuncu + beyaz yazi (kullanicinin
     istegi 2026-09-14: "daha belirgin bir renk"). */
  eylemBirincil: { backgroundColor: renk.turuncu },
  eylemBirincilBasili: { backgroundColor: renk.turuncuBasili },
  eylemBirincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
  /* ARKADASSIN - turuncu cerceve + turuncu yazi: kurulu bir bag, ama
     basilabilir (menu acar). Dolu turuncuyla yarismasin diye cerceveli. */
  eylemArkadas: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: renk.turuncu, flexDirection: 'row', gap: 6 },
  eylemArkadasBasili: { backgroundColor: renk.turuncuZemin },
  eylemArkadasYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi },
  /* DURUM (beklemede): dolgu notr - karar karsi tarafta. Basilabilir:
     tekrar basmak istegi geri ceker; basili hal biraz daha koyu. */
  eylemDurum: { backgroundColor: renk.cizgi },
  eylemDurumBasili: { backgroundColor: renk.metinSoluk },
  eylemDurumYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
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
  // Kart artik kendi yan payini tasiyor (referans duzeni 2026-09-18);
  // sayfanin yan dolgusu geri aliniyor ki pay ikiye katlanmasin.
  aniListesi: { marginHorizontal: -bosluk.s },

})

/** "Arkadassin" dugmesindeki tik - yaziyla ayni turuncu. */
function ArkadasTikIkonu() {
  const renk = useRenk()
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" testID="arkadas-tik">
      <Path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke={renk.turuncuYazi}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
