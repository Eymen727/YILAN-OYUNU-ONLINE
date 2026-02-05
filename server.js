const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Statik dosyaları serve et
app.use(express.static(path.join(__dirname)));

// Game Constants
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const SNAKE_SPEED = 5;
const SNAKE_SIZE = 20;
const FOOD_SIZE = 15;
const CAKE_SIZE = 30;

// Game State
let players = new Map();
let foods = [];
let cakes = [];
let playerId = 0;

// Oyuncu sınıfı
class Player {
    constructor(id) {
        this.id = id;
        this.x = Math.random() * WORLD_WIDTH;
        this.y = Math.random() * WORLD_HEIGHT;
        this.dx = SNAKE_SPEED;
        this.dy = 0;
        this.body = [];
        this.size = 5;
        this.score = 0;
        this.color = this.generateColor();
        this.shape = this.generateShape();
        this.name = `${id}`; // Sadece sayı
    }

    generateColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#FF1493', '#00CED1', '#32CD32', '#FFD700', '#FF8C00', '#8A2BE2'];
        return colors[this.id % colors.length];
    }

    generateShape() {
        const shapes = ['circle', 'square', 'triangle', 'star', 'hexagon', 'diamond'];
        return shapes[this.id % shapes.length];
    }

    update() {
        // Hareket et
        this.x += this.dx;
        this.y += this.dy;

        // Vücut ekle
        this.body.unshift({ x: this.x, y: this.y });

        // Vücut uzunluğunu kontrol et
        while (this.body.length > this.size) {
            this.body.pop();
        }

        // Duvar çarpışması kontrolü
        if (this.x < 0 || this.x > WORLD_WIDTH || this.y < 0 || this.y > WORLD_HEIGHT) {
            return false; // Ölü
        }

        return true; // Yaşıyor
    }

    getState() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            body: this.body,
            size: this.size,
            score: this.score,
            color: this.color,
            shape: this.shape,
            name: this.name
        };
    }
}

// İlk yem spawn et
function spawnFoods() {
    foods = [];
    for (let i = 0; i < 100; i++) {
        foods.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT
        });
    }
}

// Pasta spawn et
function spawnCake() {
    if (cakes.length === 0) {
        cakes.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT
        });
    }
}

// Oyunu başlat
spawnFoods();
spawnCake();

// WebSocket bağlantı
wss.on('connection', (ws) => {
    const id = playerId++;
    const player = new Player(id);
    players.set(id, player);

    console.log(`Oyuncu bağlandı: ${id}`);

    // Yeni oyuncuya mevcut durumu gönder
    ws.send(JSON.stringify({
        type: 'init',
        playerId: id,
        foods: foods,
        cakes: cakes,
        players: Array.from(players.values()).map(p => p.getState())
    }));

    // Tüm oyunculara yeni oyuncu hakkında bildir
    broadcast({
        type: 'playerJoined',
        player: player.getState()
    }, ws);

    // Mesaj alımı
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            if (message.type === 'move') {
                const p = players.get(id);
                if (p) {
                    // Geri dönüş engelle
                    if (message.dx !== undefined && message.dy !== undefined) {
                        if ((message.dx === 0 && p.dy === 0) || (message.dy === 0 && p.dx === 0)) {
                            p.dx = message.dx;
                            p.dy = message.dy;
                        } else if (message.dx !== 0 && p.dx === 0) {
                            p.dx = message.dx;
                            p.dy = 0;
                        } else if (message.dy !== 0 && p.dy === 0) {
                            p.dx = 0;
                            p.dy = message.dy;
                        }
                    }
                }
            } else if (message.type === 'changeName') {
                const p = players.get(id);
                if (p && message.name) {
                    // Sadece sayı kabul et
                    const numStr = message.name.trim();
                    if (/^\d+$/.test(numStr) && numStr.length > 0 && numStr.length <= 10) {
                        p.name = numStr;
                        console.log(`Oyuncu ${id} ismini değiştirdi: ${p.name}`);
                        // Tüm oyunculara haber ver
                        broadcast({
                            type: 'playerUpdated',
                            player: p.getState()
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Mesaj işleme hatası:', e);
        }
    });

    // Bağlantı kesilince
    ws.on('close', () => {
        players.delete(id);
        console.log(`Oyuncu çıktı: ${id}`);
        broadcast({
            type: 'playerLeft',
            playerId: id
        });
    });
});

// Broadcast yöntemini güncelle
function broadcast(message, exclude = null) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            if (!exclude || client !== exclude) {
                client.send(JSON.stringify(message));
            }
        }
    });
}

// Oyun güncelleme döngüsü
setInterval(() => {
    // Oyuncu durumunu güncelle
    const deadPlayers = [];
    players.forEach((player, id) => {
        if (!player.update()) {
            deadPlayers.push(id);
        }
    });

    // Ölü oyuncuları kaldır
    deadPlayers.forEach(id => {
        const player = players.get(id);
        console.log(`Oyuncu öldü: ${id}, Skor: ${player.score}`);
        broadcast({
            type: 'playerDeath',
            playerId: id,
            score: player.score
        });
        players.delete(id);
    });

    // Yem çarpışması kontrolü (optimize)
    const foodsToRemove = [];
    players.forEach(player => {
        const distThreshold = SNAKE_SIZE + FOOD_SIZE;
        for (let i = foods.length - 1; i >= 0; i--) {
            const food = foods[i];
            const dx = player.x - food.x;
            const dy = player.y - food.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < distThreshold * distThreshold) {
                player.size += 1;
                player.score += 1;
                foodsToRemove.push(i);
            }
        }
    });
    foods = foods.filter((_, i) => !foodsToRemove.includes(i));

    // Pasta çarpışması kontrolü (optimize)
    const cakesToRemove = [];
    players.forEach(player => {
        const distThreshold = SNAKE_SIZE + CAKE_SIZE;
        for (let i = cakes.length - 1; i >= 0; i--) {
            const cake = cakes[i];
            const dx = player.x - cake.x;
            const dy = player.y - cake.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < distThreshold * distThreshold) {
                player.size += 5;
                player.score += 5;
                cakesToRemove.push(i);
            }
        }
    });
    cakes = cakes.filter((_, i) => !cakesToRemove.includes(i));

    // Eksik yem ekle
    while (foods.length < 100) {
        foods.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT
        });
    }

    // Pasta kontrolü
    if (cakes.length === 0) {
        spawnCake();
    }

    // Tüm oyunculara sinkronizasyon gönder
    broadcast({
        type: 'update',
        players: Array.from(players.values()).map(p => p.getState()),
        foods: foods,
        cakes: cakes
    });
}, 33); // Her 33ms'de güncelle (30 FPS)

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
    console.log(`Oyuna erişim: http://localhost:${PORT}`);
});
