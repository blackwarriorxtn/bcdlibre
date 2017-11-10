@REM Verifie que ce script a ete appele en tant qu'admin
@CALL %~dp0is_admin.bat && GOTO WARNING_MUST_BE_ADMIN
:OK_IS_ADMIN
@EXIT /b 0

:WARNING_MUST_BE_ADMIN
@ECHO **************************************                        >&2
@ECHO *** ATTENTION droits insuffisants! ***                        >&2
@ECHO **************************************                        >&2
@ECHO.                                                              >&2
@ECHO Faire un clic-droit puis "Executer en tant qu'administrateur" >&2
@ECHO.                                                              >&2
@IF "%~1" == "PAUSE" PAUSE
@IF "%~1" == "PAUSEANDEXIT" PAUSE
@IF "%~1" == "PAUSEANDEXIT" EXIT 1
@EXIT /b 1

