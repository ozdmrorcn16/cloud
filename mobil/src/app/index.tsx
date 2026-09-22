import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { akisiGetir, AKIS_SAYFA_BOYU, type AkisOgesi } from '../../lib/akis'
import { etiketiKaldir, etiketleriKaydet, etiketleriGetir } from '../../lib/etiket'
import { checkIniSil, checkInNotunuGuncelle, checkInIfadesiniGuncelle } from '../../lib/checkin'
import { checkInFotograflariniDegistir } from '../../lib/checkin-fotograf-degistir'
import { CheckInKarti } from '../tasarim/CheckInKarti'
import { CheckInDuzenle, type DuzenlemeDegisiklikleri } from '../tasarim/CheckInDuzenle'
import {
  etkilesimOzetleriniGetir,
  begen,
  begeniyiKaldir,
  paylas,
  type EtkilesimOzeti,
} from '../../lib/etkilesim'
import { gorecelZaman } from '../../lib/zaman'
import { SuAnDisarida } from '../tasarim/SuAnDisarida'
import { HikayeSeridi } from '../tasarim/HikayeSeridi'
import { hikayeSeridiVerisiniGetir, type HikayeSeridiVerisi } from '../../lib/hikaye'
import { ANAHTAR, onbellekOku, onbellekYaz } from '../../lib/onbellek'
import { useDil } from '../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { KademeliGiris, BosDurumGirisi } from '../tasarim/KademeliGiris'
import { MarkaYazisi } from '../tasarim/MarkaYazisi'
import { BuyutecIkonu } from '../tasarim/BuyutecIkonu'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

function KonumIkonu() {
  const renk = useRenk()
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
        stroke={renk.metinIkincil}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={12} cy={10} r={2.4} stroke={renk.metinIkincil} strokeWidth={2} fill="none" />
    </Svg>
  )
}

/**
 * Ana sayfa: akis.
 *
 * Kullanicinin karari (2026-08-25): giristen sonra Instagram'daki gibi
 * bir ana sayfa gelir ve alt cubugun en solundaki ev ikonu buraya
 * doner. Akista kullanicinin KENDI check-in'leri ve karsilikli bag
 * kurdugu kisilerin check-in'leri birlikte akar; fotografli olanlar
 * fotografiyla gorunur.
 *
 * Burasi eskiden bir "ana ekran menusu"ydu (Kisi ara / Baglar /
 * Mesajlar satirlari). Gezinme alt cubuga tasindigi icin o menu
 * gereksizdi; yerini icerik aldi.
 */
