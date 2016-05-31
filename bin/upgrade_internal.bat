@ECHO OFF

REM       Copyright 2016 Replay SDK (http://www.replay-sdk.com)
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

cd /D %~dp0..\ || GOTO ERROR

%COMSPEC% /C %~dp0..\setup\setup_node_modules.bat || GOTO ERROR

REM upgrade database structure, if needed : execute db/alter/*.sql (only once - store alter exection in MySQL db itself)
%COMSPEC% /C %~dp0..\db\alter\exec.bat || GOTO ERROR

:END
ECHO [%DATE% %TIME%] %~n0: End.
EXIT /b 0

:ERROR
ECHO [%DATE% %TIME%] %~n0: ERROR! >&2
PAUSE
EXIT /b 1
