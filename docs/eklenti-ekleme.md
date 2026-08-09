# Eklentiyi Kendin Nasil Eklersin

Claude Code eklentileri (plugin) *marketplace* denen kataloglardan gelir. Is her
zaman iki adimdir:

1. **Marketi ekle** — katalogu Claude Code'a tanit. Bu adimda hicbir sey kurulmaz.
2. **Eklentiyi kur** — katalogdan istedigin eklentiyi sec.

Uc farkli yol var. Bu depoda **3. yolu** (settings.json) kullaniyoruz, cunku
konteyner gecici; sadece repoya yazilan ayar yeni oturumda geri gelir.

---

## Yol 1 — `/plugin` menusu (terminal CLI)

En kolayi. Claude Code'un icinde:

```
/plugin
```

Sekmeler: **Discover** (kataloglari gez), **Installed** (kurulular),
**Marketplaces** (market ekle/cikar/guncelle), **Errors** (yukleme hatalari).
Sekmeler arasi `Tab`, geri `Shift+Tab`.

Bir eklentiye `Enter` deyince kurulum kapsamini secersin:

| Kapsam | Nereye yazilir | Kim gorur |
|---|---|---|
| **User** | `~/.claude/settings.json` | sen, butun projelerde |
| **Project** | `.claude/settings.json` (repoda) | repodaki herkes |
| **Local** | `.claude/settings.local.json` | sadece sen, bu repoda |

> Not: `/plugin` interaktif bir panel; **web/bulut oturumlarinda calismayabilir.**
> O durumda Yol 3'u kullan.

## Yol 2 — Tek satirlik komutlar

```shell
# Market ekle (GitHub owner/repo kisayolu)
/plugin marketplace add anthropics/claude-code

# Eklenti kur:  <eklenti>@<market>
/plugin install code-review@claude-code-plugins

# Yonetim
/plugin list
/plugin disable  <eklenti>@<market>
/plugin enable   <eklenti>@<market>
/plugin uninstall <eklenti>@<market>
/plugin marketplace list
/plugin marketplace update <market>
/plugin marketplace remove <market>     # dikkat: o marketten kurulanlari da siler

# Kurulumdan sonra oturumu yeniden baslatmadan etkinlestir
/reload-plugins
```

Market kaynagi GitHub olmak zorunda degil:

```shell
/plugin marketplace add https://gitlab.com/firma/plugins.git      # herhangi bir git URL'i
/plugin marketplace add https://gitlab.com/firma/plugins.git#v1.0 # belirli bir dal/etiket
/plugin marketplace add ./yerel-market                            # yerel klasor
/plugin marketplace add https://ornek.com/marketplace.json        # dogrudan katalog dosyasi
```

