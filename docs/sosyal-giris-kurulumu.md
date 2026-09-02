# Apple ve Google ile giriş — kurulum

Kod tarafı hazır ve testli. Bu belge, **panelde yapılması gereken**
adımları anlatıyor; hepsi tarayıcıdan ve kendi hesabınla yapılıyor, o
yüzden bu kısım bende değil.

Sırayı bilerek Google → Apple → Supabase → derleme diye kurdum: Google
en kolayı, Apple en karışığı, Supabase ikisinin çıktısını istiyor.

---

## 1. Google Cloud — OAuth istemcileri

<https://console.cloud.google.com>

1. Üstteki proje seçiciden **yeni proje** oluştur (ad: `Slooin`).
2. Sol menü → **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Uygulama adı: `Slooin`, destek e-postası: kendi adresin
   - Kaydet. (Yayına almak `Publish app` ile olur; test aşamasında
     "Testing" bırakıp kendi adresini test kullanıcısı eklemen yeterli.)
3. **Credentials → Create credentials → OAuth client ID**. Üç tane
   oluşturman gerekiyor:

   | Tür | Ne için | İstenen bilgi |
   |---|---|---|
   | **Web application** | Supabase kimlik jetonunu bununla doğruluyor | — |
   | **iOS** | iPhone'daki giriş | Bundle ID: `com.slooin.app` |
   | **Android** | Android'deki giriş | Paket adı `com.slooin.app` + SHA-1 parmak izi |

   Android SHA-1'i EAS'ten alınıyor:
   `npx eas-cli credentials` → Android → Keystore → SHA-1 değeri.

4. Sonda elinde şunlar olacak:
   - **Web client ID** (`...apps.googleusercontent.com`)
   - **Web client secret**
   - **iOS client ID**
   - iOS istemcisinin **ters çevrilmiş** hali
     (`com.googleusercontent.apps.XXXX`) — buna `iosUrlScheme` deniyor

---

## 2. Apple Developer — Sign in with Apple

<https://developer.apple.com/account>

Bu adım karışıktır; takılırsan sor, birlikte yürürüz.

1. **Certificates, Identifiers & Profiles → Identifiers**
   - `com.slooin.app` kimliğini aç, **Sign in with Apple**'ı işaretle,
     kaydet.
2. Aynı sayfada **yeni bir Services ID** oluştur:
   - Identifier: `com.slooin.app.web` (bundle id'den FARKLI olmalı)
   - Sign in with Apple'ı işaretle → **Configure**
   - Primary App ID: `com.slooin.app`
   - Return URL: `https://swpiibyuoffykbmirvgq.supabase.co/auth/v1/callback`
3. **Keys → yeni anahtar**
   - Ad: `Slooin Sign in with Apple`
   - **Sign in with Apple**'ı işaretle, Configure → Primary App ID
   - Oluştur ve **.p8 dosyasını indir**. Bu dosya **bir kez** iniyor,
     kaybedersen yenisini üretmen gerekir.
4. Elinde şunlar olacak: **Team ID** (sağ üstte), **Key ID**,
   **Services ID**, **.p8 dosyasının içeriği**.

---

## 3. Supabase — sağlayıcıları aç

<https://supabase.com/dashboard/project/swpiibyuoffykbmirvgq/auth/providers>

- **Google**: aç, `Web client ID` ve `Web client secret` gir.
  "Authorized Client IDs" alanına **iOS client ID**'yi de ekle — native
  girişte jeton oradan geliyor, bu alan boşsa doğrulama reddedilir.
- **Apple**: aç, `Services ID`, `Team ID`, `Key ID` ve `.p8` içeriğini
  gir.

Bu adımı ben de yapabilirim: `mobil/.env` içine yeni bir
`SUPABASE_ACCESS_TOKEN=sbp_...` satırı eklemen yeterli. **Token'ı
sohbete yapıştırma** — oturum dökümleri depoya giriyor ve depo public;
bir kez yaşandı, iptal etmek zorunda kaldık.

---

## 4. Anahtarları projeye ver

`mobil/.env` (gitignored, depoya girmez):

```
EXPO_PUBLIC_GOOGLE_WEB_ISTEMCI_ID=....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI_ID=....apps.googleusercontent.com
GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.XXXX
```

EAS derlemesi için aynılarını buluta da tanımla:

```
npx eas-cli env:create --environment production --name EXPO_PUBLIC_GOOGLE_WEB_ISTEMCI_ID --value ...
npx eas-cli env:create --environment production --name EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI_ID --value ...
npx eas-cli env:create --environment production --name GOOGLE_IOS_URL_SCHEME --value ...
```

`GOOGLE_IOS_URL_SCHEME` tanımlı değilken google-signin eklentisi
**bilerek** eklenmiyor (`app.config.js`); yani anahtarsız derleme de
çalışır, yalnızca Google düğmesi "şu an kullanılamıyor" der.

---

## 5. Derleme

Sosyal giriş **native** çalışıyor, yani OTA ile gitmez:

```
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

---

## Bittiğinde doğrulanacaklar

Kod mock'lu testlerle doğrulandı ama **gerçek bir girişle
denenmedi**. Bu projede tam olarak bu sınıf hata yaşandı (66 test
yeşilken ekran canlıda hiç çalışmıyordu), o yüzden şunlar gerçek
cihazda görülmeden "çalışıyor" denmemeli:

- [ ] iPhone'da Apple düğmesi sistem ekranını açıyor ve giriş oluyor
- [ ] Apple ekranını kapatınca **hata gösterilmiyor** (vazgeçmek hata değil)
- [ ] Google düğmesi iki platformda da giriş yapıyor
- [ ] Aynı e-posta ile hem Apple hem Google girişi **aynı hesaba** düşüyor
- [ ] Sağlayıcıyla giren, profili yoksa profil oluşturma ekranına gidiyor
