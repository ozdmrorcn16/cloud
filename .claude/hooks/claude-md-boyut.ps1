# CLAUDE.md her oturum basinda tam bedeliyle yukleniyor; iki kez 280-400
# bin karaktere sisti (2026-09-13, 2026-09-24). Bu hook tavan asilinca
# oturum baglamina uyari yazar. Her zaman 0 doner - uyarir, engellemez.
$ErrorActionPreference = 'Stop'
$tavan = 50000
try {
    $yol = Join-Path $PSScriptRoot '..\..\CLAUDE.md'
    $boyut = (Get-Content -Raw -Encoding UTF8 $yol).Length
    if ($boyut -gt $tavan) {
        Write-Output "UYARI: CLAUDE.md $boyut karakter (tavan $tavan). Bu oturumda ISE BASLAMADAN once tarihli tur anlatimlarini docs/claude-md-arsiv.md sonuna tasi; CLAUDE.md'de yalnizca yururlukteki kural, durum, acik borc ve tuzak kalsin."
    }
} catch {
    Write-Output "claude-md-boyut: olculemedi: $($_.Exception.Message)"
}
exit 0
