@echo off
cd /d "C:\myPrjt01\myHome"
if errorlevel 1 (
    echo [ERROR] Folder not found: C:\myPrjt01\myHome
    pause
    exit /b 1
)

echo [1] Checking changes...
git status

echo.
echo [2] Adding all files...
git add -A

echo.
set /p COMMIT_MSG=Commit message (Enter = auto date): 
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=update %date% %time%
)

echo.
echo [3] Committing: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

echo.
echo [4] Pushing to GitHub...
git push origin master

echo.
if errorlevel 1 (
    echo [FAILED] Push error occurred.
) else (
    echo [SUCCESS] https://giths-ops.github.io
)
pause
