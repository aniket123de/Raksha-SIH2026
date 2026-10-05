@echo off
title EmergencyLink Disaster ^& Emergency Management Network
echo =====================================================================
echo           EmergencyLink - Disaster ^& Emergency Management App
echo =====================================================================
echo.
echo Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\node-v20\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\node-v20;%PATH%"
    ) else (
        echo [ERROR] Node.js is not found. Please ensure Node.js is installed.
        pause
        exit /b 1
    )
)

echo Starting EmergencyLink Web Application...
echo.
echo [1] Press 1 to launch Development Server (Vite on http://localhost:3000)
echo [2] Press 2 to launch Production Preview (http://localhost:4173)
echo [3] Press 3 to launch REST API Server (http://localhost:5000)
echo.
set /p opt="Select an option (default: 1): "
if "%opt%"=="" set opt=1

if "%opt%"=="1" (
    echo Launching Vite Dev Server...
    call npm.cmd run dev
) else if "%opt%"=="2" (
    echo Launching Production Preview...
    call npm.cmd run preview
) else if "%opt%"=="3" (
    echo Launching Express REST API...
    call npm.cmd run server
) else (
    call npm.cmd run dev
)
