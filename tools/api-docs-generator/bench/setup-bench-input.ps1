# Stage script_modules metadata from multiple release tags into a single input
# directory, rewriting minecraft_version per release so the generator groups them
# as distinct Minecraft releases. This produces a realistic multi-version workload
# for the changelog generator.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $MetadataRepo,
    [Parameter(Mandatory = $true)] [string] $OutputDir,
    [Parameter(Mandatory = $true)] [string[]] $Releases
)

if (Test-Path $OutputDir) { Remove-Item -Path $OutputDir -Recurse -Force }
New-Item -Path $OutputDir -ItemType Directory | Out-Null

Push-Location $MetadataRepo
try {
    foreach ($release in $Releases) {
        $tag = "release/$release"
        Write-Host "Staging $release ..."
        $null = & git checkout $tag -- docs/publish/raw/script_modules
        $src = Join-Path $MetadataRepo "docs\publish\raw\script_modules"
        if (-not (Test-Path $src)) { Write-Warning "No script_modules for $release"; continue }

        $dst = Join-Path $OutputDir $release
        New-Item -Path $dst -ItemType Directory | Out-Null
        Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force

        Get-ChildItem -Path $dst -Recurse -Filter *.json | ForEach-Object {
            $c = Get-Content -Path $_.FullName -Raw
            $c = $c -replace '"minecraft_version"\s*:\s*"[0-9a-zA-Z.\-]+"', "`"minecraft_version`": `"$release`""
            [System.IO.File]::WriteAllText($_.FullName, $c)
        }
    }
} finally {
    # Restore the working tree
    & git reset --hard HEAD | Out-Null
    Pop-Location
}

Write-Host "Done staging."
Write-Host "Total input size:"
(Get-ChildItem $OutputDir -Recurse -File | Measure-Object -Sum Length).Sum / 1MB
