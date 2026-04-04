import { getCharacterPortraitUrl } from '../story/index.js';
import { escapeAttr, escapeForHtml } from './html-utils.js';
import { state } from './state.js';

export function mergeCharacterLists(prev, incoming) {
  if (!incoming || incoming.length === 0) return prev;
  const merged = prev.map(c => ({ ...c }));
  const indexByName = new Map(merged.map((c, i) => [c.name, i]));
  incoming.forEach(c => {
    const i = indexByName.get(c.name);
    if (i !== undefined) {
      if (c.personality) merged[i].personality = c.personality;
      if (c.description) merged[i].description = c.description;
      if (c.voiceProfile) merged[i].voiceProfile = c.voiceProfile;
      if (c.gender) merged[i].gender = c.gender;
    } else if (merged.length < 6) {
      merged.push({ ...c });
      indexByName.set(c.name, merged.length - 1);
    }
  });
  return merged.length > 6 ? prev : merged;
}

export function renderPortraits(characters) {
  const rail = document.getElementById('portrait-rail');
  rail.innerHTML = characters.map(c => {
    const url = getCharacterPortraitUrl(c.description, c.name, state.narrationTheme);
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1a1a2e&color=c9a96e&size=200&bold=true`;
    const tip = c.personality ? `${c.name} — ${c.personality}` : c.name;
    const titleAttr = escapeAttr(tip);
    const altName = escapeAttr(c.name);
    return `
    <div class="portrait-wrap" title="${titleAttr}">
      <img class="portrait-img"
           src="${url}"
           alt="${altName}"
           onload="this.classList.add('loaded')"
           onerror="this.onerror=null;this.src='${fallback}';this.classList.add('loaded')"/>
      <span class="portrait-name">${escapeForHtml(c.name)}</span>
    </div>`;
  }).join('');
}

export function setStoryTitle(title) {
  state.title = title;
  document.getElementById('story-title').textContent = title;
}
