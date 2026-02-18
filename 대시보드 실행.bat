@echo off
chcp 65001 >nul
echo.
echo   ========================================
echo     대치코드 CRS 예약일지 대시보드
echo   ========================================
echo.
echo   서버를 시작합니다...
echo   브라우저에서 http://localhost:3456 이 열립니다.
echo   종료하려면 이 창을 닫으세요.
echo.

start "" http://localhost:3456
node "%~dp0server.js"
