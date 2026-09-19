#!/bin/bash
# CIHAZ TARAMASI (2026-09-19): ana ekranlari uc telefon olcusunde cizer.
# Kullanim: once `npx expo export --platform web` ve 8080'de bir SPA
# sunucusu (README), sonra `bash araclar/cihaz-taramasi.sh <cikti-dizini>`.
# Olculer GUVENLI ALANLAR DUSULMUS etkin alan (web'de inset yok):
#   se   375x647  iPhone SE 3 (667 - 20 durum cubugu)
#   and  360x736  yaygin Android (800 - 24 durum - 40 hareket cubugu)
#   max  430x839  iPhone Pro Max (932 - 59 - 34)
# Test mekani ve kisisi canli veritabanindaki gorunurluk-test kayitlari.
# Cihaz taramasi: yol x olcu. Olculer guvenli alanlar dusulmus etkin alan:
#   se     375x647  (iPhone SE 3: 667 - 20 ust)
#   and    360x736  (yaygin Android: 800 - 24 durum - 40 hareket cubugu)
#   max    430x839  (iPhone Pro Max: 932 - 59 - 34)
cd /c/Users/orcns/projects/cloud/mobil
set -a; . ./.env; set +a
export SLOOIN_TEST_EPOSTA=test0@slooin.test SLOOIN_TEST_SIFRE=test1234 SLOOIN_TEST_SEMA=light
OUT="$1"; mkdir -p "$OUT"
MEKAN=9a0201a3-c7e1-440e-a524-5d191eae2622; KISI=1079ba5a-70ff-46f2-908b-dcbbd0b8a982
ROTALAR="/ /mekanlar /bildirimler /mesajlar /profil /profil/ayarlar /profil/hesap-yonetimi /profil/hesabi-sil /profil/duzenle /harita/$MEKAN /kullanici/$KISI /check-in/$MEKAN /sohbet/$KISI /kisiler /baglar /profil/gizlilik-ayarlari"
for olcu in "se 375 647" "and 360 736" "max 430 839"; do
  set -- $olcu; ad=$1; g=$2; y=$3
  for r in $ROTALAR; do
    dosya="$OUT/${ad}_$(echo "$r" | sed 's#^/##; s#/#_#g; s#?.*##; s#^$#ana#').png"
    SLOOIN_SAHTE_RPC=sikayet_gonder node araclar/ekran-goruntusu.mjs "$r" "$dosya" $g $y 2>&1 | tail -1
  done
done
echo TARAMA-BITTI
