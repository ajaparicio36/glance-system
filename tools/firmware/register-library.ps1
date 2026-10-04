param(
  [Parameter(Mandatory = $true)]
  [string]$Sketchbook
)

$ErrorActionPreference = 'Stop'
$source = (Resolve-Path "$PSScriptRoot/../../libraries/GlanceFirmware").Path
$libraryDirectory = Join-Path $Sketchbook 'libraries'
$destination = Join-Path $libraryDirectory 'GlanceFirmware'
if (Test-Path -LiteralPath $destination) {
  $existing = Get-Item -LiteralPath $destination
  if ($existing.LinkType -eq 'Junction' -and $existing.Target -contains $source) {
    Write-Output 'GlanceFirmware is already registered.'
    exit 0
  }
  throw "Refusing to replace existing library at $destination."
}
New-Item -ItemType Directory -Path $libraryDirectory -Force | Out-Null
New-Item -ItemType Junction -Path $destination -Target $source | Out-Null
Write-Output "Registered GlanceFirmware at $destination. Restart Arduino IDE if it was open."
