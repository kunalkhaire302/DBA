@echo off
title NexBank DBA - Server Launcher
color 0A

echo.
echo  ================================================
echo    NexBank DBA - Starting Application...
echo  ================================================
echo.

:: Check if node is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exist
if not exist "node_modules\" (
    echo  [INFO] node_modules not found. Installing dependencies...
    echo.
    npm install
    echo.
)

echo  [INFO] Starting backend server on http://localhost:3000
echo  [INFO] Frontend will open automatically in your browser...
echo.

:: Start the server in background and wait a moment for it to boot
start /B node server.js

:: Wait 2 seconds for the server to initialize
timeout /t 2 /nobreak >nul

:: Open the frontend in the default browser
start "" "http://localhost:3000"

echo  [SUCCESS] Server is running!
echo  [SUCCESS] App opened at: http://localhost:3000
echo.
echo  ================================================
echo    Press Ctrl+C to stop the server
echo  ================================================
echo.

:: Keep the window open and show server logs
node server.js
