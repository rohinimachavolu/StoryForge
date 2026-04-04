export function sceneImageStyle(narrationTheme) {
  if (narrationTheme === 'victorian') return 'Victorian England 1890s, gaslight, cinematic environment, highly detailed, painterly, no people, atmospheric';
  if (narrationTheme === 'veilwild') {
    return 'mythic fantasy borderland, vast luminous sky, drifting bioluminescent mist, ancient weathered stones, impossible horizon, cinematic painterly environment, highly detailed, no people, dramatic golden-hour and teal shadows';
  }
  return 'dystopian sci-fi city, cinematic environment, highly detailed, painterly, no people, atmospheric, neon and decay';
}

export function portraitStyle(narrationTheme) {
  if (narrationTheme === 'victorian') return 'Victorian era character portrait, period costume, painterly, detailed face, soft dramatic lighting, upper body';
  if (narrationTheme === 'veilwild') {
    return 'mythic borderlands character portrait, travel-worn fantasy garb, striking expressive face, painterly, strong rim light and cool fill, upper body';
  }
  return 'dystopian sci-fi character portrait, detailed face, painterly, cinematic lighting, upper body';
}

export function getSceneBgUrl(location, emotion, narrationTheme) {
  const style = sceneImageStyle(narrationTheme);
  const prompt = `${location}, ${emotion} mood, ${style}, wide angle`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}

export function getCharacterPortraitUrl(description, name, narrationTheme) {
  const style = portraitStyle(narrationTheme);
  const prompt = `portrait of ${description}, character named ${name}, ${style}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=500&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}
