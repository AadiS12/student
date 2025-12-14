---
title: "Whack-a-Mole"
date: 2025-12-13
categories: [HTML, JavaScript]
layout: post
---

Below is the playable Whack-a-Mole game embedded directly so the site will run the JavaScript.

<style>
  /* Local styles for the embedded game */
  #whack-ui{display:flex;gap:12px;align-items:center;margin-bottom:8px;font-family:system-ui,Segoe UI,Roboto,Arial; color: #fff}
  #gameCanvas{background:#8fc46a;border-radius:8px;display:block;box-shadow:0 4px 10px rgba(0,0,0,0.25)}
  #whack-ui button, #whack-ui select{padding:6px 10px}
  #controls {display:flex;gap:12px;align-items:center}
  #info {color: #fff; font-weight: 600}
  label {color: #fff}
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
    <label>Grid:
      <select id="gridSelect">
        <option value="3">3×3</option>
        <option value="4" selected>4×4</option>
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
  render(ctx,x,y,size){
    // use preloaded image assets if available
    const assets = this.hole && this.hole.game && this.hole.game.assets;
    let img = null;
    if(assets){ if(this.type==='blue') img = assets.blueMole; else img = assets.mole; }
    if(img && img.complete){ const w = size*1.1, h = size*1.1; ctx.drawImage(img, x - w/2, y - h*0.75, w, h); return; }
    // fallback: draw stylized mole
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0,size*0.28,size*0.38,size*0.2,0,0,Math.PI*2); ctx.fill();
    const fur = (this.type==='blue') ? '#3a6fb0' : '#5a3b2a'; ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0,0,size*0.45,size*0.45,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e0b38a'; ctx.beginPath(); ctx.ellipse(0,-size*0.05,size*0.28,size*0.2,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-size*0.09,-size*0.08,size*0.04,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(size*0.09,-size*0.08,size*0.04,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#b34'; ctx.beginPath(); ctx.arc(0, -size*0.0, size*0.05, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  onHit(game){ game.addScore(this.points); if (this.type==='blue') game.speedUp(); super.onHit(game); game.playHit(); }
}

class Bomb extends Entity {
  constructor(hole){ super(hole,1200); }
  render(ctx,x,y,size){ // draw a bomb (use asset if present)
    const assets = this.hole && this.hole.game && this.hole.game.assets; const img = assets && assets.bomb;
    if(img && img.complete){ const w=size*0.9, h=size*0.9; ctx.drawImage(img, x-w/2, y-h/2, w, h); return; }
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(0,0,size*0.35,0,Math.PI*2); ctx.fill();
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
  constructor(x,y,size,game){ this.x=x; this.y=y; this.size=size; this.entity=null; this.game = game; }
  render(ctx){ // grass ring + hole oval
    // grass texture around hole (use image asset if available)
    const gimg = this.game && this.game.assets && this.game.assets.grass;
    if(gimg && gimg.complete){ const pattern = ctx.createPattern(gimg,'repeat'); if(pattern){ ctx.fillStyle = pattern; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size); } }
    else { const g = ctx.createLinearGradient(this.x - this.size/2, this.y, this.x + this.size/2, this.y); g.addColorStop(0,'#6fbf4f'); g.addColorStop(1,'#4da33a'); ctx.fillStyle=g; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size); }
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
    // sensible defaults
    this.defaultLife = 1200;
    this.loadAssets(); this.initAudio(); this.ensureAudioFiles();
    // initial render so grid is visible before starting
    this.render();
  }
  initAudio(){ try{ const ac = new (window.AudioContext||window.webkitAudioContext)(); this.ac = ac; }catch(e){ this.ac = null; } }
  playTone(freq,dur, type='sine'){ if(!this.ac) return; const o = this.ac.createOscillator(); const g = this.ac.createGain(); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(this.ac.destination); g.gain.value = 0.0001; o.start(); g.gain.exponentialRampToValueAtTime(0.2, this.ac.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur/1000); o.stop(this.ac.currentTime + dur/1000 + 0.02); }
  playHit(){ this.playTone(880,120); }
  playBomb(){ this.playTone(120,250,'square'); }
  playGameOver(){ if(!this.ac) return; this.playTone(220,200); setTimeout(()=>this.playTone(110,300),220); }
  // create simple WAV blobs at runtime (used as Audio elements)
  makeWav(freq, durationMs, volume=0.5){
    const sr = 44100; const len = Math.floor(sr * (durationMs/1000)); const buffer = new ArrayBuffer(44 + len*2);
    const view = new DataView(buffer);
    function writeString(view, offset, string){ for(let i=0;i<string.length;i++){ view.setUint8(offset+i, string.charCodeAt(i)); } }
    writeString(view,0,'RIFF'); view.setUint32(4, 36 + len*2, true); writeString(view,8,'WAVE'); writeString(view,12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,sr,true); view.setUint32(28,sr*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true); writeString(view,36,'data'); view.setUint32(40,len*2,true);
    for(let i=0;i<len;i++){ const t = i/sr; const sample = Math.max(-1, Math.min(1, Math.sin(2*Math.PI*freq*t))); const val = Math.floor(sample * 32767 * volume); view.setInt16(44 + i*2, val, true); }
    return new Blob([view], {type:'audio/wav'});
  }
  ensureAudioFiles(){ if(this._audioInited) return; this._audioInited=true; try{ this.hitURL = URL.createObjectURL(this.makeWav(880,120,0.6)); this.bombURL = URL.createObjectURL(this.makeWav(140,220,0.9)); this.gameOverURL = URL.createObjectURL(this.makeWav(220,250,0.9)); this.hitAudio = new Audio(this.hitURL); this.bombAudio = new Audio(this.bombURL); this.gameOverAudio = new Audio(this.gameOverURL); }catch(e){ /* ignore */ } }
  playHit(){ if(this.hitAudio){ this.ensureAudioFiles(); try{ this.hitAudio.currentTime = 0; this.hitAudio.play(); return; }catch(e){} } if(!this.ac) return; this.playTone(880,120); }
  playBomb(){ if(this.bombAudio){ this.ensureAudioFiles(); try{ this.bombAudio.currentTime = 0; this.bombAudio.play(); return; }catch(e){} } if(!this.ac) return; this.playTone(120,250,'square'); }
  playGameOver(){ if(this.gameOverAudio){ this.ensureAudioFiles(); try{ this.gameOverAudio.currentTime = 0; this.gameOverAudio.play(); }catch(e){} } if(this.ac){ this.playTone(220,200); setTimeout(()=>this.playTone(110,300),220); } }
  setupGrid(){ this.holes = []; const w=this.canvas.width, h=this.canvas.height; const cellW = w/this.cols, cellH = h/this.rows; const size = Math.min(cellW,cellH);
    for(let r=0;r<this.rows;r++){ for(let c=0;c<this.cols;c++){ let x = (c+0.5)*cellW; let y = (r+0.5)*cellH; this.holes.push(new Hole(x,y,size,this)); } }
  }
  loadAssets(){
    this.assets = {};
    // use workspace-relative assets path; also re-render when each image loads
    const base = (document.baseURI || window.location.pathname).replace(/\/[^/]*$/, '');
    const inferredBase = base.endsWith('/') ? base + 'assets/images/' : base + '/assets/images/';
    const map = { mole: 'mole.svg', blueMole: 'blue-mole.svg', bomb: 'bomb.svg', grass: 'grass-tile.svg' };
    for(const k in map){ const img = new Image(); img.onload = ()=> this.render(); img.onerror = ()=> this.render(); img.src = inferredBase + map[k]; this.assets[k] = img; }
  }
  bind(){
    this.canvas.addEventListener('click', e=>{ const rect=this.canvas.getBoundingClientRect(); const mx=e.clientX-rect.left, my=e.clientY-rect.top; this.handleClick(mx,my); });
    document.getElementById('startBtn').addEventListener('click', ()=>this.start());
    const levelEl = document.getElementById('levelSelect');
    if(levelEl) levelEl.addEventListener('change', (e)=>{ this.level = e.target.value; });
    const gridEl = document.getElementById('gridSelect');
    if(gridEl){
      gridEl.addEventListener('change', (e)=>{ const v = parseInt(e.target.value,10) || 4; this.rows = v; this.cols = v; this.setupGrid(); this.render(); });
      // initialize selection value into game
      const initial = parseInt(gridEl.value,10) || 4; this.rows = initial; this.cols = initial; this.setupGrid();
    }
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
    // background: use grass tile if available
    const gimg = this.assets && this.assets.grass;
    if(gimg && gimg.complete){ const pat = ctx.createPattern(gimg,'repeat'); if(pat){ ctx.fillStyle = pat; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); } }
    else { ctx.fillStyle = '#8fc46a'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height); ctx.fillStyle = 'rgba(255,255,255,0.02)'; for(let i=0;i<80;i++){ ctx.beginPath(); const x=Math.random()*this.canvas.width, y=Math.random()*this.canvas.height; ctx.ellipse(x,y,2,6,Math.random()*Math.PI,0,Math.PI*2); ctx.fill(); } }
    for(const h of this.holes) h.render(ctx);
  }
  loop(ts){ if(!this._last) this._last=ts; const dt = ts - this._last; this._last = ts; if(this.running){ this.update(dt); this.render(); requestAnimationFrame(this.loop); } }
  updateUI(){ document.getElementById('score').textContent = this.score; document.getElementById('lives').textContent = this.lives; document.getElementById('high').textContent = this.high; }
}

// instantiate
const game = new Game('gameCanvas');
window._whack = game;
</script>
