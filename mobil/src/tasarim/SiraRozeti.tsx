import { Image, StyleSheet, Text } from 'react-native'
import { yazi, olcek, type Renk } from './tema'
import { useStiller } from './tema-baglami'

/**
 * SIRA ROZETI - kurdeleli madalya gorseli.
 *
 * Kullanicinin istegi (2026-09-05): "Direk attigim gorseldeki gibi
 * gorunmesini saglayamaz misin". Onceden SVG ile CIZILIYORLARDI ve
 * referansa yakindi ama ayni degildi; artik referansin kendisi
 * kullaniliyor. Varliklar `araclar/madalya-kirp.py` ile o gorselden
 * cikarildi: bes satir kirpildi, zemin kenardan tasma yontemiyle
 * saydama cevrildi.
 *
 * RAKAM GORSELIN ICINDE - ayri bir metin katmani YOK.
 *
 * IKI EKRAN AYNI BILESENI KULLANIYOR (kullanicinin istegi 2026-09-09:
 * "bu ayni ikonlarin ilk ucunu liderlik tablosunun ilk ucunun ikonu
 * yap"): profildeki "En sik" listesi ve mekan sayfasindaki liderlik
 * tablosu. Ayri ayri cizilselerdi ayni sira iki ekranda iki turlu
 * gorunurdu - liderlik tablosu once duz SVG dairelerdi ve fark tam
 * olarak bu yuzden ortaya cikti.
 *
 * Ilk uc gercek madalya; 4 ve 5 madalya DEGIL ama yine de dolu bir
 * rozet ("ilk bese girdi"). Altisi ve sonrasi duz rakam.
 *
 * KIMLIK NOTU: bunlar turuncu DEGIL. Kural geregi turuncu eylem ve
 * canlilik demek; sira bilgisi ikisi de degil. Madalya renkleri anlam
 * tasiyor (birincilik/ikincilik), dekorasyon degil.
 *
 * `require` DIZI ICINDE ve SABIT: Metro paketleyici require yolunu
 * derleme aninda cozuyor, `require(`...${sira}.png`)` calismiyor.
 */
import { cevir } from '../../lib/dil'
const MADALYA_GORSELLERI = [
  require('../../assets/images/madalya-1.png'),
  require('../../assets/images/madalya-2.png'),
  require('../../assets/images/madalya-3.png'),
  require('../../assets/images/madalya-4.png'),
  require('../../assets/images/madalya-5.png'),
] as const

/**
 * Profildeki "En sik" listesinin olcusu.
 *
 * 34 -> 44 -> 48 -> 44 (sonuncusu kullanicinin istegi 2026-09-09:
 * "bu bes ikonun cok az boyutunu kucult"). Madalya gorselleri kareye
 * yakin; `contain` ile bu kutuda ortalaniyorlar ve cember caplari
 * kaynakta esitlendigi icin bes rozet ayni buyuklukte gorunuyor.
 */
export const SIRA_ROZETI_BOYU = 44

export function SiraRozeti({ sira, boyut = SIRA_ROZETI_BOYU }: { sira: number; boyut?: number }) {
  const stiller = useStiller(stilleriYap)
  const gorsel = MADALYA_GORSELLERI[sira - 1]
  if (!gorsel) {
    return <Text style={[stiller.duzRakam, { width: boyut }]}>{sira}</Text>
  }

  return (
    <Image
      source={gorsel}
      style={{ width: boyut, height: boyut }}
      // Madalyalarin en/boy orani birbirinden biraz farkli (kirpma her
      // birini kendi sinirina oturtuyor); `contain` hepsini ayni kutuda
      // ortaliyor, hicbiri ezilmiyor.
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={cevir('ortak.sira', { sira })}
    />
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    /*
     * 6 VE SONRASI: madalya yok, duz rakam. Kullanicinin bildirdigi
     * hata 2026-09-05: "6-7 diye devam eden sayilar cok silik".
     * Genislik rozetle AYNI ki altinci satirdan itibaren metinler sola
     * kaymasin.
     */
    duzRakam: {
      textAlign: 'center',
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.altBaslik,
      color: renk.metinIkincil,
    },
  })
