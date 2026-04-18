#!/bin/bash
# setup.sh
# Fully automated setup for workspace backup
# Installs scripts, configures git, and sets up cron job

set -e

WORKSPACE="${HOME}/.openclaw/workspace"
BACKUP_REPO="${HOME}/.openclaw/backup-repo"
GITHUB_REPO="git@github.com:tinker-group-ai/agent-tai.git"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  echo "[setup] $*"
}

log "Starting automated backup setup..."

# Step 1: Copy scripts to workspace
log "Installing scripts to $WORKSPACE..."
cp "$SKILL_DIR/scripts/check-activity.sh" "$WORKSPACE/"
cp "$SKILL_DIR/scripts/backup-to-github.sh" "$WORKSPACE/"
cp "$SKILL_DIR/scripts/check-backup-status.sh" "$WORKSPACE/"
chmod +x "$WORKSPACE/check-activity.sh" "$WORKSPACE/backup-to-github.sh" "$WORKSPACE/check-backup-status.sh"
log "✓ Scripts installed"

# Step 2: Initialize backup repo
log "Setting up GitHub backup repo..."
if [ ! -d "$BACKUP_REPO" ]; then
  mkdir -p "$BACKUP_REPO"
  cd "$BACKUP_REPO"
  git init
  git remote add origin "$GITHUB_REPO"
  log "✓ Repo initialized"
else
  cd "$BACKUP_REPO"
  log "✓ Repo already exists"
fi

# Try to pull to verify access (won't fail even if repo doesn't exist yet)
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true

# Step 3: Add cron job (4:30 AM Chicago time)
log "Setting up cron job (4:30 AM daily)..."

CRON_JOB="30 4 * * * $WORKSPACE/backup-to-github.sh >> $WORKSPACE/.backup-log 2>&1"
CRON_CMD="(crontab -l 2>/dev/null | grep -v 'backup-to-github.sh'; echo '$CRON_JOB') | crontab -"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-to-github.sh"; then
  log "✓ Cron job already configured"
else
  eval "$CRON_CMD"
  log "✓ Cron job added (4:30 AM)"
fi

# Step 4: Create initial log file
touch "$WORKSPACE/.backup-log"
log "✓ Log file ready: $WORKSPACE/.backup-log"

log ""
log "=== Setup Complete ==="
log ""
log "Backup will run daily at 4:30 AM Chicago time"
log "Only backs up on days you interact with OpenClaw"
log ""
log "To verify:"
log "  - Check cron: crontab -l | grep backup"
log "  - Watch logs: tail -f $WORKSPACE/.backup-log"
log "  - Manual test: $WORKSPACE/backup-to-github.sh"
log ""
