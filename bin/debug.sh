#!/bin/bash

cd `dirname $0`/..
# Stop running process, if any
bash bin/stop.sh 1>/dev/null 2>/dev/null
# Enable debugging
DEBUG=bibliopuce:*

# Start application via node
echo "Debugging application..."
cd `dirname $0`/..
# Use port 5858 for debugging, compatible with atom-node-debugger (https://github.com/kiddkai/atom-node-debugger)
# Install atom editor (https://atom.io/) then install debugger with "apm install node-debugger" and debug with "Attach" command
node --debug=5858 bin/www
