import { getSceneBgUrl } from '../story/index.js';
import { state } from './state.js';

export function updateSceneBg(location, emotion) {
  const bg = document.getElementById('scene-bg');
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
    bg.style.backgroundImage = `url('${url}')`;
    loader.remove();
  };
  document.body.appendChild(loader);
}
