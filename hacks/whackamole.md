---
title: "Whack-a-Mole"
date: 2025-12-13
categories: [HTML, JavaScript]
layout: post
---

Below is the playable Whack-a-Mole game embedded directly so the site will run the JavaScript.

<style>
  /* Local styles for the embedded game */
  #whack-ui{display:flex;gap:12px;align-items:center;margin-bottom:8px;font-family:system-ui,Segoe UI,Roboto,Arial}
  #gameCanvas{background:#8fc46a;border-radius:8px;display:block;box-shadow:0 4px 10px rgba(0,0,0,0.25)}
  #whack-ui button, #whack-ui select{padding:6px 10px}
  #controls {display:flex;gap:12px;align-items:center}
  #info {color: #222; font-weight: 600}
</style>

<div id="whack-ui">
  <div id="controls">
    <button id="startBtn">Start</button>
    <label>Level:
      <select id="levelSelect">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
      </select>
    </label>
  </div>
  <div id="info">Score: <span id="score">0</span></div>
  <div id="info">Lives: <span id="lives">3</span></div>
  <div id="info">High: <span id="high">0</span></div>
</div>
<canvas id="gameCanvas" width="640" height="640"></canvas>

<script>
// Upgraded Whack-a-Mole: 4x4 grid, levels, blue mole, bomb, visuals, and sounds (WebAudio)
class Entity {
  constructor(hole, lifetime=1400){ this.hole = hole; this.life = lifetime; this.spawnTime = Date.now(); this.active=true; }
  update(dt, game){ if (!this.active) return; if (Date.now() - this.spawnTime > this.life) this.expire(game); }
  render(ctx,x,y,size){}
  onHit(game){ this.expire(game); }
  expire(game){ if (this.hole) this.hole.entity = null; this.active=false; }
}

