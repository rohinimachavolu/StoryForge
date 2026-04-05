// chapters.js — chapter management + drag-drop plot beats

const CHAPTER_STRUCTURE = {
  adventure: [
    { title: 'The Ordinary World',     beats: ['You live a quiet but restless life', 'Something feels missing', 'A stranger arrives with news'] },
    { title: 'The Call',               beats: ['An urgent mission is revealed', 'You must make a choice to leave', 'The stakes become clear'] },
    { title: 'Crossing the Threshold', beats: ['You enter unfamiliar territory', 'First real danger appears', 'An unexpected ally emerges'] },
    { title: 'Trials Begin',           beats: ['A test of skill or courage', 'You face your first major loss', 'A secret is uncovered'] },
    { title: 'The Dark Night',         beats: ['Everything goes wrong', 'You are alone and broken', 'A last hope appears'] },
    { title: 'The Final Ordeal',        beats: ['Confrontation with the main threat', 'You must sacrifice something', 'The outcome hangs by a thread'] },
    { title: 'Return Transformed',     beats: ['Victory at great cost', 'The world is changed', 'You are not who you were'] }
  ],
  aot: [
    { title: 'Life Inside the Walls',  beats: ['Wall Maria stands strong', 'Daily Scout Regiment training', 'Rumors of Titan activity'] },
    { title: 'The Breach',             beats: ['Titans breach the outer wall', 'Evacuation chaos begins', 'You lose someone important'] },
    { title: 'First Contact',          beats: ['You face a Titan for the first time', 'ODM gear malfunction', 'A critical choice in battle'] },
    { title: 'The Secret',             beats: ['Something is wrong with the Titans', 'A comrade acts suspiciously', 'Forbidden knowledge surfaces'] },
    { title: 'Betrayal',               beats: ['Trust is shattered', 'The enemy may be within', 'You must choose a side'] },
    { title: 'The Assault',            beats: ['All-out attack on the source', 'Massive casualties', 'The truth is revealed'] },
    { title: 'After the Thunder',      beats: ['The walls stand or fall', 'What remains of humanity', 'Your choice echoes forward'] }
  ],
  dystopian: [
    { title: 'The Gray City',          beats: ['Surveillance is everywhere', 'You follow the rules', 'A crack in the system appears'] },
    { title: 'First Awakening',        beats: ['You see something you cannot unsee', 'Someone dangerous finds you', 'The resistance makes contact'] },
    { title: 'Going Underground',      beats: ['You join the underground', 'New skills and new dangers', 'Your identity is at risk'] },
    { title: 'The Network',            beats: ['Resistance has a plan', 'Not everyone can be trusted', 'A government agent gets close'] },
    { title: 'Exposure',               beats: ['Your cover is blown', 'Friends are captured', 'You must act fast or lose everything'] },
    { title: 'Broadcast',              beats: ['The plan reaches its climax', 'The city watches', 'Power shifts violently'] },
    { title: 'New Order',              beats: ['The old world is gone', 'What replaces it is uncertain', 'Your role in what comes next'] }
  ],
  victorian: [
    { title: 'Fog and Gas Lamps',      beats: ['London at dusk', 'A peculiar case arrives', 'First clue surfaces'] },
    { title: 'High Society Secrets',   beats: ['A ball with hidden motives', 'Someone is not who they seem', 'You overhear something dangerous'] },
    { title: 'Into the Shadows',       beats: ['East End investigation', 'A body is discovered', 'The occult is involved'] },
    { title: 'The Conspiracy',         beats: ['Multiple murders connected', 'A powerful name emerges', 'You are being followed'] },
    { title: 'The Unmasking',          beats: ['Confrontation with the suspect', 'A shocking revelation', 'Your life is threatened'] },
    { title: 'Dark Machinery',         beats: ['The full scope of the plot', 'Industry and evil intertwined', 'A final gambit'] },
    { title: 'Dawn Over London',       beats: ['Justice served — or denied', 'The city moves on', 'You carry the truth alone'] }
  ]
};

// Chapter state
window.chapterState = {
  current: 0,
  completed: [],
  beats: []       // user-arranged beats for current chapter
};

function initChapters(genre) {
  const chapters = CHAPTER_STRUCTURE[genre] || CHAPTER_STRUCTURE.adventure;
  window.chapterState.beats = chapters.map(ch => [...ch.beats]);
  renderChapterSidebar(genre);
}

