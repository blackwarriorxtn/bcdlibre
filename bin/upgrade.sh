#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Stop service"
bash bin/stop.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade source code..."
cd `dirname $0`/..
git pull || handle_error "Can't run 'git pull'"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade software..."
# TODO : upgrade database structure, if needed : execute db/alter/*.sql (only once - store alter exection in MySQL db)
bash bin/upgrade_internal.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Start service"
bash bin/start.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
