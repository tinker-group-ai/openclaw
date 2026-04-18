#!/bin/bash
# check-activity.sh
# Detects if user interacted with OpenClaw in the last 24 hours
# Returns 0 (true) if activity detected, 1 (false) if idle

set -e

WORKSPACE="${HOME}/.openclaw/workspace"
MEMORY_FILE="${WORKSPACE}/MEMORY.md"
MEMORY_DIR="${WORKSPACE}/memory"

# Get yesterday's date (for checking if files were modified today)
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -d "1 day ago" +%Y-%m-%d)

# Check 1: MEMORY.md modified in last 24 hours
if [ -f "$MEMORY_FILE" ]; then
  MTIME=$(stat -c %Y "$MEMORY_FILE" 2>/dev/null || stat -f %m "$MEMORY_FILE" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  DIFF=$((NOW - MTIME))
  HOURS=$((DIFF / 3600))
  
  if [ "$HOURS" -lt 24 ]; then
    echo "[check-activity] MEMORY.md modified ${HOURS}h ago — activity detected" >&2
    exit 0
  fi
fi

# Check 2: Daily memory file exists for today
DAILY_LOG="${MEMORY_DIR}/${TODAY}.md"
if [ -f "$DAILY_LOG" ]; then
  echo "[check-activity] Daily log ${TODAY}.md exists — activity detected" >&2
  exit 0
fi

# Check 3: Git changes in workspace since last backup commit with marker
cd "$WORKSPACE"

# Look for our marker in git log (if workspace is a git repo)
if [ -d ".git" ]; then
  # Check if there are uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    echo "[check-activity] Uncommitted changes in workspace — activity detected" >&2
    exit 0
  fi
  
  # Check if there are commits since yesterday
  RECENT_COMMITS=$(git log --since="$YESTERDAY" --oneline 2>/dev/null | wc -l)
  if [ "$RECENT_COMMITS" -gt 0 ]; then
    echo "[check-activity] $RECENT_COMMITS commits since $YESTERDAY — activity detected" >&2
    exit 0
  fi
fi

# Check 4: OpenClaw sessions in last 24h (check for recent session logs)
SESSION_DIR="${WORKSPACE}/sessions" 2>/dev/null || true
if [ -d "$SESSION_DIR" ]; then
  RECENT_SESSIONS=$(find "$SESSION_DIR" -type f -mtime -1 2>/dev/null | wc -l)
  if [ "$RECENT_SESSIONS" -gt 0 ]; then
    echo "[check-activity] $RECENT_SESSIONS recent session(s) — activity detected" >&2
    exit 0
  fi
fi

# No activity detected
echo "[check-activity] No activity in last 24h — skipping backup" >&2
exit 1
