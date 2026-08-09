# Bu beceri nereden geldi

`SKILL.md` ve `LICENSE.txt` elle yazilmadi; Anthropic'in resmi eklenti marketinden
kopyalandi (vendor edildi).

| | |
|---|---|
| Market | `anthropics/claude-plugins-official` |
| Eklenti | `frontend-design` |
| Kaynak yol | `plugins/frontend-design/skills/frontend-design/` |
| Alindigi commit | `3160b166dcefc641f84e48ea2d136b8890f1de65` |
| Kopyalama tarihi | 2026-08-09 |
| Lisans | Apache 2.0 (`LICENSE.txt`) |

## Neden eklenti olarak degil de kopya olarak?

Eklenti sistemi `~/.claude/` altina kuruyor; bu konteyner ise gecici. Ayari
`.claude/settings.json` icinde tutmak yetmedi — yeni konteynerde eklenti
indirilmeden kaldi ve beceri hic yuklenmedi. Repodaki `.claude/skills/` ise her
oturumda ag baglantisi ve yukleyici olmadan dogrudan okunur. Garanti calismasi
icin kopya yontemi secildi.

Bunun bedeli: upstream guncellemeleri kendiliginden gelmez, elle cekilir.

## Guncelleme

Yeni surumu almak icin:

```bash
git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git /tmp/mp
cp /tmp/mp/plugins/frontend-design/skills/frontend-design/SKILL.md \
   /tmp/mp/plugins/frontend-design/skills/frontend-design/LICENSE.txt \
   "$CLAUDE_PROJECT_DIR/.claude/skills/frontend-design/"
git -C /tmp/mp rev-parse HEAD   # yeni commit'i bu dosyaya yaz
rm -rf /tmp/mp
```

Sonra yukaridaki tabloda "Alindigi commit" ve tarihi guncelle, degisikligi commit'le.
