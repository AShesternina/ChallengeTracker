#!/bin/bash
set -e
TODAY=$(date +%Y-%m-%d)
BACKUP_DIR=/opt/backups
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

docker exec challengetracker-db-1 pg_dump -U ct_user challengetracker | gzip > "$BACKUP_DIR/db_$TODAY.gz"

find "$BACKUP_DIR" -name "db_*.gz" -type f | sort | head -n -$KEEP_DAYS | xargs -r rm -f

echo "[$(date)] Backup done: $BACKUP_DIR/db_$TODAY.gz ($(du -sh $BACKUP_DIR/db_$TODAY.gz | cut -f1))"
