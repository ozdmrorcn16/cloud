# Yerel Kuruluma Gecis

Bu depo bugune kadar bulut konteynerinde gelistirildi. Uygulama mobil olacagi
icin asil gelistirme senin bilgisayarinda yapilacak: simulator, cihazda deneme
ve magazaya yukleme buluttan yapilamiyor.

Bu dosya gecisin nasil yapilacagini anlatir.

## Ne tasiniyor, ne tasinmiyor

| | Durum |
|---|---|
| `CLAUDE.md`, `docs/`, `.claude/settings.json`, hook'lar | Repoda — klonlayinca gelir |
| `.claude/skills/no-ai-slop/` | Repoda — klonlayinca gelir |
| Tasarim spec'i | Repoda — `docs/superpowers/specs/` |
| Oturum dokumleri | Repoda — `docs/oturumlar/` |
| claude-mem hafizasi (181 gozlem) | **Elle tasinacak** — asagida |
| gstack (54 beceri) | Yeniden kurulacak — tek komut |
| superpowers (14 beceri) | Yeniden kurulacak — tek komut |
| Market eklentileri | `settings.json` sayesinde kendiliginden gelir |

## Windows icin kisa yol

Kullanicinin bilgisayari Windows. Asagidaki uzun rehberi okumak yerine su bes
adim yeterli; gerisini yerel Claude halleder.

1. **Node.js kur.** <https://nodejs.org> → buyuk yesil **LTS** butonu. Inen
   dosyayi cift tikla, hep **Next**, sonunda **Install**.
2. **Git kur.** <https://git-scm.com/download/win> → indirme kendiliginden
   baslar. Cift tikla, hep **Next**, **Install**. Bu adim sart; Node.js git
   getirmiyor.
3. **PowerShell'i ac.** Windows tusu → `powershell` yaz → Enter.
4. **Claude Code'u kur.**
   ```
   npm install -g @anthropic-ai/claude-code
   claude
   ```
   Tarayici acilip giris ister. Bir kere yapilir.
5. **Projeyi indir.** Claude acildiktan sonra ona sunu yaz:

   > https://github.com/ozdmrorcn16/cloud deposunu klonla,
   > claude/faz2b-guvenlik dalina gec, sonra
   > docs/yerel-kuruluma-gecis.md dosyasini oku ve kalan kurulum adimlarini
   > sen yap

**Sik takilinan yer:** `npm` komutu taninmiyorsa Node.js kurulumu
tamamlanmamis ya da PowerShell eski ortami tasiyordur. PowerShell'i kapatip
yeniden ac.

**iOS notu:** iOS uygulamasi gelistirmek Mac gerektiriyor, Windows'ta olmuyor.
Faz 1 Android ile baslayacak. Telefona ucretsiz **Expo Go** uygulamasi
kurulunca yazilan sey aninda gercek telefonda gorunur; emulator kurmaya gerek
yok.

---

Asagisi tum platformlar icin ayrintili anlatim.

## 1. Node.js

Claude Code Node.js 18 veya ustunu istiyor.

- **Windows / macOS:** <https://nodejs.org> adresinden LTS surumunu indir.
- **macOS (Homebrew):** `brew install node`
- **Linux:** dagitiminin paket yoneticisi, ya da <https://github.com/nvm-sh/nvm>

Kontrol: `node --version` → `v18` veya ustu gormelisin.

## 2. Claude Code

```sh
npm install -g @anthropic-ai/claude-code
```

Sonra bir klasorde:

```sh
claude
```

Ilk calistirmada tarayici acilip giris yapmani ister. Giris yaptiktan sonra
kimlik bilgisi makinende saklanir, bir daha sorulmaz.

**Masaustu uygulamasi tercih edersen:** terminal yerine Mac/Windows icin
masaustu uygulamasi da var; buradaki sohbet penceresine en yakin olan o. Ayni
hesapla giris yapiyor ve ayni depoyu aciyor. VS Code ve JetBrains eklentileri
de mevcut.

## 3. Depoyu klonla

```sh
git clone https://github.com/ozdmrorcn16/cloud.git
cd cloud
git checkout claude/faz2b-guvenlik
```

Bu dalda tasarim spec'i ve butun oturum kayitlari var.

Klasorde `claude` calistirdiginda `CLAUDE.md` kendiliginden yuklenir; proje
hafizasi, kararlar ve siradaki adim orada.

