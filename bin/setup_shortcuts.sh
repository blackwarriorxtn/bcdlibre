#!/bin/bash

#       Copyright 2016-2017 Replay SDK (http://www.replay-sdk.com)
# 
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
# 
#      http://www.apache.org/licenses/LICENSE-2.0
# 
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."
LAST_DIR=`dirname $0`

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

# Copy bootstrap files in /usr/bin
for S in `dirname $0`/../setup/usr/bin/*
do
  SHORTCUT_NAME=`basename $S`
  if test ! -f /usr/bin/$SHORTCUT_NAME
  then
    echo "Shortcut $SHORTCUT_NAME : installing /usr/bin/$SHORTCUT_NAME"
    sudo cp $S /usr/bin/$SHORTCUT_NAME
    sudo chmod ug+x /usr/bin/$SHORTCUT_NAME
  else
    # shortcut already exists: copy it only if different
    SHORTCUT_DIFF="0"
    diff $S /usr/bin/$SHORTCUT_NAME >/dev/null
    SHORTCUT_DIFF=$?
    if test "$SHORTCUT_DIFF" == "0"
    then
      echo "Shortcut $SHORTCUT_NAME : no changes"
    else
      echo "Shortcut $SHORTCUT_NAME : upgrade in /usr/bin"
      cp $S /usr/bin/$SHORTCUT_NAME
      chmod ug+x /usr/bin/$SHORTCUT_NAME
    fi
  fi
done

# Copy shortcuts in Desktop folders
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
      cp $S "$MY_DESKTOP/$SHORTCUT_NAME"
      chmod ug+x "$MY_DESKTOP/$SHORTCUT_NAME"
      cp $S ~/.local/share/applications/$SHORTCUT_NAME
      chmod ug+x ~/.local/share/applications/$SHORTCUT_NAME
    fi
  done

fi

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
