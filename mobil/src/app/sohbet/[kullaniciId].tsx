import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Keyboard, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  mesajIsteklerimiGetir,
  mesajIsteginiKabulEt,
  mesajIsteginiReddet,
  konusmalarimiGetir,
  mesajlariGetir,
  mesajGonder,
  konusmayiOkunduIsaretle,
  mesajlaraAbonelOl,
  type Konusma,
  type Mesaj,
} from '../../../lib/sohbet'
import { useOturum } from '../../../lib/oturum'
import { avatarlariGetir } from '../../../lib/akis'
import { Avatar } from '../../tasarim/Avatar'
import { GeriOkIkonu } from '../../tasarim/mekan-ikonlari'
import { ALT_GEZINME_PAYI, rozetleriTazele } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { useDil, cevir } from '../../../lib/dil'
import { saatYazisi, ayniGunMu, gunEtiketi } from '../../../lib/zaman'

// Iyimser eklenen (henuz sunucuda karsiligi olmayan) satirlar. Sunucu
// satirlarindan `yerelMi` ile ayirt ediliyorlar; Realtime yansimasi
// gelince yerini gercek satira birakiyorlar.
type ListeMesaji = Mesaj & { yerelMi?: boolean }

function hataMesaji(e: unknown): string {
  if (e instanceof TypeError && e.message === 'Network request failed') {
    return cevir('ortak.agYok')
  }
  return e instanceof Error ? e.message : cevir('ortak.birSorunOldu')
}

