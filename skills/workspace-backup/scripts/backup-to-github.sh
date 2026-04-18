#!/bin/bash
# backup-to-github.sh
# Backs up OpenClaw workspace to GitHub (tinker-group-ai/agent-tai)
# Only runs if activity was detected in the last 24 hours
# Designed to run daily via cron at 4:30 AM Chicago time

set -e

WORKSPACE="${HOME}/.openclaw/workspace"
BACKUP_REPO="${HOME}/.openclaw/backup-repo"
GITHUB_REPO="git@github.com:tinker-group-ai/agent-tai.git"
BACKUP_FOLDER="workspace-backup"
LOG_FILE="${WORKSPACE}/.backup-log"
MARKER_FILE="${WORKSPACE}/.last-backup"
NOTIFICATION_QUEUE="${WORKSPACE}/.backup-notification-queue"

# Initialize log
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== Backup Start ==="

# Step 1: Check for activity
ACTIVITY_SCRIPT="${WORKSPACE}/check-activity.sh"
if [ ! -f "$ACTIVITY_SCRIPT" ]; then
  log "ERROR: check-activity.sh not found at $ACTIVITY_SCRIPT"
  exit 1
fi

if ! bash "$ACTIVITY_SCRIPT"; then
  log "No activity detected — backup skipped"
  exit 0
fi

# Step 2: Clone or update backup repo
if [ ! -d "$BACKUP_REPO" ]; then
  log "Cloning backup repo..."
  git clone "$GITHUB_REPO" "$BACKUP_REPO" 2>&1 | tee -a "$LOG_FILE"
fi

cd "$BACKUP_REPO"

# Ensure we're on main/master
MAIN_BRANCH=$(git remote show origin | grep "HEAD branch:" | awk '{print $NF}' || echo "main")
log "Using branch: $MAIN_BRANCH"
git checkout "$MAIN_BRANCH" 2>&1 | tee -a "$LOG_FILE" || git checkout -b "$MAIN_BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Pull latest to avoid conflicts
log "Pulling latest from remote..."
git pull origin "$MAIN_BRANCH" 2>&1 | tee -a "$LOG_FILE" || true

# Step 3: Sync workspace to backup folder
log "Syncing workspace to $BACKUP_FOLDER..."

# Create backup folder if needed
mkdir -p "$BACKUP_FOLDER"

# rsync workspace to backup folder, excluding git/cache/sensitive files
rsync -av \
  --exclude '.git' \
  --exclude '.openclaw' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude '__pycache__' \
  --exclude '.pytest_cache' \
  --delete \
  "${WORKSPACE}/" "${BACKUP_REPO}/${BACKUP_FOLDER}/" 2>&1 | tee -a "$LOG_FILE"

# Step 4: Commit and push
cd "$BACKUP_REPO"

if git diff-index --quiet HEAD --; then
  log "No changes to commit — backup skipped"
  exit 0
fi

log "Committing changes..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git add -A

# Count files changed
FILES_ADDED=$(git diff --cached --name-only --diff-filter=A | wc -l)
FILES_MODIFIED=$(git diff --cached --name-only --diff-filter=M | wc -l)
FILES_DELETED=$(git diff --cached --name-only --diff-filter=D | wc -l)
TOTAL_FILES=$((FILES_ADDED + FILES_MODIFIED + FILES_DELETED))

git commit -m "Backup: $TIMESTAMP (automated daily sync)" 2>&1 | tee -a "$LOG_FILE"

log "Pushing to GitHub..."
git push origin "$MAIN_BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Mark backup time and write status file
echo "$TIMESTAMP" > "$MARKER_FILE"

STATUS_FILE="${WORKSPACE}/.backup-status"
SUMMARY="$FILES_ADDED added, $FILES_MODIFIED modified, $FILES_DELETED deleted"
echo "$TIMESTAMP|$SUMMARY" > "$STATUS_FILE"

log "Backup complete: $TIMESTAMP ($SUMMARY)"
log "=== Backup End ==="
