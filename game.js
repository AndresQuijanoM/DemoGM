const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE = 32;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const MAX_FALL = 12;

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch(type) {
    case 'jump':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'coin':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(988, now);
      osc.frequency.setValueAtTime(1319, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'enemy':
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    case 'levelUp':
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.15);
      });
      break;
    case 'hurt':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'gameOver':
      [440, 349, 294, 220].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.2);
        g.gain.setValueAtTime(0.12, now + i * 0.2);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.25);
        o.start(now + i * 0.2);
        o.stop(now + i * 0.2 + 0.25);
      });
      break;
  }
}

const levels = [
  {
    platforms: [
      { x: 0, y: 468, w: 800, h: 32 },
      { x: 200, y: 380, w: 96, h: 24 },
      { x: 380, y: 300, w: 96, h: 24 },
      { x: 550, y: 220, w: 128, h: 24 },
    ],
    coins: [
      { x: 230, y: 340 },
      { x: 410, y: 260 },
      { x: 580, y: 180 },
      { x: 620, y: 180 },
      { x: 720, y: 420 },
    ],
    enemies: [
      { x: 450, y: 436 }
    ]
  },
  {
    platforms: [
      { x: 0, y: 468, w: 300, h: 32 },
      { x: 350, y: 468, w: 450, h: 32 },
      { x: 150, y: 350, w: 96, h: 24 },
      { x: 320, y: 280, w: 96, h: 24 },
      { x: 500, y: 350, w: 96, h: 24 },
      { x: 650, y: 250, w: 96, h: 24 },
    ],
    coins: [
      { x: 180, y: 300 },
      { x: 350, y: 230 },
      { x: 530, y: 300 },
      { x: 680, y: 200 },
      { x: 720, y: 420 },
      { x: 400, y: 420 },
      { x: 250, y: 420 },
    ],
    enemies: [
      { x: 400, y: 436 },
      { x: 600, y: 436 }
    ]
  },
  {
    platforms: [
      { x: 0, y: 468, w: 200, h: 32 },
      { x: 280, y: 468, w: 150, h: 32 },
      { x: 500, y: 468, w: 300, h: 32 },
      { x: 100, y: 350, w: 80, h: 24 },
      { x: 250, y: 280, w: 80, h: 24 },
      { x: 400, y: 350, w: 80, h: 24 },
      { x: 550, y: 280, w: 80, h: 24 },
      { x: 700, y: 180, w: 80, h: 24 },
    ],
    coins: [
      { x: 120, y: 300 },
      { x: 270, y: 230 },
      { x: 420, y: 300 },
      { x: 570, y: 230 },
      { x: 720, y: 130 },
      { x: 750, y: 420 },
      { x: 550, y: 420 },
      { x: 350, y: 420 },
    ],
    enemies: [
      { x: 320, y: 436 },
      { x: 550, y: 436 },
      { x: 700, y: 436 }
    ]
  },
  {
    platforms: [
      { x: 0, y: 468, w: 150, h: 32 },
      { x: 220, y: 468, w: 100, h: 32 },
      { x: 380, y: 468, w: 100, h: 32 },
      { x: 550, y: 468, w: 250, h: 32 },
      { x: 80, y: 350, w: 64, h: 24 },
      { x: 200, y: 280, w: 80, h: 24 },
      { x: 350, y: 220, w: 80, h: 24 },
      { x: 500, y: 300, w: 80, h: 24 },
      { x: 650, y: 220, w: 96, h: 24 },
    ],
    coins: [
      { x: 100, y: 300 },
      { x: 220, y: 230 },
      { x: 370, y: 170 },
      { x: 520, y: 250 },
      { x: 680, y: 170 },
      { x: 750, y: 420 },
      { x: 600, y: 420 },
      { x: 450, y: 420 },
      { x: 280, y: 420 },
      { x: 130, y: 420 },
    ],
    enemies: [
      { x: 250, y: 436 },
      { x: 400, y: 436 },
      { x: 600, y: 436 },
      { x: 720, y: 436 }
    ]
  },
  {
    platforms: [
      { x: 0, y: 468, w: 120, h: 32 },
      { x: 180, y: 468, w: 80, h: 32 },
      { x: 320, y: 468, w: 80, h: 32 },
      { x: 460, y: 468, w: 80, h: 32 },
      { x: 600, y: 468, w: 200, h: 32 },
      { x: 50, y: 350, w: 64, h: 24 },
      { x: 150, y: 280, w: 64, h: 24 },
      { x: 270, y: 350, w: 64, h: 24 },
      { x: 370, y: 280, w: 64, h: 24 },
      { x: 490, y: 350, w: 64, h: 24 },
      { x: 590, y: 280, w: 64, h: 24 },
      { x: 700, y: 200, w: 80, h: 24 },
    ],
    coins: [
      { x: 70, y: 300 },
      { x: 170, y: 230 },
      { x: 290, y: 300 },
      { x: 390, y: 230 },
      { x: 510, y: 300 },
      { x: 610, y: 230 },
      { x: 720, y: 150 },
      { x: 760, y: 420 },
      { x: 700, y: 420 },
      { x: 500, y: 420 },
      { x: 350, y: 420 },
      { x: 100, y: 420 },
    ],
    enemies: [
      { x: 200, y: 436 },
      { x: 340, y: 436 },
      { x: 480, y: 436 },
      { x: 650, y: 436 },
      { x: 760, y: 436 }
    ]
  }
];

