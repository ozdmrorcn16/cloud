// Yerel SPA sunucusu: `expo export` ciktisini (dist) 127.0.0.1:8080'de
// sunar ve bilinmeyen yollari index.html'e dusurur. `python -m
// http.server` SPA yollarina (/profil gibi) 404 verdigi icin
// ekran-goruntusu.mjs ile ic ekran cekerken bu kullanilir:
//   node araclar/spa-sunucu.mjs dist
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const kok = path.resolve(process.argv[2] ?? 'dist')
const tur = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
}

http.createServer((req, res) => {
  // Yol kokun ALTINDA kalmak zorunda: "../" ile disari cikan istek 403.
  let p = path.resolve(kok, '.' + decodeURIComponent(req.url.split('?')[0]))
  if (p !== kok && !p.startsWith(kok + path.sep)) {
    res.writeHead(403)
    return res.end()
  }
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(kok, 'index.html')
  res.writeHead(200, { 'content-type': tur[path.extname(p)] ?? 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
}).listen(8080, '127.0.0.1')
