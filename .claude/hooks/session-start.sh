#!/bin/bash
# Forbereder web-sesjoner: installerer røyktest-avhengigheter og peker på den
# forhåndsinstallerte Chromium, slik at `cd tests && npm test` kan kjøres.
set -euo pipefail

# Kjør kun i Claude Code på web (lokalt trengs ingenting).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/tests"
# Rask JS-install; Playwright laster ikke ned nettleser (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).
npm install --no-audit --no-fund --silent

# Bruk nettleseren som allerede finnes i web-miljøet.
if [ -x /opt/pw-browsers/chromium ]; then
  echo "export PW_CHROMIUM=/opt/pw-browsers/chromium" >> "$CLAUDE_ENV_FILE"
fi

echo "Røyktest-avhengigheter klare (cd tests && npm test)."
