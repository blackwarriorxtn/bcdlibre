#!/bin/bash

cd `dirname $0`/..
# Stop running process, if any
bash bin/stop.sh 1>/dev/null 2>/dev/null
# Enable debugging
DEBUG=bibliopuce:*

# Start application via node
echo "Debugging application..."
cd `dirname $0`/..
node bin/www
