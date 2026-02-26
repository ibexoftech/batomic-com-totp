#!/usr/bin/env bash
set -euo pipefail

# Generate TLS certificates using mkcert
# Prerequisites: brew install mkcert && mkcert -install

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$CERT_DIR"

HOSTNAME=$(hostname)
HOSTNAME_LOCAL="${HOSTNAME}.local"

# Get local IP address
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "")

DOMAINS=("$HOSTNAME" "$HOSTNAME_LOCAL" "localhost" "127.0.0.1")
if [ -n "$LAN_IP" ]; then
  DOMAINS+=("$LAN_IP")
fi

echo "Generating certificates for: ${DOMAINS[*]}"
mkcert -cert-file "$CERT_DIR/cert.pem" -key-file "$CERT_DIR/key.pem" "${DOMAINS[@]}"

echo ""
echo "Certificates generated in $CERT_DIR"
echo ""
echo "For iOS devices:"
echo "  1. AirDrop the root CA to the device:"
echo "     $(mkcert -CAROOT)/rootCA.pem"
echo "  2. On the device: Settings → General → VPN & Device Management → Install profile"
echo "  3. Settings → General → About → Certificate Trust Settings → Enable full trust"
