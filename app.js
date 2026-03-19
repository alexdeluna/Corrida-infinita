// ================= CANVAS =================
const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

canvas.width = 300
canvas.height = 500

// ================= CONFIG =================
const MAX_ENEMIES = 6
const MIN_DISTANCE = 70

// ================= STATE =================
let player, bullets = []

let enemies=[], blues=[], yellows=[], hunters=[], fragments=[], whites=[]
let powerUps=[]

let satellites=0

let score=0, lives=3, bombs=0
let lastShot=0, lastSpawn=0

let nextPowerUpScore=50
let nextLifeScore=100

// boss
let isBoss=false
let boss=null
let phase=1
let bossState="move"
let bossTimer=0

let gameRunning=false

// ================= UI =================
const scoreText = document.getElementById("score")
const livesText = document.getElementById("lives")
const bestText = document.getElementById("best")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")

startBtn.onclick=startGame

// ================= START =================
function startGame(){

player={x:130,y:450,width:40,height:40}

bullets=[]
enemies=[];blues=[];yellows=[];hunters=[];fragments=[];whites=[]
powerUps=[]

satellites=0

score=0; lives=3; bombs=0
phase=1; isBoss=false

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
return enemies.length+blues.length+yellows.length+hunters.length+fragments.length+whites.length
}

function isFar(x){
return [...enemies,...blues,...yellows,...hunters,...whites]
.every(e=>Math.abs(e.x-x)>MIN_DISTANCE)
}

function updateUI(){
scoreText.innerText=score
livesText.innerText=lives
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
function spawnEnemy(){
let x=Math.random()*260
if(!isFar(x)) return

enemies.push({x,y:-40,width:40,height:40,speed:2+Math.random()*1.5})
}

function spawnBlue(){
let x=Math.random()*260
blues.push({x,y:-30,width:30,height:30,vx:2,vy:3})
}

function spawnYellow(){
let x=Math.random()*260
yellows.push({x,y:0,width:30,height:30,state:"wait",time:Date.now()})
}

function spawnHunter(){
let x=Math.random()*260
hunters.push({x,y:-30,width:30,height:30,targetX:0,last:0,hp:3})
}

function spawnWhite(){
let x=Math.random()*260
whites.push({x,y:-30,width:30,height:30,angle:0,hp:2})
}

function spawnPowerUp(){
powerUps.push({x:Math.random()*260,y:-30,size:30,speed:2})
}

// ================= BOSS =================
function startBoss(){
isBoss=true
enemies=[];blues=[];yellows=[];hunters=[];fragments=[];whites=[]

boss={
x:100,y:20,width:100,height:60,
hp:30+(phase-1)*10,maxHp:30+(phase-1)*10,dir:1
}

bossTimer=Date.now()
bossState="move"
}

function updateBoss(){

const now=Date.now()

if(bossState==="move"){
boss.x+=boss.dir*(2+phase*0.3)

if(boss.x<=0||boss.x+boss.width>=canvas.width){
boss.dir*=-1
}

if(phase>=5 && now-bossTimer>4000){
boss.x=Math.random()*200
bossTimer=now
}

if(now-bossTimer>5000){
bossState="pause"
bossTimer=now
}
}

else if(bossState==="pause"){
if(now-bossTimer>2000){
bossState="attack"
bossTimer=now
spawnBossEnemies()
}
}

else if(bossState==="attack"){
if(now-bossTimer>1500){
bossState="move"
bossTimer=now
}
}

}

function spawnBossEnemies(){

enemies.push({x:boss.x,y:boss.y,width:25,height:25,speed:3+phase})

fragments.push({x:boss.x,y:boss.y,width:20,height:20,velX:2,velY:3})

yellows.push({x:boss.x+40,y:boss.y,width:25,height:25,state:"fall"})
}

function killBoss(){
isBoss=false
lives++; bombs++; score+=30
phase++

if(phase>8){
alert("🎉 Você zerou o jogo!")
gameRunning=false
return
}

boss=null
}

// ================= UPDATE =================
function update(){

if(moveLeft) player.x-=5
if(moveRight) player.x+=5

player.x=Math.max(0,Math.min(canvas.width-player.width,player.x))

const now=Date.now()

if(score>=20 && now-lastShot>500){
shoot()
lastShot=now
}

// boss trigger
if(score>=phase*100 && !isBoss){
startBoss()
}

if(isBoss){
updateBoss()
}else{

if(now-lastSpawn>1200 && totalEnemies()<MAX_ENEMIES){
spawnEnemy()

if(score>10) spawnBlue()
if(score>20) spawnYellow()
if(score>30) spawnHunter()
if(score>30) spawnWhite()

lastSpawn=now
}

if(score>=nextPowerUpScore){
spawnPowerUp()
nextPowerUpScore+=20
}

}

// bullets
bullets.forEach((b,i)=>{
b.y-=b.speed

if(b.y<0){ bullets.splice(i,1); return }

if(isBoss && collide(b,boss)){
boss.hp--
bullets.splice(i,1)
if(boss.hp<=0) killBoss()
}

enemies.forEach((e,ei)=>{
if(collide(b,e)){ bullets.splice(i,1); enemies.splice(ei,1); score++ }
})
})

// enemies update (resumido p/ estabilidade)
enemies.forEach((e,i)=>{
e.y+=e.speed
if(e.y>canvas.height){score++; enemies.splice(i,1)}
if(collide(player,e)){takeDamage(); enemies.splice(i,1)}
})

// powerups
powerUps.forEach((p,i)=>{
p.y+=p.speed
if(collide(player,p)){powerUps.splice(i,1); if(satellites<2)satellites++}
})

if(score>=nextLifeScore){
lives++
nextLifeScore+=100
}

updateUI()
}

// ================= DRAW =================
function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

// player
ctx.fillStyle="lime"
ctx.fillRect(player.x,player.y,player.width,player.height)

// drones
ctx.fillStyle="cyan"
if(satellites>=1) ctx.fillRect(player.x+45,player.y,20,20)
if(satellites>=2) ctx.fillRect(player.x-25,player.y,20,20)

// inimigos
ctx.fillStyle="red"
enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.width,e.height))

// tiros
ctx.fillStyle="white"
bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height))

// powerups
powerUps.forEach(p=>{
ctx.fillStyle="gold"
ctx.fillRect(p.x,p.y,p.size,p.size)
ctx.fillStyle="black"
ctx.fillText("S",p.x+8,p.y+20)
})

// boss
if(isBoss && boss){
ctx.fillStyle="black"
ctx.fillRect(boss.x,boss.y,boss.width,boss.height)

ctx.fillStyle="red"
ctx.fillRect(20,10,260,10)
ctx.fillStyle="lime"
ctx.fillRect(20,10,(boss.hp/boss.maxHp)*260,10)
}

}

// ================= LOOP =================
function gameLoop(){
if(!gameRunning) return
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
