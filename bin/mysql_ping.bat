@ECHO OFF

REM       Copyright 2016-2017 Replay SDK (http://www.replay-sdk.com)
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

REM Enable command extension for IF
SETLOCAL ENABLEEXTENSIONS

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

SET LOOP=1
SET MAX_LOOP=10
SET REDIRECTION_OPTION=1^>NUL 2^>NUL
:LOOP
REM On last loop, do not redirect errors to log them
IF /I %LOOP% EQU %MAX_LOOP% SET REDIRECTION_OPTION=
IF /I %LOOP% GTR %MAX_LOOP% GOTO ERROR
ECHO [%DATE% %TIME%] Loop %LOOP%...
SET /A LOOP=%LOOP% + 1
mysqladmin --user=root %PASSWORD_OPTION% ping %REDIRECTION_OPTION% || GOTO LOOP


:END
ECHO [%DATE% %TIME%] %~n0: OK.
EXIT /b 0

:ERROR
ECHO [%DATE% %TIME%] %~n0: ERROR! >&2
EXIT /b 1
