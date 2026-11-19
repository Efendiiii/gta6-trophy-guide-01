// Leonida Trophy Guide — offline tracker. Data is local (data/trophies.json);
// no network requests are made at runtime. Progress lives in localStorage.
const KEY = 'gta6-trophy-guide-progress-v1';
const SETTINGS_KEY = 'gta6-trophy-guide-settings-v1';
const DEMO_EARNED = [2, 3, 4, 5, 8, 15, 16, 20, 21, 33, 35, 42, 46];

const params = new URLSearchParams(location.search);
const demo = params.get('demo') === '1';

const $ = (id) => document.getElementById(id);
const listEl = $('list');

let trophies = [];
let earned = new Set();
let settings = { spoiler: true, theme: 'light' };

try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  if (Array.isArray(saved)) earned = new Set(saved.filter((n) => typeof n === 'number'));
} catch { earned = new Set(); }
try {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
  if (typeof s.spoiler === 'boolean') settings.spoiler = s.spoiler;
  if (s.theme === 'dark' || s.theme === 'light') settings.theme = s.theme;
} catch { /* keep defaults */ }
if (demo) {
  earned = new Set(DEMO_EARNED);
  settings.spoiler = true;
}

const byId = (id) => trophies.find((t) => t.id === id);
const isSpoilerHidden = (t) => settings.spoiler && t.story_spoiler && !earned.has(t.id);

