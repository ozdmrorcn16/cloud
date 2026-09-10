# vpn

Kendi WireGuard sunucumuz uzerinden calisan Android VPN uygulamasi.

Kullanicinin internet trafigi, yurt disinda (Almanya/Hollanda) kiraladigimiz
bir VPS uzerindeki WireGuard sunucusundan gecer. Supabase yalnizca **arka uc**
olarak kullanilir: giris, abonelik, sunucu listesi ve WireGuard anahtar
dagitimi. **Trafik Supabase'e ugramaz.**

## Mimari

```
  Android uygulamasi
        |
        |  1) e-posta + sifre ile giris            (HTTPS)
        |  2) sunucu listesini cek                 (HTTPS)
        |  3) issue-config Edge Function'i cagir   (HTTPS)
        v
  +-------------------+
  |     Supabase      |   auth + profiles + subscriptions + servers + peers
  +-------------------+
        |
        |  4) Edge Function peer kaydini yazar
        v
  +-------------------+        5) WireGuard tuneli (UDP 51820)
  |  VPS (Almanya)    | <=========================================  Android
  |  wg0 + NAT        |            trafik dogrudan buradan gecer
  +-------------------+
        |
        v
      internet
```

Akis:

1. Uygulama Supabase'e giris yapar (Supabase Auth, e-posta + sifre).
2. `servers` tablosundan aktif sunucu listesini ceker.
3. Cihazda bir WireGuard anahtar cifti uretir. **Ozel anahtar cihazdan
   cikmaz**; yalnizca acik anahtar sunucuya gonderilir.
4. `issue-config` Edge Function'i, abonelik gecerliyse cihaza bir tunel IP'si
   ayirir, `peers` tablosuna yazar ve tam WireGuard yapilandirmasini doner.
5. VPS uzerindeki `esitle.sh` betigi `peers` tablosundaki aktif kayitlari
   `wg set` ile uygular.
6. Uygulama `com.wireguard.android:tunnel` kutuphanesiyle tuneli acar.

## Klasor yapisi

| Klasor | Icerik |
|---|---|
| `android/` | Kotlin + Jetpack Compose Android uygulamasi. Tek ekran: giris, sunucu listesi, baglan/kes. |
| `supabase/migrations/` | SQL migration'lari: `profiles`, `subscriptions`, `servers`, `peers` tablolari ve RLS kurallari. |
| `supabase/functions/issue-config/` | Giris yapmis kullaniciya WireGuard istemci yapilandirmasi ureten Edge Function. |
| `sunucu/` | VPS uzerinde calisan bash betikleri: `kur.sh`, `istemci-ekle.sh`, `esitle.sh`. |

## Durum

Bu bir **iskelet**tir. Calisir bir uygulama icin asagidakiler gerekir; hicbiri
bu depodan yapilamaz, hepsi kullanicinin hesap/kart islemleri:

- Bir Supabase projesi (migration'lar ve Edge Function oraya deploy edilir).
- Yurt disinda bir VPS (aylik ~5$) ve uzerinde `sunucu/kur.sh`.
- Google Play gelistirici hesabi (tek seferlik 25$) — magazaya cikarken.

Ayrintili liste icin `sunucu/README.md` ve `supabase/README.md` dosyalarina bak.

## Hizli baslangic

```bash
# 1) VPS'te WireGuard sunucusunu kur
scp -r vpn/sunucu root@SUNUCU_IP:/root/vpn-sunucu
ssh root@SUNUCU_IP 'bash /root/vpn-sunucu/kur.sh'

# 2) Supabase semasini uygula
cd vpn/supabase && supabase link --project-ref PROJE_REF && supabase db push
supabase functions deploy issue-config

# 3) Android uygulamasini ac
#    android/local.properties icine Supabase URL ve anon key'i yaz (asagiya bak)
cd vpn/android && ./gradlew assembleDebug
```

### `android/local.properties`

Gizli degerler depoya girmez; her gelistirici kendi makinesinde yazar:

```properties
sdk.dir=/home/kullanici/Android/Sdk
SUPABASE_URL=https://PROJE_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Guvenlik notlari

- Istemci ozel anahtari yalnizca cihazda uretilir ve Android Keystore ile
  korunan `EncryptedSharedPreferences` icinde saklanir. Sunucuya gonderilmez.
- Sunucunun ozel anahtari yalnizca VPS'te durur; Supabase'de yalnizca
  **acik** anahtar tutulur.
- `servers` tablosu herkese acik okunur degildir: yalnizca aktif abonesi olan
  kullanicilar okuyabilir (RLS).
