import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import {
  yorumlariGetir,
  yorumEkle,
  yorumSil,
  yorumuSikayetEt,
  YORUM_EN_FAZLA,
  type Yorum,
} from '../../../lib/etkilesim'
import { gorecelZaman } from '../../../lib/zaman'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

/**
 * YORUMLAR (kullanicinin istegi 2026-09-02).
 *
 * Kurallar - ucu de kullanicinin karari:
 *   1. Yorumu, PAYLASIMI GOREBILEN yazar. Ayri bir yetki kavrami yok;
 *      sunucudaki kontroller check-in gorunurlugune dayaniyor, yani
 *      gizli profilde yalnizca arkadaslar yazabiliyor.
 *   2. Yorumu, YAZAN ya da PAYLASIMIN SAHIBI silebilir. Hangi satirda
 *      silme cikacagini sunucu soyluyor (`silebilirMi`) - istemci
 *      tahmin etmiyor.
 *   3. Sikayet edilen yorum ANINDA gizlenir.
 */
export default function YorumlarEkrani() {
  const { checkInId } = useLocalSearchParams<{ checkInId: string }>()
  const router = useRouter()
  const { t } = useDil()

  const [yorumlar, setYorumlar] = useState<Yorum[]>([])
  const [metin, setMetin] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  // Yerinde acilan onaylar: silme ve sikayet GERI ALINAMAZ, tek
  // dokunusla yapilmiyor.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)
  const [sikayetOnayi, setSikayetOnayi] = useState<string | null>(null)

  async function yukle() {
    try {
      setYorumlar(await yorumlariGetir(checkInId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      yukle()
    }, [checkInId])
  )

  async function gonder() {
    const temiz = metin.trim()
    if (temiz.length === 0 || gonderiliyor) return

    setGonderiliyor(true)
    try {
      await yorumEkle(checkInId, temiz)
      // Once temizle, sonra tazele: kutu bosalmazsa kullanici ayni
      // yorumu ikinci kez gonderdigini saniyor.
      setMetin('')
      await yukle()
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
      setYorumlar((oncekiler) => oncekiler.filter((y) => y.id !== id))
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
      setYorumlar((oncekiler) => oncekiler.filter((y) => y.id !== id))
      setSikayetOnayi(null)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <KeyboardAvoidingView
      style={stiller.sayfa}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <UstCubuk baslik={t('etkilesim.yorumlar')} geriEtiketi={t('ortak.geri')} />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        data={yorumlar}
        keyExtractor={(y) => y.id}
        contentContainerStyle={stiller.liste}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.satirUst}>
              <Pressable
                onPress={() =>
                  item.kullaniciId && router.push(`/kullanici/${item.kullaniciId}` as never)
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

            <View style={stiller.satirEylemleri}>
              {item.silebilirMi && (
                <Pressable
                  onPress={() => setSilOnayi(silOnayi === item.id ? null : item.id)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.eylemYazi}>{t('etkilesim.yorumSil')}</Text>
                </Pressable>
              )}
              {!item.silebilirMi && (
                <Pressable
                  onPress={() => setSikayetOnayi(sikayetOnayi === item.id ? null : item.id)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.eylemYazi}>{t('etkilesim.yorumSikayet')}</Text>
                </Pressable>
              )}
            </View>

            {silOnayi === item.id && (
              <View style={stiller.onayAlani}>
                <Text style={stiller.onaySoru}>{t('etkilesim.yorumSilOnay')}</Text>
                <View style={stiller.onayDugmeleri}>
                  <Pressable onPress={() => setSilOnayi(null)} accessibilityRole="button" hitSlop={8}>
                    <Text style={stiller.vazgecYazi}>{t('ortak.vazgec')}</Text>
                  </Pressable>
                  <Pressable onPress={() => sil(item.id)} accessibilityRole="button" hitSlop={8}>
                    <Text style={stiller.tehlikeliYazi}>{t('ortak.sil')}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {sikayetOnayi === item.id && (
              <View style={stiller.onayAlani}>
                {/* Ne olacagini ONCEDEN soyluyor: sikayet edilen yorum
                    aninda gizleniyor, sonradan degil. */}
                <Text style={stiller.onaySoru}>{t('etkilesim.yorumSikayetOnay')}</Text>
                <View style={stiller.onayDugmeleri}>
                  <Pressable
                    onPress={() => setSikayetOnayi(null)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text style={stiller.vazgecYazi}>{t('ortak.vazgec')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => sikayetEt(item.id)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text style={stiller.tehlikeliYazi}>{t('etkilesim.yorumSikayet')}</Text>
                  </Pressable>
                </View>
              </View>
            )}
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

      <View style={stiller.yazmaAlani}>
        <TextInput
          style={stiller.girdi}
          value={metin}
          onChangeText={(d) => setMetin(d.slice(0, YORUM_EN_FAZLA))}
          placeholder={t('etkilesim.yorumYaz')}
          placeholderTextColor={renk.metinSoluk}
          multiline
          editable={!gonderiliyor}
        />
        <Pressable
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
    </KeyboardAvoidingView>
  )
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.s,
  },

  liste: { paddingHorizontal: bosluk.xl, paddingBottom: bosluk.l },
  satir: {
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  satirUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  yazar: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  zaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },
  metin: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: 3,
  },
  satirEylemleri: { flexDirection: 'row', gap: bosluk.l, marginTop: bosluk.s },
  eylemYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },

  onayAlani: {
    marginTop: bosluk.s,
    padding: bosluk.m,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    gap: bosluk.s,
  },
  onaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metin,
  },
  onayDugmeleri: { flexDirection: 'row', gap: bosluk.xl },
  vazgecYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  tehlikeliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },

  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    paddingTop: bosluk.xl,
  },
  bosAlan: { paddingTop: bosluk.xxl, alignItems: 'center' },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
  },

  yazmaAlani: {
    // ALT PAY SART: yuzer gezinme cubugu kok duzende ciziliyor ve bu
    // alanin uzerine biniyordu - "Yorum yaz" kutusu ve "Gonder"
    // cubugun arkasinda kaliyordu (gozle dogrulamada yakalandi,
    // testler yesildi). Sohbet ekraninda da ayni pay var.
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: bosluk.m,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
    borderTopWidth: 1,
    borderTopColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  girdi: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: 10,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  gonderYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
    paddingBottom: 10,
  },
  gonderPasif: { color: renk.metinSoluk },
})