const STAGES = [
  { title: 'Stage 1 — Chapter 1: do the missable first', ids: [28, 2, 3],
    text: 'Before you leave Chapter 1, meditate at the spot at Jason\u2019s house — it is only available in Chapter 1 and there is no mission replay. Then finish the opening mission and the chapter. This one early detour protects the only missable trophy in the game.' },
  { title: 'Stage 2 — Story: Chapters 2–4 and the finale', ids: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    text: 'Play the story missions in order through Chapters 2, 3 and 4 to the final mission. Every trophy in this stage is unmissable and unlocks on the main path, including the gold for the final mission. Side content can wait.' },
  { title: 'Stage 3 — Side characters and strangers', ids: [22, 23, 24, 26, 27, 29, 25],
    text: 'Finish the final mission for each side character — Andy, Kenton, Billy, Randy and Tyrone — plus Bret\u2019s hunt, and complete 8 stranger mission strands. Start these during the story rather than leaving them all until the end: some stranger missions are only offered for a while.' },
  { title: 'Stage 4 — Activities: sample everything, then grind', ids: [16, 20, 21, 18, 19, 17, 15, 32],
    text: 'Try all 9 activity types once first (that alone is a trophy), then work through the long grinds: 250 stunts, 42 gold Shooting Range challenges, 14 drone-race wins, 20 different race wins and 50 challenges. These stack up fastest when you mix them into normal play.' },
  { title: 'Stage 5 — Collectibles and exploration', ids: [30, 31, 35, 42],
    text: 'Complete 3 card sets, WAiNK It at 100 locations, discover 100 vehicles and explore all 52 areas of Leonida. Do the WAiNK spots and the area sweep together — one long tour of the map covers both.' },
  { title: 'Stage 6 — Open-world action and robberies', ids: [36, 38, 51, 33, 34, 39, 40, 41, 43],
    text: 'Combat Focus takedowns, Rhino tanks, wanted-level escapes with your partner, shop and jewelry robberies, 5 bank vaults, an armored truck and one illegal operation per gang. Plan getaway routes before each robbery.' },
  { title: 'Stage 7 — Money and property', ids: [52, 53, 54, 55],
    text: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garage properties and register 10 vehicles in the Scooter Bros app. Robberies from Stage 6 feed the laundering total, so this stage mostly finishes itself.' },
  { title: 'Stage 8 — Unconfirmed trophies: check back', ids: [44, 45, 46, 47, 48, 49, 50, 37],
    text: 'These official descriptions are still vague and the launch guides list their triggers as not yet known. Each guide in this app says so plainly. Try the literal reading in the guide, but re-check the cited sources before grinding — the community will confirm the real triggers after launch.' },
  { title: 'Stage 9 — Cleanup: 100% and platinum', ids: [14, 1],
    text: 'With everything else done, mop up the in-game 100% checklist (about 60% of everything there is to do, per PowerPyx) for the gold, and the platinum unlocks automatically.' },
];
const ROADMAP_ORDER = STAGES.flatMap((s) => s.ids);

function save() {
  if (!demo) localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}
function saveSettings() {
  if (!demo) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  $('themeBtn').textContent = settings.theme === 'dark' ? 'Light theme' : 'Dark theme';
}

function gradeLabel(g) { return g[0].toUpperCase() + g.slice(1); }
function kindLabel(k) { return k[0].toUpperCase() + k.slice(1); }

function tagHtml(t) {
  const tags = [`<span class="tag ${t.grade}">${gradeLabel(t.grade)}</span>`,
    `<span class="tag">${kindLabel(t.kind)}</span>`];
  if (t.hidden) tags.push('<span class="tag hidden-t">Hidden on PSN</span>');
  if (t.missable) tags.push('<span class="tag missable">Missable</span>');
  if (t.unconfirmed) tags.push('<span class="tag unconfirmed">Unconfirmed</span>');
  if (t.psn_target) tags.push(`<span class="tag">PSN target: ${t.psn_target.toLocaleString('en-US')}</span>`);
  return tags.join('');
}

function sourceLinks(t) {
  return (t.sources || []).map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join(' · ');
}

function cardHtml(t) {
  const li = document.createElement('li');
  li.className = 'card' + (earned.has(t.id) ? ' earned' : '');
  const hidden = isSpoilerHidden(t);
  const title = hidden ? 'Hidden story trophy' : t.name;
  const desc = hidden ? 'Story spoiler — hidden until earned. Turn off “Hide story spoilers” to reveal it.' : t.description;
  li.innerHTML = `
    <div class="card-head">
      <input type="checkbox" ${earned.has(t.id) ? 'checked' : ''} aria-label="Earned: ${t.name.replace(/"/g, '')}">
      <div class="card-title">
        <h3><button type="button" class="open-detail">${title}</button></h3>
        <p class="desc ${hidden ? 'spoiler-hidden' : ''}">${desc}</p>
        <div class="tags">${tagHtml(t)}</div>
        ${hidden ? '' : `<p class="guide">${t.guide}<br><span class="src">Sources: ${sourceLinks(t)}</span></p>`}
      </div>
    </div>`;
  li.querySelector('input').addEventListener('change', (e) => {
    if (e.target.checked) earned.add(t.id); else earned.delete(t.id);
    save(); render();
  });
  li.querySelector('.open-detail').addEventListener('click', () => openDetail(t.id));
  return li;
}

function renderList() {
  const q = $('q').value.trim().toLowerCase();
  const grade = $('grade').value;
  const kind = $('kind').value;
  const eo = $('earnedOnly').checked;
  const mo = $('missableOnly').checked;
  const shown = trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (eo && !earned.has(t.id)) return false;
    if (mo && !t.missable) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
  listEl.replaceChildren(...shown.map(cardHtml));
  $('shownCount').textContent = `Showing ${shown.length} of 55 trophies`;
}

function renderProgress() {
  const n = earned.size;
  $('earnedCount').textContent = n;
  $('barFill').style.width = `${(n / 55) * 100}%`;
  $('barWrap').setAttribute('aria-valuenow', String(n));
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  $('gradeBars').innerHTML = grades.map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return `<div class="gb"><span>${gradeLabel(g)}</span><b>${got} / ${total}</b></div>`;
  }).join('') + `<div class="gb"><span>Hidden earned</span><b>${trophies.filter((t) => t.hidden && earned.has(t.id)).length} / ${trophies.filter((t) => t.hidden).length}</b></div>`
    + `<div class="gb"><span>Story earned</span><b>${trophies.filter((t) => t.kind === 'story' && earned.has(t.id)).length} / ${trophies.filter((t) => t.kind === 'story').length}</b></div>`;
  const next = ROADMAP_ORDER.find((id) => id !== 1 && !earned.has(id));
  const nt = next ? byId(next) : null;
  $('nextUp').innerHTML = nt
    ? `<b>Next up:</b> ${nt.name} — ${nt.description} <button type="button" id="nextBtn">Open guide</button>`
    : (n >= 55 ? '<b>Platinum complete!</b> All 55 trophies earned.' : '');
  const nb = $('nextBtn');
  if (nb) nb.addEventListener('click', () => openDetail(nt.id));
}

function renderRoadmap() {
  $('stages').innerHTML = STAGES.map((s) => `<li><h3>${s.title}</h3><p>${s.text}</p>
    <p class="ids">${s.ids.map((id) => { const t = byId(id); return `${earned.has(id) ? '✓' : '○'} ${t ? t.name : id}`; }).join(' · ')}</p></li>`).join('');
  $('roadmapOrder').innerHTML = ROADMAP_ORDER.map((id) => {
    const t = byId(id);
    return `<li>${earned.has(id) ? '✓ ' : ''}${t ? t.name : id}${t && t.missable ? ' — missable!' : ''}${t && t.unconfirmed ? ' — unconfirmed' : ''}</li>`;
  }).join('');
}

