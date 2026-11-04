@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  SITE DE FLASHCARDS - SERVEUR LOCAL
echo  Accueil : http://localhost:8000
 echo.
where py >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:8000"
  py -3 -m http.server 8000 --bind 127.0.0.1
  goto :eof
)
where python >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:8000"
  python -m http.server 8000 --bind 127.0.0.1
  goto :eof
)
echo Python 3 n'est pas disponible.
echo Installe Python 3, puis relance ce fichier.
echo Ou ouvre index.html directement ^(seuls les fichiers du manifeste apparaissent^).
pause
