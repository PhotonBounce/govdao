@echo off
REM ============================================================
REM  GOVDAO - Local Android APK builder (Windows)
REM  Produces a self-signed debug APK you can install on any
REM  phone (no Play Store, no keystore, no Expo account needed).
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ==========================================================
echo   GOVDAO APK BUILDER
echo ==========================================================
echo.

REM ---- 1. Check Node ----
where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js not found. Install it from https://nodejs.org  ^(LTS^)
  goto :fail
)
for /f "delims=" %%v in ('node --version') do echo [OK] Node %%v

REM ---- 2. Check Java (JDK 17 recommended) ----
where java >nul 2>&1
if errorlevel 1 (
  echo [X] Java JDK not found.
  echo     Install Temurin JDK 17: https://adoptium.net/temurin/releases/?version=17
  echo     After install, open a NEW terminal so PATH updates.
  goto :fail
)
for /f "tokens=*" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo [OK] %%v

REM ---- 3. Check Android SDK ----
if "%ANDROID_HOME%"=="" if "%ANDROID_SDK_ROOT%"=="" (
  echo [X] ANDROID_HOME is not set.
  echo     Easiest fix: install Android Studio https://developer.android.com/studio
  echo     Then in Studio: More Actions -^> SDK Manager, install "Android SDK Platform 34"
  echo     and "Android SDK Build-Tools". Studio sets ANDROID_HOME for you, then
  echo     open a NEW terminal and run this script again.
  goto :fail
)
if not "%ANDROID_HOME%"=="" echo [OK] ANDROID_HOME=%ANDROID_HOME%
if "%ANDROID_HOME%"=="" if not "%ANDROID_SDK_ROOT%"=="" echo [OK] ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%

echo.
echo ----------------------------------------------------------
echo   Step 1/4: installing mobile dependencies...
echo ----------------------------------------------------------
cd apps\mobile
call npm install
if errorlevel 1 goto :fail

echo.
echo ----------------------------------------------------------
echo   Step 2/4: generating native android project (prebuild)...
echo ----------------------------------------------------------
call npx expo prebuild --platform android --clean
if errorlevel 1 goto :fail

echo.
echo ----------------------------------------------------------
echo   Step 3/4: compiling APK with Gradle (this takes a while)...
echo ----------------------------------------------------------
cd android
call gradlew.bat assembleDebug
if errorlevel 1 goto :fail
cd ..

echo.
echo ----------------------------------------------------------
echo   Step 4/4: collecting APK...
echo ----------------------------------------------------------
set "APK=android\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo [X] Build finished but APK not found at %APK%
  goto :fail
)
copy /Y "%APK%" "..\..\microsite\govdao\GOVDAO.apk" >nul
copy /Y "%APK%" "%~dp0GOVDAO.apk" >nul

echo.
echo ==========================================================
echo   SUCCESS!
echo ==========================================================
echo   APK built at:
echo     %~dp0GOVDAO.apk
echo   Also copied into the microsite at:
echo     microsite\govdao\GOVDAO.apk
echo.
echo   Next: upload the microsite\govdao\ folder (incl GOVDAO.apk)
echo   to your site via FileZilla -> /govdao/
echo ==========================================================
echo.
pause
exit /b 0

:fail
echo.
echo ==========================================================
echo   BUILD FAILED - see the error above.
echo ==========================================================
echo.
pause
exit /b 1
