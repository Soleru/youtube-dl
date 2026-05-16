@echo off

setlocal

set /P "MODE=1 (vid‚o) ou 2 (playlist) : "
set /P "URL=URL youtube : "
node . %MODE% "%URL%"

endlocal

pause
