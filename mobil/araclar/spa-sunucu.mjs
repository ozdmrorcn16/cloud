import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const kok = process.argv[2]
const tur = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.json':'application/json', '.ico':'image/x-icon', '.ttf':'font/ttf', '.woff2':'font/woff2', '.svg':'image/svg+xml' }
http.createServer((req, res) => {
  let p = path.join(kok, decodeURIComponent(req.url.split('?')[0]))
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(kok, 'index.html')
  res.writeHead(200, { 'content-type': tur[path.extname(p)] ?? 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
}).listen(8080)
