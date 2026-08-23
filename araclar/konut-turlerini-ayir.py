"""Konut turlerini alt turlere ayirir: Site / Apartman / Villa / Konak / Rezidans.

Neden ayri bir betik: 878 bin satirlik tabloda `tur` uzerinde indeks
yok ve regex'li toplu UPDATE tek seferde zaman asimina ugruyor.
Burada is PARCALARA bolunuyor (her turda 400'luk gruplar), boylece her
sorgu kisa suruyor.

SIRA ONEMLI - ozelden genele:
  villa -> rezidans -> konak -> apartman/blok
Kalanlar (Sitesi / Konutlari / Evleri / TOKI) 'Site' olarak kaliyor.
Ornek: "Yavuzhan Konakları Sitesi" hem konak hem site kalibi tasiyor;
sira yanlis olursa yanlis ture duser.
"""

import os
import sys
import time

from supabase import create_client

KURALLAR = [
    ('Villa',    r'(^|[[:space:]])villa'),
    ('Rezidans', r'(^|[[:space:]])(rezidans|residence)([[:space:]]|$)'),
    ('Konak',    r'(^|[[:space:]])konaklar[ıi]([[:space:]]|$)'),
    ('Apartman', r'(^|[[:space:]])(apartman[ıi]?|apt\.?|blo[kğ]lar[ıi])([[:space:]]|$)'),
]

PARCA = 400


def main():
    supabase = create_client(
        os.environ['EXPO_PUBLIC_SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    )

    for hedef, desen in KURALLAR:
        toplam = 0
        print(f'\n{hedef} ayristiriliyor...', flush=True)
        while True:
            # Kaynak tur her zaman 'Site': bu betik yalnizca daha once
            # 'Site' olarak isaretlenmis konut kayitlarini bolumluyor.
            sonuc = supabase.rpc('konut_turu_parca_guncelle', {
                'p_desen': desen,
                'p_hedef': hedef,
                'p_limit': PARCA,
            }).execute()
            adet = sonuc.data or 0
            toplam += adet
            if adet:
                print(f'  {toplam}', flush=True)
            if adet < PARCA:
                break
            time.sleep(0.1)
        print(f'{hedef}: {toplam} kayit')


if __name__ == '__main__':
    sys.exit(main())
