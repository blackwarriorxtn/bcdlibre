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
DATE_NOW=`date +'%Y%m%d.%H%M%S.%N'`
YYYYMMDD=`date +'%Y/%m/%d'`
# Create directory tree $DB_NAME-backup/YYYY/MM/DD/
BACKUP_PATH=`dirname $0`/../../$DB_NAME-backup/$YYYYMMDD
if test ! -d $BACKUP_PATH
then
  mkdir -p "$BACKUP_PATH" || handle_error "Can't create backup path $BACKUP_PATH"
fi
BACKUP_FILE_SQL=$BACKUP_PATH/$DATE_NOW.$DB_NAME.backup.sql
BACKUP_FILE_ZIP=$BACKUP_FILE_SQL.gz
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

# Check that MySQL is up and running (need this to backup via mysqldump)
bash `dirname $0`/mysql_ping.sh || handle_error "MySQL is not running!"
# Backup database via mysqldump
mysqldump --user=root $PASSWORD_OPTION --lock-all-tables $DB_NAME --result-file=$BACKUP_FILE_SQL || handle_error "Can't dump mysql database!"

gzip $BACKUP_FILE_SQL || handle_error "Can't compress mysql dump with gzip"
echo "[`date +'%Y-%m-%d %H:%M:%S'`] Database $DB_NAME backup done in file:"
echo "$BACKUP_FILE_ZIP"

BACKUP_FILE_IMG=$BACKUP_PATH/$DATE_NOW.$DB_NAME.backup.img.tar.gz
cd `dirname $0`/..
tar -cvzf $BACKUP_FILE_IMG public/img/item || handle_error "Can't archive and compress images!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
