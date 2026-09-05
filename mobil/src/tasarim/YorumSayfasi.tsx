import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  yorumlariGetir,
  yorumEkle,
  yorumSil,
  yorumuSikayetEt,
  YORUM_EN_FAZLA,
  type Yorum,
} from '../../lib/etkilesim'
import { gorecelZaman } from '../../lib/zaman'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { OnayPenceresi } from './OnayPenceresi'
import { SecimPenceresi, UcNoktaIkonu, CopIkonu, BayrakIkonu, type Secim } from './SecimPenceresi'

/**
 * YORUMLAR - ALTTAN ACILAN SAYFA.
 *
 * Kullanicinin karari (2026-09-03, referans olarak Instagram'in yorum
 * sayfasini gostererek): "Yorum yazma ikonuna basinca boyle bir yorum
 * yazma yazilan yorumlari gorme yeri gelsin". Iki secenek gorsel olarak
 * sunuldu, kullanici "A"yi - yarim yukseklikte alt sayfayi - secti.
 *
 * ONCEKI HAL AYRI BIR SAYFAYDI (`/yorumlar/<id>`). Uc sorunu vardi:
 * paylasim gozden kayboluyordu (hangi paylasima yazdigin belli
 * degildi), alt gezinme cubugu altta duruyordu (cikmanin iki ayri yolu
 * gorunuyordu) ve akisa donmek bir sayfa gecisi gerektiriyordu. Sayfa
 * kaldirildi; bu bilesen onun yerini aldi.
 *
 * REFERANSTAN ALINMAYANLAR - uydurulmadi, cunku karsiligi yok:
 *   - "Yanitla": ic ice yanit (thread) yok, yorumlar tek seviyeli.
 *   - Yorum begenme: begeni paylasima ait, yoruma degil.
 *   - "Senin icin" siralamasi: yorumlar kronolojik.
 * Emoji seridi ALINDI: yeni bir veri turu gerektirmiyor, dokununca
 * yazma kutusuna emoji ekliyor - ayri bir "tepki" kavrami degil.
 *
 * Kurallar degismedi (ucu de kullanicinin karari):
 *   1. Yorumu, PAYLASIMI GOREBILEN yazar; ayri bir yetki kavrami yok.
 *   2. Yorumu, YAZAN ya da PAYLASIMIN SAHIBI siler. Hangi satirda
 *      silmenin cikacagini SUNUCU soyluyor (`silebilirMi`), istemci
 *      tahmin etmiyor.
 *   3. Sikayet edilen yorum ANINDA gizlenir.
 */

/** Hizli giris. Tepki degil - yazma kutusuna metin ekliyor. */
const EMOJILER = ['❤️', '🔥', '👏', '😮', '😂', '🙌']

