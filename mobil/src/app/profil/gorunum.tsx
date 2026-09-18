import { AyarSayfasi, AyarBolumBasligi, RadyoKarti } from '../../tasarim/AyarSayfasi'
import { useDil } from '../../../lib/dil'
import { useTemaTercihi, temaTercihiniAyarla, type TemaTercihi } from '../../../lib/tema-tercihi'

/**
 * GORUNUM (kullanicinin referans gorseli 2026-09-19): "Tema" basligi
 * altinda radyo karti - Sistemle ayni / Acik / Koyu. Secim aninda
 * uygulanir (`useRenk` depoya abone) ve cihazda saklanir. Referansta
 * baska bolum yok; satir aciklamasindaki "hareket tercihleri" icin
 * ayri bir denetim ISTENMEDI, eklenmedi.
 */
export default function GorunumEkrani() {
  const { t } = useDil()
  const tercih = useTemaTercihi()

  const secenekler: { deger: TemaTercihi; baslik: string; aciklama: string }[] = [
    { deger: 'sistem', baslik: t('uygulama.temaSistem'), aciklama: t('uygulama.temaSistemAciklama') },
    { deger: 'acik', baslik: t('uygulama.temaAcik'), aciklama: t('uygulama.temaAcikAciklama') },
    { deger: 'koyu', baslik: t('uygulama.temaKoyu'), aciklama: t('uygulama.temaKoyuAciklama') },
  ]

  return (
    <AyarSayfasi baslik={t('uygulama.gorunum')}>
      <AyarBolumBasligi>{t('uygulama.tema')}</AyarBolumBasligi>
      <RadyoKarti
        secenekler={secenekler}
        secili={tercih}
        onSec={(d) => {
          temaTercihiniAyarla(d)
        }}
        testIDOneki="tema"
      />
    </AyarSayfasi>
  )
}
