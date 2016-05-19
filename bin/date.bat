@ECHO OFF
REM Initialize variables with current date : slice %DATE% value at every slash (/)
@FOR /F "tokens=1,2,3 delims=/" %%i IN ("%DATE%") DO SET MY_YEAR=%%k&& SET MY_MONTH=%%j&&SET MY_DAY=%%i
SET MY_SHORT_YEAR=%MY_YEAR:~2%
REM Remove day of week (if specified)
@FOR /F "tokens=1,2" %%l IN ("%MY_DAY%") DO IF  NOT "%%m" == "" SET MY_DAY=%%m
REM Initialize variables with time : slice %TIME% value at every colon (:)
@FOR /F "tokens=1,2,3 delims=:" %%i IN ("%TIME%") DO SET MY_HOUR=%%i&& SET MY_MINUTE=%%j&&SET MY_SECOND=%%k
REM Remove 0 prefix or space in hour (09->9)
FOR /F "tokens=* delims=0" %%h IN ("%MY_HOUR%") DO SET MY_HOUR=%%h
FOR /F "tokens=* delims= " %%h IN ("%MY_HOUR%") DO SET MY_HOUR=%%h
REM Add "0" prefix to hours, if needed (less than 10)
IF %MY_HOUR% LSS 10 SET MY_HOUR=0%MY_HOUR%
REM Get milliseconds (split with comma ,)
SET MY_MILLISECOND=0
@FOR /F "tokens=1,2 delims=," %%l IN ("%MY_SECOND%") DO IF  NOT "%%m" == "" SET MY_MILLISECOND=%%m
REM Remove milliseconds from MY_SECOND (split with comma ,)
@FOR /F "tokens=1,2 delims=," %%l IN ("%MY_SECOND%") DO IF  NOT "%%m" == "" SET MY_SECOND=%%l
