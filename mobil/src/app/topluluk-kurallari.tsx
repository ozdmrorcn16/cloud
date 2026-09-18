import { View, Text, StyleSheet } from 'react-native'
import { AyarSayfasi } from '../tasarim/AyarSayfasi'
import { useDil } from '../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../tasarim/tema'
import { useStiller } from '../tasarim/tema-baglami'

/**
 * TOPLULUK KURALLARI (2026-09-19; "Slooin hakkinda" ekranindan). Alti
 * kural + kapanis, yedi dilde sozlukte (`toplulukKurallari`). Hukuki
 * bir belge degil, davranis kurallari: kosullar ve gizlilik metni
 * ayri ekranlarda. Magaza kilavuzlari kullanici icerigi olan
 * uygulamalarda kurallarin uygulama icinde okunabilir olmasini
 * istiyor; buradaki metin sikayet/engelleme yollarini da gosteriyor.
 */
const KURALLAR = [1, 2, 3, 4, 5, 6] as const

export default function ToplulukKurallariEkrani() {
  const { t } = useDil()
  const stiller = useStiller(stilleriYap)
  return (
    <AyarSayfasi baslik={t('toplulukKurallari.baslik')} altBaslik={t('toplulukKurallari.giris')}>
      <View style={stiller.kart}>
        {KURALLAR.map((n, sira) => (
          <View key={n} style={[stiller.kural, sira < KURALLAR.length - 1 && stiller.satirCizgili]}>
            <View style={stiller.numara}>
              <Text style={stiller.numaraYazi}>{n}</Text>
            </View>
            <View style={stiller.metin}>
              <Text style={stiller.baslik}>{t(`toplulukKurallari.k${n}b`)}</Text>
              <Text style={stiller.aciklama}>{t(`toplulukKurallari.k${n}m`)}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={stiller.kapanis}>{t('toplulukKurallari.kapanis')}</Text>
    </AyarSayfasi>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kart: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  kural: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
  },
  numara: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numaraYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi },
  metin: { flex: 1 },
  baslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  kapanis: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
  },
})
