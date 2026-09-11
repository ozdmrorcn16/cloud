import { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * UZUN BIR LISTEDEN TEK SECIM - alttan acilan, aranabilir pencere.
 *
 * Kullanicinin istegi (2026-09-11): profilde "yasadigin bolge" icin il
 * ve ilce SECILSIN. 81 il ve bir ilde 17'ye varan ilce, mevcut
 * `SecimPenceresi` ile gosterilemez - o bilesen uc bes secimlik bir
 * eylem menusu, kaydirilmiyor ve arama kutusu yok.
 *
 * ARAMA KUTUSU 81 IL ICIN SART: alfabetik bir listede "Zonguldak"a
 * inmek icin kaydirmak zorunda kalmak, iki harf yazmaktan cok daha
 * yorucu. Ilce listeleri kisa oldugu icin orada arama isteğe bagli
 * kaliyor ama ayni bilesen kullaniliyor - iki ayri secici yazmak, biri
 * degistiginde otekinin geride kalmasi demek olurdu.
 *
 * `Alert`/native picker DEGIL: uygulama web'de de calisiyor ve platform
 * seciciler uc platformda uc turlu gorunuyor (ayni gerekce
 * `TarihSecici` ve `OnayPenceresi` icin de gecerliydi).
 */
export function ListeSecici({
  acikMi,
  baslik,
  secenekler,
  secili,
  onSec,
  onKapat,
}: {
  acikMi: boolean
  baslik: string
  secenekler: string[]
  secili?: string | null
  onSec: (deger: string) => void
  onKapat: () => void
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [arama, setArama] = useState('')

  const suzulmus = useMemo(() => {
    const a = arama.trim().toLocaleLowerCase('tr')
    if (a.length === 0) return secenekler
    return secenekler.filter((s) => s.toLocaleLowerCase('tr').includes(a))
  }, [arama, secenekler])

  return (
    <Modal visible={acikMi} transparent animationType="slide" onRequestClose={onKapat}>
      {/* Perde KAPATIYOR ama secmiyor: yanlislikla acilan bir
          pencereden cikmanin yolu olmali. */}
      <Pressable style={stiller.perde} onPress={onKapat} accessibilityRole="button" />
      <View style={stiller.pencere}>
        <Text style={stiller.baslik}>{baslik}</Text>

        <TextInput
          style={stiller.arama}
          placeholder={t('ortak.ara')}
          placeholderTextColor={renk.metinIkincil}
          value={arama}
          onChangeText={setArama}
          autoCorrect={false}
          testID="liste-secici-arama"
        />

        <FlatList
          data={suzulmus}
          keyExtractor={(s) => s}
          keyboardShouldPersistTaps="handled"
          style={stiller.liste}
          renderItem={({ item }) => (
            <Pressable
              style={stiller.satir}
              onPress={() => {
                // Arama SIFIRLANIYOR: pencere bir sonraki acilista
                // onceki aramayla suzulmus gelseydi liste sebepsiz
                // kisa gorunurdu.
                setArama('')
                onSec(item)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: item === secili }}
            >
              <Text style={[stiller.satirYazi, item === secili && stiller.satirSecili]}>
                {item}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={stiller.bos}>{t('ortak.sonucYok')}</Text>}
        />
      </View>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    perde: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    /*
     * SABIT YUKSEKLIK, `maxHeight` DEGIL: icerige gore buzulen bir
     * pencere, tek sonuclu bir aramada ekranin altinda kucucuk bir
     * serit gibi duruyor. Ayni tuzak `YorumSayfasi`nda yasandi
     * (2026-09-03).
     */
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
    satir: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: renk.cizgi },
    satirYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin },
    satirSecili: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },
    bos: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      paddingVertical: bosluk.l,
    },
  })