## 4. claude-mem hafizasini geri yukle

181 gozlem, 42 oturum ozeti ve 41 istem `docs/hafiza/claude-mem-yedek.db`
dosyasinda. Bu, konteynerdeki veritabaninin maskelenmis ve sikistirilmis
kopyasi.

Once claude-mem'i kur:

```sh
npx claude-mem@latest install
```

Sonra worker'i durdurup yedegi yerine koy:

```sh
npx claude-mem stop
cp docs/hafiza/claude-mem-yedek.db ~/.claude-mem/claude-mem.db
npx claude-mem start
```

Windows'ta `~/.claude-mem` yerine `%USERPROFILE%\.claude-mem` kullan.

Vektor indeksi (`chroma`) tasinmiyor cunku veritabanindan yeniden uretiliyor.
Ilk aramada kendiliginden kurulur; istersen `/claude-mem:mem-search` ile bir
arama yaparak tetikleyebilirsin.

Kontrol: `/claude-mem:mem-search tree-sitter` calistir. Sonuc donuyorsa hafiza
yerinde.

## 5. Becerileri kur

**Market eklentileri** (`code-review`, `frontend-design`, `security-guidance`,
`claude-mem`) `.claude/settings.json` icinde proje kapsaminda tanimli. Claude
Code bunlari ilk oturumda kendiliginden kurar.

**gstack** (54 beceri, `bun` gerektirir):

```sh
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --host claude --prefix
```

**superpowers** (14 beceri — `writing-plans` ve `brainstorming` buradan gelir):

```sh
claude plugin marketplace add obra/superpowers
claude plugin install superpowers@superpowers-dev --scope project
```

Bulutta bu ikincisi yarim kalmisti: market tanimi repo disina yazildigi icin
konteyner yenilenince dusuyordu. Senin makinende `~/.claude` kalici oldugu
icin bu sorun yok.

## 6. Kurulum hook'unu kapat

`.claude/hooks/eklentileri-kur.sh`, konteyner her yenilendiginde eklentileri
geri yuklemek icin yazildi. Senin makinende `~/.claude` silinmedigi icin
gereksiz, ustelik iki adimi zararli olabilir:

- gstack'i sifirdan klonlamasi (1,6 GB)
- Playwright'in chromium'unu sembolik linklemesi — bu takla konteynere ozgu,
  yereldeki gercek Playwright kurulumunu bozabilir

Kapatmak icin `.claude/settings.json` icindeki `SessionStart` blogunu sil ya da
yorum satirina al. Hook dosyasi dursun; bulutta calismaya devam etmek
istersen lazim olur.

## 7. Bulutta calismayan neler yerelde calisir

- **`gh` komutlarinin tamami.** Buradaki proxy GraphQL'i engelliyordu
  (`gh pr list`, `gh pr create` 403 donuyordu). Yerelde hepsi calisir; gstack'in
  17 becerisi buna bagli.
- **security-guidance'in LLM inceleme katmani.** Burada `ANTHROPIC_AUTH_TOKEN`
  yoktu, o yuzden sadece desen taramasi calisiyordu. Yerelde Claude Code bu
  degiskeni hook'lara kendisi gecirdigi icin git-diff uzerinden model
  incelemesi de devreye girer.
- **Playwright.** Normal sekilde kurulur, sembolik link takasina gerek kalmaz.

## 8. Kaldigimiz yer

`CLAUDE.md` → "Siradaki adim" bolumu:

Tasarim onaylandi ve
`docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`
dosyasinda. Sirada **Faz 1'in uygulama plani** var: kayit, telefon dogrulama,
profil olusturma, oturum.

Yeni oturumda soyle demen yeterli:

> Faz 1'in uygulama planini yazalim.

Tasarimi bastan tartismaya gerek yok; kararlar spec'te, gerekceleriyle
birlikte.

## Mobil gelistirme icin ayrica gerekenler

Faz 1'e baslarken lazim olacaklar, simdi kurman gerekmiyor:

- **Expo / React Native:** `npm install -g expo-cli`, sonra proje olusturulur
- **Android testi:** Android Studio (emulator icin) ya da telefonunda Expo Go
- **iOS testi:** yalnizca macOS + Xcode. Windows ya da Linux kullaniyorsan iOS
  tarafi icin Mac gerekir; baslangicta Android ile ilerlemek makul
- **Supabase:** <https://supabase.com> uzerinde ucretsiz proje acilir
