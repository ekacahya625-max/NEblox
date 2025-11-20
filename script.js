/* NEblox Projectile Edition - Level 1 & 2 */
/* Assets required: assets/background.png, player.png, projectile.png, enemy1.png, enemy2.png, key.png, door.png
   If not found, code draws colored boxes (fallback). */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 900, H = 500;
canvas.width = W; canvas.height = H;

// UI
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const questionBox = document.getElementById('questionBox');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const answerBtn = document.getElementById('answerBtn');
const cancelBtn = document.getElementById('cancelBtn');
const mobileControls = document.getElementById('mobileControls');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const attackBtn = document.getElementById('attackBtn');

// Load images (optional)
function loadImage(src){ const i = new Image(); i.src = src; return i; }
const img = {
  bg: loadImage('assets/background.png'),
  player: loadImage('assets/player.png'),
  projectile: loadImage('assets/projectile.png'),
  e1: loadImage('assets/enemy1.png'),
  e2: loadImage('assets/enemy2.png'),
  key: loadImage('assets/key.png'),
  door: loadImage('assets/door.png'),
};

// Game state: multiple levels
const levels = [
  { // Level 1
    platforms: [
      {x:0,y:420,w:900,h:80},
      {x:220,y:300,w:180,h:36},
      {x:580,y:350,w:220,h:36},
      {x:700,y:300,w:80,h:36}
    ],
    playerStart: {x:80,y:360},
    enemies: [
      {x:720,y:252,w:48,h:48,hp:3, sprite: 'e1'} // on platform 700,300 (y adjusted so stands on top)
    ],
    key: {x:310,y:380,w:28,h:40},
    door: {x:840,y:350,w:48,h:70}
  },
  { // Level 2 - different layout and new enemy
    platforms: [
      {x:0,y:420,w:900,h:80},
      {x:140,y:340,w:140,h:36},
      {x:360,y:300,w:160,h:36},
      {x:560,y:260,w:120,h:36},
      {x:740,y:320,w:140,h:36}
    ],
    playerStart: {x:60,y:360},
    enemies: [
      {x:380,y:252,w:48,h:48,hp:4, sprite:'e2'},
      {x:760,y:272,w:48,h:48,hp:3, sprite:'e1'}
    ],
    key: {x:520,y:270,w:28,h:40},
    door: {x:840,y:350,w:48,h:70}
  }
];

let currentLevel = 0;

// Entities
let player = createPlayer();
let projectiles = []; // active projectiles
let attackCooldown = false;
let playerInvul = false;

// Input
let keys = {};
let mobile = {left:false,right:false,jump:false,attack:false};
let started = false, paused = false;

function createPlayer(){
  return {
    x: levels[currentLevel].playerStart.x,
    y: levels[currentLevel].playerStart.y,
    w:48,h:64, vx:0, vy:0, speed:4.5, jumpPower:-13,
    hp:3
  };
}

