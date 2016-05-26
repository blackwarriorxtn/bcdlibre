#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrading database (if needed)..."

cd `dirname $0`
node exec.js

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Upgrading database : End."
