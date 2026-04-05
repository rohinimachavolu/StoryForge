// interactive.js — author mode, XP system, chapter end, visual feedback

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
const GAME = {
  xp: 0, level: 1, hp: 100, maxHp: 100,
  streak: 0, totalChoices: 0, chapterXp: 0
};

const XP_TABLE = {
  brave: 50, smart: 30, scene: 15,
  streak: 25, chapter: 100, rewrite: 20
};

const LEVEL_THRESHOLDS = [0,100,250,450,700,1000,1400,1900];

function getLevel(xp){ for(let i=LEVEL_THRESHOLDS.length-1;i>=0;i--){ if(xp>=LEVEL_THRESHOLDS[i]) return i+1; } return 1; }
function getLevelPct(xp){ const l=getLevel(xp),c=LEVEL_THRESHOLDS[l-1]||0,n=LEVEL_THRESHOLDS[l]||c+200; return Math.round((xp-c)/(n-c)*100); }

// ═══════════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════════
function initHUD(){
  document.getElementById('game-hud')?.remove();
  const hud = document.createElement('div');
  hud.id = 'game-hud';
  hud.innerHTML = `
    <div class="hud-block">
      <span class="hud-lbl">LVL</span>
      <span class="hud-val" id="h-lvl">1</span>
    </div>
    <div class="hud-xp-wrap">
      <div class="hud-bar"><div class="hud-xp-fill" id="h-xp"></div></div>
      <span class="hud-tiny" id="h-xp-num">0 XP</span>
    </div>
    <div class="hud-block">
      <span class="hud-lbl">❤</span>
      <div class="hud-bar hud-hp-bar"><div class="hud-hp-fill" id="h-hp"></div></div>
      <span class="hud-val" id="h-hp-num" style="color:#44ff88">100</span>
    </div>`;
  document.querySelector('.story-topbar')?.appendChild(hud);
  updateHUD();
}

function updateHUD(){
  const l=getLevel(GAME.xp), p=getLevelPct(GAME.xp), hpP=(GAME.hp/GAME.maxHp)*100;
  const hpC = hpP>60?'#44ff88':hpP>30?'#ffaa00':'#ff4444';
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e[typeof v==='string'&&v.includes('%')?'style':'textContent']=v;};
  set('h-lvl', String(l));
  const xpEl=document.getElementById('h-xp'); if(xpEl) xpEl.style.width=p+'%';
  set('h-xp-num', GAME.xp+' XP');
  const hpEl=document.getElementById('h-hp'); if(hpEl){hpEl.style.width=hpP+'%';hpEl.style.background=hpC;}
  const hpNum=document.getElementById('h-hp-num'); if(hpNum){hpNum.textContent=GAME.hp;hpNum.style.color=hpC;}
}

// ═══════════════════════════════════════════════════════════
// XP / HP AWARDS
// ═══════════════════════════════════════════════════════════
function awardXP(type, label){
  const amt = XP_TABLE[type]||15;
  const oldLvl = getLevel(GAME.xp);
  GAME.xp += amt; GAME.chapterXp += amt;
  const newLvl = getLevel(GAME.xp);
  floatPopup('+'+amt+' XP'+(label?' · '+label:''), '#c9a96e', 'top-right');
  updateHUD();
  if(newLvl>oldLvl) setTimeout(()=>showLevelUp(newLvl), 500);
}

function awardHP(amt){
  GAME.hp = Math.min(GAME.maxHp, GAME.hp+amt);
  floatPopup((amt>0?'+':'')+amt+' HP', amt>0?'#44ff88':'#ff4444', 'top-right-2');
  updateHUD();
}

function evaluateChoice(choice, emotion){
  const brave=/fight|charge|confront|stand|attack|challenge|face|defend/i.test(choice);
  const smart=/investigate|examine|search|listen|observe|plan|think|sneak/i.test(choice);
  if(emotion==='danger'&&brave){ awardXP('brave','⚔ Brave!'); awardHP(10); GAME.streak++; }
  else if(smart){ awardXP('smart','🧠 Smart!'); GAME.streak++; if(GAME.streak>=3){awardXP('streak','🔥 Streak!');GAME.streak=0;} }
  else{ awardXP('scene',''); GAME.streak=0; }
  if(emotion==='danger') awardHP(-(Math.floor(Math.random()*15)+5));
  if(['calm','happy','euphoria'].includes(emotion)) awardHP(5);
  GAME.totalChoices++;
  markChoiceQuality(choice, brave, smart);
}

