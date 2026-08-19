# Devir teslim — yeni oturum buradan basla

Tek sayfa. Yeni oturum acan Claude once bunu okusun; gerisini gerektikce
acar. Amac: bagi kaybetmeden, bos yere token harcamadan devam etmek.

## Uygulama nedir

Konum tabanli sosyal uygulama. Mekana check-in, yakindakileri gorme, mesafe
ayari, sohbet/takip istegi, engelleme-sikayet. **Gercek mobil uygulama**
(Expo / React Native + Supabase), web degil.

Tasarim onaylandi ve degismiyor:
`docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`
Bastan tartisma; kararlar orada gerekceleriyle yazili.

## Kod nerede — en kritik bilgi

| | |
|---|---|
| Bu depodaki dal (`claude/uygulama-gelistirme-d4g3if`) | Hafiza, dokuman, tasarim spec'i. **Kod yok.** |
| `claude/faz2b-guvenlik` | **Asil kod burada.** Kullanicinin kendi bilgisayarinda, GitHub'a push edilmemis. |

Bulut oturumu `faz2b-guvenlik` dalini goremez. "Kod bulamadim" diyorsan sebep
budur — is kaybolmadi, sadece push edilmedi.

Kullanicinin yerel terminalinde tek komut:

```sh
git push -u origin claude/faz2b-guvenlik
```

Push edildikten sonra: `git fetch origin && git checkout claude/faz2b-guvenlik`

## Kaldigimiz yer

- **Faz 1 (hesap)** — bitti.
- **Faz 2 (kesif ve guvenlik)** — devam ediyor. Son durum notu:
  *"Task 18 in progress: applying secret-moment decision; Dispatch guards
  identified"* (2026-08-19, "App yapimi" adli yerel CLI oturumu).
- Faz 3 (bag ve sohbet) ve Faz 4 (gelir) baslamadi.

Fazlarin tarifi spec'in "Fazlar" bolumunde.

## Nerede calisiliyor

Kod **kullanicinin kendi bilgisayarindaki terminalde** yaziliyor (karar
2026-08-11 ve 2026-08-19). Sebep: mobil uygulama simulator, cihazda deneme ve
magaza yuklemesi gerektiriyor; bunlar bulut konteynerinden yapilamaz.
Bulut oturumu yalnizca hafiza, dokuman ve tasarim icin.

Yerel kurulum adimlari: `docs/yerel-kuruluma-gecis.md`

## Yeni oturumun ilk uc hareketi

1. Bu dosyayi ve `CLAUDE.md`'yi oku.
2. `git branch -r` calistir — is birden fazla dala dagilmisti, bir daha olmasin.
3. `faz2b-guvenlik` uzakta yoksa kullanicidan push etmesini iste; yoksa
   Faz 2b'ye devam et.

## Tekrarlanmamasi gereken hata

Her yeni oturum yeni bir dal aciyor ve o dal eski bir koldan cikabiliyor.
2026-08-19'da tam bunun yuzunden "hicbir sey yok" raporu verildi. Ilk is her
zaman `git branch -r` ile en guncel dali bulmak.
