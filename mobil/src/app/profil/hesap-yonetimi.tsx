import { useState } from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { AyarSayfasi, BilgiKarti, IkonKutusu } from '../../tasarim/AyarSayfasi'
import { Bolum, Satir } from '../../tasarim/Liste'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { DuraklatIkonu, CopKutusuIkonu, IndirIkonu } from '../../tasarim/uygulama-ikonlari'
import { verilerimiDisaAktar } from '../../../lib/veri-disa-aktar'
import { hesabiDondur } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * HESAP YONETIMI (kullanicinin referans gorseli 2026-09-19): iki satir
 * (Hesabi dondur - seftali kutu, Hesabi sil - kirmizimsi kutu), seftali
 * "Anilarin sende kalsin" karti ve cerceveli "Verilerimi indir".
 * Dondurma ve silme Ayarlar ana ekranindan BURAYA tasindi; "Verilerimi
 * indir" de (KVKK m.11 erisim hakki, 2026-09-11) ana ekrandaki duz
 * baglantidan buraya - kart tam da bunu soyluyor: islemden once kopya.
 *
 * Dondur: onay penceresi (yikici degil - geri alinabilir), onayda
 * `hesabiDondur` + cikis (spec karar 66: dondurulmus ama girisli ara
 * durum olmasin). Sil: mevcut `/profil/hesabi-sil` akisi (e-posta kodu).
 */
export default function HesapYonetimiEkrani() {
  const { t } = useDil()
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const hataStili = useHataStili()
  const [dondurmaOnayi, setDondurmaOnayi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [disaAktariliyor, setDisaAktariliyor] = useState(false)
  const [disaAktarimHatasi, setDisaAktarimHatasi] = useState(false)

  async function hesabiDondurmayiOnayla() {
    try {
      await hesabiDondur()
      await supabase.auth.signOut()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setDondurmaOnayi(false)
    }
  }

  // Cift dokunus korunuyor: islem birkac saniye surebiliyor ve ikinci
  // dokunus ikinci bir dosya uretirdi.
  async function verilerimiIndir() {
    if (disaAktariliyor) return
    setDisaAktariliyor(true)
    setDisaAktarimHatasi(false)
    try {
      const adres = await verilerimiDisaAktar()
      await Linking.openURL(adres)
    } catch {
      setDisaAktarimHatasi(true)
    } finally {
      setDisaAktariliyor(false)
    }
  }

  return (
    <AyarSayfasi baslik={t('hesapYonetimi.baslik')} altBaslik={t('hesapYonetimi.altBaslik')}>
      {hata && <Text style={hataStili}>{hata}</Text>}

      <Bolum>
        <Satir
          ikon={<IkonKutusu><DuraklatIkonu /></IkonKutusu>}
          etiket={t('hesapYonetimi.dondur')}
          aciklama={t('hesapYonetimi.dondurAciklama')}
          onPress={() => setDondurmaOnayi(true)}
        />
        <Satir
          ikon={
            <View style={stiller.kirmiziKutu}>
              <CopKutusuIkonu renk={renk.yikici} />
            </View>
          }
          etiket={t('hesapYonetimi.sil')}
          aciklama={t('hesapYonetimi.silAciklama')}
          sonuncu
          onPress={() => router.push('/profil/hesabi-sil')}
        />
      </Bolum>

      <View style={stiller.kartArasi}>
        <BilgiKarti
          ikon={<IndirIkonu boyut={26} />}
          baslik={t('hesapYonetimi.kartBaslik')}
          metin={t('hesapYonetimi.kartMetin')}
        />
      </View>

      <Pressable
        style={({ pressed }) => [stiller.cerceveli, pressed && stiller.basili]}
        onPress={verilerimiIndir}
        disabled={disaAktariliyor}
        accessibilityRole="button"
        testID="verilerimi-indir"
      >
        <Text style={stiller.cerceveliYazi}>
          {disaAktariliyor ? t('ayarlar.verilerimiIndirHazirlaniyor') : t('ayarlar.verilerimiIndir')}
        </Text>
      </Pressable>
      {disaAktarimHatasi && <Text style={hataStili}>{t('ayarlar.verilerimiIndirHata')}</Text>}

      <OnayPenceresi
        acikMi={dondurmaOnayi}
        baslik={t('ayarlar.dondur')}
        aciklama={t('ayarlar.dondurAciklama')}
        eylemEtiketi={t('ayarlar.dondurEvet')}
        yikici={false}
        onOnay={hesabiDondurmayiOnayla}
        onVazgec={() => setDondurmaOnayi(false)}
      />
    </AyarSayfasi>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kirmiziKutu: {
    width: 44,
    height: 44,
    borderRadius: 12,
    // Kirmizinin acik zemini: yikici rengin %10 opakligi (referansta
    // pembemsi kutu). Koyu modda da ayni formul.
    backgroundColor: `${renk.yikici}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kartArasi: { marginTop: bosluk.l },
  cerceveli: {
    marginTop: bosluk.l,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: renk.yuzey,
  },
  cerceveliYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  basili: { opacity: 0.8 },
})
