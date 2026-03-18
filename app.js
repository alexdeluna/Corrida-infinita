const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

// CONFIG
const MAX_ENEMIES = 6
const LIFE_SCORE = 100

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

// VIDA
if(score >= nextLifeScore){
lives++
nextLifeScore += LIFE_SCORE
}

// BOMBA
if(score % 10 === 0){
bombs++
}

// TIRO AUTOMÁTICO
if(score >= 20 && Date.now() - lastShot > 1000){
shoot()
lastShot = Date.now()
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
speed:6
})

}

// ========================
// BOMBA
// ========================

function useBomb(){

if(score < 20) return
if(bombs <= 0) return

bombs--
updateUI()

// limpa tudo
obstacles = []
diagonalEnemies = []
dropEnemies = []
hunterEnemies = []

if(navigator.vibrate) navigator.vibrate(300)

}

// ========================
// SPAWN SIMPLES (reduzido)
// ========================

function spawnObstacle(){
obstacles.push({
x: Math.random()*260,
y:-40,
width:40,
height:40,
speed:2+Math.random()*1.5
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

// spawn simples equilibrado
if(Math.random() < 0.02 && totalEnemies() < MAX_ENEMIES){
spawnObstacle()
}

// ========================
// BULLETS
// ========================

bullets.forEach((b,i)=>{
b.y -= b.speed

if(b.y < 0){
bullets.splice(i,1)
}

// colisão com inimigos
obstacles.forEach((o,oi)=>{
if(collide(b,o)){
bullets.splice(i,1)
obstacles.splice(oi,1)
gainPoint()
}
})

})

// ========================
// INIMIGOS
// ========================

obstacles.forEach((o,i)=>{
o.y += o.speed

if(o.y > canvas.height){
gainPoint()
obstacles.splice(i,1)
}

if(collide(player,o)){
lives--
updateUI()
obstacles.splice(i,1)

if(lives <= 0) endGame()
}

})

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

// tiros
ctx.fillStyle="cyan"
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

// PWA
if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js")
}
