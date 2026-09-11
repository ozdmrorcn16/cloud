# Kripto Al-Sat Botu — Mimari ve Yol Haritasi

Durum: tasarim asamasi. Kod henuz yazilmadi.

## Ne yapacak

Gercek parayla calisan, borsaya baglanip anlik fiyat takibi yapan, teknik
analiz uretip kurallara gore otomatik alim-satim emri gonderen bir sistem.
Yaninda calisan bir izleme paneli olacak.

## Katmanlar

| Katman | Isi | Not |
|---|---|---|
| Veri toplama | Borsanin WebSocket akisindan anlik fiyat, emir defteri, islem akisi | Kopma olur; yeniden baglanma ve bosluk doldurma sart |
| Depolama | Mum (OHLCV) ve islem verisi | Once SQLite, buyuyunce Postgres/TimescaleDB |
| Analiz | Gostergeler (EMA, RSI, ATR, hacim), sinyal uretimi | Saf fonksiyon olsun ki test edilebilsin |
| Strateji | Sinyali "al / sat / bekle" kararina cevirir | Backtest ve canli ayni kodu kullanmali |
| Risk yonetimi | Pozisyon buyuklugu, zarar durdur, gunluk zarar tavani, acil durdurma | Stratejiden ayri ve ondan ustun yetkili |
| Emir yurutme | Borsaya emir gonderme, durum takibi, kismi dolum | Her emirde clientOrderId ile tekrar korumasi |
| Izleme | Panel, kayit, uyari | Pozisyon, kar-zarar, hata durumu gorunsun |

Onemli kural: strateji dogrudan borsaya emir gondermez. Sinyal her zaman risk
yonetimi katmanindan gecer. Bot cokerse bile acik pozisyonun borsa tarafinda
zarar durdur emri bulunmalidir.

## Teknoloji onerisi

- **Python 3.11+ / asyncio** — analiz ve borsa kutuphanesi ekosistemi en genis burada.
- **ccxt** — cok borsayi tek arayuzden kullanmak icin. Anlik akiste borsanin
  kendi WebSocket'i daha guvenilir.
- **FastAPI + hafif bir web paneli** — izleme arayuzu icin.
- **Docker** — 7/24 calisacaksa sunucuda ayni ortam.

Mikro saniye seviyesinde yarisan bir sistem hedeflenmiyorsa Python yeterli.
Gercek darbogaz dil degil, borsaya olan ag gecikmesi.

## Asamalar

Her asama bir oncekinin uzerine kuruluyor. Gercek para en sonda.

0. **Sadece okuma.** WebSocket'ten canli veri cek, kaydet, ekrana bas. Hic emir yok.
1. **Analiz ve backtest.** Gosterge hesapla, stratejiyi gecmis veride dene.
2. **Kagit uzerinde al-sat.** Canli veri, sahte cuzdan. Kodun tamami calisir,
   sadece emir borsaya gitmez.
3. **Testnet.** Binance Spot Testnet'te gercek emir akisi, sahte para.
4. **Kucuk gercek para.** Kaybetmeyi goze aldigin miktar. Sert limitler acik.
5. **Kademeli buyutme.** Sadece olculmus sonuc iyiyse.

## Guvenlik kurallari (pazarlik disi)

- API anahtarinda **para cekme yetkisi asla acik olmayacak**. Sadece islem yetkisi.
- API anahtarina **IP kisitlamasi** tanimlanacak.
- Anahtarlar koda ve depoya girmeyecek; ortam degiskeni veya secret dosyasi.
- **Gunluk zarar tavani** ve **acil durdurma** ilk gunden olacak.
- Her emir `clientOrderId` tasiyacak; yeniden baglanmada ayni emir iki kez gitmeyecek.
- Yeniden baslatmada bot once borsadan gercek pozisyonu okuyacak, hafizasina guvenmeyecek.

## Acik konular

- Hangi borsa? (Binance, BtcTurk, Paribu, OKX)
- Spot mu, vadeli mi? Vadeli kaldirac demek, risk katlanir.
- Strateji fikri ne? Trend takibi, ortalamaya donus, arbitraj?
- Nerede calisacak? Kendi bilgisayarin mi, sunucu mu?
- Turkiye'de SPK kripto duzenlemesi: kendi paranla kendi botunu calistirmak ile
  baskasina hizmet sunmak farkli seyler. Ikincisi izne tabidir.
