#!/usr/bin/env bash
# Backup/restore drill (WO-09; handover section 11 "documented restore procedure", section 14 "backup/restore drill").
# Proves the site can be rebuilt from git alone:
#   1. clones the pushed branch from GitHub into a new temp directory ("remote" copy);
#   2. checks that the local HEAD is the pushed head (an unpushed or stale local branch fails: the backup would not
#      hold what is built here), and exports local HEAD with git archive ("local" copy);
#   3. runs npm ci and npm run build in each (the full gated build: tests, validation, data publishing, next build);
#   4. compares the SHA-256 of every built data file (dist/data/**) between the two.
# PASS means the pushed branch alone reproduces the published data byte for byte.
# Never deploys. Never touches the working tree (the local copy comes from git archive, not from uncommitted files).
# Usage: bash scripts/ops/backup-drill.sh [branch]      (default: claude/eager-rubin-7bpcgq)
#        KEEP=1 keeps the temp directory for inspection.
#        DRILL_REPO=<dir> uses another local repository; DRILL_HEADS_ONLY=1 stops after the head check (both for
#        scripts/ops/test-ops.js).
set -euo pipefail

BRANCH="${1:-claude/eager-rubin-7bpcgq}"
REPO="${DRILL_REPO:-$(cd "$(dirname "$0")/../.." && pwd)}"
URL="$(git -C "$REPO" remote get-url origin)"
mkdir -p /tmp/claude-0/ops
WORK="$(mktemp -d /tmp/claude-0/ops/drill-XXXXXX)"
cleanup() { if [ "${KEEP:-0}" != "1" ]; then rm -rf "$WORK"; else echo "kept $WORK"; fi; }
trap cleanup EXIT

echo "drill: cloning $BRANCH"
git clone --quiet --depth 1 --branch "$BRANCH" "$URL" "$WORK/remote"
COMMIT="$(git -C "$WORK/remote" rev-parse HEAD)"
echo "drill: pushed head $COMMIT"

if ! git -C "$REPO" cat-file -e "$COMMIT^{commit}" 2>/dev/null; then
  echo "drill: FAIL - pushed commit $COMMIT is not in the local repository (fetch first)"; exit 1
fi
LOCAL="$(git -C "$REPO" rev-parse HEAD)"
if [ "$LOCAL" != "$COMMIT" ]; then
  echo "drill: FAIL - local HEAD ${LOCAL:0:7} differs from the pushed head ${COMMIT:0:7} of $BRANCH (push, or pull, first)"; exit 1
fi
echo "drill: heads match (${COMMIT:0:7})"
if [ "${DRILL_HEADS_ONLY:-0}" = "1" ]; then exit 0; fi
mkdir -p "$WORK/local"
git -C "$REPO" archive HEAD | tar -x -C "$WORK/local"

build() {
  local dir="$1" name="$2"
  echo "drill: npm ci + npm run build ($name)"
  ( cd "$dir" && npm ci --no-audit --no-fund >"$WORK/$name-ci.log" 2>&1 && npm run build >"$WORK/$name-build.log" 2>&1 ) || {
    echo "drill: FAIL - $name build failed; last lines:"; tail -n 20 "$WORK/$name-build.log" 2>/dev/null || tail -n 20 "$WORK/$name-ci.log"; exit 1; }
  # Data files only: the /data/ page itself (index.html, index.txt) carries Next's per-build id.
  ( cd "$dir/dist/data" && find . -type f ! -name index.html ! -name index.txt -print0 | sort -z | xargs -0 sha256sum ) >"$WORK/$name.sha256"
}
build "$WORK/remote" remote
build "$WORK/local" local

FILES="$(wc -l <"$WORK/remote.sha256" | tr -d ' ')"
ALL="$(sha256sum "$WORK/remote.sha256" | cut -c1-64)"
if diff -q "$WORK/remote.sha256" "$WORK/local.sha256" >/dev/null; then
  echo "drill: PASS $(date -u +%Y-%m-%dT%H:%MZ) commit ${COMMIT:0:7} branch $BRANCH; $FILES data files identical; digest $ALL; node $(node -v)"
else
  echo "drill: FAIL - built data differs:"; diff "$WORK/remote.sha256" "$WORK/local.sha256" | head -n 20; exit 1
fi
