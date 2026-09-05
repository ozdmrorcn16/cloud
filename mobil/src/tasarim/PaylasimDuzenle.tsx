import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { NOT_EN_FAZLA } from '../../lib/checkin'
import type { Etiket } from '../../lib/etiket'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * PAYLASIMI DUZENLEME PENCERESI.
 *
 * Kullanicinin istegi (2026-09-02): "icerigi yaptigi paylasimi
 * duzenleyebilecek yaptigi etiketi kaldirabilir yazdigi notu silebilir
 * degistirebilir".
 *
 * NOTU SILMEK AYRI BIR DUGME DEGIL: alani bosaltip kaydetmek notu
 * siliyor. Iki ayri yol (bir "temizle" dugmesi ve bir de bos kaydetme)
 * ayni sonucu vermenin iki yolu olurdu; sunucu da bos metni NULL'a
 * cevirdigi icin davranis tek.
 *
 * MEKAN VE ZAMAN BURADA DEGISMEZ ve bunu ekranda YAZIYORUZ - kullanici
 * eksik bir ozellik sanmasin. Gerekce: bir check-in "su saatte
 * suradaydim" iddiasi; notu kisinin kendi icerigi ama mekani sonradan
 * degistirmek kaydi uydurma haline getirir. Ustelik etiketlenen kisi de
 * o konuma bakarak onay vermisti.
 *
 * Kaydetme SIRASI onemli: once etiketler kaldiriliyor, sonra not
 * yaziliyor. Etiket kaldirma geri alinamaz ve kullanici penceredeki
 * cipe basarak zaten onaylamis oluyor; not yazimi basarisiz olursa
 * pencere ACIK KALIYOR ve hata gorunuyor, yani kullanici kaybettigi
 * metni yeniden yazmak zorunda kalmiyor.
 */
