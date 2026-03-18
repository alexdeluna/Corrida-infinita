const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

// CONFIG
const MAX_ENEMIES = 6
const LIFE_SCORE = 100
const MIN_DISTANCE = 80

// ========================
// VARIÁVEIS
// ========================

let player
let obstacles = []
let diagonalEnemies = []
let dropEnemies = []
let hunterEnemies = []
let bullets = []

let score, bestScore, gameRunning, speed, lives
let nextLifeScore
let bombs = 0

let lastShot = 0

// timers spawn
let lastSpawnTime = 0
let lastDiagonalSpawn = 0
let lastDropSpawn = 0
let lastHunterSpawn = 0

// UI
const scoreText = document.getElementById("score")
const bestText = document.getElementById("best")
const livesText = document.getElementById("lives")
const bombText = document.getElementById("bombCount")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")
const bombBtn = document.getElementById("bomb")

startBtn.onclick = startGame
bombBtn.onclick = useBomb

bestScore = localStorage.getItem("bestScore") || 0
bestText.innerText = bestScore

// ========================
// START
// ========================

function startGame(){

player = { x:130, y:450, width:40, height:40 }

obstacles = []
diagonalEnemies = []
dropEnemies = []
hunterEnemies = []
bullets = []

score = 0
lives = 3
speed = 2

bombs = 0
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
bombText.innerText = bombs
}

// ========================
// CONTROLES
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
// AUX
// ========================

function totalEnemies(){
return obstacles.length + diagonalEnemies.length + dropEnemies.length + hunterEnemies.length
}

function isFarEnough(x){
const all = [...obstacles, ...diagonalEnemies, ...dropEnemies, ...hunterEnemies]
return all.every(e => Math.abs(e.x - x) > MIN_DISTANCE)
}

function collide(a,b){
return (
a.x < b.x + b.width &&
a.x + a.width > b.x &&
a.y < b.y + b.height &&
a.y + a.height > b.y
)
}

// ========================
// PONTUAÇÃO
// ========================

function gainPoint(){

score++
updateUI()

if(score >= nextLifeScore){
lives++
nextLifeScore += LIFE_SCORE
}

if(score % 10 === 0){
bombs++
}

}

// ========================
// TIRO
// ========================

function shoot(){

bullets.push({
x: player.x + player.width/2 - 3,
y: player.y,
width:6,
height:15,
speed:7
})

}

// ========================
// BOMBA
// ========================

function useBomb(){

if(score < 20 || bombs <= 0) return

bombs--
updateUI()

obstacles = []
diagonalEnemies = []
dropEnemies = []
hunterEnemies = []

}

// ========================
// SPAWNS
// ========================

function spawnObstacle(){

let x
let tries = 0

do{
x = Math.random()*260
tries++
}while(!isFarEnough(x) && tries < 10)

obstacles.push({
x, y:-40,
width:40,
height:40,
speed:2+Math.random()*1.5
})

}

function spawnDiagonalEnemy(){

let x = Math.random()*260
if(!isFarEnough(x)) return

diagonalEnemies.push({
x, y:-30,
width:30,
height:30,
velX:(Math.random()<0.5?-1:1)*2,
velY:3
})

}

function spawnDropEnemy(){

let x = Math.random()*260
if(!isFarEnough(x)) return

dropEnemies.push({
x, y:0,
width:35,
height:35,
state:"waiting",
timer:Date.now()
})

}

function spawnHunterEnemy(){

let x = Math.random()*260
if(!isFarEnough(x)) return

hunterEnemies.push({
x, y:-35,
width:35,
height:35,
speed:2,
targetX:0,
lastUpdate:0,
reactionTime:500
})

}

// ========================
// UPDATE
// ========================

function update(){

// movimento
if(moveLeft) player.x -= 5
if(moveRight) player.x += 5

player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))

const now = Date.now()

// TIRO AUTOMÁTICO
if(score >= 20 && now - lastShot > 500){
shoot()
lastShot = now
}

// SPAWNS

if(now - lastSpawnTime > 1400 && totalEnemies() < MAX_ENEMIES){
spawnObstacle()
lastSpawnTime = now
}

if(score > 10 && now - lastDiagonalSpawn > 2500 && diagonalEnemies.length < 2){
spawnDiagonalEnemy()
lastDiagonalSpawn = now
}

if(score > 15 && now - lastDropSpawn > 3500 && dropEnemies.length < 2){
spawnDropEnemy()
lastDropSpawn = now
}

if(score > 25 && now - lastHunterSpawn > 5000 && hunterEnemies.length < 1){
spawnHunterEnemy()
lastHunterSpawn = now
}

// ========================
// BULLETS
// ========================

bullets.forEach((b,i)=>{
b.y -= b.speed

if(b.y < 0) bullets.splice(i,1)

// colisão com TODOS inimigos
;[obstacles, diagonalEnemies, dropEnemies, hunterEnemies].forEach(arr=>{
arr.forEach((e,ei)=>{
if(collide(b,e)){
bullets.splice(i,1)
arr.splice(ei,1)
gainPoint()
}
})
})

})

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
// HUNTER
// ========================

hunterEnemies.forEach((h,i)=>{

if(now - h.lastUpdate > h.reactionTime){
h.targetX = player.x
h.lastUpdate = now
}

if(h.x < h.targetX) h.x += 1.2
if(h.x > h.targetX) h.x -= 1.2

h.y += h.speed

if(h.y > canvas.height){
gainPoint()
hunterEnemies.splice(i,1)
}

if(collide(player,h)) hit(i, hunterEnemies)

})

// ========================
// DANO
// ========================

function hit(i, arr){
lives--
updateUI()
arr.splice(i,1)
if(lives <= 0) endGame()
}

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

// tiros
ctx.fillStyle="white"
bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height))

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
// PWA
// ========================

if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js")
}
