'use strict';
const { app, BrowserWindow, ipcMain, screen, clipboard, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const TAB_W = 58;            // the little handle that sticks out of the screen edge
const PANEL_W = 380;
const WIN_W = TAB_W + PANEL_W;
const MAX_H = 640;
const PEEK = 40;             // how much of the handle shows while tucked away (most of Peeky)

if (!app.requestSingleInstanceLock()) app.quit();

let win;
let state = 'hidden';        // hidden | peek | open
let pinned = false;
let anim = null;
let dragBaseY = 0;
let dataFile, uiFile, uiPrefs;

// ---------- storage ----------

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJSON(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

function starterData() {
  const now = Date.now();
  return {
    categories: [
      { id: 'writing', name: 'Writing', emoji: '✍️', color: '#ff5c8a' },
      { id: 'code', name: 'Code', emoji: '💻', color: '#5ee0a0' },
      { id: 'learn', name: 'Learning', emoji: '🧠', color: '#ffd93d' },
    ],
    prompts: [
      {
        id: 'starter-1', title: 'Explain like I\'m five', category: 'learn',
        text: 'Explain [TOPIC] like I am five years old. Use one fun analogy and keep it under 100 words.',
        fav: false, uses: 0, created: now, updated: now,
      },
      {
        id: 'starter-2', title: 'Ruthless code review', category: 'code',
        text: 'Review the code below for bugs, readability and performance. List issues by severity, then show a cleaned-up version.\n\n',
        fav: false, uses: 0, created: now - 1, updated: now - 1,
      },
      {
        id: 'starter-3', title: 'Punch it up', category: 'writing',
        text: 'Rewrite this to be clearer, friendlier and about 30% shorter. Keep my voice.\n\n',
        fav: false, uses: 0, created: now - 2, updated: now - 2,
      },
    ],
    stats: { xp: 0, streak: 0, lastDay: null, copies: 0, saves: 0, surprises: 0, nightOwl: false, badges: [] },
    settings: { autoTuck: true },
  };
}

function loadData() {
  const saved = readJSON(dataFile, null);
  const fresh = starterData();
  if (!saved) return fresh;
  return {
    categories: saved.categories ?? fresh.categories,
    prompts: saved.prompts ?? [],
    stats: { ...fresh.stats, ...saved.stats },
    settings: { ...fresh.settings, ...saved.settings },
  };
}

// ---------- geometry ----------

// Dock to the right edge of the right-most display so the tucked-away
// panel never spills onto a neighbouring monitor.
function workArea() {
  const d = screen.getAllDisplays().reduce((a, b) =>
    b.bounds.x + b.bounds.width > a.bounds.x + a.bounds.width ? b : a);
  return d.workArea;
}

function winHeight() { return Math.min(MAX_H, workArea().height - 16); }

function xFor(s) {
  const a = workArea();
  const right = a.x + a.width;
  if (s === 'open') return right - WIN_W;
  if (s === 'peek') return right - TAB_W;
  return right - PEEK;
}

function clampY(y) {
  const a = workArea();
  return Math.round(Math.max(a.y + 8, Math.min(y, a.y + a.height - winHeight() - 8)));
}

function place(x, y) {
  win.setBounds({ x: Math.round(x), y, width: WIN_W, height: winHeight() });
}

function slideTo(next) {
  if (!win || win.isDestroyed()) return;
  state = next;
  win.webContents.send('state', next);
  const from = win.getBounds().x;
  const to = xFor(next);
  const dur = next === 'open' ? 260 : 180;
  const start = Date.now();
  clearInterval(anim);
  anim = setInterval(() => {
    const t = Math.min(1, (Date.now() - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    place(from + (to - from) * eased, win.getBounds().y);
    if (t === 1) clearInterval(anim);
  }, 10);
}

function open() { slideTo('open'); win.show(); win.focus(); }
function hide() { slideTo('hidden'); }
function toggle() { state === 'open' ? hide() : open(); }

// ---------- window ----------

function createWindow() {
  const a = workArea();
  win = new BrowserWindow({
    x: xFor('hidden'), y: clampY(uiPrefs.y ?? a.y + 120), width: WIN_W, height: winHeight(),
    frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
    resizable: false, maximizable: false, minimizable: false, fullscreenable: false,
    skipTaskbar: true, alwaysOnTop: true, show: false, title: 'PeekaPrompt',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  // Transparent areas let clicks fall through; the renderer flips this when
  // the mouse is over the tab or the panel.
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile('index.html');
  win.once('ready-to-show', () => win.showInactive());
  win.on('blur', () => { if (state === 'open' && !pinned) hide(); });
}

const loginOpts = () => (app.isPackaged ? {} : { path: process.execPath, args: [app.getAppPath()] });

ipcMain.handle('data:load', () => loadData());
ipcMain.on('data:save', (_e, d) => writeJSON(dataFile, d));
ipcMain.on('copy', (_e, text) => clipboard.writeText(String(text)));
ipcMain.on('toggle', toggle);
ipcMain.on('hide', hide);
ipcMain.on('tuck', () => { hide(); win.blur(); });
ipcMain.on('peek', (_e, on) => {
  const next = on ? 'peek' : 'hidden';
  if (state !== 'open' && state !== next) slideTo(next);
});
ipcMain.on('ignore-mouse', (_e, on) => win.setIgnoreMouseEvents(!!on, { forward: true }));
ipcMain.on('drag:start', () => { dragBaseY = win.getBounds().y; });
ipcMain.on('drag:move', (_e, dy) => place(win.getBounds().x, clampY(dragBaseY + dy)));
ipcMain.on('drag:end', () => { uiPrefs.y = win.getBounds().y; writeJSON(uiFile, uiPrefs); });
ipcMain.on('pin', (_e, on) => { pinned = !!on; });
ipcMain.handle('login:get', () => app.getLoginItemSettings(loginOpts()).openAtLogin);
ipcMain.on('login:set', (_e, on) => app.setLoginItemSettings({ ...loginOpts(), openAtLogin: !!on }));
ipcMain.on('quit', () => app.quit());

app.whenReady().then(() => {
  dataFile = path.join(app.getPath('userData'), 'prompts.json');
  uiFile = path.join(app.getPath('userData'), 'window.json');
  uiPrefs = readJSON(uiFile, {});
  createWindow();
  globalShortcut.register('Control+Alt+P', toggle);

  const reflow = () => { if (win) place(xFor(state), clampY(win.getBounds().y)); };
  screen.on('display-metrics-changed', reflow);
  screen.on('display-added', reflow);
  screen.on('display-removed', reflow);

  // Peeky's eyes follow your cursor around the whole screen.
  let last = '';
  setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    const b = win.getBounds();
    const key = `${p.x},${p.y},${b.x},${b.y}`;
    if (key === last) return;
    last = key;
    win.webContents.send('cursor', { x: p.x, y: p.y, wx: b.x, wy: b.y });
  }, 50);
});

app.on('second-instance', () => win && open());
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
