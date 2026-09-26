import { useEffect, useState } from 'react'
import { View, Text, Modal, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useDil } from '../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { Avatar } from './Avatar'
import { ifadeBul } from '../../lib/ifadeler'

export type ListeKisisi = {
  id: string
  ad: string
  kullaniciAdi: string
  avatarUrl: string | null
  /** Hikaye gorenlerinde: kisinin aniya attigi ifade (slug). Satirin
   *  saginda cizilir (2026-09-24). Begenenlerde yok. */
  ifade?: string | null
  /** Anliga biraktigi standart emoji (2026-09-26); ifadeden once gelir. */
  emoji?: string | null
}

/**
 * KISI LISTESI SAYFASI (2026-09-22): begenenler ve hikaye goruntuleyenler
 * icin ortak kabuk - BegenenlerSayfasi'ndan genellendi. Yorum sayfasiyla
 * ayni kabuk: alttan gelen yarim sayfa, tutamac, baslik + x, liste. Satir:
 * avatar, ad, @kullanici adi; dokununca profil (sayfa once kapanir -
 * Modal ustune push kurali, 2026-09-20).
 *
 * `yukle` cagiranin isi (begenenleriGetir / hikayeGoruntuleyenleriGetir);
 * `anahtar` degisince liste yeniden okunur. `testIDOnEki`: sayfa
 * `<onek>-sayfasi`, zemin `<onek>-zemini`, satir `<onekTekil>-<id>`.
 */
export function KisiListesiSayfasi({
  acikMi,
  anahtar,
  baslik,
  bosMetin,
  yukle,
  onKapat,
  testIDOnEki,
  satirTestIDOnEki,
}: {
  acikMi: boolean
  /** Listeyi kimligi degistiginde yeniden yukleten anahtar (check-in ya da hikaye id). */
  anahtar: string
  baslik: string
  bosMetin: string
  yukle: () => Promise<ListeKisisi[]>
  onKapat: () => void
  testIDOnEki: string
  satirTestIDOnEki: string
}) {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const [kisiler, setKisiler] = useState<ListeKisisi[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    if (!acikMi) return
    let gecerli = true
    setKisiler(null)
    setHata(null)
    yukle()
      .then((liste) => {
        if (gecerli) setKisiler(liste)
      })
      .catch((e) => {
        if (gecerli) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      })
    return () => {
      gecerli = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acikMi, anahtar])

  if (!acikMi) return null

  function profileGit(id: string) {
    onKapat()
    // Modal kapanmadan push arkada kalir (2026-09-20 dersi).
    setTimeout(() => router.push(`/kullanici/${id}` as never), 80)
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onKapat}>
      <View style={stiller.kok}>
        <Pressable style={stiller.karartma} testID={`${testIDOnEki}-zemini`} onPress={onKapat} />
        <View style={stiller.sayfa} testID={`${testIDOnEki}-sayfasi`}>
          <View style={stiller.tutamacAlani}>
            <View style={stiller.tutamac} />
          </View>
          <View style={stiller.baslikAlani}>
            <Text style={stiller.baslik} accessibilityRole="header">
              {baslik}
            </Text>
            {kisiler && kisiler.length > 0 && <Text style={stiller.sayi}>{kisiler.length}</Text>}
            <Pressable style={stiller.kapat} onPress={onKapat} accessibilityRole="button" accessibilityLabel={t('ortak.kapat')} hitSlop={10}>
              <Text style={stiller.kapatYazi}>×</Text>
            </Pressable>
          </View>

          {hata && <Text style={stiller.hata}>{hata}</Text>}
          {kisiler === null && !hata && <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>}
          {kisiler && kisiler.length === 0 && <Text style={stiller.durum}>{bosMetin}</Text>}

          <FlatList
            data={kisiler ?? []}
            keyExtractor={(k) => k.id}
            style={stiller.listeKabi}
            contentContainerStyle={stiller.liste}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [stiller.satir, pressed && stiller.basili]}
                onPress={() => profileGit(item.id)}
                accessibilityRole="button"
                accessibilityLabel={t('etkilesim.profiliGor', { ad: item.kullaniciAdi })}
                testID={`${satirTestIDOnEki}-${item.id}`}
              >
                <Avatar fotografUrl={item.avatarUrl} ad={item.ad} kullaniciAdi={item.kullaniciAdi} cap={44} />
                <View style={stiller.metinler}>
                  <Text style={stiller.ad} numberOfLines={1}>
                    {item.ad || item.kullaniciAdi}
                  </Text>
                  <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                    @{item.kullaniciAdi}
                  </Text>
                </View>
                {item.emoji ? (
                  <Text style={stiller.emoji} accessibilityLabel={item.emoji} testID={`${satirTestIDOnEki}-emoji-${item.id}`}>
                    {item.emoji}
                  </Text>
                ) : item.ifade && ifadeBul(item.ifade) ? (
                  <Image
                    source={ifadeBul(item.ifade)!.kaynak}
                    style={stiller.ifade}
                    contentFit="contain"
                    accessibilityLabel={ifadeBul(item.ifade)!.etiket}
                    testID={`${satirTestIDOnEki}-ifade-${item.id}`}
                  />
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { flex: 1, justifyContent: 'flex-end' },
    karartma: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23, 19, 15, 0.45)' },
    sayfa: {
      height: '62%',
      backgroundColor: renk.yuzey,
      borderTopLeftRadius: yuvarlak.buyuk,
      borderTopRightRadius: yuvarlak.buyuk,
    },
    tutamacAlani: { alignItems: 'center', paddingTop: bosluk.s, paddingBottom: 2 },
    tutamac: { width: 38, height: 4, borderRadius: yuvarlak.hap, backgroundColor: renk.cizgi },
    baslikAlani: { alignItems: 'center', paddingVertical: bosluk.s, paddingHorizontal: bosluk.sayfa },
    baslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metin },
    sayi: { fontFamily: yazi.govde, fontSize: olcek.minik, color: renk.metinIkincil },
    kapat: { position: 'absolute', right: bosluk.l, top: -2, padding: bosluk.xs },
    kapatYazi: { fontFamily: yazi.govde, fontSize: 22, color: renk.metinSoluk, lineHeight: 24 },
    hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, textAlign: 'center', paddingHorizontal: bosluk.sayfa },
    durum: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, textAlign: 'center', paddingVertical: bosluk.l },
    listeKabi: { flex: 1 },
    liste: { paddingHorizontal: bosluk.sayfa, paddingBottom: bosluk.xl },
    satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, paddingVertical: 10 },
    basili: { opacity: 0.7 },
    metinler: { flex: 1 },
    ifade: { width: 36, height: 36 },
    emoji: { fontSize: 28, lineHeight: 34 },
    ad: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
    kullaniciAdi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  })
