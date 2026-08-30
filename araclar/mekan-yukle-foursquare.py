"""Foursquare OS Places -> `mekanlar` (Overture ile BIRLESTIRME).

Kullanicinin karari (2026-08-30): iki kaynak birlesir, "en dogru veri"
olusur. Adimlar:

  1. `araclar/fsq-indir.py` ile uretilen `fsq-tr.parquet` okunur.
  2. Kategori Turkce ture cevrilir (`fsq-kategori-eslemesi.py`).
  3. Satirlar `fsq_hazirlik` HAZIRLIK tablosuna upsert edilir
     (PostgREST, 1.000'lik paketler; anahtar fsq_place_id).
  4. Birlestirme SUNUCUDA, SQL ile yapilir (bkz. birlestir()):
       - 60 m icinde ve ad benzerligi yeterli bir Overture kaydi varsa
         o kayda yalnizca fsq_place_id islenir (TEK kayit kalir);
       - yoksa `kaynak = 'foursquare'` ile yeni satir eklenir.
  5. Hazirlik tablosu bosaltilir (dusurulmez; aylik tazeleme icin).

Kullanim (mobil/.env yuklu kabuk):
  python araclar/mekan-yukle-foursquare.py yukle       # 3. adim
  node   araclar/fsq-birlestir.mjs                     # 4. adim (dilim dilim RPC)

Gerekli cevre degiskenleri: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
"""
import os
import sys
import time
import importlib.util

BURASI = os.path.dirname(os.path.abspath(__file__))
PARQUET = os.path.join(BURASI, 'fsq-tr.parquet')
PARCA = 1000


def _esleme():
    yol = os.path.join(BURASI, 'fsq-kategori-eslemesi.py')
    spec = importlib.util.spec_from_file_location('fsq_kategori_eslemesi', yol)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def _semt(locality: str | None, region: str | None) -> str | None:
    """Foursquare'in ilce bilgisi zayif: yarisi bos, kalani 'Bursa/bursa/
    BURSA' gibi. Il adiyla ayni olani atiyoruz (semt degil), gerisini
    bas harfleri buyuk yaziyoruz."""
    if not locality:
        return None
    l = locality.strip()
    if not l or (region and l.casefold() == region.strip().casefold()):
        return None
    return l if l != l.upper() and l != l.lower() else l.title()


def yukle() -> None:
    import duckdb
    from supabase import create_client

    supabase = create_client(
        os.environ['EXPO_PUBLIC_SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    )
    esleme = _esleme()
    con = duckdb.connect()
    toplam = con.execute(f"SELECT count(*) FROM read_parquet('{PARQUET}')").fetchone()[0]
    # Paralel kosum: FSQ_BASLANGIC / FSQ_BITIS ile satir araligi verilir,
    # birkac surec ayni anda farkli araliklari yukler. Her surec YALNIZCA
    # kendi araligini okur - dosyanin tamamini belleğe almak surec basina
    # 5 GB'a cikiyor ve makine tikaniyordu (2026-08-30'da yasandi).
    baslangic = int(os.environ.get('FSQ_BASLANGIC', '0'))
    bitis = min(int(os.environ.get('FSQ_BITIS', str(toplam))), toplam)
    ham = con.execute(
        "SELECT fsq_place_id, name, latitude, longitude, address, locality, region, "
        "fsq_category_labels[1], date_refreshed "
        f"FROM read_parquet('{PARQUET}') ORDER BY fsq_place_id "
        f"LIMIT {bitis - baslangic} OFFSET {baslangic}"
    ).fetchall()

    satirlar = []
    tur_sayac: dict[str, int] = {}
    for pid, ad, lat, lng, adres, locality, region, etiket, tazelendi in ham:
        tur = esleme.tur_bul(etiket) or 'Mekan'
        tur_sayac[tur] = tur_sayac.get(tur, 0) + 1
        satirlar.append({
            'fsq_place_id': pid,
            'ad': ad.strip(),
            'tur': tur,
            'kategori': etiket,
            'konum': f'POINT({lng} {lat})',
            'adres': adres,
            'semt': _semt(locality, region),
            'tazelendi': str(tazelendi) if tazelendi else None,
        })
    print(f'{len(satirlar):,} satir hazirlandi ({baslangic:,}-{bitis:,}); {len(tur_sayac)} tur.', flush=True)
    for tur, adet in sorted(tur_sayac.items(), key=lambda x: -x[1])[:15]:
        print(f'   {adet:>8,}  {tur}')

    t0 = time.time()
    for i in range(0, len(satirlar), PARCA):
        parca = satirlar[i:i + PARCA]
        for deneme in range(5):
            try:
                supabase.table('fsq_hazirlik').upsert(parca, on_conflict='fsq_place_id').execute()
                break
            except Exception as e:  # ag/zaman asimi: bekle, yeniden dene
                if deneme == 4:
                    raise
                print(f'   {i}: hata, yeniden deneniyor ({e})')
                time.sleep(3 * (deneme + 1))
        if (i // PARCA) % 50 == 0 or i + PARCA >= len(satirlar):
            gecen = time.time() - t0
            print(f'{baslangic + min(i + PARCA, len(satirlar)):,}/{bitis:,}  ({gecen:.0f} sn)', flush=True)
    print('Yukleme bitti.')


BIRLESTIRME_SQL = """
-- Foursquare hazirlik tablosunu mekanlar ile birlestirir.
-- Dilim dilim (lng araligi) cagrilir: her dilimde
--   1) 60 m icinde + ad benzerligi olan Overture kaydina fsq_place_id islenir
--   2) eslesmeyen Foursquare kayitlari yeni satir olur.
select public.fsq_birlestir(%s, %s);
"""


def birlestir() -> None:
    print(BIRLESTIRME_SQL)
    print('Bu adim MCP/psql ile sunucuda kosulur; betik yalnizca SQL\'i gosterir.')


if __name__ == '__main__':
    komut = sys.argv[1] if len(sys.argv) > 1 else 'yukle'
    {'yukle': yukle, 'birlestir': birlestir}[komut]()