let gameState = 'title';
let score = 0;
let lives = 3;
let currentLevel = 0;
let bestScore = parseInt(localStorage.getItem('pixelAdventureBest')) || 0;
let highestLevel = parseInt(localStorage.getItem('pixelAdventureLevel')) || 0;

let player = {
  x: 50, y: 400,
  vx: 0, vy: 0,
  w: 28, h: 30,
  onGround: false,
  facing: 1,
  animFrame: 0,
  animTimer: 0,
  invincible: 0,
  isHurt: false
};

let platforms = [];
let coins = [];
let enemies = [];
let particles = [];
let levelTransition = 0;

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    initAudio();
    if (gameState === 'title') {
      gameState = 'instructions';
    } else if (gameState === 'instructions') {
      startGame();
    } else if (gameState === 'levelComplete') {
      nextLevel();
    } else if (gameState === 'gameOver' || gameState === 'victory') {
      gameState = 'title';
      updateTitleScreen();
    }
  }
});
document.addEventListener('keyup', e => keys[e.code] = false);

function startGame() {
  score = 0;
  lives = 3;
  currentLevel = 0;
  loadLevel(currentLevel);
  gameState = 'playing';
  hideAllScreens();
}

function nextLevel() {
  currentLevel++;
  if (currentLevel >= levels.length) {
    victory();
    return;
  }
  loadLevel(currentLevel);
  gameState = 'playing';
  hideAllScreens();
}

function loadLevel(idx) {
  const level = levels[idx];
  player.x = 50;
  player.y = 400;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 0;
  player.isHurt = false;
  
  platforms = level.platforms.map(p => ({...p}));
  coins = level.coins.map(c => ({...c, collected: false, anim: 0, scale: 1}));
  enemies = level.enemies.map(e => ({...e, w: 28, h: 24, vx: 1.5, alive: true, deathTimer: 0}));
  particles = [];
}

function victory() {
  gameState = 'victory';
  score += 500 * levels.length;
  playSound('levelUp');
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('pixelAdventureBest', bestScore);
  }
  document.getElementById('victory-score').textContent = score;
  document.getElementById('victory-best').textContent = bestScore;
  document.getElementById('victory-screen').classList.remove('hidden');
  player.invincible = 0;
}

function gameOver() {
  gameState = 'gameOver';
  playSound('gameOver');
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('pixelAdventureBest', bestScore);
  }
  if (currentLevel > highestLevel) {
    highestLevel = currentLevel;
    localStorage.setItem('pixelAdventureLevel', highestLevel);
  }
  document.getElementById('final-score').textContent = score;
  document.getElementById('gameover-best').textContent = bestScore;
  document.getElementById('game-over-screen').classList.remove('hidden');
}

