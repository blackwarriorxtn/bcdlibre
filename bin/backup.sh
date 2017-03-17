#!/bin/bash

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
  PASSWORD_OPTION=--password=$MYSQL_ROOT_PASSWORD
fi
mysqldump --user=root $PASSWORD_OPTION --lock-all-tables $DB_NAME --result-file=$BACKUP_FILE_SQL || handle_error "Can't dump mysql database!"

gzip $BACKUP_FILE_SQL || handle_error "Can't compress mysql dump with gzip"
echo "[`date +'%Y-%m-%d %H:%M:%S'`] Database $DB_NAME backup done in file:"
echo "$BACKUP_FILE_ZIP"

BACKUP_FILE_IMG=$BACKUP_PATH/$DATE_NOW.$DB_NAME.backup.img.tar.gz
cd `dirname $0`/..
tar -cvzf $BACKUP_FILE_IMG public/img/item || handle_error "Can't archive and compress images!"

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
