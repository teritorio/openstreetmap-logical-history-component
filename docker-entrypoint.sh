#!/bin/sh
set -eu

if [ ! -d /app/node_modules ] || [ -z "$(ls -A /app/node_modules 2>/dev/null || true)" ]; then
  echo "Installing dependencies in /app (bind mount detected or empty node_modules)..."
  yarn install --immutable || yarn install
fi

if [ "${1:-}" = "yarn" ] && [ "${2:-}" = "dev" ]; then
  has_host=0
  has_port=0
  for arg in "$@"; do
    if [ "$arg" = "--host" ] || [ "$arg" = "-H" ]; then
      has_host=1
    fi
    if [ "$arg" = "--port" ] || [ "$arg" = "-p" ]; then
      has_port=1
    fi
  done

  if [ "$has_host" -eq 0 ]; then
    set -- "$@" --host 0.0.0.0
  fi
  if [ "$has_port" -eq 0 ]; then
    set -- "$@" --port "${PORT:-4173}"
  fi
fi

exec "$@"
