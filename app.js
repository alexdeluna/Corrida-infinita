const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

let player, obstacles, score, bestScore, gameRunning, speed, lives

const scoreText = document.getElementById("score")
const bestText = document.getElementById("best")
const livesText = document.getElementById("lives")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")

startBtn.onclick = startGame

bestScore = localStorage.getItem("bestScore") || 0
bestText.innerText = bestScore

function startGame(){

player = { x:130, y:450, width:40, height:40 }
obstacles = []
score = 0
lives = 3
speed = 2
gameRunning = true

updateUI()
gameLoop()

}

function updateUI(){
scoreText.innerText = score
livesText.innerText = lives
}

// CONTROLES
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

function spawnObstacle(){

const size = 30 + Math.random() * 30

obstacles.push({
x: Math.random() * (canvas.width - size),
y: -size,
width: size,
height: size,
speed: speed + Math.random() * 2
})

}

function update(){

// movimento
if(moveLeft) player.x -= 5
if(moveRight) player.x += 5

// limites
player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))

// spawn
if(Math.random() < 0.03){
spawnObstacle()
}

// aumentar dificuldade
speed += 0.001

obstacles.forEach((o, index)=>{

o.y += o.speed

// passou
if(o.y > canvas.height){
score++
updateUI()
obstacles.splice(index,1)
}

// colisão
if(player.x < o.x + o.width &&
player.x + player.width > o.x &&
player.y < o.y + o.height &&
player.y + player.height > o.y){

lives--
updateUI()
obstacles.splice(index,1)

// vibração (mobile)
if(navigator.vibrate) navigator.vibrate(100)

if(lives <= 0){
endGame()
}

}

})

}

function endGame(){

gameRunning = false

if(score > bestScore){
bestScore = score
localStorage.setItem("bestScore", bestScore)
}

bestText.innerText = bestScore

setTimeout(()=>{
alert("Game Over!\nPontuação: " + score)
},100)

}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

// player
ctx.fillStyle="lime"
ctx.fillRect(player.x,player.y,player.width,player.height)

// obstáculos
ctx.fillStyle="red"

obstacles.forEach(o=>{
ctx.fillRect(o.x,o.y,o.width,o.height)
})

}

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
