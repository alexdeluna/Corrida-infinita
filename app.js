const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

// ========================
// CONFIG
// ========================

const MAX_ENEMIES = 6
const LIFE_SCORE = 100 // VIDA A CADA 100 PONTOS

// ========================
// VARIÁVEIS
// ========================

let player
let obstacles = []
let diagonalEnemies = []
let dropEnemies = []
let hunterEnemies = []

let score, bestScore, gameRunning, speed, lives
let nextLifeScore

let lastSpawnTime = 0
let spawnInterval = 1400

let lastDiagonalSpawn = 0
let diagonalInterval = 2500

let lastDropSpawn = 0
let dropInterval = 3500

let lastHunterSpawn = 0
let hunterInterval = 5000

// UI
const scoreText = document.getElementById("score")
const bestText = document.getElementById("best")
const livesText = document.getElementById("lives")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")

startBtn.onclick = startGame

bestScore = localStorage.getItem("bestScore") || 0
bestText.innerText = bestScore

// ========================
// INICIAR
// ========================

function startGame(){

player = { x:130, y:450, width:40, height:40 }

obstacles = []
diagonalEnemies = []
dropEnemies = []
hunterEnemies = []

score = 0
lives = 3
speed = 2

nextLifeScore = LIFE_SCORE

gameRunning = true

startBtn.disabled = true
startBtn.innerText = "Jogando..."

updateUI()
gameLoop()

}

// ========================
// UI
// ========================

function updateUI(){
scoreText.innerText = score
livesText.innerText = lives
}

// ========================
// CONTROLE
// ========================

let moveLeft = false
let moveRight = false

leftBtn.ontouchstart = ()=> moveLeft = true
leftBtn.ontouchend = ()=> moveLeft = false

rightBtn.ontouchstart = ()=> moveRight = true
rightBtn.ontouchend = ()=> moveRight = false

document.addEventListener("keydown", e=>{
if(e.key === "ArrowLeft") moveLeft = true
if(e.key === "ArrowRight") moveRight = true
})

document.addEventListener("keyup", e=>{
if(e.key === "ArrowLeft") moveLeft = false
if(e.key === "ArrowRight") moveRight = false
})

// ========================
// AUXILIAR
// ========================

function totalEnemies(){
return obstacles.length + diagonalEnemies.length + dropEnemies.length + hunterEnemies.length
}

function collide(a,b){
return (
a.x < b.x + b.width &&
a.x + a.width > b.x &&
a.y < b.y + b.height &&
a.y + a.height > b.y
)
}

function gainPoint(){

score++
updateUI()

// VIDA EXTRA
if(score >= nextLifeScore){
lives++
nextLifeScore += LIFE_SCORE
updateUI()

if(navigator.vibrate) navigator.vibrate(200)
}

}

// ========================
// SPAWNS
// ========================

function spawnObstacle(){

const size = 40
const gap = 90

let attempts = 0
let x

do{
x = Math.random() * (canvas.width - size)
attempts++
}while(
obstacles.some(o => Math.abs(o.x - x) < gap) 
&& attempts < 10
)

obstacles.push({
x, y: -size,
width: size,
height: size,
speed: speed + Math.random()*1.5
})

}

function spawnDiagonalEnemy(){
diagonalEnemies.push({
x: Math.random() * 260,
y: -30,
width:30,
height:30,
velX: (Math.random()<0.5?-1:1)*(2+Math.random()*2),
velY: 3 + Math.random()*2
})
}

function spawnDropEnemy(){
dropEnemies.push({
x: Math.random() * 260,
y: 0,
width:35,
height:35,
state:"waiting",
timer:Date.now()
})
}

function spawnHunterEnemy(){

hunterEnemies.push({
x: Math.random()*260,
y:-35,
width:35,
height:35,
speed:2,

targetX: 0,
lastUpdate: 0,
reactionTime: 500
})

}

// ========================
// UPDATE
// ========================

function update(){

// player
if(moveLeft) player.x -= 5
if(moveRight) player.x += 5

player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))

