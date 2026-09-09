#!/usr/bin/env bash
# Tear down the verification instance started by launch.sh. Never deletes evidence/.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="${VERIFY_RUN_DIR:-$SKILL_DIR/.run}"
STATE_FILE="$RUN_DIR/state.env"
EVIDENCE_DIR="$SKILL_DIR/evidence"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "Nothing to clean (no $STATE_FILE)"
  echo "Evidence (untouched): $EVIDENCE_DIR"
  exit 0
fi

# shellcheck disable=SC1090
source "$STATE_FILE"

if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
  echo "Stopping pid=$PID (Expo web on port ${PORT:-?})"
  # Kill the process group if possible so Metro children die too.
  kill "$PID" 2>/dev/null || true
  # Give Metro a moment; then escalate only to THIS pid.
  for _ in 1 2 3 4 5; do
    kill -0 "$PID" 2>/dev/null || break
    sleep 0.5
  done
  if kill -0 "$PID" 2>/dev/null; then
    echo "SIGKILL pid=$PID"
    kill -9 "$PID" 2>/dev/null || true
  fi
else
  echo "PID ${PID:-unset} already gone"
fi

# Remove only runtime scratch — never evidence/
rm -f "$STATE_FILE"
rm -f "$RUN_DIR/expo.log"
# Leave the directory if empty evidence pointers remain; wipe known scratch only.
find "$RUN_DIR" -mindepth 1 -maxdepth 1 ! -name 'evidence' -exec rm -rf {} + 2>/dev/null || true

echo "Cleanup done. Evidence survives at: $EVIDENCE_DIR"
ls -la "$EVIDENCE_DIR" 2>/dev/null || true
