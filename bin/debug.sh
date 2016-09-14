#!/bin/bash

cd `dirname $0`/..
# Stop running process, if any
bash bin/stop.sh
# Enable debugging
DEBUG=bibliopuce:*

# Start application via node
cd `dirname $0`/..
node bin/www