export default function AnaSayfa() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  // Kademeli giris her kimlik icin bir kez oynar (sanal liste satiri
  // yeniden mount olsa bile).
  const kademeOynatilanlar = useRef(new Set<string>())
  const { t } = useDil()
  // ONBELLEKTEN BASLA (2026-09-22): ekran `Slot` yuzunden her donuste
  // sifirdan kuruluyor; son veri elde varsa bos liste ve "Yukleniyor"
  // hic gorunmuyor, tazeleme arkada kosuyor.
  const [ogeler, setOgeler] = useState<AkisOgesi[]>(() => onbellekOku<AkisOgesi[]>(ANAHTAR.akis) ?? [])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(
    () => onbellekOku<AkisOgesi[]>(ANAHTAR.akis) === undefined
  )
  const [yenileniyor, setYenileniyor] = useState(false)
  // Silme GERI ALINAMAZ, bu yuzden iki adimli: once onay satiri acilir.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)
  const [ozetler, setOzetler] = useState<Record<string, EtkilesimOzeti>>(
    () => onbellekOku<Record<string, EtkilesimOzeti>>(ANAHTAR.akisOzetleri) ?? {}
  )
  // HIKAYE SERIDI (2026-09-22): akistan ayri istek; okunamazsa akis yine
  // cizilir, yalnizca kendi dairem (ekleme yolu) kalir.
  const [hikayeler, setHikayeler] = useState<HikayeSeridiVerisi>(
    () => onbellekOku<HikayeSeridiVerisi>(ANAHTAR.hikayeSeridi) ?? { gruplar: [], ben: null }
  )
  // SAYFALAMA. Akis eskiden yalnizca en yeni sayfayi cekiyordu ve
  // devami hic yuklenmiyordu; sayfa boyunu asan eski paylasimlar ana
  // sayfada erisilemez oluyordu (kullanicinin kurali 2026-09-07:
  // butun paylasimlar ana sayfada da profilde de kalir).
  const [dahaVarMi, setDahaVarMi] = useState(true)
  const [dahaYukleniyor, setDahaYukleniyor] = useState(false)
  // Ayni "sona geldim" olayi arka arkaya birkac kez tetiklenebiliyor;
  // durum guncellemesi asenkron oldugu icin kapiyi REF tutuyor.
  const dahaYukleniyorRef = useRef(false)
  // Tazeleme kaC oge oldugunu bilmeli: `useFocusEffect` bos bagimlilik
  // listesiyle calistigi icin state uzerinden okusa eski degeri gorur.
  const ogelerRef = useRef<AkisOgesi[]>([])


  async function yukle() {
    // Tazelemede ELDEKI KADARINI istiyoruz. Sabit bir sayfa istenseydi
    // kullanici asagi kaydirip baska bir ekrana gidip donduegunde liste
    // ilk sayfaya duesuer, okudugu yeri kaybederdi.
    const istenen = Math.max(ogelerRef.current.length, AKIS_SAYFA_BOYU)
    // Hikayeler akisla PARALEL; kendi hatasi akisi dusurmez.
    const hikayeSozu = hikayeSeridiVerisiniGetir().catch(() => null)
    try {
      const gelen = await akisiGetir(istenen)
      setOgeler(gelen)
      onbellekYaz(ANAHTAR.akis, gelen)
      setDahaVarMi(gelen.length === istenen)
      // Begeni/yorum sayilari TEK cagrida: kart basina sorgu atmak otuz
      // gidis-donus demekti. Okunamazsa akis yine ciziliyor, yalnizca
      // eylem satiri gorunmuyor - sayilar yuzunden akisi kaybetmek
      // yanlis olur (etiketlerdeki desenin aynisi).
      const yeniOzetler = await etkilesimOzetleriniGetir(gelen.map((o) => o.id)).catch(() => ({}))
      setOzetler(yeniOzetler)
      onbellekYaz(ANAHTAR.akisOzetleri, yeniOzetler)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
    const hikayeVerisi = await hikayeSozu
    if (hikayeVerisi) {
      setHikayeler(hikayeVerisi)
      onbellekYaz(ANAHTAR.hikayeSeridi, hikayeVerisi)
    }
  }

  // Ekran her odaklandiginda tazeleniyor: kullanici check-in yapip geri
  // donunce kendi paylasimini akisin basinda gormeli.
  useFocusEffect(
    useCallback(() => {
      yukle()
    }, [])
  )

  /**
   * Iyimser guncelleme: kalp aninda doluyor, sunucu reddederse geri
   * aliniyor. Begeni cok siklikla basilan bir dugme; her dokunusta
   * sunucuyu beklemek dokunusu agir hissettiriyor.
   */
  async function begeniDegistir(id: string) {
    const onceki = ozetler[id]
    if (!onceki) return

    const yeni = {
      ...onceki,
      begendim: !onceki.begendim,
      begeni: onceki.begeni + (onceki.begendim ? -1 : 1),
    }
    setOzetler((o) => ({ ...o, [id]: yeni }))
    try {
      if (onceki.begendim) await begeniyiKaldir(id)
      else await begen(id)
    } catch {
      setOzetler((o) => ({ ...o, [id]: onceki }))
    }
  }

  async function paylasimiPaylas(id: string) {
    const oge = ogeler.find((o) => o.id === id)
    if (!oge) return
    await paylas(oge.mekanAdi, oge.kullaniciAdi ?? '').catch(() => {})
  }

  async function sil(id: string) {
    try {
      await checkIniSil(id)
      // Satir tek yerde duruyor: profildeki anilardan ve canli
      // seritten de kalkmis oluyor. Burada yalnizca listeyi
      // guncelliyoruz, yeniden yuklemeye gerek yok.
      setOgeler((mevcut) => mevcut.filter((o) => o.id !== id))
      setSilOnayi(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('anaSayfa.silAriza'))
    }
  }

  /**
   * DUZENLEME (referans sayfa, 2026-09-21): "Check-in'i duzenle" alttan
   * gelir, Kaydet tek paket verir. Sira: fotograflar (yukle -> sunucu ->
   * eskileri sil) -> etiket kaldir -> etiket ekle -> ifade -> not. Not en
   * son: bir adim kirilirsa sayfa acik kalir, hata gorunur, yazilan
   * kaybolmaz (2026-09-05'ten beri kural). Liste her adimdan sonra
   * YERINDE guncellenir; sayfa kapaninca kart zaten yeni halini gosterir.
   */
  function ogeyiGuncelle(id: string, parca: Partial<AkisOgesi>) {
    setOgeler((mevcut) => mevcut.map((o) => (o.id === id ? { ...o, ...parca } : o)))
  }

  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null)
  const duzenlenen = ogeler.find((o) => o.id === duzenlenenId) ?? null

  async function duzenlemeyiKaydet(id: string, d: DuzenlemeDegisiklikleri) {
    if (d.fotograflar) {
      const { yollar, urller } = await checkInFotograflariniDegistir(id, d.fotograflar)
      ogeyiGuncelle(id, { fotograflar: yollar, fotografUrller: urller })
    }
    for (const kullaniciId of d.etiketKaldir) {
      await etiketiKaldir(id, kullaniciId)
    }
    if (d.etiketEkle.length > 0) {
      await etiketleriKaydet(id, d.etiketEkle)
    }
    if (d.etiketKaldir.length > 0 || d.etiketEkle.length > 0) {
      // Sunucu karsi tarafin "etiket onayi" ayarina gore hemen onayliyor
      // ya da onaya dusuruyor (2026-09-18): onayli liste yeniden okunur.
      const guncel = await etiketleriGetir([id]).catch(() => null)
      if (guncel) ogeyiGuncelle(id, { etiketler: guncel[id] ?? [] })
    }
    const mevcut = ogeler.find((o) => o.id === id)
    if (mevcut && d.ifade !== mevcut.ifade) {
      await checkInIfadesiniGuncelle(id, d.ifade)
      ogeyiGuncelle(id, { ifade: d.ifade })
    }
    await checkInNotunuGuncelle(id, d.not)
    const temiz = d.not.trim()
    ogeyiGuncelle(id, { notMetni: temiz === '' ? null : temiz })
  }

  // Ref'i state ile ayni tutuyoruz; okuyanlar (tazeleme, sonraki
  // sayfa) her zaman guncel listeyi gorsun.
  useEffect(() => {
    ogelerRef.current = ogeler
  }, [ogeler])

  /**
   * SONRAKI SAYFA. Imlec listedeki EN ESKI ogenin zamani; boylece iki
   * istek arasinda yeni bir check-in eklense bile pencere kaymiyor.
   */
  async function dahaYukle() {
    if (dahaYukleniyorRef.current || !dahaVarMi || yukleniyor) return
    const son = ogelerRef.current[ogelerRef.current.length - 1]
    if (!son) return

    dahaYukleniyorRef.current = true
    setDahaYukleniyor(true)
    try {
      const gelen = await akisiGetir(AKIS_SAYFA_BOYU, son.olusturmaZamani)
      setDahaVarMi(gelen.length === AKIS_SAYFA_BOYU)
      if (gelen.length > 0) {
        // Kimlikle eleme: iki kayit ayni ana denk gelirse imlec onlari
        // ayiramaz ve ayni satir iki sayfada gorunebilir.
        setOgeler((mevcut) => {
          const varolan = new Set(mevcut.map((o) => o.id))
          return [...mevcut, ...gelen.filter((o) => !varolan.has(o.id))]
        })
        const yeniOzetler = await etkilesimOzetleriniGetir(
          gelen.map((o) => o.id)
        ).catch(() => ({}) as Record<string, EtkilesimOzeti>)
        setOzetler((mevcut) => ({ ...mevcut, ...yeniOzetler }))
      }
      setHata(null)
    } catch (e) {
      // Eldeki akis KAYBOLMUYOR: yalnizca hata satiri cikiyor.
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      dahaYukleniyorRef.current = false
      setDahaYukleniyor(false)
    }
  }

  async function yenile() {
    setYenileniyor(true)
    await yukle()
    setYenileniyor(false)
  }

  return (
    <View style={stiller.kok}>
      {/* Marka EN USTTE, ortada; SOL BASTA buyutec (kullanicinin istegi
          2026-09-20: "arama sutununu kaldir, slooin yazisinin sol bas
          hizasina arama ikonu ekle, basinca kisi arama sayfasi
          acilsin"). 2026-08-28'in markanin altindaki arama sutunu
          KALKTI; kisi arama artik `/kisiler` sayfasinda. */}
      <View style={stiller.ustCubuk}>
        <Pressable
          style={stiller.aramaDugmesi}
          onPress={() => router.push('/kisiler')}
          accessibilityRole="button"
          accessibilityLabel={t('kisiler.baslik')}
          hitSlop={8}
          testID="kisi-ara"
        >
          <BuyutecIkonu />
        </Pressable>
        <MarkaYazisi genislik={88} />
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        testID="akis-listesi"
        data={ogeler}
        keyExtractor={(o) => o.id}
        contentContainerStyle={stiller.liste}
        showsVerticalScrollIndicator={false}
        refreshing={yenileniyor}
        onRefresh={yenile}
        // Liste SONSUZ: sona yaklasinca bir sonraki sayfa iniyor.
        // Esik 0.6 - kullanici tam dibe varmadan yukleme basliyor,
        // boylece kaydirma bosluga carpmıyor.
        onEndReached={dahaYukle}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          dahaYukleniyor ? (
            <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>
          ) : null
        }
        // "Su an disarida" seridi AKISLA BIRLIKTE kayiyor
        // (ListHeaderComponent), ekranin tepesine cakili degil:
        // referansta da kaydiriliyor ve cakili olsa akisa ayrilan
        // yer 100 pikselden fazla azalirdi. Serit kendi verisini
        // `ogeler`den turetiyor, yeni bir ag cagrisi yok; kimse
        // disarida degilse hic cizilmiyor.
        ListHeaderComponent={
          <>
            <HikayeSeridi gruplar={hikayeler.gruplar} ben={hikayeler.ben} />
            <SuAnDisarida ogeler={ogeler} />
          </>
        }
        renderItem={({ item, index }) => (
          // ORTAK KART (kullanicinin karari 2026-08-30): ana sayfa,
          // profil ve Anilarim ayni CheckInKarti'yi kullaniyor. Zaman
          // tuneli deseni (gun ayraci + dikey serit) kaldirildi.
          // KADEMELI GIRIS (2026-09-20): ilk ekran dolusu 40 ms arayla
          // belirir; her kart bir kez, sonraki sayfalar hic.
          <KademeliGiris anahtar={item.id} sira={index} oynatilanlar={kademeOynatilanlar.current}>
          <CheckInKarti
            oge={item}
            zamanYazisi={gorecelZaman(item.olusturmaZamani, t)}
            ozet={ozetler[item.id]}
            onBegen={begeniDegistir}
            // Yorumlar artik KARTIN ICINDE alttan aciliyor; ekranin
            // tek isi sayaci tazelemek.
            onYorumSayisi={(id, sayi) =>
              setOzetler((mevcut) =>
                mevcut[id] ? { ...mevcut, [id]: { ...mevcut[id], yorum: sayi } } : mevcut
              )
            }
            onPaylas={paylasimiPaylas}
            silOnayiAcik={silOnayi === item.id}
            onSilOnayi={(id) => setSilOnayi(silOnayi === id ? null : id)}
            onSil={sil}
            onDuzenle={setDuzenlenenId}
          />
          </KademeliGiris>
        )}
        ListEmptyComponent={
          yukleniyor ? (
            <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>
          ) : (
            // Bos akis yon veriyor: nasil dolacagini soyluyor.
            <BosDurumGirisi style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('anaSayfa.bosBaslik')}</Text>
              <Text style={stiller.bosAciklama}>{t('anaSayfa.bosAciklama')}</Text>
              <Pressable
                style={stiller.birincil}
                onPress={() => router.push('/mekanlar')}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilYazi}>{t('anaSayfa.kesfet')}</Text>
              </Pressable>
            </BosDurumGirisi>
          )
        }
      />

      <CheckInDuzenle
        acikMi={duzenlenen !== null}
        oge={duzenlenen}
        zamanYazisi={duzenlenen ? gorecelZaman(duzenlenen.olusturmaZamani, t) : ''}
        onKapat={() => setDuzenlenenId(null)}
        onKaydet={(d) => duzenlemeyiKaydet(duzenlenenId as string, d)}
      />
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  satir: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
  },
  kullaniciAdi: { fontFamily: yazi.govdeKalin, color: renk.metin },
  ayirac: { color: renk.metinSoluk },
  // Mekan adi TURUNCU (kullanicinin istegi): satirdaki tek renkli oge
  // ve ayni zamanda tiklanabilir - turuncu kurali bozulmuyor.
  mekanAdi: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },
  etiket: { fontFamily: yazi.govdeOrta, color: renk.metin },

  silDugmesi: { padding: 4, marginRight: 2 },
  silOnayAlani: { marginTop: 12, gap: 8 },
  silOnaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silOnayDugmeleri: { flexDirection: 'row', gap: 20 },
  vazgecYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },

  // Zemin BEYAZ (2026-08-27 karari; 2026-09-20'de gri denendi, kullanici
  // ayni gun reddetti). Kartlari golge + soluk cerceve ayiriyor.
  kok: { flex: 1, backgroundColor: renk.zemin },

  // Marka ORTADA ve yukarida (kullanicinin istegi 2026-08-27:
  // "slooin yazisini biraz kucult ve yukari ortaya koy"); buyutec sol
  // basta, mutlak konumda - markanin ortalanmasini bozmuyor.
  ustCubuk: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.xl,
    paddingBottom: bosluk.m,
  },
  aramaDugmesi: {
    position: 'absolute',
    left: bosluk.sayfa,
    top: bosluk.xl,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    // Marka gorseli 88 genis / 26 yuksek; dugme dikeyde onunla ortali.
    marginTop: -9,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    paddingHorizontal: bosluk.sayfa,
    marginBottom: bosluk.s,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.sayfa,
  },

  // Kartlar TAM GENISLIK (kullanicinin istegi 2026-09-02): yatay dolgu
  // burada degil, kartin kendi icinde - yoksa kartin zemini kenara
  // ulasmiyor ve yine bir sinir gorunuyordu.
  liste: { paddingBottom: ALT_GEZINME_PAYI },

  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginBottom: bosluk.m,
    ...golge.kart,
  },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  kisi: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },

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
    color: renk.turuncuYazi,
  },

  fotograf: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: yuvarlak.kart - 4,
    marginTop: bosluk.m,
    backgroundColor: renk.cizgi,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: bosluk.m,
  },

  bosAlan: { paddingHorizontal: bosluk.s, paddingTop: bosluk.xxl },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.l,
    ...golge.yuzer,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
