@echo off
echo ====================================
echo Environment Setup Script
echo ====================================
echo.

REM Setup Backend Environment
echo [1/2] Setting up backend environment...
if not exist "backend\.env" (
    echo Creating backend/.env from template...
    copy "backend\.env.example" "backend\.env"
    echo.
    echo [ACTION REQUIRED] Please edit backend/.env and set:
    echo   - JWT_SECRET (generate a random 32+ character string)
    echo   - JWT_REFRESH_SECRET (generate a different random string)
    echo.
    echo You can generate secrets using:
    echo   PowerShell: -join ((65..90) + (97..122) + (48..57) ^| Get-Random -Count 32 ^| ForEach-Object {[char]$_})
    echo.
) else (
    echo backend/.env already exists
)
echo.

REM Setup Frontend Environment
echo [2/2] Setting up frontend environment...
if not exist "frontend\.env.local" (
    echo Creating frontend/.env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:3001
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
        echo.
        echo # Firebase Configuration ^(optional - for push notifications^)
        echo # NEXT_PUBLIC_FIREBASE_API_KEY=
        echo # NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
        echo # NEXT_PUBLIC_FIREBASE_PROJECT_ID=
        echo # NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
        echo # NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
        echo # NEXT_PUBLIC_FIREBASE_APP_ID=
        echo # NEXT_PUBLIC_FIREBASE_VAPID_KEY=
    ) > "frontend\.env.local"
    echo Created frontend/.env.local
) else (
    echo frontend/.env.local already exists
)
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Edit backend/.env and set JWT_SECRET and JWT_REFRESH_SECRET
echo 2. Run START_DEV.bat to start the development servers
echo.
pause
