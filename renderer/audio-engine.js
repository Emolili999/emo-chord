(function (root) {
  'use strict';

  const MAX_POLYPHONY = 64;

  function finiteOr(val, fallback) {
    if (val === null || val === undefined || val === '') return fallback;
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }

  const INSTRUMENTS = {
    grand_piano: {
      id: 'grand_piano',
      name: '🎹 Konser Piyanosu (Grand Piano)',
      attack: 0.005,
      decayBase: 4.8,
      sustainLevel: 0.18,
      release: 0.65,
      hammerGain: 0.20,
      detuneCents: 2.2
    },
    acoustic_piano: {
      id: 'acoustic_piano',
      name: '🎙️ Akustik Duvar Piyanosu (Upright)',
      attack: 0.005,
      decayBase: 4.0,
      sustainLevel: 0.16,
      release: 0.58,
      hammerGain: 0.30,
      detuneCents: 2.8
    },
    electric_piano: {
      id: 'electric_piano',
      name: '✨ Elektrik Piyano (Rhodes EP)',
      attack: 0.006,
      decayBase: 4.0,
      sustainLevel: 0.25,
      release: 0.68,
      hammerGain: 0.14,
      detuneCents: 3.5
    },
    violin: {
      id: 'violin',
      name: '🎻 Solo Keman (Violin Solo)',
      attack: 0.065,
      decayBase: 6.0,
      sustainLevel: 0.85,
      release: 0.32,
      hammerGain: 0.0,
      detuneCents: 1.8
    },
    string_ensemble: {
      id: 'string_ensemble',
      name: '🎻 Yaylı Orkestra (String Ensemble)',
      attack: 0.18,
      decayBase: 8.0,
      sustainLevel: 0.90,
      release: 0.65,
      hammerGain: 0.0,
      detuneCents: 5.5
    },
    acoustic_guitar: {
      id: 'acoustic_guitar',
      name: '🎸 Akustik Gitar (Acoustic Guitar)',
      attack: 0.003,
      decayBase: 3.5,
      sustainLevel: 0.06,
      release: 0.45,
      hammerGain: 0.26,
      detuneCents: 1.8
    },
    flute: {
      id: 'flute',
      name: '🪈 Klasik Flüt (Concert Flute)',
      attack: 0.055,
      decayBase: 5.5,
      sustainLevel: 0.82,
      release: 0.22,
      hammerGain: 0.0,
      detuneCents: 1.2
    },
    celesta: {
      id: 'celesta',
      name: '🔔 Çelesta & Çanlar (Celesta / Chimes)',
      attack: 0.002,
      decayBase: 4.5,
      sustainLevel: 0.04,
      release: 0.92,
      hammerGain: 0.24,
      detuneCents: 1.0
    },
    drawbar_organ: {
      id: 'drawbar_organ',
      name: '⛪ Hammond / Kilise Orgu',
      attack: 0.018,
      decayBase: 8.0,
      sustainLevel: 0.85,
      release: 0.28,
      hammerGain: 0.03,
      detuneCents: 1.5
    },
    music_box: {
      id: 'music_box',
      name: '💎 Kristal Müzik Kutusu',
      attack: 0.002,
      decayBase: 3.2,
      sustainLevel: 0.08,
      release: 0.78,
      hammerGain: 0.26,
      detuneCents: 1.0
    },
    neon_synth: {
      id: 'neon_synth',
      name: '🎛️ Neon Synth',
      attack: 0.012,
      decayBase: 3.0,
      sustainLevel: 0.55,
      release: 0.55,
      hammerGain: 0.04,
      detuneCents: 7.0
    },
    synth_pad: {
      id: 'synth_pad',
      name: '🌌 Sıcak Atmosferik Pad (Synth Pad)',
      attack: 0.28,
      decayBase: 7.0,
      sustainLevel: 0.85,
      release: 0.75,
      hammerGain: 0.0,
      detuneCents: 8.5
    }
  };

  class EmochordAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.dryGain = null;
      this.wetGain = null;
      this.convolver = null;
      this.analyser = null;
      this._analyserBuf = null;
      this.noiseBuffer = null;
      this.periodicWaves = {};

      this.instrument = 'grand_piano';
      this.volume = 0.85;
      this.reverbAmount = 0.28;
      this.sustainPedal = false;

      this.activeVoices = new Map();
      this.sustainedVoices = new Map();
      this.releasingVoices = new Map();
      this.vitalPresets = new Map();
      this.vitalPeriodicWaves = new Map();
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      }

      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx({ latencyHint: 'interactive' });

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -14;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.002;
      this.compressor.release.value = 0.18;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.75;
      this._analyserBuf = new Uint8Array(this.analyser.frequencyBinCount);

      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this._createReverbImpulse(2.2, 2.7);

      this.dryGain.connect(this.compressor);
      this.convolver.connect(this.wetGain);
      this.wetGain.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this._updateReverbMix();
      this.noiseBuffer = this._createHammerNoiseBuffer();
      this._buildPeriodicWaves();

      return this.ctx;
    }

    _createReverbImpulse(durationSec, decayRate) {
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * durationSec);
      const impulse = this.ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          const t = i / length;
          const env = Math.pow(1 - t, decayRate);
          const early = i < rate * 0.04 ? Math.sin(i * 0.08) * 0.35 : 1;
          data[i] = (Math.random() * 2 - 1) * env * early * 0.5;
        }
      }
      return impulse;
    }

    _createHammerNoiseBuffer() {
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * 0.045);
      const buf = this.ctx.createBuffer(1, length, rate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, 2.4);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      return buf;
    }

    _buildPeriodicWaves() {
      const makeWave = (amps) => {
        const real = new Float32Array(amps.length + 1);
        const imag = new Float32Array(amps.length + 1);
        for (let i = 0; i < amps.length; i++) {
          imag[i + 1] = amps[i];
        }
        return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      };

      this.periodicWaves.pianoLow = makeWave([1.0, 0.78, 0.52, 0.36, 0.25, 0.18, 0.12, 0.09, 0.06, 0.04, 0.025, 0.015]);
      this.periodicWaves.pianoMid = makeWave([1.0, 0.55, 0.32, 0.20, 0.12, 0.07, 0.04, 0.02, 0.01]);
      this.periodicWaves.pianoHigh = makeWave([1.0, 0.30, 0.12, 0.04, 0.01]);
      this.periodicWaves.uprightLow = makeWave([1.0, 0.85, 0.62, 0.40, 0.26, 0.16, 0.09, 0.05, 0.025, 0.012]);
      this.periodicWaves.uprightMid = makeWave([1.0, 0.68, 0.38, 0.22, 0.12, 0.06, 0.025, 0.01]);
      this.periodicWaves.uprightHigh = makeWave([1.0, 0.35, 0.12, 0.03, 0.008]);
      this.periodicWaves.epiano = makeWave([1.0, 0.28, 0.16, 0.08, 0.03, 0.11, 0.02]);
      this.periodicWaves.violin = makeWave([1.0, 0.78, 0.58, 0.44, 0.34, 0.26, 0.20, 0.14, 0.10, 0.06, 0.04, 0.02]);
      this.periodicWaves.strings = makeWave([1.0, 0.68, 0.46, 0.32, 0.22, 0.15, 0.10, 0.06, 0.03, 0.015]);
      this.periodicWaves.guitar = makeWave([1.0, 0.82, 0.56, 0.38, 0.25, 0.15, 0.08, 0.04, 0.015]);
      this.periodicWaves.flute = makeWave([1.0, 0.22, 0.32, 0.06, 0.02, 0.008]);
      this.periodicWaves.organ = makeWave([0.9, 0.75, 0.65, 0.5, 0.0, 0.35, 0.0, 0.25]);
      this.periodicWaves.musicBox = makeWave([1.0, 0.08, 0.42, 0.05, 0.22, 0.02, 0.12]);
      this.periodicWaves.synthPad = makeWave([1.0, 0.55, 0.38, 0.28, 0.18, 0.12, 0.08, 0.04, 0.02]);
    }

    setInstrument(instrumentId) {
      if (INSTRUMENTS[instrumentId] || this.vitalPresets.has(instrumentId)) {
        this.instrument = instrumentId;
        return true;
      }
      return false;
    }

    addVitalPreset(preset) {
      if (!preset || !preset.id) return null;
      this.vitalPresets.set(preset.id, preset);
      this.vitalPeriodicWaves.delete(preset.id);
      if (this.ctx) {
        this._buildVitalOscWaves(preset);
      }
      return preset;
    }

    removeVitalPreset(presetId) {
      const removed = this.vitalPresets.delete(presetId);
      this.vitalPeriodicWaves.delete(presetId);
      if (this.instrument === presetId) {
        this.instrument = 'grand_piano';
      }
      return removed;
    }

    getVitalPresets() {
      return Array.from(this.vitalPresets.values());
    }

    _buildVitalOscWaves(preset) {
      if (!this.ctx || typeof this.ctx.createPeriodicWave !== 'function' || !preset) return null;
      if (this.vitalPeriodicWaves.has(preset.id)) {
        return this.vitalPeriodicWaves.get(preset.id);
      }
      const waves = {};
      for (const osc of preset.oscillators || []) {
        if (osc.harmonics && Array.isArray(osc.harmonics.real) && Array.isArray(osc.harmonics.imag)) {
          try {
            const real = new Float32Array(osc.harmonics.real);
            const imag = new Float32Array(osc.harmonics.imag);
            waves[osc.index] = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
          } catch {
            waves[osc.index] = null;
          }
        }
      }
      this.vitalPeriodicWaves.set(preset.id, waves);
      return waves;
    }

    setVolume(val) {
      const num = finiteOr(val, NaN);
      if (!Number.isFinite(num)) return;
      this.volume = Math.max(0, Math.min(1.2, num));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.015);
      }
    }

    setReverb(val) {
      const num = finiteOr(val, NaN);
      if (!Number.isFinite(num)) return;
      this.reverbAmount = Math.max(0, Math.min(1, num));
      this._updateReverbMix();
    }

    _updateReverbMix() {
      if (!this.dryGain || !this.wetGain || !this.ctx) return;
      const now = this.ctx.currentTime;
      const wet = this.reverbAmount * 0.65;
      const dry = 1 - this.reverbAmount * 0.22;
      this.dryGain.gain.setTargetAtTime(dry, now, 0.02);
      this.wetGain.gain.setTargetAtTime(wet, now, 0.02);
    }

    setSustain(enabled) {
      const next = !!enabled;
      if (this.sustainPedal && !next) {
        for (const [midi, voice] of this.sustainedVoices.entries()) {
          this._fadeOutVoice(voice);
          this.sustainedVoices.delete(midi);
        }
      }
      this.sustainPedal = next;
      return this.sustainPedal;
    }

    _enforcePolyphonyLimit() {
      const total = this.activeVoices.size + this.sustainedVoices.size;
      if (total < MAX_POLYPHONY) return;

      // Önce sustain ile tutulan en eski sesi, yoksa en eski aktif sesi sönümle
      if (this.sustainedVoices.size > 0) {
        const oldestKey = this.sustainedVoices.keys().next().value;
        const v = this.sustainedVoices.get(oldestKey);
        this.sustainedVoices.delete(oldestKey);
        this._fadeOutVoice(v, 0.04);
      } else if (this.activeVoices.size > 0) {
        const oldestKey = this.activeVoices.keys().next().value;
        const v = this.activeVoices.get(oldestKey);
        this.activeVoices.delete(oldestKey);
        this._fadeOutVoice(v, 0.04);
      }
    }

    noteOn(midi, velocity = 100) {
      const ctx = this.init();
      if (!ctx) return;

      // Aynı tuşa art arda basıldığında önceki sesi sert kesmek yerine yumuşakça sönümle (legato retrigger)
      if (this.activeVoices.has(midi)) {
        this._fadeOutVoice(this.activeVoices.get(midi), 0.16);
        this.activeVoices.delete(midi);
      }
      if (this.sustainedVoices.has(midi)) {
        this._fadeOutVoice(this.sustainedVoices.get(midi), 0.16);
        this.sustainedVoices.delete(midi);
      }
      if (this.releasingVoices.has(midi)) {
        const relVoice = this.releasingVoices.get(midi);
        this.releasingVoices.delete(midi);
        this._QuickCrossfadeReleasingVoice(relVoice, 0.14);
      }

      this._enforcePolyphonyLimit();

      const vitalPreset = this.vitalPresets.get(this.instrument);
      if (vitalPreset) {
        this._playVitalNote(ctx, midi, velocity, vitalPreset);
        return;
      }

      const preset = INSTRUMENTS[this.instrument] || INSTRUMENTS.grand_piano;
      const now = ctx.currentTime;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const normVel = Math.max(0.08, Math.min(1, velocity / 127));
      const gainLevel = Math.pow(normVel, 1.35) * 0.34;

      const pitchFactor = Math.max(0.32, Math.min(1.65, Math.pow(2, (60 - midi) / 28)));
      const decayTime = preset.decayBase * pitchFactor;
      const releaseTime = preset.release * Math.max(0.75, Math.min(1.35, pitchFactor));

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(gainLevel, now + preset.attack);
      voiceGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, gainLevel * preset.sustainLevel),
        now + preset.attack + decayTime
      );

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const sustainCutoff = Math.min(12000, Math.max(450, freq * 2.4));
      const peakCutoff = Math.max(sustainCutoff + 20, Math.min(18000, freq * (4.5 + normVel * 9.5)));
      filter.frequency.setValueAtTime(peakCutoff, now);
      filter.frequency.exponentialRampToValueAtTime(sustainCutoff, now + Math.min(1.8, decayTime * 0.55));
      filter.Q.value = 0.7;
      if (this.instrument === 'neon_synth') {
        filter.Q.value = 2.4;
      } else if (this.instrument === 'violin') {
        filter.Q.value = 1.9;
        const violinCutoff = Math.min(9500, Math.max(1400, freq * 3.6));
        filter.frequency.setValueAtTime(violinCutoff, now);
      } else if (this.instrument === 'string_ensemble') {
        filter.Q.value = 0.95;
        const stringsCutoff = Math.min(11500, Math.max(1200, freq * 3.8));
        filter.frequency.setValueAtTime(stringsCutoff, now);
      } else if (this.instrument === 'acoustic_guitar') {
        filter.Q.value = 1.1;
        const guitarSustain = Math.max(450, freq * 1.8);
        const guitarPeak = Math.max(guitarSustain + 20, Math.min(16000, freq * (6.0 + normVel * 7.0)));
        filter.frequency.setValueAtTime(guitarPeak, now);
        filter.frequency.exponentialRampToValueAtTime(guitarSustain, now + 0.30);
      } else if (this.instrument === 'flute') {
        filter.Q.value = 1.2;
        filter.frequency.setValueAtTime(Math.min(9000, freq * 3.4), now);
      } else if (this.instrument === 'acoustic_piano') {
        filter.Q.value = 0.85;
        const uprightSustain = Math.min(8500, Math.max(380, freq * 2.0));
        const uprightPeak = Math.max(uprightSustain + 20, Math.min(14500, freq * (3.6 + normVel * 7.0)));
        filter.frequency.setValueAtTime(uprightPeak, now);
        filter.frequency.exponentialRampToValueAtTime(uprightSustain, now + Math.min(1.6, decayTime * 0.5));
      } else if (this.instrument === 'synth_pad') {
        filter.Q.value = 1.5;
        filter.frequency.setValueAtTime(Math.max(480, freq * 1.6), now);
        filter.frequency.linearRampToValueAtTime(Math.min(7500, freq * 4.2), now + preset.attack + 0.4);
        filter.frequency.exponentialRampToValueAtTime(Math.max(650, freq * 2.2), now + preset.attack + decayTime);
      }

      let outputNode = filter;
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        const pan = Math.max(-0.55, Math.min(0.55, ((midi - 60) / 44) * 0.55));
        panner.pan.setValueAtTime(pan, now);
        filter.connect(panner);
        outputNode = panner;
      }

      outputNode.connect(voiceGain);
      voiceGain.connect(this.dryGain);
      voiceGain.connect(this.convolver);

      const oscs = [];
      const osc1 = ctx.createOscillator();
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.setValueAtTime(preset.detuneCents, now);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.48;

      if (this.instrument === 'grand_piano') {
        const wave =
          midi < 48
            ? this.periodicWaves.pianoLow
            : midi < 76
            ? this.periodicWaves.pianoMid
            : this.periodicWaves.pianoHigh;
        osc1.setPeriodicWave(wave);
        osc2.setPeriodicWave(wave);
      } else if (this.instrument === 'acoustic_piano') {
        const wave =
          midi < 48
            ? this.periodicWaves.uprightLow
            : midi < 76
            ? this.periodicWaves.uprightMid
            : this.periodicWaves.uprightHigh;
        osc1.setPeriodicWave(wave);
        osc2.setPeriodicWave(wave);
      } else if (this.instrument === 'electric_piano') {
        osc1.setPeriodicWave(this.periodicWaves.epiano);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 4, now);
        osc2Gain.gain.setValueAtTime(0.24 * normVel, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      } else if (this.instrument === 'violin') {
        osc1.setPeriodicWave(this.periodicWaves.violin);
        osc2.setPeriodicWave(this.periodicWaves.violin);
        osc2Gain.gain.value = 0.42;

        // Doğal keman vibrato LFO'su (tuşa basıldıktan 0.12s sonra yumuşakça devreye girer)
        const vLfo = ctx.createOscillator();
        const vLfoGain = ctx.createGain();
        vLfo.frequency.setValueAtTime(5.3, now);
        vLfoGain.gain.setValueAtTime(0, now);
        vLfoGain.gain.setValueAtTime(0, now + 0.12);
        vLfoGain.gain.linearRampToValueAtTime(Math.max(2.0, freq * 0.012), now + 0.42);
        vLfo.connect(vLfoGain);
        vLfoGain.connect(osc1.frequency);
        vLfoGain.connect(osc2.frequency);
        vLfo.start(now);
        oscs.push(vLfo);
      } else if (this.instrument === 'string_ensemble') {
        osc1.setPeriodicWave(this.periodicWaves.strings);
        osc2.setPeriodicWave(this.periodicWaves.strings);
        osc2Gain.gain.value = 0.52;

        // Orkestral derinlik için alt oktav (viyolonsel/kontrbas gövdesi)
        const osc3 = ctx.createOscillator();
        const osc3Gain = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(freq * 0.5, now);
        osc3Gain.gain.setValueAtTime(0.24 * normVel, now);
        osc3.connect(osc3Gain);
        osc3Gain.connect(filter);
        osc3.start(now);
        oscs.push(osc3);

        // Koro / Yaylı orkestra detune salınımı
        const sLfo = ctx.createOscillator();
        const sLfoGain = ctx.createGain();
        sLfo.frequency.setValueAtTime(0.65, now);
        sLfoGain.gain.setValueAtTime(3.2, now);
        sLfo.connect(sLfoGain);
        sLfoGain.connect(osc2.detune);
        sLfo.start(now);
        oscs.push(sLfo);
      } else if (this.instrument === 'acoustic_guitar') {
        osc1.setPeriodicWave(this.periodicWaves.guitar);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now);
        osc2Gain.gain.setValueAtTime(0.32 * normVel, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      } else if (this.instrument === 'flute') {
        osc1.setPeriodicWave(this.periodicWaves.flute);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now);
        osc2Gain.gain.value = 0.14;

        // Nefesli flüt doğal vibrato LFO'su
        const fLfo = ctx.createOscillator();
        const fLfoGain = ctx.createGain();
        fLfo.frequency.setValueAtTime(5.6, now);
        fLfoGain.gain.setValueAtTime(0, now);
        fLfoGain.gain.setValueAtTime(0, now + 0.14);
        fLfoGain.gain.linearRampToValueAtTime(Math.max(1.2, freq * 0.008), now + 0.45);
        fLfo.connect(fLfoGain);
        fLfoGain.connect(osc1.frequency);
        fLfo.start(now);
        oscs.push(fLfo);

        // Flüt üfleme / hava sesi
        if (this.noiseBuffer) {
          const breath = ctx.createBufferSource();
          breath.buffer = this.noiseBuffer;
          const bFilter = ctx.createBiquadFilter();
          bFilter.type = 'bandpass';
          bFilter.frequency.value = Math.min(4800, Math.max(1800, freq * 2.2));
          bFilter.Q.value = 1.6;
          const bGain = ctx.createGain();
          bGain.gain.setValueAtTime(0.045 * normVel, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          breath.connect(bFilter);
          bFilter.connect(bGain);
          bGain.connect(voiceGain);
          breath.start(now);
          oscs.push(breath);
        }
      } else if (this.instrument === 'celesta') {
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.756, now);
        osc2Gain.gain.setValueAtTime(0.36, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        // Çan ışıltısı (yüksek kısmi harmonik)
        const osc3 = ctx.createOscillator();
        const osc3Gain = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 5.404, now);
        osc3Gain.gain.setValueAtTime(0.20, now);
        osc3Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc3.connect(osc3Gain);
        osc3Gain.connect(filter);
        osc3.start(now);
        oscs.push(osc3);
      } else if (this.instrument === 'drawbar_organ') {
        osc1.setPeriodicWave(this.periodicWaves.organ);
        osc2.setPeriodicWave(this.periodicWaves.organ);
        osc2.frequency.setValueAtTime(freq * 0.5, now);
        osc2Gain.gain.value = 0.35;
      } else if (this.instrument === 'music_box') {
        osc1.setPeriodicWave(this.periodicWaves.musicBox);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 3, now);
        osc2Gain.gain.setValueAtTime(0.32, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      } else if (this.instrument === 'neon_synth') {
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc2Gain.gain.value = 0.65;
      } else if (this.instrument === 'synth_pad') {
        osc1.setPeriodicWave(this.periodicWaves.synthPad);
        osc2.type = 'sawtooth';
        osc2Gain.gain.value = 0.55;
      }

      // Ses tamamen durduğunda ses düğümünü grafikten ayır (setTimeout gerektirmez)
      osc1.onended = () => {
        if (this.releasingVoices.get(midi) === voice) {
          this.releasingVoices.delete(midi);
        }
        try {
          voiceGain.disconnect();
        } catch {}
      };

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);

      osc1.start(now);
      osc2.start(now);
      oscs.push(osc1, osc2);

      if (this.noiseBuffer && preset.hammerGain > 0) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.Q.value = 1.2;
        if (this.instrument === 'acoustic_piano') {
          noiseFilter.frequency.value = Math.min(4200, Math.max(450, freq * 1.8));
          noiseFilter.Q.value = 1.4;
        } else if (this.instrument === 'acoustic_guitar') {
          noiseFilter.frequency.value = Math.min(5200, Math.max(800, freq * 2.8));
          noiseFilter.Q.value = 1.8;
        } else if (this.instrument === 'celesta') {
          noiseFilter.frequency.value = Math.min(6000, Math.max(1200, freq * 3.2));
          noiseFilter.Q.value = 2.0;
        } else {
          noiseFilter.frequency.value = Math.min(5500, Math.max(600, freq * 2.2));
        }

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(preset.hammerGain * normVel * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(voiceGain);
        noise.start(now);
        oscs.push(noise);
      }

      const voice = {
        midi,
        freq,
        filter,
        voiceGain,
        oscs,
        releaseTime,
        stopped: false
      };
      this.activeVoices.set(midi, voice);
    }

    _playVitalNote(ctx, midi, velocity, preset) {
      const now = ctx.currentTime;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const normVel = Math.max(0.08, Math.min(1, velocity / 127));
      const env = preset.env || { attack: 0.015, decay: 1.2, sustain: 0.75, release: 0.35 };

      const gainLevel = Math.pow(normVel, 1.25) * 0.30;
      const attack = Math.max(0.002, finiteOr(env.attack, 0.015));
      const decay = Math.max(0.02, finiteOr(env.decay, 1.2));
      const sustain = Math.max(0.001, Math.min(1, finiteOr(env.sustain, 0.75)));
      const releaseTime = Math.max(0.02, finiteOr(env.release, 0.35));

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(gainLevel, now + attack);
      voiceGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, gainLevel * sustain),
        now + attack + decay
      );

      const filter = ctx.createBiquadFilter();
      const fCfg = preset.filter || { on: false };
      if (fCfg.on) {
        filter.type = fCfg.type || 'lowpass';
        const keytrackSemis = (midi - 60) * finiteOr(fCfg.keytrack, 0);
        const targetCutoff = Math.max(
          25,
          Math.min(18500, finiteOr(fCfg.cutoffHz, 4000) * Math.pow(2, keytrackSemis / 12))
        );
        filter.frequency.setValueAtTime(targetCutoff, now);
        filter.Q.value = Math.max(0.5, Math.min(12, finiteOr(fCfg.q, 1.0)));
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(18500, now);
        filter.Q.value = 0.7;
      }

      let outputNode = filter;
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        const pan = Math.max(-0.55, Math.min(0.55, ((midi - 60) / 44) * 0.45));
        panner.pan.setValueAtTime(pan, now);
        filter.connect(panner);
        outputNode = panner;
      }

      outputNode.connect(voiceGain);
      voiceGain.connect(this.dryGain);
      voiceGain.connect(this.convolver);

      const waves = this._buildVitalOscWaves(preset) || {};
      const oscs = [];
      let primaryOsc = null;

      const activeOscs = (preset.oscillators || []).filter((o) => o.on && o.level > 0.001);
      const totalLevel = activeOscs.reduce((sum, o) => sum + o.level, 0) + (preset.sub?.on ? preset.sub.level * 0.6 : 0);
      const normFactor = totalLevel > 1 ? 1 / totalLevel : 1;

      for (const oscCfg of activeOscs) {
        const oscFreq = 440 * Math.pow(2, (midi + (oscCfg.transpose || 0) - 69) / 12);
        const voicesCount = Math.min(5, Math.max(1, oscCfg.unisonVoices || 1));
        const maxDetuneCents = Math.min(45, (oscCfg.unisonDetune || 0) * 6.5);
        const perVoiceGain = (oscCfg.level * normFactor) / Math.sqrt(voicesCount);

        for (let v = 0; v < voicesCount; v++) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.frequency.setValueAtTime(oscFreq, now);

          const spread = voicesCount === 1 ? 0 : (v / (voicesCount - 1)) * 2 - 1;
          const detune = (oscCfg.tuneCents || 0) + spread * maxDetuneCents;
          if (detune !== 0 && osc.detune) {
            osc.detune.setValueAtTime(detune, now);
          }

          if (waves[oscCfg.index] && typeof osc.setPeriodicWave === 'function') {
            osc.setPeriodicWave(waves[oscCfg.index]);
          } else {
            osc.type = oscCfg.waveform || 'sawtooth';
          }

          oscGain.gain.value = perVoiceGain;
          osc.connect(oscGain);
          oscGain.connect(filter);
          osc.start(now);
          oscs.push(osc);
          if (!primaryOsc) primaryOsc = osc;
        }
      }

      if (preset.sub && preset.sub.on && preset.sub.level > 0.001) {
        const subMidi = midi + (preset.sub.octave || -1) * 12 + (preset.sub.transpose || 0);
        const subFreq = 440 * Math.pow(2, (subMidi - 69) / 12);
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = preset.sub.waveform || 'sine';
        subOsc.frequency.setValueAtTime(subFreq, now);
        subGain.gain.value = preset.sub.level * 0.6 * normFactor;
        subOsc.connect(subGain);
        subGain.connect(filter);
        subOsc.start(now);
        oscs.push(subOsc);
        if (!primaryOsc) primaryOsc = subOsc;
      }

      const voice = {
        midi,
        freq,
        filter,
        voiceGain,
        oscs,
        releaseTime,
        stopped: false
      };

      if (primaryOsc) {
        primaryOsc.onended = () => {
          if (this.releasingVoices.get(midi) === voice) {
            this.releasingVoices.delete(midi);
          }
          try {
            voiceGain.disconnect();
          } catch {}
        };
      }

      this.activeVoices.set(midi, voice);
    }

    noteOff(midi) {
      const voice = this.activeVoices.get(midi);
      if (!voice) return;
      this.activeVoices.delete(midi);

      if (this.sustainPedal) {
        this.sustainedVoices.set(midi, voice);
      } else {
        this._fadeOutVoice(voice);
      }
    }

    releaseAll() {
      for (const voice of this.activeVoices.values()) {
        this._fadeOutVoice(voice, 0.06);
      }
      this.activeVoices.clear();
      for (const voice of this.sustainedVoices.values()) {
        this._fadeOutVoice(voice, 0.06);
      }
      this.sustainedVoices.clear();
      for (const voice of this.releasingVoices.values()) {
        this._QuickCrossfadeReleasingVoice(voice, 0.04);
      }
      this.releasingVoices.clear();
    }

    _QuickCrossfadeReleasingVoice(voice, fadeSec = 0.14) {
      if (!voice || !this.ctx) return;
      const now = this.ctx.currentTime;
      try {
        const g = voice.voiceGain.gain;
        const cur = Math.max(0.0001, g.value);
        if (typeof g.cancelAndHoldAtTime === 'function') {
          g.cancelAndHoldAtTime(now);
        } else {
          g.cancelScheduledValues(now);
          g.setValueAtTime(cur, now);
        }
        g.exponentialRampToValueAtTime(0.0001, now + fadeSec);
      } catch {}
    }

    _fadeOutVoice(voice, customReleaseSec) {
      if (!voice || voice.stopped || !this.ctx) return;
      voice.stopped = true;
      const now = this.ctx.currentTime;
      const rel = customReleaseSec || voice.releaseTime || 0.55;
      if (!customReleaseSec && voice.midi !== undefined) {
        this.releasingVoices.set(voice.midi, voice);
      }
      try {
        const g = voice.voiceGain.gain;
        const currentGain = Math.max(0.0001, g.value);
        if (typeof g.cancelAndHoldAtTime === 'function') {
          g.cancelAndHoldAtTime(now);
        } else {
          g.cancelScheduledValues(now);
          g.setValueAtTime(currentGain, now);
        }

        if (!customReleaseSec && rel >= 0.22) {
          // İki aşamalı doğal piyano sönümlemesi:
          // 1) İlk aşamada keçe damper temasıyla yumuşak legato geçişi (notanın bıçak gibi kesilmesini önler)
          // 2) İkinci aşamada gövde rezonansının doğal ve akıcı sönümlenmesi
          const legatoCarrySec = Math.min(0.15, rel * 0.28);
          const midGain = Math.max(0.0001, currentGain * 0.58);
          g.linearRampToValueAtTime(midGain, now + legatoCarrySec);
          g.exponentialRampToValueAtTime(0.0001, now + rel);
        } else {
          g.exponentialRampToValueAtTime(0.0001, now + rel);
        }

        // Damper keçe etkisi: tiz harmonikleri yumuşakça sönümle
        if (voice.filter && voice.freq) {
          const f = voice.filter.frequency;
          const curFreq = Math.max(300, f.value || voice.freq * 2.4);
          if (typeof f.cancelAndHoldAtTime === 'function') {
            f.cancelAndHoldAtTime(now);
          } else {
            f.cancelScheduledValues(now);
            f.setValueAtTime(curFreq, now);
          }
          f.exponentialRampToValueAtTime(Math.max(260, voice.freq * 1.35), now + rel);
        }

        const stopAt = now + rel + 0.04;
        for (let i = 0; i < voice.oscs.length; i++) {
          try {
            voice.oscs[i].stop(stopAt);
          } catch {}
        }
      } catch {}
    }

    getOutputLevel() {
      if (!this.analyser || !this._analyserBuf) return 0;
      const buf = this._analyserBuf;
      this.analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      return Math.min(1, rms * 3.2);
    }

    playMetronomeTick(isDownbeat = false) {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isDownbeat ? 1180 : 820, now);
      osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 520 : 380, now + 0.035);

      gain.gain.setValueAtTime(isDownbeat ? 0.22 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

      osc.onended = () => {
        try {
          gain.disconnect();
        } catch {}
      };

      osc.connect(gain);
      gain.connect(this.dryGain);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  root.EmochordAudio = {
    INSTRUMENTS,
    EmochordAudioEngine
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.EmochordAudio;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
