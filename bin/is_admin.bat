@REM Verifie si le batch est execute "En tant qu'administrateur" (UAC)
@REM En tentant le lire l'environement de l'utilisateur S-1-5-19 = LOCAL_SERVICE (voir https://msdn.microsoft.com/en-us/library/cc980032.aspx "Well-Known SID Structures")
@reg query "HKEY_USERS\S-1-5-19\Environment" /v TEMP 2>&1 | findstr /I /C:"REG_EXPAND_SZ" 2>&1 > NUL
@If %ERRORLEVEL% EQU 0 (@SET SDK_ISADMIN=1) ELSE (@SET SDK_ISADMIN=0)
@EXIT /b %SDK_ISADMIN%
