import { readdirSync } from 'fs'
import { join } from 'path'

// Expo Router, uygulama kokundeki HER .tsx/.ts dosyasini bir rota modulu
// sayar (bkz. node_modules/expo-router/_ctx.web.js icindeki require.context
// deseni). Oraya konan bir test dosyasi uygulama acilisinda yuklenir ve
// Jest disinda var olmayan `describe`/`expect` cagrilari yuzunden
// "ReferenceError: expect is not defined" ile butun uygulamayi cokertir.
// Bu yuzden ekran testleri src/app disinda, __tests__/ekranlar altinda durur.
const UYGULAMA_KOKU = join(__dirname, '..', 'src', 'app')
const TEST_DOSYASI = /\.(test|spec)\.[jt]sx?$/

function testDosyalariniTopla(dizin: string, kok = dizin): string[] {
  return readdirSync(dizin, { withFileTypes: true }).flatMap((girdi) => {
    const tamYol = join(dizin, girdi.name)
    if (girdi.isDirectory()) return testDosyalariniTopla(tamYol, kok)
    return TEST_DOSYASI.test(girdi.name) ? [tamYol.slice(kok.length + 1)] : []
  })
}

describe('rota agaci', () => {
  it('src/app altinda test dosyasi bulundurmaz', () => {
    expect(testDosyalariniTopla(UYGULAMA_KOKU)).toEqual([])
  })
})
