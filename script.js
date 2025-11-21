/* NEblox Game – Level System + Shooting + Door + Quiz */

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

// Load sprites
function loadImage(src){ const i = new Image(); i.src = src; return i; }
const img = {
  bg: loadImage('assets/background.png'),
  player: loadImage('assets/player.png'),
  projectile: loadImage('assets/projectile.png'),
  e1: loadImage('assets/enemy1.png'),
  e2: loadImage('assets/enemy2.png'),
  key: loadImage('assets/key.png'),
  door: loadImage('assets/door.png')
};

// Levels
const levels = [
  {
    platforms: [
      {x:0,y:420,w:900,h:80},
      {x:220,y:300,w:180,h:36},
      {x:580,y:350,w:220,h:36},
      {x:700,y:300,w:80,h:36}
    ],
    playerStart: {x:80,y:360},
    enemies: [
      {x:720,y:252,w:48,h:48,hp:3,sprite:'e1'}
    ],
    key: {x:310,y:380,w:28,h:40},
    door: {x:840,y:350,w:48,h:70}
  },
  {
    platforms: [
      {x:0,y:420,w:900,h:80},
      {x:140,y:340,w:140,h:36},
      {x:360,y:300,w:160,h:36},
      {x:560,y:260,w:120,h:36},
      {x:740,y:320,w:140,h:36}
    ],
    playerStart: {x:60,y:360},
    enemies: [
      {x:380,y:252,w:48,h:48,hp:4,sprite:'e2'},
      {x:760,y:272,w:48,h:48,hp:3,sprite:'e1'}
    ],
    key: {x:520,y:270,w:28,h:40},
    door: {x:840,y:350,w:48,h:70}
  }
];

let currentLevel = 0;
let player = {};
let projectiles = [];
let attackCooldown = false;
let playerInvul = false;
let keys = {}, mobile = {};
let started = false, paused = false;

// ───────── INPUT ─────────
document.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.key] = false; });

[leftBtn,rightBtn,jumpBtn,attackBtn].forEach(btn =>
  btn.addEventListener('contextmenu', e => e.preventDefault())
);

leftBtn.onmousedown = () => mobile.left = true;
rightBtn.onmousedown = () => mobile.right = true;
jumpBtn.onmousedown = () => mobile.jump = true;
attackBtn.onmousedown = () => mobile.attack = true;
leftBtn.onmouseup = rightBtn.onmouseup = jumpBtn.onmouseup = attackBtn.onmouseup = () => {
  mobile.left = mobile.right = mobile.jump = mobile.attack = false;
};

startBtn.onclick = () => {
  startScreen.style.display = 'none';
  mobileControls.style.display = window.innerWidth < 900 ? 'flex' : 'none';
  started = true;
  loadLevel(currentLevel);
};

