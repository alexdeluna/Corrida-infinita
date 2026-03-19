// ========================
// BASE
// ========================
const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

// ========================
let player, bullets=[]
let obstacles=[], hunterFragments=[], dropEnemies=[]

let score=0, lives=3, bombs=0
let bestScore = localStorage.getItem("bestScore") || 0

let gameRunning=false
let lastShot=0

// ========================
// FASES
// ========================
let currentPhase = 1
let isBossFight = false
let boss=null
let bossState="move"
let bossTimer=0

// ========================
// UI
// ========================
const scoreText = document.getElementById("score")
const livesText = document.getElementById("lives")
const bestText = document.getElementById("best")
const bombText = document.getElementById("bombCount")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")
const bombBtn = document.getElementById("bomb")

startBtn.onclick = startGame
bombBtn.onclick = useBomb

bestText.innerText = bestScore

// ========================
function startGame(){

player = { x:130,y:450,width:40,height:40 }

bullets=[]; obstacles=[]; hunterFragments=[]; dropEnemies=[]

score=0; lives=3; bombs=0
currentPhase=1
isBossFight=false

gameRunning=true

startBtn.disabled=true
startBtn.innerText="Jogando..."

updateUI()
gameLoop()
}

// ========================
function updateUI(){
scoreText.innerText=score
livesText.innerText=lives
bombText.innerText=bombs
}

// ========================
// CONTROLES
// ========================
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

// ========================
function collide(a,b){
return a.x<b.x+b.width && a.x+a.width>b.x &&
a.y<b.y+b.height && a.y+a.height>b.y
}

// ========================
function gainPoint(v=1){
score+=v

if(score%10===0) bombs++

updateUI()
}

// ========================
// TIRO
// ========================
function shoot(){
bullets.push({x:player.x+17,y:player.y,width:6,height:15,speed:7})
}

// ========================
// BOMBA
// ========================
function useBomb(){
if(score<20||bombs<=0) return

bombs--
obstacles=[]; hunterFragments=[]; dropEnemies=[]
}

// ========================
// BOSS
// ========================
function startBoss(){

isBossFight=true
obstacles=[]; hunterFragments=[]; dropEnemies=[]

boss={
x:100,y:20,
width:100,height:60,
hp:30+(currentPhase-1)*10,
maxHp:30+(currentPhase-1)*10,
dir:1
}

bossTimer=Date.now()
bossState="move"
}

// ========================
function updateBoss(){

const now=Date.now()

// movimento
if(bossState==="move"){
boss.x += boss.dir*(2+currentPhase*0.5)

if(boss.x<=0||boss.x+boss.width>=canvas.width){
boss.dir*=-1
}

// teleport (fase 5+)
if(currentPhase>=5 && now-bossTimer>4000){
boss.x = Math.random()*200
bossTimer=now
}

// pausa (fase 4+)
if(currentPhase>=4 && now-bossTimer>5000){
bossState="pause"
bossTimer=now
}
}

// pausa
else if(bossState==="pause"){
if(now-bossTimer>2000){
bossState="attack"
bossTimer=now
spawnBossEnemies()
}
}

// ataque
else if(bossState==="attack"){
if(now-bossTimer>1500){
bossState="move"
bossTimer=now
}
}

}

// ========================
function spawnBossEnemies(){

// quantidade escala
let qtd = 1 + Math.floor(currentPhase/2)

for(let i=0;i<qtd;i++){

// vermelho
obstacles.push({
x:boss.x+Math.random()*80,
y:boss.y+boss.height,
width:25,height:25,speed:3+currentPhase
})

// roxo pequeno
hunterFragments.push({
x:boss.x,y:boss.y,
width:20,height:20,
velX:(Math.random()<0.5?-2:2),
velY:3
})

// amarelo
dropEnemies.push({
x:boss.x+50,y:boss.y,
width:25,height:25,
state:"falling"
})

}

}

// ========================
function killBoss(){

isBossFight=false

lives++
bombs++
gainPoint(30)

// próxima fase
currentPhase++

if(currentPhase>8){
winGame()
return
}

boss=null
}

// ========================
function winGame(){

gameRunning=false

setTimeout(()=>{
alert("🎉 PARABÉNS!\nVocê zerou o jogo!")
},100)

}

// ========================
function update(){

if(moveLeft) player.x-=5
if(moveRight) player.x+=5

player.x=Math.max(0,Math.min(canvas.width-player.width,player.x))

const now=Date.now()

// tiro
if(score>=20 && now-lastShot>500){
shoot()
lastShot=now
}

// inicia boss
if(score>=currentPhase*100 && !isBossFight){
startBoss()
}

// boss update
if(isBossFight) updateBoss()

// ========================
// BULLETS
// ========================
bullets.forEach((b,i)=>{
b.y-=b.speed

if(b.y<0) bullets.splice(i,1)

// dano boss
if(isBossFight && collide(b,boss)){
boss.hp--
bullets.splice(i,1)

if(boss.hp<=0){
killBoss()
}
}

})

// ========================
// INIMIGOS
// ========================
obstacles.forEach((o,i)=>{
o.y+=o.speed
if(o.y>canvas.height){ gainPoint(); obstacles.splice(i,1) }
if(collide(player,o)){ lives--; obstacles.splice(i,1) }
})

hunterFragments.forEach((f,i)=>{
f.x+=f.velX
f.y+=f.velY
if(f.y>canvas.height){ gainPoint(); hunterFragments.splice(i,1) }
if(collide(player,f)){ lives--; hunterFragments.splice(i,1) }
})

dropEnemies.forEach((d,i)=>{
d.y+=5
if(d.y>canvas.height){ gainPoint(); dropEnemies.splice(i,1) }
if(collide(player,d)){ lives--; dropEnemies.splice(i,1) }
})

if(lives<=0) endGame()

updateUI()
}

// ========================
function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

// player
ctx.fillStyle="lime"
ctx.fillRect(player.x,player.y,player.width,player.height)

// inimigos
ctx.fillStyle="red"
obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.width,o.height))

ctx.fillStyle="violet"
hunterFragments.forEach(f=>ctx.fillRect(f.x,f.y,f.width,f.height))

ctx.fillStyle="yellow"
dropEnemies.forEach(d=>ctx.fillRect(d.x,d.y,d.width,d.height))

// tiros
ctx.fillStyle="white"
bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height))

// boss
if(isBossFight && boss){

ctx.fillStyle="black"
ctx.fillRect(boss.x,boss.y,boss.width,boss.height)

ctx.fillStyle="purple"
ctx.fillRect(boss.x+10,boss.y+10,20,20)

// barra vida
ctx.fillStyle="red"
ctx.fillRect(20,10,260,10)

ctx.fillStyle="lime"
ctx.fillRect(20,10,(boss.hp/boss.maxHp)*260,10)

}

}

// ========================
function gameLoop(){
if(!gameRunning) return
update()
draw()
requestAnimationFrame(gameLoop)
}

// ========================
function endGame(){

gameRunning=false

if(score>bestScore){
bestScore=score
localStorage.setItem("bestScore",bestScore)
}

alert("Game Over\nPontuação: "+score)

startBtn.disabled=false
startBtn.innerText="Jogar Novamente"
}

// ========================
if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js")
}
