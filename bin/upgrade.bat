@ECHO OFF
ECHO [%DATE% %TIME%] %~n0: Begin...

cd /D %~dp0..\ || GOTO ERROR

ECHO [%DATE% %TIME%] Upgrade source code...
git pull || GOTO ERROR

ECHO [%DATE% %TIME%] Stop service
cd /D %~dp0..\ || GOTO ERROR
%COMSPEC% /C bin\stop.bat

REM TODO : upgrade database structure, if needed : execute db/alter/*.sql (only once - store alter exection in MySQL db)

ECHO [%DATE% %TIME%] Start service
cd /D %~dp0..\ || GOTO ERROR
%COMSPEC% /C bin\start.bat

:END
ECHO [%DATE% %TIME%] %~n0: End.
EXIT /b 0

:ERROR
ECHO [%DATE% %TIME%] %~n0: ERROR! >&2
PAUSE
EXIT /b 1