function renderChapterSidebar(genre) {
  const chapters = CHAPTER_STRUCTURE[genre] || CHAPTER_STRUCTURE.adventure;
  const sidebar = document.getElementById('chapter-sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <span class="sidebar-title">📖 Story Arc</span>
    </div>
    <div class="chapter-list">
      ${chapters.map((ch, i) => `
        <div class="chapter-item ${i === 0 ? 'active' : ''} ${i > 0 ? 'locked' : ''}"
             id="chapter-item-${i}" onclick="openChapterBeats(${i})">
          <span class="chapter-num">${i + 1}</span>
          <span class="chapter-title-text">${ch.title}</span>
          <span class="chapter-status" id="ch-status-${i}">
            ${i === 0 ? '▶' : '🔒'}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

function updateChapterProgress(index) {
  const genre = window.selectedGenre || 'adventure';
  const chapters = CHAPTER_STRUCTURE[genre];

  // Mark completed
  const prev = document.getElementById(`chapter-item-${index - 1}`);
  if (prev) { prev.classList.remove('active'); prev.classList.add('completed'); }
  const prevStatus = document.getElementById(`ch-status-${index - 1}`);
  if (prevStatus) prevStatus.textContent = '✓';

  // Mark active
  const curr = document.getElementById(`chapter-item-${index}`);
  if (curr) { curr.classList.remove('locked'); curr.classList.add('active'); }
  const currStatus = document.getElementById(`ch-status-${index}`);
  if (currStatus) currStatus.textContent = '▶';

  window.chapterState.current = index;
}

// ── Drag-drop beat editor ──────────────────────────────────────────────────
function openChapterBeats(chapterIndex) {
  const genre    = window.selectedGenre || 'adventure';
  const chapters = CHAPTER_STRUCTURE[genre];
  const ch       = chapters[chapterIndex];
  const beats    = window.chapterState.beats[chapterIndex] || [...ch.beats];

  // Only allow editing current or future chapters
  if (chapterIndex < window.chapterState.current) return;

  const modal = document.createElement('div');
  modal.className = 'beats-modal';
  modal.id = 'beats-modal';
  modal.innerHTML = `
    <div class="beats-modal-inner">
      <div class="beats-modal-header">
        <span>Chapter ${chapterIndex + 1}: ${ch.title}</span>
        <button onclick="closeBeatsModal()" class="beats-close">✕</button>
      </div>
      <p class="beats-instruction">Drag to rearrange the story beats for this chapter.</p>
      <ul class="beats-list" id="beats-list-${chapterIndex}">
        ${beats.map((beat, i) => `
          <li class="beat-item" draggable="true" data-index="${i}" data-chapter="${chapterIndex}">
            <span class="drag-handle">⠿</span>
            <span class="beat-text" contenteditable="true">${beat}</span>
          </li>
        `).join('')}
      </ul>
      <div class="beats-actions">
        <button class="btn-beat-add" onclick="addBeat(${chapterIndex})">+ Add Beat</button>
        <button class="btn-primary btn-beats-confirm" onclick="confirmBeats(${chapterIndex})">
          ✓ Set Story Beats
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  initDragDrop(`beats-list-${chapterIndex}`, chapterIndex);
}

function closeBeatsModal() {
  const modal = document.getElementById('beats-modal');
  if (modal) modal.remove();
}

function addBeat(chapterIndex) {
  const list = document.getElementById(`beats-list-${chapterIndex}`);
  const i = list.children.length;
  const li = document.createElement('li');
  li.className = 'beat-item';
  li.draggable = true;
  li.dataset.index = i;
  li.dataset.chapter = chapterIndex;
  li.innerHTML = `<span class="drag-handle">⠿</span><span class="beat-text" contenteditable="true">New story beat...</span>`;
  list.appendChild(li);
  initDragDrop(`beats-list-${chapterIndex}`, chapterIndex);
}

function confirmBeats(chapterIndex) {
  const list = document.getElementById(`beats-list-${chapterIndex}`);
  const beats = Array.from(list.querySelectorAll('.beat-text')).map(el => el.textContent.trim());
  window.chapterState.beats[chapterIndex] = beats;
  closeBeatsModal();

  // Visual confirmation
  const item = document.getElementById(`chapter-item-${chapterIndex}`);
  if (item) {
    item.classList.add('beats-set');
    const status = document.getElementById(`ch-status-${chapterIndex}`);
    if (status && chapterIndex !== window.chapterState.current) status.textContent = '✏️';
  }
}

// ── Drag and drop ──────────────────────────────────────────────────────────
function initDragDrop(listId, chapterIndex) {
  const list = document.getElementById(listId);
  if (!list) return;

  let dragSrc = null;

  list.querySelectorAll('.beat-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      list.querySelectorAll('.beat-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.beat-item').forEach(i => i.classList.remove('drag-over'));
      if (item !== dragSrc) item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrc && dragSrc !== item) {
        const allItems = Array.from(list.querySelectorAll('.beat-item'));
        const srcIdx  = allItems.indexOf(dragSrc);
        const tgtIdx  = allItems.indexOf(item);
        if (srcIdx < tgtIdx) list.insertBefore(dragSrc, item.nextSibling);
        else                  list.insertBefore(dragSrc, item);
      }
      item.classList.remove('drag-over');
    });
  });
}

// Get beats for current chapter to inject into prompt
function getCurrentChapterContext() {
  const genre    = window.selectedGenre || 'adventure';
  const chapters = CHAPTER_STRUCTURE[genre];
  const idx      = window.chapterState.current;
  const ch       = chapters[idx];
  const beats    = window.chapterState.beats[idx] || ch.beats;
  return {
    chapterNum:   idx + 1,
    chapterTitle: ch.title,
    beats:        beats,
    isLast:       idx === chapters.length - 1
  };
}