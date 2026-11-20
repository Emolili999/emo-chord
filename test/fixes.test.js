const test = require('node:test');
const assert = require('node:assert/strict');

const { EmochordAudioEngine } = require('../renderer/audio-engine');
const EmochordI18n = require('../renderer/i18n');
const music = require('../lib/music-theory');
const highwayLib = require('../lib/note-highway');
const { parseMidiBuffer, writeMidiBuffer } = require('../lib/midi-parser');
const { PracticeEngine } = require('../lib/practice-engine');

// Visualizer yüklemeden önce bağımlılıkları globalThis'e bağla (window olmadan)
globalThis.EmochordMusic = music;
globalThis.EmochordHighway = highwayLib;
globalThis.EmochordI18n = EmochordI18n;
const { NoteFlowVisualizer } = require('../renderer/visualizer');

function createAudioMockEngine({ withCancelAndHold = true } = {}) {
  const engine = new EmochordAudioEngine();
  const createdFilters = [];
  const createdGains = [];
  const createdOscs = [];

  const makeParam = (initial = 0) => {
    const calls = [];
    const param = {
      value: initial,
      calls,
      setValueAtTime(v, t) {
        if (!Number.isFinite(v) || !Number.isFinite(t)) {
          throw new TypeError(`Invalid AudioParam value/time: ${v}, ${t}`);
        }
        calls.push({ fn: 'setValueAtTime', v, t });
      },
      linearRampToValueAtTime(v, t) {
        if (!Number.isFinite(v) || !Number.isFinite(t)) {
          throw new TypeError(`Invalid AudioParam value/time: ${v}, ${t}`);
        }
        calls.push({ fn: 'linearRampToValueAtTime', v, t });
      },
      exponentialRampToValueAtTime(v, t) {
        if (!Number.isFinite(v) || !Number.isFinite(t) || v <= 0) {
          throw new TypeError(`Invalid exponentialRamp value/time: ${v}, ${t}`);
        }
        calls.push({ fn: 'exponentialRampToValueAtTime', v, t });
      },
      setTargetAtTime(v, t, tc) {
        if (!Number.isFinite(v) || !Number.isFinite(t) || !Number.isFinite(tc)) {
          throw new TypeError(`Invalid setTargetAtTime: ${v}, ${t}, ${tc}`);
        }
        calls.push({ fn: 'setTargetAtTime', v, t, tc });
      },
      cancelScheduledValues(t) {
        calls.push({ fn: 'cancelScheduledValues', t });
      }
    };
    if (withCancelAndHold) {
      param.cancelAndHoldAtTime = (t) => {
        calls.push({ fn: 'cancelAndHoldAtTime', t });
      };
    }
    return param;
  };

  engine.ctx = {
    currentTime: 1.0,
    sampleRate: 44100,
    state: 'running',
    createGain() {
      const node = { gain: makeParam(1.0), connect() {}, disconnect() {} };
      createdGains.push(node);
      return node;
    },
    createBiquadFilter() {
      const node = {
        type: 'lowpass',
        frequency: makeParam(350),
        Q: makeParam(1),
        connect() {},
        disconnect() {}
      };
      createdFilters.push(node);
      return node;
    },
    createOscillator() {
      const node = {
        type: 'sine',
        frequency: makeParam(440),
        detune: makeParam(0),
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
        setPeriodicWave() {},
        onended: null
      };
      createdOscs.push(node);
      return node;
    },
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        disconnect() {},
        start() {},
        stop() {}
      };
    },
    createStereoPanner() {
      return { pan: makeParam(0), connect() {}, disconnect() {} };
    },
    createPeriodicWave(real, imag) {
      return { real, imag };
    }
  };

  engine.masterGain = { gain: makeParam(0.85), connect() {}, disconnect() {} };
  engine.dryGain = { gain: makeParam(0.9), connect() {}, disconnect() {} };
  engine.wetGain = { gain: makeParam(0.18), connect() {}, disconnect() {} };
  engine.convolver = { connect() {}, disconnect() {} };
  engine.noiseBuffer = { length: 1024 };
  engine.periodicWaves = new Proxy({}, { get: () => ({ mockWave: true }) });

  return { engine, createdFilters, createdGains, createdOscs };
}

