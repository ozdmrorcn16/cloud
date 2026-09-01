import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { konusmalarimiGetir, konusmayiGizle, type Konusma } from '../../lib/sohbet'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

export default function MesajlarEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([])
  const [hata, setHata] = useState<string | null>(null)

  async function konusmalariYukle() {
    try {
      setKonusmalar(await konusmalarimiGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
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
        <Text style={stiller.baslik}>{t('mesajlar.baslik')}</Text>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <FlatList
          data={konusmalar}
          keyExtractor={(k) => k.konusmaId}
          contentContainerStyle={stiller.liste}
          ListHeaderComponent={
            /* ISTEKLER GIRISI - SABIT (kullanicinin karari 2026-09-01:
               "Istekler yazisi sabit, basinca yeni sayfa geliyor").
               Istek olmasa da duruyor; sayfa acildiginda bos durum
               metni gorunuyor. */
            <Pressable
              style={stiller.istekGirisi}
              onPress={() => router.push('/mesaj-istekleri')}
              accessibilityRole="button"
            >
              <Text style={stiller.istekGirisiYazi}>{t('mesajlar.istekler')}</Text>
              <Text style={stiller.istekGirisiOk}>›</Text>
            </Pressable>
          }
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
            // Bos ekran yon veriyor: neden bos oldugunu ve nasil
            // dolacagini soyluyor.
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('mesajlar.bosBaslik')}</Text>
              <Text style={stiller.bosAciklama}>{t('mesajlar.bosAciklama')}</Text>
            </View>
          }
        />
      </View>

    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  istekGirisi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
    marginBottom: bosluk.s,
  },
  istekGirisiYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  istekGirisiOk: { fontFamily: yazi.govde, fontSize: olcek.altBaslik, color: renk.metinSoluk },
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
    marginBottom: bosluk.m,
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
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    textAlign: 'center',
    marginTop: bosluk.s,
    maxWidth: 300,
  },
})
