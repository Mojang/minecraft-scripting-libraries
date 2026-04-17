# End-to-end benchmark: baseline vs optimized changelog generator.
# Captures wall-clock time and peak working set for each run.
# Usage: pwsh -File bench-e2e.ps1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repoRoot   = 'D:\minecraft-scripting-libraries'
$cliJs      = "$repoRoot\tools\api-docs-generator\lib\cli.js"
$srcFile    = "$repoRoot\tools\api-docs-generator\src\changelog.ts"
$optFile    = "$repoRoot\tools\api-docs-generator\src\changelog.ts.optimized"
$benchInput = 'd:\bench-input'
$runs       = 3

$env:NODE_OPTIONS = '--max-old-space-size=16384'

function Build-Generator {
    Push-Location $repoRoot
    $out = & npm run build -- -- --filter=@minecraft/api-docs-generator... 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -ne 0) {
        $out | Write-Host
        throw "Build failed"
    }
    Write-Host "  Build OK"
}

function Run-Benchmark {
    param(
        [string] $Label,
        [string] $OutputDir
    )

    if (Test-Path $OutputDir) { Remove-Item $OutputDir -Recurse -Force }
    New-Item $OutputDir -ItemType Directory -Force | Out-Null

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    $p = Start-Process -FilePath 'node' -ArgumentList @(
        $cliJs,
        '--no-config',
        '--input-directory', $benchInput,
        '--output-directory', $OutputDir,
        '--run-generators', 'changelog-json',
        '--log.level', 'warn'
    ) -NoNewWindow -PassThru -RedirectStandardOutput "$OutputDir\stdout.txt" -RedirectStandardError "$OutputDir\stderr.txt"

    $peak = 0L
    while (-not $p.HasExited) {
        try {
            $p.Refresh()
            if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 }
        } catch { }
        Start-Sleep -Milliseconds 200
    }
    $p.WaitForExit()
    try { $p.Refresh(); if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 } } catch { }
    $sw.Stop()

    if ($p.ExitCode -ne 0) {
        $errText = Get-Content "$OutputDir\stderr.txt" -Raw -ErrorAction SilentlyContinue
        Write-Warning "[$Label] exit code $($p.ExitCode)"
        if ($errText) { Write-Warning $errText }
    }

    # Clean up log redirects
    Remove-Item "$OutputDir\stdout.txt" -ErrorAction SilentlyContinue
    Remove-Item "$OutputDir\stderr.txt" -ErrorAction SilentlyContinue

    return [PSCustomObject]@{
        Label   = $Label
        Seconds = [Math]::Round($sw.Elapsed.TotalSeconds, 2)
        PeakMB  = [Math]::Round($peak / 1MB, 1)
        ExitCode = $p.ExitCode
    }
}

# ------------------------------------------------------------------
Write-Host "=== BASELINE (original changelog.ts) ==="
& git -C $repoRoot checkout HEAD -- tools/api-docs-generator/src/changelog.ts 2>$null
Build-Generator

$baselineResults = @()
for ($i = 1; $i -le $runs; $i++) {
    Write-Host "  Run $i/$runs ..."
    $r = Run-Benchmark -Label "baseline-$i" -OutputDir "d:\bench-output-baseline"
    Write-Host "    time=$($r.Seconds)s  peakRSS=$($r.PeakMB)MB  exit=$($r.ExitCode)"
    $baselineResults += $r
}

# Save baseline output for comparison (last run)
if (Test-Path d:\bench-output-baseline-save) { Remove-Item d:\bench-output-baseline-save -Recurse -Force }
Rename-Item d:\bench-output-baseline d:\bench-output-baseline-save

# ------------------------------------------------------------------
Write-Host ""
Write-Host "=== OPTIMIZED (changelog.ts.optimized) ==="
Copy-Item $optFile $srcFile -Force
Build-Generator

$optimizedResults = @()
for ($i = 1; $i -le $runs; $i++) {
    Write-Host "  Run $i/$runs ..."
    $r = Run-Benchmark -Label "optimized-$i" -OutputDir "d:\bench-output-optimized"
    Write-Host "    time=$($r.Seconds)s  peakRSS=$($r.PeakMB)MB  exit=$($r.ExitCode)"
    $optimizedResults += $r
}

# ------------------------------------------------------------------
Write-Host ""
Write-Host "=== OUTPUT EQUIVALENCE CHECK ==="
$baseFiles = Get-ChildItem d:\bench-output-baseline-save -Recurse -File | Sort-Object FullName
$optFiles  = Get-ChildItem d:\bench-output-optimized     -Recurse -File | Sort-Object FullName

$baseRel = $baseFiles | ForEach-Object { $_.FullName.Replace('d:\bench-output-baseline-save\','') }
$optRel  = $optFiles  | ForEach-Object { $_.FullName.Replace('d:\bench-output-optimized\','') }
$fileDiff = Compare-Object $baseRel $optRel
if ($fileDiff) {
    Write-Warning "File lists differ!"
    $fileDiff | Format-Table
} else {
    Write-Host "  File lists match ($($baseFiles.Count) files)"
}

$hashMismatch = 0
for ($i = 0; $i -lt $baseFiles.Count; $i++) {
    $hb = (Get-FileHash $baseFiles[$i].FullName -Algorithm SHA256).Hash
    $ho = (Get-FileHash $optFiles[$i].FullName  -Algorithm SHA256).Hash
    if ($hb -ne $ho) {
        $hashMismatch++
        Write-Warning "HASH MISMATCH: $($baseRel[$i])"
    }
}
if ($hashMismatch -eq 0) {
    Write-Host "  All file hashes match"
} else {
    Write-Warning "$hashMismatch file(s) differ"
}

# ------------------------------------------------------------------
Write-Host ""
Write-Host "=== SUMMARY ==="

$bSorted = $baselineResults  | Sort-Object Seconds
$oSorted = $optimizedResults | Sort-Object Seconds
$bMedianTime = $bSorted[[Math]::Floor($runs/2)].Seconds
$oMedianTime = $oSorted[[Math]::Floor($runs/2)].Seconds
$bMedianMem  = ($baselineResults  | Sort-Object PeakMB)[[Math]::Floor($runs/2)].PeakMB
$oMedianMem  = ($optimizedResults | Sort-Object PeakMB)[[Math]::Floor($runs/2)].PeakMB

Write-Host ""
Write-Host ("| Metric            | Baseline   | Optimized  | Improvement |")
Write-Host ("|-------------------|------------|------------|-------------|")
Write-Host ("| Wall-clock (med.) | {0,8}s  | {1,8}s  | {2,9}x |" -f $bMedianTime, $oMedianTime, [Math]::Round($bMedianTime / $oMedianTime, 2))
Write-Host ("| Peak RSS   (med.) | {0,7} MB | {1,7} MB | {2,8} MB |" -f $bMedianMem, $oMedianMem, [Math]::Round($bMedianMem - $oMedianMem, 1))
Write-Host ""

$baselineResults  | Format-Table -AutoSize
$optimizedResults | Format-Table -AutoSize
