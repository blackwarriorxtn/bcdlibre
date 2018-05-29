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

CD %~dp0..
REM Start express module and restart it after 1 sec if it crashes
%COMSPEC% /C node_modules\.bin\forever.cmd --minUptime 1000 --spinSleepTime 1000 start bin\www || GOTO ERROR

node --eval "console.log('Please wait...'); setTimeout(function* () { console.log('Go!'); process.exit(0);}, 5000);" && START EXPLORER http://localhost:3000

:END
EXIT /B 0

:ERROR
ECHO [%DATE% %TIME%] %~dp0: ERROR! >&2
PAUSE
EXIT /b 1
