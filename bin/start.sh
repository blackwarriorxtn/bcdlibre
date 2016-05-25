#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

MY_LOG=`dirname $0`/../../bibliopuce.log
MY_ERR=`dirname $0`/../../bibliopuce.err

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >>$MY_ERR
  exit 1
}

cd `dirname $0`/.. || handle_error "Can't change to runtime directory"
npm start 1>>$MY_LOG 2>>$MY_ERR || handle_error "Can't start npm" &

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
