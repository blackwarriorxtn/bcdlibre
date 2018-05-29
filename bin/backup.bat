@ECHO OFF

REM       Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)
REM
REM   Licensed under the Apache License, Version 2.0 (the "License");
REM   you may not use this file except in compliance with the License.
REM   You may obtain a copy of the License at
REM
REM      http://www.apache.org/licenses/LICENSE-2.0
REM
REM   Unless required by applicable law or agreed to in writing, software
REM   distributed under the License is distributed on an "AS IS" BASIS,
REM   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
REM   See the License for the specific language governing permissions and
REM   limitations under the License.

ECHO [%DATE% %TIME%] %~n0: Begin...
SET DB_NAME=bibliopuce
CALL %~dp0date.bat
REM Create directory tree %DB_NAME%-backup\%MY_YEAR%\%MY_MONTH%\%MY_DAY%
SET BACKUP_PATH=%~dp0..\..\%DB_NAME%-backup\%MY_YEAR%\%MY_MONTH%\%MY_DAY%
IF NOT EXIST %BACKUP_PATH% MKDIR %BACKUP_PATH% || GOTO ERROR
SET BACKUP_FILE_SQL=%BACKUP_PATH%\%MY_YEAR%%MY_MONTH%%MY_DAY%.%MY_HOUR%%MY_MINUTE%%MY_SECOND%.%MY_MILLISECOND%.%DB_NAME%.backup.sql
SET BACKUP_FILE_ZIP=%BACKUP_FILE_SQL%

REM If there's an environment variable MYSQL_ROOT_PASSWORD, use it as the root password (otherwise ask for password interactively)
IF "%MYSQL_ROOT_PASSWORD%" == "" GOTO NO_PASSWORD
:USE_PASSWORD
REM Use MySQL specific environment variable
REM Note: this is considered insecure (some system the "ps" command can view environment variables)
REM TODO use mysql configuration files instead (see https://dev.mysql.com/doc/refman/5.5/en/password-security-user.html)
SET MYSQL_PWD=%MYSQL_ROOT_PASSWORD%
GOTO POST_SET_PASSWORD
:NO_PASSWORD
SET PASSWORD_OPTION=--password
GOTO POST_SET_PASSWORD

:POST_SET_PASSWORD

REM Check that MySQL is up and running (need this to backup via mysqldump)
CALL %~dp0mysql_ping.bat || GOTO ERROR

ECHO [%DATE% %TIME%] mysqldump...
mysqldump --user=root %PASSWORD_OPTION% --lock-all-tables %DB_NAME% --result-file=%BACKUP_FILE_SQL% || GOTO ERROR

REM If 7-zip is installed, use it to compress the backup file
SET SEVENZIP_EXE=NULL
IF EXIST "%ProgramFiles%\7-Zip\7z.exe" SET SEVENZIP_EXE=%ProgramFiles%\7-Zip\7z.exe
IF NOT EXIST "%SEVENZIP_EXE%" GOTO POST_ZIP
:ZIP
SET BACKUP_FILE_ZIP=%BACKUP_FILE_SQL%.gz
ECHO [%DATE% %TIME%] Compressing...
"%SEVENZIP_EXE%" a -sdel "%BACKUP_FILE_ZIP%" "%BACKUP_FILE_SQL%" || GOTO ERROR

REM Compress images (tar + gz)
SET BACKUP_FILE_IMG=%BACKUP_PATH%\%MY_YEAR%%MY_MONTH%%MY_DAY%.%MY_HOUR%%MY_MINUTE%%MY_SECOND%.%MY_MILLISECOND%.%DB_NAME%.backup.img
CD %~dp0..
"%SEVENZIP_EXE%" a -r "%BACKUP_FILE_IMG%.tar" public\img\item || GOTO ERROR
"%SEVENZIP_EXE%" a -sdel "%BACKUP_FILE_IMG%.tar.gz" "%BACKUP_FILE_IMG%.tar" || GOTO ERROR


:POST_ZIP

:END
ECHO [%DATE% %TIME%] Database %DB_NAME% backup done in file:
ECHO   "%BACKUP_FILE_ZIP%"
ECHO [%DATE% %TIME%] %~n0: End.
EXIT /b 0

:ERROR
ECHO [%DATE% %TIME%] %~n0: ERROR! >&2
PAUSE
EXIT /b 1
