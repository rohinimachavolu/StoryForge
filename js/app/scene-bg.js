/**
 * Scene images via Pollinations are disabled — their API often returns 500 and
 * spams the console. Emotion gradients (updateBG) still provide atmosphere.
 */
export function updateSceneBg(_location, _emotion) {
  const bg = document.getElementById('scene-bg');
  if (bg) bg.style.backgroundImage = '';
}