export function YorumSayfasi({
  acikMi,
  checkInId,
  onKapat,
  onSayiDegisti,
}: {
  acikMi: boolean
  checkInId: string
  onKapat: () => void
  /** Karttaki yorum sayaci guncellensin diye. */
  onSayiDegisti?: (sayi: number) => void
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()

  const [yorumlar, setYorumlar] = useState<Yorum[]>([])
  const [metin, setMetin] = useState('')
  // Yazma kutusunun kendisi: emoji seridine basildiginda odak
  // kaybolmasin diye geri veriliyor.
  const girdiRef = useRef<TextInput>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [menuAcik, setMenuAcik] = useState<string | null>(null)
  const [silOnayi, setSilOnayi] = useState<string | null>(null)
  const [sikayetOnayi, setSikayetOnayi] = useState<string | null>(null)

  // Sayfa acildiginda yukleniyor; kapaliyken hicbir istek atilmiyor -
  // akista otuz kart var, hepsi acilista yorum cekseydi otuz gereksiz
  // sorgu olurdu.
  useEffect(() => {
    if (!acikMi) return
    let iptal = false
    setYukleniyor(true)
    yorumlariGetir(checkInId)
      .then((gelen) => {
        if (iptal) return
        setYorumlar(gelen)
        setHata(null)
        onSayiDegisti?.(gelen.length)
      })
      .catch((e) => {
        if (!iptal) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false)
      })
    return () => {
      iptal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acikMi, checkInId])

  if (!acikMi) return null

  function listeyiDegistir(yeni: Yorum[]) {
    setYorumlar(yeni)
    onSayiDegisti?.(yeni.length)
  }

  async function gonder() {
    const temiz = metin.trim()
    if (temiz.length === 0 || gonderiliyor) return

    setGonderiliyor(true)
    try {
      await yorumEkle(checkInId, temiz)
      // Once temizle, sonra tazele: kutu bosalmazsa kullanici ayni
      // yorumu ikinci kez gonderdigini saniyor.
      setMetin('')
      listeyiDegistir(await yorumlariGetir(checkInId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setGonderiliyor(false)
    }
  }

  // Iyimser guncelleme YOK: satir yalnizca sunucu onayladiktan sonra
  // kalkiyor. Basarisiz bir silme, yorum gitmis gibi yalan soylememeli.
  async function sil(id: string) {
    try {
      await yorumSil(id)
      listeyiDegistir(yorumlar.filter((y) => y.id !== id))
      setSilOnayi(null)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function sikayetEt(id: string) {
    try {
      await yorumuSikayetEt(id, 'taciz')
      // Yorum sunucuda ANINDA gizlendi; listeden de kalkiyor.
      listeyiDegistir(yorumlar.filter((y) => y.id !== id))
      setSikayetOnayi(null)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  const acikYorum = yorumlar.find((y) => y.id === menuAcik)
  const secimler: Secim[] = acikYorum
    ? acikYorum.silebilirMi
      ? [
          {
            etiket: t('etkilesim.yorumSil'),
            testID: 'secim-sil',
            ikon: <CopIkonu />,
            yikici: true,
            onSec: () => {
              setMenuAcik(null)
              setSilOnayi(acikYorum.id)
            },
          },
        ]
      : [
          {
            etiket: t('etkilesim.yorumSikayet'),
            testID: 'secim-sikayet',
            ikon: <BayrakIkonu />,
            yikici: true,
            onSec: () => {
              setMenuAcik(null)
              setSikayetOnayi(acikYorum.id)
            },
          },
        ]
    : []

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onKapat}>
      <View style={stiller.kok}>
        {/* Karartmaya dokunmak kapatiyor. Yarim yukseklik secildigi icin
            paylasimin ustu arkada gorunmeye devam ediyor - hangi
            paylasima yazdigin hep belli. */}
        <Pressable style={stiller.karartma} testID="yorum-zemini" onPress={onKapat} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={stiller.sayfaKabi}
        >
          <View style={stiller.sayfa} testID="yorum-sayfasi">
            <View style={stiller.tutamacAlani}>
              <View style={stiller.tutamac} />
            </View>

            <View style={stiller.baslikAlani}>
              <Text style={stiller.baslik} accessibilityRole="header">
                {t('etkilesim.yorumlar')}
              </Text>
              {yorumlar.length > 0 && (
                <Text style={stiller.sayi}>
                  {t('etkilesim.yorumSayisi', { sayi: String(yorumlar.length) })}
                </Text>
              )}
              <Pressable
                style={stiller.kapat}
                onPress={onKapat}
                accessibilityRole="button"
                accessibilityLabel={t('ortak.kapat')}
                hitSlop={10}
              >
                <Text style={stiller.kapatYazi}>×</Text>
              </Pressable>
            </View>

            {hata && <Text style={stiller.hata}>{hata}</Text>}

            <FlatList
              data={yorumlar}
              keyExtractor={(y) => y.id}
              // flex:1 SART: olmadan liste icerigi kadar yer kapliyor ve
              // emoji seridi ile yazma alani sayfanin ortasinda asili
              // kaliyor, altta bos beyaz bir alan olusuyordu (olculdu).
              style={stiller.listeKabi}
              contentContainerStyle={stiller.liste}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View style={stiller.satir}>
                  <View style={stiller.avatar}>
                    <Text style={stiller.basHarf}>
                      {(item.kullaniciAdi ?? '?').trim().charAt(0).toLocaleUpperCase('tr-TR')}
                    </Text>
                  </View>

                  <View style={stiller.govde}>
                    <View style={stiller.satirUst}>
                      <Pressable
                        onPress={() =>
                          item.kullaniciId &&
                          router.push(`/kullanici/${item.kullaniciId}` as never)
                        }
                        accessibilityRole="button"
                        hitSlop={6}
                      >
                        <Text style={stiller.yazar}>
                          {item.kullaniciAdi ?? t('etkilesim.silinmisKullanici')}
                        </Text>
                      </Pressable>
                      <Text style={stiller.zaman}>{gorecelZaman(item.olusturuldu, t)}</Text>
                    </View>
                    <Text style={stiller.metin}>{item.metin}</Text>
                  </View>

                  <Pressable
                    testID={`yorum-menu-${item.id}`}
                    onPress={() => setMenuAcik(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('anaSayfa.secenekler')}
                    hitSlop={10}
                    style={stiller.menuDugmesi}
                  >
                    <UcNoktaIkonu />
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                yukleniyor ? (
                  <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>
                ) : (
                  <View style={stiller.bosAlan}>
                    <Text style={stiller.bosBaslik}>{t('etkilesim.bosYorumBaslik')}</Text>
                    <Text style={stiller.bosAciklama}>{t('etkilesim.bosYorumAciklama')}</Text>
                  </View>
                )
              }
            />

            {/* Emoji dokunusu GONDERMIYOR, yazma kutusuna ekliyor:
                yanlislikla gonderilen bir tepki geri alinamaz. */}
            <View style={stiller.emojiSerit}>
              {EMOJILER.map((emoji, sira) => (
                <Pressable
                  key={emoji}
                  testID={`emoji-${sira}`}
                  onPress={() => {
                    setMetin((m) => (m + emoji).slice(0, YORUM_EN_FAZLA))
                    // ODAK GERI VERILIYOR (kullanicinin bildirdigi hata
                    // 2026-09-05): emoji seridi yazma kutusunun DISINDA
                    // oldugu icin ona dokunmak TextInput'u blur ediyor,
                    // klavye kapaniyor ve sayfa asagi iniyor. Kullanici
                    // arka arkaya emoji secemiyordu.
                    //
                    // `keyboardShouldPersistTaps` bu durumu COZMUYOR:
                    // o ayar listedeki dokunuslar icin ve serit listenin
                    // disinda.
                    girdiRef.current?.focus()
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={emoji}
                  hitSlop={6}
                >
                  <Text style={stiller.emoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <View style={stiller.yazmaAlani}>
              <TextInput
                ref={girdiRef}
                testID="yorum-girdisi"
                style={stiller.girdi}
                value={metin}
                onChangeText={(d) => setMetin(d.slice(0, YORUM_EN_FAZLA))}
                maxLength={YORUM_EN_FAZLA}
                placeholder={t('etkilesim.yorumYaz')}
                placeholderTextColor={renk.metinSoluk}
                multiline
                editable={!gonderiliyor}
              />
              <Pressable
                testID="yorum-gonder"
                onPress={gonder}
                disabled={metin.trim().length === 0 || gonderiliyor}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text
                  style={[
                    stiller.gonderYazi,
                    (metin.trim().length === 0 || gonderiliyor) && stiller.gonderPasif,
                  ]}
                >
                  {t('etkilesim.gonder')}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

        <SecimPenceresi
          acikMi={menuAcik !== null}
          secimler={secimler}
          onKapat={() => setMenuAcik(null)}
        />

        <OnayPenceresi
          acikMi={silOnayi !== null}
          baslik={t('etkilesim.yorumSilOnay')}
          eylemEtiketi={t('ortak.sil')}
          onOnay={() => silOnayi && sil(silOnayi)}
          onVazgec={() => setSilOnayi(null)}
        />

        <OnayPenceresi
          acikMi={sikayetOnayi !== null}
          baslik={t('etkilesim.yorumSikayet')}
          aciklama={t('etkilesim.yorumSikayetOnay')}
          eylemEtiketi={t('etkilesim.yorumSikayet')}
          onOnay={() => sikayetOnayi && sikayetEt(sikayetOnayi)}
          onVazgec={() => setSikayetOnayi(null)}
        />
      </View>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, justifyContent: 'flex-end' },
  karartma: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 19, 15, 0.45)',
  },
  // SABIT yukseklik, maxHeight DEGIL: icerige gore buyuyup kuculen bir
  // sayfa, yorum eklendikce zipliyor ve bos durumda kucucuk bir serit
  // gibi duruyordu (olculdu). Kullanicinin sectigi "A" duzeni yarim
  // yukseklik demek - paylasimin ustu arkada gorunmeye devam ediyor.
  sayfaKabi: { height: '74%' },
  sayfa: {
    backgroundColor: renk.yuzey,
    borderTopLeftRadius: yuvarlak.buyuk,
    borderTopRightRadius: yuvarlak.buyuk,
    // Yarim yukseklik (kullanicinin secimi "A"): paylasimin ustu arkada
    // gorunur kaliyor.
    height: '100%',
    overflow: 'hidden',
  },
  tutamacAlani: { alignItems: 'center', paddingTop: bosluk.s, paddingBottom: 2 },
  tutamac: { width: 38, height: 4, borderRadius: yuvarlak.hap, backgroundColor: renk.cizgi },
  baslikAlani: {
    alignItems: 'center',
    paddingBottom: bosluk.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: renk.cizgi,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    letterSpacing: -0.2,
    color: renk.metin,
  },
  sayi: { fontFamily: yazi.govde, fontSize: olcek.minik, color: renk.metinIkincil },
  kapat: { position: 'absolute', right: bosluk.l, top: -2, padding: bosluk.xs },
  kapatYazi: { fontFamily: yazi.govde, fontSize: 22, color: renk.metinSoluk, lineHeight: 24 },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.s,
  },

  listeKabi: { flex: 1 },
  liste: { paddingHorizontal: bosluk.l, paddingVertical: bosluk.m, gap: bosluk.l },
  satir: { flexDirection: 'row', gap: bosluk.m, alignItems: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: { fontFamily: yazi.ekranBasligi, fontSize: olcek.kucuk, color: renk.turuncu },
  govde: { flex: 1, minWidth: 0 },
  satirUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  yazar: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.metin },
  zaman: { fontFamily: yazi.govde, fontSize: olcek.minik, color: renk.metinSoluk },
  metin: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin, marginTop: 1 },
  menuDugmesi: { paddingTop: 2 },

  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    textAlign: 'center',
    paddingVertical: bosluk.xl,
  },
  bosAlan: { alignItems: 'center', paddingVertical: bosluk.xxl, gap: bosluk.xs },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    letterSpacing: -0.2,
    color: renk.metin,
  },
  bosAciklama: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },

  emojiSerit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: bosluk.xl,
    paddingVertical: bosluk.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: renk.cizgi,
  },
  emoji: { fontSize: 22 },

  yazmaAlani: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.s,
    paddingBottom: bosluk.l,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: renk.cizgi,
  },
  girdi: {
    flex: 1,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.s,
    maxHeight: 96,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  gonderYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncu },
  gonderPasif: { color: renk.metinSoluk },
})
