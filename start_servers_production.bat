@echo off
echo Starting InsurAgent Production Servers...
echo.

REM Start backend server in a new window
echo Starting Backend Server (FastAPI)...
start "InsurAgent Backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment
timeout /t 3 /nobreak > nul

REM Start frontend server in a new window
echo Starting Frontend Server...
start "InsurAgent Frontend" cmd /k "python frontend_server.py"

echo.
echo Both servers are starting in separate windows...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
 