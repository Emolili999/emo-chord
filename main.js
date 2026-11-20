const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron');
const fs = require('fs');
const path = require('path');

// Windows görev çubuğu gruplaması ve bildirim uyumluluğu
if (process.platform === 'win32') {
  app.setAppUserModelId('com.emo.emochord.v2');
}

// Windows ve Linux'ta ses/MIDI gecikmesini azaltmak ve otomatik başlatmayı etkinleştirmek için bayraklar
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'WebMidi');

const ALLOWED_PERMISSIONS = new Set(['midi', 'midiSysex']);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

// Windows Portable (.exe) çalışırken geçici (%TEMP%) klasör yerine gerçek çalıştırma klasörünü veya Belgeler'i seç
function getSafeDefaultDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR && fs.existsSync(process.env.PORTABLE_EXECUTABLE_DIR)) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  try {
    return app.getPath('documents');
  } catch {
    return app.getPath('home');
  }
}

const DEFAULT_SETTINGS = {
  rangeId: '61',
  instrument: 'grand_piano',
  themeId: 'zephyr',
  baseOctave: 3,
  transpose: 0,
  volume: 0.85,
  reverb: 0.28,
  sustain: false,
  flowSpeed: 220,
  labelMode: 'both',
  useTurkishNotes: false,
  showParticles: true,
  showGridLines: true,
  vitalPresets: []
};

const ALLOWED_SETTING_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

function isPlainObject(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

function filterAllowedSettings(obj) {
  if (!isPlainObject(obj)) return {};
  const clean = {};
  for (const key of Object.keys(obj)) {
    if (ALLOWED_SETTING_KEYS.has(key)) {
      clean[key] = obj[key];
    }
  }
  return clean;
}

function loadSettings() {
  try {
    const p = settingsPath();
    if (!fs.existsSync(p)) return { ...DEFAULT_SETTINGS };
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...filterAllowedSettings(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(patch) {
  const safePatch = filterAllowedSettings(patch);
  const next = { ...loadSettings(), ...safePatch };
  try {
    const p = settingsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8');
      try {
        fs.renameSync(tmp, p);
      } catch {
        // Windows'ta hedef dosya kilitliyse doğrudan üzerine yaz
        fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf8');
      }
    } finally {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {}
    }
  } catch {
    // Yazma hatası olursa bellekteki ayarı döndür
  }
  return next;
}

// Komut satırından (.exe üzerine sürüklenen veya Birlikte Aç ile verilen) MIDI dosyasını bul
function extractMidiFileFromArgs(argv) {
  if (!Array.isArray(argv)) return null;
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg || typeof arg !== 'string' || arg.startsWith('-')) continue;
    const ext = path.extname(arg).toLowerCase();
    if (['.mid', '.midi', '.json', '.vital'].includes(ext)) {
      try {
        if (fs.statSync(arg).isFile()) {
          return arg;
        }
      } catch {}
    }
  }
  return null;
}

function readMidiFilePayload(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > MAX_FILE_SIZE_BYTES) {
      return null;
    }
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    const buf = fs.readFileSync(filePath);
    return {
      name,
      ext,
      base64: buf.toString('base64')
    };
  } catch {
    return null;
  }
}

let mainWindow = null;
let pendingStartupFile = extractMidiFileFromArgs(process.argv);

// Tekil örnek kilidi (Windows'ta .exe'ye ikinci kez tıklandığında mevcut pencereyi öne getirir)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const fileArg = extractMidiFileFromArgs(commandLine);
      if (fileArg) {
        const payload = readMidiFilePayload(fileArg);
        if (payload && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('midi:externalOpen', payload);
        }
      }
    }
  });
}

// macOS Finder'dan dosya açma desteği
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (!filePath || typeof filePath !== 'string') return;
  const ext = path.extname(filePath).toLowerCase();
  if (!['.mid', '.midi', '.json', '.vital'].includes(ext)) return;
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed() && !mainWindow.webContents.isLoading()) {
    const payload = readMidiFilePayload(filePath);
    if (payload) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('midi:externalOpen', payload);
    }
  } else {
    pendingStartupFile = filePath;
    if (gotTheLock && app.isReady() && (!mainWindow || mainWindow.isDestroyed())) {
      createWindow();
    }
  }
});

function createWindow() {
  // Windows'ta Alt tuşuna basıldığında üst menü çubuğunun klavye odağını çalmasını engelle
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 920,
    minHeight: 580,
    backgroundColor: '#1e2227',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    title: 'Emochord – Piyano & MIDI Pratik Stüdyosu',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url !== mainWindow.webContents.getURL()) e.preventDefault();
  });
}

app.whenReady().then(() => {
  if (!gotTheLock) return;

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return ALLOWED_PERMISSIONS.has(permission);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('settings:set', (_e, patch) => saveSettings(patch));

ipcMain.handle('midi:getStartupFile', () => {
  if (!pendingStartupFile) return null;
  const filePath = pendingStartupFile;
  pendingStartupFile = null;
  return readMidiFilePayload(filePath);
});

ipcMain.handle('window:toggleFullscreen', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  const next = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(next);
  return next;
});

ipcMain.handle('midi:openFile', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'MIDI, Kayıt veya Vital Preset Dosyası Aç',
    defaultPath: getSafeDefaultDir(),
    properties: ['openFile'],
    filters: [
      { name: 'Desteklenen Dosyalar (*.mid, *.midi, *.json, *.vital)', extensions: ['mid', 'midi', 'json', 'vital'] },
      { name: 'MIDI Dosyaları (*.mid, *.midi)', extensions: ['mid', 'midi'] },
      { name: 'Vital Preset (*.vital)', extensions: ['vital'] },
      { name: 'Emochord Kayıt (*.json)', extensions: ['json'] }
    ]
  });
  if (res.canceled || !res.filePaths[0]) return null;
  return readMidiFilePayload(res.filePaths[0]);
});

ipcMain.handle('vital:openFile', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return [];
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Vital Preset (.vital) Ekle',
    defaultPath: getSafeDefaultDir(),
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Vital Synthesizer Preset (*.vital)', extensions: ['vital'] }
    ]
  });
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) return [];
  return res.filePaths.map((p) => readMidiFilePayload(p)).filter(Boolean);
});

ipcMain.handle('recording:save', async (_e, payload) => {
  if (!mainWindow || mainWindow.isDestroyed() || !payload || typeof payload !== 'object') {
    return false;
  }
  const isMidi = payload.format === 'mid';
  if (isMidi && (typeof payload.base64 !== 'string' || payload.base64.length === 0)) {
    return false;
  }
  const ext = isMidi ? 'mid' : 'json';
  const defaultFileName = `emochord-kayit-${new Date().toISOString().slice(0, 10)}.${ext}`;
  const res = await dialog.showSaveDialog(mainWindow, {
    title: isMidi ? 'MIDI Dosyası Olarak Kaydet' : 'Performans Kaydını Kaydet',
    defaultPath: path.join(getSafeDefaultDir(), defaultFileName),
    filters: isMidi
      ? [{ name: 'Standart MIDI Dosyası (*.mid)', extensions: ['mid'] }]
      : [{ name: 'Emochord Kayıt Dosyası (*.json)', extensions: ['json'] }]
  });
  if (res.canceled || !res.filePath) return false;
  try {
    if (isMidi) {
      fs.writeFileSync(res.filePath, Buffer.from(payload.base64, 'base64'));
    } else {
      fs.writeFileSync(res.filePath, JSON.stringify(payload, null, 2), 'utf8');
    }
    return true;
  } catch {
    return false;
  }
});
