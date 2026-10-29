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
  const { PracticeEngine } = window.EmochordPractice;
  const { EmochordAudioEngine } = window.EmochordAudio;
  const { NoteFlowVisualizer } = window.EmochordVisualizer;

  // Uygulama Durumu
  const state = {
    appMode: 'free', // 'free' | 'wait' | 'rhythm' | 'listen'
    handMode: 'both', // 'both' | 'right' | 'left'
    tempoScale: 1.0,
    metronomeEnabled: false,
    rangeId: '61',
    instrument: 'grand_piano',
    themeId: 'classic',
    baseOctave: 3,
    transpose: 0,
    volume: 0.85,
    reverb: 0.28,
    sustainLocked: false,
    spaceHeld: false,
    flowSpeed: 220,
    labelMode: 'both',
    useTurkishNotes: false,
    showParticles: true,
    showGridLines: true,
    customMidiSong: null
  };

  // DOM Elemanları
  const canvas = document.getElementById('noteFlowCanvas');
  const stageContainer = document.getElementById('stageContainer');
  const dropOverlay = document.getElementById('dropOverlay');
  const modeBadge = document.getElementById('modeBadge');
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
  const hudLiveChord = document.getElementById('hudLiveChord');
  const hudLiveNotes = document.getElementById('hudLiveNotes');
  const hudLiveScore = document.getElementById('hudLiveScore');
  const hudLiveStreak = document.getElementById('hudLiveStreak');
  const hudVuFill = document.getElementById('hudVuFill');
  const quickSustainBtn = document.getElementById('quickSustainBtn');
  const quickMidiDot = document.getElementById('quickMidiDot');
  const quickMidiText = document.getElementById('quickMidiText');
  const btnQuickHelp = document.getElementById('btnQuickHelp');
  const btnQuickFullscreen = document.getElementById('btnQuickFullscreen');

  // Ekran Boyu İlerleme Çubuğu
  const timelineWrap = document.getElementById('timelineWrap');
  const timelineHoverLine = document.getElementById('timelineHoverLine');
  const timelineHoverTime = document.getElementById('timelineHoverTime');

  const lcdChord = document.getElementById('lcdChord');
  const lcdNotes = document.getElementById('lcdNotes');
  const lcdScore = document.getElementById('lcdScore');
  const lcdStreak = document.getElementById('lcdStreak');
  const lcdAccuracy = document.getElementById('lcdAccuracy');
  const vuFill = document.getElementById('vuFill');

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
  const userHeldMidis = new Set();
  const playbackHeldMidis = new Set();
  let mouseHeldMidi = null;
  let isMouseDown = false;
  let isScrubbingTimeline = false;
  let lastMetronomeBeat = -1;

  // Gereksiz DOM yazmalarını engellemek için önbellek
  const domCache = {
    chord: '',
    notes: '',
    score: '',
    streak: '',
    accuracy: '',
    timeCur: '',
    vuPct: -1
  };

  function setTextCached(el, cacheKey, val) {
    if (domCache[cacheKey] !== val) {
      domCache[cacheKey] = val;
      if (el) el.textContent = val;
      if (cacheKey === 'chord' && hudLiveChord) hudLiveChord.textContent = val;
      else if (cacheKey === 'notes' && hudLiveNotes) hudLiveNotes.textContent = val;
      else if (cacheKey === 'score' && hudLiveScore) hudLiveScore.textContent = val;
      else if (cacheKey === 'streak' && hudLiveStreak) hudLiveStreak.textContent = val;
    }
  }

  function formatTime(ms) {
    const clamped = Math.max(0, Math.round(ms / 1000));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
        if (!window.EmochordHighway.THEMES[state.themeId]) state.themeId = 'classic';
      }
    } catch {}
    applyStateToUI();
    loadSelectedSongIntoPractice(false);
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
      showParticles: state.showParticles
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
    const labels = {
      free: 'SERBEST ÇALMA',
      wait: 'PRATİK: TUŞ BEKLEMELİ',
      rhythm: 'PRATİK: AKAN RİTİM',
      listen: 'İZLE & DİNLE'
    };
    modeBadge.textContent = labels[state.appMode] || 'SERBEST ÇALMA';
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
    const active = state.sustainLocked || state.spaceHeld;
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
        title: 'Serbest Çalma Kaydım',
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
      setTextCached(lcdChord, 'chord', 'Henüz Kayıt Yok');
      setTextCached(lcdNotes, 'notes', 'Önce "Kayıt" butonuna basıp birkaç nota çalın veya bir parça seçin');
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
      quickSongTitle.textContent = song.title || 'Parça';
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
      practice.pause();
      visualizer.setWaitingNotes([]);
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
    playSeqLabel.textContent = running ? 'Duraklat' : 'Başlat';
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
      userHeldMidis.add(midi);
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
          visualizer.spawnFeedbackText(midi, 'MÜKEMMEL!', '#65e827');
        } else if (res.status === 'good') {
          visualizer.spawnFeedbackText(midi, 'İYİ!', '#38bdf8');
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
      if (userHeldMidis.has(midi)) return;
    } else {
      userHeldMidis.delete(midi);
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
    userHeldMidis.clear();
    playbackHeldMidis.clear();
    mouseHeldMidi = null;
    isMouseDown = false;
    audio.releaseAll();
    highway.releaseAll(performance.now());
    visualizer.pressedKeys.clear();
    visualizer.sustainedKeys.clear();
    visualizer.setWaitingNotes([]);
    updateLcdHud();
  }

  function updateLcdHud() {
    const useTr = state.labelMode === 'tr';

    setTextCached(lcdScore, 'score', String(practice.stats.score));
    setTextCached(lcdStreak, 'streak', `${practice.stats.streak}x`);
    setTextCached(lcdAccuracy, 'accuracy', `%${practice.getAccuracyPercent()}`);

    const waiting = practice.getWaitingNotes();
    visualizer.setWaitingNotes(waiting);

    if (state.appMode !== 'free' && practice.isPlaying && !practice.isPaused) {
      if (waiting.length > 0) {
        let octaveHint = '';
        const lowPcMidi = (state.baseOctave + 1) * 12 + state.transpose;
        const highPcMidi = lowPcMidi + 31;

        const names = waiting.map((n) => {
          const info = getNoteInfo(n.midi);
          const pc = visualizer.pcLabels.get(n.midi);
          const noteStr = useTr ? info.fullNameTr : info.fullName;
          if (!pc && !octaveHint) {
            octaveHint = n.midi < lowPcMidi ? ' (Oktav Düşür: ←)' : ' (Oktav Yükselt: →)';
          }
          return pc ? `${noteStr} [${pc}]` : noteStr;
        });
        setTextCached(lcdChord, 'chord', `🎯 Beklenen Tuş: ${names.join(' + ')}`);
        setTextCached(
          lcdNotes,
          'notes',
          `İlerleme: ${practice.stats.completedTargets} / ${practice.stats.totalTargets} Nota${octaveHint}`
        );
        return;
      }
    }

    const activeMidis = Array.from(visualizer.pressedKeys.keys()).sort((a, b) => a - b);
    if (activeMidis.length === 0) {
      if (highway.isRecording) {
        setTextCached(lcdChord, 'chord', '● Kayıt Yapılıyor...');
        setTextCached(lcdNotes, 'notes', 'Çaldığınız tüm notalar kaydediliyor');
      } else if (state.appMode !== 'free' && practice.song) {
        const handLabels = { both: 'İki El', right: 'Sağ El', left: 'Sol El' };
        setTextCached(lcdChord, 'chord', `🎼 ${practice.song.title}`);
        setTextCached(
          lcdNotes,
          'notes',
          `${handLabels[state.handMode]} • ${practice.stats.completedTargets}/${practice.stats.totalTargets} Nota`
        );
      } else {
        setTextCached(lcdChord, 'chord', 'Serbest Piyano Hazır');
        setTextCached(lcdNotes, 'notes', 'Klavye (Z–M / Q–Ü), Fare veya MIDI Org ile çalın');
      }
      return;
    }

    const chord = detectChord(activeMidis, useTr);
    setTextCached(lcdChord, 'chord', chord ? chord.label : '');
    const noteNames = activeMidis.map((m) => {
      const info = getNoteInfo(m);
      return useTr ? info.fullNameTr : info.fullName;
    });
    setTextCached(lcdNotes, 'notes', noteNames.join('  •  '));
  }

  // 1. BİLGİSAYAR KLAVYESİ GİRİŞİ
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
      if (e.code !== 'Escape') return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.spaceHeld) {
        state.spaceHeld = true;
        updateSustainUI();
      }
      return;
    }

    if (e.code === 'KeyM') {
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

    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

    const midi = pcCodeToMidi(e.code, state.baseOctave, state.transpose);
    if (midi !== null) {
      e.preventDefault();
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

  // 2. FARE & DOKUNMATİK PİYANO GİRİŞİ
  function computeMouseVelocity(clientY) {
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    const keyTopY = visualizer.highwayHeight + visualizer.feltHeight;
    const ratio = Math.max(0, Math.min(1, (y - keyTopY) / visualizer.keybedHeight));
    return Math.round(72 + ratio * 48);
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    isMouseDown = true;
    const midi = visualizer.hitTestKey(e.clientX, e.clientY);
    if (midi !== null) {
      mouseHeldMidi = midi;
      triggerNoteOn(midi, computeMouseVelocity(e.clientY), 'mouse');
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isMouseDown) return;
    const midi = visualizer.hitTestKey(e.clientX, e.clientY);
    if (midi !== mouseHeldMidi) {
      if (mouseHeldMidi !== null) {
        triggerNoteOff(mouseHeldMidi, 'mouse');
      }
      mouseHeldMidi = midi;
      if (midi !== null) {
        triggerNoteOn(midi, computeMouseVelocity(e.clientY), 'mouse');
      }
    }
  });

  const endPointer = () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    if (mouseHeldMidi !== null) {
      triggerNoteOff(mouseHeldMidi, 'mouse');
      mouseHeldMidi = null;
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  // 3. GERÇEK MIDI KLAVYE / ORG (Web MIDI API)
  let midiAccess = null;
  let selectedMidiInputId = '';

  async function setupWebMidi() {
    if (!navigator.requestMIDIAccess) {
      midiInputSelect.innerHTML = '<option value="">Web MIDI Desteklenmiyor</option>';
      return;
    }
    try {
      midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      midiAccess.onstatechange = () => refreshMidiInputs();
      refreshMidiInputs();
    } catch {
      midiInputSelect.innerHTML = '<option value="">MIDI Erişimi Reddedildi</option>';
    }
  }

  function refreshMidiInputs() {
    if (!midiAccess) return;
    const inputs = Array.from(midiAccess.inputs.values());
    midiInputSelect.innerHTML = '';

    if (inputs.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'MIDI: Cihaz Bekleniyor (Tak-Çalıştır)';
      midiInputSelect.appendChild(opt);
      midiDot.classList.remove('connected');
      if (quickMidiDot) quickMidiDot.classList.remove('connected');
      if (quickMidiText) quickMidiText.textContent = 'MIDI: Bekleniyor';
      return;
    }

    const allOpt = document.createElement('option');
    allOpt.value = '__all__';
    allOpt.textContent = `🎹 Tüm MIDI Cihazları (${inputs.length})`;
    midiInputSelect.appendChild(allOpt);

    for (const input of inputs) {
      const opt = document.createElement('option');
      opt.value = input.id;
      opt.textContent = input.name || `MIDI Klavye (${input.id})`;
      midiInputSelect.appendChild(opt);
      input.onmidimessage = (msg) => handleMidiMessage(input.id, msg);
    }

    if (!selectedMidiInputId) selectedMidiInputId = '__all__';
    midiInputSelect.value = selectedMidiInputId;
    midiDot.classList.add('connected');
    if (quickMidiDot) quickMidiDot.classList.add('connected');
    if (quickMidiText) quickMidiText.textContent = `MIDI: Bağlı (${inputs.length})`;
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

    if (status === 0x90) {
      if (velocity > 0) {
        triggerNoteOn(note + state.transpose, velocity, 'midi');
      } else {
        triggerNoteOff(note + state.transpose, 'midi');
      }
    } else if (status === 0x80) {
      triggerNoteOff(note + state.transpose, 'midi');
    } else if (status === 0xb0) {
      if (note === 64) {
        state.spaceHeld = velocity >= 64;
        updateSustainUI();
      } else if (note === 123) {
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
      recordLabel.textContent = 'Kayıt';

      if (notes.length > 0) {
        demoSelect.value = 'recorded';
        btnSaveRec.disabled = false;
        loadSelectedSongIntoPractice(false);
        setTextCached(lcdChord, 'chord', `Kayıt Tamamlandı (${notes.length} Nota)`);
        setTextCached(
          lcdNotes,
          'notes',
          'Başlat butonuna basarak kaydınızla pratik yapabilir veya MIDI olarak indirebilirsiniz'
        );
      } else {
        setTextCached(lcdChord, 'chord', 'Kayıt Durduruldu (Nota Yok)');
      }
    } else {
      setAppMode('free', false);
      highway.startRecording(performance.now());
      btnRecord.classList.add('recording');
      recordLabel.textContent = 'Bitir';
      modeBadge.textContent = '● KAYIT YAPILIYOR';
      updateLcdHud();
    }
  }

  function loadFileBytes(name, uint8) {
    try {
      const lower = name.toLowerCase();
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
      setTextCached(lcdChord, 'chord', 'Dosya Okunamadı');
      setTextCached(lcdNotes, 'notes', err.message || 'Geçersiz dosya formatı');
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
    panicAllNotesOff();
    practice.seek(targetMs);
    updateTimelineUI(true);
    updateLcdHud();
  };

  if (timelineWrap) {
    timelineWrap.addEventListener('pointerdown', (e) => {
      isScrubbingTimeline = true;
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
        timelineHoverTime.style.left = `${(ratio * 100).toFixed(2)}%`;
        timelineHoverTime.textContent = formatTime(hoverMs);
      }

      if (isScrubbingTimeline) {
        handleTimelineScrub(e.clientX);
      }
    });

    const stopScrubbing = (e) => {
      if (isScrubbingTimeline) {
        isScrubbingTimeline = false;
        try { timelineWrap.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    timelineWrap.addEventListener('pointerup', stopScrubbing);
    timelineWrap.addEventListener('pointercancel', stopScrubbing);
    window.addEventListener('pointerup', stopScrubbing);
  }

  timelineSlider.addEventListener('input', () => {
    if (!practice.durationMs) return;
    const ratio = Number(timelineSlider.value) / 1000;
    const targetMs = ratio * practice.durationMs;
    panicAllNotesOff();
    practice.seek(targetMs);
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
    sumTitle.textContent = rep.title;
    const modeNames = {
      wait: 'Tuş Beklemeli Pratik',
      rhythm: 'Akan Ritim Pratiği',
      listen: 'İzle & Dinle'
    };
    const handNames = { both: 'İki El', right: 'Sağ El', left: 'Sol El' };
    sumSub.textContent = `${modeNames[rep.mode] || 'Pratik'} • ${handNames[rep.handMode]}`;
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
  btnRetryPractice.addEventListener('click', () => {
    summaryModal.hidden = true;
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
    persistSettings();
  });

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
      for (let i = 0; i < ev.noteOn.length; i++) {
        const n = ev.noteOn[i];
        triggerNoteOn(n.midi, n.velocity, 'playback', n.hand);
      }

      if (state.metronomeEnabled && !practice.isWaitingForInput && practice.songTimeMs >= 0) {
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

    const levelPct = Math.round(audio.getOutputLevel() * 100);
    if (domCache.vuPct !== levelPct) {
      domCache.vuPct = levelPct;
      vuFill.style.width = `${levelPct}%`;
      if (hudVuFill) hudVuFill.style.width = `${levelPct}%`;
    }

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
