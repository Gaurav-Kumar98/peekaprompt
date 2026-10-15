'use strict';
const api = window.peeky;
const $ = (s) => document.querySelector(s);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const MASCOT = `<svg class="peeky" viewBox="0 0 40 46" aria-hidden="true">
  <path class="pk-body" d="M20 2C9.5 2 3 9.8 3 20.5V43l5.6-4 5.6 4 5.8-4 5.8 4 5.6-4 5.6 4V20.5C37 9.8 30.5 2 20 2z"/>
  <g class="pk-look"><g class="pk-blink">
    <ellipse class="pk-eye" cx="14" cy="19" rx="3.6" ry="4.6"/>
    <ellipse class="pk-eye" cx="26" cy="19" rx="3.6" ry="4.6"/>
    <circle class="pk-shine" cx="15.2" cy="17.4" r="1.3"/>
    <circle class="pk-shine" cx="27.2" cy="17.4" r="1.3"/>
  </g></g>
  <ellipse class="pk-blush" cx="9.5" cy="26" rx="2.8" ry="1.5"/>
  <ellipse class="pk-blush" cx="30.5" cy="26" rx="2.8" ry="1.5"/>
  <path class="pk-smile" d="M16.5 26.5q3.5 3.2 7 0"/>
  <ellipse class="pk-open" cx="20" cy="27.6" rx="3" ry="2.6"/>
</svg>`;

const COLORS = ['#ffd93d', '#5ee0a0', '#ff8a3d', '#ff5c8a', '#7cc7ff', '#c49bff', '#b8e86b', '#ff9ecb'];
// Category colours from the old purple theme, mapped onto the Lemon Soda palette.
const RECOLOR = { '#ff6fb5': '#ff5c8a', '#5ef2c2': '#5ee0a0', '#ffd166': '#ffd93d', '#6fb7ff': '#7cc7ff',
  '#b48cff': '#c49bff', '#ff9f6e': '#ff8a3d', '#9be15d': '#b8e86b', '#ff6b6b': '#ff9ecb' };
const NO_CAT_COLOR = '#e9e1c8';
const EMOJIS = ['✍️', '💻', '💡', '🧠', '🎨', '📈', '🧪', '📚', '🎯', '🤖', '📝', '🔥', '🌈', '🍕', '🎵', '🚀', '💼', '🎮'];
const CONFETTI = ['#ffd93d', '#5ee0a0', '#ff8a3d', '#ff5c8a', '#7cc7ff', '#ffffff'];