Kabuktan (Claude Code'un disindan) da yapilabilir:

```bash
claude plugin marketplace add anthropics/claude-code
claude plugin install code-review@claude-code-plugins --scope project
```

## Yol 3 — `.claude/settings.json` (bu depoda kullandigimiz yontem)

Iki anahtar var: marketi tanitan `extraKnownMarketplaces`, eklentiyi acan
`enabledPlugins`. Bu dosya repoda oldugu icin yeni konteynerde ayar
kendiliginden geri gelir.

```json
{
  "extraKnownMarketplaces": {
    "claude-code-plugins": {
      "source": { "source": "github", "repo": "anthropics/claude-code" }
    }
  },
  "enabledPlugins": {
    "frontend-design@claude-code-plugins": true,
    "code-review@claude-code-plugins": true
  }
}
```

- `extraKnownMarketplaces` icindeki anahtar (`claude-code-plugins`) **senin
  verdigin market adidir**; `enabledPlugins` icinde `@` sonrasi bu adla ayni
  olmali.
- `enabledPlugins` degeri `false` yaparsan eklenti kurulu kalir ama kapanir.
- Dis kaynakli bir eklenti sadece proje ayarinda aciksa, Claude Code ilk
  acilista onu kurmani isteyebilir ve calistiracagin `claude plugin install`
  komutunu gosterir.

---

## Hangi marketler var

| Market | Nasil eklenir | Icerik |
|---|---|---|
| `claude-plugins-official` | Claude Code ilk interaktif aciliste **kendisi ekler**. Eklemediyse: `/plugin marketplace add anthropics/claude-plugins-official` | Anthropic'in kurate ettigi set: `github`, `linear`, `notion`, `figma`, `slack`, `sentry`, dil sunuculari (`typescript-lsp`, `pyright-lsp`, ...), `security-guidance`, `commit-commands`, `pr-review-toolkit`, `plugin-dev` |
| `claude-community` | `/plugin marketplace add anthropics/claude-plugins-community` | Incelemeden gecmis ucuncu parti eklentiler |
| `claude-code-plugins` (demo) | `/plugin marketplace add anthropics/claude-code` | Ornek eklentiler: `code-review`, `frontend-design`, `feature-dev`, `hookify`, `ralph-wiggum`, ... |

Katalogu tarayicidan gezmek icin: <https://claude.com/plugins>

## Onemli tuzak: settings.json tek basina yetmez

`extraKnownMarketplaces` + `enabledPlugins` yazmak eklentiyi **acar** ama
**kurmaz**. Dis kaynakli (GitHub) bir eklenti diskte yoksa yuklenmez; Claude
Code onu "kurulu degil" diye raporlar. Bu yuzden ayarin yaninda bir de:

```bash
claude plugin marketplace add anthropics/claude-code
claude plugin install security-guidance@claude-code-plugins --scope project
```

calistirmak gerekiyor. Kontrol:

```bash
claude plugin marketplace list
claude plugin list
```

## Bu depoda kurulu olanlar

| Eklenti | Tur | Nasil kuruldu |
|---|---|---|
| `frontend-design` | market | `claude-code-plugins`, project scope |
| `code-review` | market | `claude-code-plugins`, project scope |
| `security-guidance` | market (hook tabanli) | `claude-code-plugins`, project scope |
| `claude-mem` | market + npm worker | `npx claude-mem install` + `thedotmack` marketi |
| `gstack` | market **degil** | `~/.claude/skills/gstack` klonu + `./setup` |

Konteyner gecici oldugu icin `~/.claude` altindaki her sey oturum bitince
kaybolur. `.claude/hooks/eklentileri-kur.sh` adli `SessionStart` hook'u bunlari
geri yukler; her sey yerindeyse ~5 saniyede biter, sifirdan kurulumda birkac
dakika surer.

### Bu ortama ozgu iki takla

1. **Playwright Chromium.** gstack'in playwright'i `chromium-1208` ariyor,
   konteynerde `chromium-1194` var ve `cdn.playwright.dev` ag politikasiyla
   blokli. Cozum: mevcut binary'yi 1208'in bekledigi Chrome-for-Testing
   yerlesimiyle `/opt/pw-browsers` altina sembolik linklemek. Hook bunu
   otomatik yapiyor.
2. **Dis siteler.** `example.com` gibi hostlar proxy tarafindan 403 ile
   reddediliyor (curl de ayni sonucu veriyor). `gstack-browse` yerel sunucuya
   ve izinli hostlara sorunsuz gidiyor; genel web gezintisi ortam kisiti.

## Kendi eklentini yazmak

Bir eklenti aslinda su yapiya sahip bir klasordur:

```
benim-eklentim/
├── .claude-plugin/plugin.json   # ad, aciklama, surum  (SADECE bu dosya burada durur)
├── skills/<ad>/SKILL.md         # /benim-eklentim:<ad> olarak cagrilir
├── agents/                      # ozel ajanlar
├── hooks/hooks.json             # olay kancalari
└── .mcp.json                    # MCP sunuculari
```

Dikkat: `skills/`, `agents/`, `hooks/` **`.claude-plugin/` icine konmaz**, eklenti
kokunde durur. Test etmek icin kurulum gerekmez:

```bash
claude --plugin-dir ./benim-eklentim
claude plugin validate ./benim-eklentim
```

Zaten `.claude/commands/` veya `.claude/skills/` altinda yazdigin seyler varsa,
paylasilabilir hale getirmek icin bunlari eklenti kokune kopyalayip
`plugin.json` eklemen yeterli.

## Guvenlik

Eklentiler senin yetkilerinle **rastgele kod calistirabilir** (hook, MCP sunucusu,
`bin/` altindaki calistirilabilir dosyalar). Sadece guvendigin kaynaklardan kur.

## Sik takilinan yerler

| Belirti | Cozum |
|---|---|
| `/plugin` komutu yok | Claude Code'u guncelle (`npm install -g @anthropic-ai/claude-code@latest`), yeniden baslat |
| `/plugin` bu ortamda calismiyor | Web/bulut oturumundasin — Yol 3'u kullan |
| `Marketplace "..." not found` | Once `/plugin marketplace add ...` |
| Eklenti katalogda gorunmuyor | `/plugin marketplace update <market>` sonra tekrar kur |
| Kurdum ama komutlari yok | `/reload-plugins` (uyari verirse `/reload-plugins --force`) |
| Beceriler hala gelmiyor | `rm -rf ~/.claude/plugins/cache`, yeniden baslat, tekrar kur |

Eklenti becerileri her zaman **ad alanli** cagrilir: `<eklenti-adi>:<beceri-adi>`.
Ornegin `code-review` eklentisinin komut dosyasi `commands/code-review.md`
oldugu icin cagrisi `/code-review:code-review` olur. Dogru adi `/plugin` detay
ekraninda ya da `/help` icindeki "Custom commands" sekmesinde gorursun.
