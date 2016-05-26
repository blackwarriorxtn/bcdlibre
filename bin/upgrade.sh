#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Stop service"
bash `dirname $0`/stop.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade source code..."
cd `dirname $0`/..
git pull || handle_error "Can't run 'git pull'"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade software..."
bash bin/upgrade_internal.sh || handle_error "Can't upgrade software!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Start service"
bash bin/start.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."

echo "Press ENTER to exit."
read any
