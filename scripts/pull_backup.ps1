param(
    [string]$VPS       = "root@195.133.194.173",
    [string]$RemoteDir = "/opt/backups",
    [string]$LocalDir  = "$env:USERPROFILE\Backups\ChallengeTracker",
    [int]   $KeepDays  = 14
)

$today     = Get-Date -Format "yyyy-MM-dd"
$localFile = Join-Path $LocalDir "db_$today.gz"
$ts        = { "[{0}]" -f (Get-Date -Format "HH:mm") }

New-Item -ItemType Directory -Force -Path $LocalDir | Out-Null

if (Test-Path $localFile) {
    Write-Host (& $ts) "Already have db_$today.gz - skipping."
    exit 0
}

Write-Host (& $ts) "Pulling db_$today.gz from VPS..."
scp "${VPS}:${RemoteDir}/db_${today}.gz" $LocalDir

if ($LASTEXITCODE -ne 0) {
    Write-Host (& $ts) "ERROR: scp failed. VPS may be unreachable or backup not yet created (runs at 03:00 UTC)."
    exit 1
}

Write-Host (& $ts) "Saved to $localFile"

$old = Get-ChildItem $LocalDir -Filter "db_*.gz" |
       Sort-Object Name -Descending |
       Select-Object -Skip $KeepDays

if ($old) {
    $old | Remove-Item -Force
    Write-Host (& $ts) "Removed $($old.Count) old backup(s)."
}

$all = Get-ChildItem $LocalDir -Filter "db_*.gz" | Sort-Object Name -Descending
Write-Host (& $ts) "Local backups ($($all.Count) files):"
$all | ForEach-Object {
    Write-Host "  $($_.Name)  $([math]::Round($_.Length / 1MB, 1)) MB"
}
