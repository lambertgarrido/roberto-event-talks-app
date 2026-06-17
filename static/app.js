/* =====================================================
   BigQuery Release Notes — Client-side JS
   ===================================================== */

'use strict';

// ── State ──────────────────────────────────────────────
let allEntries = [];

// ── DOM Refs ───────────────────────────────────────────
const refreshBtn    = document.getElementById('refresh-btn');
const spinner       = document.getElementById('spinner');
const refreshLabel  = document.getElementById('refresh-label');
const lastUpdated   = document.getElementById('last-updated');
const statsBar      = document.getElementById('stats-bar');
const statCount     = document.getElementById('stat-count');
const searchInput   = document.getElementById('search-input');
const notesGrid     = document.getElementById('notes-grid');
const emptyState    = document.getElementById('empty-state');
const errorState    = document.getElementById('error-state');
const errorMessage  = document.getElementById('error-message');

// Modal
const tweetModal    = document.getElementById('tweet-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const tweetTextarea = document.getElementById('tweet-text');
const charNum       = document.getElementById('char-num');
const charCount     = tweetTextarea.closest('.tweet-composer').querySelector('.char-count');
const tweetLink     = document.getElementById('tweet-link');

// Export
const exportBtn     = document.getElementById('export-btn');

// ── Fetch ──────────────────────────────────────────────
async function fetchNotes() {
  setLoading(true);
  hideAll();

  try {
    const res = await fetch('/api/release-notes');
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Unknown server error');
    }

    allEntries = data.entries || [];
    renderNotes(allEntries);

    // Update stats
    statCount.textContent = allEntries.length;
    statsBar.style.display = 'flex';

    // Update timestamp
    const now = new Date();
    lastUpdated.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    errorMessage.textContent = err.message;
    errorState.style.display = 'flex';
  } finally {
    setLoading(false);
  }
}

// ── Render ─────────────────────────────────────────────
function renderNotes(entries) {
  notesGrid.innerHTML = '';

  if (!entries.length) {
    emptyState.style.display = 'flex';
    emptyState.querySelector('.empty-title').textContent = 'No results found';
    emptyState.querySelector('.empty-desc').textContent = 'Try a different search term.';
    return;
  }

  entries.forEach((entry, idx) => {
    const card = buildCard(entry, idx);
    notesGrid.appendChild(card);
  });
}

function buildCard(entry, idx) {
  const card = document.createElement('article');
  card.className = 'note-card';
  card.style.animationDelay = `${Math.min(idx * 40, 400)}ms`;

  const safeTitle   = escHtml(entry.title);
  const safeDate    = escHtml(entry.date);
  const safePreview = escHtml(entry.preview || '');
  const safeLink    = escHtml(entry.link || '#');

  card.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">
        <a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeTitle}</a>
      </h2>
      <span class="card-date">${safeDate}</span>
    </div>
    <p class="card-preview">${safePreview}</p>
    <div class="card-footer">
      <a class="btn-read-more" href="${safeLink}" target="_blank" rel="noopener noreferrer">
        Read more <span aria-hidden="true">→</span>
      </a>
      <div class="card-footer-actions">
        <button class="btn-copy-card" aria-label="Copy release note to clipboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </button>
        <button class="btn-tweet-card" aria-label="Tweet about this update">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.256 5.627 5.909-5.627Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Tweet
        </button>
      </div>
    </div>
  `;

  // Copy to clipboard
  const copyBtn = card.querySelector('.btn-copy-card');
  copyBtn.addEventListener('click', () => {
    const text = [
      entry.title,
      entry.date,
      entry.link,
      '',
      entry.preview,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      copyBtn.classList.add('copied');
      copyBtn.querySelector('svg').outerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0">
          <polyline points="20 6 9 17 4 12"/>
        </svg>`;
      const label = copyBtn.childNodes[copyBtn.childNodes.length - 1];
      label.textContent = ' Copied!';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;flex-shrink:0">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy`;
      }, 2000);
    });
  });

  // Tweet
  card.querySelector('.btn-tweet-card').addEventListener('click', () => {
    openTweetModal(entry.title, entry.link);
  });

  return card;
}

// ── Search / Filter ────────────────────────────────────
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) {
    renderNotes(allEntries);
    statCount.textContent = allEntries.length;
    return;
  }
  const filtered = allEntries.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.preview.toLowerCase().includes(q) ||
    (e.date || '').toLowerCase().includes(q)
  );
  renderNotes(filtered);
  statCount.textContent = filtered.length;
});

// ── Tweet Modal ────────────────────────────────────────
function openTweetModal(title, link) {
  const draft = buildDraft(title, link);
  tweetTextarea.value = draft;
  updateCharCount(draft);
  updateTweetLink(draft);
  tweetModal.style.display = 'flex';
  tweetTextarea.focus();
  document.body.style.overflow = 'hidden';
}

function closeTweetModal() {
  tweetModal.style.display = 'none';
  document.body.style.overflow = '';
}

function buildDraft(title, link) {
  const hashtags = '#BigQuery #GoogleCloud #GCP';
  const base = `📢 BigQuery Update: ${title}\n\n${link}\n\n${hashtags}`;
  if (base.length <= 280) return base;
  // Trim title to fit
  const overhead = `📢 BigQuery Update: \n\n${link}\n\n${hashtags}`.length;
  const maxTitle = 280 - overhead;
  return `📢 BigQuery Update: ${title.slice(0, maxTitle - 3)}…\n\n${link}\n\n${hashtags}`;
}

function updateCharCount(text) {
  const len = text.length;
  charNum.textContent = len;
  charCount.classList.toggle('over', len > 280);
}

function updateTweetLink(text) {
  const encoded = encodeURIComponent(text.slice(0, 280));
  tweetLink.href = `https://twitter.com/intent/tweet?text=${encoded}`;
}

tweetTextarea.addEventListener('input', () => {
  updateCharCount(tweetTextarea.value);
  updateTweetLink(tweetTextarea.value);
});

modalCloseBtn.addEventListener('click', closeTweetModal);

tweetModal.addEventListener('click', (e) => {
  if (e.target === tweetModal) closeTweetModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tweetModal.style.display !== 'none') closeTweetModal();
});

// ── Refresh button ─────────────────────────────────────
refreshBtn.addEventListener('click', fetchNotes);

// ── Export CSV ─────────────────────────────────────────
function csvEscape(val) {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

function exportToCSV() {
  // Export whichever entries are currently visible (respects search filter)
  const visibleCards = notesGrid.querySelectorAll('.note-card');
  const visibleTitles = new Set(
    [...visibleCards].map(c => c.querySelector('.card-title a')?.textContent.trim())
  );
  const toExport = allEntries.filter(e => visibleTitles.has(e.title));

  if (!toExport.length) return;

  const header = ['Title', 'Date', 'Link', 'Preview'];
  const rows = toExport.map(e => [
    csvEscape(e.title),
    csvEscape(e.date),
    csvEscape(e.link),
    csvEscape(e.preview),
  ].join(','));

  const csv = [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href     = url;
  a.download = `bigquery-release-notes-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

exportBtn.addEventListener('click', exportToCSV);

// ── Helpers ────────────────────────────────────────────
function setLoading(on) {
  refreshBtn.disabled = on;
  refreshBtn.classList.toggle('spinning', on);
  refreshLabel.textContent = on ? 'Loading…' : 'Refresh';
}

function hideAll() {
  emptyState.style.display  = 'none';
  errorState.style.display  = 'none';
  notesGrid.innerHTML       = '';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Auto-load on page ready ────────────────────────────
document.addEventListener('DOMContentLoaded', fetchNotes);
