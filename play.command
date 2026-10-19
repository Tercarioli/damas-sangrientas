#!/bin/zsh
# Local launcher for macOS. Standard npm scripts remain portable.
cd -- "${0:A:h}"
if command -v node >/dev/null 2>&1; then
  LAST_MOVE_NODE="$(command -v node)"
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  LAST_MOVE_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
else
  print 'LAST MOVE necesita Node.js. Instalá Node.js y ejecutá npm install y npm run dev.'
  exit 1
fi
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  print 'Primero ejecutá npm install dentro de esta carpeta.'
  exit 1
fi
print 'LAST MOVE — Cerrá este servidor con Control+C.'
exec "$LAST_MOVE_NODE" node_modules/vite/bin/vite.js --host 127.0.0.1 --open
