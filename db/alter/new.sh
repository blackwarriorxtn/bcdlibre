#!/bin/bash

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

SQL_FOLDER=`dirname $0`/`date +'%Y'`
# Need millisecondes like on Windows
MS=`date +%3N`
SQL_FILE_NAME="`date +'%Y%m%d.'`${HOSTNAME}.${USER}.`date +'%H%M%S.'`$MS.sql"
SQL_FILE="$SQL_FOLDER/$SQL_FILE_NAME"
echo $SQL_FILE

if test ! -d "$SQL_FOLDER"
then
  mkdir "$SQL_FOLDER" || handle_error "Can't create folder $SQL_FOLDER"
fi

cat >$SQL_FILE <<EOF

ALTER TABLE TODO
ADD COLUMN TODO,
ADD INDEX TODO
;
EOF

# Automatically open with text editor, if EDITOR environment variable is set
if test "$EDITOR" != ""
then
  $EDITOR "$SQL_FILE"
fi
