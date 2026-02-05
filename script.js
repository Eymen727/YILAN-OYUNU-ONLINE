// WebSocket Bağlantısı
let ws = null;
let playerId = null;
let connected = false;

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const finalScoreElement = document.getElementById('final-score');
const statusText = document.getElementById('status-text');
const playersContainer = document.getElementById('players-container');
const playerNameDisplay = document.getElementById('player-name-display');
const playerNameInput = null; // Kaldırıldı
const editNameBtn = document.getElementById('edit-name-btn');
const nameModal = document.getElementById('name-modal');
const modalOverlay = document.getElementById('modal-overlay');
const nameInputModal = document.getElementById('name-input-modal');
const nameSaveBtn = document.getElementById('name-save-btn');
const nameCancelBtn = document.getElementById('name-cancel-btn');

// Canvas Context
const ctx = canvas.getContext('2d');

// Mobil Kontroller
const mobileControls = document.getElementById('mobile-controls');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnPause = document.getElementById('btn-pause');

// Mobil cihaz kontrolü
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Mobil kontrolleri göster/gizle
if (isMobileDevice()) {
    mobileControls.style.display = 'flex';
}

// Game Constants
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const SNAKE_SPEED = 5;
const SNAKE_SIZE = 20;
const FOOD_SIZE = 15;
const CAKE_SIZE = 30;

// Game State
let player = null;
let otherPlayers = new Map();
let foods = [];
let cakes = [];
let score = 0;
let isGameOver = false;
let isPaused = false;

// Camera
let camera = {
    x: 0,
    y: 0
};

