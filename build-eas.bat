@echo off
cd /d D:\govdao\apps\mobile
echo Installing EAS CLI...
npm install -g eas-cli
echo.
echo Logging into Expo (browser will open)...
eas login
echo.
echo Starting cloud APK build...
eas build --platform android --profile preview
echo.
echo Done! Download the APK from the link above, then upload to photon-bounce.com/govdao/GOVDAO.apk
pause
