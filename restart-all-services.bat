@echo off
cls
echo ================================================================
echo   GEO-ENABLED SMART ATTENDANCE SYSTEM - RESTART ALL SERVICES
echo ================================================================
echo.
echo Admin Credentials:
echo   Email: admin@geo.com
echo   Password: admin123
echo   User ID: ADMIN001
echo.
echo ================================================================
echo.
echo Stopping all services...
echo.

REM Kill any running Node.js processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Kill any running Python processes
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo All services stopped.
echo.
echo ================================================================
echo.
echo Starting services...
echo.

REM Start Backend (port 5000)
echo [1/3] Starting Backend API (port 5000)...
start "Backend API" cmd /k "cd /d d:\Projects\GEO Enabled\backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start ML Service (port 8000)
echo [2/3] Starting ML Service (port 8000)...
start "ML Service" cmd /k "cd /d d:\Projects\GEO Enabled\ml-service && conda run -n geo_ml python -m uvicorn app:app --host 0.0.0.0 --port 8000"
timeout /t 5 /nobreak >nul

REM Start Frontend (port 3000)
echo [3/3] Starting Frontend (port 3000)...
start "Frontend" cmd /k "cd /d d:\Projects\GEO Enabled\frontend && npm run dev"

echo.
echo ================================================================
echo   ALL SERVICES STARTED!
echo ================================================================
echo.
echo Services running at:
echo   - Backend:  http://localhost:5000
echo   - ML Service: http://localhost:8000 (70%% confidence threshold)
echo   - Frontend: http://localhost:3000
echo.
echo Login with:
echo   Email: admin@geo.com
echo   Password: admin123
echo.
echo ================================================================
echo.
pause
