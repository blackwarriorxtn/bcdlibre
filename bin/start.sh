#!/bin/bash

cd `dirname $0`/..
node_modules/.bin/forever start bin/www
