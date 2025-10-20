@echo off
setlocal
set PORT=5500
cd /d "%~dp0"

:: 1) Versuche Python
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/index.html"
  python -m http.server %PORT%
  goto :eof
)

:: 2) Falls kein Python: versuche Node (http-server)
where node >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p %PORT% -o index.html
  goto :eof
)

echo --------------------------------------------
echo Kein Python oder Node.js gefunden.
echo Installiere entweder Python (python.org)
echo oder Node.js (nodejs.org) und versuch es erneut.
echo --------------------------------------------
pause
