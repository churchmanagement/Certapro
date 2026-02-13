@echo off
echo ====================================
echo CetaProjectsManager - Quick Start
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/6] Checking Node.js version...
node --version
npm --version
echo.

echo [2/6] Starting Docker services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [WARNING] Docker failed to start. Make sure Docker Desktop is running.
    echo You can continue, but database won't be available.
)
echo.

echo [3/6] Installing root dependencies...
if not exist "node_modules\" (
    call npm install
)
echo.

echo [4/6] Installing backend dependencies...
cd backend
if not exist "node_modules\" (
    call npm install
)
cd ..
echo.

echo [5/6] Installing frontend dependencies...
cd frontend
if not exist "node_modules\" (
    call npm install
)
cd ..
echo.

echo [6/6] Starting development servers...
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the servers
echo.

call npm run dev
