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
  `claude/uygulama-fikri-o3tuda` dalina push et.
- Kullaniciyla Turkce konus.

## Proje durumu

- **Depo:** `ozdmrorcn16/cloud`
- **Calisma dali:** `claude/uygulama-fikri-o3tuda`
- **Asama:** Fikir asamasi. Uygulama fikri: VPN uygulamasi (asagida).

## Uygulama fikri

- **Ne:** VPN uygulamasi.
- **Asama:** Fikir netlesti, teknik ve ticari kararlar henuz alinmadi.
- **Gelir modeli (arastiriliyor, karar degil):** Ucretsiz katman + reklam
  (odullu video agirlikli, app open, olculu gecis reklami) ve yaninda
  abonelik; yani hibrit model.
- **Acik sorular:** hedef platform (Android / iOS / ikisi), hedef ulkeler,
  kendi sunucu altyapisi mi yoksa hazir VPN SDK / white-label mi,
  protokol secimi (WireGuard / OpenVPN / IKEv2).
- **Bilinen riskler:** Apple 5.4 kurali VPN uygulamasi icin sirket tipi
  gelistirici hesabi ve veri paylasimi yasagi getiriyor; Google Play
  `VpnService` icin ayri beyan istiyor ve reklam manipulasyonunu yasakliyor.
  Ucretsiz VPN trafigi genelde dusuk eCPM'li ulkelerden geliyor, bant
  genisligi maliyeti ise gercek.

## Eklentiler

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi. Hem market hem eklenti `.claude/settings.json` icinde
  proje kapsaminda tanimli, yani yeni konteynerde kendiliginden geri gelir.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
- 2026-09-12 — Uygulama fikri belirlendi: **VPN uygulamasi**. Para kazanma
  tarafinda hibrit model (reklam + abonelik) arastiriliyor; kesin karar
  platform ve hedef ulke netlesince verilecek.