const ICONS = {
  star: '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};

const QUIPS = [
  'Psst… your prompts missed you.',
  'A saved prompt is a happy prompt. 🌱',
  'Tip: press Enter in search to copy the top match.',
  'Tip: Ctrl+Alt+P summons me from anywhere.',
  'Tip: drag my tab up or down to move me.',
  'Tip: right-click a category to edit it.',
  'I keep secrets. Mostly prompts. 🤫',
  'Feed me prompts. I grow stronger. 👻',
  'Out of ideas? Roll the 🎲.',
  'Come back tomorrow to keep your 🔥 alive!',
  'Being lazy-efficient is a skill. You have it.',
  'Boo! …did I scare you? No? Rude.',
];
const COPY_TOASTS = ['Fizz! Copied to clipboard', 'Yoinked to clipboard! ✨', 'Copied! Go make magic 🪄', 'On your clipboard, boss 📋', 'Ctrl+V when ready 🚀', 'Prompt served hot 🍕', 'Zoop! Copied 💨'];
const SAVE_TOASTS = ['Saved! Peeky is pleased 👻', 'Into the stash it goes 📦', 'Prompt secured 🔒', 'Nom nom, saved 😋'];
const LEVELS = ['Prompt Pebble', 'Prompt Sprout', 'Prompt Tinkerer', 'Prompt Wrangler', 'Prompt Alchemist',
  'Prompt Wizard', 'Prompt Sorcerer', 'Prompt Archmage', 'Prompt Legend', 'Prompt Deity'];

const BADGES = [
  { id: 'first', emoji: '🐣', name: 'Hatchling', desc: 'Save your first prompt', test: (s) => s.saves >= 1 },
  { id: 'yoink', emoji: '📋', name: 'Yoink!', desc: 'Copy a prompt', test: (s) => s.copies >= 1 },
  { id: 'lucky', emoji: '🎲', name: 'Feeling Lucky', desc: 'Roll the dice', test: (s) => s.surprises >= 1 },
  { id: 'star', emoji: '⭐', name: 'Star Struck', desc: 'Favourite a prompt', test: (s, d) => d.prompts.some((p) => p.fav) },
  { id: 'librarian', emoji: '📚', name: 'Librarian', desc: 'Stash 10 prompts', test: (s, d) => d.prompts.length >= 10 },
  { id: 'neat', emoji: '🗂️', name: 'Neat Freak', desc: 'Have 5 categories', test: (s, d) => d.categories.length >= 5 },
  { id: 'copycat', emoji: '🐱', name: 'Copy Cat', desc: 'Copy 25 times', test: (s) => s.copies >= 25 },
  { id: 'fire', emoji: '🔥', name: 'On Fire', desc: '3-day streak', test: (s) => s.streak >= 3 },
  { id: 'owl', emoji: '🦉', name: 'Night Owl', desc: 'Use me after midnight', test: (s) => s.nightOwl },
  { id: 'comet', emoji: '☄️', name: 'Unstoppable', desc: '7-day streak', test: (s) => s.streak >= 7 },
  { id: 'machine', emoji: '🚀', name: 'Prompt Machine', desc: 'Copy 100 times', test: (s) => s.copies >= 100 },
  { id: 'dragon', emoji: '🐉', name: 'Hoarder', desc: 'Stash 50 prompts', test: (s, d) => d.prompts.length >= 50 },
];

let D;
const ui = { q: '', cat: 'all', editing: null, open: false, pinned: false };

// ---------- helpers ----------

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v; // static icon markup only
    else if (k === 'style') n.style.cssText = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) n.append(c);
  return n;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
const catById = (id) => D.categories.find((c) => c.id === id);

let saveTimer;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => api.save(D), 250);
}

// Write any pending change right away (used before quitting/closing).
function flushSave() {
  if (!D) return;
  clearTimeout(saveTimer);
  api.save(D);
}
window.addEventListener('beforeunload', flushSave);

function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
}

// Two-click confirm: first click arms the button, second one runs fn.
function armConfirm(btn, label, fn) {
  if (btn.dataset.armed) return fn();
  const old = btn.textContent;
  btn.dataset.armed = '1';
  btn.textContent = label;
  btn.classList.add('armed');
  setTimeout(() => {
    delete btn.dataset.armed;
    btn.textContent = old;
    btn.classList.remove('armed');
  }, 2500);
}

// ---------- fun stuff ----------

const toastQueue = [];
let toastBusy = false;
function toast(msg, ms = 1800) {
  toastQueue.push([msg, ms]);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const next = toastQueue.shift();
  if (!next) { toastBusy = false; return; }
  toastBusy = true;
  const n = $('#toast');
  n.textContent = next[0];
  n.classList.add('show');
  setTimeout(() => { n.classList.remove('show'); setTimeout(nextToast, 220); }, next[1]);
}

function confetti(x, y, count = 30) {
  const fx = $('#fx');
  for (let i = 0; i < count; i++) {
    const c = el('i', { class: 'confetto', style: `left:${x}px;top:${y}px;background:${pick(CONFETTI)}` });
    if (Math.random() < 0.3) c.style.borderRadius = '50%';
    fx.append(c);
    const a = Math.random() * Math.PI * 2;
    const v = 50 + Math.random() * 110;
    const dx = Math.cos(a) * v;
    const dy = Math.sin(a) * v - 60;
    const rot = Math.random() * 720 - 360;
    c.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + 150}px)) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => c.remove();
  }
}

let moodTimer;
function mood(name, ms = 1200) {
  const all = document.querySelectorAll('.peeky');
  all.forEach((p) => p.classList.remove('happy', 'sad'));
  void document.body.offsetWidth;
  all.forEach((p) => p.classList.add(name));
  clearTimeout(moodTimer);
  moodTimer = setTimeout(() => all.forEach((p) => p.classList.remove(name)), ms);
}

