@echo off
chcp 65001 >nul
title Flores de Acho
cd /d "%~dp0"
where node >/dev/null 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado. Descargalo de https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist .env.local copy .env.example .env.local >nul
call npm install --no-fund --no-audit
start "" cmd /c "timeout /t 10 >/dev/null & start http://localhost:3000"
call npm run dev
pause
