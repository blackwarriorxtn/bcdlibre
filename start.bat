@ECHO OFF
CD %~dp0
REM TODO DELETE (debug)
set DEBUG=bibliopuce:*
START npm start || GOTO ERROR
REM wait for 5 seconds then call web app on localhost
node --eval "console.log('Please wait...'); setTimeout(function* () { console.log('Go!'); process.exit(0);}, 5000);" && START EXPLORER http://localhost:3000

:END
EXIT /B 0

:ERROR
ECHO [%DATE% %TIME%] %~dp0: ERROR! >&2
PAUSE
EXIT /b 1
