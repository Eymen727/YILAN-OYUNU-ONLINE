# Yılan Oyunu - Çok Oyunculu Online Sürüm

Bir Node.js sunucusu ile desteklenen WebSocket tabanlı çok oyunculu yılan oyunu!

## Özellikler

✅ **Çok Oyunculu**: Birden fazla oyuncu aynı anda oyna
✅ **Real-time Senkronizasyon**: WebSocket ile anlık oyuncu güncellemesi
✅ **Paylaşılan Oyun Dünyası**: Tüm oyuncular aynı yiyecekleri paylaşır
✅ **Puan Sistemi**: Yiyecek ve pastalar için puan kazanın
✅ **Oyuncu Listesi**: Diğer oyunculaları ve puanlarını görün
✅ **Renkli Yılanlar**: Her oyuncu benzersiz renge sahiptir

## Kurulum

### 1. Gerekli Yazılımları Yükle
- [Node.js](https://nodejs.org/) (v14.0 veya daha yeni)
- npm (Node.js ile birlikte gelir)

### 2. Bağımlılıkları Yükle
```bash
npm install
```

Bu komut şunları yükler:
- `express`: Web sunucusu framework'ü
- `ws`: WebSocket kütüphanesi
- `cors`: Cross-Origin Resource Sharing için

### 3. Sunucuyu Başlat
```bash
npm start
```

Veya geliştirme modunda (dosya değişikliklerinde otomatik yeniden başlasın):
```bash
npm run dev
```

### 4. Oyunu Aç
Web tarayıcınızda şu adrese gidin:
```
http://localhost:3000
```

## Nasıl Oynanır?

### Kontroller
- **Hareket**: Arrow Keys (↑↓←→) veya WASD
- **Durakla**: P tuşuna basın
- **Yeniden Başla**: Oyun bitince ekrana tıklayın
- **Yeniden Bağlan**: Sol üstteki skor alanına tıklayın

### Oyun Mekaniği
- 🔴 **Kırmızı yiyecekler**: 1 puan + 1 büyüme
- 🟡 **Sarı pastalar**: 5 puan + 5 büyüme
- Duvardan çıkın = ölü
- Büyüdükçe yiyecek bulması zor hale geliyor!

## Dosya Yapısı

```
├── server.js          # Node.js WebSocket sunucusu
├── package.json       # Bağımlılıklar
├── index.html         # Oyun ara yüzü
├── script.js          # Oyun mantığı ve WebSocket istemcisi
├── style.css          # Stil dosyası
└── README.md          # Bu dosya
```

## Sunucuya Bağlanma

Sunucu varsayılan olarak **http://0.0.0.0:3000** adresinde çalışır.

### Lokal Ağda Oynamak
Bilgisayarınızın IP adresini öğrenin ve diğer cihazlardan şu adrese gidin:
```
http://[BİLGİSAYAR_IP]:3000
```

Linux/Mac:
```bash
ipconfig getifaddr en0  # Mac
hostname -I             # Linux
```

Windows:
```bash
ipconfig
```

## İnternet'te Yayınlama

### Seçenek 1: Heroku (Ücretsiz)

1. [Heroku](https://www.heroku.com) hesabı oluşturun
2. Heroku CLI yükleyin
3. Proje klasöründe:
```bash
heroku login
heroku create oyun-adi
git push heroku main
```

4. Oyuna erişin: `https://oyun-adi.herokuapp.com`

### Seçenek 2: Netlify/Firebase (SPAs için)

Statik dosyaları Netlify/Firebase'de barındırın ve sunucuyu bir VPS'de çalıştırın.

### Seçenek 3: VPS (DigitalOcean, Linode, vb.)

1. VPS'inize bağlanın
2. Node.js yükleyin
3. Dosyaları kopyalayın
4. `npm install && npm start` çalıştırın
5. PM2 ile kalıcı hale yapın:
```bash
npm install -g pm2
pm2 start server.js --name "yilan-oyunu"
pm2 startup
pm2 save
```

## Settings & Özelleştirme

### Oyun Sabitleri (server.js içinde)
```javascript
const WORLD_WIDTH = 3000;      // Dünya genişliği
const WORLD_HEIGHT = 3000;     // Dünya yüksekliği
const SNAKE_SPEED = 5;         // Hareket hızı
const SNAKE_SIZE = 20;         // Yılan segmenti boyutu
const FOOD_SIZE = 15;          // Yiyecek boyutu
const CAKE_SIZE = 30;          // Pasta boyutu
```

### Güncelleme Hızı (server.js içinde)
```javascript
setInterval(() => {
    // ... oyun güncellemeler
}, 50); // Her 50ms'de güncelle (20 FPS)
```

Daha düşük değer = daha yumuşak oyun, daha yüksek CPU kullanımı

## Sorun Giderme

### "Sunucuya bağlanılamıyor" hatası
- Sunucunun çalıştığını kontrol edin (`npm start`)
- Tarayıcı konsolunu açın (F12) ve hataları kontrol edin
- Güvenlik duvarında port 3000 açık mı?

### WebSocket bağlantı başarısız
- Eğer HTTPS kullanıyorsanız, `wss://` kullanıldığından emin olun
- Tarayıcının WebSocket'i desteklediğini kontrol edin

### Sunucu kayıtları
Sunucu konsolunda oyuncu bağlantılarını görmek için check:
```
Oyuncu bağlandı: 0
Oyuncu öldü: 0, Skor: 45
```

## Gelişmiş Özellikler (Future)

- [ ] Veritabanı ile puan kayıt sistemi
- [ ] Oyuncu profilleri ve istatistikler
- [ ] Özel oyun modları (TDM, FFA vb.)
- [ ] Mobil uyumlu arayüz
- [ ] Ses efektleri
- [ ] Dinamik harita boyutu
- [ ] Bot oyuncuları

## Lisans

MIT

## Yardım & İletişim

Sorunlarla karşılaşırsanız veya öneriniz varsa lütfen issue açınız.

---

**Oyunun Tadını Çıkar!** 🐍🎮