function markChoiceQuality(choice, brave, smart){
  document.querySelectorAll('.choice-btn').forEach(btn=>{
    if(btn.textContent.includes(choice.slice(0,20))){
      if(brave) btn.classList.add('choice-brave');
      else if(smart) btn.classList.add('choice-smart');
    }
  });
}

// ═══════════════════════════════════════════════════════════
// FLOATING POPUPS
// ═══════════════════════════════════════════════════════════
const _popupSlots = {};
function floatPopup(text, color, slot){
  const prev = _popupSlots[slot];
  if(prev) prev.remove();
  const el = document.createElement('div');
  el.className = 'float-popup';
  el.textContent = text;
  el.style.cssText = `color:${color};border-color:${color};box-shadow:0 0 14px ${color}44;`;
  el.style.right = slot==='top-right-2'?'24px':'24px';
  el.style.top   = slot==='top-right-2'?'110px':'76px';
  document.body.appendChild(el);
  _popupSlots[slot] = el;
  setTimeout(()=>{ el.remove(); delete _popupSlots[slot]; }, 1800);
}

function showLevelUp(lvl){
  const el = document.createElement('div');
  el.className = 'levelup-banner';
  el.innerHTML = `⚡ LEVEL ${lvl} ⚡<small>You grow stronger</small>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

// ═══════════════════════════════════════════════════════════
// CHAPTER END SCREEN
// ═══════════════════════════════════════════════════════════
function showChapterEnd(num, title){
  const xp = GAME.chapterXp;
  GAME.chapterXp = 0;
  document.getElementById('ch-end')?.remove();
  const el = document.createElement('div');
  el.id = 'ch-end';
  el.className = 'ch-end-overlay';
  el.innerHTML = `
    <div class="ch-end-card">
      <div class="ch-end-glow"></div>
      <p class="ch-end-badge">CHAPTER ${num} COMPLETE</p>
      <h2 class="ch-end-title">${title}</h2>
      <div class="ch-end-stats">
        <div class="ch-stat"><span class="ch-stat-icon">⚡</span><span class="ch-stat-lbl">XP Earned</span><span class="ch-stat-val xp-gold">+${xp}</span></div>
        <div class="ch-stat"><span class="ch-stat-icon">❤</span><span class="ch-stat-lbl">Health</span><span class="ch-stat-val" style="color:${GAME.hp>60?'#44ff88':GAME.hp>30?'#ffaa00':'#ff4444'}">${GAME.hp}/100</span></div>
        <div class="ch-stat"><span class="ch-stat-icon">⭐</span><span class="ch-stat-lbl">Level</span><span class="ch-stat-val xp-gold">${getLevel(GAME.xp)}</span></div>
        <div class="ch-stat"><span class="ch-stat-icon">🎯</span><span class="ch-stat-lbl">Choices</span><span class="ch-stat-val">${GAME.totalChoices}</span></div>
      </div>
      <div class="ch-end-bar-wrap">
        <div class="ch-end-bar"><div class="ch-end-bar-fill" style="width:${getLevelPct(GAME.xp)}%"></div></div>
        <span class="ch-end-bar-lbl">Level ${getLevel(GAME.xp)} · ${GAME.xp} XP total</span>
      </div>
      <button class="btn-primary" style="margin-top:1.2rem" onclick="closeChapterEnd()">Continue Your Journey →</button>
    </div>`;
  document.body.appendChild(el);
}

function closeChapterEnd(){
  const el = document.getElementById('ch-end');
  if(el){ el.style.opacity='0'; el.style.transition='opacity 0.4s'; setTimeout(()=>el.remove(),400); }
}

function resetGame(){ GAME.xp=0;GAME.level=1;GAME.hp=100;GAME.streak=0;GAME.totalChoices=0;GAME.chapterXp=0; }

// ═══════════════════════════════════════════════════════════
// AUTHOR MODE — INTERACTIVE SCENE EDITOR
// ═══════════════════════════════════════════════════════════
function enableAuthorEditing(){
  const sceneEl = document.getElementById('scene-text');
  if(!sceneEl || window.selectedAgency!=='author') return;

  const text = sceneEl.textContent;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  sceneEl.innerHTML = sentences.map((s,i)=>`
    <span class="author-sentence" data-idx="${i}" onclick="clickSentence(this)"
      title="Click to rewrite this moment">${s}</span>`).join('');
  sceneEl.classList.add('author-mode');
}

function clickSentence(el){
  const existing = document.getElementById('sentence-editor');
  if(existing) existing.remove();

  const original = el.textContent.trim();
  const editor = document.createElement('div');
  editor.id = 'sentence-editor';
  editor.className = 'sentence-editor';
  editor.innerHTML = `
    <p class="se-label">✍ Rewrite this moment:</p>
    <div class="se-original">"${original}"</div>
    <textarea class="se-input" id="se-input" rows="2" placeholder="How does this moment actually go?">${original}</textarea>
    <div class="se-actions">
      <button class="se-btn-cancel" onclick="closeSentenceEditor()">Cancel</button>
      <button class="se-btn-confirm" onclick="confirmSentenceEdit('${escapeForAttr(original)}')">Rewrite →</button>
    </div>`;

  el.parentNode.insertBefore(editor, el.nextSibling);
  document.getElementById('se-input').focus();
  document.getElementById('se-input').select();
}

function closeSentenceEditor(){
  document.getElementById('sentence-editor')?.remove();
}

function confirmSentenceEdit(original){
  const val = document.getElementById('se-input')?.value.trim();
  if(!val) return;
  closeSentenceEditor();
  if(typeof applyRewrite === 'function'){
    applyRewrite(`Change "${original}" to: "${val}"`);
    awardXP('rewrite', '✍ Rewritten!');
  }
}

function escapeForAttr(s){ return s.replace(/'/g,"\\'").replace(/"/g,'&quot;').slice(0,80); }

// ── Author Toolbar ─────────────────────────────────────────
function initAuthorToolbar(){
  document.getElementById('author-toolbar')?.remove();
  if(window.selectedAgency!=='author') return;
  const tb = document.createElement('div');
  tb.id = 'author-toolbar';
  tb.className = 'author-toolbar';
  const tools = [
    {icon:'☠️', label:'Kill a character',           key:'kill'},
    {icon:'✨', label:'Revive someone',              key:'revive'},
    {icon:'🌀', label:'Add a plot twist',            key:'twist'},
    {icon:'⏩', label:'Skip forward in time',        key:'skip'},
    {icon:'⛈️', label:'Change the atmosphere',      key:'weather'},
    {icon:'🤝', label:'Introduce an ally',           key:'ally'},
    {icon:'💔', label:'Create a betrayal',           key:'betray'},
    {icon:'🔥', label:'Escalate the danger',         key:'escalate'},
  ];
  tb.innerHTML = tools.map(t=>`
    <button class="atb-btn" onclick="authorQuickAction('${t.key}')" title="${t.label}">
      <span>${t.icon}</span>
      <span class="atb-label">${t.label}</span>
    </button>`).join('');
  document.getElementById('story-screen')?.appendChild(tb);
}

function authorQuickAction(key){
  const map = {
    kill:     'A major character is killed suddenly and dramatically',
    revive:   'A character thought dead returns unexpectedly',
    twist:    'An unexpected twist completely reframes everything',
    skip:     'Time passes — circumstances have changed significantly',
    weather:  'A dramatic change in environment shifts the mood entirely',
    ally:     'An unlikely ally appears and changes the balance of power',
    betray:   'Someone trusted reveals a shocking betrayal',
    escalate: 'The danger level escalates dramatically',
  };
  const input = document.getElementById('agency-input');
  if(input){ input.value = map[key]; input.focus(); }
  else if(typeof applyRewrite==='function'){ applyRewrite(map[key]); }
  awardXP('rewrite', '✍ Author move!');
}