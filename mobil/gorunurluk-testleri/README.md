# Gorunurluk testleri

Bu testler **gercek** Supabase projesine baglanir ve RLS kurallarinin
gercekten uygulandigini dogrular. `npm test` (Jest) icindeki testler
Supabase'i mock'lar; bu yuzden bir RLS hatasini yakalayamazlar.

Faz 2a'da tam olarak bu oldu: 66 Jest testi yesilken mekan detay ekrani
canli veritabaninda hic calismiyordu.

## Calistirma

```bash
cd mobil
npm run test:gorunurluk
```

`mobil/.env` icindeki `EXPO_PUBLIC_SUPABASE_URL` ve
`EXPO_PUBLIC_SUPABASE_ANON_KEY` degerlerini kullanir.

## Test kullanicilari

Faz 1'de tanimlanan ucretsiz test numaralari: `+905550000000` ve
`+905550000001`, ikisinin de SMS kodu `123456`. Betik yoksa olusturur.

## Dikkat

Bu testler canli veritabanina yazar ve sonunda kendi verisini siler.
Uretim verisi olan bir projede calistirma.
