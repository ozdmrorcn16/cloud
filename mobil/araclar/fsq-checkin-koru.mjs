// Check-in yapilmis Overture mekanlarini korur: Foursquare'deki karsiligini
// (60 m icinde, ad benzerligi) bulup o hazirlik satirini "islendi" yapar ve
// Overture satirina fsq_place_id isler. Boylece ayni mekan iki kez olmaz ve
// check-in'ler kaybolmaz. Sunucuda benzerlik join'i zaman asimina dustugu
// icin esleme burada, DuckDB ile yerelde yapiliyor (2026-08-30).
//
// Kullanim (mobil/ icinden, .env yuklu): node araclar/fsq-checkin-koru.mjs
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// 1) Check-in yapilmis mekanlar (service role, RLS yok)
const { data: ciler, error: e1 } = await sb.from('check_inler').select('mekan_id')
if (e1) throw e1
const idler = [...new Set(ciler.map((c) => c.mekan_id))]
const { data: mekanlar, error: e2 } = await sb.rpc('akis_mekan_konumlari', { p_kimlikler: idler }).then(
  (r) => (r.error ? { data: null, error: r.error } : r)
)
let korunan
if (e2) {
  // RPC yoksa dogrudan tablo: konum hex EWKB doner, cozumleyelim.
  const { data, error } = await sb.from('mekanlar').select('id, ad, kaynak, konum').in('id', idler)
  if (error) throw error
  const ewkb = (hex) => { const b = Buffer.from(hex, 'hex'); let o = 5; if (b.readUInt32LE(1) & 0x20000000) o += 4; return { lng: b.readDoubleLE(o), lat: b.readDoubleLE(o + 8) } }
  korunan = data.filter((m) => m.kaynak === 'overture').map((m) => ({ id: m.id, ad: m.ad, ...ewkb(m.konum) }))
} else {
  korunan = mekanlar
}
console.log('korunacak Overture mekani:', korunan.length)
writeFileSync('../araclar/_korunan.json', JSON.stringify(korunan))

// 2) DuckDB ile Foursquare karsiligi
const py = `
import duckdb, json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
k = json.load(io.open('../araclar/_korunan.json', encoding='utf-8'))
con = duckdb.connect(); con.execute("INSTALL spatial; LOAD spatial;")
con.execute("CREATE MACRO trk(s) AS lower(translate(coalesce(s,''), 'İIŞĞÜÖÇÂÎÛışğüöçâîû', 'IISGUOCAIUisguocaiu'))")
con.execute("CREATE TABLE k (id VARCHAR, ad VARCHAR, lat DOUBLE, lng DOUBLE)")
for m in k: con.execute("INSERT INTO k VALUES (?,?,?,?)", [m['id'], m['ad'], m['lat'], m['lng']])
rows = con.execute("""
  SELECT id, fsq_place_id FROM (
    SELECT k.id, f.fsq_place_id, jaro_winkler_similarity(trk(k.ad), trk(f.name)) b,
           row_number() OVER (PARTITION BY k.id ORDER BY jaro_winkler_similarity(trk(k.ad), trk(f.name)) DESC) sira
    FROM k JOIN read_parquet('../araclar/fsq-tr.parquet') f
      ON abs(f.latitude - k.lat) < 0.001 AND abs(f.longitude - k.lng) < 0.001
     AND ST_Distance_Sphere(ST_Point(k.lng, k.lat), ST_Point(f.longitude, f.latitude)) <= 60
  ) WHERE sira = 1 AND b >= 0.85
""").fetchall()
print(json.dumps(rows))
`
const out = execFileSync('python', ['-c', py], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
const esler = JSON.parse(out.trim().split('\n').pop())
console.log('Foursquare karsiligi bulunan:', esler.length)

// 3) Sunucuya isle
for (const [mekanId, fsqId] of esler) {
  const { error: a } = await sb.from('mekanlar').update({ fsq_place_id: fsqId }).eq('id', mekanId)
  if (a) throw a
  const { error: b } = await sb.from('fsq_hazirlik').update({ islendi: true }).eq('fsq_place_id', fsqId)
  if (b) throw b
  console.log('  ', mekanId, '<-', fsqId)
}
console.log('bitti')
