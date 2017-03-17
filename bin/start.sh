#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : Begin..."

cd `dirname $0`/..
# Start express module and restart it after 1 sec if it crashes
node_modules/.bin/forever --minUptime 1000 --spinSleepTime 1000 start bin/www

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
