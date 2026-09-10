# supabase — arka uc

VPN uygulamasinin arka ucu. Trafik buradan **gecmez**; burada yalnizca giris,
abonelik, sunucu listesi ve WireGuard anahtar dagitimi vardir.

## Icerik

| Yol | Ne yapar |
|---|---|
| `migrations/20260910120000_sema.sql` | `profiles`, `subscriptions`, `servers`, `peers` tablolari + yardimci fonksiyonlar |
| `migrations/20260910120100_rls.sql` | Row Level Security kurallari |
| `functions/issue-config/` | Kullaniciya WireGuard yapilandirmasi ureten Edge Function |
| `seed.sql` | Yerel gelistirme icin ornek sunucu kayitlari |

## Kurulum

Bu depoda **hicbir sey uzak projeye uygulanmadi**. Supabase projesi acildiktan
sonra:

```bash
cd vpn/supabase

supabase link --project-ref <PROJE_REF>
supabase db push                    # migration'lari uygular
supabase functions deploy issue-config
```

Sunucu kayitlarini elle ekle (VPS kurulduktan sonra `kur.sh` ciktisindaki
gercek degerlerle):

```sql
insert into public.servers (ulke, ulke_kodu, ad, endpoint, port, public_key, alt_ag)
values ('Almanya', 'DE', 'Frankfurt 1', '<VPS_IP>', 51820, '<SUNUCU_ACIK_ANAHTARI>', '10.66.66.0/24');
```

Test icin kendine abonelik ac:

```sql
insert into public.subscriptions (kullanici_id, durum, plan, bitis)
values ('<KULLANICI_UUID>', 'aktif', 'aylik', now() + interval '1 year');
```

## Guvenlik modeli

- **`servers`** herkese acik degil. Yalnizca aboneligi gecerli kullanici
  okuyabilir; boylece sunucu IP'leri rastgele kisilere dagilmaz.
- **`subscriptions`** istemciden yazilamaz. Sadece okunur. Yazma islemi
  ileride odeme saglayicisinin webhook'una (service_role) birakilacak.
- **`peers`** istemciden yazilamaz; yalnizca `issue-config` fonksiyonu acar.
  Kullanici kendi kaydini gorebilir ve silebilir.
- Istemcinin **ozel anahtari sunucuya hic gonderilmez**. Cihaz anahtar
  ciftini kendisi uretir; buraya yalnizca acik anahtar gelir.
- Sunucunun **ozel anahtari** Supabase'de tutulmaz; yalnizca VPS uzerinde
  `/etc/wireguard/` altinda durur.

## Sirada ne var

- Odeme entegrasyonu (Google Play Billing) ve `subscriptions` yazan webhook.
- `peers.son_gorulme` alanini VPS'ten guncelleyen bir is (kullanim takibi).
- Cihaz basina limit (su an bir kullanici sinirsiz cihaz kaydedebilir).
