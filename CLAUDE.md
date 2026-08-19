# Proje Hafizasi

Bu dosya her Claude Code oturumunda otomatik olarak yuklenir. Oturumlar arasinda
tasinmasini istedigimiz her sey buraya yazilir.

## Nasil calisiyor

Claude'un kendi basina oturumlar arasi hafizasi yoktur; her oturum sifirdan
baslar. Sureklilik su uc dosyayla saglanir:

| Dosya | Rolu |
|---|---|
| `CLAUDE.md` (bu dosya) | Kalici hafiza. Her oturum basinda otomatik okunur. Kararlar, tercihler, proje durumu. |
| `docs/konusma-gunlugu.md` | Oturum indeksi + karar defteri. |
| `docs/oturumlar/` | Her oturumun tam dokumu (hook tarafindan otomatik yazilir). |

Oturum dokumleri `.claude/hooks/oturum-kaydet.py` tarafindan otomatik uretilir;
ayrintilar `docs/konusma-gunlugu.md` icinde.

## Claude icin kurallar

- Oturuma baslarken `docs/konusma-gunlugu.md` dosyasindaki son girdileri oku.
- Kalici bir karar alindiginda (teknoloji secimi, kapsam, isim, mimari) bu
  dosyayi veya konusma gunlugunu guncelle ve commit'le.
- Konteyner gecicidir: push edilmeyen hicbir sey kalmaz. Onemli her seyi
  yukaridaki calisma dalina push et.
- Kullaniciyla Turkce konus.

## Proje durumu

- **Depo:** `ozdmrorcn16/cloud`
- **Calisma dali:** `claude/yeni-oturumdan-devam-wjff86`. Onceki dallar
  (`claude/uygulama-fikri-o3tuda`, `claude/code-review-plugin-jvgabq`, ...)
  2026-08-19'da bu dala birlestirildi; guncel durum burada.
- **Asama:** Tasarim onaylandi. Sirada Faz 1 uygulama plani var.

## Uygulama fikri

**Konum tabanli sosyal uygulama.** Kullanicilar arkadas buluyor, arkadas
ekliyor, konum belirtiyor ve sohbet ediyor.

- **Platform:** gercek mobil uygulama (magazadan indirilen). Tarayici
  uygulamasi degil — kullanicinin karari, 2026-08-11.
- **Cekirdek islevler:** arkadas kesfi, arkadas ekleme, konum paylasimi,
  mesajlasma.

### Henuz cevaplanmamis (fikri netlestirmek icin gerekli)

1. **Kime hitap ediyor ve neden mevcutlardan farkli?** Bu tarif bugun onlarca
   uygulamaya uyuyor. Ayirt edici nokta belirlenmeden teknoloji secimi
   yapilmamali — mimariyi belirleyen sey bu.
2. **Konum ne kadar hassas?** Canli konum mu, sehir/semt gibi kaba bir alan mi,
   yoksa "su an burada" seklinde anlik bir paylasim mi? Uc secenek uc farkli
   mimari ve uc farkli risk profili demek.
3. **Kimler birbirini gorebiliyor?** Sadece karsilikli arkadaslar mi, yakindaki
   herkes mi? Yabancilar birbirinin konumunu gorebiliyorsa uygulama guvenlik
   acisindan bambaska bir kategoriye giriyor.

### Yerel kuruluma gecis

Gelistirme kullanicinin kendi bilgisayarina tasiniyor. Adim adim rehber:
`docs/yerel-kuruluma-gecis.md`. claude-mem hafizasinin (181 gozlem) yedegi
`docs/hafiza/claude-mem-yedek.db` icinde; maskelenmis ve sikistirilmis kopya.

### Siradaki adim

Tasarim tamam ve onaylandi:
`docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`

Sirada **Faz 1'in uygulama plani** var: kayit, telefon dogrulama, profil
olusturma, oturum. Yeni oturumda once bu spec'i oku, sonra `writing-plans`
becerisiyle plani yaz. Tasarimi bastan tartismaya gerek yok — kararlar
spec'te, gerekceleriyle birlikte.

