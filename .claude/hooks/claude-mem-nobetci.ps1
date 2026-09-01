# claude-mem NOBETCISI - oturum basinda calisir, hafizanin gercekten
# calisir halde oldugundan emin olur.
#
# NEDEN VAR (2026-09-01):
#   claude-mem'in worker'i acilirken once dosyalari onbellege aliyor,
#   sonra chroma'yi baslatiyor, EN SON portu (37777) aciyor. Onceki
#   kosumdan kalan bir chroma sureci (uv onbelleginden calisan
#   python.exe) hayattaysa yeni worker o adimda TAKILIYOR ve port hic
#   acilmiyor. Gunlukteki belirtisi:
#       Worker port did not open after lazy-spawn within the cold-boot wait
#   Bu, Claude Code zorla kapatildiginda (cokme, gorev yoneticisi)
#   olusuyor ve sonucu SESSIZ: hicbir sey bloke olmuyor ama hafiza
#   kayit tutmayi birakiyor.
#
# NE YAPAR:
#   1. Port 37777 saglikliysa HICBIR SEY yapmaz.
#   2. Degilse, claude-mem'e ait ESKI surecleri (60 saniyeden once
#      baslamis bun ve uv-chroma python surecleri) sonlandirir. 60
#      saniye siniri o an ACILMAKTA olan bir worker'i oldurmemek icin.
#   3. Ardindan worker'i ISITIR - ilk mesaji beklemeden acar.
#      Eklentinin kendi SessionStart hook'u da bunu yapiyor ama hook
#      SIRASI garanti degil; o once calisip oksuz surece takilmis
#      olabilir. Isitma yapilmazsa oturumun ILK MESAJI kaydedilmiyor
#      (olculdu).
#
# NEDEN HER ZAMAN 0 DONER:
#   Bu hook oturumu bloke edemez. claude-mem 2026-08-19'da tam olarak
#   "hook basarisiz olunca kullanicinin mesajini bloke etme" yuzunden
#   kapatilmisti; onu onlemek icin yazilan bir hook'un ayni hataya
#   dusmesi kabul edilemez. Hatalar YUTULMUYOR, ekrana yaziliyor -
#   yalnizca cikis kodu 0 kaliyor.

$ErrorActionPreference = 'Continue'

function Saglikli {
    try {
        $c = Invoke-WebRequest -Uri 'http://127.0.0.1:37777/health' -TimeoutSec 2 -UseBasicParsing
        return $c.StatusCode -eq 200
    } catch { return $false }
}

try {
    if (Saglikli) {
        Write-Output 'claude-mem: worker saglikli, dokunulmadi.'
        exit 0
    }

    $esik = (Get-Date).AddSeconds(-60)
    $oldurulen = 0

    # Eski bun surecleri (worker bun ile calisiyor).
    Get-Process bun -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            if ($_.StartTime -lt $esik) { Stop-Process -Id $_.Id -Force; $oldurulen++ }
        } catch { Write-Output "claude-mem: bun $($_.Id) sonlandirilamadi: $($_.Exception.Message)" }
    }

    # Eski chroma surecleri. Olcut KOMUT SATIRI: kullanicinin kendi
    # python islerine dokunmamak icin yalnizca uv onbelleginden
    # calisanlar sonlandiriliyor.
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like '*uv*archive*' } |
        ForEach-Object {
            $no = $_.ProcessId
            try {
                $p = Get-Process -Id $no -ErrorAction SilentlyContinue
                if ($p -and $p.StartTime -lt $esik) { Stop-Process -Id $no -Force; $oldurulen++ }
            } catch { Write-Output "claude-mem: chroma $no sonlandirilamadi: $($_.Exception.Message)" }
        }

    if ($oldurulen -gt 0) { Write-Output "claude-mem: $oldurulen oksuz surec temizlendi." }

    # --- WORKER'I ISIT ---
    # ESZAMANLI ve STDIN ile calistiriliyor. Start-Process ile arka
    # planda denendi ve SESSIZCE basarisiz oldu: hook girdisini
    # STDIN'den okuyor, Start-Process'te stdin olmadigi icin surec
    # hemen cikiyordu. Soguk acilis ~16 sn; hook butcesi 60 sn.
    $kokler = Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\thedotmack\claude-mem" `
        -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d' } | Sort-Object Name -Descending

    if (-not $kokler) {
        Write-Output 'claude-mem: eklenti klasoru bulunamadi, isitma atlandi.'
        exit 0
    }

    $kok = $kokler[0].FullName
    $runner = Join-Path $kok 'scripts\bun-runner.js'
    $svc = Join-Path $kok 'scripts\worker-service.cjs'

    if (-not ((Test-Path $runner) -and (Test-Path $svc))) {
        Write-Output 'claude-mem: worker betikleri bulunamadi, isitma atlandi.'
        exit 0
    }

    $girdi = '{"hook_event_name":"UserPromptSubmit","prompt":"oturum acilisi","cwd":"C:/Users/orcns/projects/cloud","session_id":"nobetci-isitma"}'
    $girdi | & node $runner $svc hook claude-code session-init 2>&1 | Out-Null

    if (Saglikli) {
        Write-Output 'claude-mem: worker acildi ve saglikli.'
    } else {
        Write-Output 'claude-mem: worker acilamadi. Hafiza bu oturumda kayit tutmayabilir; hicbir sey bloke olmadi.'
    }
} catch {
    Write-Output "claude-mem nobetcisi hata verdi (oturum etkilenmedi): $($_.Exception.Message)"
}

exit 0
