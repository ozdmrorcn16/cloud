# cloud

Bu depoda birbirinden bagimsiz projeler bulunur. Her proje kendi klasorunde
durur; kod, ayar ve bagimliliklar karismaz.

| Klasor | Proje | Durum |
|---|---|---|
| [`youtube-otomasyonu/`](youtube-otomasyonu/) | Fikirden yayina tam otomatik YouTube video uretim hatti | Calisiyor |
| [`uygulama/`](uygulama/) | Gelistirilecek uygulama | Beklemede |

Ortak olan tek sey oturumlar arasi hafiza katmani:

| Yol | Rolu |
|---|---|
| `CLAUDE.md` | Proje indeksi + ortak kurallar (her oturumda otomatik okunur) |
| `docs/projeler/` | Her projenin durumu, kararlari, acik isleri |
| `docs/konusma-gunlugu.md` | Oturum indeksi |
| `docs/oturumlar/` | Oturum dokumleri (otomatik) |
| `.claude/hooks/` | Oturum kaydedici (sirlari maskeler) |

## Hizli baslangic

```bash
# YouTube otomasyonu
cd youtube-otomasyonu
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m otomasyon dogrula
```

Ayrintili rehber: [`youtube-otomasyonu/README.md`](youtube-otomasyonu/README.md)
