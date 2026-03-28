#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then exec /usr/bin/env bash "$0" "$@"; fi
# Deploy completo: permessi (opz.) → git pull → npm ci → DB → build.
#
# Uso:
#   bash deploy.sh | ./deploy.sh | sh deploy.sh  [--pull] [--skip-migrate]
#   sudo bash deploy.sh --fix-perms [--pull] [--skip-migrate]
#
# --fix-perms (solo root): chown/chmod; se manca hosting/site.env lo crea da site.env.example.
# Poi deploy come utente sito. DATABASE_URL o MYSQL_* in .env.production per db:align.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Node/npm di Plesk (ordine: 25, 22, 20) se presente
for N in 25 22 20; do
  if [[ -x "/opt/plesk/node/$N/bin/node" ]]; then
    export PATH="/opt/plesk/node/$N/bin:$PATH"
    echo "==> Node: $(command -v node) ($(node -v 2>/dev/null || true))"
    break
  fi
done

# --- parse args: --fix-perms può stare ovunque ---
FIX_PERMS=false
PASSTHROUGH=()
for a in "$@"; do
  if [[ "$a" == "--fix-perms" ]]; then
    FIX_PERMS=true
  else
    PASSTHROUGH+=("$a")
  fi
done
set -- "${PASSTHROUGH[@]}"

if [[ "$FIX_PERMS" == true ]]; then
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "==> --fix-perms va eseguito come root: sudo $0 --fix-perms ..." >&2
    exit 1
  fi
  ENV_FILE="$ROOT/hosting/site.env"
  EXAMPLE="$ROOT/hosting/site.env.example"
  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$EXAMPLE" ]]; then
      echo "==> Creo hosting/site.env da site.env.example (controlla SITE_USER/SITE_GROUP)"
      cp "$EXAMPLE" "$ENV_FILE"
    else
      echo "==> Manca $ENV_FILE e anche $EXAMPLE" >&2
      exit 1
    fi
  fi
  SITE_USER=$(grep '^SITE_USER=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r')
  SITE_GROUP=$(grep '^SITE_GROUP=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r')
  if [[ -z "$SITE_USER" || -z "$SITE_GROUP" ]]; then
    echo "==> SITE_USER / SITE_GROUP mancanti in hosting/site.env" >&2
    exit 1
  fi
  echo "==> Fix permessi: chown -R $SITE_USER:$SITE_GROUP $ROOT"
  chown -R "$SITE_USER:$SITE_GROUP" "$ROOT"
  chmod -R u+rwX "$ROOT"
  echo "==> Continuo deploy come $SITE_USER (npm ci, db, build)..."
  exec su - "$SITE_USER" -s /bin/bash -c "cd $(printf '%q' "$ROOT") && export PATH=$(printf '%q' "$PATH") && exec bash deploy.sh $(printf '%q ' "$@")"
fi

# --- da qui in poi: non eseguire come root (npm ci fallirebbe con EACCES) ---
if [[ "$(id -u)" -eq 0 ]]; then
  echo "==> Non eseguire deploy.sh come root (EACCES su node_modules)." >&2
  echo "    sudo $ROOT/deploy.sh --fix-perms [--pull] [--skip-migrate]" >&2
  exit 1
fi

DO_PULL=false
SKIP_MIGRATE=false
for arg in "$@"; do
  case "$arg" in
    --pull) DO_PULL=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    *)
      echo "Argomento sconosciuto: $arg" >&2
      echo "Uso: $0 [--fix-perms] [--pull] [--skip-migrate]" >&2
      exit 1
      ;;
  esac
done

echo "==> Directory: $ROOT"

if [[ "$DO_PULL" == true ]]; then
  if [[ -d .git ]]; then
    echo "==> git pull"
    git pull origin main
  else
    echo "==> (--pull ignorato: non è un clone git)"
  fi
fi

echo "==> npm ci"
npm ci

if [[ "$SKIP_MIGRATE" == false ]]; then
  echo "==> Allineamento DB (check env + migrazioni / tabelle)"
  npm run db:align
else
  echo "==> Allineamento DB saltato (--skip-migrate)"
fi

echo "==> npm run build"
npm run build

echo ""
echo "==> Deploy completato."
echo "    Plesk: Riavvia l'app Node.js se necessario."