function blinkLoop() {
  setTimeout(() => {
    const all = document.querySelectorAll('.peeky');
    all.forEach((p) => p.classList.add('blink'));
    setTimeout(() => all.forEach((p) => p.classList.remove('blink')), 140);
    blinkLoop();
  }, 2200 + Math.random() * 3800);
}

function setQuip(text) {
  const q = $('#quip');
  q.style.opacity = 0;
  setTimeout(() => { q.textContent = text || pick(QUIPS); q.style.opacity = 1; }, 200);
}

// ---------- XP, levels, streaks, badges ----------

function levelInfo(xp) {
  let lvl = 1, base = 0, need = 50;
  while (xp >= base + need) { base += need; lvl++; need = Math.round(need * 1.35); }
  return { lvl, name: LEVELS[Math.min(lvl - 1, LEVELS.length - 1)], pct: (xp - base) / need, toNext: base + need - xp };
}

function currentStreak() {
  const s = D.stats;
  return s.lastDay === dayKey() || s.lastDay === yesterdayKey() ? s.streak : 0;
}

function gainXP(n) {
  const before = levelInfo(D.stats.xp).lvl;
  D.stats.xp += n;
  const after = levelInfo(D.stats.xp);
  if (after.lvl > before) {
    setTimeout(() => {
      toast(`LEVEL UP! You're now a ${after.name} 🎉`, 3200);
      confetti(window.innerWidth / 2 + 23, 70, 90);
      mood('happy', 2000);
    }, 500);
  }
  renderStats();
}

// Called on any "real" use; handles the daily bonus and streak.
function activity() {
  const s = D.stats;
  if (new Date().getHours() < 4) s.nightOwl = true;
  const today = dayKey();
  if (s.lastDay === today) return;
  s.streak = s.lastDay === yesterdayKey() ? s.streak + 1 : 1;
  s.lastDay = today;
  gainXP(15);
  toast(s.streak > 1 ? `🔥 ${s.streak}-day streak! +15 XP` : '☀️ Daily bonus! +15 XP');
}

function checkBadges() {
  for (const b of BADGES) {
    if (!D.stats.badges.includes(b.id) && b.test(D.stats, D)) {
      D.stats.badges.push(b.id);
      toast(`🏆 Badge unlocked: ${b.emoji} ${b.name}`, 2600);
      gainXP(20);
    }
  }
  renderStats();
}

// ---------- actions ----------

function copyPrompt(p, card) {
  api.copy(p.text);
  p.uses = (p.uses || 0) + 1;
  p.lastUsed = Date.now();
  D.stats.copies++;
  activity();
  gainXP(5);
  checkBadges();
  persist();

  if (card) {
    const r = card.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 34);
    card.classList.remove('copied');
    void card.offsetWidth;
    card.classList.add('copied');
    const uses = card.querySelector('.uses');
    if (uses) uses.textContent = `used ${p.uses}×`;
  }
  mood('happy');
  toast(pick(COPY_TOASTS));
  if (D.settings.autoTuck && !ui.pinned) setTimeout(() => api.tuck(), 700);
}

function surprise() {
  const pool = visiblePrompts().length ? visiblePrompts() : D.prompts;
  if (!pool.length) { shake($('#diceBtn')); setQuip('Nothing to roll yet — save a prompt first!'); return; }
  const p = pick(pool);
  D.stats.surprises++;
  gainXP(2);
  checkBadges();
  persist();
  const card = document.querySelector(`.card[data-id="${p.id}"]`);
  if (!card) { ui.cat = 'all'; ui.q = ''; $('#search').value = ''; render(); return surprise(); }
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('spotlight');
  void card.offsetWidth;
  card.classList.add('spotlight');
  setQuip(`The dice have spoken: “${p.title || p.text.slice(0, 40)}” 🎲`);
}

function toggleFav(p) {
  p.fav = !p.fav;
  if (p.fav) { gainXP(1); mood('happy', 800); }
  checkBadges();
  persist();
  render();
}

