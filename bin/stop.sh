#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : Begin..."

cd `dirname $0`/..
node_modules/.bin/forever stop bin/www

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
