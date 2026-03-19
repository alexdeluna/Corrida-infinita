vou te mandar os arquivos app.js e index.html pata vc verificar o morivo pelo qual o jogo quebrou.

app.js

// ================= CANVAS =================
const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

// ================= CONFIG =================
const MAX_ENEMIES = 7
const MIN_DISTANCE = 70

// ================= STATE =================
let player, bullets=[]
let enemies=[], blues=[], yellows=[], hunters=[], whites=[], snipers=[]
let enemyBullets=[]
let powerUps=[]

let satellites=0

let score=0, lives=3, bombs=0
let lastShot=0, lastSpawn=0

let nextPowerUpScore=50
let nextLifeScore=100
let nextBombScore=10

// boss
let isBoss=false
let boss=null
let phase=1
let bossState="move"
let bossTimer=0

let gameRunning=false
let isPaused=false

// ================= UI =================
const scoreText = document.getElementById("score")
const livesText = document.getElementById("lives")
const bombText = document.getElementById("bombCount")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")
const bombBtn = document.getElementById("bomb")

const pauseBtn = document.getElementById("pause")
const resumeBtn = document.getElementById("resume")
const saveBtn = document.getElementById("save")
const loadBtn = document.getElementById("load")

startBtn.onclick=startGame
bombBtn.onclick=useBomb
pauseBtn.onclick=pauseGame
resumeBtn.onclick=resumeGame
saveBtn.onclick=saveGame
loadBtn.onclick=loadGame

// ================= START =================
function startGame(){

player={x:130,y:450,width:40,height:40}

bullets=[]
enemies=[];blues=[];yellows=[];hunters=[];whites=[];snipers=[]
enemyBullets=[]
powerUps=[]

satellites=0

score=0; lives=3; bombs=0
nextPowerUpScore=50
nextLifeScore=100
nextBombScore=10

phase=1; isBoss=false
isPaused=false

gameRunning=true
startBtn.disabled=true

updateUI()
gameLoop()
}

// ================= CONTROLES =================
let moveLeft=false, moveRight=false

leftBtn.ontouchstart=()=>moveLeft=true
leftBtn.ontouchend=()=>moveLeft=false
rightBtn.ontouchstart=()=>moveRight=true
rightBtn.ontouchend=()=>moveRight=false

document.addEventListener("keydown",e=>{
if(e.key==="ArrowLeft") moveLeft=true
if(e.key==="ArrowRight") moveRight=true
})
document.addEventListener("keyup",e=>{
if(e.key==="ArrowLeft") moveLeft=false
if(e.key==="ArrowRight") moveRight=false
})

// ================= AUX =================
function collide(a,b){
return a.x<b.x+b.width && a.x+a.width>b.x &&
a.y<b.y+b.height && a.y+a.height>b.y
}

function totalEnemies(){
return enemies.length+blues.length+yellows.length+hunters.length+whites.length+snipers.length
}

function isFar(x){
return [...enemies,...blues,...yellows,...hunters,...whites,...snipers]
.every(e=>Math.abs(e.x-x)>MIN_DISTANCE)
}

function updateUI(){
scoreText.innerText=score
livesText.innerText=lives
bombText.innerText=bombs
bombBtn.disabled = bombs <= 0
}

// ================= PAUSA =================
function pauseGame(){
isPaused = true
pauseBtn.style.display="none"
resumeBtn.style.display="inline-block"
}

function resumeGame(){
isPaused = false
pauseBtn.style.display="inline-block"
resumeBtn.style.display="none"
gameLoop()
}

// ================= SAVE =================
function saveGame(){

const saveData={
player,bullets,enemies,blues,yellows,hunters,whites,snipers,
enemyBullets,powerUps,satellites,
score,lives,bombs,phase,boss,isBoss,
nextBombScore,nextLifeScore,nextPowerUpScore
}

localStorage.setItem("saveGame", JSON.stringify(saveData))
alert("Jogo salvo!")
}

function loadGame(){

const data=localStorage.getItem("saveGame")

if(!data){
alert("Nenhum save encontrado")
return
}

const save=JSON.parse(data)

player=save.player
bullets=save.bullets
enemies=save.enemies
blues=save.blues
yellows=save.yellows
hunters=save.hunters
whites=save.whites
snipers=save.snipers
enemyBullets=save.enemyBullets
powerUps=save.powerUps

satellites=save.satellites
score=save.score
lives=save.lives
bombs=save.bombs
phase=save.phase

boss=save.boss
isBoss=save.isBoss

nextBombScore=save.nextBombScore
nextLifeScore=save.nextLifeScore
nextPowerUpScore=save.nextPowerUpScore

gameRunning=true
isPaused=false

updateUI()
gameLoop()

alert("Jogo carregado!")
}

// ================= DAMAGE =================
function takeDamage(){
if(satellites>0){
satellites--
}else{
lives--
}
if(lives<=0) endGame()
updateUI()
}

// ================= TIRO =================
function shoot(){

bullets.push({x:player.x+17,y:player.y,width:6,height:15,speed:7})

if(satellites>=1){
bullets.push({x:player.x+45,y:player.y,width:6,height:15,speed:7})
}
if(satellites>=2){
bullets.push({x:player.x-10,y:player.y,width:6,height:15,speed:7})
}
}