export function PaylasimDuzenle({
  acikMi,
  baslikAltMetni,
  not,
  etiketler,
  onNotKaydet,
  onEtiketKaldir,
  onKapat,
}: {
  acikMi: boolean
  /** "Sahil Kafe · 01.09.2026 23:27" - degismeyecek olan baglam. */
  baslikAltMetni: string
  not: string
  etiketler: Etiket[]
  /** Not degismediyse HIC cagrilmiyor; bos yazma istegi gondermiyoruz. */
  onNotKaydet: (yeniNot: string) => Promise<void> | void
  onEtiketKaldir: (kullaniciId: string) => Promise<void> | void
  onKapat: () => void
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [taslak, setTaslak] = useState(not)
  const [kalanlar, setKalanlar] = useState(etiketler)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  if (!acikMi) return null

  const kaldirilanlar = etiketler.filter(
    (e) => !kalanlar.some((k) => k.kullaniciId === e.kullaniciId)
  )

  async function kaydet() {
    setHata(null)
    setKaydediliyor(true)
    try {
      for (const etiket of kaldirilanlar) {
        await onEtiketKaldir(etiket.kullaniciId)
      }
      if (taslak !== not) {
        await onNotKaydet(taslak)
      }
      onKapat()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('anaSayfa.duzenleAriza'))
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKapat}>
      <Pressable style={stiller.zemin} testID="duzenle-zemini" onPress={onKapat}>
        <Pressable
          style={stiller.pencere}
          testID="duzenle-penceresi"
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <Text style={stiller.baslik} accessibilityRole="header">
            {t('anaSayfa.duzenleBaslik')}
          </Text>
          <Text style={stiller.altMetin}>{baslikAltMetni}</Text>

          <View style={stiller.alanBasligi}>
            <Text style={stiller.alanEtiketi}>{t('anaSayfa.notEtiketi')}</Text>
            {/* Sayac yalnizca sinira YAKLASINCA cikiyor: her zaman
                gorunen bir sayac, kisa bir notta gereksiz bir uyari
                gibi duruyor. */}
            {taslak.length > NOT_EN_FAZLA - 50 && (
              <Text style={stiller.sayac}>
                {taslak.length}/{NOT_EN_FAZLA}
              </Text>
            )}
          </View>
          <TextInput
            testID="duzenle-not"
            style={stiller.metinAlani}
            value={taslak}
            onChangeText={(d) => setTaslak(d.slice(0, NOT_EN_FAZLA))}
            maxLength={NOT_EN_FAZLA}
            placeholder={t('anaSayfa.notYerTutucu')}
            placeholderTextColor={renk.metinSoluk}
            multiline
          />

          {kalanlar.length > 0 && (
            <>
              <Text style={stiller.alanEtiketi}>{t('anaSayfa.etiketlenenler')}</Text>
              <View style={stiller.cipler}>
                {kalanlar.map((etiket) => (
                  <Pressable
                    key={etiket.kullaniciId}
                    style={stiller.cip}
                    onPress={() =>
                      setKalanlar((mevcut) =>
                        mevcut.filter((k) => k.kullaniciId !== etiket.kullaniciId)
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={t('anaSayfa.etiketiKaldirEtiketi', {
                      ad: etiket.ad ?? '',
                    })}
                  >
                    <Text style={stiller.cipYazi}>{etiket.ad ?? ''}</Text>
                    <Text style={stiller.cipCarpi}>×</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* "Mekan ve zaman degismez" satiri KALDIRILDI (kullanicinin
              istegi 2026-09-05). Bilgi kaybolmadi: pencerenin basligi
              zaten mekan adini ve zamani yaziyor, ve ikisi de
              duzenlenebilir bir alan olarak GORUNMUYOR - yani neyin
              degismedigi zaten belli.

              KURALIN KENDISI DEGISMEDI: `check_in_notunu_guncelle`
              yalnizca not yaziyor, mekan ve zamani sunucu koruyor. */}

          {hata && <Text style={stiller.hata}>{hata}</Text>}

          <View style={stiller.eylemler}>
            <Pressable
              style={[stiller.dugme, stiller.ikincil]}
              onPress={onKapat}
              accessibilityRole="button"
            >
              <Text style={stiller.ikincilYazi}>{t('ortak.vazgec')}</Text>
            </Pressable>
            <Pressable
              style={[stiller.dugme, stiller.birincil, kaydediliyor && stiller.soluk]}
              onPress={kaydet}
              disabled={kaydediliyor}
              accessibilityRole="button"
            >
              <Text style={stiller.birincilYazi}>{t('ortak.kaydet')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  zemin: {
    flex: 1,
    backgroundColor: 'rgba(23, 19, 15, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: bosluk.xl,
  },
  pencere: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    padding: bosluk.l,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    letterSpacing: -0.3,
    color: renk.metin,
  },
  altMetin: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
    marginBottom: bosluk.l,
  },
  alanBasligi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sayac: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    marginBottom: bosluk.xs,
  },
  alanEtiketi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: renk.metinSoluk,
    marginBottom: bosluk.xs,
  },
  metinAlani: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: bosluk.s,
    minHeight: 64,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    marginBottom: bosluk.m,
    textAlignVertical: 'top',
  },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s, marginBottom: bosluk.m },
  cip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingLeft: bosluk.m,
    paddingRight: bosluk.s,
    // 44 pt hedefe yaklasmak icin: cip kucuk ama dokunma alani genis.
    paddingVertical: bosluk.s,
  },
  cipYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.turuncuKoyu },
  cipCarpi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuKoyu },
  hata: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginTop: bosluk.m,
  },
  eylemler: { flexDirection: 'row', gap: bosluk.m, marginTop: bosluk.l },
  dugme: {
    flex: 1,
    borderRadius: yuvarlak.hap,
    paddingVertical: bosluk.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birincil: { backgroundColor: renk.turuncu },
  birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
  ikincil: { borderWidth: 1, borderColor: renk.cizgi },
  ikincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metinIkincil },
  soluk: { opacity: 0.6 },
})
