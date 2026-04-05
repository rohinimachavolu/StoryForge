// intro.js — clean book UI, no broken 3D

const GENRES = {
  adventure: { label:'Adventure',    icon:'⚔️', color:'#8bcf72', desc:'Quests, battles, ancient ruins, and glory.',         pills:['I am a knight on a cursed quest','I wake up in a dungeon with no memory','I am the last guardian of a dying realm'] },
  aot:       { label:'Attack on Titan', icon:'🏰', color:'#c9a96e', desc:'Inside the walls. Titans have breached. You are a Scout.', pills:['I am a new Scout recruit during the breach','I discover a secret about the titans','I must choose between saving my squad or the mission'] },
  dystopian: { label:'Dystopian',    icon:'🏙️', color:'#9a8fa0', desc:'A crumbling society. Surveillance. Resistance.',      pills:['I am a rebel hacker in a surveillance state','I discover the government is hiding something','I am the last journalist in a world without press'] },
  victorian: { label:'Victorian Era',icon:'🕯️', color:'#b8956a', desc:'Gas lamps, fog, class tension, and dark secrets.',    pills:["I am a detective investigating a supernatural murder","I am a servant who discovers my employer's secret","I am an inventor whose creation has gone terribly wrong"] }
};

const AGENCY_MODES = {
  witness: { label:'Witness', icon:'👁',  desc:'Observe and choose. The story carries you.',        color:'#7ecdc4' },
  player:  { label:'Player',  icon:'⚔️', desc:'Type what you do. One rewrite per chapter.',         color:'#c9a96e' },
  author:  { label:'Author',  icon:'✍️', desc:'Full control. Rewrite anything, anytime.',           color:'#e8aac0' }
};

window.selectedGenre  = null;
window.selectedAgency = 'player';

function initIntro() { renderIntro(); }

function renderIntro() {
  const intro = document.getElementById('intro-screen');
  intro.innerHTML = `
    <div class="book-wrapper">

      <!-- Book cover strip -->
      <div class="book-header-strip">
        <span class="book-glyph">⚔</span>
        <div>
          <div class="book-main-title">STORYFORGE</div>
          <div class="book-main-sub">Choose your world. Shape your fate.</div>
        </div>
        <span class="book-glyph">⚔</span>
      </div>

      <!-- Two page spread -->
      <div class="book-spread">

        <!-- LEFT PAGE: Genre + Agency -->
        <div class="book-page-left">
          <div class="page-rule"></div>

          <p class="page-heading">I. Choose Your World</p>
          <div class="genre-grid" id="genre-grid">
            ${Object.entries(GENRES).map(([key, g]) => `
              <div class="genre-card" id="genre-${key}" onclick="selectGenre('${key}')">
                <span class="genre-icon">${g.icon}</span>
                <div>
                  <span class="genre-label" style="color:${g.color}">${g.label}</span>
                  <span class="genre-desc">${g.desc}</span>
                </div>
              </div>`).join('')}
          </div>

          <p class="page-heading" style="margin-top:1rem">II. Your Agency</p>
          <div class="agency-row" id="agency-grid">
            ${Object.entries(AGENCY_MODES).map(([key, a]) => `
              <div class="agency-pill ${key==='player'?'selected':''}" id="agency-${key}"
                   onclick="selectAgency('${key}')" style="--ac:${a.color}">
                ${a.icon} ${a.label}
              </div>`).join('')}
          </div>
          <div id="agency-desc-text" class="agency-desc-text">${AGENCY_MODES.player.desc}</div>

          <div class="page-rule" style="margin-top:auto"></div>
        </div>

        <!-- PAGE DIVIDER (spine) -->
        <div class="book-spine-divider"></div>

        <!-- RIGHT PAGE: Prompt -->
        <div class="book-page-right">
          <div class="page-rule"></div>
          <p class="page-heading">III. Your Story Begins</p>

          <div id="prompt-pills-container" style="margin-bottom:0.6rem">
            <p class="pills-hint">Select a world to see story ideas →</p>
          </div>

          <textarea id="prompt-input"
            placeholder="Describe your premise… e.g. 'I am a Scout who discovers the truth about the titans'"
            rows="4"></textarea>

          <button class="btn-forge btn-primary" id="start-btn" onclick="startStory()">
            ✦ Forge Your Story
          </button>

          <div class="page-footer-note">
            Powered by Groq · Images by Pollinations · No data stored
          </div>
          <div class="page-rule" style="margin-top:auto"></div>
        </div>
      </div>
    </div>
  `;
}

function selectGenre(key) {
  window.selectedGenre = key;
  document.querySelectorAll('.genre-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`genre-${key}`).classList.add('selected');

  const g = GENRES[key];
  document.getElementById('prompt-pills-container').innerHTML = `
    <div class="prompt-pills">
      ${g.pills.map(p => `<span class="pill" onclick="setPrompt('${p.replace(/'/g,"\\'")}')">${p}</span>`).join('')}
    </div>`;
}

function selectAgency(key) {
  window.selectedAgency = key;
  document.querySelectorAll('.agency-pill').forEach(c => c.classList.remove('selected'));
  document.getElementById(`agency-${key}`).classList.add('selected');
  document.getElementById('agency-desc-text').textContent = AGENCY_MODES[key].desc;
}

function setPrompt(text) {
  const el = document.getElementById('prompt-input');
  if (el) el.value = text;
}

document.addEventListener('DOMContentLoaded', initIntro);