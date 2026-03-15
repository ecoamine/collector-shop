#!/usr/bin/env sh
# Génère un certificat auto-signé pour la démo HTTPS (localhost).
# À exécuter une fois avant le premier docker compose up.

set -e
DIR="$(cd "$(dirname "$0")" && pwd)/certs"
mkdir -p "$DIR"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/key.pem" -out "$DIR/cert.pem" \
  -subj "/CN=localhost/O=CollectorShop Demo"
echo "Certificat généré : $DIR/cert.pem et $DIR/key.pem"
