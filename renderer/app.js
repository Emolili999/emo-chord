(function () {
  'use strict';

  const {
    KEYBOARD_RANGES,
    getNoteInfo,
    recommendRangeForNotes,
    pcCodeToMidi,
    detectChord
  } = window.EmochordMusic;
  const { DEMO_SONGS, NoteHighwayState } = window.EmochordHighway;
  const { parseMidiBuffer, writeMidiBuffer } = window.EmochordMidiParser;
  const { parseVitalPreset } = window.EmochordVitalParser;
  const { PracticeEngine } = window.EmochordPractice;
  const { EmochordAudioEngine } = window.EmochordAudio;
  const { NoteFlowVisualizer } = window.EmochordVisualizer;

  const i18n = window.EmochordI18n || {
    t: (k, fb) => fb || k,
    getLang: () => 'en',
    setLanguage: () => {},
    toggleLanguage: () => {}
  };
  if (window.EmochordI18n) window.EmochordI18n.init();

  // Uygulama Durumu
  const state = {
    appMode: 'free', // 'free' | 'wait' | 'rhythm' | 'listen'
    handMode: 'both', // 'both' | 'right' | 'left'
    tempoScale: 1.0,
    metronomeEnabled: false,
    rangeId: '61',
    instrument: 'grand_piano',
    themeId: 'zephyr',
    baseOctave: 3,
    transpose: 0,
    volume: 0.85,
    reverb: 0.28,
    sustainLocked: false,
    spaceHeld: false,
    midiSustainHeld: false,
    flowSpeed: 220,
    labelMode: 'both',
    useTurkishNotes: false,
    showParticles: true,
    showGridLines: true,
    customMidiSong: null,
    vitalPresets: []
  };

  // DOM Elemanları
  const canvas = document.getElementById('noteFlowCanvas');
  const stageContainer = document.getElementById('stageContainer');
  const dropOverlay = document.getElementById('dropOverlay');
  const midiDot = document.getElementById('midiDot');
  const midiInputSelect = document.getElementById('midiInputSelect');

  // Menü & Drawer Elemanları
  const btnMenuToggle = document.getElementById('btnMenuToggle');
  const btnCloseMenu = document.getElementById('btnCloseMenu');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const settingsDrawer = document.getElementById('settingsDrawer');

  // Hızlı Kontroller & Yüzen HUD Bar
  const btnQuickRestart = document.getElementById('btnQuickRestart');
  const btnQuickPlay = document.getElementById('btnQuickPlay');
  const quickPlayIcon = document.getElementById('quickPlayIcon');
  const quickSongTitle = document.getElementById('quickSongTitle');
  const quickSongTime = document.getElementById('quickSongTime');
  const quickModeGroup = document.getElementById('quickModeGroup');
  const quickSustainBtn = document.getElementById('quickSustainBtn');
  const quickMidiDot = document.getElementById('quickMidiDot');
  const quickMidiText = document.getElementById('quickMidiText');
  const btnQuickHelp = document.getElementById('btnQuickHelp');
  const btnQuickFullscreen = document.getElementById('btnQuickFullscreen');
  const btnQuickLang = document.getElementById('btnQuickLang');
  const quickLangLabel = document.getElementById('quickLangLabel');
  const langSelect = document.getElementById('langSelect');

  // Ekran Boyu İlerleme Çubuğu
  const timelineWrap = document.getElementById('timelineWrap');
  const timelineHoverLine = document.getElementById('timelineHoverLine');
  const timelineHoverTime = document.getElementById('timelineHoverTime');

  const demoSelect = document.getElementById('demoSelect');
  const btnOpenFile = document.getElementById('btnOpenFile');
  const hiddenFileInput = document.getElementById('hiddenFileInput');
  const btnRecord = document.getElementById('btnRecord');
  const recordLabel = document.getElementById('recordLabel');
  const btnSaveRec = document.getElementById('btnSaveRec');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const helpModal = document.getElementById('helpModal');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Pratik & Oynatıcı Elemanları
  const appModeGroup = document.getElementById('appModeGroup');
  const handModeGroup = document.getElementById('handModeGroup');
  const btnRestartSong = document.getElementById('btnRestartSong');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playSeqIcon = document.getElementById('playSeqIcon');
  const playSeqLabel = document.getElementById('playSeqLabel');
  const btnStopSong = document.getElementById('btnStopSong');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeTotal = document.getElementById('timeTotal');
  const timelineSlider = document.getElementById('timelineSlider');
  const timelineProgress = document.getElementById('timelineProgress');
  const timelineLoopRegion = document.getElementById('timelineLoopRegion');

  const btnTempoDown = document.getElementById('btnTempoDown');
  const btnTempoUp = document.getElementById('btnTempoUp');
  const tempoValue = document.getElementById('tempoValue');
  const btnLoopA = document.getElementById('btnLoopA');
  const btnLoopB = document.getElementById('btnLoopB');
  const btnLoopClear = document.getElementById('btnLoopClear');
  const btnMetronome = document.getElementById('btnMetronome');

  // Alt Ayar Şeridi
  const instrumentSelect = document.getElementById('instrumentSelect');
  const btnAddVital = document.getElementById('btnAddVital');
  const btnRemoveVital = document.getElementById('btnRemoveVital');
  const vitalFileInput = document.getElementById('vitalFileInput');
  const rangeSelect = document.getElementById('rangeSelect');
  const btnOctaveDown = document.getElementById('btnOctaveDown');
  const btnOctaveUp = document.getElementById('btnOctaveUp');
  const octaveValue = document.getElementById('octaveValue');
  const btnTransposeDown = document.getElementById('btnTransposeDown');
  const btnTransposeUp = document.getElementById('btnTransposeUp');
  const transposeValue = document.getElementById('transposeValue');
  const btnSustain = document.getElementById('btnSustain');
  const themeSelect = document.getElementById('themeSelect');
  const labelModeSelect = document.getElementById('labelModeSelect');
  const speedSlider = document.getElementById('speedSlider');
  const reverbSlider = document.getElementById('reverbSlider');
  const volumeSlider = document.getElementById('volumeSlider');
  const btnParticles = document.getElementById('btnParticles');

  // Performans Karnesi Modal
  const summaryModal = document.getElementById('summaryModal');
  const btnCloseSummary = document.getElementById('btnCloseSummary');
  const sumRank = document.getElementById('sumRank');
  const sumTitle = document.getElementById('sumTitle');
  const sumSub = document.getElementById('sumSub');
  const sumScore = document.getElementById('sumScore');
  const sumAccuracy = document.getElementById('sumAccuracy');
  const sumStreak = document.getElementById('sumStreak');
  const sumHits = document.getElementById('sumHits');
  const sumWrong = document.getElementById('sumWrong');
  const sumMissed = document.getElementById('sumMissed');
  const btnRetryPractice = document.getElementById('btnRetryPractice');
  const btnSummaryFreePlay = document.getElementById('btnSummaryFreePlay');

  // Motorlar
  const audio = new EmochordAudioEngine();
  const highway = new NoteHighwayState({ pixelsPerSecond: state.flowSpeed });
  const rangeCfg = KEYBOARD_RANGES[state.rangeId];
  const practice = new PracticeEngine({
    mode: 'wait',
    handMode: state.handMode,
    tempoScale: state.tempoScale,
    visibleMinMidi: rangeCfg.minMidi,
    visibleMaxMidi: rangeCfg.maxMidi
  });

  const visualizer = new NoteFlowVisualizer(canvas, {
    minMidi: rangeCfg.minMidi,
    maxMidi: rangeCfg.maxMidi,
    themeId: state.themeId,
    baseOctave: state.baseOctave,
    transpose: state.transpose,
    labelMode: state.labelMode
  });

  // Aktif Girdi Takibi (Kullanıcı ve Otomatik Oynatıcı çakışmasını önlemek için ayrı kümeler)
  const heldPcCodes = new Map();
  const activePointers = new Map();
  const heldMidiNotes = new Map();
  const userHeldCounts = new Map();
  const playbackHeldMidis = new Set();
  let isScrubbingTimeline = false;
  let timelineScrubPointerId = null;
  let lastMetronomeBeat = -1;
  let freeMetronomeBeatPhase = 0;

  // Gereksiz DOM yazmalarını engellemek için önbellek
  const domCache = {
    timeCur: '',
    timeTot: ''
  };

  function setTextCached(el, cacheKey, val) {
    if (domCache[cacheKey] !== val) {
      domCache[cacheKey] = val;
      if (el) el.textContent = val;
    }
  }

  function formatTime(ms) {
    const clamped = Math.max(0, Math.round(ms / 1000));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getDisplaySongTitle(song) {
    if (!song) return '';
    const id = song.id || (demoSelect ? demoSelect.value : '');
    if (id === 'custom_midi' || id === 'custom') {
      return song.title || i18n.t('songs.custom_midi', 'Custom MIDI');
    }
    if (id) {
      const key = `songs.${id}`;
      const translated = i18n.t(key, '');
      if (translated && translated !== key) {
        return translated.replace(/^[^\w\s]*\s*/, '').replace(/\s*\(.*?\)$/, '');
      }
    }
    return song.title || '';
  }

  function refreshDropdownOptions() {
    const demoOpts = {
      twinkle: i18n.t('songs.twinkle'),
      fur_elise: i18n.t('songs.fur_elise'),
      ode_to_joy: i18n.t('songs.ode_to_joy'),
      turkish_march: i18n.t('songs.turkish_march'),
      bach_prelude: i18n.t('songs.bach_prelude'),
      recorded: i18n.t('songs.recorded')
    };
    for (const [val, text] of Object.entries(demoOpts)) {
      const opt = demoSelect ? demoSelect.querySelector(`option[value="${val}"]`) : null;
      if (opt && text) opt.textContent = text;
    }

    const instOpts = {
      grand_piano: i18n.t('keyboardControls.instruments.grand_piano'),
      acoustic_piano: i18n.t('keyboardControls.instruments.acoustic_piano'),
      electric_piano: i18n.t('keyboardControls.instruments.electric_piano'),
      violin: i18n.t('keyboardControls.instruments.violin'),
      string_ensemble: i18n.t('keyboardControls.instruments.string_ensemble'),
      acoustic_guitar: i18n.t('keyboardControls.instruments.acoustic_guitar'),
      flute: i18n.t('keyboardControls.instruments.flute'),
      celesta: i18n.t('keyboardControls.instruments.celesta'),
      drawbar_organ: i18n.t('keyboardControls.instruments.drawbar_organ'),
      music_box: i18n.t('keyboardControls.instruments.music_box'),
      neon_synth: i18n.t('keyboardControls.instruments.neon_synth'),
      synth_pad: i18n.t('keyboardControls.instruments.synth_pad')
    };
    for (const [val, text] of Object.entries(instOpts)) {
      const opt = instrumentSelect ? instrumentSelect.querySelector(`option[value="${val}"]`) : null;
      if (opt && text) opt.textContent = text;
    }
    const vitalGroup = instrumentSelect ? instrumentSelect.querySelector('optgroup[data-vital-group="true"]') : null;
    if (vitalGroup) {
      vitalGroup.label = i18n.t('keyboardControls.vitalGroup', 'Vital Presets');
    }

    const rangeOpts = {
      '88': i18n.t('keyboardControls.sizes.88'),
      '61': i18n.t('keyboardControls.sizes.61'),
      '49': i18n.t('keyboardControls.sizes.49'),
      '37': i18n.t('keyboardControls.sizes.37'),
      '25': i18n.t('keyboardControls.sizes.25')
    };
    for (const [val, text] of Object.entries(rangeOpts)) {
      const opt = rangeSelect ? rangeSelect.querySelector(`option[value="${val}"]`) : null;
      if (opt && text) opt.textContent = text;
    }

    const themeOpts = {
      zephyr: i18n.t('visualsControls.themes.zephyr'),
      classic: i18n.t('visualsControls.themes.classic'),
      aurora: i18n.t('visualsControls.themes.aurora'),
      luminary: i18n.t('visualsControls.themes.luminary'),
      cyberpunk: i18n.t('visualsControls.themes.cyberpunk'),
      emerald: i18n.t('visualsControls.themes.emerald'),
      fire: i18n.t('visualsControls.themes.fire'),
      rainbow: i18n.t('visualsControls.themes.rainbow')
    };
    for (const [val, text] of Object.entries(themeOpts)) {
      const opt = themeSelect ? themeSelect.querySelector(`option[value="${val}"]`) : null;
      if (opt && text) opt.textContent = text;
    }

    const labelOpts = {
      both: i18n.t('visualsControls.keyLabels.both'),
      pc: i18n.t('visualsControls.keyLabels.pc'),
      note: i18n.t('visualsControls.keyLabels.note'),
      tr: i18n.t('visualsControls.keyLabels.tr'),
      none: i18n.t('visualsControls.keyLabels.none')
    };
    for (const [val, text] of Object.entries(labelOpts)) {
      const opt = labelModeSelect ? labelModeSelect.querySelector(`option[value="${val}"]`) : null;
      if (opt && text) opt.textContent = text;
    }

    const handOpts = {
      both: i18n.t('hands.both'),
      right: i18n.t('hands.right'),
      left: i18n.t('hands.left')
    };
    for (const [val, text] of Object.entries(handOpts)) {
      const btn = handModeGroup ? handModeGroup.querySelector(`button[data-hand="${val}"]`) : null;
      if (btn && text) btn.textContent = text;
    }

    const modeOpts = {
      free: i18n.t('modesLong.free'),
      wait: i18n.t('modesLong.wait'),
      rhythm: i18n.t('modesLong.rhythm'),
      listen: i18n.t('modesLong.listen')
    };
    for (const [val, text] of Object.entries(modeOpts)) {
      const btn = appModeGroup ? appModeGroup.querySelector(`button[data-mode="${val}"]`) : null;
      if (btn && text) btn.textContent = text;
    }
  }

  async function loadInitialSettings() {
    try {
      let saved = null;
      if (window.emochordAPI?.getSettings) {
        saved = await window.emochordAPI.getSettings();
      } else {
        const raw = localStorage.getItem('emochord_settings');
        if (raw) saved = JSON.parse(raw);
      }
      if (saved && typeof saved === 'object') {
        Object.assign(state, saved);
        // Eski kayıtlardaki artık geçerli olmayan tema kimliği varsayılana düşer
        if (!window.EmochordHighway.THEMES[state.themeId]) state.themeId = 'zephyr';
        if (Array.isArray(state.vitalPresets)) {
          state.vitalPresets.forEach((p) => {
            if (p && p.id) audio.addVitalPreset(p);
          });
        } else {
          state.vitalPresets = [];
        }
      }
    } catch {}
    syncVitalPresetsUI();
    if (!audio.setInstrument(state.instrument)) {
      state.instrument = 'grand_piano';
    }
    applyStateToUI();
    loadSelectedSongIntoPractice(false);
  }

  function syncVitalPresetsUI() {
    if (!instrumentSelect) return;
    const oldGroup = instrumentSelect.querySelector('optgroup[data-vital-group="true"]');
    if (oldGroup) oldGroup.remove();

    const presets = audio.getVitalPresets ? audio.getVitalPresets() : [];
    if (presets.length > 0) {
      const group = document.createElement('optgroup');
      group.label = i18n.t('keyboardControls.vitalGroup', 'Vital Presets');
      group.setAttribute('data-vital-group', 'true');
      for (const p of presets) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `🎛️ ${p.name}`;
        group.appendChild(opt);
      }
      instrumentSelect.appendChild(group);
    }

    if (btnRemoveVital) {
      btnRemoveVital.hidden = !String(state.instrument || '').startsWith('vital:');
    }
  }

  function persistSettings() {
    const payload = {
      rangeId: state.rangeId,
      instrument: state.instrument,
      themeId: state.themeId,
      baseOctave: state.baseOctave,
      transpose: state.transpose,
      volume: state.volume,
      reverb: state.reverb,
      flowSpeed: state.flowSpeed,
      labelMode: state.labelMode,
      showParticles: state.showParticles,
      vitalPresets: Array.isArray(state.vitalPresets) ? state.vitalPresets : []
    };
    if (window.emochordAPI?.setSettings) {
      window.emochordAPI.setSettings(payload).catch(() => {});
    } else {
      try {
        localStorage.setItem('emochord_settings', JSON.stringify(payload));
      } catch {}
    }
  }

  function applyStateToUI() {
    const r = KEYBOARD_RANGES[state.rangeId] || KEYBOARD_RANGES['61'];
    rangeSelect.value = r.id;
    instrumentSelect.value = state.instrument;
    themeSelect.value = state.themeId;
    labelModeSelect.value = state.labelMode;
    speedSlider.value = String(state.flowSpeed);
    reverbSlider.value = String(Math.round(state.reverb * 100));
    volumeSlider.value = String(Math.round(state.volume * 100));

    audio.setInstrument(state.instrument);
    audio.setVolume(state.volume);
    audio.setReverb(state.reverb);
    highway.setSpeed(state.flowSpeed);

    visualizer.themeId = state.themeId;
    visualizer.labelMode = state.labelMode;
    visualizer.useTurkishNotes = state.labelMode === 'tr';
    visualizer.showParticles = state.showParticles;
    visualizer.setRange(r.minMidi, r.maxMidi);
    visualizer.setPcMapping(state.baseOctave, state.transpose);
    practice.setVisibleRange(r.minMidi, r.maxMidi);

    btnParticles.classList.toggle('active', state.showParticles);
    btnMetronome.classList.toggle('active', state.metronomeEnabled);
    tempoValue.textContent = `%${Math.round(state.tempoScale * 100)}`;

    updateModeButtonsUI();
    updateHandButtonsUI();
    updateOctaveAndTransposeUI();
    updateSustainUI();
  }

  function updateModeButtonsUI() {
    for (const btn of appModeGroup.querySelectorAll('.seg-btn')) {
      btn.classList.toggle('active', btn.dataset.mode === state.appMode);
    }
    if (quickModeGroup) {
      for (const btn of quickModeGroup.querySelectorAll('.q-mode-btn')) {
        btn.classList.toggle('active', btn.dataset.mode === state.appMode);
      }
    }

    if (quickModeGroup) {
      for (const btn of quickModeGroup.querySelectorAll('.q-mode-btn')) {
        const m = btn.dataset.mode;
        btn.textContent = i18n.t(`modes.${m}`, btn.textContent);
      }
    }
  }

  function updateHandButtonsUI() {
    for (const btn of handModeGroup.querySelectorAll('.seg-btn')) {
      btn.classList.toggle('active', btn.dataset.hand === state.handMode);
    }
  }

  function updateOctaveAndTransposeUI() {
    const lowMidi = (state.baseOctave + 1) * 12 + state.transpose;
    const highMidi = Math.min(108, lowMidi + 31);
    const useTr = state.labelMode === 'tr';
    const lowInfo = getNoteInfo(Math.max(21, lowMidi));
    const highInfo = getNoteInfo(Math.max(21, highMidi));
    octaveValue.textContent = useTr
      ? `${lowInfo.fullNameTr}–${highInfo.fullNameTr}`
      : `${lowInfo.fullName}–${highInfo.fullName}`;
    transposeValue.textContent = state.transpose > 0 ? `+${state.transpose}` : String(state.transpose);
  }

  function updateSustainUI() {
    const active = state.sustainLocked || state.spaceHeld || state.midiSustainHeld;
    audio.setSustain(active);
    btnSustain.classList.toggle('active', active);
    if (quickSustainBtn) {
      quickSustainBtn.classList.toggle('active', active);
    }
    if (!active) {
      visualizer.sustainedKeys.clear();
    }
  }

  function getSelectedSongObject() {
    const choice = demoSelect.value;
    if (choice === 'recorded') {
      if (!highway.recordedNotes.length) return null;
      return {
        id: 'recorded',
        title: i18n.t('songs.recordedTitle', 'My Recording'),
        bpm: 120,
        notes: highway.recordedNotes
      };
    }
    if (choice === 'custom_midi' && state.customMidiSong) {
      return state.customMidiSong;
    }
    return DEMO_SONGS[choice] || DEMO_SONGS.fur_elise;
  }

  function loadSelectedSongIntoPractice(autoStart = false) {
    const song = getSelectedSongObject();
    if (!song) {
      return false;
    }

    // Şarkıdaki notalar mevcut klavye boyutunun dışına taşıyorsa klavyeyi otomatik genişlet
    const recommendedId = recommendRangeForNotes(song.notes, state.rangeId);
    if (recommendedId !== state.rangeId) {
      state.rangeId = recommendedId;
      const r = KEYBOARD_RANGES[recommendedId];
      rangeSelect.value = recommendedId;
      visualizer.setRange(r.minMidi, r.maxMidi);
      practice.setVisibleRange(r.minMidi, r.maxMidi);
    }

    practice.loadSong(song);
    practice.setMode(state.appMode === 'free' ? 'wait' : state.appMode);
    practice.setHandMode(state.handMode);
    practice.setTempoScale(state.tempoScale);

    timeTotal.textContent = formatTime(practice.durationMs);
    setTextCached(timeCurrent, 'timeCur', '00:00');
    if (quickSongTitle) {
      quickSongTitle.textContent = getDisplaySongTitle(song) || song.title || i18n.t('songs.defaultPiece', 'Piece');
    }
    if (quickSongTime) {
      quickSongTime.textContent = `00:00 / ${formatTime(practice.durationMs)}`;
    }
    timelineSlider.value = '0';
    timelineProgress.style.width = '0%';
    updateLoopUI();

    if (autoStart) {
      if (state.appMode === 'free') {
        setAppMode('wait', false);
      }
      practice.start();
      lastMetronomeBeat = -1;
    }
    syncPlayPauseButton();
    updateLcdHud();
    return true;
  }

  function setAppMode(nextMode, autoStartIfSong = true) {
    if (highway.isRecording) toggleRecording();

    panicAllNotesOff();
    highway.clear();
    state.appMode = nextMode;
    updateModeButtonsUI();

    if (nextMode === 'free') {
      if (typeof practice.stop === 'function') {
        practice.stop();
      } else {
        practice.reset();
      }
      lastMetronomeBeat = -1;
      freeMetronomeBeatPhase = 0;
      visualizer.setWaitingNotes([]);
      updateTimelineUI(true);
      syncPlayPauseButton();
      updateLcdHud();
      return;
    }

    practice.setMode(nextMode);
    if (!practice.song) {
      loadSelectedSongIntoPractice(false);
    } else {
      practice.reset();
    }

    if (autoStartIfSong) {
      practice.start();
      lastMetronomeBeat = -1;
    }
    syncPlayPauseButton();
    updateLcdHud();
  }

  function syncPlayPauseButton() {
    const running = state.appMode !== 'free' && practice.isPlaying && !practice.isPaused;
    btnPlayPause.classList.toggle('playing', running);
    playSeqIcon.textContent = running ? '⏸' : '▶';
    playSeqLabel.textContent = running ? i18n.t('pause', 'Pause') : i18n.t('play', 'Play');
    if (quickPlayIcon) {
      quickPlayIcon.textContent = running ? '⏸' : '▶';
    }
  }

  function triggerNoteOn(midi, velocity = 100, source = 'user', hand = null) {
    if (midi < 21 || midi > 108) return;
    const vel = Math.max(1, Math.min(127, Math.round(velocity)));

    if (source === 'playback') {
      playbackHeldMidis.add(midi);
    } else {
      userHeldCounts.set(midi, (userHeldCounts.get(midi) || 0) + 1);
    }

    audio.noteOn(midi, vel);

    const effectiveHand = hand || (midi >= 60 ? 'right' : 'left');
    visualizer.pressedKeys.set(midi, { velocity: vel, hand: effectiveHand, source });
    visualizer.sustainedKeys.delete(midi);
    visualizer.spawnNoteBurst(midi, vel, effectiveHand);

    if (source !== 'playback') {
      if (state.appMode === 'free') {
        highway.noteOn(midi, vel, performance.now(), source);
      } else if (practice.isPlaying && !practice.isPaused && state.appMode !== 'listen') {
        const res = practice.handleUserNoteOn(midi);
        if (res.status === 'perfect') {
          visualizer.spawnFeedbackText(midi, i18n.t('feedback.perfect', 'PERFECT!'), '#2ecc71');
        } else if (res.status === 'good') {
          visualizer.spawnFeedbackText(midi, i18n.t('feedback.good', 'GOOD!'), '#3daee9');
        } else if (res.status === 'wrong') {
          visualizer.flashWrongKey(midi);
        }
      }
    }

    updateLcdHud();
  }

  function triggerNoteOff(midi, source = 'user') {
    if (source === 'playback') {
      playbackHeldMidis.delete(midi);
      // Kullanıcı aynı tuşu hala basılı tutuyorsa sesi ve görseli kesme
      if ((userHeldCounts.get(midi) || 0) > 0) return;
    } else {
      const heldCount = userHeldCounts.get(midi) || 0;
      if (heldCount > 1) {
        userHeldCounts.set(midi, heldCount - 1);
        return;
      }
      userHeldCounts.delete(midi);
      if (state.appMode === 'free') {
        highway.noteOff(midi, performance.now());
      }
      if (playbackHeldMidis.has(midi)) return;
    }

    audio.noteOff(midi);
    visualizer.pressedKeys.delete(midi);
    if (audio.sustainPedal) {
      visualizer.sustainedKeys.add(midi);
    }
    updateLcdHud();
  }

  function panicAllNotesOff() {
    heldPcCodes.clear();
    activePointers.clear();
    heldMidiNotes.clear();
    userHeldCounts.clear();
    playbackHeldMidis.clear();
    audio.releaseAll();
    highway.releaseAll(performance.now());
    visualizer.pressedKeys.clear();
    visualizer.sustainedKeys.clear();
    visualizer.setWaitingNotes([]);
    updateLcdHud();
  }

  function updateLcdHud() {
    if (state.appMode === 'free') {
      visualizer.setWaitingNotes([]);
      return;
    }
    const waiting = practice.getWaitingNotes();
    visualizer.setWaitingNotes(waiting);
  }

  // 1. BİLGİSAYAR KLAVYESİ GİRİŞİ
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
      if (e.code !== 'Escape') return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) {
      if (e.code === 'Space') e.preventDefault();
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.spaceHeld) {
        state.spaceHeld = true;
        updateSustainUI();
      }
      return;
    }

    if (e.code === 'Tab') {
      e.preventDefault();
      toggleSettingsMenu();
      return;
    }

    if (e.code === 'Escape') {
      e.preventDefault();
      if (settingsDrawer && settingsDrawer.classList.contains('open')) {
        toggleSettingsMenu(false);
        return;
      }
      if (!helpModal.hidden) {
        helpModal.hidden = true;
        return;
      }
      if (!summaryModal.hidden) {
        summaryModal.hidden = true;
        return;
      }
      panicAllNotesOff();
      return;
    }

    if (e.code === 'F11') {
      e.preventDefault();
      btnFullscreen.click();
      return;
    }

    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      changeOctave(-1);
      return;
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      changeOctave(1);
      return;
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      changeTranspose(-1);
      return;
    }
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      changeTranspose(1);
      return;
    }

    const midi = pcCodeToMidi(e.code, state.baseOctave, state.transpose);
    if (midi !== null) {
      e.preventDefault();
      if (heldPcCodes.has(e.code)) return;
      heldPcCodes.set(e.code, midi);
      triggerNoteOn(midi, 102, 'pc');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      state.spaceHeld = false;
      updateSustainUI();
      return;
    }

    if (heldPcCodes.has(e.code)) {
      const midi = heldPcCodes.get(e.code);
      heldPcCodes.delete(e.code);
      triggerNoteOff(midi, 'pc');
    }
  });

  window.addEventListener('blur', () => {
    state.spaceHeld = false;
    updateSustainUI();
    panicAllNotesOff();
  });

  // 2. FARE & DOKUNMATİK PİYANO GİRİŞİ (Multi-touch destekli pointerId takibi)
  function computeMouseVelocity(clientY) {
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    const keyTopY = visualizer.highwayHeight + visualizer.feltHeight;
    const ratio = Math.max(0, Math.min(1, (y - keyTopY) / visualizer.keybedHeight));
    return Math.round(72 + ratio * 48);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const midi = visualizer.hitTestKey(e.clientX, e.clientY);
    activePointers.set(e.pointerId, { midi });
    if (midi !== null) {
      triggerNoteOn(midi, computeMouseVelocity(e.clientY), 'mouse');
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const entry = activePointers.get(e.pointerId);
    if (!entry) return;
    const midi = visualizer.hitTestKey(e.clientX, e.clientY);
    if (midi !== entry.midi) {
      if (entry.midi !== null) {
        triggerNoteOff(entry.midi, 'mouse');
      }
      entry.midi = midi;
      if (midi !== null) {
        triggerNoteOn(midi, computeMouseVelocity(e.clientY), 'mouse');
      }
    }
  });

  const endPointer = (e) => {
    const entry = activePointers.get(e.pointerId);
    if (!entry) return;
    activePointers.delete(e.pointerId);
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (entry.midi !== null) {
      triggerNoteOff(entry.midi, 'mouse');
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  // 3. GERÇEK MIDI KLAVYE / ORG (Web MIDI API)
  let midiAccess = null;
  let selectedMidiInputId = '';
  const boundMidiInputs = new Set();

  async function setupWebMidi() {
    if (!navigator.requestMIDIAccess) {
      midiInputSelect.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = i18n.t('midi.unsupported', 'Web MIDI Not Supported');
      midiInputSelect.appendChild(opt);
      return;
    }
    try {
      midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      midiAccess.onstatechange = () => refreshMidiInputs();
      refreshMidiInputs();
    } catch {
      midiInputSelect.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = i18n.t('midi.denied', 'MIDI Access Denied');
      midiInputSelect.appendChild(opt);
    }
  }

  function refreshMidiInputs() {
    if (!midiAccess) return;
    const allInputs = Array.from(midiAccess.inputs.values());
    const inputs = [];
    for (const input of allInputs) {
      if (input.state === 'disconnected') {
        input.onmidimessage = null;
      } else {
        inputs.push(input);
      }
    }
    const activeSet = new Set(inputs);
    const activeIds = new Set(inputs.map((inp) => inp.id));

    for (const prevInput of boundMidiInputs) {
      if (!activeSet.has(prevInput)) {
        prevInput.onmidimessage = null;
        boundMidiInputs.delete(prevInput);
      }
    }

    for (const [key, entry] of heldMidiNotes.entries()) {
      if (!activeIds.has(entry.inputId)) {
        heldMidiNotes.delete(key);
        triggerNoteOff(entry.playedMidi, 'midi');
      }
    }

    midiInputSelect.innerHTML = '';

    if (inputs.length === 0) {
      selectedMidiInputId = '';
      if (state.midiSustainHeld) {
        state.midiSustainHeld = false;
        updateSustainUI();
      }
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = i18n.t('midi.inputStandby', 'MIDI: Standby / Plug & Play');
      midiInputSelect.appendChild(opt);
      midiDot.classList.remove('connected');
      if (quickMidiDot) quickMidiDot.classList.remove('connected');
      if (quickMidiText) quickMidiText.textContent = i18n.t('midi.standby', 'MIDI: Standby');
      return;
    }

    const allOpt = document.createElement('option');
    allOpt.value = '__all__';
    allOpt.textContent = `🎹 ${i18n.t('midi.allDevices', 'All MIDI Devices')} (${inputs.length})`;
    midiInputSelect.appendChild(allOpt);

    for (const input of inputs) {
      const opt = document.createElement('option');
      opt.value = input.id;
      opt.textContent = input.name || `${i18n.t('midi.defaultDevice', 'MIDI Keyboard')} (${input.id})`;
      midiInputSelect.appendChild(opt);
      input.onmidimessage = (msg) => handleMidiMessage(input.id, msg);
      boundMidiInputs.add(input);
    }

    if (!selectedMidiInputId || (selectedMidiInputId !== '__all__' && !activeIds.has(selectedMidiInputId))) {
      selectedMidiInputId = '__all__';
    }
    midiInputSelect.value = selectedMidiInputId;
    midiDot.classList.add('connected');
    if (quickMidiDot) quickMidiDot.classList.add('connected');
    if (quickMidiText) quickMidiText.textContent = `${i18n.t('midi.connected', 'MIDI: Connected')} (${inputs.length})`;
  }

  function handleMidiMessage(inputId, event) {
    if (selectedMidiInputId && selectedMidiInputId !== '__all__' && selectedMidiInputId !== inputId) {
      return;
    }
    const data = event.data;
    if (!data || data.length < 2) return;
    const status = data[0] & 0xf0;
    const note = data[1];
    const velocity = data.length > 2 ? data[2] : 0;
    const key = `${inputId}:${note}`;

    if (status === 0x90 && velocity > 0) {
      if (heldMidiNotes.has(key)) {
        const prev = heldMidiNotes.get(key);
        heldMidiNotes.delete(key);
        triggerNoteOff(prev.playedMidi, 'midi');
      }
      const playedMidi = note + state.transpose;
      if (playedMidi >= 21 && playedMidi <= 108) {
        heldMidiNotes.set(key, { inputId, playedMidi });
        triggerNoteOn(playedMidi, velocity, 'midi');
      }
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      if (heldMidiNotes.has(key)) {
        const prev = heldMidiNotes.get(key);
        heldMidiNotes.delete(key);
        triggerNoteOff(prev.playedMidi, 'midi');
      } else {
        triggerNoteOff(note + state.transpose, 'midi');
      }
    } else if (status === 0xb0) {
      if (note === 64) {
        state.midiSustainHeld = velocity >= 64;
        updateSustainUI();
      } else if (note === 123) {
        for (const [k, entry] of heldMidiNotes.entries()) {
          if (entry.inputId === inputId) {
            heldMidiNotes.delete(k);
          }
        }
        panicAllNotesOff();
      }
    }
  }

  midiInputSelect.addEventListener('change', () => {
    selectedMidiInputId = midiInputSelect.value;
  });

  // 4. KAYIT, MIDI YÜKLEME VE DIŞA AKTARMA
  function toggleRecording() {
    if (highway.isRecording) {
      const notes = highway.stopRecording(performance.now());
      btnRecord.classList.remove('recording');
      recordLabel.textContent = i18n.t('buttons.record', 'Record');

      if (notes.length > 0) {
        demoSelect.value = 'recorded';
        btnSaveRec.disabled = false;
        loadSelectedSongIntoPractice(false);
      }
    } else {
      setAppMode('free', false);
      highway.startRecording(performance.now());
      btnRecord.classList.add('recording');
      recordLabel.textContent = i18n.t('buttons.recordStop', 'Stop');
      updateLcdHud();
    }
  }

  function loadVitalPresetBytes(name, uint8) {
    const preset = parseVitalPreset(uint8, name);
    audio.addVitalPreset(preset);
    if (!Array.isArray(state.vitalPresets)) state.vitalPresets = [];
    const existingIdx = state.vitalPresets.findIndex((p) => p && p.id === preset.id);
    if (existingIdx >= 0) {
      state.vitalPresets[existingIdx] = preset;
    } else {
      state.vitalPresets.push(preset);
      if (state.vitalPresets.length > 20) {
        const dropped = state.vitalPresets.shift();
        if (dropped && dropped.id && dropped.id !== preset.id) {
          audio.removeVitalPreset(dropped.id);
        }
      }
    }
    state.instrument = preset.id;
    audio.setInstrument(preset.id);
    syncVitalPresetsUI();
    instrumentSelect.value = preset.id;
    persistSettings();
  }

  function loadFileBytes(name, uint8) {
    try {
      const lower = name.toLowerCase();
      if (lower.endsWith('.vital')) {
        loadVitalPresetBytes(name, uint8);
        return;
      }
      if (lower.endsWith('.json')) {
        const text = new TextDecoder('utf-8').decode(uint8);
        const parsed = JSON.parse(text);
        const notes = Array.isArray(parsed) ? parsed : parsed.notes;
        if (!Array.isArray(notes) || notes.length === 0) {
          throw new Error('Kayıt dosyasında nota bulunamadı.');
        }
        state.customMidiSong = {
          id: 'custom_midi',
          title: parsed.title || name.replace(/\.json$/i, ''),
          bpm: parsed.bpm || 120,
          notes
        };
      } else {
        const parsed = parseMidiBuffer(uint8);
        if (!parsed.notes || parsed.notes.length === 0) {
          throw new Error('MIDI dosyasında çalınabilir piyano notası bulunamadı.');
        }
        state.customMidiSong = {
          id: 'custom_midi',
          title: `${name.replace(/\.(mid|midi)$/i, '')}`,
          bpm: parsed.bpm,
          notes: parsed.notes
        };
      }

      if (highway.isRecording) {
        highway.stopRecording(performance.now());
        btnRecord.classList.remove('recording');
        recordLabel.textContent = i18n.t('buttons.record', 'Record');
      }
      panicAllNotesOff();
      highway.clear();

      let customOpt = demoSelect.querySelector('option[value="custom_midi"]');
      if (!customOpt) {
        customOpt = document.createElement('option');
        customOpt.value = 'custom_midi';
        demoSelect.prepend(customOpt);
      }
      customOpt.textContent = `🎹 ${state.customMidiSong.title} (${state.customMidiSong.bpm} BPM)`;
      demoSelect.value = 'custom_midi';

      if (state.appMode === 'free') {
        state.appMode = 'wait';
        updateModeButtonsUI();
      }
      loadSelectedSongIntoPractice(true);
    } catch (err) {
      console.error('Dosya okunamadı:', err);
    }
  }

  btnOpenFile.addEventListener('click', async () => {
    if (window.emochordAPI?.openMidiOrRecordingFile) {
      const res = await window.emochordAPI.openMidiOrRecordingFile();
      if (!res) return;
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      loadFileBytes(res.name, bytes);
    } else {
      hiddenFileInput.click();
    }
  });

  hiddenFileInput.addEventListener('change', async () => {
    const file = hiddenFileInput.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    loadFileBytes(file.name, new Uint8Array(buf));
    hiddenFileInput.value = '';
  });

  stageContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.hidden = false;
  });
  stageContainer.addEventListener('dragleave', (e) => {
    if (e.target === dropOverlay || !stageContainer.contains(e.relatedTarget)) {
      dropOverlay.hidden = true;
    }
  });
  stageContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropOverlay.hidden = true;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    loadFileBytes(file.name, new Uint8Array(buf));
  });

  btnSaveRec.addEventListener('click', async () => {
    if (!highway.recordedNotes.length) return;
    const midiBytes = writeMidiBuffer({
      title: 'Emochord Kayit',
      bpm: 120,
      notes: highway.recordedNotes
    });

    if (window.emochordAPI?.saveRecording) {
      let binary = '';
      for (let i = 0; i < midiBytes.length; i++) {
        binary += String.fromCharCode(midiBytes[i]);
      }
      await window.emochordAPI.saveRecording({
        format: 'mid',
        base64: btoa(binary)
      });
    } else {
      const blob = new Blob([midiBytes], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'emochord-kayit.mid';
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // 5. PRATİK ÇUBUĞU, EL SEÇİMİ, ZAMAN ÇUBUĞU VE DÖNGÜ KONTROLLERİ
  appModeGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    setAppMode(btn.dataset.mode, true);
  });

  handModeGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    state.handMode = btn.dataset.hand;
    practice.setHandMode(state.handMode);
    updateHandButtonsUI();
    updateLcdHud();
  });

  btnPlayPause.addEventListener('click', () => {
    if (state.appMode === 'free') {
      setAppMode('wait', true);
      return;
    }
    if (!practice.song) {
      loadSelectedSongIntoPractice(true);
      return;
    }
    if (practice.isPlaying && !practice.isPaused) {
      practice.pause();
      panicAllNotesOff();
    } else if (practice.isFinished) {
      panicAllNotesOff();
      practice.start();
      lastMetronomeBeat = -1;
    } else {
      practice.resume();
    }
    syncPlayPauseButton();
    updateLcdHud();
  });

  btnRestartSong.addEventListener('click', () => {
    panicAllNotesOff();
    if (state.appMode === 'free') {
      setAppMode('wait', true);
      return;
    }
    practice.reset();
    practice.start();
    lastMetronomeBeat = -1;
    syncPlayPauseButton();
    updateLcdHud();
  });

  btnStopSong.addEventListener('click', () => {
    setAppMode('free', false);
  });

  demoSelect.addEventListener('change', () => {
    panicAllNotesOff();
    const shouldAutoStart = state.appMode !== 'free' && practice.isPlaying;
    loadSelectedSongIntoPractice(shouldAutoStart);
  });

  const handleTimelineScrub = (clientX) => {
    if (!timelineWrap) return;
    const rect = timelineWrap.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    timelineSlider.value = String(Math.round(ratio * 1000));
    if (!practice.song) {
      loadSelectedSongIntoPractice(false);
    }
    const dur = Math.max(1, practice.durationMs || 1000);
    const targetMs = ratio * dur;
    if (Math.abs(targetMs - practice.songTimeMs) >= 1) {
      panicAllNotesOff();
      practice.seek(targetMs);
      lastMetronomeBeat = -1;
    }
    updateTimelineUI(true);
    updateLcdHud();
  };

  if (timelineWrap) {
    timelineWrap.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isScrubbingTimeline = true;
      timelineScrubPointerId = e.pointerId;
      try { timelineWrap.setPointerCapture(e.pointerId); } catch (_) {}
      handleTimelineScrub(e.clientX);
    });

    timelineWrap.addEventListener('pointermove', (e) => {
      const rect = timelineWrap.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const dur = Math.max(1, practice.durationMs || 0);
      const hoverMs = ratio * dur;
      if (timelineHoverLine) timelineHoverLine.style.left = `${(ratio * 100).toFixed(2)}%`;
      if (timelineHoverTime) {
        const clampedX = Math.max(28, Math.min(rect.width - 28, ratio * rect.width));
        timelineHoverTime.style.left = `${clampedX.toFixed(1)}px`;
        timelineHoverTime.textContent = formatTime(hoverMs);
      }

      if (isScrubbingTimeline && (timelineScrubPointerId === null || e.pointerId === timelineScrubPointerId)) {
        handleTimelineScrub(e.clientX);
      }
    });

    const stopScrubbing = (e) => {
      if (isScrubbingTimeline && (timelineScrubPointerId === null || e.pointerId === timelineScrubPointerId)) {
        isScrubbingTimeline = false;
        timelineScrubPointerId = null;
        try { timelineWrap.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    timelineWrap.addEventListener('pointerup', stopScrubbing);
    timelineWrap.addEventListener('pointercancel', stopScrubbing);
    window.addEventListener('pointerup', stopScrubbing);
  }

  timelineSlider.addEventListener('input', () => {
    if (isScrubbingTimeline) return;
    if (!practice.song) {
      loadSelectedSongIntoPractice(false);
    }
    if (!practice.durationMs) return;
    const ratio = Number(timelineSlider.value) / 1000;
    const targetMs = ratio * practice.durationMs;
    panicAllNotesOff();
    practice.seek(targetMs);
    lastMetronomeBeat = -1;
    updateTimelineUI(true);
    updateLcdHud();
  });

  function changeTempo(delta) {
    const next = Math.max(0.25, Math.min(2.0, Math.round((state.tempoScale + delta) * 100) / 100));
    state.tempoScale = next;
    practice.setTempoScale(next);
    tempoValue.textContent = `%${Math.round(next * 100)}`;
  }

  btnTempoDown.addEventListener('click', () => changeTempo(-0.1));
  btnTempoUp.addEventListener('click', () => changeTempo(0.1));

  function updateLoopUI() {
    const dur = Math.max(1, practice.durationMs);
    btnLoopA.classList.toggle('active', practice.loopStartMs !== null);
    btnLoopB.classList.toggle('active', practice.loopEnabled);
    btnLoopClear.disabled = practice.loopStartMs === null && !practice.loopEnabled;

    if (practice.loopEnabled && practice.loopStartMs !== null && practice.loopEndMs !== null) {
      const leftPct = Math.max(0, Math.min(100, (practice.loopStartMs / dur) * 100));
      const widthPct = Math.max(1, Math.min(100 - leftPct, ((practice.loopEndMs - practice.loopStartMs) / dur) * 100));
      timelineLoopRegion.style.left = `${leftPct}%`;
      timelineLoopRegion.style.width = `${widthPct}%`;
      timelineLoopRegion.hidden = false;
    } else {
      timelineLoopRegion.hidden = true;
    }
  }

  btnLoopA.addEventListener('click', () => {
    practice.setLoopPointA(Math.max(0, practice.songTimeMs));
    updateLoopUI();
  });

  btnLoopB.addEventListener('click', () => {
    practice.setLoopPointB(Math.max(500, practice.songTimeMs));
    updateLoopUI();
  });

  btnLoopClear.addEventListener('click', () => {
    practice.clearLoop();
    updateLoopUI();
  });

  btnMetronome.addEventListener('click', () => {
    state.metronomeEnabled = !state.metronomeEnabled;
    btnMetronome.classList.toggle('active', state.metronomeEnabled);
    lastMetronomeBeat = -1;
    freeMetronomeBeatPhase = 0;
  });

  function updateTimelineUI(forceSlider = false) {
    const dur = Math.max(1, practice.durationMs);
    const cur = Math.max(0, Math.min(dur, practice.songTimeMs));
    const pct = (cur / dur) * 100;
    timelineProgress.style.width = `${pct.toFixed(1)}%`;
    if (forceSlider || !isScrubbingTimeline) {
      timelineSlider.value = String(Math.round((cur / dur) * 1000));
    }
    const curFormatted = formatTime(cur);
    const durFormatted = formatTime(dur);
    setTextCached(timeCurrent, 'timeCur', curFormatted);
    if (timeTotal) setTextCached(timeTotal, 'timeTot', durFormatted);
    if (quickSongTime) {
      quickSongTime.textContent = `${curFormatted} / ${durFormatted}`;
    }
  }

  function showSummaryModal() {
    const rep = practice.getSummaryReport();
    sumRank.textContent = rep.rank;
    sumTitle.textContent = getDisplaySongTitle(practice.song) || rep.title;
    const modeNames = {
      wait: i18n.t('summary.modeNames.wait', 'Wait Practice'),
      rhythm: i18n.t('summary.modeNames.rhythm', 'Rhythm Practice'),
      listen: i18n.t('summary.modeNames.listen', 'Watch & Listen')
    };
    const handNames = {
      both: i18n.t('hands.labelsMap.both', 'Both Hands'),
      right: i18n.t('hands.labelsMap.right', 'Right Hand'),
      left: i18n.t('hands.labelsMap.left', 'Left Hand')
    };
    sumSub.textContent = `${modeNames[rep.mode] || i18n.t('modes.wait', 'Practice')} • ${handNames[rep.handMode] || ''}`;
    sumScore.textContent = String(rep.score);
    sumAccuracy.textContent = `%${rep.accuracy}`;
    sumStreak.textContent = `${rep.maxStreak}x`;
    sumHits.textContent = `${rep.perfectHits} / ${rep.goodHits}`;
    sumWrong.textContent = String(rep.wrongHits);
    sumMissed.textContent = String(rep.missedNotes);
    summaryModal.hidden = false;
  }

  btnCloseSummary.addEventListener('click', () => {
    summaryModal.hidden = true;
  });
  summaryModal.addEventListener('click', (e) => {
    if (e.target === summaryModal) summaryModal.hidden = true;
  });
  btnRetryPractice.addEventListener('click', () => {
    summaryModal.hidden = true;
    panicAllNotesOff();
    lastMetronomeBeat = -1;
    practice.reset();
    practice.start();
    syncPlayPauseButton();
    updateLcdHud();
  });
  btnSummaryFreePlay.addEventListener('click', () => {
    summaryModal.hidden = true;
    setAppMode('free', false);
  });

  // 6. ALT KONTROL PANELİ OLAYLARI
  function changeOctave(delta) {
    const next = Math.max(1, Math.min(5, state.baseOctave + delta));
    if (next === state.baseOctave) return;
    state.baseOctave = next;
    visualizer.setPcMapping(state.baseOctave, state.transpose);
    updateOctaveAndTransposeUI();
    updateLcdHud();
    persistSettings();
  }

  function changeTranspose(delta) {
    const next = Math.max(-12, Math.min(12, state.transpose + delta));
    if (next === state.transpose) return;
    state.transpose = next;
    visualizer.setPcMapping(state.baseOctave, state.transpose);
    updateOctaveAndTransposeUI();
    updateLcdHud();
    persistSettings();
  }

  btnOctaveDown.addEventListener('click', () => changeOctave(-1));
  btnOctaveUp.addEventListener('click', () => changeOctave(1));
  btnTransposeDown.addEventListener('click', () => changeTranspose(-1));
  btnTransposeUp.addEventListener('click', () => changeTranspose(1));

  instrumentSelect.addEventListener('change', () => {
    state.instrument = instrumentSelect.value;
    audio.setInstrument(state.instrument);
    if (btnRemoveVital) {
      btnRemoveVital.hidden = !String(state.instrument || '').startsWith('vital:');
    }
    persistSettings();
  });

  if (btnAddVital) {
    btnAddVital.addEventListener('click', async () => {
      if (window.emochordAPI?.openVitalPresetFile) {
        const files = await window.emochordAPI.openVitalPresetFile();
        if (!Array.isArray(files) || files.length === 0) return;
        for (const res of files) {
          try {
            const bin = atob(res.base64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            loadVitalPresetBytes(res.name, bytes);
          } catch (err) {
            console.error('Geçersiz .vital dosyası:', err);
          }
        }
      } else if (vitalFileInput) {
        vitalFileInput.click();
      }
    });
  }

  if (vitalFileInput) {
    vitalFileInput.addEventListener('change', async () => {
      const files = Array.from(vitalFileInput.files || []);
      for (const file of files) {
        try {
          const buf = await file.arrayBuffer();
          loadVitalPresetBytes(file.name, new Uint8Array(buf));
        } catch (err) {
          console.error('Geçersiz .vital dosyası:', err);
        }
      }
      vitalFileInput.value = '';
    });
  }

  if (btnRemoveVital) {
    btnRemoveVital.addEventListener('click', () => {
      const current = state.instrument;
      if (!String(current || '').startsWith('vital:')) return;
      audio.removeVitalPreset(current);
      state.vitalPresets = (state.vitalPresets || []).filter((p) => p && p.id !== current);
      state.instrument = 'grand_piano';
      audio.setInstrument(state.instrument);
      syncVitalPresetsUI();
      instrumentSelect.value = state.instrument;
      persistSettings();
    });
  }

  rangeSelect.addEventListener('change', () => {
    state.rangeId = rangeSelect.value;
    const r = KEYBOARD_RANGES[state.rangeId] || KEYBOARD_RANGES['61'];
    visualizer.setRange(r.minMidi, r.maxMidi);
    practice.setVisibleRange(r.minMidi, r.maxMidi);
    updateLcdHud();
    persistSettings();
  });

  btnSustain.addEventListener('click', () => {
    state.sustainLocked = !state.sustainLocked;
    updateSustainUI();
  });

  themeSelect.addEventListener('change', () => {
    state.themeId = themeSelect.value;
    visualizer.themeId = state.themeId;
    persistSettings();
  });

  labelModeSelect.addEventListener('change', () => {
    state.labelMode = labelModeSelect.value;
    visualizer.labelMode = state.labelMode;
    visualizer.useTurkishNotes = state.labelMode === 'tr';
    updateOctaveAndTransposeUI();
    updateLcdHud();
    persistSettings();
  });

  speedSlider.addEventListener('input', () => {
    state.flowSpeed = Number(speedSlider.value);
    highway.setSpeed(state.flowSpeed);
    persistSettings();
  });

  reverbSlider.addEventListener('input', () => {
    state.reverb = Number(reverbSlider.value) / 100;
    audio.setReverb(state.reverb);
    persistSettings();
  });

  volumeSlider.addEventListener('input', () => {
    state.volume = Number(volumeSlider.value) / 100;
    audio.setVolume(state.volume);
    persistSettings();
  });

  btnParticles.addEventListener('click', () => {
    state.showParticles = !state.showParticles;
    visualizer.showParticles = state.showParticles;
    btnParticles.classList.toggle('active', state.showParticles);
    persistSettings();
  });

  btnRecord.addEventListener('click', toggleRecording);

  btnHelp.addEventListener('click', () => {
    helpModal.hidden = !helpModal.hidden;
  });
  btnCloseHelp.addEventListener('click', () => {
    helpModal.hidden = true;
  });
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.hidden = true;
  });

  btnFullscreen.addEventListener('click', () => {
    if (window.emochordAPI?.toggleFullscreen) {
      window.emochordAPI.toggleFullscreen();
    } else if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  if (btnQuickLang) {
    btnQuickLang.addEventListener('click', () => {
      i18n.toggleLanguage();
    });
  }

  if (langSelect) {
    langSelect.value = i18n.getLang();
    langSelect.addEventListener('change', () => {
      i18n.setLanguage(langSelect.value);
    });
  }

  window.addEventListener('emochord:languagechange', (e) => {
    const lang = e.detail?.lang || i18n.getLang();
    if (quickLangLabel) quickLangLabel.textContent = lang.toUpperCase();
    if (langSelect && langSelect.value !== lang) langSelect.value = lang;
    refreshDropdownOptions();
    updateModeButtonsUI();
    syncPlayPauseButton();
    if (practice.song && quickSongTitle) {
      quickSongTitle.textContent = getDisplaySongTitle(practice.song);
    }
    updateLcdHud();
  });

  // 3 Çizgi Ayarlar Çekmecesi ve Hızlı Kontroller
  function toggleSettingsMenu(forceOpen) {
    if (!settingsDrawer) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : !settingsDrawer.classList.contains('open');
    settingsDrawer.classList.toggle('open', shouldOpen);
    if (drawerBackdrop) {
      drawerBackdrop.classList.toggle('active', shouldOpen);
    }
    settingsDrawer.setAttribute('aria-hidden', String(!shouldOpen));
  }

  if (btnMenuToggle) {
    btnMenuToggle.addEventListener('click', () => toggleSettingsMenu());
  }
  if (btnCloseMenu) {
    btnCloseMenu.addEventListener('click', () => toggleSettingsMenu(false));
  }
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', () => toggleSettingsMenu(false));
  }
  if (btnQuickRestart) {
    btnQuickRestart.addEventListener('click', () => btnRestartSong.click());
  }
  if (btnQuickPlay) {
    btnQuickPlay.addEventListener('click', () => btnPlayPause.click());
  }
  if (quickModeGroup) {
    quickModeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.q-mode-btn');
      if (!btn) return;
      setAppMode(btn.dataset.mode, true);
    });
  }
  if (quickSustainBtn) {
    quickSustainBtn.addEventListener('click', () => btnSustain.click());
  }
  if (btnQuickHelp) {
    btnQuickHelp.addEventListener('click', () => btnHelp.click());
  }
  if (btnQuickFullscreen) {
    btnQuickFullscreen.addEventListener('click', () => btnFullscreen.click());
  }

  window.addEventListener('resize', () => visualizer.resize());

  // 7. ANA 60/120 FPS NOT AKIŞI RENDER VE PRATİK DÖNGÜSÜ
  let lastFrameMs = performance.now();
  function animate(nowMs) {
    const dtMs = Math.min(50, Math.max(1, nowMs - lastFrameMs));
    const dtSec = dtMs / 1000;
    lastFrameMs = nowMs;

    if (state.appMode !== 'free' && practice.isPlaying && !practice.isPaused) {
      const ev = practice.update(dtMs);

      for (let i = 0; i < ev.noteOff.length; i++) {
        const n = ev.noteOff[i];
        triggerNoteOff(n.midi, 'playback');
      }
      if (ev.looped) {
        panicAllNotesOff();
        lastMetronomeBeat = -1;
      }
      for (let i = 0; i < ev.noteOn.length; i++) {
        const n = ev.noteOn[i];
        triggerNoteOn(n.midi, n.velocity, 'playback', n.hand);
      }

      if (state.metronomeEnabled && !practice.isWaitingForInput && !ev.finished && practice.songTimeMs >= 0) {
        const beatMs = 60000 / (practice.song?.bpm || 120);
        const curBeat = Math.floor(practice.songTimeMs / beatMs);
        if (curBeat !== lastMetronomeBeat) {
          lastMetronomeBeat = curBeat;
          audio.playMetronomeTick(curBeat % 4 === 0);
        }
      }

      updateTimelineUI();
      updateLcdHud();

      if (ev.finished) {
        syncPlayPauseButton();
        visualizer.setWaitingNotes([]);
        if (state.appMode === 'wait' || state.appMode === 'rhythm') {
          showSummaryModal();
        }
      }
    } else if (state.appMode === 'free' && state.metronomeEnabled) {
      const curBeat = Math.floor(freeMetronomeBeatPhase);
      if (curBeat !== lastMetronomeBeat) {
        lastMetronomeBeat = curBeat;
        audio.playMetronomeTick(curBeat % 4 === 0);
      }
      freeMetronomeBeatPhase += (dtMs * state.tempoScale) / (60000 / 120);
    }

    const risingRects = highway.computeRisingRects(nowMs, visualizer.highwayHeight);
    let fallingRects = [];
    let songMeta = null;

    if (state.appMode !== 'free' && practice.notes.length > 0) {
      const waitingNotes = practice.getWaitingNotes();
      const waitingIds = new Set(waitingNotes.map((n) => n.id));
      fallingRects = highway.computeFallingRects(
        practice.notes,
        practice.songTimeMs,
        visualizer.highwayHeight,
        {
          waitingIds,
          isTargetFn: (n) => practice.isNoteTargetForUser(n)
        }
      );
      songMeta = {
        isPlaying: true,
        bpm: practice.song?.bpm || 120,
        songTimeMs: practice.songTimeMs,
        pixelsPerSecond: highway.pixelsPerSecond
      };
    }

    visualizer.render(dtSec, risingRects, fallingRects, songMeta);

    requestAnimationFrame(animate);
  }

  // Ana süreçten gelen (base64) dosya yükünü çözüp yükler
  function loadBase64Payload(payload) {
    if (!payload || !payload.base64) return;
    const bin = atob(payload.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    loadFileBytes(payload.name, bytes);
  }

  // Windows: .mid dosyası .exe üzerine sürüklendiğinde / "Birlikte Aç" ile açıldığında
  if (window.emochordAPI?.onExternalMidiOpen) {
    window.emochordAPI.onExternalMidiOpen((payload) => loadBase64Payload(payload));
  }

  loadInitialSettings().then(async () => {
    visualizer.resize();
    setupWebMidi();
    requestAnimationFrame(animate);
    if (window.emochordAPI?.getStartupFile) {
      try {
        loadBase64Payload(await window.emochordAPI.getStartupFile());
      } catch {}
    }
  });
})();
