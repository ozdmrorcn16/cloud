# sunucu — VPS uzerindeki WireGuard

Trafigin gercekten gectigi yer burasi. Yurt disinda (Almanya/Hollanda)
kiralanan bir VPS'e kurulur.

| Betik | Ne yapar |
|---|---|
| `kur.sh` | WireGuard'i kurar, sunucu anahtarini uretir, NAT ve IP yonlendirmeyi acar, servisi baslatir. |
| `istemci-ekle.sh` | Tek bir istemciyi elle ekler. Test icin anahtar da uretebilir (`--yeni`). |
| `esitle.sh` | Supabase'deki `peers` tablosunu okuyup sunucuya uygular. Cron ile calisir. |

## Kurulum

```bash
# Yerelden VPS'e kopyala
scp -r vpn/sunucu root@SUNUCU_IP:/root/vpn-sunucu

# VPS'te
ssh root@SUNUCU_IP
bash /root/vpn-sunucu/kur.sh
```

`kur.sh` sonunda sunucunun **acik anahtarini** ve Supabase'e eklenecek SQL
satirini basar. O satiri `servers` tablosuna ekle.

Betik yeniden calistirilabilir: mevcut anahtarlarin ve `[Peer]` bloklarinin
uzerine yazmaz, eski yapilandirmayi yedekler.

## Otomatik esitleme

Uygulama yeni bir cihaz kaydettiginde Edge Function yalnizca veritabanina
yazar. `esitle.sh` bunu sunucuya isler.

```bash
# 1) Ayarlari yaz
cat > /etc/vpn-esitle.env <<'ENV'
SUPABASE_URL=https://<PROJE_REF>.supabase.co
SUPABASE_SERVICE_KEY=<service_role anahtari>
SUNUCU_ID=<servers tablosundaki uuid>
ENV
chmod 600 /etc/vpn-esitle.env

# 2) Dakikada bir calistir
crontab -l 2>/dev/null | { cat; echo '* * * * * /root/vpn-sunucu/esitle.sh >> /var/log/vpn-esitle.log 2>&1'; } | crontab -
```

`esitle.sh` iki yonlu calisir: veritabaninda olan cihazlari ekler, veritabaninda
olmayanlari (aboneligi biten cihazlar) sunucudan **kaldirir**.

> `service_role` anahtari veritabaninin tamamina yazma yetkisi verir.
> Yalnizca VPS'te, `chmod 600` bir dosyada dursun; uygulamaya veya depoya
> asla girmesin.

## Isleyip islemedigini kontrol

```bash
wg show wg0                 # el sikismalar ve aktarilan bayt
systemctl status wg-quick@wg0
journalctl -u wg-quick@wg0 -n 50
tail -f /var/log/vpn-esitle.log
```

Baglandi ama internet yoksa sirasiyla bak:

1. `sysctl net.ipv4.ip_forward` -> `1` olmali
2. `iptables -t nat -L POSTROUTING -n -v` -> MASQUERADE kurali gorunmeli
3. VPS saglayicisinin kendi guvenlik duvarinda UDP 51820 acik mi

## VPS secimi

Aylik ~5$ bandinda ve WireGuard'a uygun saglayicilar: Hetzner (Almanya/Finlandiya),
Netcup, Contabo, DigitalOcean, Vultr. Turkiye'den erisim engellenirse ayni
sunucuya ikinci bir IP tanimlamak veya baska bir saglayicida yedek sunucu
acmak en pratik cozum — uygulama sunucu listesini Supabase'den cektigi icin
yeni adres eklemek yalnizca bir SQL satiri.

> Cogu saglayicinin kullanim sartlari VPN kurmaya izin verir, ama trafigi
> baskalarina **satmak** genellikle ayri bir izne tabidir. Magazaya ucretli
> cikmadan once saglayicinin sartlarini oku.
