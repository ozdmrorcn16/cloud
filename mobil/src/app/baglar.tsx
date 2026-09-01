import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { takipcilerimiGetir } from '../../lib/bag-listeleri'
import { takibiBirak } from '../../lib/bag'
import { engelle } from '../../lib/engelleme'
import type { BagKisi } from '../../lib/bag'
import { useDil } from '../../lib/dil'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { UstCubuk } from '../tasarim/UstCubuk'

/**
 * ARKADASLAR - tek isi olan bir ekran: arkadas listesi.
 *
 * Kullanicinin karari (2026-09-01): "Bu sayfadaki butun alt basliklari
 * kaldir. Henuz arkadasi yoksa 'Henuz arkadasin yok' yazisi, varsa
 * arkadas listesi burada gorunecek."
 *
 * Ekranda ONCEDEN dort bolum vardi (gelen istekler, sohbet istekleri,
 * giden istekler, arkadaslarim) ve her biri kendi basligiyla ust uste
 * diziliyordu. Uc bolum kaldirildi; ucunun de karsiligi baska ekranda
 * duruyor:
 *   - gelen arkadaslik istekleri -> Bildirimler sekmesi
 *   - gelen sohbet istekleri     -> kisinin profili (Kabul et / Reddet)
 *   - giden isteklerin geri cekilmesi -> kisinin profili (Istegi geri cek)
 */
export default function BaglarEkrani() {
  const { t } = useDil()
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function verileriYukle() {
    try {
      setArkadaslar(await takipcilerimiGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [])

  // Iyimser guncelleme YOK: satir yalnizca sunucu onayladiktan sonra
  // listeden kalkiyor. Basarisiz bir islem, kisi cikarilmis gibi yalan
  // soylememeli.
  async function arkadasliktanCikar(kullaniciId: string) {
    try {
      await takibiBirak(kullaniciId)
      setArkadaslar((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function kullaniciyiEngelle(kullaniciId: string) {
    try {
      await engelle(kullaniciId)
      setArkadaslar((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('baglar.baslik')} geriEtiketi={t('ortak.geri')} />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        data={arkadaslar}
        keyExtractor={(k) => k.id}
        contentContainerStyle={stiller.icerik}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            {/* numberOfLines SART: uzun bir kullanici adi ("kullanici_9a9a742c")
                iki satira sariyor, satir yukseliyor ve butonlar sikisiyordu.
                Kirpilan ad "..." ile bitiyor, satir tek satir kaliyor. */}
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                {item.kullaniciAdi}
              </Text>
              <Text style={stiller.ad} numberOfLines={1}>
                {item.ad}
              </Text>
            </View>
            <View style={stiller.butonlar}>
              <Pressable
                style={stiller.kucukButon}
                onPress={() => arkadasliktanCikar(item.id)}
                accessibilityRole="button"
              >
                <Text style={stiller.kucukButonYazi}>{t('baglar.arkadasliktanCikar')}</Text>
              </Pressable>
              <Pressable
                style={stiller.kucukTehlikeliButon}
                onPress={() => kullaniciyiEngelle(item.id)}
                accessibilityRole="button"
              >
                <Text style={stiller.kucukTehlikeliButonYazi}>{t('baglar.engelle')}</Text>
              </Pressable>
            </View>
          </View>
        )}
        // Ilk cekim bitmeden "arkadasin yok" yazmak yanlis olur; o an
        // bilinen tek sey listenin henuz gelmedigi.
        ListEmptyComponent={
          yukleniyor ? (
            <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>
          ) : (
            <Text style={stiller.bosDurum}>{t('baglar.bosArkadas')}</Text>
          )
        }
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  kisiBilgisi: { flex: 1 },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  ad: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  butonlar: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  kucukButon: {
    paddingVertical: bosluk.s,
    paddingHorizontal: bosluk.m,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  kucukButonYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  kucukTehlikeliButon: {
    paddingVertical: bosluk.s,
    paddingHorizontal: bosluk.m,
    borderRadius: yuvarlak.hap,
  },
  kucukTehlikeliButonYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },

  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    paddingTop: bosluk.xl,
  },
  bosDurum: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    paddingTop: bosluk.xl,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.m,
  },
})
