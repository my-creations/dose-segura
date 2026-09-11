#!/usr/bin/env bash
# Read-only health check for the verification instance started by launch.sh.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="${VERIFY_RUN_DIR:-$SKILL_DIR/.run}"
STATE_FILE="$RUN_DIR/state.env"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "FAIL: no state file at $STATE_FILE (run scripts/launch.sh first)"
  exit 1
fi

# shellcheck disable=SC1090
source "$STATE_FILE"

ok=1

if [[ -z "${PID:-}" ]] || ! kill -0 "$PID" 2>/dev/null; then
  echo "FAIL: process PID=${PID:-unset} is not running"
  ok=0
else
  echo "OK: process pid=$PID alive"
fi

URL="http://${HOST:-127.0.0.1}:${PORT}/"
if curl -fsS -o /tmp/dose-segura-doctor-body.html -w "%{http_code}" "$URL" | grep -q '^200$'; then
  echo "OK: $URL → 200"
  if grep -qi 'dose' /tmp/dose-segura-doctor-body.html; then
    echo "OK: response body mentions Dose (app shell present)"
  else
    echo "WARN: 200 but body does not mention Dose — check base path / wrong app"
  fi
else
  echo "FAIL: $URL not healthy"
  ok=0
fi

# Confirm this checkout looks like Dose Segura web.
if [[ -f "${REPO_ROOT:-}/package.json" ]] && grep -q '"name": "dose-segura"' "${REPO_ROOT}/package.json"; then
  echo "OK: package.json name is dose-segura"
else
  echo "FAIL: REPO_ROOT package.json is not dose-segura"
  ok=0
fi

# Dev server serves at / (not /dose-segura/). Production Pages uses base path /dose-segura/.
echo "NOTE: verification Launch uses Expo web at / ; live Pages is https://my-creations.github.io/dose-segura/"

if [[ "$ok" -ne 1 ]]; then
  exit 1
fi
echo "Doctor passed for $URL"
