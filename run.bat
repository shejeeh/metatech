@echo off
title MetaTech Web Server
echo Starting MetaTech Web Server...
start http://127.0.0.1:8080/
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
