$srcs = @('backend\best_densenet121_xray.pth','best_densenet121_xray.pth')
$dest = 'ai\models'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$backup = Join-Path $dest 'backups'
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach ($s in $srcs) {
    $full = Join-Path (Get-Location) $s
    if (Test-Path $full) {
        $bn = Split-Path $full -Leaf
        $ts = Get-Date -Format yyyyMMddHHmmss
        $bk = Join-Path $backup "$($bn).$ts.bak"
        Copy-Item -Path $full -Destination $bk -Force
        Copy-Item -Path $full -Destination (Join-Path $dest $bn) -Force
        Remove-Item -Path $full -Force
        Write-Output ("moved: {0} -> {1}\{2} (backup: {3}" -f $full, $dest, $bn, $bk)
    } else {
        Write-Output ("not found: {0}" -f $s)
    }
}
