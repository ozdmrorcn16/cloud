"""OSM'den turetilen mahalle/ilce bilgisini `mahalle_hazirlik` tablosuna yukler.

Kullanim (mobil/.env yuklu kabuk):
    python araclar/mahalle-yukle.py                 # tamami
    MH_BASLANGIC=0 MH_BITIS=2000000 python ...      # paralel dilim

Neden hazirlik tablosu: dogrudan `mekanlar` uzerine upsert etmek zorunlu
alanlarin (ad, tur, konum) da her satirda gonderilmesini gerektiriyor -
gereksiz yere agir. Buraya yalnizca uc alan yaziliyor, sonra sunucuda
tek UPDATE ile isleniyor.
"""
import os
import sys
import time

BURASI = os.path.dirname(os.path.abspath(__file__))
PARQUET = os.environ.get('MH_PARQUET') or os.path.join(BURASI, 'fsq-tr-mahalle-son.parquet')
PARCA = 1000


def main() -> None:
    import duckdb
    from supabase import create_client

    supabase = create_client(
        os.environ['EXPO_PUBLIC_SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    )
    con = duckdb.connect()
    toplam = con.execute(f"SELECT count(*) FROM read_parquet('{PARQUET}')").fetchone()[0]
    baslangic = int(os.environ.get('MH_BASLANGIC', '0'))
    bitis = min(int(os.environ.get('MH_BITIS', str(toplam))), toplam)

    ham = con.execute(
        f"SELECT fsq_place_id, mahalle, ilce FROM read_parquet('{PARQUET}') "
        f"ORDER BY fsq_place_id LIMIT {bitis - baslangic} OFFSET {baslangic}"
    ).fetchall()
    satirlar = [{'fsq_place_id': p, 'mahalle': m, 'ilce': i} for p, m, i in ham]
    print(f'{len(satirlar):,} satir ({baslangic:,}-{bitis:,})', flush=True)

    t0 = time.time()
    for i in range(0, len(satirlar), PARCA):
        parca = satirlar[i:i + PARCA]
        for deneme in range(12):
            try:
                supabase.table('mahalle_hazirlik').upsert(
                    parca, on_conflict='fsq_place_id'
                ).execute()
                break
            except Exception as e:
                if deneme == 11:
                    raise
                print(f'   {baslangic + i}: hata, yeniden ({str(e)[:70]})', flush=True)
                time.sleep(min(60, 5 * (deneme + 1)))
        if (i // PARCA) % 100 == 0 or i + PARCA >= len(satirlar):
            print(f'{baslangic + min(i + PARCA, len(satirlar)):,}/{bitis:,}'
                  f'  ({time.time() - t0:.0f} sn)', flush=True)
    print('Bitti.', flush=True)


if __name__ == '__main__':
    sys.exit(main())
