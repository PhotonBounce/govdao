@echo off
REM ============================================================================
REM  start.bat  -  GOVDAO local test launcher (Windows)
REM
REM  Double-click this file, or run it from a terminal in the repo root.
REM  It checks your toolchain, installs dependencies on first run, then gives
REM  you a menu to launch the app, run the QA gates, or build an APK.
REM ============================================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"
title GOVDAO - Local Test Launcher

echo ============================================
echo    GOVDAO - Local Test Launcher
echo ============================================
echo.

REM --- Toolchain checks -------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on your PATH.
  echo         Install Node 20 or newer from https://nodejs.org and re-run.
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [ok] Node %NODE_VER% detected.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found on your PATH. Re-install Node.js.
  pause
  exit /b 1
)

REM --- Install dependencies on first run --------------------------------------
if not exist "node_modules" (
  echo [setup] Installing root dependencies ^(first run^)...
  call npm install
  if errorlevel 1 goto :error
)
if not exist "apps\mobile\node_modules" (
  echo [setup] Installing mobile app dependencies ^(first run^)...
  call npm --prefix apps/mobile install
  if errorlevel 1 goto :error
)
echo [ok] Dependencies ready.

:menu
echo.
echo --------------------------------------------
echo  What do you want to do?
echo --------------------------------------------
echo   [1] Open the app in your WEB BROWSER        (fastest preview)
echo   [2] Start dev server for your PHONE         (scan QR in the Expo Go app)
echo   [3] Start dev server with TUNNEL            (phone on a different network)
echo   [4] Run ALL QA gates                        (typecheck + every check)
echo   [5] Typecheck only                          (fast TypeScript check)
echo   [6] Regenerate assets + screenshots
echo   [7] Build an installable APK via EAS        (needs a free Expo login)
echo   [8] Export the web bundle to apps\mobile\dist
echo   [Q] Quit
echo.
set /p choice="Enter choice and press Enter: "

if /i "%choice%"=="1" goto :web
if /i "%choice%"=="2" goto :phone
if /i "%choice%"=="3" goto :tunnel
if /i "%choice%"=="4" goto :qa
if /i "%choice%"=="5" goto :typecheck
if /i "%choice%"=="6" goto :assets
if /i "%choice%"=="7" goto :apk
if /i "%choice%"=="8" goto :webexport
if /i "%choice%"=="Q" goto :end
echo.
echo  "%choice%" is not a valid choice - try again.
goto :menu

:web
echo.
echo [run] Starting Expo web preview. A browser tab will open in Chrome.
echo.
echo   To test ON-CHAIN with MetaMask (Polygon mainnet):
echo     1. Make sure the "Deploy to Polygon Mainnet" GitHub Action has run,
echo        then "git pull" so app.manifest.json has the real addresses.
echo     2. In the app, open the Session card and pick a wallet (Injected/MetaMask).
echo     3. MetaMask pops up and offers to switch/add Polygon - approve it.
echo     4. You are signed in with your real address and can propose + vote.
echo   If addresses are still all-zero, the app runs in safe DEMO mode instead.
echo.
echo       Press Ctrl+C in this window to stop the server.
echo.
call npm --prefix apps/mobile run web
goto :menu

:phone
echo.
echo [run] Starting the Expo dev server.
echo       1. Install "Expo Go" from the Play Store on your Android phone.
echo       2. Make sure your phone and PC are on the SAME Wi-Fi network.
echo       3. Scan the QR code shown below with Expo Go.
echo       Press Ctrl+C to stop.
echo.
call npm --prefix apps/mobile run start
goto :menu

:tunnel
echo.
echo [run] Starting the Expo dev server in TUNNEL mode.
echo       Use this when your phone and PC are NOT on the same network.
echo       Scan the QR code with Expo Go. Press Ctrl+C to stop.
echo.
pushd apps\mobile
call npx expo start --tunnel
popd
goto :menu

:qa
echo.
echo [qa] Running the full QA gate suite ^(this mirrors CI, minus the chain job^)...
echo.
call npm run mobile:check-all
if errorlevel 1 (
  echo.
  echo [qa] One or more gates FAILED - see the output above.
) else (
  echo.
  echo [qa] All QA gates PASSED.
)
echo.
pause
goto :menu

:typecheck
echo.
echo [qa] Running TypeScript typecheck...
call npm run mobile:typecheck
if errorlevel 1 ( echo [qa] Typecheck FAILED. ) else ( echo [qa] Typecheck PASSED. )
echo.
pause
goto :menu

:assets
echo.
echo [gen] Regenerating sounds, icons, feature graphic and screenshots...
call npm --prefix apps/mobile run generate:assets
echo.
pause
goto :menu

:apk
echo.
echo [build] Building an installable APK with EAS ^(Expo Application Services^).
echo         You need a free Expo account. If this is your first time it will
echo         prompt you to install eas-cli and log in.
echo.
where eas >nul 2>nul
if errorlevel 1 (
  echo [build] eas-cli not found - installing it globally...
  call npm install -g eas-cli
  if errorlevel 1 goto :error
)
echo [build] Running: eas build -p android --profile internal
echo         When it finishes, open the printed URL on your phone to install.
echo.
pushd apps\mobile
call eas build -p android --profile internal
popd
echo.
pause
goto :menu

:webexport
echo.
echo [export] Exporting the static web bundle to apps\mobile\dist ...
set EXPO_OFFLINE=1
pushd apps\mobile
call npx expo export --platform web --output-dir dist
popd
set EXPO_OFFLINE=
echo.
echo [export] Done. Open apps\mobile\dist\index.html or host the folder.
echo.
pause
goto :menu

:error
echo.
echo [ERROR] A setup step failed. Scroll up for details.
echo         Common fixes: check your internet connection, or delete
echo         node_modules and apps\mobile\node_modules and re-run.
echo.
pause
exit /b 1

:end
echo.
echo Bye!
endlocal
exit /b 0