test('AudioEngine: noiseFilter Q değeri acoustic_piano, acoustic_guitar ve celesta için ezilmemeli', () => {
  const cases = [
    ['acoustic_piano', 1.4],
    ['acoustic_guitar', 1.8],
    ['celesta', 2.0],
    ['grand_piano', 1.2]
  ];
  for (const [inst, expectedQ] of cases) {
    const { engine, createdFilters } = createAudioMockEngine();
    engine.setInstrument(inst);
    engine.noteOn(60, 100);
    const bandpass = createdFilters.find((f) => f.type === 'bandpass');
    assert.ok(bandpass, `${inst} için bandpass gürültü filtresi oluşturulmalı`);
    assert.equal(bandpass.Q.value, expectedQ, `${inst} Q değeri ${expectedQ} olmalı`);
  }
});

test('AudioEngine: düşük perdeli notalarda (MIDI 21) peakCutoff >= sustainCutoff + 20 olmalı', () => {
  const { engine, createdFilters } = createAudioMockEngine();
  engine.setInstrument('grand_piano');
  engine.noteOn(21, 15);
  const lowpass = createdFilters.find((f) => f.type === 'lowpass');
  assert.ok(lowpass);
  const setPeak = lowpass.frequency.calls.find((c) => c.fn === 'setValueAtTime');
  const rampSustain = lowpass.frequency.calls.find((c) => c.fn === 'exponentialRampToValueAtTime');
  assert.ok(setPeak && rampSustain);
  assert.ok(
    setPeak.v >= rampSustain.v + 20,
    `peakCutoff (${setPeak.v}) >= sustainCutoff + 20 (${rampSustain.v + 20}) olmalı`
  );
});

test('AudioEngine: _fadeOutVoice cancelAndHoldAtTime varken setValueAtTime(1.0) ile sesi sıçratmamalı', () => {
  const { engine } = createAudioMockEngine({ withCancelAndHold: true });
  engine.noteOn(60, 90);
  const voice = engine.activeVoices.get(60);
  voice.voiceGain.gain.calls.length = 0;

  engine.noteOff(60);
  const fnNames = voice.voiceGain.gain.calls.map((c) => c.fn);
  assert.equal(fnNames[0], 'cancelAndHoldAtTime');
  assert.ok(!fnNames.includes('setValueAtTime'), 'cancelAndHoldAtTime sonrası setValueAtTime çağrılmamalı');

  // cancelAndHoldAtTime yoksa else dalında setValueAtTime çağrılmalı
  const { engine: legacyEngine } = createAudioMockEngine({ withCancelAndHold: false });
  legacyEngine.noteOn(62, 90);
  const legacyVoice = legacyEngine.activeVoices.get(62);
  legacyVoice.voiceGain.gain.calls.length = 0;
  legacyEngine.noteOff(62);
  const legacyFns = legacyVoice.voiceGain.gain.calls.map((c) => c.fn);
  assert.equal(legacyFns[0], 'cancelScheduledValues');
  assert.equal(legacyFns[1], 'setValueAtTime');
});

test('AudioEngine: releaseAll releasingVoices içindeki sesleri de hızlıca susturmalı', () => {
  const { engine } = createAudioMockEngine();
  engine.noteOn(60, 100);
  engine.noteOff(60);
  assert.equal(engine.releasingVoices.has(60), true);
  const relVoice = engine.releasingVoices.get(60);
  relVoice.voiceGain.gain.calls.length = 0;

  engine.releaseAll();
  assert.equal(engine.activeVoices.size, 0);
  assert.equal(engine.sustainedVoices.size, 0);
  assert.equal(engine.releasingVoices.size, 0);
  assert.ok(
    relVoice.voiceGain.gain.calls.some((c) => c.fn === 'exponentialRampToValueAtTime' && c.v === 0.0001),
    'releasingVoices içindeki sese crossfade uygulanmalı'
  );
});

