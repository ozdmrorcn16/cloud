import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { engellediklerimiListele, engeliKaldir, type EngelliKisi } from '../../../lib/engelleme'
import { useDil } from '../../../lib/dil'
import { AyarSayfasi } from '../../tasarim/AyarSayfasi'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * ENGELLENEN KISILER (kullanicinin referans gorseli 2026-09-18).
 * Baslik + "Engelledigin kisiler sana mesaj veya arkadaslik istegi
 * gonderemez." + tek kartta satirlar: seftali karede bas harf, ad,
 * "Engellendi", sagda cerceveli "Engeli kaldir".
 *
 * Liste ve kaldirma 2026-08 tasarimindaki gibi (`engellediklerimiListele`,
 * `engeliKaldir`); degisen yalnizca gorunum.
 */
export default function EngellenenlerEkrani() {
  const stiller = useStiller(stilleriYap)
  const hataStili = useHataStili()
  const { t } = useDil()
  const [kisiler, setKisiler] = useState<EngelliKisi[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function yukle() {
    try {
      setKisiler(await engellediklerimiListele())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    yukle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function kaldir(kullaniciId: string) {
    try {
      await engeliKaldir(kullaniciId)
      setKisiler((mevcut) => mevcut.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi baslik={t('engellenenler.baslik')} altBaslik={t('engellenenler.altBaslik')}>
      {hata && <Text style={hataStili}>{hata}</Text>}

      {!yukleniyor && kisiler.length === 0 && (
        <View style={stiller.bosAlan}>
          <Text style={stiller.bosBaslik}>{t('engellenenler.bosBaslik')}</Text>
          <Text style={stiller.bosAciklama}>{t('engellenenler.bosAciklama')}</Text>
        </View>
      )}

      {kisiler.length > 0 && (
        <View style={stiller.kart}>
          {kisiler.map((item, sira) => (
            <View
              key={item.id}
              style={[stiller.satir, sira < kisiler.length - 1 && stiller.satirCizgili]}
              testID={`engelli-${item.id}`}
            >
              <View style={stiller.basHarfKutusu}>
                <Text style={stiller.basHarf}>
                  {(item.ad || item.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase('tr-TR')}
                </Text>
              </View>
              <View style={stiller.metin}>
                <Text style={stiller.ad} numberOfLines={1}>
                  {item.ad || item.kullaniciAdi}
                </Text>
                <Text style={stiller.durum}>{t('engellenenler.engellendi')}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [stiller.kaldirDugmesi, pressed && stiller.basili]}
                onPress={() => kaldir(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${t('engellenenler.engeliKaldir')} · ${item.ad || item.kullaniciAdi}`}
              >
                <Text style={stiller.kaldirYazi}>{t('engellenenler.engeliKaldir')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
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
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  basHarfKutusu: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: { fontFamily: yazi.ekranBasligi, fontSize: olcek.govde + 3, color: renk.turuncuYazi },
  metin: { flex: 1 },
  ad: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  durum: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil, marginTop: 2 },
  kaldirDugmesi: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 10,
    backgroundColor: renk.zemin,
  },
  basili: { opacity: 0.7 },
  kaldirYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  bosAlan: { paddingVertical: bosluk.xl },
  bosBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
})
