import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import {
  baskasininProfiliniGetir,
  kendiKullaniciIdim,
  type BaskaProfil,
} from '../../../lib/profil'
import { engelle } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir, type AniGorunumu } from '../../../lib/checkin'
import { profilFotograflariUrl, checkInFotografiUrl } from '../../../lib/fotograf-url'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { ProfilSayaclari } from '../../tasarim/ProfilSayaclari'
import { SekmeHapi } from '../../tasarim/SekmeHapi'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import {
  bagDurumunuGetir,
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIstegiGonder,
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
 * KAPALI PROFIL KILIDI.
 *
 * Ikon `renk.metinSoluk` degil `metinIkincil`: bu bir SEBEP
 * bildirimi, pasif bir suesleme degil - kullanicinin neden bos bir
 * liste gordugunu anlatan tek isaret.
 */
function KilitIkonu() {
  const renk = useRenk()
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24">
      <Path
        d="M7 10V7a5 5 0 0 1 10 0v3"
        stroke={renk.metinIkincil}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M5 10h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"
        stroke={renk.metinIkincil}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

function tarihiBicimlendir(zaman: string): string {
  const tarih = new Date(zaman)
  if (isNaN(tarih.getTime())) return ''
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

type AniSatiri = AniGorunumu & { fotografUrl: string | null }

/**
 * Baskasinin profili.
 *
 * Kimlik blogu kendi profil ekraniyla ayni deseni kullaniyor (bas
 * harfli avatar, ad, @kullaniciadi, biyografi) - iki ekran arasinda
 * gecerken kisinin ayni kisi oldugu okunmali.
 *
 * Ekranin tek birincil turuncu eylemi var ve o eylem baga gore
 * degisiyor: bag varsa "Mesaj gonder", yoksa "Takip et". Diger butun
 * bag eylemleri zeminsiz ikincil metin butonu. Bu ayrim bilincli:
 * kullanici bu ekranda ne yapmasi bekleniyorsa o turuncu olan.
 *
 * Engelleme iki adimli. Tek dokunusla engellemek geri alinamaz bir
 * eylemi kazayla tetikliyordu ve uygulamada "engellediklerim" listesi
 * henuz yok, yani geri almanin ekranda karsiligi da yok.
 */
export default function KullaniciProfiliEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profil, setProfil] = useState<BaskaProfil | null>(null)
  const [fotografUrlleri, setFotografUrlleri] = useState<string[]>([])
  const [anilar, setAnilar] = useState<AniSatiri[]>([])
  const [bagDurum, setBagDurum] = useState<Awaited<ReturnType<typeof bagDurumunuGetir>> | null>(
    null
  )
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [engelleOnayi, setEngelleOnayi] = useState(false)
  // Kendi profil ekranindaki gibi iki bakis: zaman sirasi ve en cok
  // gidilen yerler.
  const [sekme, setSekme] = useState<'anilar' | 'yerler'>('anilar')

  async function verileriYukle() {
    try {
      const [profilVerisi, anilarVerisi, bagVerisi] = await Promise.all([
        baskasininProfiliniGetir(id),
        kullanicininAnilariniGetir(id),
        bagDurumunuGetir(id),
      ])
      setProfil(profilVerisi)
      setFotografUrlleri(await profilFotograflariUrl(profilVerisi?.fotograflar ?? []))
      setAnilar(
        await Promise.all(
          anilarVerisi.map(async (ani) => ({
            ...ani,
            fotografUrl: ani.fotograf ? await checkInFotografiUrl(ani.fotograf) : null,
          }))
        )
      )
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
   * "Arkadaş ekle" ve "Sohbet iste" gosteriyordu.
   *
   * KURAL BURADA, GIRIS NOKTALARINDA DEGIL. Onceden her cagiran taraf
   * `kisi.benimMi ? '/profil' : ...` diye kendi kontrolunu yapiyordu ve
   * ON UC yerin yalnizca IKISINDE vardi (akis karti ve "Su an
   * disarida" seridi). Kontrolu buraya almak hepsini birden duzeltiyor
   * ve yarin eklenecek yeni bir giris de kendiliginden dogru olur.
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

  async function sohbetIste() {
    try {
      await sohbetIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, sohbet: 'beklemede' } : onceki))
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

  // Mesajlasma acildiysa ekranin birincil eylemi odur; degilse takip
  // istegi. Ikisi ayni anda turuncu olmaz.
  const mesajAcik =
    bagDurum?.takip === 'kabul' ||
    bagDurum?.sohbet === 'kabul' ||
    bagDurum?.gelenSohbet === 'kabul'

  // "En sik" gorunumu: ayni anilardan gruplaniyor, sunucuda yeni bir
  // sorgu yok. Kendi profil ekranindaki desenin aynisi.
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
  })()

  /**
   * KAPALI PROFIL. Kisi "profilim gizli" demis ve aranizda arkadaslik
   * yok. Ekran duzeni AYNI kaliyor - kullanicinin istegi 2026-09-08:
   * "su an kullanicinin profili nasilsa aynisinin kapali halini
   * gormeli" - yalnizca liste yerine tek bir aciklama duruyor.
   *
   * Bu bir GORUNUM karari, guvenlik siniri degil: anilarin gercek
   * korumasi `check_inler` RLS'inde ve o zaten devrede.
   */
  const kapali = (profil?.profilGizli ?? false) && !mesajAcik

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
      <Text style={stiller.ustBaslik} numberOfLines={1}>
        {/* @ yok (2026-09-03): iki profil ekrani ayni dili konusuyor. */}
        {profil ? profil.kullaniciAdi : ''}
      </Text>
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

      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        {/* KIMLIK BLOGU kendi profil ekraniyla AYNI duzende: ortali
            buyuk avatar, altinda ad ve biyografi. Once yan yana kucuk
            bir satirdi ve iki ekran arasinda gecerken ayni kisinin
            profili baska bir uygulamaya aitmis gibi duruyordu. */}
        <View style={stiller.kimlik}>
          {fotografUrlleri.length > 0 ? (
            <Image
              testID="profil-fotografi"
              source={{ uri: fotografUrlleri[0] }}
              style={stiller.avatar}
            />
          ) : (
            <View style={[stiller.avatar, stiller.avatarYok]}>
              <Text style={stiller.basHarf}>
                {(profil.ad || profil.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
              </Text>
            </View>
          )}
          <Text style={stiller.ad}>{profil.ad}</Text>
          {profil.biyografi ? <Text style={stiller.biyografi}>{profil.biyografi}</Text> : null}
        </View>

        {/* FOTOGRAF SERIDI KALDI. Kendi profilinde fotograflar ayri bir
            SEKME (izgara), burada sekmeler Anilar/En sik ile dolu; serit
            kalkarsa sayac bir sayi soyluyor ama fotograflara ulasmanin
            yolu kalmiyordu. Ilk fotograf avatarda kullanildi, kalanlar
            burada. */}
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

        {/* SAYACLAR SALT OKUNUR: kendi profilinde bunlar bir bolum
            secici, burada yalnizca sayiyi soyluyorlar. `onSec`
            verilmedigi icin dokunulabilir de degiller. */}
        <ProfilSayaclari
          sayilar={{
            anilar: anilar.length,
            fotograflar: fotografUrlleri.length,
            arkadaslar: profil.arkadasSayisi,
          }}
        />

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

        {mesajAcik && (
          <Pressable
            style={stiller.birincil}
            onPress={() => router.push(`/sohbet/${id}`)}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>{t('kullanici.mesajGonder')}</Text>
          </Pressable>
        )}

        {bagDurum?.takip === 'yok' && (
          <Pressable
            style={mesajAcik ? stiller.anahtarli : stiller.birincil}
            onPress={takipEt}
            accessibilityRole="button"
          >
            <Text style={mesajAcik ? stiller.anahtarliYazi : stiller.birincilYazi}>
              {t('kullanici.takipEt')}
            </Text>
          </Pressable>
        )}

        {/* ISTEK GONDERILDI: birincil dugmenin yerini BEKLEMEDE durumu
            aliyor (kullanicinin istegi 2026-09-08: "istek gonderdiginde
            beklemede yazsin istek kabul edilene kadar"). Basilabilir
            DEGIL - karar karsi tarafta; geri cekmek isteyen asagidaki
            ikincil eylemi kullaniyor. */}
        {bagDurum?.takip === 'beklemede' && !mesajAcik && (
          <View style={stiller.beklemede}>
            <Text style={stiller.beklemedeYazi}>{t('kullanici.istekBeklemede')}</Text>
          </View>
        )}

        <View style={stiller.ikincilSatir}>
          {bagDurum?.takip === 'beklemede' && (
            <Pressable onPress={takibiBirakEt} accessibilityRole="button" hitSlop={8}>
              <Text style={stiller.ikincilYazi}>{t('kullanici.istegiGeriCek')}</Text>
            </Pressable>
          )}
          {bagDurum?.takip === 'kabul' && (
            <Pressable onPress={takibiBirakEt} accessibilityRole="button" hitSlop={8}>
              <Text style={stiller.ikincilYazi}>{t('kullanici.bagiKopar')}</Text>
            </Pressable>
          )}

          {bagDurum?.sohbet === 'yok' &&
            bagDurum?.gelenSohbet !== 'kabul' &&
            bagDurum?.gelenSohbet !== 'beklemede' && (
              <Pressable onPress={sohbetIste} accessibilityRole="button" hitSlop={8}>
                <Text style={stiller.ikincilYazi}>{t('kullanici.sohbetIste')}</Text>
              </Pressable>
            )}
          {/* GERI CEKME YOK (kullanicinin kurali 2026-09-01): gonderilen
              sohbet/mesaj istegi geri alinamaz. */}
          {bagDurum?.sohbet === 'beklemede' && bagDurum?.gelenSohbet !== 'kabul' && (
            <Text style={stiller.durumEtiketi}>{t('kullanici.istekGonderildi')}</Text>
          )}
          {(bagDurum?.sohbet === 'kabul' || bagDurum?.gelenSohbet === 'kabul') && (
            <Text style={stiller.durumEtiketi}>{t('kullanici.sohbetAcik')}</Text>
          )}
        </View>

        {/* SEKME HAPI KAPALI PROFILDE CIZILMIYOR.
        
            Kullanicinin netlestirmesi (2026-09-10): "profili gizliyse
            asagida kitli oldugunu gosteren bir ifade olucak; profili
            herkese aciksa profili normalde nasil gorunuyorsa oyle
            gorunecek."
        
            Onceden sekmeler kapali profilde de duruyordu: "Anılar" ve
            "En sık" gorunuyor, basildiginda HICBIR SEY degismiyordu -
            secim yapilabilir gorunen ama sonucu olmayan bir kontrol.
            Secilecek bir sey yoksa secici de olmamali. */}
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
          <View style={stiller.bosAlan} testID="profil-kilitli">
            {/* KILIT IKONU: "kapali" oldugunu tek bakista soyluyor.
                Duz metin, listenin bos oldugu durumdan ayirt
                edilemiyordu - ikisi de sayfanin ortasinda gri bir
                cumleydi. */}
            <KilitIkonu />
            <Text style={stiller.bosBaslik}>{t('kullanici.profilKapali')}</Text>
            <Text style={stiller.bosAciklama}>{t('kullanici.profilKapaliAciklama')}</Text>
          </View>
        ) : sekme === 'yerler' ? (
          yerler.length === 0 ? (
            <Text style={stiller.durum}>{t('kullanici.yerYok')}</Text>
          ) : (
            yerler.map((yer) => (
              <Pressable
                key={yer.mekanId}
                style={stiller.aniSatiri}
                onPress={() => router.push(`/harita/${yer.mekanId}` as never)}
                accessibilityRole="button"
              >
                <View style={stiller.aniOrta}>
                  <Text style={stiller.aniMekan} numberOfLines={1}>
                    {yer.ad}
                  </Text>
                  {yer.semt ? (
                    <Text style={stiller.aniAlt} numberOfLines={1}>
                      {yer.semt}
                    </Text>
                  ) : null}
                </View>
                <Text style={stiller.kezSayisi}>{t('profil.kezSayisi', { sayi: yer.adet })}</Text>
              </Pressable>
            ))
          )
        ) : anilar.length === 0 ? (
          <Text style={stiller.durum}>{t('kullanici.aniYok')}</Text>
        ) : (
          anilar.map((ani) => (
            <Pressable
              key={ani.id}
              style={stiller.aniSatiri}
              // Ani satiri KONUM ekranini aciyor (kullanicinin karari
              // 2026-08-30): mekan etiketine basan kisi orayi gormek
              // istiyor, oraya check-in yapmak degil.
              onPress={() => router.push(`/harita/${ani.mekanId}` as never)}
              accessibilityRole="button"
            >
              {ani.fotografUrl && (
                <Image
                  testID="ani-fotografi"
                  source={{ uri: ani.fotografUrl }}
                  style={stiller.aniFotografi}
                />
              )}
              <View style={stiller.aniOrta}>
                <Text style={stiller.aniMekan} numberOfLines={1}>
                  {ani.mekanAdi}
                </Text>
                <Text style={stiller.aniAlt} numberOfLines={1}>
                  {[ani.notMetni, tarihiBicimlendir(ani.olusturmaZamani)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </Pressable>
          ))
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
  // ISTEK BEKLEMEDE: birincil dugmenin yerini alan DURUM kutusu.
  // Dolgu notr, cunku basilabilir degil - turuncu birakip yalnizca
  // opaklik dusurmek "yukleniyor" gibi okunurdu (ayni ders mekan
  // sayfasindaki uzak check-in dugmesinde ogrenilmisti).
  beklemede: {
    backgroundColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.m,
  },
  beklemedeYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  // KAPALI PROFIL ve bos listeler icin yon veren blok.
  // `gap.s`: ikon ile baslik arasi `xs` (4) ile fazla sikisikti.
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
  kezSayisi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
  },
  kok: { flex: 1, backgroundColor: renk.zemin },

  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.m,
  },
  ustBaslik: {
    flexShrink: 1,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },

  icerik: {
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  // ORTALI KIMLIK (kullanicinin istegi 2026-09-08): kendi profil
  // ekraniyla ayni duzen - avatar ustte ve ortada, altinda ad ve
  // biyografi. Once yan yana bir satirdi.
  kimlik: { alignItems: 'center', gap: bosluk.s, marginTop: bosluk.m, marginBottom: bosluk.m },
  // 84 -> 88: kendi profildeki avatarla ayni cap.
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarYok: {
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: { fontFamily: yazi.ekranBasligi, fontSize: 34, color: renk.turuncuYazi },
  kimlikOrta: { flex: 1 },
  ad: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    textAlign: 'center',
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    textAlign: 'center',
  },
  aniSayisi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
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
  anahtarli: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: bosluk.m,
  },
  anahtarliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  ikincilSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.xl,
    marginTop: bosluk.l,
  },
  ikincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  durumEtiketi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  bolumAd: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    marginTop: bosluk.xxl,
    marginBottom: bosluk.s,
  },
  aniSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  aniFotografi: { width: 48, height: 48, borderRadius: 10, backgroundColor: renk.cizgi },
  aniOrta: { flex: 1 },
  aniMekan: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  aniAlt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

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
  onayAlani: { flex: 1, alignItems: 'flex-end' },
  onayMetni: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    textAlign: 'right',
  },
  onayButonlari: { flexDirection: 'row', gap: bosluk.l, marginTop: bosluk.s },
  tehlikeliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },
})
