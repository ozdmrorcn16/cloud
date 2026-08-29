// Set environment variables for testing
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key-pending-task-2'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Dil katmani: ekran testleri DilSaglayici olmadan render ediyor.
// Mock, GERCEK Turkce sozlugu kullaniyor - boylece testler ekrandaki
// asil metinleri dogrulamaya devam ediyor, anahtar adlarini degil.
// Bir anahtar sozlukte yoksa anahtarin kendisi doner; test o zaman
// eksik ceviriyi gorunur bicimde patlatir.
jest.mock('./lib/dil', () => {
  const tr = require('./lib/ceviriler/tr').default

  function cevir(anahtar, secenekler) {
    const deger = anahtar
      .split('.')
      .reduce((o, parca) => (o == null ? undefined : o[parca]), tr)
    if (typeof deger !== 'string') return anahtar
    if (!secenekler) return deger
    return deger.replace(/\{\{(\w+)\}\}/g, (_, ad) =>
      secenekler[ad] == null ? `{{${ad}}}` : String(secenekler[ad])
    )
  }

  return {
    DESTEKLENEN_DILLER: ['tr', 'en'],
    DIL_ADI: { tr: 'Türkçe', en: 'English' },
    DilSaglayici: ({ children }) => children,
    useDil: () => ({ dil: 'tr', t: cevir, dilDegistir: jest.fn(), hazir: true }),
    cevir,
  }
})

// Alt gezinme cubugu artik her ana ekranda var ve `usePathname`
// kullaniyor. Ekran testleri expo-router'i kendi mock'lariyla
// degistirdigi icin her testte ayri ayri `usePathname` eklemek
// gerekiyordu. Bilesenin kendisi burada mock'lanarak bu tekrar
// ortadan kaldiriliyor - ekran testleri gezinme cubugunu zaten test
// etmiyor, ekranin kendi icerigini test ediyor.
jest.mock('./src/tasarim/AltGezinme', () => ({
  AltGezinme: () => null,
  ALT_GEZINME_PAYI: 96,
}))

// Gercek harita (react-native-maps) yalnizca cihazda calisiyor; jest'te
// MapView duz bir View, Marker ise dokunulabilir bir View. jest-expo iOS
// ontanimli oldugu icin ekran testleri CanliHarita'nin NATIVE surumunu
// render ediyor ve bu mock'a ihtiyac duyuyor. Marker'a verilen testID
// sabit ("harita-ignesi") - testler igne sayisini oradan sayiyor.
jest.mock('react-native-maps', () => {
  const React = require('react')
  const { View, Pressable } = require('react-native')
  const MapView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ animateToRegion: jest.fn() }))
    return React.createElement(View, { testID: props.testID }, props.children)
  })
  const Marker = (props) =>
    React.createElement(
      Pressable,
      {
        testID: 'harita-ignesi',
        onPress: props.onPress,
        accessibilityLabel: props.accessibilityLabel,
      },
      props.children
    )
  return { __esModule: true, default: MapView, Marker, PROVIDER_GOOGLE: 'google' }
})
