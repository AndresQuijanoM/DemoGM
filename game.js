// Neon Dash - Simple Arcade Game
// One button game - press SPACE or CLICK to jump

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Screens
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const gameUI = document.getElementById('game-ui');

// UI Elements
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const bestScoreStartEl = document.getElementById('best-score-start');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const soundBtn = document.getElementById('sound-btn');

// Game State
let gameRunning = false;
let score = 0;
let bestScore = parseInt(localStorage.getItem('neonDashBest')) || 0;
let soundEnabled = true;

// Player
const player = {
    x: 100,
    y: 460,
    width: 30,
    height: 30,
    velocityY: 0,
    jumping: false,
    color: '#0ff',
    glow: 15
};

// Physics
const gravity = 0.8;
const jumpForce = -14;
const groundY = 480;

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
const baseObstacleInterval = 90;

// Particles
let particles = [];

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration, volume) {
    if (!soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume || 0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playJumpSound() {
    playSound(400, 'square', 0.1, 0.15);
    setTimeout(() => playSound(550, 'square', 0.08, 0.1), 30);
}

function playScoreSound() {
    playSound(800, 'sine', 0.08, 0.1);
}

function playDeathSound() {
    playSound(150, 'sawtooth', 0.3, 0.25);
    setTimeout(() => playSound(100, 'sawtooth', 0.4, 0.15), 150);
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8 - 2;
        this.color = color;
        this.life = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.2;
        this.life -= 0.025;
        this.size *= 0.97;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Spawn Obstacle
function spawnObstacle() {
    const height = Math.random() * 30 + 30;
    const width = Math.random() * 10 + 20;
    const isTall = Math.random() > 0.7;
    
    obstacles.push({
        x: canvas.width,
        y: groundY - height + player.height,
        width: width,
        height: isTall ? height + 20 : height,
        color: `hsl(${Math.random() * 60 + 300}, 100%, 50%)`
    });
}

// Collision Check
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update Game
function update() {
    if (!gameRunning) return;

    // Score
    score++;
    scoreEl.textContent = score;

    // Player physics
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Ground check
    if (player.y + player.height > groundY + player.height) {
        player.y = groundY;
        player.velocityY = 0;
        player.jumping = false;
    }

    // Glow animation
    player.glow = 15 + Math.sin(score * 0.1) * 5;

    // Spawn obstacles
    const interval = Math.max(baseObstacleInterval - Math.floor(score / 50), 50);
    obstacleTimer++;
    if (obstacleTimer >= interval) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    // Update obstacles
    const speed = 5 + score * 0.008;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= speed;

        // Remove off-screen
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            continue;
        }

        // Collision check
        if (checkCollision(player, obstacles[i])) {
            gameOver();
            return;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Sound every 10 points
    if (score > 0 && score % 10 === 0) {
        playScoreSound();
    }
}

// Draw Game
function draw() {
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.strokeStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + player.height);
    ctx.lineTo(canvas.width, groundY + player.height);
    ctx.stroke();

    // Ground glow lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.shadowBlur = 0;
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, groundY + player.height - i * 8);
        ctx.lineTo(canvas.width, groundY + player.height - i * 8);
        ctx.stroke();
    }

    // Player
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = player.glow;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player inner glow
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 5;
    ctx.fillRect(player.x + 5, player.y + 5, 8, 8);

    // Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Particles
    particles.forEach(p => p.draw());
}

// Game Loop
function gameLoop() {
    if (gameRunning) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start Game
function startGame() {
    audioCtx.resume();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.remove('show');
    gameOverScreen.style.display = 'none';
    gameUI.style.display = 'flex';

    gameRunning = true;
    score = 0;
    obstacles = [];
    particles = [];
    obstacleTimer = 0;

    player.y = 460;
    player.velocityY = 0;
    player.jumping = false;

    bestScoreEl.textContent = bestScore;
}

// Game Over
function gameOver() {
    gameRunning = false;
    playDeathSound();

    // Screen shake
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 300);

    // Death particles
    spawnParticles(
        player.x + player.width / 2,
        player.y + player.height / 2,
        '#f06',
        25
    );

    // Update best
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('neonDashBest', bestScore);
    }

    // Show game over
    finalScoreEl.textContent = score;
    finalBestEl.textContent = bestScore;
    bestScoreStartEl.textContent = bestScore;
    
    gameOverScreen.style.display = 'flex';
    gameOverScreen.classList.add('show');
    
    // Hide after a moment
    setTimeout(() => {
        gameUI.style.display = 'none';
    }, 100);
}

// Jump
function jump() {
    if (!player.jumping) {
        player.velocityY = jumpForce;
        player.jumping = true;
        playJumpSound();
        spawnParticles(player.x + player.width / 2, player.y + player.height, '#0ff', 5);
    }
}

// Init
function init() {
    bestScoreStartEl.textContent = bestScore;
    bestScoreEl.textContent = bestScore;
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊 ON' : '🔇 OFF';
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            jump();
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) jump();
});

startScreen.addEventListener('click', () => {
    if (!gameRunning) startGame();
});

gameOverScreen.addEventListener('click', () => {
    if (!gameRunning) startGame();
});

// Start
gameLoop();
init();