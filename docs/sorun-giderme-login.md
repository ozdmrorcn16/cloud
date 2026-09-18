# Sorun Giderme: Yerelde Claude Code Login

Yereldeki (kendi makinendeki) Claude Code oturumunda giris sorunu ciktiginda
izlenecek adimlar. Kaynak: code.claude.com/docs — `troubleshoot-install` ve
`authentication` sayfalari.

## 0. Once teshis

Claude Code acilabiliyorsa iceride:

```
/status     # hangi kimlik dogrulama yonteminin aktif oldugunu gosterir
/doctor     # kurulum, ayar ve eklenti kontrolu; onerdigi duzeltmeyi uygulayabilir
```

Claude Code hic acilmiyorsa terminalden:

```bash
claude doctor
```

`/status` ciktisindaki `Login` satiri `Expired — log in again` diyorsa dogrudan
3. adima gec.

## 1. Temiz yeniden giris (vakalarin cogunu cozer)

1. Claude Code icinde `/logout`
2. Claude Code'u kapat
3. `claude` ile yeniden baslat ve girisi tamamla

Not: `/logout` **butun** kayitli kimlik bilgilerini siler — MCP sunucu
girisleri ve eklenti gizli degerleri dahil. Sonrasinda onlari yeniden
yetkilendirmen gerekebilir.

## 2. Tarayici acilmiyor / geri donmuyor

- Giris ekraninda `c` tusuna basarak OAuth URL'ini panoya kopyala, tarayiciya
  elle yapistir.
- Tarayici geri yonlendirme yerine bir **login code** gosteriyorsa, o kodu
  terminaldeki `Paste code here if prompted` satirina yapistir. WSL2, SSH ve
  konteynerlerde normal davranis budur: tarayici baska makinede acildigi icin
  yerel callback sunucusuna ulasamaz.
- Yapistirma calismiyorsa (Windows Terminal'de sag tik veya `Shift+Insert`
  dene) ya da kodu standart girdiden okuyan su komutu kullan:

  ```bash
  claude auth login
  ```

- WSL2'de tarayici hic acilmiyorsa:

  ```bash
  export BROWSER="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
  claude
  ```

### `OAuth error: Invalid code`

Kod suresi dolmus ya da kopyalarken kirpilmis demektir. Enter'a basip tekrar
dene ve girisi tarayici acildiktan sonra hizlica tamamla.

## 3. Surekli "tekrar giris yap" diyorsa

- `/login` ile yeniden kimlik dogrula.
- Sik tekrarliyorsa **sistem saatini** kontrol et; token dogrulamasi dogru
  zaman damgasina bagli.
- macOS'ta kimlik bilgileri login Keychain'e yazilir. Keychain kilitliyse
  (ornegin SSH oturumunda) Claude Code duz metin
  `~/.claude/.credentials.json` dosyasina duser. `claude doctor` ciktisinda
  `macOS Keychain is not writable` uyarisi varsa:

  ```bash
  security unlock-keychain ~/Library/Keychains/login.keychain-db
  ```

  Duzelmezse Keychain Access > `login` > Edit > Change Password for Keychain
  ile parolayi hesap parolasiyla esitle, sonra `/logout` + `/login`.

## 4. Giristen sonra API hatasi

### `403 Forbidden` / `Request not allowed`

- Pro/Max: abonelik aktif mi — claude.ai/settings
- Console: hesabinda "Claude Code" veya "Developer" rolu var mi
- Kurumsal proxy arkasindaysan proxy ayarlarini kontrol et

### `400 ... This organization has been disabled`

Aboneligin aktif olmasina ragmen bu hatayi aliyorsan ortamda eski bir
`ANTHROPIC_API_KEY` aboneligi eziyor demektir:

```bash
unset ANTHROPIC_API_KEY
claude
```

Kalici olmasi icin `~/.zshrc`, `~/.bashrc`, `~/.profile` icindeki
`export ANTHROPIC_API_KEY=...` satirlarini sil. Windows'ta `$PROFILE` ve
kullanici ortam degiskenlerine bak. Sonra `/status` ile hangi yontemin aktif
oldugunu dogrula.

## Kimlik bilgileri nerede duruyor

| Platform | Konum |
|---|---|
| macOS | Sifreli Keychain; yazilamazsa `~/.claude/.credentials.json` (mod 0600) |
| Linux | `~/.claude/.credentials.json` (mod 0600) |
| Windows | `%USERPROFILE%\.claude\.credentials.json` |

`CLAUDE_CONFIG_DIR` ayarliysa dosya o dizinin altinda tutulur.

## Kimlik dogrulama onceligi

Birden fazla kimlik bilgisi varsa Claude Code sirayla secer:

1. Bulut saglayici (`CLAUDE_CODE_USE_BEDROCK` / `_VERTEX` / `_FOUNDRY`)
2. `ANTHROPIC_AUTH_TOKEN`
3. `ANTHROPIC_API_KEY`
4. `apiKeyHelper` betigi
5. `CLAUDE_CODE_OAUTH_TOKEN`
6. Anthropic profil / federation kimlik bilgileri
7. `/login` ile alinan abonelik OAuth kimligi

Yani abonelikle girmis olsan bile ortamdaki bir anahtar veya token onu ezer.
Beklenmedik bir hesapla baglaniyorsan once bu listeyi yukaridan asagi kontrol et.

## Tarayicisiz ortamlar (CI, script)

```bash
claude setup-token          # bir yillik OAuth token uretir, ekrana basar
export CLAUDE_CODE_OAUTH_TOKEN=<token>
```

Token hicbir yere kaydedilmez; kopyalayip ilgili ortama kendin koyarsin.
