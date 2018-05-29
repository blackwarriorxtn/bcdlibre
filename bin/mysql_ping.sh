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

# If there's an environment variable MYSQL_ROOT_PASSWORD, use it as the root password (otherwise ask for password interactively)
PASSWORD_OPTION=--password
if test "$MYSQL_ROOT_PASSWORD" != ""
then
  # Use MySQL specific environment variable
  # Note: this is considered insecure (some system the "ps" command can view environment variables)
  # TODO use mysql configuration files instead (see https://dev.mysql.com/doc/refman/5.5/en/password-security-user.html)
  export MYSQL_PWD=$MYSQL_ROOT_PASSWORD
  PASSWORD_OPTION=""
fi

# Check that MySQL is up and running (need this to backup via mysqldump)
for i in 1 2 3 4 5 6 7 8 9 10
do 
  echo "[`date +'%Y-%m-%d %H:%M:%S'`] Loop ${i}..."
  if test $i == 10
  then
    mysqladmin --user=root $PASSWORD_OPTION ping
  else
    mysqladmin --user=root $PASSWORD_OPTION ping 1>/dev/null 2>/dev/null
  fi
  if test "$?" == "0"
  then
    echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : End."
    exit 0
  fi
done

echo "[`date +'%Y-%m-%d %H:%M:%S'`] `basename $0` : ERROR!"
exit 1
