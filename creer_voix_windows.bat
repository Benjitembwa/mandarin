@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Entrez le chemin du fichier .txt de vocabulaire :
set /p fichier=Fichier : 
if "%fichier%"=="" goto :eof
py -3 "tools\make_voicepack.py" "%fichier%"
pause