const now = Date.now()

// SPAWNS CONTROLADOS

if(now - lastSpawnTime > spawnInterval && totalEnemies() < MAX_ENEMIES){
spawnObstacle()
lastSpawnTime = now
}

if(score > 10 && now - lastDiagonalSpawn > diagonalInterval && diagonalEnemies.length < 2 && totalEnemies() < MAX_ENEMIES){
spawnDiagonalEnemy()
lastDiagonalSpawn = now
}

if(score > 15 && now - lastDropSpawn > dropInterval && dropEnemies.length < 2 && totalEnemies() < MAX_ENEMIES){
spawnDropEnemy()
lastDropSpawn = now
}

if(score > 25 && now - lastHunterSpawn > hunterInterval && hunterEnemies.length < 1 && totalEnemies() < MAX_ENEMIES){
spawnHunterEnemy()
lastHunterSpawn = now
}

speed += 0.001

// ========================
// NORMAL
// ========================

obstacles.forEach((o,i)=>{
o.y += o.speed

if(o.y > canvas.height){
gainPoint()
obstacles.splice(i,1)
}

if(collide(player,o)) hit(i, obstacles)
})

// ========================
// DIAGONAL
// ========================

diagonalEnemies.forEach((e,i)=>{
e.x += e.velX
e.y += e.velY

if(e.x <=0 || e.x+e.width>=canvas.width) e.velX *= -1

if(e.y > canvas.height){
gainPoint()
diagonalEnemies.splice(i,1)
}

if(collide(player,e)) hit(i, diagonalEnemies)
})

// ========================
// DROP
// ========================

dropEnemies.forEach((e,i)=>{

if(e.state==="waiting" && now - e.timer > 3000){
e.state="falling"
}

if(e.state==="falling") e.y += 10

if(e.y > canvas.height){
gainPoint()
dropEnemies.splice(i,1)
}

if(collide(player,e)) hit(i, dropEnemies)

})

// ========================
// HUNTER (COM ATRASO)
// ========================

hunterEnemies.forEach((h,i)=>{

if(now - h.lastUpdate > h.reactionTime){
h.targetX = player.x
h.lastUpdate = now
}

// segue posição antiga
if(h.x < h.targetX) h.x += 1.2
if(h.x > h.targetX) h.x -= 1.2

h.y += h.speed

if(h.y > canvas.height){
gainPoint()
hunterEnemies.splice(i,1)
}

if(collide(player,h)) hit(i, hunterEnemies)

})

}

// ========================
// DANO
// ========================

function hit(i, arr){

lives--
updateUI()
arr.splice(i,1)

if(navigator.vibrate) navigator.vibrate(100)

if(lives <= 0) endGame()

}

// ========================
// FIM
// ========================

function endGame(){

gameRunning = false

if(score > bestScore){
bestScore = score
localStorage.setItem("bestScore", bestScore)
}

bestText.innerText = bestScore

setTimeout(()=>{
alert("Game Over\nPontuação: " + score)
},100)

startBtn.disabled = false
startBtn.innerText = "Jogar Novamente"

}

// ========================
// DRAW
// ========================

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

// player
ctx.fillStyle="lime"
ctx.fillRect(player.x,player.y,player.width,player.height)

// inimigos
ctx.fillStyle="red"
obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.width,o.height))

ctx.fillStyle="cyan"
diagonalEnemies.forEach(e=>ctx.fillRect(e.x,e.y,e.width,e.height))

dropEnemies.forEach(e=>{
ctx.fillStyle = e.state==="waiting"?"yellow":"orange"
ctx.fillRect(e.x,e.y,e.width,e.height)
})

ctx.fillStyle="purple"
hunterEnemies.forEach(h=>ctx.fillRect(h.x,h.y,h.width,h.height))

}

// ========================
// LOOP
// ========================

function gameLoop(){
if(!gameRunning) return
update()
draw()
requestAnimationFrame(gameLoop)
}

// ========================
// PWA
// ========================

if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js")
}