function renderMissables() {
  const miss = trophies.filter((t) => t.missable);
  const host = $('missableList');
  host.replaceChildren();
  miss.forEach((t) => {
    const card = cardHtml(t);
    // cardHtml returns an <li>; re-wrap its content in a <div> so no list
    // bullet renders when it sits outside the checklist <ul>.
    const box = document.createElement('div');
    box.className = card.className;
    box.append(...card.childNodes); // move nodes (keeps the checkbox listener)
    const warn = document.createElement('p');
    warn.className = 'note';
    warn.innerHTML = `<b>When it can be missed:</b> ${t.missable_reason || 'See the guide.'}`;
    const wrap = document.createElement('div');
    wrap.append(box, warn);
    host.append(wrap);
  });
  const watch = trophies.filter((t) => [22, 23, 24, 26, 27, 29, 25].includes(t.id));
  $('watchList').replaceChildren(...watch.map(cardHtml));
}

function render() {
  renderProgress();
  renderList();
  renderRoadmap();
  renderMissables();
}

function openDetail(id) {
  const t = byId(id);
  if (!t) return;
  const hidden = isSpoilerHidden(t);
  $('detailBody').innerHTML = `
    <div class="tags">${tagHtml(t)}</div>
    <h2>${hidden ? 'Hidden story trophy' : t.name}</h2>
    <p class="desc">${hidden ? 'Story spoiler — hidden until earned.' : t.description}</p>
    <div class="facts">
      <div><b>Grade:</b> ${gradeLabel(t.grade)}</div>
      <div><b>Kind:</b> ${kindLabel(t.kind)}</div>
      <div><b>Hidden on PSN:</b> ${t.hidden ? 'Yes' : 'No'}</div>
      <div><b>Story spoiler:</b> ${t.story_spoiler ? 'Yes' : 'No'}</div>
      <div><b>Missable:</b> ${t.missable ? 'Yes — ' + (t.missable_reason || '') : 'No'}</div>
      ${t.psn_target ? `<div><b>PSN target:</b> ${t.psn_target.toLocaleString('en-US')}</div>` : ''}
      ${t.unconfirmed ? '<div><b>Unconfirmed:</b> the official description is still vague — see the guide.</div>' : ''}
      <div><b>Status:</b> ${earned.has(t.id) ? 'Earned ✓' : 'Not earned yet'}</div>
    </div>
    ${hidden ? '' : `<p class="guide">${t.guide}</p><p class="guide"><span class="src">Sources: ${sourceLinks(t)}</span></p>`}
    <p><button type="button" id="detailToggle">${earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned'}</button></p>`;
  $('detail').hidden = false;
  $('detailToggle').addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    save(); render(); openDetail(id);
  });
}

function showView(name) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== `view-${name}`; });
}

async function init() {
  const doc = await (await fetch('data/trophies.json')).json();
  trophies = doc.trophies;
  $('spoiler').checked = settings.spoiler;
  applyTheme();
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  $('q').addEventListener('input', renderList);
  $('grade').addEventListener('change', renderList);
  $('kind').addEventListener('change', renderList);
  $('earnedOnly').addEventListener('change', renderList);
  $('missableOnly').addEventListener('change', renderList);
  $('spoiler').addEventListener('change', (e) => { settings.spoiler = e.target.checked; saveSettings(); render(); });
  $('themeBtn').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings(); applyTheme();
  });
  $('exportBtn').addEventListener('click', () => {
    const data = { game: 'Grand Theft Auto VI', exported: 'gta6-trophy-guide', earned: [...earned].sort((a, b) => a - b) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      earned = new Set(ids.filter((n) => Number.isInteger(n) && byId(n)));
      save(); render();
    } catch { alert('Could not import that file — it is not a progress export from this guide.'); }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all progress? This clears every tick.')) { earned = new Set(); save(); render(); }
  });
  $('detailClose').addEventListener('click', () => { $('detail').hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('detail').hidden = true; });

  const view = params.get('view');
  if (view === 'roadmap' || view === 'missables') showView(view);
  const detailId = Number(params.get('detail'));
  render();
  if (detailId && byId(detailId)) openDetail(detailId);
}

init();
