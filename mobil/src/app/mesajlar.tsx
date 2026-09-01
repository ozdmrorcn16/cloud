import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import {
  konusmalarimiGetir,
  konusmayiGizle,
  mesajIsteklerimiGetir,
  type Konusma,
} from '../../lib/sohbet'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

export default function MesajlarEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([])
  const [istekSayisi, setIstekSayisi] = useState(0)
  const [hata, setHata] = useState<string | null>(null)

  // Iki istek PARALEL gidiyor: rozet, konusma listesinin donmesini
  // beklemesin. allSettled kullaniliyor cunku ikisi ayni agirlikta
  // degil - istek sayisi cekilemezse rozet cizilmez ve ekran calismaya
  // devam eder; mesaj kutusunu ikincil bir bilgi yuzunden hata
  // ekranina cevirmek orantisiz olur.
  async function konusmalariYukle() {
    const [gelenKonusmalar, gelenIstekler] = await Promise.allSettled([
      konusmalarimiGetir(),
      mesajIsteklerimiGetir(),
    ])

    if (gelenKonusmalar.status === 'fulfilled') {
      setKonusmalar(gelenKonusmalar.value)
      setHata(null)
    } else {
      const e = gelenKonusmalar.reason
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }

    setIstekSayisi(gelenIstekler.status === 'fulfilled' ? gelenIstekler.value.length : 0)
  }

  // useEffect yalnizca ilk acilista bir kez cekiyordu: kullanici bir
  // konusmayi acip okuyup geri donunce okunmamis rozeti eski deger de
  // kaliyordu. useFocusEffect ekran her odaklandiginda yeniden cekiyor.
  useFocusEffect(
    useCallback(() => {
      konusmalariYukle()
    }, [])
  )

  // Iyimser guncelleme deseni: durumu yalnizca await cozuldukten SONRA
  // degistiriyoruz. Boylece basarisiz bir gizleme, satiri listeden
  // kaldirmis gibi yalan soylemiyor - hata gosterilir, satir yerinde kalir.
  async function gizle(konusmaId: string) {
    try {
      await konusmayiGizle(konusmaId)
      setKonusmalar((mevcut) => mevcut.filter((k) => k.konusmaId !== konusmaId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <View style={stiller.icerikAlani}>
        {/* ISTEKLER GIRISI - baslik satirinin SAG UCUNDA (kullanicinin
            karari 2026-09-01: "Istekler yazisi Mesajlar yazisinin
            karsisinda sag ustte olsun"). Satir SABIT: bekleyen istek
            olmasa da duruyor, sayfa acildiginda bos durum metni
            gorunuyor. Yazi notr gri, dikkati sayi rozeti cekiyor. */}
        <View style={stiller.baslikSatiri}>
          <Text style={stiller.baslik}>{t('mesajlar.baslik')}</Text>
          <Pressable
            style={stiller.istekGirisi}
            onPress={() => router.push('/mesaj-istekleri')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={stiller.istekGirisiYazi}>{t('mesajlar.istekler')}</Text>
            {istekSayisi > 0 && (
              <View style={stiller.istekRozeti}>
                <Text testID="istek-sayisi" style={stiller.istekRozetiYazi}>
                  {istekSayisi}
                </Text>
              </View>
            )}
            <Text style={stiller.istekGirisiOk}>›</Text>
          </Pressable>
        </View>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <FlatList
          data={konusmalar}
          keyExtractor={(k) => k.konusmaId}
          contentContainerStyle={stiller.liste}
          renderItem={({ item }) => {
            // Karsi taraf hesabini silmisse uyelik satiri yok; konusma
            // listede kalir ama kime ait oldugu artik bilinmiyor (spec
            // karar 69). Rota kullaniciId istiyor, null ile acilamaz.
            const gorunenAd = item.ad ?? t('mesajlar.silinmisKullanici')
            const acilabilirMi = item.kisiId !== null
            const okunmamis = item.okunmamis > 0

            return (
              <View style={stiller.satir}>
                <Pressable
                  style={stiller.icerik}
                  onPress={() => acilabilirMi && router.push(`/sohbet/${item.kisiId}`)}
                  disabled={!acilabilirMi}
                  accessibilityRole="button"
                >
                  <View style={stiller.ustSatir}>
                    <Text
                      style={[stiller.ad, okunmamis && stiller.adOkunmamis]}
                      numberOfLines={1}
                    >
                      {gorunenAd}
                    </Text>
                    {okunmamis && (
                      <View style={stiller.rozet}>
                        <Text style={stiller.rozetYazi}>{item.okunmamis}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[stiller.sonMesaj, okunmamis && stiller.sonMesajOkunmamis]}
                    numberOfLines={1}
                  >
                    {item.sonMesaj ?? ''}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => gizle(item.konusmaId)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.gizleButonu}>{t('mesajlar.gizle')}</Text>
                </Pressable>
              </View>
            )
          }}
          ListEmptyComponent={
            // Yalnizca baslik (kullanicinin karari 2026-09-01): altindaki
            // "kimlerle mesajlasabilirsin" cumlesi kaldirildi.
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('mesajlar.bosBaslik')}</Text>
            </View>
          }
        />
      </View>

    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  baslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: bosluk.m,
  },
  istekGirisi: { flexDirection: 'row', alignItems: 'center', gap: bosluk.xs },
  // Notr gri: baslikla yarismiyor. Dikkati ceken sey yazi degil, yaninda
  // beliren turuncu sayi - yani "bakilacak bir sey oldugunda" one cikiyor.
  istekGirisiYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  istekGirisiOk: { fontFamily: yazi.govde, fontSize: olcek.altBaslik, color: renk.metinSoluk },
  istekRozeti: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  istekRozetiYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  icerikAlani: {
    flex: 1,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
  },

  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },

  liste: { paddingBottom: ALT_GEZINME_PAYI },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  icerik: { flex: 1, marginRight: bosluk.m },
  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  ad: {
    flexShrink: 1,
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  // Okunmamis konusma daha koyu ve kalin: liste icinde goz once oraya
  // gitsin.
  adOkunmamis: { fontFamily: yazi.govdeKalin },
  sonMesaj: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    marginTop: 2,
  },
  sonMesajOkunmamis: { color: renk.metinIkincil },

  rozet: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rozetYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: '#FFFFFF',
  },

  gizleButonu: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },

  bosAlan: { paddingTop: bosluk.xxl, alignItems: 'center' },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
  },
})
