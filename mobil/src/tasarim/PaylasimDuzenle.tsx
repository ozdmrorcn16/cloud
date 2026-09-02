import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import type { Etiket } from '../../lib/etiket'
import { bosluk, olcek, renk, yazi, yuvarlak } from './tema'

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
function KilitIkonu() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path
        d="M7 10V7.5a5 5 0 0 1 10 0V10"
        stroke={renk.metinSoluk}
        strokeWidth={1.9}
        strokeLinecap="round"
        fill="none"
      />
      <Rect
        x={5}
        y={10}
        width={14}
        height={10}
        rx={2.5}
        stroke={renk.metinSoluk}
        strokeWidth={1.9}
        fill="none"
      />
    </Svg>
  )
}

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

          <Text style={stiller.alanEtiketi}>{t('anaSayfa.notEtiketi')}</Text>
          <TextInput
            testID="duzenle-not"
            style={stiller.metinAlani}
            value={taslak}
            onChangeText={setTaslak}
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

          <View style={stiller.kilitli}>
            <KilitIkonu />
            <Text style={stiller.kilitliYazi}>{t('anaSayfa.kilitliAlanlar')}</Text>
          </View>

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

const stiller = StyleSheet.create({
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
  kilitli: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: bosluk.s,
  },
  kilitliYazi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinSoluk },
  hata: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: '#C0392B',
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
