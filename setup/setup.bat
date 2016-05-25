@ECHO OFF
ECHO [%DATE% %TIME%] %~n0: Begin...

ECHO [%DATE% %TIME%] Check prerequisites...
ECHO [%DATE% %TIME%] nodejs
%COMSPEC% /C npm help 1>NUL 2>NUL || GOTO ERROR_PREREQUESITES
ECHO [%DATE% %TIME%] mysql
mysql --help 1>NUL 2>NUL || GOTO ERROR_PREREQUESITES
ECHO [%DATE% %TIME%] git
git help 1>NUL 2>NUL || GOTO ERROR_PREREQUESITES

REM TODO: SHOW ENGINES => check InnoDB AND MyISAM

cd /D %~dp0..\ || GOTO ERROR

ECHO [%DATE% %TIME%] Options...
SET /P MYSQL_ROOT_PASSWORD=MySQL root password [%MYSQL_ROOT_PASSWORD%] ?
IF "%DEFAULT_MYSQL_CREATE_SAMPLE%" == "" SET DEFAULT_MYSQL_CREATE_SAMPLE=y
SET /P MYSQL_CREATE_SAMPLE=Create sample data [%DEFAULT_MYSQL_CREATE_SAMPLE%] ?
IF "%MYSQL_CREATE_SAMPLE%" == "" SET MYSQL_CREATE_SAMPLE=%DEFAULT_MYSQL_CREATE_SAMPLE%
IF "%MYSQL_CREATE_SAMPLE%" == "Y" SET MYSQL_CREATE_SAMPLE=y

ECHO [%DATE% %TIME%] Install node modules...
%COMSPEC% /C npm install express || GOTO ERROR
%COMSPEC% /C npm install mysql || GOTO ERROR
%COMSPEC% /C npm install ejs || GOTO ERROR
%COMSPEC% /C npm install serve-favicon || GOTO ERROR
%COMSPEC% /C npm install morgan || GOTO ERROR
%COMSPEC% /C npm install cookie-parser || GOTO ERROR
%COMSPEC% /C npm install body-parser || GOTO ERROR
%COMSPEC% /C npm install debug || GOTO ERROR
%COMSPEC% /C npm install async || GOTO ERROR
%COMSPEC% /C npm install request || GOTO ERROR
%COMSPEC% /C npm install i18n-2 || GOTO ERROR
%COMSPEC% /C npm install forever || GOTO ERROR
REM (MAYBE)%COMSPEC% /C npm install apac@latest || GOTO ERROR

ECHO [%DATE% %TIME%] Create MySQL database...
REM TODO reuse password from configuration
mysql --default-character-set=utf8 --user=root --password=%MYSQL_ROOT_PASSWORD% < db/create_database.sql || GOTO ERROR
IF NOT "%MYSQL_CREATE_SAMPLE%" == "y" GOTO POST_CREATE_SAMPLE
:CREATE_SAMPLE
mysql --default-character-set=utf8 --user=root --password=%MYSQL_ROOT_PASSWORD% < db/insert_sample_data.sql || GOTO ERROR
:POST_CREATE_SAMPLE

:END
ECHO [%DATE% %TIME%] %~n0: End.
CALL %~dp0..\bin\start.bat
EXIT /b 0

:ERROR
ECHO [%DATE% %TIME%] %~n0: ERROR! >&2
PAUSE
EXIT /b 1

:ERROR_PREREQUESITES
ECHO [%DATE% %TIME%] Prerequites error >&2
ECHO [%DATE% %TIME%] Please install prerequisites: >&2
ECHO [%DATE% %TIME%]  * nodejs (https://nodejs.org) >&2
ECHO [%DATE% %TIME%]  * mysql community server (http://dev.mysql.com/downloads/) >&2
PAUSE
EXIT /b 2
