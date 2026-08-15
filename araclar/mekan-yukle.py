"""Tek seferlik OSM -> mekanlar tablosu yukleme betigi.

Kullanim:
    python araclar/mekan-yukle.py turkey-latest.osm.pbf

Once https://download.geofabrik.de/europe/turkey.html adresinden
'turkey-latest.osm.pbf' dosyasini indir, sonra bu betigi calistir.
"""

import os
import sys

import osmium
from supabase import create_client

ILGILI_ETIKETLER = {
    "amenity": {"cafe", "bar", "restaurant", "pub", "fast_food"},
    "leisure": {"park"},
}

TUR_ESLEME = {
    "cafe": "kafe",
    "bar": "bar",
    "restaurant": "restoran",
    "pub": "bar",
    "fast_food": "restoran",
    "park": "park",
}


class MekanIsleyici(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.mekanlar = []

    def _uygun_mu(self, etiketler):
        for anahtar, degerler in ILGILI_ETIKETLER.items():
            if etiketler.get(anahtar) in degerler:
                return etiketler.get(anahtar)
        return None

    def node(self, n):
        deger = self._uygun_mu(n.tags)
        if deger is None or "name" not in n.tags:
            return
        self.mekanlar.append(
            {
                "ad": n.tags["name"],
                "tur": TUR_ESLEME[deger],
                "konum_lat": n.location.lat,
                "konum_lng": n.location.lon,
                "adres": n.tags.get("addr:full"),
                "osm_id": n.id,
            }
        )


def toplu_yaz(supabase, mekanlar, parca_boyutu=500):
    for i in range(0, len(mekanlar), parca_boyutu):
        parca = mekanlar[i : i + parca_boyutu]
        satirlar = [
            {
                "ad": m["ad"],
                "tur": m["tur"],
                "konum": f"POINT({m['konum_lng']} {m['konum_lat']})",
                "adres": m["adres"],
                "osm_id": m["osm_id"],
            }
            for m in parca
        ]
        supabase.table("mekanlar").insert(satirlar).execute()
        print(f"{i + len(parca)}/{len(mekanlar)} yazildi")


def main():
    if len(sys.argv) != 2:
        print("Kullanim: python araclar/mekan-yukle.py <dosya.osm.pbf>")
        sys.exit(1)

    isleyici = MekanIsleyici()
    isleyici.apply_file(sys.argv[1])
    print(f"{len(isleyici.mekanlar)} mekan bulundu")

    supabase = create_client(
        os.environ["EXPO_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
    toplu_yaz(supabase, isleyici.mekanlar)


if __name__ == "__main__":
    main()
