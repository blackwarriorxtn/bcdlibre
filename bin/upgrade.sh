#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."
LAST_DIR=`dirname $0`

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] Start service"
  cd $LAST_DIR
  bash $LAST_DIR/start.sh
  echo "Press ENTER to exit."
  read any
  exit 1
}

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Stop service"
bash `dirname $0`/stop.sh

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade source code..."
cd `dirname $0`/..
git reset --hard || handle_error "Can't run 'git reset --hard'"
git pull || handle_error "Can't run 'git pull'"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrade software..."
bash `dirname $0`/upgrade_internal.sh || handle_error "Can't upgrade software!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Start service"
bash `dirname $0`/start.sh

MY_DESKTOP=$(xdg-user-dir DESKTOP 2>/dev/null)
if test -d "$MY_DESKTOP"
then
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] Copy shortcuts to Desktop"
  cp $LAST_DIR/*.desktop "$MY_DESKTOP/"
  if test ! -d "~/.local/share/applications/"
  then
    mkdir "~/.local/share/applications/"
  fi
  cp $LAST_DIR/*.desktop ~/.local/share/applications/
fi

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
cd $LAST_DIR

echo "Press ENTER to exit."
read any
