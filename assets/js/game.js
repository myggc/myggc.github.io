/* ==========================================================================
   GGC minigame — "Flip"
   One button. Clicking flips gravity, so you run along the floor or the
   ceiling. Collect the four brand petals, avoid the red blocks.
   Deliberately not the Chrome dino: you never jump, you switch sides.
   ========================================================================== */

function initGame(){
  const cv = document.getElementById("gameCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");

  const W = 900, H = 260;              // internal resolution, scaled by CSS
  cv.width = W; cv.height = H;

  const GROUND = 26;                   // thickness of floor and ceiling bands
  const P = { x:110, y:H-GROUND-26, w:26, h:26, vy:0, flip:1, rot:0 };
  const G = 0.85, MAXV = 13;

  let obstacles = [], petals = [], parts = [];
  let speed = 5.2, dist = 0, score = 0, best = 0, spawn = 0, pspawn = 40;
  let state = "idle";                  // idle | play | over

  try{ best = Number(localStorage.getItem("ggc-flip-best")) || 0; }catch(e){}

  const scoreEl = document.getElementById("gameScore");
  const bestEl  = document.getElementById("gameBest");
  const btn     = document.getElementById("gameBtn");

  function showScore(){
    if (scoreEl) scoreEl.textContent = score;
    if (bestEl)  bestEl.textContent = best;
  }

  function reset(){
    obstacles = []; petals = []; parts = [];
    speed = 5.2; dist = 0; score = 0; spawn = 60; pspawn = 90;
    P.y = H-GROUND-P.h; P.vy = 0; P.flip = 1; P.rot = 0;
    state = "play";
    if (btn) btn.textContent = t("game.again");
    showScore();
  }

  function flip(){
    if (state === "play"){ P.flip *= -1; P.vy = -P.flip * 3; }
    else reset();
  }

  cv.addEventListener("pointerdown", e => { e.preventDefault(); flip(); });
  if (btn) btn.addEventListener("click", () => { if (state !== "play") reset(); });
  window.addEventListener("keydown", e => {
    if (e.code !== "Space") return;
    // only hijack the spacebar while the game is on screen
    const r = cv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    e.preventDefault();
    flip();
  });

  function burst(x, y, color){
    for (let i = 0; i < 9; i++)
      parts.push({ x, y, vx:(Math.random()-.5)*5, vy:(Math.random()-.5)*5, life:26, c:color });
  }

  function update(){
    if (state !== "play") return;

    P.vy += G * P.flip;
    P.vy = Math.max(-MAXV, Math.min(MAXV, P.vy));
    P.y += P.vy;
    P.rot += P.flip * 0.06;

    const floorY = H - GROUND - P.h, ceilY = GROUND;
    if (P.y > floorY){ P.y = floorY; P.vy = 0; }
    if (P.y < ceilY){ P.y = ceilY; P.vy = 0; }

    dist += speed;
    speed = Math.min(11, 5.2 + dist / 5200);

    if (--spawn <= 0){
      const top = Math.random() < .5;
      const h = 26 + Math.random() * 34;
      obstacles.push({ x:W+30, y: top ? GROUND : H-GROUND-h, w:20, h });
      spawn = Math.max(38, 92 - speed * 4) + Math.random() * 40;
    }
    if (--pspawn <= 0){
      const top = Math.random() < .5;
      petals.push({ x:W+20, y: top ? GROUND+22 : H-GROUND-42, r:9,
                    c: BRAND_CYCLE[Math.floor(Math.random()*4)] });
      pspawn = 70 + Math.random() * 90;
    }

    obstacles.forEach(o => o.x -= speed);
    petals.forEach(p => p.x -= speed);
    obstacles = obstacles.filter(o => o.x > -40);
    petals = petals.filter(p => p.x > -30);

    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    parts = parts.filter(p => p.life > 0);

    for (const o of obstacles){
      if (P.x < o.x+o.w && P.x+P.w > o.x && P.y < o.y+o.h && P.y+P.h > o.y){
        state = "over";
        burst(P.x+P.w/2, P.y+P.h/2, BRAND.red);
        if (score > best){
          best = score;
          try{ localStorage.setItem("ggc-flip-best", String(best)); }catch(e){}
        }
        if (btn) btn.textContent = t("game.again");
        showScore();
        return;
      }
    }
    for (let i = petals.length-1; i >= 0; i--){
      const p = petals[i];
      if (Math.abs((P.x+P.w/2)-p.x) < 22 && Math.abs((P.y+P.h/2)-p.y) < 22){
        burst(p.x, p.y, p.c);
        petals.splice(i,1);
        score += 10;
        showScore();
      }
    }
    if (Math.floor(dist) % 60 === 0){ score += 1; showScore(); }
  }

  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,"#0E3D78"); g.addColorStop(1,"#0A2C57");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    /* parallax dots */
    ctx.fillStyle = "rgba(255,255,255,.10)";
    for (let i=0;i<26;i++){
      const x = (i*137 - dist*0.35) % (W+40);
      ctx.fillRect(x<0?x+W+40:x, 40 + (i*53)%(H-90), 3, 3);
    }

    /* floor + ceiling in brand colours */
    const bands = [BRAND.green, BRAND.blue];
    ctx.fillStyle = bands[0]; ctx.fillRect(0,0,W,GROUND);
    ctx.fillStyle = bands[1]; ctx.fillRect(0,H-GROUND,W,GROUND);

    petals.forEach(p => {
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x,p.y,3.4,0,7); ctx.fill();
    });

    ctx.fillStyle = BRAND.red;
    obstacles.forEach(o => { roundRect(o.x,o.y,o.w,o.h,5); ctx.fill(); });

    parts.forEach(p => {
      ctx.globalAlpha = p.life/26;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x,p.y,4,4);
      ctx.globalAlpha = 1;
    });

    /* player: a GGC petal square */
    ctx.save();
    ctx.translate(P.x+P.w/2, P.y+P.h/2);
    ctx.rotate(P.rot);
    ctx.fillStyle = BRAND.yellow;
    roundRect(-P.w/2,-P.h/2,P.w,P.h,8); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0,0,5,0,7); ctx.fill();
    ctx.restore();

    if (state !== "play"){
      ctx.fillStyle = "rgba(10,44,87,.72)";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "700 30px system-ui, sans-serif";
      ctx.fillText(state === "over" ? t("game.over") : "GGC", W/2, H/2 - 6);
      ctx.font = "400 16px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fillText(t("game.tap"), W/2, H/2 + 24);
    }
  }

  function loop(){ update(); draw(); requestAnimationFrame(loop); }

  showScore();
  loop();
}