Spec'te bes acik soru var (mekan verisi kaynagi, check-in omru, paket fiyati,
SMS saglayicisi, moderasyon). Hicbiri Faz 1'i engellemiyor.

### Bastan tasarima girmesi gereken kisit

Yabancilarla konum paylasimi bu uygulamanin **cekirdek riski**, sonradan
eklenecek bir ozellik degil. Sonuclari:

- Turkiye'de KVKK, AB kullanicisi olacaksa GDPR kapsaminda konum "ozel nitelikli
  olmayan ama yuksek riskli" kisisel veri; acik riza, saklama suresi ve silme
  akisi gerekiyor.
- App Store ve Play Store konum izni ve resit olmayan kullanicilar konusunda
  ayri kurallar isletiyor; yanlis kurgu magaza reddine yol aciyor.
- Taciz, takip ve sahte hesap senaryolari icin engelleme/sikayet akisi ilk
  surumde olmali.

## Eklentiler

Hepsi `.claude/settings.json` icinde **proje kapsaminda** tanimli, yani yeni
konteynerde kendiliginden geri gelir. Nasil eklendigi: `docs/eklenti-ekleme.md`.

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi.
- `code-review@claude-code-plugins` — PR'lari 4 paralel ajanla denetleyip
  bulgulari 0-100 guven puaniyla eleyen otomatik kod incelemesi (esik 80).
  Cagrisi: `/code-review:code-review`, PR'a yorum birakmak icin `--comment`.
- `security-guidance@claude-code-plugins` — her duzenlemeyi guvenlik acigi
  kaliplarina karsi tarayan hook tabanli eklenti (komut enjeksiyonu, sizmis
  anahtar, vb.). Slash komutu yok, arka planda calisir.
- `claude-mem@thedotmack` — oturumlar arasi kalici hafiza. `~/.claude-mem`
  altinda SQLite + chroma; 37700 portunda bir worker calisir.
  `/claude-mem:mem-search`, `/claude-mem:learn-codebase` gibi ~20 beceri.
- `no-ai-slop` (petergyang/no-ai-slop) — market eklentisi **degil**, tek dosyalik
  beceri. Repoya dogrudan kopyalandi: `.claude/skills/no-ai-slop/`. Yaziyi 20+
  "AI slop" kalibindan temizler, sesini korur. `/no-ai-slop <metin>` duzeltir,
  `/no-ai-slop is this slop? <metin>` sadece tespit eder.
