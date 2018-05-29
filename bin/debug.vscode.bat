@REM       Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)
@REM
@REM   Licensed under the Apache License, Version 2.0 (the "License");
@REM   you may not use this file except in compliance with the License.
@REM   You may obtain a copy of the License at
@REM
@REM      http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM   Unless required by applicable law or agreed to in writing, software
@REM   distributed under the License is distributed on an "AS IS" BASIS,
@REM   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@REM   See the License for the specific language governing permissions and
@REM   limitations under the License.

@ECHO DEBUG VS Code

@CALL %~dp0must_be_admin.bat || GOTO ERROR

SET DEBUG=bibliopuce:*
SET BCDLIBRE_PATH=%~dps0..
CD /D %BCDLIBRE_PATH% || PAUSE
%COMSPEC% /C %~dp0\stop.bat 2>NUL
SET VSCODE_EXE=C:\Program Files\Microsoft VS Code\Code.exe
IF EXIST "C:\Program Files (x86)\Microsoft VS Code\Code.exe" SET VSCODE_EXE=C:\Program Files (x86)\Microsoft VS Code\Code.exe
IF NOT EXIST "%VSCODE_EXE%" GOTO ERROR
FOR %%P IN ("%VSCODE_EXE%") DO START /D %BCDLIBRE_PATH% %%~sP %BCDLIBRE_PATH% || GOTO ERROR
EXIT /B 0

:ERROR
@PAUSE
EXIT /B 1
