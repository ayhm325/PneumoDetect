@echo off
REM تسجيل خدمة PostgreSQL 17 في خدمات ويندوز لتعمل تلقائياً مع إقلاع الجهاز
REM يجب تشغيل هذا الملف كمسؤول (Run as administrator) لمرة واحدة فقط
echo ========================================================
echo   Registering PostgreSQL 17 as an Automatic Windows Service
echo ========================================================
"%LOCALAPPDATA%\Programs\PostgreSQL17\pgsql\bin\pg_ctl.exe" register -N "PostgreSQL17" -D "%LOCALAPPDATA%\Programs\PostgreSQL17\data" -w
sc config "PostgreSQL17" start= auto
net start PostgreSQL17
echo.
echo ========================================================
echo   PostgreSQL is now set to run automatically on boot!
echo ========================================================
pause