function deletePrompt(p) {
  D.prompts = D.prompts.filter((x) => x.id !== p.id);
  persist();
  mood('sad', 1500);
  setQuip(pick(['Gone, but not forgotten. Well… forgotten. 🥲', 'Poof! 💨', 'Byeee little prompt 👋']));
  render();
}

// ---------- composer ----------

function fillCategorySelect(selected) {
  const s = $('#fCat');
  s.replaceChildren(el('option', { value: '', text: '📦 No category' }));
  for (const c of D.categories) s.append(el('option', { value: c.id, text: `${c.emoji} ${c.name}` }));
  s.value = selected || '';
}

function openComposer(p) {
  ui.editing = p ? p.id : null;
  $('#fTitle').value = p ? p.title : '';
  $('#fText').value = p ? p.text : '';
  fillCategorySelect(p ? p.category : (catById(ui.cat) ? ui.cat : ''));
  $('#saveBtn').textContent = p ? 'Update' : 'Save';
  $('#newBtn').hidden = true;
  $('#composer').hidden = false;
  $('#fText').focus();
}

function closeComposer() {
  ui.editing = null;
  $('#composer').hidden = true;
  $('#newBtn').hidden = false;
}

function submitComposer() {
  const text = $('#fText').value.trim();
  if (!text) { shake($('#fText')); return; }
  const title = $('#fTitle').value.trim();
  const category = $('#fCat').value;
  const now = Date.now();
  if (ui.editing) {
    Object.assign(D.prompts.find((p) => p.id === ui.editing), { title, text, category, updated: now });
    toast('Updated ✏️');
  } else {
    D.prompts.push({ id: uid(), title, text, category, fav: false, uses: 0, created: now, updated: now });
    D.stats.saves++;
    activity();
    gainXP(10);
    const r = $('#saveBtn').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top, 24);
    toast(pick(SAVE_TOASTS));
    mood('happy');
  }
  checkBadges();
  persist();
  closeComposer();
  render();
}

// ---------- dialogs ----------

function showDialog(...nodes) {
  $('#dialog').replaceChildren(...nodes);
  $('#overlay').hidden = false;
}
function closeDialog() { $('#overlay').hidden = true; }

function categoryDialog(cat) {
  let emoji = cat ? cat.emoji : pick(EMOJIS);
  let color = cat ? cat.color : COLORS[D.categories.length % COLORS.length];
  const name = el('input', { type: 'text', placeholder: 'e.g. Marketing', maxlength: '24' });
  name.value = cat ? cat.name : '';

  const emojiRow = el('div', { class: 'swatches' });
  for (const e of EMOJIS) {
    emojiRow.append(el('button', {
      type: 'button', class: 'sw' + (e === emoji ? ' on' : ''), text: e,
      onclick: (ev) => { emoji = e; emojiRow.querySelectorAll('.sw').forEach((b) => b.classList.toggle('on', b === ev.currentTarget)); },
    }));
  }
  const colorRow = el('div', { class: 'swatches' });
  for (const c of COLORS) {
    colorRow.append(el('button', {
      type: 'button', class: 'sw color' + (c === color ? ' on' : ''), style: `background:${c}`,
      onclick: (ev) => { color = c; colorRow.querySelectorAll('.sw').forEach((b) => b.classList.toggle('on', b === ev.currentTarget)); },
    }));
  }

  const save = () => {
    const n = name.value.trim();
    if (!n) { shake(name); return; }
    if (cat) Object.assign(cat, { name: n, emoji, color });
    else { D.categories.push({ id: uid(), name: n, emoji, color }); gainXP(5); toast(`New category: ${emoji} ${n}`); }
    checkBadges();
    persist();
    closeDialog();
    render();
  };
  name.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });

  const del = cat ? el('button', {
    class: 'btn ghost', text: 'Delete',
    onclick: (ev) => armConfirm(ev.currentTarget, 'Really? 😱', () => {
      D.categories = D.categories.filter((c) => c.id !== cat.id);
      D.prompts.forEach((p) => { if (p.category === cat.id) p.category = ''; });
      if (ui.cat === cat.id) ui.cat = 'all';
      persist();
      closeDialog();
      render();
    }),
  }) : null;

  showDialog(
    el('h2', { text: cat ? 'Edit category' : 'New category' }),
    name,
    el('label', { class: 'field', text: 'Emoji' }), emojiRow,
    el('label', { class: 'field', text: 'Colour' }), colorRow,
    el('div', { class: 'row end' }, del, el('span', { class: 'grow' }),
      el('button', { class: 'btn ghost', text: 'Cancel', onclick: closeDialog }),
      el('button', { class: 'btn primary', text: cat ? 'Save' : 'Create', onclick: save })),
  );
  name.focus();
}

