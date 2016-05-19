@ECHO OFF
ECHO [%DATE% %TIME%] %~n0: Begin...

SET DB_NAME=bibliopuce
CALL %~dp0date.bat
REM Create directory tree %DB_NAME%-backup\%MY_YEAR%\%MY_MONTH%\%MY_DAY%
SET BACKUP_PATH=%~dp0..\..\%DB_NAME%-backup\%MY_YEAR%\%MY_MONTH%\%MY_DAY%
IF NOT EXIST %BACKUP_PATH% MKDIR %BACKUP_PATH% || GOTO ERROR
SET BACKUP_FILE_SQL=%BACKUP_PATH%\%MY_YEAR%%MY_MONTH%%MY_DAY%.%MY_HOUR%%MY_MINUTE%%MY_SECOND%.%MY_MILLISECOND%.%DB_NAME%.backup.sql
SET BACKUP_FILE_ZIP=%BACKUP_FILE_SQL%
REM If there's an environment variable MYSQL_ROOT_PASSWORD, use it as the root password (otherwise ask for password interactively)
SET PASSWORD_OPTION=--password
IF NOT "%MYSQL_ROOT_PASSWORD%" == "" SET PASSWORD_OPTION=--password=%MYSQL_ROOT_PASSWORD%
ECHO [%DATE% %TIME%] mysqldump...
mysqldump --user=root %PASSWORD_OPTION% --lock-all-tables %DB_NAME% --result-file=%BACKUP_FILE_SQL% || GOTO ERROR

REM If 7-zip is installed, use it to compress the backup file
SET SEVENZIP_EXE=NULL
IF EXIST "%ProgramFiles%\7-Zip\7z.exe" SET SEVENZIP_EXE=%ProgramFiles%\7-Zip\7z.exe
IF NOT EXIST "%SEVENZIP_EXE%" GOTO POST_ZIP
:ZIP
SET BACKUP_FILE_ZIP=%BACKUP_FILE_SQL%.7z
ECHO [%DATE% %TIME%] Compressing...
"%SEVENZIP_EXE%" a -sdel "%BACKUP_FILE_ZIP%" "%BACKUP_FILE_SQL%" || GOTO ERROR
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
