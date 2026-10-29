const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron');
const fs = require('fs');
const path = require('path');

// Windows görev çubuğu gruplaması ve bildirim uyumluluğu
if (process.platform === 'win32') {
  app.setAppUserModelId('com.emo.emochord');
}

// Windows ve Linux'ta ses/MIDI gecikmesini azaltmak ve otomatik başlatmayı etkinleştirmek için bayraklar
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'WebMidi');

const ALLOWED_PERMISSIONS = new Set(['midi', 'midiSysex', 'media', 'audioCapture']);

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
  themeId: 'classic',
  baseOctave: 3,
  transpose: 0,
  volume: 0.85,
  reverb: 0.28,
  sustain: false,
  flowSpeed: 220,
  labelMode: 'both',
  useTurkishNotes: false,
  showParticles: true,
  showGridLines: true
};

function loadSettings() {
  try {
    const p = settingsPath();
    if (!fs.existsSync(p)) return { ...DEFAULT_SETTINGS };
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(patch) {
  const next = { ...loadSettings(), ...(patch && typeof patch === 'object' ? patch : {}) };
  try {
    const p = settingsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8');
    try {
      fs.renameSync(tmp, p);
    } catch {
      // Windows'ta hedef dosya kilitliyse doğrudan üzerine yaz
      fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf8');
      try { fs.unlinkSync(tmp); } catch {}
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
    if (!arg || arg.startsWith('-')) continue;
    const ext = path.extname(arg).toLowerCase();
    if (['.mid', '.midi', '.json'].includes(ext) && fs.existsSync(arg)) {
      return arg;
    }
  }
  return null;
}

function readMidiFilePayload(filePath) {
  try {
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
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const fileArg = extractMidiFileFromArgs(commandLine);
      if (fileArg) {
        const payload = readMidiFilePayload(fileArg);
        if (payload) {
          mainWindow.webContents.send('midi:externalOpen', payload);
        }
      }
    }
  });
}

function createWindow() {
  // Windows'ta Alt tuşuna basıldığında üst menü çubuğunun klavye odağını çalmasını engelle
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 920,
    minHeight: 580,
    backgroundColor: '#090b10',
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
  if (!mainWindow) return false;
  const next = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(next);
  return next;
});

ipcMain.handle('midi:openFile', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'MIDI veya Emochord Kayıt Dosyası Aç',
    defaultPath: getSafeDefaultDir(),
    properties: ['openFile'],
    filters: [
      { name: 'MIDI ve Kayıt Dosyaları', extensions: ['mid', 'midi', 'json'] },
      { name: 'MIDI Dosyaları (*.mid, *.midi)', extensions: ['mid', 'midi'] },
      { name: 'Emochord Kayıt (*.json)', extensions: ['json'] }
    ]
  });
  if (res.canceled || !res.filePaths[0]) return null;
  return readMidiFilePayload(res.filePaths[0]);
});

ipcMain.handle('recording:save', async (_e, payload) => {
  if (!mainWindow || !payload) return false;
  const isMidi = payload.format === 'mid' && payload.base64;
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
  if (isMidi) {
    fs.writeFileSync(res.filePath, Buffer.from(payload.base64, 'base64'));
  } else {
    fs.writeFileSync(res.filePath, JSON.stringify(payload, null, 2), 'utf8');
  }
  return true;
});
