import { getSceneBgUrl } from '../story/index.js';
import { state } from './state.js';

const MAX_RETRIES = 2;

export function updateSceneBg(location, emotion) {
  const bg = document.getElementById('scene-bg');
  let attempt = 0;

  function tryLoad() {
    const url = getSceneBgUrl(location, emotion, state.narrationTheme);
    const loader = document.createElement('img');
    loader.crossOrigin = 'anonymous';
    loader.style.display = 'none';
    loader.src = url;
    loader.onload = () => {
      bg.style.backgroundImage = `url('${url}')`;
      loader.remove();
    };
    loader.onerror = () => {
      loader.remove();
      attempt++;
      if (attempt <= MAX_RETRIES) {
        console.warn(`[BG] image failed (attempt ${attempt}), retrying…`);
        setTimeout(tryLoad, 1500 * attempt);
      } else {
        console.warn('[BG] all retries exhausted, keeping previous background');
      }
    };
    document.body.appendChild(loader);
  }

  tryLoad();
}
