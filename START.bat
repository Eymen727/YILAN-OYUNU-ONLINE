@echo off
echo Yılan Oyunu - Online Sunucusunu Başlatıyor...
echo.

REM Node.js yüklemesini kontrol et
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Node.js yüklü değil!
    echo https://nodejs.org adresinden indir.
    pause
    exit /b 1
)

REM Bağımlılıkları yükle (eğer node_modules yoksa)
if not exist "node_modules\" (
    echo Bağımlılıklar yükleniyor...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo HATA: npm install başarısız oldu!
        pause
        exit /b 1
    )
)

REM Sunucuyu başlat
echo.
echo Sunucu başlatılıyor...
echo Oyuna şu adresten erişin: http://localhost:3000
echo.
echo Durdurmak için CTRL+C tuşlarını basın.
echo.
call npm start

pause
