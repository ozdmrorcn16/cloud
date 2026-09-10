# Masaustu kisayollari

`vpn` projesini terminalde Claude Code ile acan kisayollar. Hepsi projenin
masaustunde `vpn` adli klasorde oldugunu varsayar.

## 1. Projeyi masaustune klonla (bir kez)

```
git clone -b claude/vpn https://github.com/ozdmrorcn16/cloud.git ~/Desktop/vpn
```

Windows'ta `~/Desktop` yerine `%USERPROFILE%\Desktop` kullan.

## 2. Isletim sistemine gore kisayolu kopyala

| Sistem | Dosya | Ne yapilacak |
|---|---|---|
| Windows | `vpn-terminal.bat` | Masaustune kopyala, cift tikla. |
| macOS | `vpn-terminal.command` | Masaustune kopyala, cift tikla. Ilk acilista "guvenilmeyen gelistirici" uyarisi cikarsa sag tik > Ac. |
| Linux | `vpn-terminal.desktop` | Masaustune kopyala, sag tik > "Baslatmaya izin ver". |

## Gereksinimler

- Git
- Node.js ve Claude Code: `npm install -g @anthropic-ai/claude-code`

Kisayol, proje klasoru veya Claude Code yoksa ne yapman gerektigini yazar.