function trophyDialog() {
  const s = D.stats;
  const L = levelInfo(s.xp);
  const stat = (emoji, n, label) => el('div', { class: 'stat' }, el('b', { text: `${emoji} ${n}` }), el('span', { text: label }));
  const grid = el('div', { class: 'badges' });
  for (const b of BADGES) {
    const got = s.badges.includes(b.id);
    grid.append(el('div', { class: 'badge' + (got ? ' got' : ''), title: b.desc },
      el('div', { class: 'b-emoji', text: got ? b.emoji : '🔒' }),
      el('div', { class: 'b-name', text: b.name }),
      el('div', { class: 'b-desc', text: b.desc })));
  }
  showDialog(
    el('h2', { text: `Lv ${L.lvl} · ${L.name}` }),
    el('div', { class: 'muted small', text: `${s.xp} XP total · ${L.toNext} XP to the next level` }),
    el('div', { class: 'statgrid' }, stat('📋', s.copies, 'copies'), stat('💾', s.saves, 'saved'), stat('🔥', currentStreak(), 'day streak')),
    grid,
    el('div', { class: 'row end' }, el('button', { class: 'btn primary', text: 'Nice!', onclick: closeDialog })),
  );
}

async function settingsDialog() {
  const toggle = (label, value, onchange) => {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = value;
    cb.addEventListener('change', () => onchange(cb.checked));
    return el('label', { class: 'toggle' }, cb, el('span', { class: 'knob' }), el('span', { text: label }));
  };
  const login = await api.getLogin();
  showDialog(
    el('h2', { text: 'Settings' }),
    toggle('Start with Windows', login, (v) => api.setLogin(v)),
    toggle('Tuck away after copying', D.settings.autoTuck, (v) => { D.settings.autoTuck = v; persist(); }),
    el('p', { class: 'muted small', text: 'Ctrl+Alt+P summons me from anywhere. Drag my tab to move me up or down.' }),
    el('div', { class: 'row end' },
      el('button', { class: 'btn danger', text: 'Quit', onclick: () => { flushSave(); api.quit(); } }),
      el('span', { class: 'grow' }),
      el('button', { class: 'btn primary', text: 'Done', onclick: closeDialog })),
  );
}

// ---------- rendering ----------

function visiblePrompts() {
  const q = ui.q.toLowerCase();
  return D.prompts
    .filter((p) => ui.cat === 'all' || (ui.cat === 'fav' ? p.fav : p.category === ui.cat))
    .filter((p) => !q || `${p.title} ${p.text}`.toLowerCase().includes(q))
    .sort((a, b) => (b.fav - a.fav) || (Math.max(b.updated, b.lastUsed || 0) - Math.max(a.updated, a.lastUsed || 0)));
}

function renderStats() {
  const L = levelInfo(D.stats.xp);
  $('#lvlName').innerHTML = '';
  $('#lvlName').append(el('b', { text: `Lv ${L.lvl}` }), ` · ${L.name}`);
  $('#xpFill').style.width = `${Math.round(L.pct * 100)}%`;
  $('#streakNum').textContent = currentStreak();
  $('#streakPill').classList.toggle('cold', D.stats.lastDay !== dayKey());
  $('#trophyNum').textContent = `${D.stats.badges.length}/${BADGES.length}`;
}

