@echo off
title NetVocher Dashboard
color 0B

echo ===================================================
echo       MEMULAI NETVOCHER DASHBOARD CONCEPT 3
echo ===================================================
echo.

:: Pindah ke direktori tempat file .bat ini berada
cd /d "%~dp0"

:: Cek apakah node_modules sudah ada, jika belum otomatis install
IF NOT EXIST "node_modules\" (
    echo [INFO] Menyiapkan sistem untuk pertama kali...
    echo [INFO] Proses ini membutuhkan koneksi internet dan waktu beberapa menit.
    echo.
    npm install
)

echo.
echo [INFO] Menjalankan server lokal...
echo [INFO] Browser akan terbuka secara otomatis. Biarkan jendela hitam ini tetap terbuka!
echo.

:: Buka browser ke alamat default Vite
start http://localhost:5173

:: Jalankan Backend Server
echo [INFO] Memulai Backend Webhook Listener...
start /b node server.js

:: Jalankan Frontend Server
echo [INFO] Memulai Frontend Dashboard...
npm run dev

start


