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

cd `dirname $0`/..
# Stop running process, if any
bash bin/stop.sh 1>/dev/null 2>/dev/null
# Enable debugging
export DEBUG=bibliopuce:*

# Start application via node
echo "Debugging application..."
cd `dirname $0`/..
# Use port 5858 for debugging, compatible with atom-node-debugger (https://github.com/kiddkai/atom-node-debugger)
# Install atom editor (https://atom.io/) then install debugger with "apm install node-debugger" and debug with "Attach" command
node --debug=5858 bin/www
