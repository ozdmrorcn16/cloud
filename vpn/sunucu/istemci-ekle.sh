#!/usr/bin/env bash
#
# istemci-ekle.sh — WireGuard sunucusuna yeni bir istemci (peer) ekler.
#
# Iki kullanim var:
#
#   1) Cihaz kendi anahtarini uretmisse (uygulamanin normal akisi):
#        bash istemci-ekle.sh <acik-anahtar> [tunel-ip]
#
#   2) Test icin anahtari sunucuda uret (dosya + QR kodu verir):
#        bash istemci-ekle.sh --yeni <ad>
#
#   tunel-ip verilmezse alt agdaki ilk bos adres secilir.
#
# NOT: 2. yontemde ozel anahtar sunucuda uretilir. Gercek kullanicilar icin
# bunu kullanma; uygulama anahtari cihazda uretir ve ozel anahtar cihazdan
# hic cikmaz. Bu yol yalnizca kendi testin icin.

set -euo pipefail

WG_ARAYUZ="${WG_ARAYUZ:-wg0}"
WG_DIZIN="/etc/wireguard"
WG_YAPILANDIRMA="${WG_DIZIN}/${WG_ARAYUZ}.conf"
WG_DNS="${WG_DNS:-1.1.1.1}"

bilgi() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
hata()  { printf '\033[1;31mHATA:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || hata "root olarak calistir (sudo bash istemci-ekle.sh ...)."
[ -f "$WG_YAPILANDIRMA" ] || hata "${WG_YAPILANDIRMA} yok. Once kur.sh calistir."

ANAHTAR_DESENI='^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw]=$'

# Sunucunun kendi adresi ve alt agi
SUNUCU_ADRES="$(awk -F'= *' '/^Address/ {print $2; exit}' "$WG_YAPILANDIRMA")"
[ -n "$SUNUCU_ADRES" ] || hata "Yapilandirmada Address satiri bulunamadi."
SUNUCU_PORT="$(awk -F'= *' '/^ListenPort/ {print $2; exit}' "$WG_YAPILANDIRMA")"
SUNUCU_ACIK="$(cat "${WG_DIZIN}/acik.key")"

# Alt agdaki ilk bos adresi bul (.1 sunucunun kendisi)
bos_ip_bul() {
  python3 - "$SUNUCU_ADRES" "$WG_YAPILANDIRMA" <<'PY'
import ipaddress, re, sys

adres, yol = sys.argv[1], sys.argv[2]
ag = ipaddress.ip_interface(adres).network
kullanilan = {ipaddress.ip_interface(adres).ip}

with open(yol) as f:
    for satir in f:
        e = re.match(r'\s*AllowedIPs\s*=\s*(.+)', satir)
        if e:
            for parca in e.group(1).split(','):
                parca = parca.strip()
                if not parca:
                    continue
                try:
                    kullanilan.add(ipaddress.ip_interface(parca).ip)
                except ValueError:
                    pass

for ip in ag.hosts():
    if ip not in kullanilan:
        print(ip)
        sys.exit(0)

sys.exit("Alt agda bos adres kalmadi.")
PY
}

peer_yaz() {
  local acik="$1" ip="$2" etiket="$3"

  if grep -qF "$acik" "$WG_YAPILANDIRMA"; then
    hata "Bu acik anahtar zaten kayitli."
  fi

  cat >> "$WG_YAPILANDIRMA" <<EOF

# ${etiket} — eklendi $(date -Iseconds)
[Peer]
PublicKey = ${acik}
AllowedIPs = ${ip}/32
EOF

  # Calisan arayuze de uygula (yeniden baslatmadan)
  wg set "$WG_ARAYUZ" peer "$acik" allowed-ips "${ip}/32"
  bilgi "Peer eklendi: ${etiket} -> ${ip}/32"
}

case "${1:-}" in
  --yeni)
    AD="${2:-istemci}"
    umask 077
    ISTEMCI_OZEL="$(wg genkey)"
    ISTEMCI_ACIK="$(printf '%s' "$ISTEMCI_OZEL" | wg pubkey)"
    IP="$(bos_ip_bul)"

    peer_yaz "$ISTEMCI_ACIK" "$IP" "$AD"

    # Endpoint icin dis IP
    DIS_IP="$(curl -4 -s --max-time 10 https://ifconfig.me || echo '<VPS_IP>')"
    CIKTI="${WG_DIZIN}/istemciler/${AD}.conf"
    install -d -m 700 "${WG_DIZIN}/istemciler"

    cat > "$CIKTI" <<EOF
[Interface]
PrivateKey = ${ISTEMCI_OZEL}
Address = ${IP}/32
DNS = ${WG_DNS}

[Peer]
PublicKey = ${SUNUCU_ACIK}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${DIS_IP}:${SUNUCU_PORT}
PersistentKeepalive = 25
EOF
    chmod 600 "$CIKTI"

    bilgi "Yapilandirma: ${CIKTI}"
    if command -v qrencode >/dev/null 2>&1; then
      echo
      qrencode -t ansiutf8 < "$CIKTI"
    fi
    ;;

  "" | -h | --help)
    sed -n '2,20p' "$0"
    exit 0
    ;;

  *)
    ACIK="$1"
    [[ "$ACIK" =~ $ANAHTAR_DESENI ]] || hata "Gecerli bir WireGuard acik anahtari degil: ${ACIK}"
    IP="${2:-$(bos_ip_bul)}"
    IP="${IP%/*}"
    peer_yaz "$ACIK" "$IP" "manuel"
    ;;
esac
