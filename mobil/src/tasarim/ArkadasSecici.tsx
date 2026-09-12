import { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { BagKisi } from '../../lib/bag'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * ARKADAS SECICI - alttan acilan, aranabilir, COKLU secim.
 *
 * Check-in ekranindaki "Arkadaş ekle" butonu bunu aciyor (kullanicinin
 * istegi 2026-09-12). Onceden etiketleme satir ici ciplerdi ve arkadas
 * listesi BOSKEN hic cizilmiyordu - yani hesabinda arkadas olmayan
 * biri bu ozelligin varligini hic gormuyordu. Buton her zaman
 * gorunuyor; liste bossa pencere sebebini soyluyor.
 *
 * `ListeSecici` KULLANILMADI: o tek secimlik (il / ilce) ve secince
 * kapaniyor. Burada birden fazla kisi isaretlenip "Tamam" ile
 * kapatiliyor; secim ekranda cip olarak duruyor.
 *
 * Metinler koda gomulu - check-in ekraninin geri kalaniyla ayni
 * durum (o ekran bastan beri sozlukte degil).
 */
export function ArkadasSecici({
  acikMi,
  arkadaslar,
  secili,
  onDegistir,
  onKapat,
}: {
  acikMi: boolean
  arkadaslar: BagKisi[]
  secili: string[]
  onDegistir: (kullaniciId: string) => void
  onKapat: () => void
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const [arama, setArama] = useState('')

  const suzulmus = useMemo(() => {
    const a = arama.trim().toLocaleLowerCase('tr')
    if (a.length === 0) return arkadaslar
    return arkadaslar.filter(
      (k) =>
        k.ad.toLocaleLowerCase('tr').includes(a) ||
        k.kullaniciAdi.toLowerCase().includes(a)
    )
  }, [arama, arkadaslar])

  function kapat() {
    setArama('')
    onKapat()
  }

  return (
    <Modal visible={acikMi} transparent animationType="slide" onRequestClose={kapat}>
      <Pressable style={stiller.perde} onPress={kapat} accessibilityRole="button" />
      <View style={stiller.pencere} testID="arkadas-secici">
        <Text style={stiller.baslik}>Arkadaşlarını etiketle</Text>

        {arkadaslar.length === 0 ? (
          // Sebep soyleniyor: bos bir liste "bozuk" gibi okunur.
          <Text style={stiller.bos}>
            Henüz arkadaşın yok. Arkadaşlık isteği gönderip kabul edildiğinde burada
            görünür ve check-in’lerinde etiketleyebilirsin.
          </Text>
        ) : (
          <>
            <TextInput
              style={stiller.arama}
              placeholder="Ara"
              placeholderTextColor={renk.metinIkincil}
              value={arama}
              onChangeText={setArama}
              autoCorrect={false}
              testID="arkadas-secici-arama"
            />
            <FlatList
              data={suzulmus}
              keyExtractor={(k) => k.id}
              keyboardShouldPersistTaps="handled"
              style={stiller.liste}
              renderItem={({ item }) => {
                const isaretli = secili.includes(item.id)
                return (
                  <Pressable
                    style={stiller.satir}
                    onPress={() => onDegistir(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isaretli }}
                    accessibilityLabel={item.ad}
                  >
                    <View style={stiller.satirMetin}>
                      <Text style={[stiller.ad, isaretli && stiller.adSecili]}>{item.ad}</Text>
                      <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
                    </View>
                    <View style={[stiller.kutu, isaretli && stiller.kutuSecili]}>
                      {isaretli && <Text style={stiller.tik}>✓</Text>}
                    </View>
                  </Pressable>
                )
              }}
              ListEmptyComponent={<Text style={stiller.bos}>Sonuç yok</Text>}
            />
          </>
        )}

        <Pressable style={stiller.tamam} onPress={kapat} accessibilityRole="button">
          <Text style={stiller.tamamYazi}>
            {secili.length > 0 ? `Tamam (${secili.length})` : 'Tamam'}
          </Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    perde: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    // Sabit yukseklik, `maxHeight` degil - ayni gerekce ListeSecici'de.
    pencere: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '62%',
      backgroundColor: renk.yuzey,
      borderTopLeftRadius: yuvarlak.buyuk,
      borderTopRightRadius: yuvarlak.buyuk,
      paddingHorizontal: bosluk.sayfa,
      paddingTop: bosluk.l,
      paddingBottom: bosluk.xl,
    },
    baslik: {
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.altBaslik,
      color: renk.metin,
      marginBottom: bosluk.m,
    },
    arama: {
      borderWidth: 1,
      borderColor: renk.cizgi,
      borderRadius: yuvarlak.kart,
      paddingHorizontal: bosluk.m,
      paddingVertical: 12,
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      color: renk.metin,
    },
    liste: { flex: 1, marginTop: bosluk.s },
    satir: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: renk.cizgi,
    },
    satirMetin: { flex: 1 },
    ad: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin },
    adSecili: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },
    kullaniciAdi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
    kutu: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: renk.cizgi,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kutuSecili: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
    tik: { color: '#FFFFFF', fontSize: 14, fontFamily: yazi.govdeKalin, lineHeight: 16 },
    bos: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      lineHeight: 20,
      color: renk.metinIkincil,
      paddingVertical: bosluk.l,
      flex: 1,
    },
    tamam: {
      backgroundColor: renk.turuncu,
      borderRadius: yuvarlak.hap,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: bosluk.m,
    },
    tamamYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
  })
