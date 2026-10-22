// Narrow, context-isolated bridge. Empty in week 1; the Steam bridge
// (achievements, cloud saves) is exposed here in week 2.
'use strict';
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('outpostDesktop', { platform: 'electron', version: 1 });
