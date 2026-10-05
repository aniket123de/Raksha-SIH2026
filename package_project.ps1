$src = $PSScriptRoot
if (-not $src) { $src = (Get-Location).Path }

$downloads = Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads'
$desktop = Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Desktop'
$zipDownloads = Join-Path $downloads 'Raksha.zip'
$zipDesk = Join-Path $desktop 'Raksha.zip'
$zipLocal = Join-Path $src 'Raksha_Latest.zip'

Write-Host "Creating clean temp archive directory..." -ForegroundColor Cyan
$tmp = Join-Path $env:TEMP ('Raksha_Pkg_' + (Get-Random))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

$items = @(
    'src',
    'public',
    'server',
    'dist',
    'index.html',
    'package.json',
    'package-lock.json',
    'postcss.config.js',
    'README.md',
    'start.bat',
    'make_zip.bat',
    'package_project.ps1',
    'tailwind.config.js',
    'vite.config.js',
    'tile_carto.png',
    'tile_esri.jpg'
)

foreach ($item in $items) {
    $itemPath = Join-Path $src $item
    if (Test-Path $itemPath) {
        Copy-Item -Path $itemPath -Destination (Join-Path $tmp $item) -Recurse -Force
    }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $zipDownloads) { Remove-Item $zipDownloads -Force }
Write-Host "Compressing to $zipDownloads ..." -ForegroundColor Cyan
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $zipDownloads, [System.IO.Compression.CompressionLevel]::Optimal, $false)

if (Test-Path $desktop) {
    Copy-Item $zipDownloads $zipDesk -Force
    Write-Host "Copied to Desktop: $zipDesk" -ForegroundColor Green
}

Copy-Item $zipDownloads $zipLocal -Force
Write-Host "Copied to Project: $zipLocal" -ForegroundColor Green

Remove-Item $tmp -Recurse -Force
Write-Host "Package creation complete!" -ForegroundColor Green
Write-Host "1. $zipDownloads"
Write-Host "2. $zipDesk"
Write-Host "3. $zipLocal"
