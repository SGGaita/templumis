@echo off
echo Stopping existing backend processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq backend*" 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend on port 8000...
cd /d "%~dp0"
python -m uvicorn app.main:app --reload --port 8000
