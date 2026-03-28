#!/bin/sh
# Deploy: dipendenze → allineamento DB (tabelle) → build Next.js.
# Uso: ./deploy.sh | sh deploy.sh  [--pull] [--skip-migrate]
# Richiede: Node.js, npm; DATABASE_URL o MYSQL_* in .env.production / .env (allineato a Plesk).

set -eu

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ "$(id -u)" -eq 0 ]; then
  echo "==> Avviso: sei root. node_modules deve appartenere all'utente del dominio." >&2
  echo "    Esegui: sh scripts/run-deploy-as-site-user.sh $*" >&2
  echo "    oppure: su - UTENTE_DOMINIO -c 'cd $ROOT && sh deploy.sh $*'" >&2
fi

DO_PULL=false
SKIP_MIGRATE=false

for arg in "$@"; do
  case "$arg" in
    --pull) DO_PULL=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
    *)
      echo "Argomento sconosciuto: $arg" >&2
      echo "Uso: $0 [--pull] [--skip-migrate]" >&2
      exit 1
      ;;
  esac
done

echo "==> Directory: $ROOT"

if [ "$DO_PULL" = "true" ]; then
  if [ -d .git ]; then
    echo "==> git pull"
    git pull origin main
  else
    echo "==> (--pull ignorato: directory non è un clone git)"
  fi
fi

echo "==> npm ci"
npm ci

if [ "$SKIP_MIGRATE" = "false" ]; then
  echo "==> Allineamento DB (check env + migrazioni / tabelle da db/migrations/)"
  npm run db:align
else
  echo "==> Allineamento DB saltato (--skip-migrate)"
fi

echo "==> npm run build"
npm run build

echo ""
echo "Deploy build completato."
echo "Su Plesk: Riavvia l'app Node.js dopo il deploy (o automatizza il restart se disponibile)."
