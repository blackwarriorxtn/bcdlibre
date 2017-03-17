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
bash `dirname $0`/../setup/setup_mysql.sh || handle_error "Can't configure mysql!"

cd `dirname $0`/..
# upgrade database structure, if needed : execute db/alter/*.sql (only once - store alter exection in MySQL db itself)
bash `dirname $0`/../db/alter/exec.sh || handle_error "Can't upgrade database structure!"

MY_DESKTOP=$(xdg-user-dir DESKTOP 2>/dev/null)
if test -d "$MY_DESKTOP"
then
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] Copy shortcuts to Desktop"
  if test ! -d ~/.local/share/applications/
  then
    mkdir ~/.local/share/applications/
  fi
  for S in $LAST_DIR/*.desktop
  do
    SHORTCUT_NAME=`basename $S`
    SHORTCUT_DIFF="0"
    if test -f "$MY_DESKTOP/$SHORTCUT_NAME"
    then
      diff $S "$MY_DESKTOP/$SHORTCUT_NAME" >/dev/null
      SHORTCUT_DIFF=$?
    else
      # No shortcut file : we need to install it
      SHORTCUT_DIFF=1
    fi
    if test "$SHORTCUT_DIFF" == "0"
    then
      echo "Shortcut $SHORTCUT_NAME : no changes"
    else
      echo "Shortcut $SHORTCUT_NAME : copying"
      cp $S "$MY_DESKTOP/"
      chmod u+x "$MY_DESKTOP/*.desktop"
      cp $S ~/.local/share/applications/
      chmod u+x ~/.local/share/applications/*.desktop
    fi
  done

fi

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