// ───────── HELPERS ─────────
function rectOverlap(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function createPlayer(x,y){
  return { x, y, w:48, h:64, vx:0, vy:0, speed:4.5, jump:-13, hp:3, onGround:false };
}

function loadLevel(idx){
  currentLevel = idx;
  const L = levels[idx];
  player = createPlayer(L.playerStart.x, L.playerStart.y);
  L.key.collected = false;
  L.key.taken = false;
  L.enemies.forEach(e => { e.alive = true; e.x0 = e.x; e.dir = 1; });
  projectiles = [];
}

// ───────── QUIZ ─────────
const questions = [
  {q:'Ibukota Indonesia?', a:'jakarta'},
  {q:'Planet terbesar?', a:'jupiter'},
  {q:'Gunung tertinggi?', a:'everest'}
];

function askQuestion(callback){
  paused = true;
  questionBox.style.display = 'flex';
  const q = questions[Math.floor(Math.random()*questions.length)];
  questionText.textContent = q.q;
  answerInput.value = '';
  answerInput.focus();

  function submit(){
    let ok = answerInput.value.toLowerCase().trim() === q.a;
    questionBox.style.display = 'none';
    paused = false;
    callback(ok);
  }
  function cancel(){
    questionBox.style.display = 'none';
    paused = false;
    callback(false);
  }
  answerBtn.onclick = submit;
  cancelBtn.onclick = cancel;
}

// ───────── PROJECTILE ─────────
function shoot(){
  if (attackCooldown) return;
  attackCooldown = true;
  setTimeout(() => attackCooldown = false, 300);
  projectiles.push({x:player.x+player.w, y:player.y+20, w:18,h:12, vx:9});
}

// ───────── UPDATE ─────────
function update(){
  if (!started || paused) return;
  const L = levels[currentLevel];

  const left = keys['a'] || keys['ArrowLeft'] || mobile.left;
  const right = keys['d'] || keys['ArrowRight'] || mobile.right;
  const jump = keys['w'] || keys['ArrowUp'] || keys[' '] || mobile.jump;
  const fire = keys['x'] || keys['X'] || mobile.attack;

  player.vx = left ? -player.speed : right ? player.speed : 0;

  if (jump && player.onGround){ player.vy = player.jump; player.onGround = false; }
  player.vy += 0.9;
  player.x += player.vx;
  player.y += player.vy;

  // bound edges
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > W) player.x = W - player.w;
  if (player.y > H+100) loadLevel(currentLevel);

  // platform collision
  player.onGround = false;
  L.platforms.forEach(p=>{
    let r = {x:p.x, y:p.y-6, w:p.w, h:12};
    if (rectOverlap(player,r) && player.vy>=0){
      player.y = p.y-player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  // enemy movement + damage
  L.enemies.forEach(e=>{
    if (!e.alive) return;
    e.x += 1.2 * e.dir;
    if (e.x < e.x0-80) e.dir = 1;
    if (e.x > e.x0+80) e.dir = -1;

    if (rectOverlap(player,e) && !playerInvul){
      player.hp--;
      playerInvul = true;
      setTimeout(()=> playerInvul=false,700);
      if (player.hp <= 0){ alert('Game Over!'); loadLevel(0); }
    }
  });

  // projectile hit
  projectiles.forEach((p,i)=>{
    p.x += p.vx;
    if (p.x > W+20) projectiles.splice(i,1);
    L.enemies.forEach(e=>{
      if (e.alive && rectOverlap(p,e)){
        e.hp--; projectiles.splice(i,1);
        if (e.hp <= 0) e.alive = false;
      }
    });
  });

  if (fire) shoot();

  // key
  if (!L.key.collected && rectOverlap(player,L.key)){
    if (!L.key.taken){
      L.key.taken = true;
      askQuestion(correct=>{
        if (correct) L.key.collected = true;
        else { alert('Jawaban salah!'); L.key.taken=false; }
      });
    }
  }

  // door
  if (L.key.collected && rectOverlap(player,L.door)){
    currentLevel++;
    if (currentLevel >= levels.length){
      alert('🎉 Kamu Menang Semua Level!');
      currentLevel = 0;
    } else alert('Level Selesai!');
    loadLevel(currentLevel);
  }
}

// ───────── DRAW ─────────
function draw(){
  ctx.clearRect(0,0,W,H);
  const L = levels[currentLevel];

  ctx.drawImage(img.bg,0,0,W,H);

  L.platforms.forEach(p=>{
    ctx.fillStyle = "#8b5f3b";
    ctx.fillRect(p.x,p.y,p.w,p.h);
  });

  if (!L.key.collected) ctx.drawImage(img.key, L.key.x,L.key.y,L.key.w,L.key.h);
  ctx.drawImage(img.door, L.door.x,L.door.y,L.door.w,L.door.h);

  L.enemies.forEach(e=>{
    if (!e.alive) return;
    ctx.drawImage(img[e.sprite], e.x,e.y,e.w,e.h);
  });

  projectiles.forEach(p=> ctx.drawImage(img.projectile, p.x,p.y,p.w,p.h));
  ctx.drawImage(img.player, player.x,player.y,player.w,player.h);

  for (let i=0;i<3;i++){
    ctx.fillStyle = i<player.hp ? "#ff4d4d" : "#555";
    ctx.fillRect(12+i*28,12,22,12);
  }
}

// ───────── LOOP ─────────
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loadLevel(0);
loop();
