@ECHO OFF
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
