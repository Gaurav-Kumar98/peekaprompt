'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const EVENTS = ['state', 'cursor'];

contextBridge.exposeInMainWorld('peeky', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.send('data:save', data),
  copy: (text) => ipcRenderer.send('copy', text),
  toggle: () => ipcRenderer.send('toggle'),
  hide: () => ipcRenderer.send('hide'),
  tuck: () => ipcRenderer.send('tuck'),
  peek: (on) => ipcRenderer.send('peek', on),
  ignoreMouse: (on) => ipcRenderer.send('ignore-mouse', on),
  dragStart: () => ipcRenderer.send('drag:start'),
  dragMove: (dy) => ipcRenderer.send('drag:move', dy),
  dragEnd: () => ipcRenderer.send('drag:end'),
  pin: (on) => ipcRenderer.send('pin', on),
  getLogin: () => ipcRenderer.invoke('login:get'),
  setLogin: (on) => ipcRenderer.send('login:set', on),
  quit: () => ipcRenderer.send('quit'),
  on: (channel, fn) => {
    if (EVENTS.includes(channel)) ipcRenderer.on(channel, (_e, v) => fn(v));
  },
});