export default function SohbetEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t, dil } = useDil()
  const { oturum } = useOturum()
  const benimKimligim = oturum?.user.id ?? null
  const { kullaniciId } = useLocalSearchParams<{ kullaniciId: string }>()
  // Konusma satiri bulunamayabilir: iki taraf hic mesajlasmamissa
  // konusmalarim listesinde bu kisiye ait satir hic olmaz. O durumda
  // yazma alani acik kalir; kapiyi ilk mesajGonder cagrisinin hatasi
  // bildirir. bagDurumunuGetir'e ikinci bir kaynak olarak bakmiyoruz -
  // sunucudaki mesaj_gonder zaten tek yetkili kapi.
  const [konusmaSatiri, setKonusmaSatiri] = useState<Konusma | null>(null)
  const [konusmaId, setKonusmaId] = useState<string | null>(null)
  const [mesajlar, setMesajlar] = useState<ListeMesaji[]>([])
  const [metin, setMetin] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  /**
   * Bu kisi bana BEKLEYEN bir mesaj istegi gonderdiyse true. O zaman
   * konusma `konusmalarim` listesinde YOKTUR (sunucu ayiriyor) ve
   * mesajlar istekler listesindeki konusma id'sinden yukleniyor.
   */
  const [istekMi, setIstekMi] = useState(false)
  const yerelSayac = useRef(0)
  // Karsi tarafin profil resmi (kullanicinin istegi 2026-09-14). Mesajlar
  // listesi ve bildirimlerle AYNI yol: fotograf ikincil bilgi, cekilemezse
  // bas harf cizilir, ekran hata gostermez.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  useEffect(() => {
    let iptal = false
    avatarlariGetir([kullaniciId])
      .then((a) => { if (!iptal) setAvatarUrl(a[kullaniciId] ?? null) })
      .catch(() => {})
    return () => { iptal = true }
  }, [kullaniciId])

  // KLAVYE (kullanicinin bildirimi 2026-09-14: "yazdigimi gordugum
  // kutu klavyenin altinda kaliyor"). Ekranin alt payi normalde yuzer
  // gezinme cubugu icin (ALT_GEZINME_PAYI); klavye acikken o cubuk
  // zaten klavyenin arkasinda, pay klavye yuksekligi olmali. iOS'ta
  // pencere kuculmuyor, bu yuzden elle olculuyor; Android'de pencere
  // klavyeyle birlikte daraliyor (softwareKeyboardLayoutMode=resize),
  // orada ek pay klavyeyi iki kez sayardi.
  const [klavyeYuksekligi, setKlavyeYuksekligi] = useState(0)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    const ac = Keyboard.addListener('keyboardWillShow', (e) => setKlavyeYuksekligi(e.endCoordinates.height))
    const kapa = Keyboard.addListener('keyboardWillHide', () => setKlavyeYuksekligi(0))
    return () => { ac.remove(); kapa.remove() }
  }, [])

  useEffect(() => {
    let iptalEdildi = false

    async function yukle() {
      try {
        const liste = await konusmalarimiGetir()
        if (iptalEdildi) return
        const bulunan = liste.find((k) => k.kisiId === kullaniciId) ?? null
        setKonusmaSatiri(bulunan)

        if (bulunan) {
          setKonusmaId(bulunan.konusmaId)
          const gecmis = await mesajlariGetir(bulunan.konusmaId)
          if (iptalEdildi) return
          setMesajlar(gecmis)
          await konusmayiOkunduIsaretle(bulunan.konusmaId)
          // Alt cubuktaki okunmamis rozeti hemen dussun (2026-09-22).
          rozetleriTazele()
          return
        }

        // Konusma listede yoksa BEKLEYEN BIR ISTEK olabilir: sunucu
        // onlari `konusmalarim`dan ayiriyor. Kullanici mesaji okumali -
        // okumak kabul etmiyor, kabul ayri bir eylem.
        const istekler = await mesajIsteklerimiGetir()
        if (iptalEdildi) return
        const istek = istekler.find((i) => i.gonderenId === kullaniciId) ?? null
        if (istek) {
          setIstekMi(true)
          if (istek.konusmaId) {
            setKonusmaId(istek.konusmaId)
            const gecmis = await mesajlariGetir(istek.konusmaId)
            if (iptalEdildi) return
            setMesajlar(gecmis)
          }
        }
      } catch (e) {
        if (!iptalEdildi) setHata(hataMesaji(e))
      }
    }

    yukle()
    return () => {
      iptalEdildi = true
    }
  }, [kullaniciId])

  // Realtime abonelik konusma id bilinmeden kurulamaz. Konusma henuz
  // yokken ilk mesaj gonderilince konusmaId asagida gonder() icinde
  // set ediliyor ve bu efekt yeniden calisip aboneligi kuruyor.
  // Donen fonksiyon temizleme (cleanup) olarak kullaniliyor, boylece
  // ekran kapaninca ya da konusmaId degisince kanal birikmiyor.
  useEffect(() => {
    if (!konusmaId) return
    return mesajlaraAbonelOl(konusmaId, (gelenMesaj) => {
      // Birebir konusmada iki uye var, dolayisiyla gonderen karsi
      // tarafin id'siyse mesaj bize gelmis demektir; degilse kendi
      // mesajimizin yansimasidir.
      const karsiTaraftan = gelenMesaj.gonderenId === kullaniciId

      setMesajlar((mevcut) => {
        // Ayni satir iki kez yansirsa ikinci balonu uretme.
        if (mevcut.some((m) => m.id === gelenMesaj.id)) return mevcut

        if (!karsiTaraftan) {
          // Kendi mesajimiz zaten iyimser olarak eklendi. Yansima
          // gelince o yerel satiri sunucu satiriyla degistiriyoruz;
          // aksi halde ayni mesaj iki balon olarak gorunurdu. Eslesme
          // metin uzerinden yapiliyor cunku mesaj_gonder yalnizca
          // konusma id'sini donuyor, mesaj id'sini degil.
          const sira = mevcut.findIndex((m) => m.yerelMi && m.metin === gelenMesaj.metin)
          if (sira !== -1) {
            const kopya = mevcut.slice()
            kopya[sira] = gelenMesaj
            return kopya
          }
        }

        return [gelenMesaj, ...mevcut]
      })

      if (karsiTaraftan) {
        // Ekran acikken gelen mesaj kullanicinin gozunun onunde okundu;
        // son_okuma ilerlemezse ana ekrandaki rozet okunmus mesajlari
        // saymaya devam ederdi. Bu arka plan cagrisinin hatasi
        // kullanicinin yapabilecegi bir sey degil, ekrana tasinmiyor.
        konusmayiOkunduIsaretle(konusmaId).catch(() => {})
      }
    })
  }, [konusmaId, kullaniciId])

  // Istek ekraninda da yazilabilir: CEVAP YAZMAK kabul anlamina geliyor
  // (kullanicinin karari) ve sunucudaki mesaj_gonder bunu kendisi
  // isliyor - istegi 'kabul'e cekip mesaji yaziyor.
  const yazilabilirMi = istekMi ? true : konusmaSatiri ? konusmaSatiri.yazilabilirMi : true
  // Ust bardaki avatar/ad ve her karsi balonun avatari ayni yere gider.
  const profiliAc = () => router.push(`/kullanici/${kullaniciId}`)

  async function istegiKabulEt() {
    try {
      await mesajIsteginiKabulEt(kullaniciId as string)
      setIstekMi(false)
      setHata(null)
    } catch (e) {
      setHata(hataMesaji(e))
    }
  }

  async function istegiReddet() {
    try {
      await mesajIsteginiReddet(kullaniciId as string)
      router.push('/mesajlar')
    } catch (e) {
      setHata(hataMesaji(e))
    }
  }
  const gonderilecekMetin = metin.trim()
  const gonderMumkun = gonderilecekMetin.length > 0 && !gonderiliyor

  async function gonder() {
    // Buton zaten disabled={!gonderMumkun} ile korunuyor; bu ikinci
    // koruma disabled prop'a guvenmeden dogrudan tetiklemelere karsi
    // da ayni garantiyi veriyor.
    if (!gonderMumkun) return
    const oncekiKonusmaId = konusmaId
    const yerelId = `yerel:${yerelSayac.current++}`
    setGonderiliyor(true)
    // Iyimser ekleme: mesaj sunucu yanitini beklemeden listede belirsin.
    // Onceden yalnizca Realtime yansitinca goruluyordu ve davranis
    // tutarsizdi (konusmayi acan ilk gonderimde gecmis yeniden cekildigi
    // icin hemen, sonrakilerde gecikmeli). gonderenId KENDI kimligim
    // olmali: bos string bir kez "karsi taraf yazmis gibi" cizdirdi
    // (kullanicinin bildirimi 2026-09-14) - benimMi kontrolu ona bakiyor.
    setMesajlar((mevcut) => [
      {
        id: yerelId,
        gonderenId: benimKimligim,
        metin: gonderilecekMetin,
        olusturuldu: new Date().toISOString(),
        yerelMi: true,
      },
      ...mevcut,
    ])
    try {
      const yeniKonusmaId = await mesajGonder(kullaniciId, gonderilecekMetin)
      setMetin('')
      setHata(null)
      if (!oncekiKonusmaId) {
        // Konusma listede yoktu: ya bu gonderimle ilk kez olustu ya da
        // gizlenmis bir konusma yeniden acildi. Ikinci durumda gecmis
        // var, o yuzden sunucudan cekiyoruz; donen liste iyimser satiri
        // da kapsadigi icin yerini tumden aliyor. Abonelik bu
        // konusmaId'ye yukaridaki efektle sonradan baglanacak.
        const gecmis = await mesajlariGetir(yeniKonusmaId)
        setMesajlar(gecmis)
        setKonusmaId(yeniKonusmaId)
      }
    } catch (e) {
      setHata(hataMesaji(e))
      // Gonderilemeyen mesaj listede kalmasin.
      setMesajlar((mevcut) => mevcut.filter((m) => m.id !== yerelId))
    } finally {
      setGonderiliyor(false)
    }
  }

  // SOHBETTE SIKAYET GIRISI YOK (kullanicinin karari 2026-09-19:
  // "mesajlar kismindan sikayet eti kaldir, sadece baska kullanicinin
  // profilinin uc noktasi icinde kalsin"). Ust bardaki "Sikayet et"
  // dugmesi ve balona uzun basinca acilan mesaj sikayeti kaldirildi;
  // sunucu (`sikayet_gonder` 'mesaj' turu) ve panel degismedi.
  // "Teslim edildi" YALNIZCA en son kendi mesajimin altinda (Instagram /
  // iMessage deseni): her balonun altina yazmak listeyi tekrarla
  // doldururdu; en sondaki, oncekilerin de ulastigini zaten soyluyor.
  // Iyimser (henuz sunucuya ulasmamis, yerelMi) satirda yazilmaz -
  // sozcuk ancak sunucu satiri geldiginde dogru olur. Liste ters
  // (inverted) oldugu icin "en son" = dizideki ILK kendi mesajim.
  const sonKendiMesajimId =
    mesajlar.find((m) => m.gonderenId !== null && m.gonderenId === benimKimligim && !m.yerelMi)?.id ?? null

  return (
    <View
      style={[
        stiller.kapsayici,
        klavyeYuksekligi > 0 && { paddingBottom: klavyeYuksekligi + bosluk.s },
      ]}
    >
      <View style={stiller.ustBar}>
        {/* GERI (kullanicinin istegi 2026-09-14). Uygulamada Stack yok
            (Slot), ekranin kendi oku sart. Bildirimden acilinca gecmis
            olmayabilir; o zaman Mesajlar listesine gidiyor. */}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/mesajlar'))}
          accessibilityRole="button"
          accessibilityLabel={t('ortak.geri')}
          hitSlop={12}
        >
          <GeriOkIkonu />
        </Pressable>
        {/* Avatar + ad TEK dokunus hedefi, ikisi de karsi tarafin
            profiline gider (kullanicinin istegi 2026-09-18: "profil
            resmine ve kullanici adina basinca onun profiline gitsin"). */}
        <Pressable
          testID="sohbet-avatar-dugmesi"
          onPress={profiliAc}
          accessibilityRole="button"
          accessibilityLabel={konusmaSatiri?.ad ?? t('sohbet.baslik')}
          style={stiller.kimlikDugmesi}
        >
          <Avatar
            fotografUrl={avatarUrl}
            ad={konusmaSatiri?.ad}
            kullaniciAdi={konusmaSatiri?.kullaniciAdi ?? ''}
            cap={UST_BAR_AVATAR_CAPI}
            testID="sohbet-avatar"
          />
          {/* Ad + altinda kullanici adi (kullanicinin istegi 2026-09-21). */}
          <View style={stiller.kimlikMetinler}>
            <Text style={stiller.baslik} numberOfLines={1} testID="sohbet-ad">
              {konusmaSatiri?.ad ?? t('sohbet.baslik')}
            </Text>
            {konusmaSatiri?.kullaniciAdi ? (
              <Text style={stiller.kullaniciAdi} numberOfLines={1} testID="sohbet-kullanici-adi">
                @{konusmaSatiri.kullaniciAdi}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>

      {/* MESAJ ISTEGI SERIDI: onaylanmadikca istek listesinde kaliyor.
          Cevap yazmak da kabul sayiliyor, o yuzden yazma alani acik. */}
      {istekMi && (
        <View style={stiller.istekSeridi}>
          <Text style={stiller.istekSeridiYazi}>{t('sohbet.istekSeridi')}</Text>
          <View style={stiller.istekButonlari}>
            <Pressable onPress={istegiKabulEt} accessibilityRole="button">
              <Text style={stiller.kabulButonu}>{t('sohbet.kabulEt')}</Text>
            </Pressable>
            <Pressable onPress={istegiReddet} accessibilityRole="button">
              <Text style={stiller.reddetButonu}>{t('sohbet.reddet')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        style={stiller.liste}
        data={mesajlar}
        keyExtractor={(m) => m.id}
        inverted
        renderItem={({ item, index }) => {
          // gonderen_id null = gonderen hesabini silmis. Kendi mesajim
          // olmadigi kesin, karsi balon olarak cizilir.
          const benimMi = item.gonderenId !== null && item.gonderenId === benimKimligim
          // GUN AYRACI (kullanicinin istegi 2026-09-14). Liste ters:
          // index+1 daha ESKI mesaj. Gun, eski mesajinkinden farkliysa
          // (ya da bu en eski mesajsa) bu balonun USTUNE ayrac konur.
          // Ters listede satir ici duzen normal, yani "ustune" = satirda
          // once cizmek.
          const eskisi = mesajlar[index + 1]
          const gunAyraci = !eskisi || !ayniGunMu(item.olusturuldu, eskisi.olusturuldu)
          const saat = saatYazisi(item.olusturuldu)
          const altYazi = item.id === sonKendiMesajimId ? `${saat} · ${t('sohbet.teslimEdildi')}` : saat
          // Karsi tarafin HER balonunun solunda kucuk avatar (kullanicinin
          // istegi 2026-09-14: "her yazdigi mesaj satirinin yaninda").
          // Balonun altina hizali; kendi balonumda yok.
          return (
            <View>
              {gunAyraci && (
                <Text style={stiller.gunAyraci} testID={`gun-ayraci-${item.id}`}>
                  {gunEtiketi(item.olusturuldu, dil, { bugun: t('sohbet.bugun'), dun: t('sohbet.dun') })}
                </Text>
              )}
              <View style={benimMi ? stiller.kendiSatiri : stiller.karsiSatiri}>
                {!benimMi && (
                  <Pressable
                    onPress={profiliAc}
                    accessibilityRole="button"
                    accessibilityLabel={konusmaSatiri?.ad ?? t('sohbet.baslik')}
                    hitSlop={6}
                    testID={`balon-avatar-dugmesi-${item.id}`}
                  >
                    <Avatar
                      fotografUrl={avatarUrl}
                      ad={konusmaSatiri?.ad}
                      kullaniciAdi={konusmaSatiri?.kullaniciAdi ?? ''}
                      cap={BALON_AVATAR_CAPI}
                      testID={`balon-avatar-${item.id}`}
                    />
                  </Pressable>
                )}
                <View style={[stiller.mesajBalonu, benimMi ? stiller.kendiBalonu : stiller.karsiBalonu]}>
                  <Text testID="mesaj-metni">{item.metin}</Text>
                </View>
              </View>
              {/* Saat her balonun altinda; en son kendi mesajimda yanina
                  "Teslim edildi" ekleniyor. Iyimser satirda saat yerel,
                  sunucu satiri gelince onunki. */}
              <Text
                style={[stiller.altYazi, benimMi ? stiller.altYaziSag : stiller.altYaziSol]}
                testID={item.id === sonKendiMesajimId ? `teslim-${item.id}` : `saat-${item.id}`}
              >
                {altYazi}
              </Text>
            </View>
          )
        }}
        ListEmptyComponent={<Text style={stiller.durum}>{t('sohbet.mesajYok')}</Text>}
      />

      {yazilabilirMi ? (
        <View style={stiller.girdiSatiri}>
          <TextInput
            style={stiller.girdi}
            placeholder={t('sohbet.yerTutucu')}
            value={metin}
            onChangeText={setMetin}
            multiline
          />
          <Pressable
            style={[stiller.gonderButonu, !gonderMumkun && stiller.gonderButonuPasif]}
            onPress={gonder}
            disabled={!gonderMumkun}
          >
            <Text style={stiller.gonderButonuYazi}>{gonderiliyor ? t('ortak.gonderiliyor') : t('ortak.gonder')}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={stiller.kapaliNot}>{t('sohbet.kapaliKapi')}</Text>
      )}
    </View>
  )
}

// Ust bar avatari liste satirlarindan (48) kucuk: baslik satirinin
// yuksekligini buyutmeden adin yaninda durmali.
const UST_BAR_AVATAR_CAPI = 36
// Balon yanindaki avatar: metin satirindan buyuk olmasin.
const BALON_AVATAR_CAPI = 28

const stilleriYap = (renk: Renk) => StyleSheet.create({
  // Balonun altinda, soluk ve kucuk: bilgi, vurgu degil. Karsi tarafta
  // avatar genisligi kadar iceriden baslar ki balonla hizali dursun.
  altYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    marginTop: -2,
    marginBottom: bosluk.xs,
  },
  altYaziSag: { alignSelf: 'flex-end', marginRight: bosluk.xs },
  altYaziSol: { alignSelf: 'flex-start', marginLeft: BALON_AVATAR_CAPI + bosluk.s + bosluk.xs },
  // Gun ayraci ortada, hap gibi: akisi boler ama bagirmaz.
  gunAyraci: {
    alignSelf: 'center',
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    backgroundColor: renk.karsilamaZemini,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.m,
    paddingVertical: 4,
    marginVertical: bosluk.m,
    overflow: 'hidden',
  },
  istekSeridi: {
    backgroundColor: renk.turuncuZemin,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.m,
    gap: bosluk.s,
  },
  istekSeridiYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  istekButonlari: { flexDirection: 'row', gap: bosluk.xl },
  kabulButonu: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  reddetButonu: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  // Alt gezinme cubugu artik her ekranda: yazma alani onun altinda
  // kalmasin.
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  ustBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: bosluk.m,
    marginBottom: bosluk.m,
  },
  // Avatar + ad birlikte; flex: 1 ile sikayet dugmesine kadar uzanir,
  // yani adin sagindaki bosluk da dokunus hedefi.
  kimlikDugmesi: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  kimlikMetinler: { flex: 1 },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kullaniciAdi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
  liste: { flex: 1 },

  karsiSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: bosluk.s },
  kendiSatiri: { alignItems: 'flex-end' },
  mesajBalonu: {
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: bosluk.s + 2,
    marginVertical: bosluk.xs,
    maxWidth: '80%',
    flexShrink: 1,
  },
  // Kendi mesajin turuncu: konusmada kimin konustugu tek bakista
  // okunmali. Turuncunun burada "eylem" degil "sen" demesi kimligin
  // izin verdigi tek istisna degil - mesaj da bir eylemdir.
  kendiBalonu: { alignSelf: 'flex-end', backgroundColor: renk.turuncu },
  karsiBalonu: {
    alignSelf: 'flex-start',
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },

  girdiSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: bosluk.s, marginTop: bosluk.s },
  girdi: {
    flex: 1,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 12,
    minHeight: 44,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  gonderButonu: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.l,
    paddingVertical: 12,
  },
  gonderButonuPasif: { backgroundColor: renk.metinSoluk },
  gonderButonuYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },

  kapaliNot: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    textAlign: 'center',
    marginTop: bosluk.s,
    paddingVertical: bosluk.m,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginBottom: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.xl,
    textAlign: 'center',
  },
})
