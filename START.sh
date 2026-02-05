#!/bin/bash

echo "Yılan Oyunu - Online Sunucusunu Başlatıyor..."
echo ""

# Node.js yüklemesini kontrol et
if ! command -v node &> /dev/null; then
    echo "HATA: Node.js yüklü değil!"
    echo "https://nodejs.org adresinden indir."
    exit 1
fi

# Bağımlılıkları yükle (eğer node_modules yoksa)
if [ ! -d "node_modules" ]; then
    echo "Bağımlılıklar yükleniyor..."
    npm install
    if [ $? -ne 0 ]; then
        echo "HATA: npm install başarısız oldu!"
        exit 1
    fi
fi

# Sunucuyu başlat
echo ""
echo "Sunucu başlatılıyor..."
echo "Oyuna şu adresten erişin: http://localhost:3000"
echo ""
echo "Durdurmak için CTRL+C tuşlarını basın."
echo ""

npm start