// --- WebSocket Bağlantısını Kur ---
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}`);

    ws.onopen = () => {
        connected = true;
        statusText.textContent = 'Bağlandı!';
        console.log('Sunucuya bağlandı');
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleMessage(message);
        } catch (e) {
            console.error('Mesaj işleme hatası:', e);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
        statusText.textContent = 'Bağlantı hatası!';
    };

    ws.onclose = () => {
        connected = false;
        statusText.textContent = 'Sunucudan ayrıldı';
        console.log('Sunucudan ayrıldı');
        // Yeniden bağlanmayı dene
        setTimeout(connectWebSocket, 3000);
    };
}

// --- Sunucu Mesajlarını İşle ---
function handleMessage(message) {
    switch (message.type) {
        case 'init':
            handleInit(message);
            break;
        case 'update':
            handleUpdate(message);
            break;
        case 'playerJoined':
            handlePlayerJoined(message);
            break;
        case 'playerLeft':
            handlePlayerLeft(message);
            break;
        case 'playerDeath':
            handlePlayerDeath(message);
            break;
        case 'playerUpdated':
            handlePlayerUpdated(message);
            break;
    }
}

function handleInit(message) {
    playerId = message.playerId;
    foods = message.foods;
    cakes = message.cakes;
    
    // Diğer oyuncuları yükle
    message.players.forEach(p => {
        if (p.id !== playerId) {
            otherPlayers.set(p.id, p);
        } else {
            player = p;
            score = p.score;
            playerNameDisplay.textContent = `İsim: ${player.name}`;
        }
    });
    
    console.log(`Oyuncu ID: ${playerId}`);
    startGame();
}

function handleUpdate(message) {
    // Yiyecekleri güncelle
    foods = message.foods;
    cakes = message.cakes;

    // Oyuncuları güncelle
    message.players.forEach(p => {
        if (p.id === playerId) {
            player = p;
            score = p.score;
            scoreElement.textContent = `Skor: ${Math.floor(score)} Puan`;
            
            // Ölüm kontrolü
            if (p.body.length === 0 || isOutOfBounds(p)) {
                gameOver();
            }
        } else {
            otherPlayers.set(p.id, p);
        }
    });

    updatePlayersList();
}

function handlePlayerJoined(message) {
    console.log(`Oyuncu katıldı: ${message.player.id}`);
    otherPlayers.set(message.player.id, message.player);
}

function handlePlayerLeft(message) {
    console.log(`Oyuncu ayrıldı: ${message.playerId}`);
    otherPlayers.delete(message.playerId);
}

function handlePlayerUpdated(message) {
    console.log(`Oyuncu güncellendi: ${message.player.id} - ${message.player.name}`);
    if (message.player.id === playerId) {
        player = message.player;
        playerNameDisplay.textContent = `İsim: ${player.name}`;
    } else {
        otherPlayers.set(message.player.id, message.player);
    }
}

function handlePlayerDeath(message) {
    if (message.playerId === playerId) {
        console.log('Öldün!');
        gameOver();
    }
}

function isOutOfBounds(p) {
    return p.x < 0 || p.x > WORLD_WIDTH || p.y < 0 || p.y > WORLD_HEIGHT;
}

// --- Oyun Başlat ---
function startGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameLoop();
}

// --- Oyun Döngüsü ---
function gameLoop() {
    if (isGameOver) return;

    draw();
    requestAnimationFrame(gameLoop);
}

// --- Çiz ---
function draw() {
    if (!player) return;

    // Arkaplan
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Eğer pause değilse oyunu çiz
    if (!isPaused) {
        // Kamera oyuncuyu takip etsin
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;

        // Kamera dönüşümü uygula
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Dünya sınırları çiz (opsiyonel)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        
        // Yiyecekleri çiz
        ctx.fillStyle = 'red';
        for (let i = 0; i < foods.length; i++) {
            const food = foods[i];
            ctx.beginPath();
            ctx.arc(food.x, food.y, FOOD_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pastaları çiz
        ctx.fillStyle = 'gold';
        for (let i = 0; i < cakes.length; i++) {
            const cake = cakes[i];
            ctx.beginPath();
            ctx.arc(cake.x, cake.y, CAKE_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }

        // Diğer oyuncuları çiz
        otherPlayers.forEach(otherPlayer => {
            drawSnake(otherPlayer);
        });

        // Kendi oyuncuyu çiz
        if (player) {
            drawSnake(player, true);
        }

        // Kamera dönüşümünü geri al
        ctx.restore();
    }
}

function drawSnake(playerData, isOwn = false) {
    const bodyLength = playerData.body.length;
    if (bodyLength === 0) return;
    
    // Performans için her segmenti çizme, belirli aralıklarla çiz
    const step = Math.max(1, Math.floor(bodyLength / 100)); // Max 100 segment çiz
    
    for (let i = 0; i < bodyLength; i += step) {
        const segment = playerData.body[i];
        // Başı daha parlak yap
        const color = i === 0 ? playerData.color : adjustColor(playerData.color, -30);
        
        // Kuyruk küçülsün
        const scale = 1 - (i / (bodyLength * 1.5));
        const segmentSize = SNAKE_SIZE * Math.max(0.3, scale);
        
        // Şekle göre çiz
        drawShape(segment.x, segment.y, segmentSize, playerData.shape, color);
        
        // Oyuncu ismini sadece başa çiz
        if (i === 0) {
            ctx.fillStyle = playerData.color;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(playerData.name || `ID: ${playerData.id}`, segment.x, segment.y + 25);
        }
    }
}

function drawShape(x, y, size, shape, fillStyle) {
    ctx.fillStyle = fillStyle;
    
    switch(shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'square':
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
            break;
            
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x - size, y + size);
            ctx.closePath();
            ctx.fill();
            break;
            
        case 'star':
            drawStar(x, y, 5, size, size * 0.5);
            break;
            
        case 'hexagon':
            drawHexagon(x, y, size);
            break;
            
        case 'diamond':
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            ctx.fill();
            break;
            
        default:
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes * 2; i++) {
        let radius = (i & 1) === 0 ? outerRadius : innerRadius;
        let x = cx + Math.sin(i * step) * radius;
        let y = cy - Math.cos(i * step) * radius;
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawHexagon(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle = (i * Math.PI) / 3;
        let hx = x + size * Math.cos(angle);
        let hy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace(/^#/, ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// --- Oyuncular Listesini Güncelle ---
let lastPlayerListUpdate = 0;
let lastPlayerScores = new Map();

function updatePlayersList() {
    const now = Date.now();
    
    // Her 500ms'de veya skor değişerse update et
    let shouldUpdate = now - lastPlayerListUpdate > 500;
    
    if (!shouldUpdate) {
        // Skor değişti mi kontrol et
        if (player && lastPlayerScores.get('self') !== player.score) {
            shouldUpdate = true;
        }
        
        otherPlayers.forEach((p, id) => {
            if (lastPlayerScores.get(id) !== p.score) {
                shouldUpdate = true;
            }
        });
    }
    
    if (!shouldUpdate) return;
    
    playersContainer.innerHTML = '';
    
    // Kendi oyuncuyu ekle
    if (player) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item own';
        playerDiv.innerHTML = `<span style="color: ${player.color}">●</span> ${player.name} - ${Math.floor(player.score)}`;
        playersContainer.appendChild(playerDiv);
        lastPlayerScores.set('self', player.score);
    }

    // Diğer oyuncuları ekle (puanlarına göre sıralanmış)
    const sorted = Array.from(otherPlayers.values()).sort((a, b) => b.score - a.score);
    sorted.forEach(p => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `<span style="color: ${p.color}">●</span> ${p.name} - ${Math.floor(p.score)}`;
        playersContainer.appendChild(playerDiv);
        lastPlayerScores.set(p.id, p.score);
    });
    
    lastPlayerListUpdate = now;
}

// --- Oyun Bitti ---
function gameOver() {
    isGameOver = true;
    finalScoreElement.textContent = Math.floor(score);
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    location.reload();
}

// --- Tuş Olayları ---
window.addEventListener('keydown', e => {
    if (!connected || !player || isGameOver) return;

    let dx = 0, dy = 0;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            dx = 0;
            dy = -SNAKE_SPEED;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            dx = 0;
            dy = SNAKE_SPEED;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            dx = -SNAKE_SPEED;
            dy = 0;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            dx = SNAKE_SPEED;
            dy = 0;
            break;
        case 'p':
        case 'P':
            if (!isGameOver) {
                isPaused = !isPaused;
                if (isPaused) {
                    pauseScreen.classList.remove('hidden');
                } else {
                    pauseScreen.classList.add('hidden');
                    gameLoop();
                }
            }
            return;
        default:
            return;
    }

    if (dx !== 0 || dy !== 0) {
        ws.send(JSON.stringify({
            type: 'move',
            dx: dx,
            dy: dy
        }));
    }
});

// Mobile kontrolleri
function sendMoveCommand(dx, dy) {
    if (!connected || !player || isGameOver) return;
    ws.send(JSON.stringify({
        type: 'move',
        dx: dx,
        dy: dy
    }));
}

if (btnUp) {
    btnUp.addEventListener('click', () => sendMoveCommand(0, -SNAKE_SPEED));
}
if (btnDown) {
    btnDown.addEventListener('click', () => sendMoveCommand(0, SNAKE_SPEED));
}
if (btnLeft) {
    btnLeft.addEventListener('click', () => sendMoveCommand(-SNAKE_SPEED, 0));
}
if (btnRight) {
    btnRight.addEventListener('click', () => sendMoveCommand(SNAKE_SPEED, 0));
}
if (btnPause) {
    btnPause.addEventListener('click', () => {
        if (!isGameOver) {
            isPaused = !isPaused;
            if (isPaused) {
                pauseScreen.classList.remove('hidden');
            } else {
                pauseScreen.classList.add('hidden');
                gameLoop();
            }
        }
    });
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameOverScreen.addEventListener('click', restartGame);

// --- Oyunu Başlat ---
scoreElement.addEventListener('click', () => {
    statusText.textContent = 'Yeniden bağlanılıyor...';
    if (ws) ws.close();
    connectWebSocket();
});

// İsim değiştirme
playerNameDisplay.addEventListener('click', () => {
    console.log('İsim tıklandı!', {connected, player});
    if (!connected || !player) {
        console.log('Connected veya player yok');
        return;
    }
    nameInputModal.value = player.name;
    nameModal.style.display = 'block';
    modalOverlay.style.display = 'block';
    nameInputModal.focus();
    nameInputModal.select();
    console.log('Modal açıldı');
});

function closeNameModal() {
    nameModal.style.display = 'none';
    modalOverlay.style.display = 'none';
}

if (nameSaveBtn) {
    nameSaveBtn.addEventListener('click', () => {
        const newName = nameInputModal.value.trim();
        console.log('Kaydet tıklandı:', newName);
        // Sadece rakam kabul et
        if (/^\d+$/.test(newName) && newName.length > 0 && newName.length <= 10) {
            player.name = newName;
            playerNameDisplay.textContent = `İsim: ${newName}`;
            
            // Sunucuya bildir
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'changeName',
                    name: newName
                }));
                console.log('Sunucuya gönderildi:', newName);
            }
            closeNameModal();
        } else {
            alert('İsim sadece sayı olmalı! (1-10 rakam)');
        }
    });
}

if (nameCancelBtn) {
    nameCancelBtn.addEventListener('click', () => {
        closeNameModal();
    });
}

// Modal overlay tıklandığında kapat
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeNameModal();
        }
    });
}

// Enter tuşu ile kaydet
if (nameInputModal) {
    nameInputModal.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            nameSaveBtn.click();
        }
    });
}

connectWebSocket();
