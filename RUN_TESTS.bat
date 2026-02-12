@echo off
echo ========================================
echo Running Authentication Tests
echo ========================================
echo.
echo Make sure the backend server is running!
echo If not, open another terminal and run:
echo   cd backend
echo   npm run dev
echo.
pause

powershell -ExecutionPolicy Bypass -File test-auth.ps1

pause
