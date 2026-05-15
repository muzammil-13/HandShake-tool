@echo off
REM Run Handshake backend and frontend from the repository root.
REM Backend uses .venv activation if available.

set REPO_ROOT=%~dp0
set BACKEND_DIR=%REPO_ROOT%handshake\backend
set FRONTEND_DIR=%REPO_ROOT%handshake\frontend

if not exist "%BACKEND_DIR%" (
  echo ERROR: Backend directory not found: %BACKEND_DIR%
  exit /b 1
)
if not exist "%FRONTEND_DIR%" (
  echo ERROR: Frontend directory not found: %FRONTEND_DIR%
  exit /b 1
)

pushd "%BACKEND_DIR%"
if exist ".venv\Scripts\activate.bat" (
  echo Activating backend .venv...
  call ".venv\Scripts\activate.bat"
) else (
  echo .venv not found. Creating and activating a new backend .venv...
  python -m venv .venv
  call ".venv\Scripts\activate.bat"
)

echo Installing backend dependencies...
pip install -r requirements.txt

echo Starting backend in a new terminal...
start "Handshake Backend" cmd /k "cd /d %BACKEND_DIR% && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && uvicorn main:app --reload"
popd

pushd "%FRONTEND_DIR%"
echo Installing frontend dependencies...
npm install

echo Starting frontend in a new terminal...
start "Handshake Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
popd

echo Done. Backend and frontend should now be running in separate terminal windows.
