import { getOpenAiKey, isPlaceholderKey } from '../story/index.js';

const OPENAI_VIDEO_API_URL = 'https://api.openai.com/v1/videos';
const OPENAI_VIDEO_MODEL = 'sora-2';
const OPENAI_VIDEO_SIZE = '1280x720';
const OPENAI_VIDEO_SECONDS = '4';
const VIDEO_POLL_MS = 3000;
const VIDEO_POLL_LIMIT = 24;

let requestToken = 0;
let displayedSignature = '';
let displayedObjectUrl = '';

function getVideoElements() {
  return {
    frame: document.getElementById('scene-video-frame'),
    video: document.getElementById('scene-video'),
    status: document.getElementById('scene-video-status')
  };
}

function sceneSignature(data) {
  return JSON.stringify({
    title: data?.title || '',
    emotion: data?.emotion || '',
    location: data?.location || '',
    scene: data?.scene || ''
  });
}

function setVideoStatus(message, tone = 'info') {
  const { frame, status, video } = getVideoElements();
  if (!frame || !status || !video) return;
  frame.dataset.state = tone;
  status.textContent = message;
  status.hidden = false;
  video.hidden = true;
  video.removeAttribute('src');
  video.load();
}

function showVideo(objectUrl) {
  const { frame, status, video } = getVideoElements();
  if (!frame || !status || !video) return;
  frame.dataset.state = 'ready';
  status.hidden = true;
  status.textContent = '';
  video.src = objectUrl;
  video.hidden = false;
  void video.play().catch(() => {
    /* autoplay can be blocked; controls are intentionally hidden */
  });
}

function revokeDisplayedVideo() {
  if (!displayedObjectUrl) return;
  URL.revokeObjectURL(displayedObjectUrl);
  displayedObjectUrl = '';
}

function buildSceneVideoPrompt(data) {
  const sceneText = String(data?.scene || '').replace(/\s+/g, ' ').trim();
  const condensedScene = sceneText.length > 420 ? `${sceneText.slice(0, 417)}...` : sceneText;
  const location = data?.location ? `Setting: ${data.location}.` : '';
  const title = data?.title ? `Story title: ${data.title}.` : '';
  const emotion = data?.emotion ? `Mood: ${data.emotion}.` : '';
  return [
    'Create a short cinematic fantasy clip inspired by this story scene.',
    'Keep it safe for a general audience, with original characters only.',
    'Do not include text, captions, logos, watermarks, UI, or copyrighted franchise characters.',
    'Favor atmospheric motion, dramatic lighting, and a loop-friendly shot.',
    title,
    location,
    emotion,
    `Scene summary: ${condensedScene}`
  ].filter(Boolean).join(' ');
}

async function createVideoJob(prompt, apiKey) {
  const res = await fetch(OPENAI_VIDEO_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_VIDEO_MODEL,
      prompt,
      size: OPENAI_VIDEO_SIZE,
      seconds: OPENAI_VIDEO_SECONDS
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Could not start scene animation.');
  }
  if (!data?.id) throw new Error('OpenAI video API did not return a job id.');
  return data.id;
}

async function pollForVideo(videoId, apiKey, token) {
  for (let attempt = 0; attempt < VIDEO_POLL_LIMIT; attempt++) {
    if (token !== requestToken) throw new Error('stale_request');
    await new Promise(resolve => setTimeout(resolve, VIDEO_POLL_MS));
    const res = await fetch(`${OPENAI_VIDEO_API_URL}/${videoId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Could not check scene animation status.');
    }
    if (data?.status === 'completed') return;
    if (data?.status === 'failed') {
      throw new Error(data?.error?.message || 'Scene animation generation failed.');
    }
  }
  throw new Error('Scene animation is taking too long. Try another scene in a moment.');
}

async function downloadVideo(videoId, apiKey) {
  const res = await fetch(`${OPENAI_VIDEO_API_URL}/${videoId}/content`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    let message = 'Could not download scene animation.';
    try {
      const data = await res.json();
      message = data?.error?.message || message;
    } catch {
      /* ignore non-JSON bodies */
    }
    throw new Error(message);
  }
  return res.blob();
}

export function clearSceneVideo() {
  requestToken++;
  displayedSignature = '';
  revokeDisplayedVideo();
  const { frame, status, video } = getVideoElements();
  if (!frame || !status || !video) return;
  frame.dataset.state = 'idle';
  status.hidden = false;
  status.textContent = 'The next scene animation will appear here.';
  video.hidden = true;
  video.removeAttribute('src');
  video.load();
}

export async function updateSceneVideo(data) {
  const signature = sceneSignature(data);
  if (!signature) return;
  if (signature === displayedSignature && displayedObjectUrl) {
    showVideo(displayedObjectUrl);
    return;
  }

  const apiKey = getOpenAiKey();
  if (!apiKey || isPlaceholderKey(apiKey)) {
    setVideoStatus('Add a valid OpenAI API key to generate scene animation.', 'error');
    return;
  }

  const token = ++requestToken;
  setVideoStatus('Generating scene video... this can take 15 to 90 seconds.', 'loading');

  try {
    const prompt = buildSceneVideoPrompt(data);
    const videoId = await createVideoJob(prompt, apiKey);
    await pollForVideo(videoId, apiKey, token);
    if (token !== requestToken) return;
    const blob = await downloadVideo(videoId, apiKey);
    if (token !== requestToken) return;
    const objectUrl = URL.createObjectURL(blob);
    if (token !== requestToken) {
      URL.revokeObjectURL(objectUrl);
      return;
    }
    revokeDisplayedVideo();
    displayedObjectUrl = objectUrl;
    displayedSignature = signature;
    showVideo(objectUrl);
  } catch (error) {
    if (String(error?.message || error) === 'stale_request') return;
    setVideoStatus(
      `Scene animation unavailable: ${error?.message || 'OpenAI video request failed.'}`,
      'error'
    );
  }
}
