@echo off
echo ========================================
echo CetaProjectsManager - Quick Start
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
cd backend
call npm install
cd ..

echo.
echo Step 2: Starting Docker...
call npm run docker:up

echo.
echo Step 3: Waiting for PostgreSQL to be ready...
timeout /t 10

echo.
echo Step 4: Setting up database...
cd backend
call npx prisma generate
call npx prisma migrate dev --name init
call npm run db:seed
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the server:
echo   cd backend
echo   npm run dev
echo.
echo To run tests (in a new terminal):
echo   powershell -ExecutionPolicy Bypass -File test-auth.ps1
echo.
echo To view database:
echo   cd backend
echo   npm run db:studio
echo.
pause
