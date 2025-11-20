/* NEblox Game (using AI background) */
/* Put assets/background.png = AI-generated scene */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Internal resolution (keep consistent)
const W = 900, H = 500;
canvas.width = W;
canvas.height = H;

// UI elements
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const answerBtn = document.getElementById("answerBtn");
const cancelBtn = document.getElementById("cancelBtn");
const mobileControls = document.getElementById("mobileControls");

// Buttons
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");
const attackBtn = document.getElementById("attackBtn");

// Load background
const bgImg = new Image();
bgImg.src = 'assets/background.png';

// Simple game world: platforms defined manually to match background composition
// (You can tweak coordinates to better align with your background image)
const platforms = [
  // ground full width
  { x: 0, y: 420, w: 900, h: 80 },

  // left floating platform
  { x: 220, y: 300, w: 180, h: 36 },

  // step stack near right (where enemy stands)
  { x: 580, y: 350, w: 220, h: 36 },
  { x: 700, y: 300, w: 80, h: 36 } // higher step
];

// Player
let player = {
  x: 80, y: 360, w: 48, h: 64,
  vx: 0, vy: 0, speed: 4.5, jumpPower: -13,
  onGround: false, hp: 3,
  color: '#e74c3c'
};

// Enemy (will be drawn on platform top)
let enemy = {
  x: 720, y: 300 - 48, w: 48, h: 48,
  vx: 1.6, hp: 3, alive: true, dir: 1,
  color: '#c62828'
};

// Key (placed on ground in front of player)
let key = {
  x: 310, y: 380, w: 28, h: 40, taken: false
};

// Door (right side)
let door = {
  x: 840, y: 350, w: 48, h: 70
};

// Questions
const questions = [
  { q: "Ibukota Indonesia?", a: "jakarta" },
  { q: "Planet terbesar?", a: "jupiter" },
  { q: "Gunung tertinggi?", a: "everest" }
];

// Input state
let keys = {};
let mobile = { left:false, right:false, jump:false, attack:false };
let paused = false;
let started = false;

// Resize canvas CSS to fit viewport (keeps internal resolution unchanged)
function fitCanvas(){
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Controls (keyboard)
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  // prevent space scroll
  if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.key] = false);

// Mobile buttons (touch & mouse)
leftBtn.addEventListener('touchstart', e=>{ mobile.left=true; e.preventDefault(); });
leftBtn.addEventListener('touchend', e=>{ mobile.left=false; e.preventDefault(); });
leftBtn.addEventListener('mousedown', ()=> mobile.left=true);
leftBtn.addEventListener('mouseup', ()=> mobile.left=false);

rightBtn.addEventListener('touchstart', e=>{ mobile.right=true; e.preventDefault(); });
rightBtn.addEventListener('touchend', e=>{ mobile.right=false; e.preventDefault(); });
rightBtn.addEventListener('mousedown', ()=> mobile.right=true);
rightBtn.addEventListener('mouseup', ()=> mobile.right=false);

jumpBtn.addEventListener('touchstart', e=>{ mobile.jump=true; e.preventDefault(); });
jumpBtn.addEventListener('touchend', e=>{ mobile.jump=false; e.preventDefault(); });
jumpBtn.addEventListener('mousedown', ()=> mobile.jump=true);
jumpBtn.addEventListener('mouseup', ()=> mobile.jump=false);

attackBtn.addEventListener('touchstart', e=>{ mobile.attack=true; e.preventDefault(); });
attackBtn.addEventListener('touchend', e=>{ mobile.attack=false; e.preventDefault(); });
attackBtn.addEventListener('mousedown', ()=> mobile.attack=true);
attackBtn.addEventListener('mouseup', ()=> mobile.attack=false);

// Start game
startBtn.addEventListener('click', ()=>{
  startScreen.style.display = 'none';
  mobileControls.style.display = window.innerWidth < 900 ? 'flex' : 'none';
  started = true;
  paused = false;
});

// Question modal
function askQuestion(callback){
  paused = true;
  questionBox.classList.add('show');
  questionBox.style.display = 'flex';
  const q = questions[Math.floor(Math.random()*questions.length)];
  questionText.textContent = q.q;
  answerInput.value = '';
  answerInput.focus();

  function submit(){
    const ans = answerInput.value.toLowerCase().trim();
    questionBox.classList.remove('show');
    setTimeout(()=> questionBox.style.display='none', 180);
    paused = false;
    answerBtn.removeEventListener('click', submit);
    cancelBtn.removeEventListener('click', cancel);
    callback(ans === q.a);
  }
  function cancel(){
    questionBox.classList.remove('show');
    setTimeout(()=> questionBox.style.display='none', 180);
    paused = false;
    answerBtn.removeEventListener('click', submit);
    cancelBtn.removeEventListener('click', cancel);
    callback(false);
  }

  answerBtn.addEventListener('click', submit);
  cancelBtn.addEventListener('click', cancel);
}

