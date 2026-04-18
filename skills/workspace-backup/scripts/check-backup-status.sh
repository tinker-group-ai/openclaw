#!/bin/bash
# check-backup-status.sh
# Heartbeat task: check if backup ran since last notification
# If fresh, send summary and mark as notified

WORKSPACE="${HOME}/.openclaw/workspace"
STATUS_FILE="${WORKSPACE}/.backup-status"
NOTIFIED_MARKER="${WORKSPACE}/.backup-notified"

[ -f "$STATUS_FILE" ] || exit 0

# Extract timestamp and summary from status file
IFS='|' read -r TIMESTAMP SUMMARY < "$STATUS_FILE"

# If we've already notified about this backup, skip
if [ -f "$NOTIFIED_MARKER" ]; then
  LAST_NOTIFIED=$(cat "$NOTIFIED_MARKER")
  if [ "$TIMESTAMP" = "$LAST_NOTIFIED" ]; then
    exit 0
  fi
fi

# New backup — format and send
TIME_FORMATTED=$(date -d "$TIMESTAMP" '+%I:%M %p' 2>/dev/null || echo "$TIMESTAMP")
MESSAGE="✅ Workspace backed up
📦 $SUMMARY
🕐 $TIME_FORMATTED"

echo "$MESSAGE"

# Mark this backup as notified
echo "$TIMESTAMP" > "$NOTIFIED_MARKER"
