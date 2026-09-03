import { useCallback, useRef, useState } from 'react'
import { View, Text, Image, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { akisiGetir, type AkisOgesi } from '../../lib/akis'
import { etiketiKaldir } from '../../lib/etiket'
import { checkIniSil, checkInNotunuGuncelle } from '../../lib/checkin'
import { CheckInKarti } from '../tasarim/CheckInKarti'
import {
  etkilesimOzetleriniGetir,
  begen,
  begeniyiKaldir,
  paylas,
  type EtkilesimOzeti,
} from '../../lib/etkilesim'
import { KisiSatiri, type KisiSatirVerisi } from '../tasarim/KisiSatiri'
import { kisiAra } from '../../lib/kisi-ara'
import { profilFotografiUrl } from '../../lib/fotograf-url'
import { gorecelZaman } from '../../lib/zaman'
import { useDil } from '../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { MarkaYazisi } from '../tasarim/MarkaYazisi'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

/** Arama kutusunun basindaki buyutec. */
function BuyutecIkonu() {
  const renk = useRenk()

  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle
        cx={11}
        cy={11}
        r={7}
        stroke={renk.metinIkincil}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M16.5 16.5 21 21"
        stroke={renk.metinIkincil}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

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
  const { t } = useDil()
  const [ogeler, setOgeler] = useState<AkisOgesi[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)
  // Silme GERI ALINAMAZ, bu yuzden iki adimli: once onay satiri acilir.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)
  const [ozetler, setOzetler] = useState<Record<string, EtkilesimOzeti>>({})

  // KISI ARAMA (kullanicinin istegi 2026-08-28): markanin hemen
  // altinda bir arama sutunu; kullanici adi ya da isim yazilinca
  // akisin YERINE sonuclar ciziliyor.
  const [arama, setArama] = useState('')
  const [sonuclar, setSonuclar] = useState<KisiSatirVerisi[]>([])
  const [aramaDurumu, setAramaDurumu] = useState<string | null>(null)
  // Yavas donen eski bir istek yeninin uzerine yazmasin diye sira
  // numarasi. Imzalama da async oldugu icin kontrol iki kez yapiliyor.
  const sonIstekRef = useRef(0)

  async function aramaDegisti(yeni: string) {
    setArama(yeni)
    const istekNo = ++sonIstekRef.current
    const temiz = yeni.trim()

    if (temiz.length < 2) {
      setSonuclar([])
      setAramaDurumu(temiz.length === 0 ? null : t('kisiler.enAzIki'))
      return
    }

    try {
      const bulunanlar = await kisiAra(temiz)
      if (istekNo !== sonIstekRef.current) return

      const satirlar = await Promise.all(
        bulunanlar.map(async (kisi) => ({
          id: kisi.id,
          kullaniciAdi: kisi.kullaniciAdi,
          ad: kisi.ad,
          fotografUrl: kisi.fotograf ? await profilFotografiUrl(kisi.fotograf) : null,
        }))
      )
      if (istekNo !== sonIstekRef.current) return

      setSonuclar(satirlar)
      setAramaDurumu(satirlar.length === 0 ? t('kisiler.bulunamadi') : null)
    } catch (e) {
      if (istekNo !== sonIstekRef.current) return
      setSonuclar([])
      setAramaDurumu(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  const aramaAcik = arama.trim().length > 0

  async function yukle() {
    try {
      const gelen = await akisiGetir()
      setOgeler(gelen)
      // Begeni/yorum sayilari TEK cagrida: kart basina sorgu atmak otuz
      // gidis-donus demekti. Okunamazsa akis yine ciziliyor, yalnizca
      // eylem satiri gorunmuyor - sayilar yuzunden akisi kaybetmek
      // yanlis olur (etiketlerdeki desenin aynisi).
      setOzetler(await etkilesimOzetleriniGetir(gelen.map((o) => o.id)).catch(() => ({})))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
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
   * DUZENLEME (kullanicinin istegi 2026-09-02).
   *
   * Hata BURADA yakalanmiyor: pencere kendi hatasini gostersin diye
   * yukari birakiliyor. Boylece basarisiz kayitta pencere acik kaliyor
   * ve kullanici yazdigi metni kaybetmiyor.
   */
  async function notuKaydet(id: string, yeniNot: string) {
    await checkInNotunuGuncelle(id, yeniNot)
    const temiz = yeniNot.trim()
    setOgeler((mevcut) =>
      mevcut.map((o) => (o.id === id ? { ...o, notMetni: temiz === '' ? null : temiz } : o))
    )
  }

  async function etiketiSil(id: string, kullaniciId: string) {
    await etiketiKaldir(id, kullaniciId)
    setOgeler((mevcut) =>
      mevcut.map((o) =>
        o.id === id
          ? { ...o, etiketler: o.etiketler.filter((e) => e.kullaniciId !== kullaniciId) }
          : o
      )
    )
  }

  async function yenile() {
    setYenileniyor(true)
    await yukle()
    setYenileniyor(false)
  }

  return (
    <View style={stiller.kok}>
      {/* Marka EN USTTE, hemen altinda arama sutunu (kullanicinin
          istegi 2026-08-28). */}
      <View style={stiller.ustCubuk}>
        <MarkaYazisi genislik={88} />
      </View>

      {/* Instagram duzeni (kullanicinin gonderdigi referans): kenarliksiz
          DOLGULU kutu, solda buyutec, hemen yaninda sola dayali metin.
          Onceki hali beyaz zeminli-kenarlikliydi ve yazi ortaliydi. */}
      <View style={stiller.aramaKutusu}>
        <BuyutecIkonu />
        <TextInput
          style={stiller.aramaGirdisi}
          placeholder={t('anaSayfa.aramaYerTutucu')}
          placeholderTextColor={renk.metinIkincil}
          autoCapitalize="none"
          autoCorrect={false}
          value={arama}
          onChangeText={aramaDegisti}
          returnKeyType="search"
        />
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      {aramaAcik ? (
        <FlatList
          data={sonuclar}
          keyExtractor={(k) => k.id}
          contentContainerStyle={stiller.liste}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <KisiSatiri kisi={item} onSec={(k) => router.push(`/kullanici/${k.id}`)} />
          )}
          ListEmptyComponent={
            aramaDurumu ? <Text style={stiller.durum}>{aramaDurumu}</Text> : null
          }
        />
      ) : (
      <FlatList
        data={ogeler}
        keyExtractor={(o) => o.id}
        contentContainerStyle={stiller.liste}
        showsVerticalScrollIndicator={false}
        refreshing={yenileniyor}
        onRefresh={yenile}
        renderItem={({ item }) => (
          // ORTAK KART (kullanicinin karari 2026-08-30): ana sayfa,
          // profil ve Anilarim ayni CheckInKarti'yi kullaniyor. Zaman
          // tuneli deseni (gun ayraci + dikey serit) kaldirildi.
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
            onNotKaydet={notuKaydet}
            onEtiketKaldir={etiketiSil}
          />
        )}
        ListEmptyComponent={
          yukleniyor ? (
            <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>
          ) : (
            // Bos akis yon veriyor: nasil dolacagini soyluyor.
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('anaSayfa.bosBaslik')}</Text>
              <Text style={stiller.bosAciklama}>{t('anaSayfa.bosAciklama')}</Text>
              <Pressable
                style={stiller.birincil}
                onPress={() => router.push('/mekanlar')}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilYazi}>{t('anaSayfa.kesfet')}</Text>
              </Pressable>
            </View>
          )
        }
      />
      )}
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
  mekanAdi: { fontFamily: yazi.govdeKalin, color: renk.turuncu },
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

  kok: { flex: 1, backgroundColor: renk.zemin },

  // Marka ORTADA ve yukarida (kullanicinin istegi 2026-08-27:
  // "slooin yazisini biraz kucult ve yukari ortaya koy"). Onceden
  // sola dayaliydi ve 104 genisligindeydi.
  aramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    marginHorizontal: bosluk.l,
    marginBottom: bosluk.m,
    // Kenarlik yok, dolgu var. Ton gun ayraclariyla ayni (#F6F1EB):
    // beyaz sayfada kendini belli ediyor ama dikkat cekmiyor.
    // Jetona gecti: koyu modda kremsi bir kutu beyaz bir delik gibi
    // duruyordu.
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: 11,
  },
  aramaGirdisi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  ustCubuk: {
    alignItems: 'center',
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xl,
    paddingBottom: bosluk.m,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    paddingHorizontal: bosluk.xl,
    marginBottom: bosluk.s,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.xl,
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
    color: renk.turuncu,
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
    color: renk.turuncuKoyu,
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
