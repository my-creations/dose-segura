#!/usr/bin/env bash
# Launch Dose Segura web (Expo) for verification. Writes PID/port to .run/state.env.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
RUN_DIR="${VERIFY_RUN_DIR:-$SKILL_DIR/.run}"
PORT="${VERIFY_PORT:-8091}"
HOST="${VERIFY_HOST:-127.0.0.1}"
LOG_FILE="$RUN_DIR/expo.log"
STATE_FILE="$RUN_DIR/state.env"
READY_TIMEOUT_SEC="${VERIFY_READY_TIMEOUT_SEC:-120}"

mkdir -p "$RUN_DIR"

if [[ -f "$STATE_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$STATE_FILE"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    echo "Already running: pid=$PID url=http://${HOST}:${PORT}/ (refuse to double-launch)"
    exit 0
  fi
  rm -f "$STATE_FILE"
fi

cd "$REPO_ROOT"

# Free the chosen port only if WE previously owned it via state; never kill by process name.
if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $PORT is already in use by something else. Set VERIFY_PORT to another port."
    exit 1
  fi
fi

echo "Starting Expo web on http://${HOST}:${PORT}/ ..."
# Expo binds the web bundler; --port selects the Metro/web port used by e2e.
nohup bun run web -- --port "$PORT" >"$LOG_FILE" 2>&1 &
PID=$!

cat >"$STATE_FILE" <<STATE
PID=$PID
PORT=$PORT
HOST=$HOST
REPO_ROOT=$REPO_ROOT
SKILL_DIR=$SKILL_DIR
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LOG_FILE=$LOG_FILE
STATE
echo "Wrote $STATE_FILE (pid=$PID)"

deadline=$((SECONDS + READY_TIMEOUT_SEC))
while (( SECONDS < deadline )); do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "Expo exited early. Last log lines:"
    tail -n 40 "$LOG_FILE" || true
    rm -f "$STATE_FILE"
    exit 1
  fi
  if curl -fsS "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
    echo "Ready: http://${HOST}:${PORT}/"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for http://${HOST}:${PORT}/ after ${READY_TIMEOUT_SEC}s"
tail -n 60 "$LOG_FILE" || true
kill "$PID" 2>/dev/null || true
rm -f "$STATE_FILE"
exit 1
