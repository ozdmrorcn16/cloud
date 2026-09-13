import { render, screen } from '@testing-library/react-native'
import KosullarEkrani, { KOSUL_BOLUMLERI } from '../../src/app/kosullar'
import GizlilikEkrani from '../../src/app/gizlilik'

/*
 * HUKUKI EKRANLAR CIHAZ DILINE GORE (i18n E asamasi, 2026-09-13).
 *
 * Genel mock `dil: 'tr'` veriyor; bu dosya kendi mock'uyla cihazi
 * INGILIZCE yapiyor ve ekranin (a) Ingilizce belgeyi cizdigini,
 * (b) "Turkce metin esastir" notunu koydugunu olcuyor.
 */
jest.mock('../../lib/dil', () => {
  const en = require('../../lib/ceviriler/en').default
  function cevir(anahtar: string, secenekler?: Record<string, unknown>) {
    const deger = anahtar
      .split('.')
      .reduce((o: any, parca: string) => (o == null ? undefined : o[parca]), en)
    if (typeof deger !== 'string') return anahtar
    if (!secenekler) return deger
    return deger.replace(/\{\{(\w+)\}\}/g, (_: string, ad: string) =>
      secenekler[ad] == null ? `{{${ad}}}` : String(secenekler[ad])
    )
  }
  return {
    DESTEKLENEN_DILLER: ['tr', 'en'],
    DIL_ADI: { tr: 'Türkçe', en: 'English' },
    DilSaglayici: ({ children }: { children: unknown }) => children,
    useDil: () => ({ dil: 'en', t: cevir, dilDegistir: jest.fn(), hazir: true }),
    cevir,
  }
})

describe('hukuki ekranlar cihaz dilinde', () => {
  it('kosullar: Ingilizce belge + ustunluk notu + Ingilizce tarih', async () => {
    await render(<KosullarEkrani />)

    expect(screen.getByText('Terms of use')).toBeTruthy()
    expect(screen.getByText('2. Age limit')).toBeTruthy()
    expect(screen.getByTestId('ustunluk-notu')).toBeTruthy()
    expect(screen.getByText(/Last updated: September 7, 2026/)).toBeTruthy()
    // Turkce baslik ekranda YOK - belge gercekten cevrilmis.
    expect(screen.queryByText('2. Yaş sınırı')).toBeNull()
  })

  it('gizlilik: Ingilizce belge + ustunluk notu', async () => {
    await render(<GizlilikEkrani />)

    expect(screen.getByText('Privacy notice')).toBeTruthy()
    expect(screen.getByText('3. Location in particular')).toBeTruthy()
    expect(screen.getByTestId('ustunluk-notu')).toBeTruthy()
    expect(screen.queryByText('3. Konum özel olarak')).toBeNull()
  })

  it('KOSUL_BOLUMLERI disa aktarimi Turkce kaynak (11 madde)', () => {
    expect(KOSUL_BOLUMLERI).toHaveLength(11)
    expect(KOSUL_BOLUMLERI[1].baslik).toBe('2. Yaş sınırı')
  })
})
