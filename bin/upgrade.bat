@ECHO OFF
ECHO [%DATE% %TIME%] %~n0: Begin...

cd /D %~dp0..\ || GOTO ERROR

ECHO [%DATE% %TIME%] Stop service
cd /D %~dp0..\ || GOTO ERROR
%COMSPEC% /C bin\stop.bat

ECHO [%DATE% %TIME%] Upgrade source code...
git pull || GOTO ERROR

%COMSPEC% /C bin\upgrade_internal.bat || GOTO ERROR

ECHO [%DATE% %TIME%] Start service
cd /D %~dp0..\ || GOTO ERROR
%COMSPEC% /C bin\start.bat

:END
ECHO [%DATE% %TIME%] %~n0: End.
PAUSE
EXIT /b 0

:ERROR
ECHO [%DATE% %TIME%] %~n0: ERROR! >&2
PAUSE
EXIT /b 1
