#!/usr/bin/env bash
#
# esitle.sh — Supabase'deki `peers` tablosunu VPS'teki WireGuard'a uygular.
#
# issue-config Edge Function'i yeni bir cihaz kaydi actiginda yalnizca
# veritabanina yazar. Bu betik o kayitlari okuyup `wg set` ile sunucuya
# isler. Cron ile dakikada bir calistirilmasi beklenir:
#
#   * * * * * /root/vpn-sunucu/esitle.sh >> /var/log/vpn-esitle.log 2>&1
#
# Gerekli ortam degiskenleri (/etc/vpn-esitle.env icine yaz, chmod 600):
#   SUPABASE_URL       https://<ref>.supabase.co
#   SUPABASE_SERVICE_KEY  service_role anahtari  <- gizli, sunucudan cikmasin
#   SUNUCU_ID          bu VPS'in servers tablosundaki uuid'si

set -euo pipefail

AYAR_DOSYASI="${AYAR_DOSYASI:-/etc/vpn-esitle.env}"
WG_ARAYUZ="${WG_ARAYUZ:-wg0}"

hata() { printf '\033[1;31mHATA:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || hata "root olarak calistir."
# shellcheck source=/dev/null
[ -f "$AYAR_DOSYASI" ] && . "$AYAR_DOSYASI"

: "${SUPABASE_URL:?SUPABASE_URL tanimli degil}"
: "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY tanimli degil}"
: "${SUNUCU_ID:?SUNUCU_ID tanimli degil}"

YANIT="$(curl -s --max-time 20 --fail-with-body \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  "${SUPABASE_URL}/rest/v1/peers?select=public_key,tunel_ip&sunucu_id=eq.${SUNUCU_ID}&aktif=eq.true")" \
  || hata "Supabase'e ulasilamadi: ${YANIT:-<bos>}"

# Veritabanindaki peer'lar
mapfile -t ISTENEN < <(printf '%s' "$YANIT" | jq -r '.[] | "\(.public_key) \(.tunel_ip)"')

# Su an sunucuda tanimli olanlar
mapfile -t MEVCUT < <(wg show "$WG_ARAYUZ" peers)

declare -A ISTENEN_ANAHTARLAR=()

for satir in "${ISTENEN[@]}"; do
  [ -n "$satir" ] || continue
  anahtar="${satir%% *}"
  ip="${satir##* }"
  ip="${ip%/*}"
  ISTENEN_ANAHTARLAR["$anahtar"]=1
  wg set "$WG_ARAYUZ" peer "$anahtar" allowed-ips "${ip}/32"
done

# Veritabaninda olmayanlari kaldir (aboneligi biten cihazlar)
for anahtar in "${MEVCUT[@]}"; do
  [ -n "$anahtar" ] || continue
  if [ -z "${ISTENEN_ANAHTARLAR[$anahtar]:-}" ]; then
    wg set "$WG_ARAYUZ" peer "$anahtar" remove
    echo "$(date -Is) kaldirildi: ${anahtar}"
  fi
done

# Yeniden baslatmada kaybolmasin diye diske yaz.
# (wg-quick save, PostUp/PostDown satirlarini korur.)
wg-quick save "$WG_ARAYUZ"

echo "$(date -Is) esitlendi: ${#ISTENEN[@]} peer"