// ================= SPAWN =================
function spawnSmartEnemy(){

if(totalEnemies()>=MAX_ENEMIES) return

let attempts=0

while(attempts<5){

let x=Math.random()*260
if(!isFar(x)){attempts++;continue}

let r=Math.random()

if(score>=40 && Math.random()<0.15){
spawnSniper(x)
return
}

if(score<20){
spawnRed(x)
return
}

if(score<50){
if(r<0.5) spawnRed(x)
else if(r<0.8) spawnBlue(x)
else spawnYellow(x)
return
}

if(r<0.2) spawnRed(x)
else if(r<0.4) spawnBlue(x)
else if(r<0.6) spawnYellow(x)
else if(r<0.8) spawnHunter(x)
else spawnWhite(x)

return
}
}

// ================= SPAWN TYPES =================
function spawnRed(x){
enemies.push({x,y:-40,width:40,height:40,speed:2+score*0.03})
}

function spawnBlue(x){
blues.push({
x,y:-30,width:30,height:30,
vx:(Math.random()<0.5?-2:2)*(1+score*0.01),
vy:3+score*0.02
})
}

function spawnYellow(x){
yellows.push({x,y:0,width:30,height:30,state:"wait",time:Date.now()})
}

function spawnHunter(x){
hunters.push({x,y:-30,width:30,height:30,hp:3,last:0})
}

function spawnWhite(x){
whites.push({x,y:-30,width:30,height:30,hp:2,angle:0})
}

function spawnSniper(x){
snipers.push({x,y:20,width:40,height:40,hp:10,lastShot:0})
}

// ================= POWER-UP =================
function spawnPowerUp(){
powerUps.push({x:Math.random()*260,y:-30,width:30,height:30,speed:2})
}

// ================= BOMBA =================
function useBomb(){

if(bombs<=0) return

bombs--

enemies=[]
blues=[]
yellows=[]
hunters=[]
whites=[]
snipers=[]
enemyBullets=[]

updateUI()
}

// ================= UPDATE =================
function update(){

if(isPaused) return

if(moveLeft) player.x-=5
if(moveRight) player.x+=5

player.x=Math.max(0,Math.min(canvas.width-player.width,player.x))

const now=Date.now()

if(score>=20 && now-lastShot>500){
shoot()
lastShot=now
}

if(score>=nextBombScore){
bombs++
nextBombScore+=10
}

if(now-lastSpawn>1000){
spawnSmartEnemy()
lastSpawn=now
}

if(totalEnemies()===0){
spawnRed(Math.random()*260)
}

if(score>=nextPowerUpScore){
spawnPowerUp()
nextPowerUpScore+=20
}

// restante lógica mantida igual...

updateUI()
}

// ================= LOOP =================
function gameLoop(){
if(!gameRunning || isPaused) return
update()
draw()
requestAnimationFrame(gameLoop)
}

// ================= END =================
function endGame(){
gameRunning=false
alert("Game Over\nPontuação: "+score)
startBtn.disabled=false
}

// ================= PWA =================
if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js")
}


index.htnl

<!DOCTYPE html>
<html lang="pt-br">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Desvie dos Obstáculos PRO</title>

<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="style.css">

<style>

/* ===== TOPO INFO ===== */
.top-bar{
display:flex;
justify-content:space-around;
font-size:14px;
margin-top:10px;
}

/* ===== CANVAS ===== */
canvas{
background:#222;
display:block;
margin:10px auto;
border-radius:10px;
}

/* ===== CONTROLES ===== */
.controls{
display:flex;
justify-content:space-between;
width:90%;
margin:10px auto;
}

.controls button{
width:45%;
padding:15px;
font-size:22px;
border:none;
border-radius:10px;
}

/* ===== AREA INFERIOR ===== */
.bottom-area{
display:flex;
justify-content:center;
align-items:center;
gap:10px;
margin:10px;
}

/* ===== BOTÃO START ===== */
#start{
padding:10px 20px;
font-size:16px;
}

/* ===== PAINEL EXTRA ===== */
.side-panel{
display:flex;
flex-direction:column;
gap:5px;
}

.side-panel button{
font-size:12px;
padding:6px;
border:none;
border-radius:6px;
}

/* ===== BOMBA ===== */
#bomb{
padding:10px;
font-size:18px;
}

/* ===== DESATIVADO ===== */
button:disabled{
opacity:0.5;
}

</style>

</head>

<body>

<!-- ===== INFORMAÇÕES ===== -->
<div class="top-bar">
<div>Pontos: <span id="score">0</span></div>
<div>Recorde: <span id="best">0</span></div>
<div>Vidas: <span id="lives">3</span></div>
<div>Bombas: <span id="bombCount">0</span></div>
</div>

<!-- ===== JOGO ===== -->
<canvas id="game"></canvas>

<!-- ===== CONTROLES ===== -->
<div class="controls">
<button id="left">⬅️</button>
<button id="right">➡️</button>
</div>

<!-- ===== ÁREA INFERIOR ===== -->
<div class="bottom-area">

<button id="start">Iniciar</button>

<!-- PAINEL AO LADO DO START -->
<div class="side-panel">
<button id="pause">⏸️</button>
<button id="resume" style="display:none;">▶️</button>
<button id="save">💾</button>
<button id="load">📂</button>
</div>

<!-- BOMBA -->
<button id="bomb">💣</button>

</div>

<script src="app.js"></script>

</
