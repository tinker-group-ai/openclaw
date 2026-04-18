---
name: workspace-backup
description: Automated daily backup of workspace to GitHub (tinker-group-ai/agent-tai) in workspace-backup folder. Runs only on interaction days. Use when: (1) setting up daily backups, (2) configuring cron job for 4:30 AM Chicago time.
---

# Workspace Backup Skill

Daily backup to GitHub—only on days you actually interact. No noise on idle days.

Includes custom scripts in `~/.openclaw/workspace/scripts/` so you can restore them if reset.

## Setup (One Command)

**Prerequisite:** SSH key added to GitHub (required for cron to work without prompting)

```bash
bash ~/code/projects/openclaw/skills/workspace-backup/scripts/setup.sh
```

That's it. Installs scripts, configures GitHub repo, sets up cron at 4:30 AM.

## How It Works

1. **4:30 AM daily** — cron triggers backup script
2. **Activity check** — looks at MEMORY.md, daily logs, git changes
3. **No activity?** — exits silently, no commit
4. **Activity found?** — syncs workspace to GitHub, pushes with summary to `.backup-status`
5. **Next heartbeat** — `check-backup-status.sh` reads the status file, sends notification if fresh, marks as notified

Writes status to `~/.openclaw/workspace/.backup-status` with timestamp + file counts.

## Files

- `check-activity.sh` — Detects if you've interacted today
- `backup-to-github.sh` — Syncs and commits to GitHub
- `check-backup-status.sh` — Reads backup status, sends notification at heartbeat if fresh
- `setup.sh` — Automates all setup

## Restore After Reset

If your workspace gets reset, pull from backup:

```bash
git clone git@github.com:tinker-group-ai/agent-tai.git /tmp/restore
cp -r /tmp/restore/workspace-backup/scripts ~/.openclaw/workspace/
```

All custom scripts restored.

## Heartbeat Integration

Automatically triggered every 2 hours via OpenClaw heartbeat:

- Runs `check-backup-status.sh`
- If backup ran since last notification, sends summary to you
- Marks it notified to avoid duplicates

Add to `HEARTBEAT.md`:

```
## Backup Notification
- Run `check-backup-status.sh` — if output, send it as message
```

## Verify

```bash
# Check cron is set
crontab -l | grep backup

# Watch logs
tail -f ~/.openclaw/workspace/.backup-log

# Manual test
~/.openclaw/workspace/backup-to-github.sh

# Test notification
~/.openclaw/workspace/check-backup-status.sh
```
