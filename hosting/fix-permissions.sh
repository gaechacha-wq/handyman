#!/bin/sh
# Deprecato: la logica è in deploy.sh --fix-perms
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/deploy.sh" --fix-perms "$@"
