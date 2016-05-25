@ECHO OFF
CD %~dp0..
%COMSPEC% /C node_modules\.bin\forever.cmd stop bin\www || GOTO ERROR

:END
EXIT /B 0

:ERROR
ECHO [%DATE% %TIME%] %~nx0: ERROR! >&2
EXIT /b 1
