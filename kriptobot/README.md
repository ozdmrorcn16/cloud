# kriptobot

Gercek parayla calisacak kripto al-sat botu. Anlik fiyat takibi, teknik analiz
ve kurallara dayali otomatik emir gonderimi yapar.

**Durum:** tasarim asamasi. Henuz kod yok, gercek emir gonderilmiyor.

## Belgeler

- [`docs/mimari.md`](docs/mimari.md) — katmanlar, teknoloji secimi, asamali yol
  haritasi ve guvenlik kurallari.

## Onemli

Bu proje gercek para ile islem yapmayi hedefliyor. Iki kural bastan gecerli:

1. Borsa API anahtarinda **para cekme yetkisi asla acilmaz**. Sadece islem yetkisi
   verilir ve anahtara IP kisitlamasi tanimlanir.
2. Gercek para, yol haritasinin son asamasidir. Once okuma, sonra backtest, sonra
   kagit uzerinde al-sat, sonra testnet.

Anahtarlar ve gizli degerler depoya girmez. `.env` dosyasi `.gitignore` icindedir;
ornek icin `.env.example` dosyasina bak.

## Klasor duzeni

    kriptobot/
      docs/         tasarim ve karar belgeleri
      .env.example  gereken ortam degiskenlerinin ornegi
