import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useRouter, useFocusEffect } from 'expo-router'
import { useDil } from '../../lib/dil'
import { anlikArsiviniGetir, anlikAktifMi, ANI_KART_ORANI, type Hikaye } from '../../lib/hikaye'
import { gunEtiketi } from '../../lib/zaman'
import { yazi, olcek, bosluk, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { UstCubuk } from '../tasarim/UstCubuk'

const SUTUN = 3
const ARA = 4

/**
 * ANLIK ARSIVI (2026-09-24, kullanicinin karari): "Anliklar 24 saat
 * durucak; sag ustte atilan anliklarin kayitli kalabilecegi bir alan."
 * Ana sayfanin sag ust ikonundan acilir. YALNIZCA SAHIBI gorur - kisinin
 * kendi butun anliklari, en yeni once. Kareler anlik kartiyla ayni
 * oranda (ANI_KART_ORANI) ki kadraj degismesin; dokunmak izleyiciyi o
 * anliktan acar (`/hikaye/izle?arsiv=<id>`), orada dokunus/kaydirmayla
 * gezilir. Hala seritte olan (24 saati dolmamis) anlikta turuncu nokta.
 */
export default function AnlikArsiviEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t, dil } = useDil()
  const { width } = useWindowDimensions()
  const [anliklar, setAnliklar] = useState<Hikaye[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  // Her donuste taze: izleyicide silinen anlik listeden dussun.
  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      anlikArsiviniGetir()
        .then((g) => {
          if (!gecerli) return
          setAnliklar(g?.hikayeler ?? [])
          setHata(null)
        })
        .catch((e) => {
          if (gecerli) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
        })
      return () => {
        gecerli = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const kareEni = Math.floor((width - bosluk.sayfa * 2 - ARA * (SUTUN - 1)) / SUTUN)

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('hikaye.arsivBaslik')} geriEtiketi={t('ortak.geri')} />
      {anliklar === null && !hata ? (
        <ActivityIndicator style={stiller.yukleniyor} color={renk.turuncu} />
      ) : (
        <FlatList
          data={anliklar ?? []}
          keyExtractor={(h) => h.id}
          numColumns={SUTUN}
          columnWrapperStyle={{ gap: ARA }}
          contentContainerStyle={[stiller.icerik, { paddingBottom: ALT_GEZINME_PAYI + bosluk.l }]}
          ListHeaderComponent={
            <Text style={stiller.aciklama} testID="arsiv-aciklama">
              {t('hikaye.arsivAciklama')}
            </Text>
          }
          ListEmptyComponent={
            <Text style={stiller.bos} testID="arsiv-bos">
              {hata ?? t('hikaye.arsivBos')}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/hikaye/izle?arsiv=${item.id}` as never)}
              accessibilityRole="imagebutton"
              accessibilityLabel={gunEtiketi(item.olusturuldu, dil, { bugun: t('sohbet.bugun'), dun: t('sohbet.dun') })}
              testID={`arsiv-${item.id}`}
              style={({ pressed }) => [stiller.kare, { width: kareEni }, pressed && stiller.basili]}
            >
              {item.fotografUrl ? (
                <Image source={{ uri: item.fotografUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
              ) : null}
              <View style={stiller.tarihHapi}>
                <Text style={stiller.tarih} numberOfLines={1}>
                  {gunEtiketi(item.olusturuldu, dil, { bugun: t('sohbet.bugun'), dun: t('sohbet.dun') })}
                </Text>
              </View>
              {anlikAktifMi(item.bitis) ? <View style={stiller.aktifNokta} testID={`arsiv-aktif-${item.id}`} /> : null}
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { flex: 1, backgroundColor: renk.zemin },
    yukleniyor: { marginTop: bosluk.xl },
    icerik: { paddingHorizontal: bosluk.sayfa, gap: ARA },
    aciklama: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      marginBottom: bosluk.m,
    },
    bos: {
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      color: renk.metinIkincil,
      textAlign: 'center',
      marginTop: bosluk.xl,
    },
    kare: {
      aspectRatio: ANI_KART_ORANI,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: renk.cizgi,
    },
    basili: { opacity: 0.85 },
    tarihHapi: {
      position: 'absolute',
      left: 6,
      bottom: 6,
      maxWidth: '90%',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    tarih: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk - 1, color: '#FFFFFF' },
    aktifNokta: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: renk.turuncu,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
  })
