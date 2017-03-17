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

# Create (or update) application shortcuts
bash `dirname $0`/setup_shortcuts.sh || handle_error "Can't setup application shortcuts!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
