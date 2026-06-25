@echo off
cd /d D:\govdao
git pull
cd apps\mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
pause
