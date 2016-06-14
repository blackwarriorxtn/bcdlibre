#!/bin/bash

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0`: Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  read any
  exit 1
}

# Start VPN
sudo openvpn --config /etc/openvpn/tun0.conf --verb 6 || handle_error "Can't start OpenVPN"
