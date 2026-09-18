import type { ReactNode } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { UstCubuk } from './UstCubuk'
import { ALT_GEZINME_PAYI } from './AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { useDil } from '../../lib/dil'

/**
 * AYAR ALT SAYFASI ISKELETI (kullanicinin referans gorselleri 2026-09-18:
 * Hesap ve guvenlik, Gizlilik, Mesaj izinleri, Engellenen kisiler...).
 * Hepsi ayni yapida: kompakt geri cubugu, 30'luk baslik, gri alt
 * baslik, icerik. Tek yerde durunca sayfalar birbirinden sapmiyor.
 */
export function AyarSayfasi({
  baslik,
  altBaslik,
  children,
}: {
  baslik: string
  altBaslik?: string
  children: ReactNode
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  return (
    <View style={stiller.kok}>
      <UstCubuk baslik="" geriEtiketi={t('ortak.geri')} />
      <ScrollView
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={stiller.baslik} accessibilityRole="header">{baslik}</Text>
        {altBaslik && <Text style={stiller.altBaslik}>{altBaslik}</Text>}
        {children}
      </ScrollView>
    </View>
  )
}

/** Bolum basligi (gri, kalin) - "Gorunurlugun", "Sosyal izinlerin". */
export function AyarBolumBasligi({ children }: { children: string }) {
  const stiller = useStiller(stilleriYap)
  return <Text style={stiller.bolumBasligi}>{children}</Text>
}

/** Seftali kare ikon kutusu (44) - satir ikonlari. */
export function IkonKutusu({ children }: { children: ReactNode }) {
  const stiller = useStiller(stilleriYap)
  return <View style={stiller.ikonKutusu}>{children}</View>
}

/**
 * Seftali BILGI KARTI (basilmaz): ikon beyaz kutuda, baslik + metin.
 * "Hesabini koru", "Paylasimin sinirlarini sen belirle".
 */
export function BilgiKarti({ ikon, baslik, metin }: { ikon: ReactNode; baslik: string; metin: string }) {
  const stiller = useStiller(stilleriYap)
  return (
    <View style={stiller.bilgiKarti}>
      <View style={stiller.beyazIkon}>{ikon}</View>
      <View style={stiller.bilgiMetin}>
        <Text style={stiller.bilgiBaslik}>{baslik}</Text>
        <Text style={stiller.bilgiAciklama}>{metin}</Text>
      </View>
    </View>
  )
}

/**
 * RADYO KARTI: tek kartta secenekler, her satir baslik + aciklama +
 * solda radyo (referans "Mesaj izinleri"). Secim aninda uygulanir.
 */
export function RadyoKarti<T extends string>({
  secenekler,
  secili,
  onSec,
  testIDOneki,
}: {
  secenekler: { deger: T; baslik: string; aciklama: string }[]
  secili: T
  onSec: (deger: T) => void
  testIDOneki?: string
}) {
  const stiller = useStiller(stilleriYap)
  return (
    <View style={stiller.kart}>
      {secenekler.map((s, sira) => {
        const isaretli = s.deger === secili
        return (
          <Pressable
            key={s.deger}
            style={[stiller.radyoSatir, sira < secenekler.length - 1 && stiller.satirCizgili]}
            onPress={() => onSec(s.deger)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isaretli }}
            testID={testIDOneki ? `${testIDOneki}-${s.deger}` : undefined}
          >
            <View style={[stiller.radyo, isaretli && stiller.radyoSecili]}>
              {isaretli && <View style={stiller.radyoIc} />}
            </View>
            <View style={stiller.radyoMetin}>
              <Text style={stiller.radyoBaslik}>{s.baslik}</Text>
              <Text style={stiller.radyoAciklama}>{s.aciklama}</Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingHorizontal: bosluk.sayfa, paddingBottom: ALT_GEZINME_PAYI },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 36,
    color: renk.metin,
    letterSpacing: -0.6,
  },
  altBaslik: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde + 1,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
    marginBottom: bosluk.l,
  },
  bolumBasligi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 1,
    color: renk.metinIkincil,
    marginTop: bosluk.xl,
    marginBottom: bosluk.m,
  },
  ikonKutusu: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bilgiKarti: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.m,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart + 4,
    padding: bosluk.l,
    marginTop: bosluk.s,
  },
  beyazIkon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bilgiMetin: { flex: 1 },
  bilgiBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  bilgiAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  kart: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  radyoSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  radyo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: renk.metinSoluk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radyoSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncu },
  radyoIc: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF' },
  radyoMetin: { flex: 1 },
  radyoBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  radyoAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: 2,
  },
})
