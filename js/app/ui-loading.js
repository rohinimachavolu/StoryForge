export function hideApiNotice() {
  const n = document.getElementById('api-notice');
  if (n) {
    n.style.display = 'none';
    n.textContent = '';
    if (n._hideTimer) clearTimeout(n._hideTimer);
  }
}

export function showApiNotice(message) {
  const n = document.getElementById('api-notice');
  if (!n) return;
  n.textContent = message;
  n.style.display = 'block';
  if (n._hideTimer) clearTimeout(n._hideTimer);
  n._hideTimer = setTimeout(() => hideApiNotice(), 14000);
}

export function showLoading(subline) {
  hideApiNotice();
  document.getElementById('scene-text').textContent = subline
    ? `Crafting the next scene…\n\n${subline}`
    : 'Crafting the next scene…';
  document.getElementById('emotion-badge').style.display = 'none';
  document.getElementById('choices-area').innerHTML = `
    <div class="loading"><div class="spinner"></div>Almost there…</div>`;
}

export function disableChoices(d) {
  document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = d; });
  const ta = document.getElementById('choice-user-textarea');
  const go = document.querySelector('.btn-user-choice-go');
  if (ta) ta.disabled = d;
  if (go) go.disabled = d;
}

export function showError(msg) {
  document.getElementById('scene-text').textContent = `⚠ ${msg}`;
}
