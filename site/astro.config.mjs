import { defineConfig } from 'astro/config'

// Statik cikti: her sayfa duz HTML olarak uretilir. Sunucu tarafi
// calisma zamani YOK - hukuki sayfalarin JavaScript olmadan okunmasi
// Apple'in sarti (bkz. spec bolum 1).
export default defineConfig({
  site: 'https://slooin.com',
  output: 'static',
  build: { format: 'directory' },
})