function renderChips() {
  const nav = $('#chips');
  const scroll = nav.scrollLeft;
  nav.replaceChildren();
  const chip = (id, label, color, count) => el('button', {
    class: 'chip' + (ui.cat === id ? ' active' : ''), style: `--c:${color}`,
    onclick: () => { ui.cat = id; render(); },
  }, label, el('span', { class: 'count', text: count }));

  nav.append(
    chip('all', 'All', '#ffd93d', D.prompts.length),
    chip('fav', '⭐ Favs', '#ffd93d', D.prompts.filter((p) => p.fav).length),
  );
  for (const c of D.categories) {
    const b = chip(c.id, `${c.emoji} ${c.name}`, c.color, D.prompts.filter((p) => p.category === c.id).length);
    b.title = 'Right-click to edit';
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); categoryDialog(c); });
    nav.append(b);
  }
  nav.append(el('button', { class: 'chip add', title: 'New category', 'aria-label': 'New category', html: ICONS.plus, onclick: () => categoryDialog() }));
  nav.scrollLeft = scroll;
}

function renderList() {
  const list = $('#list');
  list.replaceChildren();
  const items = visiblePrompts();

  if (!items.length) {
    const empty = el('div', { class: 'empty' });
    empty.innerHTML = MASCOT;
    if (!D.prompts.length) empty.append(el('b', { text: 'Peeky is hungry!' }), 'Feed it your first prompt with the ＋ button.');
    else if (ui.q) empty.append(el('b', { text: 'No matches 🕵️' }), 'Peeky searched under every rug.');
    else empty.append(el('b', { text: 'Nothing here yet' }), 'Add a prompt to this category.');
    list.append(empty);
    return;
  }

  for (const p of items) {
    const cat = catById(p.category);
    const color = cat ? cat.color : NO_CAT_COLOR;
    const tools = el('div', { class: 'tools' },
      el('button', { class: p.fav ? 'fav' : null, title: 'Favourite', 'aria-label': 'Favourite', html: ICONS.star,
        onclick: (e) => { e.stopPropagation(); toggleFav(p); } }),
      el('button', { title: 'Edit', 'aria-label': 'Edit', html: ICONS.edit, onclick: (e) => { e.stopPropagation(); openComposer(p); } }),
      el('button', { title: 'Delete', 'aria-label': 'Delete', html: ICONS.trash,
        onclick: (e) => { e.stopPropagation(); armConfirm(e.currentTarget, 'sure?', () => deletePrompt(p)); } }),
    );
    const card = el('div', { class: 'card', 'data-id': p.id, style: `--c:${color}`, title: 'Click to copy' },
      tools,
      p.title ? el('h3', { text: p.title }) : null,
      el('p', { text: p.text.trim() }),
      el('div', { class: 'meta' },
        el('span', { class: 'tag', text: cat ? `${cat.emoji} ${cat.name}` : '📦 Misc' }),
        el('span', { class: 'uses', text: `used ${p.uses || 0}×` }),
        el('span', { class: 'hint', text: 'click to copy' })),
    );
    if (!p.title) card.querySelector('p').style.color = 'var(--text)';
    card.addEventListener('click', () => copyPrompt(p, card));
    list.append(card);
  }
}

function render() {
  renderStats();
  renderChips();
  renderList();
}

// ---------- window behaviour (click-through, peeking, dragging) ----------

let interactive = false;
let overTab = false;
let drag = null;

document.addEventListener('mousemove', (e) => {
  if (drag) {
    const dy = e.screenY - drag.startY;
    if (!drag.moved && Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) api.dragMove(dy);
    return;
  }
  const hit = !!e.target.closest?.('.hit');
  if (hit !== interactive) { interactive = hit; api.ignoreMouse(!hit); }
  setOverTab(!!e.target.closest?.('#tab'));
});

const HELLOS = ['Boo!', 'Hi!', 'Psst!', 'Yo!', 'Hey!', 'Oh hi!'];

function setOverTab(over) {
  if (over === overTab || drag) return;
  overTab = over;
  $('#tab').classList.toggle('hover', over);
  if (over && !ui.open) $('#tabBubble').textContent = pick(HELLOS);
  $('#tabBubble').classList.toggle('show', over && !ui.open);
  if (!ui.open) api.peek(over);
}

