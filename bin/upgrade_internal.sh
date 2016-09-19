#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."
LAST_DIR=`dirname $0`

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

bash `dirname $0`/../setup/setup_node_modules.sh || handle_error "Can't install node modules!"

cd `dirname $0`/..
# upgrade database structure, if needed : execute db/alter/*.sql (only once - store alter exection in MySQL db itself)
bash `dirname $0`/../db/alter/exec.sh || handle_error "Can't upgrade database structure!"

MY_DESKTOP=$(xdg-user-dir DESKTOP 2>/dev/null)
if test -d "$MY_DESKTOP"
then
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] Copy shortcuts to Desktop"
  echo "cp $LAST_DIR/*.desktop $MY_DESKTOP/"
  cp $LAST_DIR/*.desktop "$MY_DESKTOP/"
  if test ! -d ~/.local/share/applications/
  then
    mkdir ~/.local/share/applications/
  fi
  cp $LAST_DIR/*.desktop ~/.local/share/applications/
fi

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
