# Kendi Supabase'imizi Kurmak: Maliyet ve Karsilastirma

**Tarih:** 2026-08-30
**Soru:** Supabase gibi kendi sunucumuzu yapsak maliyeti ne olur, artilari
eksileri neler?

**Kisa cevap:** Su anki asamada (fikir asamasi, kullanici yok) kendi sunucunu
kurmak *daha pahali*. Ucuzlama ancak aylik fatura 300-500 dolari astiginda veya
cok yuksek trafik/veri hacminde basliyor. Supabase acik kaynak oldugu icin
sonradan tasinmak gercekten mumkun; bu yuzden bu karari simdi vermek gerekmiyor.

---

## 1. Yonetilen Supabase fiyatlari (2026)

| Plan | Aylik | Icerdigi |
|---|---|---|
| Free | $0 | 500 MB veritabani, 5 GB trafik, 1 GB dosya. Proje 1 hafta hareketsiz kalirsa duraklatilir. |
| Pro | $25 | 8 GB veritabani, 250 GB trafik, 100 GB dosya, 100.000 aylik aktif kullanici, $10 compute kredisi |
| Team | $599 | Pro + SOC2, SSO, uzun log saklama |
| Enterprise | Gorusmeli | — |

Limit asimi (Pro plani):

| Kalem | Birim fiyat |
|---|---|
| Veritabani depolama | $0.125 / GB / ay |
| Cikis trafigi (egress) | $0.09 / GB |
| Aylik aktif kullanici | $0.00325 / kullanici |

## 2. Kendi sunucumuz: gercek maliyet

Self-hosted Supabase yaklasik 12 Docker konteyneri calistirir (Postgres, GoTrue,
PostgREST, Realtime, Storage, Kong, imgproxy, Edge Runtime...). Uretim icin
onerilen taban **8 GB RAM / 4 cekirdek**; rahat calismak icin 16 GB.

### Dikkat: Hetzner 2026'da iki kez zam yapti

15 Haziran 2026'da fiyatlar guncellendi ve artis her seride ayni degil:

| Seri | Artis |
|---|---|
| CX / CAX (paylasimli vCPU, Intel & ARM) | ~%30-38 |
| CPX (paylasimli AMD) | ~%144 (CPX22: €7,99 → €19,49) |
| CCX (dedicated vCPU) | ~%169 (CCX13: €15,99 → €42,99) |

Yani "dedicated vCPU al, guvenli olsun" refleksi artik ciddi para demek.
ARM (CAX) serisi fiyat/performans acisindan bariz kazanan.

### Guncel fiyatlar (Almanya/Finlandiya, zam sonrasi)

| Makine | Ozellik | Aylik |
|---|---|---|
| CX23 | 2 vCPU, 4 GB RAM, 40 GB SSD | €3,99 |
| CX33 | 4 vCPU, 8 GB RAM, 80 GB SSD | €6,49 |
| CAX21 | 4 vCPU (ARM), 8 GB RAM, 80 GB SSD | €7,99 |
| CAX31 | 8 vCPU (ARM), 16 GB RAM, 160 GB SSD | €15,99 |
| CCX13 | 2 dedicated cekirdek, 8 GB RAM | €42,99 |

IPv4 adresi ayrica €0,50/ay. Trafik 20 TB'a kadar dahil.

### Duzgun bir kurulumun toplam faturasi

Tek sunucuya her seyi yigmak uretim icin yeterli degil. Gercekci sepet:

| Kalem | Aylik |
|---|---|
| Uygulama + Supabase stack (CAX31, 16 GB) | €15,99 |
| Yedekleme depolamasi (Storage Box / S3 uyumlu) | ~€4 |
| Staging/test sunucusu (CX33) | €6,49 |
| IPv4 (2 adet) | €1 |
| **Toplam** | **~€27 (≈ $30)** |

**Sonuc: Supabase Pro $25. Kendi sunucun ~$30. Para acisindan fark yok — ustelik
kendi emegin henuz hesaba katilmadi.**

## 3. Kirilma noktasi nerede?

Self-hosting'in kazandigi yer *trafik ve olcek*, taban fiyat degil:

| Senaryo | Supabase | Hetzner |
|---|---|---|
| 250 GB egress | $25 | €16 |
| 1 TB egress | $25 + (750 × $0.09) = **$92** | €16 (20 TB dahil) |
| 5 TB egress | $25 + (4750 × $0.09) = **$452** | €16 |
| 100 GB veritabani | $25 + (92 × $0.125) = **$36** | Diskte zaten var |

Egress bir kez TB'lara ciktiginda makas hizla aciliyor. Ama bu, gercek ve
buyuk bir kullanici kitlesi demek — henuz orada degiliz.

## 4. Artilari