function loseLife() {
  lives--;
  playSound('hurt');
  player.invincible = 90;
  player.isHurt = true;
  player.vy = -8;
  
  if (lives <= 0) {
    gameOver();
  } else {
    player.x = 50;
    player.y = 400;
    player.vx = 0;
  }
}

function update() {
  if (gameState !== 'playing') return;
  
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = -MOVE_SPEED;
    player.facing = -1;
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = MOVE_SPEED;
    player.facing = 1;
  } else {
    player.vx = 0;
  }
  
  if ((keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    playSound('jump');
  }
  
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;
  
  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  
  player.onGround = false;
  for (const plat of platforms) {
    if (player.x + player.w > plat.x && player.x < plat.x + plat.w) {
      if (player.y + player.h > plat.y && player.y + player.h < plat.y + plat.h + player.vy + 5 && player.vy >= 0) {
        player.y = plat.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }
  
  player.y += player.vy;
  for (const plat of platforms) {
    if (player.x + player.w > plat.x && player.x < plat.x + plat.w) {
      if (player.y + player.h > plat.y && player.y < plat.y + plat.h) {
        if (player.vy > 0 && player.y + player.h - player.vy <= plat.y) {
          player.y = plat.y - player.h;
          player.vy = 0;
          player.onGround = true;
        }
      }
    }
  }
  
  if (player.y > canvas.height) {
    loseLife();
    return;
  }
  
  if (player.x > canvas.width - 50) {
    levelComplete();
    return;
  }
  
  for (const coin of coins) {
    if (coin.collected) continue;
    if (Math.abs(player.x + player.w/2 - coin.x) < 20 && Math.abs(player.y + player.h/2 - coin.y) < 20) {
      coin.collected = true;
      score += 100;
      playSound('coin');
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: coin.x, y: coin.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 30,
          color: '#FFD700'
        });
      }
      if (score > 0 && score % 5000 === 0 && lives < 5) {
        lives++;
      }
    }
  }
  
  if (player.invincible > 0) player.invincible--;
  if (player.invincible === 0) player.isHurt = false;
  
  for (const enemy of enemies) {
    if (!enemy.alive) {
      enemy.deathTimer++;
      continue;
    }
    
    enemy.x += enemy.vx;
    const plat = platforms.find(p => enemy.x <= p.x || enemy.x + enemy.w >= p.x + p.w);
    if (plat) {
      if (enemy.x <= plat.x) { enemy.x = plat.x; enemy.vx *= -1; }
      if (enemy.x + enemy.w >= plat.x + plat.w) { enemy.x = plat.x + plat.w - enemy.w; enemy.vx *= -1; }
    }
    
    if (player.invincible === 0) {
      if (player.x + player.w > enemy.x && player.x < enemy.x + enemy.w &&
          player.y + player.h > enemy.y && player.y < enemy.y + enemy.h) {
        if (player.vy > 0 && player.y + player.h < enemy.y + enemy.h * 0.7) {
          enemy.alive = false;
          player.vy = -8;
          score += 50;
          playSound('enemy');
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: enemy.x + enemy.w/2, y: enemy.y + enemy.h/2,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 25,
              color: '#9B59B6'
            });
          }
        } else {
          loseLife();
        }
      }
    }
  }
  
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
  
  player.animTimer++;
  if (player.animTimer > 8) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % 4;
  }
  
  updateHUD();
}

function levelComplete() {
  gameState = 'levelComplete';
  score += 500 * (currentLevel + 1);
  playSound('levelUp');
  document.getElementById('level-score').textContent = score;
  document.getElementById('level-complete-screen').classList.remove('hidden');
}

function updateHUD() {
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('level').textContent = `Level: ${currentLevel + 1}`;
  document.getElementById('lives').textContent = `Lives: ${'♥'.repeat(lives)}`;
  document.getElementById('best-score').textContent = `Best: ${bestScore}`;
}

