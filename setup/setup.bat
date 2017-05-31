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

%COMSPEC% /C %~dp0setup_node_modules.bat || GOTO ERROR

REM TODO setup_mysql.bat
REM configure MySQL: (my.ini)
REM   ft_min_word_len=1
REM   ft_stopword_file= empty or based on system default language list
REM   sql_mode='STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'

ECHO [%DATE% %TIME%] Create MySQL database...
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
