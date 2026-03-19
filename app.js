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

// ================= UI =================
const scoreText = document.getElementById("score")
const livesText = document.getElementById("lives")
const bombText = document.getElementById("bombCount")

const startBtn = document.getElementById("start")
const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")
const bombBtn = document.getElementById("bomb")

startBtn.onclick=startGame
bombBtn.onclick=useBomb

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

// sniper (marrom)
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

// late game
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

// ================= BOSS =================
function startBoss(){
isBoss=true
enemies=[];blues=[];yellows=[];hunters=[];whites=[];snipers=[]

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
boss.x+=boss.dir*(3+phase*0.5)

if(boss.x<=0||boss.x+boss.width>=canvas.width){
boss.dir*=-1
}

if(now-bossTimer>3000){
bossState="pause"
bossTimer=now
}
}

else if(bossState==="pause"){
if(now-bossTimer>1500){
bossState="attack"
bossTimer=now
spawnBossEnemies()
}
}

else if(bossState==="attack"){
if(now-bossTimer>1000){
bossState="move"
bossTimer=now
}
}
}

function spawnBossEnemies(){
spawnRed(boss.x)
spawnBlue(boss.x+30)
spawnYellow(boss.x+60)
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

// tiro
if(score>=20 && now-lastShot>500){
shoot()
lastShot=now
}

// bombas
if(score>=nextBombScore){
bombs++
nextBombScore+=10
}

// boss
if(score>=phase*100 && !isBoss){
startBoss()
}

if(isBoss){
updateBoss()
}else{

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

}

// ================= BULLETS =================
bullets.forEach((b,i)=>{
b.y-=b.speed
if(b.y<0){bullets.splice(i,1);return}

// boss
if(isBoss && collide(b,boss)){
boss.hp--
bullets.splice(i,1)
if(boss.hp<=0) killBoss()
}

// colisões
;[enemies,blues,yellows].forEach(arr=>{
arr.forEach((e,ei)=>{
if(collide(b,e)){
bullets.splice(i,1)
arr.splice(ei,1)
score++
}
})
})

// roxo
hunters.forEach((h,hi)=>{
if(collide(b,h)){
bullets.splice(i,1)
h.hp--
if(h.hp<=0){
hunters.splice(hi,1)
score++
}
}
})

// branco
whites.forEach((w,wi)=>{
if(collide(b,w)){
bullets.splice(i,1)
w.hp--
if(w.hp<=0){
whites.splice(wi,1)
score++
}
}
})

// sniper
snipers.forEach((s,si)=>{
if(collide(b,s)){
bullets.splice(i,1)
s.hp--
if(s.hp<=0){
snipers.splice(si,1)
score+=3
}
}
})
})

// ================= ENEMY UPDATE =================
enemies.forEach((e,i)=>{
e.y+=e.speed
if(e.y>canvas.height){score++;enemies.splice(i,1)}
if(collide(player,e)){takeDamage();enemies.splice(i,1)}
})

blues.forEach((b,i)=>{
b.x+=b.vx
b.y+=b.vy
if(b.x<=0||b.x+30>=canvas.width) b.vx*=-1
if(b.y>canvas.height){score++;blues.splice(i,1)}
if(collide(player,b)){takeDamage();blues.splice(i,1)}
})

yellows.forEach((y,i)=>{
if(y.state==="wait"){
if(Date.now()-y.time>1000) y.state="fall"
}else{
y.y+=6+score*0.03
}
if(y.y>canvas.height){score++;yellows.splice(i,1)}
if(collide(player,y)){takeDamage();yellows.splice(i,1)}
})

hunters.forEach((h,i)=>{
if(Date.now()-h.last>500){
h.targetX=player.x
h.last=Date.now()
}
h.x+=(player.x-h.x)*0.05
h.y+=2+score*0.02
if(h.y>canvas.height){score++;hunters.splice(i,1)}
if(collide(player,h)){takeDamage();hunters.splice(i,1)}
})

whites.forEach((w,i)=>{
w.angle+=0.1
w.x+=Math.sin(w.angle)*2
w.y+=2+score*0.02
if(w.y>canvas.height){score++;whites.splice(i,1)}
if(collide(player,w)){takeDamage();whites.splice(i,1)}
})

// sniper
snipers.forEach((s,i)=>{

if(Date.now()-s.lastShot>1500){

let dx=player.x-s.x
let dy=player.y-s.y
let angle=Math.atan2(dy,dx)

enemyBullets.push({
x:s.x+20,y:s.y+20,
vx:Math.cos(angle)*4,
vy:Math.sin(angle)*4
})

s.lastShot=Date.now()
}

if(collide(player,s)){
takeDamage()
}
})

// tiros inimigos
enemyBullets.forEach((b,i)=>{
b.x+=b.vx
b.y+=b.vy

if(b.y>canvas.height||b.x<0||b.x>canvas.width){
enemyBullets.splice(i,1)
return
}

if(collide(player,b)){
takeDamage()
enemyBullets.splice(i,1)
}
})

// ================= POWERUP =================
powerUps.forEach((p,i)=>{
p.y+=p.speed

if(p.y>canvas.height){
powerUps.splice(i,1)
return
}

if(collide(player,p)){
powerUps.splice(i,1)
if(satellites<2) satellites++
}
})

// vida
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

// satélites
ctx.fillStyle="cyan"
if(satellites>=1) ctx.fillRect(player.x+45,player.y,20,20)
if(satellites>=2) ctx.fillRect(player.x-25,player.y,20,20)

// inimigos
ctx.fillStyle="red"
enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.width,e.height))

ctx.fillStyle="blue"
blues.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height))

ctx.fillStyle="yellow"
yellows.forEach(y=>ctx.fillRect(y.x,y.y,y.width,y.height))

ctx.fillStyle="purple"
hunters.forEach(h=>ctx.fillRect(h.x,h.y,h.width,h.height))

ctx.fillStyle="white"
whites.forEach(w=>ctx.fillRect(w.x,w.y,w.width,w.height))

ctx.fillStyle="brown"
snipers.forEach(s=>ctx.fillRect(s.x,s.y,s.width,s.height))

// tiros
ctx.fillStyle="white"
bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height))

ctx.fillStyle="orange"
enemyBullets.forEach(b=>ctx.fillRect(b.x,b.y,6,6))

// powerup
powerUps.forEach(p=>{
ctx.fillStyle="gold"
ctx.fillRect(p.x,p.y,p.width,p.height)
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