test('AudioEngine: Vital preset env.sustain NaN/undefined/0 olduğunda AudioParam hatası vermemeli', () => {
  const { engine } = createAudioMockEngine();
  for (const sustainVal of [NaN, undefined, 'bad', null, 0]) {
    const id = `vital:test_${String(sustainVal)}`;
    engine.addVitalPreset({
      id,
      name: 'Edge Vital',
      env: { attack: 0.01, decay: 0.5, sustain: sustainVal, release: 0.2 },
      filter: { on: false },
      oscillators: [{ index: 1, on: true, level: 0.8, waveform: 'sine' }]
    });
    engine.setInstrument(id);
    assert.doesNotThrow(() => engine.noteOn(64, 100));
    const voice = engine.activeVoices.get(64);
    assert.ok(voice);
    const ramp = voice.voiceGain.gain.calls.find((c) => c.fn === 'exponentialRampToValueAtTime');
    assert.ok(ramp && Number.isFinite(ramp.v) && ramp.v > 0);
    engine.noteOff(64);
  }
});

test('AudioEngine: setVolume ve setReverb NaN/null/sınır dışı değerleri güvenle korumalı', () => {
  const { engine } = createAudioMockEngine();
  engine.setVolume(0.7);
  engine.setVolume(NaN);
  engine.setVolume(null);
  engine.setVolume('');
  assert.equal(engine.volume, 0.7);
  engine.setVolume(5);
  assert.equal(engine.volume, 1.2);
  engine.setVolume(-2);
  assert.equal(engine.volume, 0);

  engine.setReverb(0.4);
  engine.setReverb(NaN);
  engine.setReverb(undefined);
  assert.equal(engine.reverbAmount, 0.4);
  engine.setReverb(3);
  assert.equal(engine.reverbAmount, 1);
  engine.setReverb(-1);
  assert.equal(engine.reverbAmount, 0);
});

function createMockCanvas() {
  const fillTexts = [];
  const fillStyles = [];
  const moveTos = [];
  const gradStub = { addColorStop() {} };

  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    save() {},
    restore() {},
    scale() {},
    createLinearGradient() { return gradStub; },
    fillRect() { fillStyles.push(ctx.fillStyle); },
    beginPath() {},
    moveTo(x, y) { moveTos.push({ x, y }); },
    lineTo() {},
    quadraticCurveTo() {},
    closePath() {},
    fill() { fillStyles.push(ctx.fillStyle); },
    stroke() {},
    arc() {},
    fillText(text, x, y) { fillTexts.push({ text, x, y }); }
  };

  const canvas = {
    width: 1280,
    height: 720,
    getContext() { return ctx; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
  };

  return { canvas, ctx, fillTexts, fillStyles, moveTos };
}

test('Visualizer: window olmadan çalışmalı, siyah tuş wrongAlpha sönümlemeli, both modunda nota adı ve sürekli ok animasyonu', () => {
  const { canvas, fillTexts, fillStyles, moveTos } = createMockCanvas();
  const viz = new NoteFlowVisualizer(canvas, {
    minMidi: 36,
    maxMidi: 96,
    labelMode: 'both'
  });

  // PC klavye harfi atanmamış bir siyah tuş (örn: C#2 = MIDI 37) 'both' modunda nota adı göstermeli
  fillTexts.length = 0;
  viz.render(0.016, [], []);
  assert.ok(fillTexts.some((ft) => ft.text === 'C#'), 'PC tuşu olmayan siyah tuşta both modunda nota adı görünmeli');

  // Siyah tuşta wrongKeyFlashes sabit '#e11d48' yerine wrongAlpha ile rgba olarak sönümlenmeli
  viz.flashWrongKey(61);
  fillStyles.length = 0;
  viz.render(0.1, [], []);
  const wrongOverlay1 = fillStyles.find((s) => typeof s === 'string' && s.startsWith('rgba(225, 29, 72,'));
  assert.ok(wrongOverlay1, 'Siyah tuş yanlış flaşı rgba alpha ile çizilmeli');
  const alpha1 = parseFloat(wrongOverlay1.split(',')[3]);

  fillStyles.length = 0;
  viz.render(0.15, [], []);
  const wrongOverlay2 = fillStyles.find((s) => typeof s === 'string' && s.startsWith('rgba(225, 29, 72,'));
  assert.ok(wrongOverlay2);
  const alpha2 = parseFloat(wrongOverlay2.split(',')[3]);
  assert.ok(alpha2 < alpha1, `wrongAlpha zamanla azalmalı (${alpha2} < ${alpha1})`);

  // _pulsePhase 2*PI sarma sınırını geçerken bekleme oku konumu sıçramamalı
  viz.setWaitingNotes([{ midi: 60, hand: 'right' }]);
  viz._pulsePhase = Math.PI * 2 - 0.01;
  moveTos.length = 0;
  viz.render(0.001, [], []);
  const arrowBefore = moveTos[moveTos.length - 1];
  viz.render(0.004, [], []);
  const arrowAfter = moveTos[moveTos.length - 1];
  assert.ok(
    Math.abs(arrowAfter.y - arrowBefore.y) < 0.5,
    `Bekleme oku 2*PI sarma anında zıplamamalı (fark=${Math.abs(arrowAfter.y - arrowBefore.y)})`
  );
});

