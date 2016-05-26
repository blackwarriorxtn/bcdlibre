#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

cd `dirname $0`
node exec.js

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
