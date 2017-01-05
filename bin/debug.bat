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

CD %~dp0..
SET DEBUG=bibliopuce:*


REM Stop running processes if any (ignore errors)
%COMSPEC% /C %~dp0stop.bat 1>NUL 2>NUL

REM Then Start application via node
ECHO Debugging application...
REM Use port 5858 for debugging, compatible with atom-node-debugger (https://github.com/kiddkai/atom-node-debugger)
REM Install atom editor (https://atom.io/) then install debugger with "apm install node-debugger" and debug with "Attach" command
node --debug=5858 bin/www || GOTO ERROR

:END
EXIT /B 0

:ERROR
ECHO [%DATE% %TIME%] %~dp0: ERROR! >&2
PAUSE
EXIT /b 1