function updateTitleScreen() {
  document.getElementById('title-screen').classList.remove('hidden');
  document.getElementById('title-best').textContent = bestScore;
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
}

function draw() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#5DA9E9';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(80 + i * 150, 60, 40, 30);
    ctx.fillRect(100 + i * 150, 40, 50, 25);
  }
  
  for (const plat of platforms) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(plat.x, plat.y, plat.w, 6);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(plat.x + 2, plat.y + 2, plat.w - 4, 3);
  }
  
  for (const coin of coins) {
    if (coin.collected) continue;
    coin.anim += 0.1;
    const bounce = Math.sin(coin.anim) * 3;
    const scale = coin.scale;
    
    ctx.save();
    ctx.translate(coin.x, coin.y + bounce);
    ctx.scale(scale, scale);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    if (coin.scale > 0.1) {
      coin.scale -= 0.08;
    }
  }
  
  for (const enemy of enemies) {
    if (!enemy.alive && enemy.deathTimer > 20) continue;
    
    const squash = !enemy.alive ? (1 - enemy.deathTimer / 20) : 1;
    const wobble = !enemy.alive ? 0 : Math.sin(Date.now() / 150) * 0.1;
    
    ctx.save();
    ctx.translate(enemy.x + enemy.w/2, enemy.y + enemy.h);
    ctx.scale(1, squash);
    ctx.translate(-(enemy.x + enemy.w/2), -(enemy.y + enemy.h));
    
    ctx.fillStyle = '#9B59B6';
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.w/2, enemy.y + enemy.h - 4, enemy.w/2, enemy.h/2 + wobble * 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath();
    ctx.arc(enemy.x + 8, enemy.y + 8, 4, 0, Math.PI * 2);
    ctx.arc(enemy.x + enemy.w - 8, enemy.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(enemy.x + 8, enemy.y + 9, 2, 0, Math.PI * 2);
    ctx.arc(enemy.x + enemy.w - 8, enemy.y + 9, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  for (const p of particles) {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
  
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  
  const flashColor = player.isHurt ? '#fff' : null;
  
  ctx.fillStyle = flashColor || '#FF6B6B';
  ctx.fillRect(player.x + 4, player.y + 8, player.w - 8, player.h - 8);
  
  ctx.fillStyle = flashColor || '#FF8A80';
  ctx.fillRect(player.x + 6, player.y + 10, player.w - 12, 4);
  
  ctx.fillStyle = flashColor || '#FFE66D';
  const eyeY = player.onGround ? player.y + 12 : player.y + 10;
  ctx.fillRect(player.x + 6, eyeY, 6, 6);
  ctx.fillRect(player.x + player.w - 12, eyeY, 6, 6);
  
  ctx.fillStyle = '#333';
  ctx.fillRect(player.x + 8, eyeY + 2, 2, 2);
  ctx.fillRect(player.x + player.w - 10, eyeY + 2, 2, 2);
  
  if (!player.onGround) {
    ctx.fillStyle = flashColor || '#FF6B6B';
    ctx.fillRect(player.x, player.y + 6, 4, 6);
    ctx.fillRect(player.x + player.w - 4, player.y + 6, 4, 6);
  }
  
  ctx.fillStyle = flashColor || '#CC5555';
  ctx.fillRect(player.x + 6, player.y + player.h - 4, 6, 4);
  ctx.fillRect(player.x + player.w - 12, player.y + player.h - 4, 6, 4);
  
  if (player.facing === 1) {
    ctx.fillStyle = flashColor || '#FF6B6B';
    ctx.fillRect(player.x + player.w - 2, player.y + 10, 4, 10);
  } else {
    ctx.fillStyle = flashColor || '#FF6B6B';
    ctx.fillRect(player.x - 2, player.y + 10, 4, 10);
  }
  
  ctx.globalAlpha = 1;
  
  document.getElementById('hud').style.display = gameState === 'playing' ? 'flex' : 'none';
  document.getElementById('best-score').style.display = gameState === 'playing' ? 'block' : 'none';
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

updateTitleScreen();
gameLoop();