- **Yuksek olcekte cok daha ucuz.** Ozellikle egress ve depolama agirlikli isler
  (video, gorsel, dosya paylasimi) icin fark 10 kata cikabiliyor.
- **Vendor lock-in yok.** Supabase acik kaynak; ayni Postgres, ayni istemci
  kutuphaneleri. Yonetilenden kendi sunucuna gecis gercekten mumkun.
- **Veri egemenligi.** KVKK veya sozlesme geregi verinin Turkiye'de ya da belirli
  bir yerde durmasi gerekiyorsa tek secenek bu.
- **Sinirsiz mudahale.** Istedigin Postgres eklentisi, istedigin config, istedigin
  cron. Yonetilen planda dokunamadigin ayarlar burada senin.
- **Ongorulebilir fatura.** Surpriz limit asimi yok; sabit ucret.

## 5. Eksileri

- **Dusuk olcekte daha pahali.** Yukaridaki tabloda goruldugu gibi — ve bu, emek
  maliyeti *haric*.
- **Asil maliyet zaman.** Ilk kurulum 2-5 gun. Sonrasinda: guvenlik yamalari,
  Postgres surum yukseltmeleri, yedekten donus tatbikati, gece 3'te alarm.
  Ayda 10 saat bakim bile $25'lik plandan kat kat pahaliya geliyor.
- **Ozellik eksigi.** Self-hosted surumde su anda olmayan/kendin kurman
  gerekenler: otomatik yedek ve zaman noktasina donus (PITR), read replica,
  branching, Log Explorer, panelin bazi bolumleri, SSO/SAML.
- **Tek arıza noktasi.** Tek sunucu duserse her sey duser. Yuksek erisilebilirlik
  istersen maliyet en az 3 katina cikar (birden fazla sunucu + yuk dengeleyici +
  Postgres replikasyonu).
- **Guvenlik tamamen sende.** Postgres'i disariya acmamak, JWT gizli anahtar
  yonetimi, RLS politikalarini dogru kurmak, guvenlik duvari, yama takibi.
- **Yukseltmeler kirilgan.** Self-hosted Supabase surum gecisleri elle mudahale
  isteyebiliyor; kirilirsa cozecek olan sensin.
- **SOC2 / uyumluluk belgesi yok.** Kurumsal musteri isteyecekse sorun.

## 6. Oneri

1. **Simdi:** Supabase Free. Maliyet sifir, fikri denemek icin fazlasiyla yeterli.
2. **Ilk gercek kullanicilar geldiginde:** Supabase Pro ($25). Free plandaki
   "1 hafta hareketsizlikte duraklatma" gercek kullanicilarla kabul edilemez.
3. **Su uc kosuldan biri olusursa self-hosting'i degerlendir:**
   - Aylik Supabase faturasi $300-500'u asiyorsa,
   - Egress aylik 1 TB'i geciyorsa,
   - Yasal olarak veriyi belirli bir ulkede tutmak zorundaysan.
4. **Ara yol:** Hepsini birden tasima. Once sadece Postgres'i kendi sunucuna al,
   Auth ve Storage yonetilen kalsin. Ya da Coolify / Dokploy gibi bir arac ile
   isletme yukunu azalt.

**Onemli:** Supabase acik kaynak oldugu ve ayni istemci SDK'sini kullandigin icin
"sonra tasiyamam" korkusu gecersiz. Erken self-hosting'i hakli cikaracak en guclu
gerekce olan lock-in riski burada dusuk. Bu yuzden karari ertelemek bedava.

---

## Kaynaklar

- [Hetzner Price Adjustment 15 June 2026 (resmi)](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
- [Hetzner cloud server price increases in 2026 — Northflank](https://northflank.com/blog/hetzner-cloud-server-price-increases)
- [Hetzner's Second Price Hike of 2026 — bex.co](https://bex.co/blog/2026/08/21/hetzner-second-price-hike-ccx-cpx-113-percent-fleet-economics)
- [Hetzner Cloud Pricing After the Increase — bitdoze](https://www.bitdoze.com/hetzner-cloud-cost-optimized-plans/)
- [Supabase Pricing 2026: Plans, Overage Rates — Flexprice](https://flexprice.io/blog/supabase-pricing-breakdown)
- [Supabase Pricing Page and Costs Explained — SchematicHQ](https://schematichq.com/blog/supabase-pricing)
- [Supabase vs AWS Pricing — Bytebase](https://www.bytebase.com/blog/supabase-vs-aws-database-pricing/)
- [Self-Hosting with Docker — Supabase Docs](https://supabase.com/docs/guides/self-hosting/docker)
- [Docker Container Resource Tuning for Self-Hosted Supabase](https://www.supascale.app/blog/docker-container-resource-tuning-for-selfhosted-supabase)
