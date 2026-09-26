@echo off
title Push Portfolio to GitHub
cd /d "%~dp0"
echo ============================================================
echo   Pushing Portfolio to https://github.com/THICHANAMOORTHY/protfolio-web
echo ============================================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ============================================================
    echo [SUCCESS] Your code has been pushed to GitHub successfully!
    echo Refresh your browser to see all files on GitHub.
    echo ============================================================
) else (
    echo ============================================================
    echo [NOTICE] If prompted for credentials:
    echo 1. Choose "Sign in with your browser"
    echo 2. Or use a GitHub Personal Access Token (PAT)
    echo ============================================================
)
echo.
pause
