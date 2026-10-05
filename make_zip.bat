@echo off
title Creating Raksha Project ZIP Package
echo =====================================================================
echo           Packaging Raksha Emergency Response Project
echo =====================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package_project.ps1"
echo.
echo [DONE] Archive generated successfully!
pause
