#!/bin/bash

cd `dirname $0`/..
node_modules/.bin/forever stop bin/www