// Helpers
function rectOverlap(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Fit canvas CSS to viewport
function fitCanvas(){ canvas.style.width = window.innerWidth + 'px'; canvas.style.height = window.innerHeight + 'px'; }
window.addEventListener('resize', fitCanvas); fitCanvas();

// Input handlers
document.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
document.addEventListener('keyup', e => keys[e.key] = false);

// Mobile button handlers
leftBtn.addEventListener('touchstart',e=>{ mobile.left=true; e.preventDefault(); });
leftBtn.addEventListener('touchend',e=>{ mobile.left=false; e.preventDefault(); });
leftBtn.addEventListener('mousedown', ()=> mobile.left=true);
leftBtn.addEventListener('mouseup', ()=> mobile.left=false);

rightBtn.addEventListener('touchstart',e=>{ mobile.right=true; e.preventDefault(); });
rightBtn.addEventListener('touchend',e=>{ mobile.right=false; e.preventDefault(); });
rightBtn.addEventListener('mousedown', ()=> mobile.right=true);
rightBtn.addEventListener('mouseup', ()=> mobile.right=false);

jumpBtn.addEventListener('touchstart',e=>{ mobile.jump=true; e.preventDefault(); });
jumpBtn.addEventListener('touchend',e=>{ mobile.jump=false; e.preventDefault(); });
jumpBtn.addEventListener('mousedown', ()=> mobile.jump=true);
jumpBtn.addEventListener('mouseup', ()=> mobile.jump=false);

attackBtn.addEventListener('touchstart',e=>{ mobile.attack=true; e.preventDefault(); });
attackBtn.addEventListener('touchend',e=>{ mobile.attack=false; e.preventDefault(); });
attackBtn.addEventListener('mousedown', ()=> mobile.attack=true);
attackBtn.addEventListener('mouseup', ()=> mobile.attack=false);

// Start button
startBtn.addEventListener('click', ()=>{
  startScreen.style.display = 'none';
  mobileControls.style.display = window.innerWidth < 900 ? 'flex' : 'none';
  started = true; paused = false;
  loadLevel(currentLevel);
});

// Load level setup
function loadLevel(idx){
  const L = levels[idx];
  // reset player
  player.x = L.playerStart.x; player.y = L.playerStart.y; player.vx=0; player.vy=0; player.hp=3;
  // build enemy objects
  L.enemies.forEach(e=>{ e.alive = true; e.dir = 1; e.x0 = e.x; });
  // reset projectiles & flags
  projectiles = [];
  attackCooldown = false;
  playerInvul = false;
  // apply key & door
  // show question modal disabled
}

// Question modal
const questions = [
  {q:"Ibukota Indonesia?", a:"jakarta"},
  {q:"Planet terbesar?", a:"jupiter"},
  {q:"Gunung tertinggi?", a:"everest"}
];
function askQuestion(callback){
  paused = true;
  questionBox.classList.add('show'); questionBox.style.display='flex';
  const q = questions[Math.floor(Math.random()*questions.length)];
  questionText.textContent = q.q;
  answerInput.value = ''; answerInput.focus();
  function submit(){ const ans = answerInput.value.toLowerCase().trim(); closeModal(); callback(ans===q.a); }
  function cancel(){ closeModal(); callback(false); }
  function closeModal(){ questionBox.classList.remove('show'); setTimeout(()=> questionBox.style.display='none',160); paused=false; answerBtn.removeEventListener('click', submit); cancelBtn.removeEventListener('click', cancel); }
  answerBtn.addEventListener('click', submit);
  cancelBtn.addEventListener('click', cancel);
}

// Attack (projectile)
function shoot(){
  if (attackCooldown) return;
  attackCooldown = true;
  setTimeout(()=> attackCooldown = false, 300); // 300ms cooldown

  const dir = 1; // always to right (simple)
  const proj = { x: player.x + player.w + 6, y: player.y + 20, w:18, h:12, vx: 9 * dir, sprite: 'projectile' };
  projectiles.push(proj);
}

// Game update
let lastTime=0;
function update(dt){
  if (!started || paused) return;
  const L = levels[currentLevel];

  // input
  const left = keys['ArrowLeft'] || keys['a'] || mobile.left;
  const right = keys['ArrowRight'] || keys['d'] || mobile.right;
  const wantJump = keys[' '] || keys['w'] || keys['ArrowUp'] || mobile.jump;
  const wantShoot = keys['x'] || keys['X'] || mobile.attack;

  // movement
  player.vx = 0;
  if (left) player.vx = -player.speed;
  if (right) player.vx = player.speed;

  if (wantJump && player.onGround){
    player.vy = player.jumpPower;
    player.onGround = false;
  }
  // gravity
  player.vy += 0.9;
  player.x += player.vx;
  player.y += player.vy;

  // bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > W) player.x = W - player.w;
  if (player.y > H + 100) { // fell
    respawn();
  }

  // platform collisions: snap to top only
  player.onGround = false;
  for (let p of L.platforms){
    const topRect = {x:p.x, y:p.y - 6, w:p.w, h:8};
    if (rectOverlap(player, topRect) && player.vy >= 0){
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // enemies AI and collisions
  L.enemies.forEach(e=>{
    if (!e.alive) return;
    // simple patrol: vary around x0 +- range
    e.x += 1.2 * e.dir;
    if (e.x < e.x0 - 80) e.dir = 1;
    if (e.x > e.x0 + 80) e.dir = -1;

    // collision player <-> enemy (touch damage)
    if (rectOverlap(player, e) && !playerInvul){
      player.hp--;
      playerInvul = true;
      setTimeout(()=> playerInvul = false, 800);
      if (player.hp <= 0){ paused = true; setTimeout(()=> alert('Kamu kalah! Refresh untuk coba lagi.'),50); }
    }
  });

  // projectiles move & collision with enemies
  projectiles.forEach((p, idx) => {
    p.x += p.vx;
    // remove if off screen
    if (p.x > W + 50) { projectiles.splice(idx,1); return; }
    // check collision with each enemy
    L.enemies.forEach(e=>{
      if (!e.alive) return;
      if (rectOverlap(p, e)){
        e.hp--; projectiles.splice(idx,1);
        // knockback small
        e.x += (e.dir > 0 ? 20 : -20);
        if (e.hp <= 0){ e.alive = false; }
      }
    });
  });

  // pick up key: need to show question before final pickup
  const keyObj = L.key;
  if (!keyObj.taken && rectOverlap(player, keyObj)){
    // show question
    keyObj.taken = true; // temporarily block repeated triggers while modal shows
    askQuestion(correct=>{
      if (correct){
        keyObj.collected = true;
        // small feedback
      } else {
        keyObj.taken = false; // allow retry
        alert('Jawaban salah. Coba lagi.');
      }
    });
  }

  // door: only works if key collected
  const doorObj = L.door;
  if (L.key.collected && rectOverlap(player, doorObj)){
    // level complete -> next level or win
    paused = true;
    setTimeout(()=> {
      currentLevel++;
      if (currentLevel >= levels.length){
        alert('Kamu menyelesaikan semua level! Selamat!');
        // reset game
        currentLevel = 0;
      } else {
        alert('Selamat! Lanjut level ' + (currentLevel+1));
      }
      loadLevel(currentLevel);
      paused = false;
    }, 120);
  }

  // shoot handling
  if (wantShoot) shoot();

}

// draw
function draw(){
  // clear
  ctx.clearRect(0,0,W,H);
  // background
  if (img.bg.complete) ctx.drawImage(img.bg,0,0,W,H);
  else { ctx.fillStyle='#87CEEB'; ctx.fillRect(0,0,W,H); }

  // draw platforms
  const L = levels[currentLevel];
  for (let p of L.platforms){
    // top tile
    ctx.fillStyle = '#d2b58a';
    ctx.fillRect(p.x, p.y - 8, p.w, 12);
    // body
    ctx.fillStyle = '#8b5f3b';
    ctx.fillRect(p.x, p.y + 4, p.w, p.h - 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.strokeRect(p.x, p.y - 8, p.w, p.h + 0);
  }

  // draw key
  const k = L.key;
  if (!k.collected){
    if (img.key.complete) ctx.drawImage(img.key, k.x, k.y, k.w, k.h);
    else { ctx.fillStyle='#f6c544'; ctx.fillRect(k.x,k.y,k.w,k.h); }
  }

  // draw door
  const d = L.door;
  if (img.door.complete) ctx.drawImage(img.door, d.x, d.y, d.w, d.h);
  else { ctx.fillStyle='#6b3f1f'; ctx.fillRect(d.x,d.y,d.w,d.h); }

  // draw enemies
  L.enemies.forEach(e=>{
    if (!e.alive) return;
    if (img[e.sprite] && img[e.sprite].complete) ctx.drawImage(img[e.sprite], e.x, e.y, e.w, e.h);
    else {
      ctx.fillStyle = '#c62828'; ctx.fillRect(e.x,e.y,e.w,e.h);
      ctx.fillStyle='#fff'; ctx.fillRect(e.x+8,e.y+10,8,8);
    }
    // enemy hp bar
    ctx.fillStyle = '#222'; ctx.fillRect(e.x, e.y - 8, e.w, 6);
    ctx.fillStyle = '#ff5555'; ctx.fillRect(e.x, e.y - 8, e.w * Math.max(0,e.hp)/4, 6);
  });

  // draw projectiles
  projectiles.forEach(p=>{
    if (img.projectile.complete) ctx.drawImage(img.projectile, p.x, p.y, p.w, p.h);
    else { ctx.fillStyle='#ffd24d'; ctx.fillRect(p.x,p.y,p.w,p.h); }
  });

  // draw player
  if (img.player.complete) ctx.drawImage(img.player, player.x, player.y, player.w, player.h);
  else {
    ctx.fillStyle = '#2ecc71'; ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // HUD: hp
  for (let i=0;i<3;i++){
    if (i < player.hp) ctx.fillStyle = '#ff4d4d'; else ctx.fillStyle = '#777';
    ctx.fillRect(12 + i*28, 12, 22, 12);
  }

  // show key icon if collected
  if (L.key.collected){
    ctx.fillStyle = '#f6c544'; ctx.fillRect(12, 34, 18, 10);
  }
}

// respawn
function respawn(){
  player.x = levels[currentLevel].playerStart.x;
  player.y = levels[currentLevel].playerStart.y;
  player.vx = 0; player.vy = 0; player.hp = 3;
  projectiles = [];
  playerInvul = false;
}

// load level helper
function loadLevel(idx){
  // ensure idx within range
  if (idx < 0) idx = 0;
  if (idx >= levels.length) idx = levels.length - 1;
  currentLevel = idx;
  const L = levels[currentLevel];
  // reset key/door flags
  L.key.taken = false; L.key.collected = false;
  // ensure enemies have hp & alive flag
  L.enemies.forEach(e=>{ e.alive = true; e.hp = e.hp || 3; e.x0 = e.x; e.dir = 1; });
  // reset player
  player.x = L.playerStart.x; player.y = L.playerStart.y; player.vx = player.vy = 0; player.hp = 3;
  projectiles = [];
}

// main loop
let last = performance.now();
function loop(now){
  const dt = now - last; last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// show mobile controls on small screens
if (window.innerWidth < 900) mobileControls.style.display = 'flex';
else mobileControls.style.display = 'none';

// helper: rectangle overlap (reuse)
function rectOverlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// initial load
loadLevel(0);
