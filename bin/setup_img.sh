#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  echo "Press ENTER to exit."
  read any
  exit 1
}

node setup_img.js || handle_error "Can't setup img!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] End."
echo "Press ENTER to exit."
read any
