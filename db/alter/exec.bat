@ECHO OFF

ECHO [%DATE% %TIME%] Upgrading database (if needed)...

CD %~dp0
node exec.js
ECHO [%DATE% %TIME%] Upgrading database : End.
