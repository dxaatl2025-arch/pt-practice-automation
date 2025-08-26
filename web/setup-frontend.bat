@echo off
echo Setting up React frontend...

npm init -y
npm install react react-dom @types/react @types/react-dom typescript
npm install -D vite @vitejs/plugin-react

echo.
echo Creating directory structure...
mkdir src\pages\tenant 2>nul
mkdir src\components 2>nul
mkdir src\hooks 2>nul

echo.
echo ✅ Frontend setup complete!
echo Next: Create the component files