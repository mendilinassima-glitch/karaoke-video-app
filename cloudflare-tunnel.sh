#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared n'est pas installé. Installez-le d'abord avec Homebrew : brew install cloudflared"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: ./cloudflare-tunnel.sh <local-port>"
  echo "Example: ./cloudflare-tunnel.sh 5174"
  exit 1
fi

LOCAL_PORT="$1"

echo "Démarrage du tunnel Cloudflare vers http://127.0.0.1:$LOCAL_PORT"
cloudflared tunnel --url "http://127.0.0.1:$LOCAL_PORT"