test('PracticeEngine: rhythm modu, pause/resume ve isFinished sonrası start ile yeniden başlatma', () => {
  const engine = new PracticeEngine({ mode: 'rhythm', handMode: 'both' });
  engine.loadSong({
    title: 'Rhythm Test',
    bpm: 120,
    notes: [
      { midi: 60, startTimeMs: 0, durationMs: 300, hand: 'right' },
      { midi: 64, startTimeMs: 400, durationMs: 300, hand: 'right' },
      { midi: 67, startTimeMs: 800, durationMs: 300, hand: 'right' }
    ]
  });

  engine.start();
  engine.seek(0);

  // Tam zamanında perfect
  const hit1 = engine.handleUserNoteOn(60);
  assert.equal(hit1.status, 'perfect');
  assert.equal(engine.stats.perfectHits, 1);

  // Pause & Resume testi
  engine.pause();
  assert.equal(engine.isPaused, true);
  assert.equal(engine.handleUserNoteOn(64).status, 'ignored');
  engine.resume();
  assert.equal(engine.isPaused, false);

  // 100ms gecikmeyle good (PERFECT_WINDOW_MS=75, RHYTHM_HIT_WINDOW_MS=185)
  engine.update(500); // songTimeMs = 500
  const hit2 = engine.handleUserNoteOn(64);
  assert.equal(hit2.status, 'good');
  assert.equal(engine.stats.goodHits, 1);

  // Yanlış nota
  const wrong = engine.handleUserNoteOn(61);
  assert.equal(wrong.status, 'wrong');
  assert.equal(engine.stats.streak, 0);

  // 67 kaçırılsın ve parça bitsin (durationMs=1100, bitiş >= 1600)
  const evEnd = engine.update(1200);
  assert.equal(evEnd.finished, true);
  assert.equal(engine.isFinished, true);
  assert.equal(engine.stats.missedNotes, 1);

  // Parça bittikten sonra start() çağrıldığında sıfırlanıp yeniden başlamalı
  engine.start();
  assert.equal(engine.isFinished, false);
  assert.equal(engine.isPlaying, true);
  assert.equal(engine.songTimeMs, -1600);
});

test('MIDI Parser, Music Theory & NoteHighway edge case kontrolleri', () => {
  // Music theory: KeyM = B3 (59)
  assert.equal(music.pcCodeToMidi('KeyM', 3, 0), 59);
  assert.equal(music.pcCodeToMidi('KeyZ', 0, -20), null);
  assert.equal(music.detectChord([]), null);
  assert.equal(music.detectChord([60], false).label, 'C4 (Tek Nota)');

  // MIDI parser: kesilmiş ve bozuk başlık hata fırlatmalı
  assert.throws(() => parseMidiBuffer(new Uint8Array([1, 2, 3, 4])));
  assert.throws(() => parseMidiBuffer(new Uint8Array(14)), /MThd/);

  // MIDI write -> parse round-trip tempo/notalar
  const mid = writeMidiBuffer({
    title: 'Edge Song',
    bpm: 140,
    notes: [{ midi: 60, startTimeMs: 0, durationMs: 400, velocity: 90, hand: 'right' }]
  });
  const parsed = parseMidiBuffer(mid);
  assert.equal(parsed.bpm, 140);
  assert.equal(parsed.notes.length, 1);

  // NoteHighway: releaseAll ve boş fallingRects
  const hw = new highwayLib.NoteHighwayState({ pixelsPerSecond: 200 });
  hw.noteOn(60, 100, 1000, 'pc');
  hw.releaseAll(1200);
  assert.equal(hw.activeByMidi.size, 0);
  assert.deepEqual(hw.computeFallingRects([], 0, 500), []);
});
