#!/bin/bash

#       Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)
# 
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
# 
#      http://www.apache.org/licenses/LICENSE-2.0
# 
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : Begin..."

# Define error handling function
handle_error()
{
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] ERROR: $1" >&2
  exit 1
}

DB_NAME=bibliopuce
# Find backup file in super-directory (../../*.backup.sql.gz)
BACKUP_FILE_SQL_GZ=`dirname $0`../../*.bibliopuce.backup.sql.gz
BACKUP_FILE_SQL=`dirname $0`../../*.bibliopuce.backup.sql
if test ! -f "$BACKUP_FILE_SQL_GZ"
then
  echo "ERROR: File not found: $BACKUP_FILE_SQL_GZ" >&2
  exit 1
fi

gunzip $BACKUP_FILE_SQL_GZ || handle_error "Can't uncompress mysql dump $BACKUP_FILE_SQL_GZ with gzip"
echo "[`date +'%Y-%m-%d %H:%M:%S'`] MySQL dump uncompressed successfully"
BACKUP_FILE_SQL=`dirname $0`../../*.bibliopuce.backup.sql
if test ! -f "$BACKUP_FILE_SQL"
then
  echo "ERROR: File not found: $BACKUP_FILE_SQL" >&2
  exit 1
fi

# If there's an environment variable MYSQL_ROOT_PASSWORD, use it as the root password (otherwise ask for password interactively)
PASSWORD_OPTION=--password
if test "$MYSQL_ROOT_PASSWORD" != ""
then
  # Use MySQL specific environment variable
  # Note: this is considered insecure (on some systems the "ps" command can view environment variables)
  # TODO use mysql configuration files instead (see https://dev.mysql.com/doc/refman/5.5/en/password-security-user.html)
  export MYSQL_PWD=$MYSQL_ROOT_PASSWORD
  PASSWORD_OPTION=""
fi

# Check that MySQL is up and running (need this to restore via mysql)
bash `dirname $0`/mysql_ping.sh || handle_error "MySQL is not running!"
# Restore database via mysql command line
mysql --database="$DB_NAME" --default-character-set=utf8 --user=root $PASSWORD_OPTION < "$BACKUP_FILE_SQL" || handle_error "Can't restore mysql database!"

# TODO restore images

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
