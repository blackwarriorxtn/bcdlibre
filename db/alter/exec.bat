@ECHO OFF

ECHO [%DATE% %TIME%] %~n0: Begin...

CD %~dp0
node exec.js
ECHO [%DATE% %TIME%] %~n0: End.