// Simple AABB collision
function rectsOverlap(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Game update
function update(){
  if (!started || paused) return;

  // horizontal input
  let left = keys['ArrowLeft'] || keys['a'] || mobile.left;
  let right = keys['ArrowRight'] || keys['d'] || mobile.right;

  player.vx = 0;
  if (left) player.vx = -player.speed;
  if (right) player.vx = player.speed;

  // jump input (space key or mobile)
  let wantJump = keys[' '] || keys['w'] || keys['ArrowUp'] || mobile.jump;
  if (wantJump && player.onGround){
    player.vy = player.jumpPower;
    player.onGround = false;
  }

  // apply velocity
  player.x += player.vx;
  player.vy += 0.9; // gravity
  player.y += player.vy;

  // world bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > W) player.x = W - player.w;
  if (player.y > H) { // fell off
    respawnPlayer();
  }

  // platform collisions (simple)
  player.onGround = false;
  for (let p of platforms){
    // treat platform as solid from top only
    const topRect = { x: p.x, y: p.y - 6, w: p.w, h: 8 };
    const playerFuture = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (rectsOverlap(playerFuture, topRect) && player.vy >= 0){
      // snap to top
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // enemy AI: patrol on its platform area
  if (enemy.alive){
    enemy.x += enemy.vx * enemy.dir;
    // keep inside a patrol range roughly around starting x
    if (enemy.x < 600) enemy.dir = 1;
    if (enemy.x > 820) enemy.dir = -1;
  }

  // attack handling (keyboard 'x' or mobile attack)
  const attackPressed = keys['x'] || mobile.attack;
  if (attackPressed && !attackCooldown){
    doAttack();
  }

  // enemy touching player -> damage with cooldown
  if (enemy.alive && rectsOverlap(player, enemy) && !playerInvul){
    player.hp--;
    playerInvul = true;
    setTimeout(()=> playerInvul = false, 900);
    if (player.hp <= 0){
      setTimeout(()=> alert('Kamu kalah! (Refresh untuk coba lagi)'), 50);
      paused = true;
    }
  }

  // pick key
  if (!key.taken && rectsOverlap(player, key)){
    // show question before pickup
    key.taken = true; // mark to prevent repeat ask while modal open
    askQuestion(correct=>{
      if (correct){
        // keep key as taken and maybe show message
        // we'll set a flag to let door open
        key.taken = true;
      } else {
        // allow to try again later
        key.taken = false;
        alert('Jawaban salah, coba lagi.');
      }
    });
  }

  // door: only works if key.taken true
  if (key.taken && rectsOverlap(player, door)){
    paused = true;
    setTimeout(()=> alert('Level selesai! Selamat!'), 50);
  }
}

// attack implementation
let attackCooldown = false;
let playerInvul = false;
function doAttack(){
  attackCooldown = true;
  playerInvul = true; // small invul while attacking
  setTimeout(()=> playerInvul = false, 200);

  // define attack hitbox in front of player
  const hitbox = { x: player.x + player.w, y: player.y + 8, w: 36, h: player.h - 12 };
  if (rectsOverlap(hitbox, enemy) && enemy.alive){
    enemy.hp--;
    enemy.dir *= -1; // knockback direction change
    // simple feedback: if hp zero -> die
    if (enemy.hp <= 0){
      enemy.alive = false;
      // optionally drop reward
    }
  }

  setTimeout(()=> attackCooldown = false, 280);
}

// respawn player (simple)
function respawnPlayer(){
  player.x = 80; player.y = 360; player.vx = 0; player.vy = 0;
  player.hp = 3;
}

// draw
function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // draw background (fill canvas with AI-generated background)
  if (bgImg.complete) {
    // stretch background to cover internal canvas
    ctx.drawImage(bgImg, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#87CEEB'; ctx.fillRect(0,0,W,H);
  }

  // draw platforms (simple top tile)
  for (let p of platforms){
    // platform top
    ctx.fillStyle = '#cfae87';
    ctx.fillRect(p.x, p.y - 8, p.w, 12);
    // body
    ctx.fillStyle = '#8b5f3b';
    ctx.fillRect(p.x, p.y + 4, p.w, p.h - 4);
    // outline
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.strokeRect(p.x, p.y - 8, p.w, p.h + 0);
  }

  // draw key if not taken
  if (!key.taken){
    ctx.fillStyle = '#f6c544';
    ctx.fillRect(key.x, key.y, key.w, key.h);
    ctx.fillStyle = '#c28400';
    ctx.fillRect(key.x + 6, key.y + 6, key.w - 12, key.h - 12);
  }

  // draw door
  ctx.fillStyle = '#6b3f1f';
  ctx.fillRect(door.x, door.y, door.w, door.h);
  ctx.fillStyle = '#dfa86b';
  ctx.fillRect(door.x + 8, door.y + 10, door.w - 16, door.h - 20);

  // draw enemy
  if (enemy.alive){
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    // angry eye
    ctx.fillStyle = '#fff'; ctx.fillRect(enemy.x + 8, enemy.y + 10, 8, 8);
    ctx.fillStyle = '#000'; ctx.fillRect(enemy.x + 10, enemy.y + 12, 4, 4);
  }

  // draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // small face dot
  ctx.fillStyle = '#000'; ctx.fillRect(player.x + 8, player.y + 12, 6, 6);

  // HUD: player HP hearts
  for (let i=0;i<3;i++){
    ctx.strokeStyle = '#000';
    if (i < player.hp) ctx.fillStyle = '#ff4d4d'; else ctx.fillStyle = '#aaa';
    ctx.fillRect(12 + i*28, 12, 22, 12);
  }

  // optional: show key icon if taken
  if (key.taken){
    ctx.fillStyle = '#f6c544';
    ctx.fillRect(12, 34, 18, 10);
  }
}

// main loop
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

// make mobile controls visible if narrow
if (window.innerWidth < 900) {
  mobileControls.style.display = 'flex';
} else {
  mobileControls.style.display = 'none';
}
