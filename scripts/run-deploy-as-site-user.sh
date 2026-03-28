#!/usr/bin/env bash
# Esegue deploy.sh come SITE_USER definito in hosting/site.env (evita EACCES su node_modules).
# Uso da root: sh scripts/run-deploy-as-site-user.sh [--pull] [--skip-migrate]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/hosting/site.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Manca $ENV_FILE — copia hosting/site.env.example -> hosting/site.env" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$ROOT/hosting/site.env"

if [[ -z "${SITE_USER:-}" ]]; then
  echo "SITE_USER non impostato in hosting/site.env" >&2
  exit 1
fi

cd "$ROOT"

ARGS=$(printf '%q ' "$@")
exec su - "$SITE_USER" -s /bin/bash -c "cd $(printf '%q' "$ROOT") && exec bash deploy.sh $ARGS"
