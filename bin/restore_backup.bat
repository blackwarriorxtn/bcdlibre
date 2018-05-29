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

SET BACKUP_SQL=%~1

IF NOT "%BACKUP_SQL%" == "" IF EXIST "%BACKUP_SQL%" GOTO RESTORE_SQL

REM Backup files must be in folder just above source code (bcdlibre/..)
REM Note: sort by date (DIR /OD) and take the last file found
FOR /F "usebackq" %%F IN (`DIR /OD/B %~dps0..\..\*.bibliopuce.backup.sql`) DO SET BACKUP_SQL=%~dps0..\..\%%F

IF NOT EXIST "%BACKUP_SQL%" GOTO ERROR_NOT_FOUND

:RESTORE_SQL
ECHO [%DATE% %TIME%] Restore sql "%BACKUP_SQL%"...
mysql --user=root --password=%MYSQL_ROOT_PASSWORD% --database=bibliopuce < %BACKUP_SQL%
PAUSE
EXIT /b 0

:ERROR_NOT_FOUND
ECHO [%DATE% %TIME%] ERROR: File not found: "%BACKUP_SQL%"
PAUSE
EXIT /b 1

