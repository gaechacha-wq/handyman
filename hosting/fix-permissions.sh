#!/bin/sh
# Ripristina proprietario httpdocs per evitare EACCES su npm ci (Tailwind oxide, ecc.).
# ESECUZIONE SOLO COME ROOT, dalla root del progetto (httpdocs):
#   sudo sh hosting/fix-permissions.sh
#
# Richiede hosting/site.env con SITE_USER e SITE_GROUP (copia da site.env.example).

set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Esegui come root: sudo sh hosting/fix-permissions.sh" >&2
  exit 1
fi

HTTPDOCS="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$HTTPDOCS/hosting/site.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Manca $ENV_FILE — cp hosting/site.env.example hosting/site.env e adatta." >&2
  exit 1
fi

SITE_USER=$(grep '^SITE_USER=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r')
SITE_GROUP=$(grep '^SITE_GROUP=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r')

if [ -z "$SITE_USER" ] || [ -z "$SITE_GROUP" ]; then
  echo "SITE_USER o SITE_GROUP mancanti in hosting/site.env" >&2
  exit 1
fi

echo "==> chown -R $SITE_USER:$SITE_GROUP $HTTPDOCS"
chown -R "$SITE_USER:$SITE_GROUP" "$HTTPDOCS"
chmod -R u+rwX "$HTTPDOCS"

echo "==> OK. Poi come utente del sito (non root):"
echo "    cd $HTTPDOCS && rm -rf node_modules && npm ci"
