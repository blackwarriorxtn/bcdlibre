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

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  echo "Press ENTER to exit."
  read any
  exit 1
}

cd `dirname $0` || handle_error "Can't change directory!"
node setup_img.js || handle_error "Can't setup img!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
echo "Press ENTER to exit."
read any
