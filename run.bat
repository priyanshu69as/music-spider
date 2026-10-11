@echo off
title Music Spider Launcher

echo ========================================
echo        MUSIC SPIDER
echo ========================================
echo.

echo Starting Backend...
start "Music Spider Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload"

echo Backend starting...
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Music Spider Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting for frontend...
timeout /t 5 /nobreak >nul

echo Opening Music Spider...
start "" "http://localhost:5173"

echo.
echo Music Spider started!
exit