$('#tab').addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  drag = { startY: e.screenY, moved: false };
  api.dragStart();
});
document.addEventListener('mouseup', () => {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (d.moved) api.dragEnd();
  else api.toggle();
});

api.on('cursor', ({ x, y, wx, wy }) => {
  // eyes follow the cursor
  document.querySelectorAll('.peeky').forEach((svg) => {
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const dx = x - (wx + r.left + r.width / 2);
    const dy = y - (wy + r.top + r.height * 0.42);
    const dist = Math.hypot(dx, dy) || 1;
    const m = Math.min(1, dist / 120) * 2.4;
    svg.querySelector('.pk-look').setAttribute('transform', `translate(${(dx / dist * m).toFixed(2)} ${(dy / dist * m).toFixed(2)})`);
  });
  // mousemove handles hovering; this only catches the cursor leaving the window entirely
  const inWindow = x >= wx && x < wx + window.innerWidth && y >= wy && y < wy + window.innerHeight;
  if (!inWindow) setOverTab(false);
});

api.on('state', (s) => {
  const wasOpen = ui.open;
  ui.open = s === 'open';
  document.body.classList.toggle('is-open', ui.open);
  if (!ui.open && wasOpen && overTab) api.peek(true); // closed with the mouse still on Peeky
  if (ui.open && !wasOpen) {
    setQuip();
    renderStats();
    setTimeout(() => { if ($('#composer').hidden && $('#overlay').hidden) $('#search').focus(); }, 120);
  }
});

// ---------- wiring ----------

$('#search').addEventListener('input', (e) => { ui.q = e.target.value; renderList(); });
$('#search').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const first = visiblePrompts()[0];
  if (first) copyPrompt(first, document.querySelector(`.card[data-id="${first.id}"]`));
  else shake($('#search'));
});
$('#chips').addEventListener('wheel', (e) => { e.currentTarget.scrollLeft += e.deltaY; e.preventDefault(); }, { passive: false });
$('#newBtn').addEventListener('click', () => openComposer());
$('#cancelBtn').addEventListener('click', closeComposer);
$('#composer').addEventListener('submit', (e) => { e.preventDefault(); submitComposer(); });
$('#fText').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.ctrlKey) submitComposer(); });
$('#diceBtn').addEventListener('click', surprise);
$('#closeBtn').addEventListener('click', () => api.hide());
$('#menuBtn').addEventListener('click', settingsDialog);
$('#levelBtn').addEventListener('click', trophyDialog);
$('#trophyPill').addEventListener('click', trophyDialog);
$('#streakPill').addEventListener('click', () => {
  const s = currentStreak();
  setQuip(D.stats.lastDay === dayKey()
    ? `🔥 ${s} day${s === 1 ? '' : 's'} strong! See you tomorrow.`
    : 'Copy or save a prompt today to keep your streak alive! 🔥');
});
$('#pinBtn').addEventListener('click', () => {
  ui.pinned = !ui.pinned;
  $('#pinBtn').classList.toggle('on', ui.pinned);
  api.pin(ui.pinned);
  toast(ui.pinned ? '📌 Pinned — I\'ll stay open' : 'Unpinned — I\'ll tuck away when you click off');
});
$('#overlay').addEventListener('mousedown', (e) => { if (e.target.id === 'overlay') closeDialog(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#overlay').hidden) closeDialog();
    else if (!$('#composer').hidden) closeComposer();
    else api.hide();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    openComposer();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    $('#search').focus();
    $('#search').select();
  }
});

// ---------- boot ----------

(async () => {
  $('#tab').innerHTML = MASCOT;
  document.querySelectorAll('.mascot-slot').forEach((s) => { s.innerHTML = MASCOT; });
  D = await api.load();
  D.categories.forEach((c) => { c.color = RECOLOR[c.color] || c.color; });
  render();
  setQuip();
  blinkLoop();
  setInterval(() => { if (ui.open) setQuip(); }, 30000);
})();
