#!/usr/bin/env bash
set -euo pipefail
cd /workspace/University
export npm_config_cache=/workspace/.npm-cache
export electron_config_cache=/workspace/.electron-cache
export ELECTRON_CACHE=/workspace/.electron-cache
export ELECTRON_BUILDER_CACHE=/workspace/.builder-cache
export XDG_CACHE_HOME=/workspace/.cache
if [ -n "${HTTPS_PROXY:-}" ]; then
  export ELECTRON_GET_USE_PROXY=1
  export GLOBAL_AGENT_HTTP_PROXY="$HTTPS_PROXY"
fi
npm ci --no-audit --no-fund
npm --prefix analysis-tools ci --no-audit --no-fund
npm run build
