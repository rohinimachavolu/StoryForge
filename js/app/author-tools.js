import { state, SCENE_CAP } from './state.js';

export const AUTHOR_INTERVENTIONS = [
  {
    id: 'kill',
    label: 'Kill a character',
    choice:
      '✍ AUTHOR — Kill one significant NPC who exists in the current cast or log, in a dramatic earned moment. Show the death in-scene, update the JSON cast (remove them or note their end), and give three choices for how You react.'
  },
  {
    id: 'revive',
    label: 'Revive someone',
    choice:
      '✍ AUTHOR — Bring back a character who was lost, presumed dead, or missing, in a believable way for this world. Update the cast in JSON and weave the return into the next beat.'
  },
  {
    id: 'twist',
    label: 'Plot twist',
    choice:
      '✍ AUTHOR — Drop a sharp plot twist that recontextualizes something already established in the log (not random). Pay it off in the scene prose; keep cast consistent.'
  },
  {
    id: 'time_skip',
    label: 'Skip time forward',
    choice:
      '✍ AUTHOR — Jump forward in time (hours to weeks — pick what fits). Summarize only what matters, then land in a concrete new moment with sensory detail and stakes.'
  },
  {
    id: 'atmosphere',
    label: 'Change atmosphere',
    choice:
      '✍ AUTHOR — Shift mood and atmosphere sharply (weather, lighting, social tone, or setting pressure) while staying true to the premise; reflect it in emotion/location fields.'
  },
  {
    id: 'ally',
    label: 'Introduce an ally',
    choice:
      '✍ AUTHOR — Introduce a new ally NPC with a name, voice, and motive; add them to characters JSON and make them matter this scene.'
  },
  {
    id: 'betrayal',
    label: 'Create betrayal',
    choice:
      '✍ AUTHOR — Engineer a betrayal from someone plausible in the log or cast. Make it hurt logically, not out of nowhere; show consequences in prose and choices.'
  },
  {
    id: 'escalate',
    label: 'Escalate danger',
    choice:
      '✍ AUTHOR — Escalate immediate danger (threat, deadline, violence, or exposure). Raise stakes without ending the saga; set emotion toward tension or danger.'
  },
  {
    id: 'complicate',
    label: 'Complicate the story',
    choice:
      '✍ AUTHOR — Add a complication: competing goal, moral bind, secret, or obstacle that makes the situation messier and more interesting. No cheap resets.'
  }
];

function setAuthorBusy(busy) {
  const aside = document.getElementById('author-tools-aside');
  if (!aside) return;
  aside.classList.toggle('is-busy', busy);
  aside.querySelectorAll('.author-tool-btn').forEach(b => {
    b.disabled = busy;
  });
}

export function syncAuthorToolsVisibility() {
  const aside = document.getElementById('author-tools-aside');
  if (!aside) return;
  const show =
    state.playerMode === 'author' &&
    !!state.currentScene &&
    document.getElementById('story-screen')?.classList.contains('active');
  aside.hidden = !show;
}

export function initAuthorTools() {
  const list = document.getElementById('author-tools-list');
  if (!list || list.dataset.bound === '1') return;
  list.dataset.bound = '1';
  list.innerHTML = '';
  AUTHOR_INTERVENTIONS.forEach(def => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'author-tool-btn';
    btn.textContent = def.label;
    btn.title = def.choice.slice(0, 200);
    btn.addEventListener('click', () => void fireAuthorIntervention(def.id));
    list.appendChild(btn);
  });
}

export async function fireAuthorIntervention(id) {
  if (state.playerMode !== 'author') return;
  if (!state.currentScene) return;
  if (state.sceneInChapter >= SCENE_CAP) {
    const { showApiNotice } = await import('./ui-loading.js');
    showApiNotice('Finish this chapter or use Next chapter before an author move.');
    return;
  }
  const def = AUTHOR_INTERVENTIONS.find(x => x.id === id);
  if (!def) return;
  setAuthorBusy(true);
  try {
    const { advanceStoryWithChoice } = await import('./scene-choices.js');
    await advanceStoryWithChoice(def.choice);
  } finally {
    setAuthorBusy(false);
    syncAuthorToolsVisibility();
  }
}
