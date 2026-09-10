#!/usr/bin/env bash
#
# kur.sh — bir Debian/Ubuntu VPS'e WireGuard sunucusu kurar.
#
# Kullanim (VPS'te root olarak):
#   bash kur.sh
#
# Ayarlar (ortam degiskeniyle degistirilebilir):
#   WG_ARAYUZ   tunel arayuz adi          (varsayilan: wg0)
#   WG_PORT     dinlenen UDP portu        (varsayilan: 51820)
#   WG_ALT_AG   tunel ic agi              (varsayilan: 10.66.66.0/24)
#   WG_DIS      internete cikan arayuz    (varsayilan: otomatik bulunur)
#
# Betik yeniden calistirilabilir: mevcut anahtarlarin uzerine YAZMAZ.

set -euo pipefail

WG_ARAYUZ="${WG_ARAYUZ:-wg0}"
WG_PORT="${WG_PORT:-51820}"
WG_ALT_AG="${WG_ALT_AG:-10.66.66.0/24}"
WG_DIZIN="/etc/wireguard"
WG_YAPILANDIRMA="${WG_DIZIN}/${WG_ARAYUZ}.conf"

# Tunelin ic adresi: alt agin ilk adresi (10.66.66.1/24)
WG_SUNUCU_IP="$(python3 - "$WG_ALT_AG" <<'PY'
import ipaddress, sys
ag = ipaddress.ip_network(sys.argv[1], strict=False)
print(f"{ag.network_address + 1}/{ag.prefixlen}")
PY
)"

bilgi() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
uyari() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
hata()  { printf '\033[1;31mHATA:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || hata "Bu betik root olarak calistirilmali (sudo bash kur.sh)."

# --- 1) Paketler ------------------------------------------------------------

bilgi "Paketler kuruluyor (wireguard, iptables, qrencode)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq wireguard wireguard-tools iptables qrencode curl jq python3

# --- 2) Disa cikan arayuz ---------------------------------------------------

if [ -z "${WG_DIS:-}" ]; then
  WG_DIS="$(ip -4 route show default | awk '/default/ {print $5; exit}')"
fi
[ -n "$WG_DIS" ] || hata "Internete cikan arayuz bulunamadi. WG_DIS=eth0 gibi elle ver."
bilgi "Disa cikan arayuz: ${WG_DIS}"

# --- 3) IP yonlendirme ------------------------------------------------------

bilgi "IP yonlendirme aciliyor"
cat > /etc/sysctl.d/99-wireguard.conf <<'EOF'
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
EOF
sysctl -q --system

# --- 4) Sunucu anahtari -----------------------------------------------------

install -d -m 700 "$WG_DIZIN"

if [ -f "${WG_DIZIN}/ozel.key" ]; then
  bilgi "Mevcut sunucu anahtari kullaniliyor (uzerine yazilmiyor)"
else
  bilgi "Sunucu anahtar cifti uretiliyor"
  umask 077
  wg genkey > "${WG_DIZIN}/ozel.key"
  wg pubkey < "${WG_DIZIN}/ozel.key" > "${WG_DIZIN}/acik.key"
fi
chmod 600 "${WG_DIZIN}/ozel.key"

SUNUCU_OZEL="$(cat "${WG_DIZIN}/ozel.key")"
SUNUCU_ACIK="$(cat "${WG_DIZIN}/acik.key")"

# --- 5) Yapilandirma --------------------------------------------------------

if [ -f "$WG_YAPILANDIRMA" ]; then
  YEDEK="${WG_YAPILANDIRMA}.yedek.$(date +%Y%m%d%H%M%S)"
  uyari "${WG_YAPILANDIRMA} zaten var; ${YEDEK} olarak yedeklendi."
  uyari "Mevcut [Peer] bloklari korunuyor, yalnizca [Interface] yenileniyor."
  cp "$WG_YAPILANDIRMA" "$YEDEK"
  # Ilk [Peer] satirindan sonrasini sakla
  awk '/^\[Peer\]/{bul=1} bul' "$YEDEK" > /tmp/wg-peers.$$
else
  : > /tmp/wg-peers.$$
fi

bilgi "${WG_YAPILANDIRMA} yaziliyor"
umask 077
cat > "$WG_YAPILANDIRMA" <<EOF
# vpn — ${WG_ARAYUZ}
# Bu dosyanin [Interface] blogu kur.sh tarafindan uretildi.
# [Peer] bloklarini istemci-ekle.sh veya esitle.sh yonetir.

[Interface]
Address = ${WG_SUNUCU_IP}
ListenPort = ${WG_PORT}
PrivateKey = ${SUNUCU_OZEL}

# NAT: tunelden gelen trafigi disa cikan arayuzden maskele.
PostUp   = iptables -t nat -A POSTROUTING -s ${WG_ALT_AG} -o ${WG_DIS} -j MASQUERADE
PostUp   = iptables -A FORWARD -i ${WG_ARAYUZ} -j ACCEPT
PostUp   = iptables -A FORWARD -o ${WG_ARAYUZ} -m state --state RELATED,ESTABLISHED -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -s ${WG_ALT_AG} -o ${WG_DIS} -j MASQUERADE
PostDown = iptables -D FORWARD -i ${WG_ARAYUZ} -j ACCEPT
PostDown = iptables -D FORWARD -o ${WG_ARAYUZ} -m state --state RELATED,ESTABLISHED -j ACCEPT
EOF

if [ -s /tmp/wg-peers.$$ ]; then
  printf '\n' >> "$WG_YAPILANDIRMA"
  cat /tmp/wg-peers.$$ >> "$WG_YAPILANDIRMA"
fi
rm -f /tmp/wg-peers.$$
chmod 600 "$WG_YAPILANDIRMA"

# --- 6) Guvenlik duvari -----------------------------------------------------

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  bilgi "ufw kurallari ekleniyor"
  ufw allow "${WG_PORT}/udp" >/dev/null
  ufw route allow in on "${WG_ARAYUZ}" out on "${WG_DIS}" >/dev/null || true
fi

# --- 7) Servisi baslat ------------------------------------------------------

bilgi "Servis baslatiliyor"
systemctl enable "wg-quick@${WG_ARAYUZ}" >/dev/null 2>&1
if systemctl is-active --quiet "wg-quick@${WG_ARAYUZ}"; then
  systemctl restart "wg-quick@${WG_ARAYUZ}"
else
  systemctl start "wg-quick@${WG_ARAYUZ}"
fi

# --- 8) Ozet ----------------------------------------------------------------

DIS_IP="$(curl -4 -s --max-time 10 https://ifconfig.me || echo '<VPS_IP>')"

cat <<EOF

  Kurulum tamam.

  Supabase'deki 'servers' tablosuna su satiri ekle:

    insert into public.servers (ulke, ulke_kodu, ad, endpoint, port, public_key, alt_ag)
    values ('Almanya', 'DE', 'Frankfurt 1',
            '${DIS_IP}', ${WG_PORT},
            '${SUNUCU_ACIK}',
            '${WG_ALT_AG}');

  Sunucunun ACIK anahtari : ${SUNUCU_ACIK}
  Ozel anahtar            : ${WG_DIZIN}/ozel.key  (buradan CIKMASIN)

  Durum        : wg show ${WG_ARAYUZ}
  Istemci ekle : bash istemci-ekle.sh <acik-anahtar> <tunel-ip>
  Esitle       : bash esitle.sh        (Supabase'deki peers tablosunu uygular)

EOF