- `gstack` (garrytan/gstack) — market eklentisi **degil**;
  `~/.claude/skills/gstack` altina klonlanip `./setup` ile kurulur. 54 beceri,
  hepsi `gstack-` onekli (`/gstack-qa`, `/gstack-ship`, `/gstack-review`...).
  Onek, diger eklentilerle cakismasin diye `--prefix` ile secildi.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-19 — Calisma birden fazla dala dagilmisti; en ilerideki dal
  (`claude/code-review-plugin-jvgabq`, 12 Agustos'a kadar) yeni oturum dali
  `claude/yeni-oturumdan-devam-wjff86` icine birlestirildi. Bundan sonra tek
  dal kullanilacak. Ders: yeni oturum yeni bir dalda aciliyorsa ilk is
  `git branch -r` ile en guncel dali bulup birlestirmek.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
- 2026-08-09 — `code-review` eklentisi ayni markete (`claude-code-plugins`)
  eklendi. Bu ortamda `/plugin` paneli calismadigi icin eklentiler her zaman
  `.claude/settings.json` uzerinden acilacak; elle ekleme yontemleri
  `docs/eklenti-ekleme.md` dosyasina yazildi.
- 2026-08-09 — `settings.json`'a yazmak **tek basina yetmiyor**: dis kaynakli
  eklenti diskte kurulu degilse yuklenmiyor. `claude plugin install ... --scope
  project` de calistirilmali. Onceki oturumun `frontend-design`'i bu yuzden
  hic aktif olmamisti.
- 2026-08-09 — `security-guidance`, `claude-mem` ve `gstack` kuruldu ve test
  edildi. Konteyner gecici oldugu icin `~/.claude` altina kurulanlari geri
  getiren bir `SessionStart` hook'u yazildi:
  `.claude/hooks/eklentileri-kur.sh`.
- 2026-08-09 — gstack'in Playwright'i chromium-1208 ariyor ama
  `cdn.playwright.dev` ag politikasiyla blokli. Konteynerdeki chromium-1194,
  1208'in bekledigi Chrome-for-Testing yerlesimiyle `/opt/pw-browsers` altina
  sembolik linklendi. Bu takla da hook'ta duruyor.
- 2026-08-09 — Yetenekler tek tek test edildi. Iki gercek ariza bulundu ve
  duzeltildi, biri ortam kisiti olarak birakildi. Ayrinti:
  `docs/eklenti-ekleme.md` → "Yetenek testi sonuclari".
  - claude-mem'in `smart_outline`/`smart_search` araclari **her** dosyada bos
    donuyordu: `tree-sitter-cli` binary'si hic inmemis. Hook'a indirme adimi
    eklendi. Hata mesaji ("unsupported language") yanilticiydi.
  - 17 gstack becerisinin ihtiyac duydugu `gh` CLI kurulu degildi; hook'a
    eklendi. GraphQL komutlari (`gh pr list/view`) proxy tarafindan blokli,
    REST (`gh api`, `gh pr diff`) calisiyor.
  - security-guidance'in LLM inceleme katmani bu ortamda calisamiyor:
    `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` yok. Desen taramasi (25 kural)
    calisiyor. Oturum kimligini env'e kopyalamak dogru olmaz diye
    dokunulmadi — karar kullanicinin.
- 2026-08-09 — Oturum kaydinin redaksiyonu tamamlandi. `gizlileri_maskele()`
  onceki oturumda yazilmisti ama **hic cagrilmiyordu** (code-review eklentisinin
  buldugu gercek acik). Artik uc cikti da maskeden geciyor: dokum `.md`, ham
  `.jsonl` ve `konusma-gunlugu.md` indeksi. Indeks ozeti maskelendikten sonra
  kirpiliyor, boylece yarim kalan bir anahtar sizmiyor.
- 2026-08-09 — Maskeleme, `temizle()` adinda tek kapiya donusturuldu:
  `gizlileri_maskele()` + yeni `kimlikleri_kisalt()`. Ikincisi `toolu_`/`msg_`/
  `req_` onekli ic kimlikleri kisaltiyor; sir degiller ama GitHub'in push
  korumasi onlari Stripe anahtari sanip push'u reddedebiliyor. Mevcut ham
  dokumler de ayni fonksiyonla temizlendi.
- 2026-08-11 — `no-ai-slop` becerisi `~/.claude` yerine **repoya** kuruldu
  (`.claude/skills/no-ai-slop/`). Deponun onerdigi `npx skills add --global`
  konteynerle birlikte silinirdi; repodaki kopya hook'suz kaliciysa tercih
  edilir. Bundan sonra tek dosyalik beceriler icin varsayilan yontem bu.
- 2026-08-11 — **Uygulama fikri belirlendi:** konum tabanli sosyal uygulama
  (arkadas bulma/ekleme, konum, sohbet). Platform gercek mobil uygulama olacak,
  web degil. Ayrinti ve acik sorular yukarida "Uygulama fikri" bolumunde.
- 2026-08-11 — Mobil karari geliztirme yerini de belirliyor: simulator, cihazda
  deneme ve magazaya yukleme bulut konteynerinden yapilamaz. Asil gelistirme
  kullanicinin kendi bilgisayarinda olacak; bu depo (CLAUDE.md, docs, hook'lar)
  klonla birlikte tasiniyor, `~/.claude-mem` veritabani tasinmiyor.
