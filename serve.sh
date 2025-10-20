#!/bin/bash
PORT=5500
DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DIR" || exit 1

echo "Starte lokalen Server auf http://localhost:$PORT ..."
echo "(Drücke Ctrl+C zum Stoppen)"

# Prüfe Python
if command -v python3 >/dev/null 2>&1; then
  open "http://localhost:$PORT/index.html" 2>/dev/null || xdg-open "http://localhost:$PORT/index.html" >/dev/null 2>&1 &
  python3 -m http.server "$PORT"
  exit 0
fi

# Prüfe Node.js
if command -v node >/dev/null 2>&1; then
  npx --yes http-server -p "$PORT" -o index.html
  exit 0
fi

echo "--------------------------------------------"
echo "Kein Python3 oder Node.js gefunden."
echo "Bitte installiere Python (https://www.python.org/downloads/)"
echo "oder Node.js (https://nodejs.org/)."
echo "--------------------------------------------"
exit 1
