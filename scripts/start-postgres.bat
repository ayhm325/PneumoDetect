@echo off
REM تشغيل قاعدة بيانات PostgreSQL في الخلفية بصمت تام بدون أي نافذة سوداء
start /B "" "%LOCALAPPDATA%\Programs\PostgreSQL17\pgsql\bin\pg_ctl.exe" start -D "%LOCALAPPDATA%\Programs\PostgreSQL17\data" -s
