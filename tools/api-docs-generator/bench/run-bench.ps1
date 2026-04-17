# Benchmark wrapper that times a single CLI run and captures peak working set.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $InputDir,
    [Parameter(Mandatory = $true)] [string] $OutputDir,
    [Parameter(Mandatory = $true)] [string] $Label
)

$cli = "D:\minecraft-scripting-libraries\tools\api-docs-generator\lib\cli.js"

if (Test-Path $OutputDir) { Remove-Item -Path $OutputDir -Recurse -Force }
New-Item -Path $OutputDir -ItemType Directory | Out-Null

$env:NODE_OPTIONS = '--max-old-space-size=16384'

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'node'
$psi.ArgumentList.Add($cli)
$psi.ArgumentList.Add('--no-config')
$psi.ArgumentList.Add('--input-directory'); $psi.ArgumentList.Add($InputDir)
$psi.ArgumentList.Add('--output-directory'); $psi.ArgumentList.Add($OutputDir)
$psi.ArgumentList.Add('--run-generators'); $psi.ArgumentList.Add('changelog')
$psi.ArgumentList.Add('--log.level'); $psi.ArgumentList.Add('warn')
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$proc = [System.Diagnostics.Process]::Start($psi)

# Poll peak memory
$peak = 0L
while (-not $proc.HasExited) {
    try {
        $proc.Refresh()
        if ($proc.PeakWorkingSet64 -gt $peak) { $peak = $proc.PeakWorkingSet64 }
    } catch { }
    Start-Sleep -Milliseconds 250
}
$null = $proc.StandardOutput.ReadToEnd()
$errOut = $proc.StandardError.ReadToEnd()
$sw.Stop()

try {
    $proc.Refresh()
    if ($proc.PeakWorkingSet64 -gt $peak) { $peak = $proc.PeakWorkingSet64 }
} catch { }

if ($proc.ExitCode -ne 0) {
    Write-Host "[$Label] FAILED (exit $($proc.ExitCode))"
    Write-Host $errOut
    exit 1
}

$peakMB = [Math]::Round($peak / 1MB, 1)
$secs = [Math]::Round($sw.Elapsed.TotalSeconds, 2)
Write-Host "[$Label] time=${secs}s peakRSS=${peakMB}MB"

# Emit as JSON line for parsing
[PSCustomObject]@{ label = $Label; seconds = $secs; peakMB = $peakMB } | ConvertTo-Json -Compress
