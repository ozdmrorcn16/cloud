@echo off
title vpn - Claude Code
set PROJE=%USERPROFILE%\Desktop\vpn
if not exist "%PROJE%" (
  echo Proje klasoru bulunamadi: %PROJE%
  echo Once su komutla klonla:
  echo   git clone -b claude/vpn https://github.com/ozdmrorcn16/cloud.git "%PROJE%"
  pause
  exit /b 1
)
cd /d "%PROJE%"
where claude >nul 2>nul
if errorlevel 1 (
  echo Claude Code kurulu degil. Kurmak icin:
  echo   npm install -g @anthropic-ai/claude-code
  pause
  exit /b 1
)
claude
