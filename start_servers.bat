@echo off
echo Starting InsurAgent servers...

echo.
echo Starting Backend Server (Port 8000)...
start "Backend Server" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend Server (Port 8080)...
cd frontend
start "Frontend Server" cmd /k "python -m http.server 8001"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8080
echo Test API: http://localhost:8080/test-api.html
echo.
echo Press any key to exit...
pause >nul 