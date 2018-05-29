#!/bin/bash

#       Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)
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

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : Begin..."
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

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
cd $LAST_DIR

