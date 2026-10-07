@echo off
title Fatima Parish Management System - Live MySQL Server
color 0A
echo ====================================================================
echo      FATIMA PARISH MANAGEMENT SYSTEM (MySQL LIVE SERVER)
echo ====================================================================
echo.
echo [1/3] Checking XAMPP MySQL & PHP environment...

set PHP_PATH=C:\xampp\php\php.exe

if not exist "%PHP_PATH%" (
    set PHP_PATH=php
)

echo [2/3] Launching your browser to http://localhost:8080 ...
timeout /t 2 /nobreak >nul
start http://localhost:8080/

echo [3/3] Server is LIVE on http://localhost:8080 (Connected to MySQL)
echo.
echo ====================================================================
echo   NOTE: Please make sure MySQL is started in your XAMPP Control Panel.
echo   Keep this window open while using the system.
echo ====================================================================
echo.

"%PHP_PATH%" -S localhost:8080
pause
