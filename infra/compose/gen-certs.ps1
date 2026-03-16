# Genere les certificats TLS pour Nginx (localhost) sans avoir OpenSSL installe.
# A lancer depuis infra/compose : .\gen-certs.ps1

$certsDir = Join-Path $PSScriptRoot "..\nginx\certs"
New-Item -ItemType Directory -Force -Path $certsDir | Out-Null
$certsPath = (Resolve-Path $certsDir).Path

docker run --rm -v "${certsPath}:/certs" alpine sh -c "apk add --no-cache openssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/key.pem -out /certs/cert.pem -subj /CN=localhost"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Certificats generes dans $certsPath"
    Write-Host "Lancer : docker compose up -d --build"
    Write-Host "Puis ouvrir https://localhost dans le navigateur."
} else {
    Write-Host "Erreur lors de la generation des certificats."
    exit 1
}
