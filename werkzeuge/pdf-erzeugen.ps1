# Erzeugt alle PDFs im Ordner druck/. Vorher muss der Testserver laufen (node werkzeuge/server.js)
# und node werkzeuge/druckvorlagen.js gelaufen sein.
$ErrorActionPreference = 'Stop'
$projekt = Split-Path -Parent $PSScriptRoot
$druck = Join-Path $projekt 'druck'
$chrome = @('C:\Program Files\Google\Chrome\Application\chrome.exe', 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Weder Chrome noch Edge gefunden.' }
$profil = Join-Path $env:TEMP 'bibliothek-druck-profil'

$auftraege = @(@{ url = 'druck/druckvorlagen.html'; pdf = 'Druckvorlagen.pdf' })
Get-ChildItem (Join-Path $druck 'einzeln') -Filter *.html | ForEach-Object {
  $auftraege += @{ url = "druck/einzeln/$($_.Name)"; pdf = "$($_.BaseName).pdf" }
}

foreach ($a in $auftraege) {
  $ziel = Join-Path $druck $a.pdf
  $p = Start-Process -FilePath $chrome -Wait -PassThru -WindowStyle Hidden -ArgumentList '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', "--user-data-dir=$profil", '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=15000', "--print-to-pdf=$ziel", "http://localhost:8080/$($a.url)"
  $text = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($ziel))
  $seiten = ([regex]::Matches($text, '/MediaBox')).Count
  '{0,-28} {1,2} Seiten  {2,9:N0} Bytes' -f $a.pdf, $seiten, (Get-Item $ziel).Length
}
