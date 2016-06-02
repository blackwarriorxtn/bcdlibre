#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  echo "Press ENTER to exit."
  read any
  exit 1
}

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Stop service"
bash `dirname $0`/stop.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade source code..."
cd `dirname $0`/..
git stash || handle_error "Can't run 'git stash'"
git pull || handle_error "Can't run 'git pull'"
git stash pop || handle_error "Can't run 'git stash pop'"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade software..."
bash bin/upgrade_internal.sh || handle_error "Can't upgrade software!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Start service"
bash bin/start.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."

echo "Press ENTER to exit."
read any