class Mole extends Entity {
  constructor(hole,type='brown'){ super(hole,1200); this.type=type; this.points = (type==='blue'?50:10); }
  render(ctx,x,y,size){ // draw a stylized mole with simple shapes
    // body
    ctx.save(); ctx.translate(x,y);
    // shadow
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0,size*0.28,size*0.38,size*0.2,0,0,Math.PI*2); ctx.fill();
    // fur
    const fur = (this.type==='blue') ? '#3a6fb0' : '#5a3b2a';
    ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0,0,size*0.45,size*0.45,0,0,Math.PI*2); ctx.fill();
    // face
    ctx.fillStyle = '#e0b38a'; ctx.beginPath(); ctx.ellipse(0,-size*0.05,size*0.28,size*0.2,0,0,Math.PI*2); ctx.fill();
    // eyes
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-size*0.09,-size*0.08,size*0.04,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(size*0.09,-size*0.08,size*0.04,0,Math.PI*2); ctx.fill();
    // nose
    ctx.fillStyle='#b34'; ctx.beginPath(); ctx.arc(0, -size*0.0, size*0.05, 0, Math.PI*2); ctx.fill();
    // cheeks
    ctx.fillStyle='rgba(255,150,150,0.12)'; ctx.beginPath(); ctx.ellipse(-size*0.18, -size*0.02, size*0.07, size*0.04,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(size*0.18, -size*0.02, size*0.07, size*0.04,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  onHit(game){ game.addScore(this.points); if (this.type==='blue') game.speedUp(); super.onHit(game); game.playHit(); }
}

class Bomb extends Entity {
  constructor(hole){ super(hole,1200); }
  render(ctx,x,y,size){ // draw a bomb
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(0,0,size*0.35,0,Math.PI*2); ctx.fill();
    // fuse
    ctx.strokeStyle='#ffce5c'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(size*0.24,-size*0.28); ctx.lineTo(size*0.6,-size*0.6); ctx.stroke();
    ctx.restore();
  }
  onHit(game){ // penalty
    super.onHit(game); game.lives -= 2; if (game.lives<=0) game.end(); game.updateUI(); game.playBomb(); }
}

class PowerUp extends Entity{
  constructor(hole){ super(hole,1000); }
  render(ctx,x,y,size){ ctx.save(); ctx.translate(x,y); ctx.fillStyle='#ffeb3b'; ctx.fillRect(-size*0.25,-size*0.25,size*0.5,size*0.5); ctx.restore(); }
  onHit(game){ game.addScore(25); game.addLife(); super.onHit(game); game.playHit(); }
}

class Hole{
  constructor(x,y,size){ this.x=x; this.y=y; this.size=size; this.entity=null; }
  render(ctx){ // grass ring + hole oval
    // grass texture around hole
    const g = ctx.createLinearGradient(this.x - this.size/2, this.y, this.x + this.size/2, this.y);
    g.addColorStop(0,'#6fbf4f'); g.addColorStop(1,'#4da33a'); ctx.fillStyle=g; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    // hole
    ctx.fillStyle='#3b3b2f'; ctx.beginPath(); ctx.ellipse(this.x,this.y,this.size*0.38,this.size*0.26,0,0,Math.PI*2); ctx.fill();
    if(this.entity) this.entity.render(ctx,this.x,this.y,this.size);
  }
}

class Game{
  constructor(canvasId){
    this.canvas = document.getElementById(canvasId); this.ctx = this.canvas.getContext('2d');
    this.rows = 4; this.cols = 4; this.holes = []; this.score=0; this.lives=3; this.running=false; this.spawnTimer=0; this.spawnInterval=900; this.high = parseInt(localStorage.getItem('whackHigh'))||0; this.level='medium';
    this.setupGrid(); this.bind(); this.updateUI(); this.loop = this.loop.bind(this);
    this.initAudio();
  }
  initAudio(){ try{ const ac = new (window.AudioContext||window.webkitAudioContext)(); this.ac = ac; }catch(e){ this.ac = null; } }
  playTone(freq,dur, type='sine'){ if(!this.ac) return; const o = this.ac.createOscillator(); const g = this.ac.createGain(); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(this.ac.destination); g.gain.value = 0.0001; o.start(); g.gain.exponentialRampToValueAtTime(0.2, this.ac.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur/1000); o.stop(this.ac.currentTime + dur/1000 + 0.02); }
  playHit(){ this.playTone(880,120); }
  playBomb(){ this.playTone(120,250,'square'); }
  playGameOver(){ if(!this.ac) return; this.playTone(220,200); setTimeout(()=>this.playTone(110,300),220); }
  setupGrid(){ this.holes = []; const w=this.canvas.width, h=this.canvas.height; const cellW = w/this.cols, cellH = h/this.rows; const size = Math.min(cellW,cellH);
    for(let r=0;r<this.rows;r++){ for(let c=0;c<this.cols;c++){ let x = (c+0.5)*cellW; let y = (r+0.5)*cellH; this.holes.push(new Hole(x,y,size)); } }
  }
  bind(){ this.canvas.addEventListener('click', e=>{ const rect=this.canvas.getBoundingClientRect(); const mx=e.clientX-rect.left, my=e.clientY-rect.top; this.handleClick(mx,my); });
    document.getElementById('startBtn').addEventListener('click', ()=>this.start());
    document.getElementById('levelSelect').addEventListener('change', (e)=>{ this.level = e.target.value; });
  }
  start(){ // configure by level
    if(this.level==='easy'){ this.spawnInterval=1200; this.lives=5; this.defaultLife=1500; }
    else if(this.level==='medium'){ this.spawnInterval=900; this.lives=4; this.defaultLife=1200; }
    else { this.spawnInterval=600; this.lives=3; this.defaultLife=900; }
    this.score=0; this.running=true; this.spawnTimer=0; this.updateUI(); this.setupGrid(); requestAnimationFrame(this.loop);
  }
  end(){ this.running=false; localStorage.setItem('whackHigh', Math.max(this.high,this.score)); let arr = JSON.parse(localStorage.getItem('whackLast'))||[]; arr.unshift(this.score); arr = arr.slice(0,5); localStorage.setItem('whackLast', JSON.stringify(arr)); this.high = Math.max(this.high,this.score); this.updateUI(); this.playGameOver(); setTimeout(()=>alert('Game over — score: '+this.score),50); }
  addScore(n){ this.score += n; if(this.score>this.high) this.high=this.score; this.updateUI(); }
  addLife(){ this.lives++; this.updateUI(); }
  speedUp(){ this.spawnInterval = Math.max(250, this.spawnInterval - 80); }
  handleClick(mx,my){ for(const hole of this.holes){ if(hole.entity && hole.entity.active){ const s = hole.size*0.5; if(mx>=hole.x-s && mx<=hole.x+s && my>=hole.y-s && my<=hole.y+s){ hole.entity.onHit(this); return; } } }
    // miss penalty
    this.lives--; if(this.lives<=0) this.end(); this.updateUI(); }
  spawnEntity(){ const empty = this.holes.filter(h=>!h.entity); if(empty.length===0) return; const hole = empty[Math.floor(Math.random()*empty.length)]; const r=Math.random();
    // probabilities: normal 0.7, blue 0.12, powerup 0.08, golden 0.06, bomb 0.04
    if(r < 0.70){ hole.entity = new Mole(hole,'brown'); hole.entity.life = this.defaultLife; }
    else if(r < 0.82){ hole.entity = new Mole(hole,'blue'); hole.entity.life = this.defaultLife * 1.0; }
    else if(r < 0.90){ hole.entity = new PowerUp(hole); }
    else if(r < 0.96){ hole.entity = new Mole(hole,'gold'); hole.entity.points = 30; }
    else { hole.entity = new Bomb(hole); }
  }
  update(dt){ for(const h of this.holes) if(h.entity) h.entity.update(dt,this); this.spawnTimer += dt; if(this.spawnTimer > this.spawnInterval){ this.spawnTimer =0; this.spawnEntity(); } }
  render(){ const ctx=this.ctx; // grass background
    ctx.fillStyle = '#8fc46a'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    // subtle grass texture
    ctx.fillStyle = 'rgba(255,255,255,0.02)'; for(let i=0;i<80;i++){ ctx.beginPath(); const x=Math.random()*this.canvas.width, y=Math.random()*this.canvas.height; ctx.ellipse(x,y,2,6,Math.random()*Math.PI,0,Math.PI*2); ctx.fill(); }
    for(const h of this.holes) h.render(ctx);
  }
  loop(ts){ if(!this._last) this._last=ts; const dt = ts - this._last; this._last = ts; if(this.running){ this.update(dt); this.render(); requestAnimationFrame(this.loop); } }
  updateUI(){ document.getElementById('score').textContent = this.score; document.getElementById('lives').textContent = this.lives; document.getElementById('high').textContent = this.high; }
}

// instantiate
const game = new Game('gameCanvas');
window._whack = game;
</script>
