(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.EmochordHighway = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const THEMES = {
    classic: {
      id: 'classic',
      name: 'Klasik (Yeşil & Mavi)',
      rightWhite: { fill: '#65e827', top: '#b8ff8a', border: '#2a8f00', glow: 'rgba(101, 232, 39, 0.65)' },
      rightBlack: { fill: '#3cb512', top: '#8bf562', border: '#1d6300', glow: 'rgba(60, 181, 18, 0.65)' },
      leftWhite: { fill: '#29b6f6', top: '#9be7ff', border: '#0277bd', glow: 'rgba(41, 182, 246, 0.65)' },
      leftBlack: { fill: '#0388d1', top: '#5eb8ff', border: '#01579b', glow: 'rgba(3, 136, 209, 0.65)' }
    },
    aurora: {
      id: 'aurora',
      name: 'Aurora Fresh (Su Yeşili & Gök Mavisi)',
      rightWhite: { fill: '#2dd4bf', top: '#99f6e4', border: '#0d9488', glow: 'rgba(45, 212, 191, 0.7)' },
      rightBlack: { fill: '#14b8a6', top: '#5eead4', border: '#0f766e', glow: 'rgba(20, 184, 166, 0.7)' },
      leftWhite: { fill: '#38bdf8', top: '#bae6fd', border: '#0284c7', glow: 'rgba(56, 189, 248, 0.7)' },
      leftBlack: { fill: '#0ea5e9', top: '#7dd3fc', border: '#0369a1', glow: 'rgba(14, 165, 233, 0.7)' }
    },
    luminary: {
      id: 'luminary',
      name: 'Luminary Studio (Elektrik Mor & Mercan)',
      rightWhite: { fill: '#a855f7', top: '#e9d5ff', border: '#7e22ce', glow: 'rgba(168, 85, 247, 0.7)' },
      rightBlack: { fill: '#9333ea', top: '#d8b4fe', border: '#6b21a8', glow: 'rgba(147, 51, 234, 0.7)' },
      leftWhite: { fill: '#fb7185', top: '#fecdd3', border: '#e11d48', glow: 'rgba(251, 113, 133, 0.7)' },
      leftBlack: { fill: '#f43f5e', top: '#fda4af', border: '#be123c', glow: 'rgba(244, 63, 94, 0.7)' }
    },
    cyberpunk: {
      id: 'cyberpunk',
      name: 'Cyberpunk Neon (Camgöbeği & Macenta)',
      rightWhite: { fill: '#00f5d4', top: '#a8fff2', border: '#009985', glow: 'rgba(0, 245, 212, 0.7)' },
      rightBlack: { fill: '#00bbf9', top: '#8ae2ff', border: '#006da8', glow: 'rgba(0, 187, 249, 0.7)' },
      leftWhite: { fill: '#ff2a85', top: '#ff99c2', border: '#a30046', glow: 'rgba(255, 42, 133, 0.7)' },
      leftBlack: { fill: '#b5179e', top: '#f779e3', border: '#69065b', glow: 'rgba(181, 23, 158, 0.7)' }
    },
    emerald: {
      id: 'emerald',
      name: 'Zümrüt & Altın',
      rightWhite: { fill: '#10b981', top: '#6ee7b7', border: '#047857', glow: 'rgba(16, 185, 129, 0.65)' },
      rightBlack: { fill: '#059669', top: '#34d399', border: '#065f46', glow: 'rgba(5, 150, 105, 0.65)' },
      leftWhite: { fill: '#f59e0b', top: '#fde68a', border: '#b45309', glow: 'rgba(245, 158, 11, 0.65)' },
      leftBlack: { fill: '#d97706', top: '#fbbf24', border: '#92400e', glow: 'rgba(217, 119, 6, 0.65)' }
    },
    fire: {
      id: 'fire',
      name: 'Ateş & Kor (Turuncu & Kehribar)',
      rightWhite: { fill: '#ff6b1a', top: '#ffc299', border: '#b33c00', glow: 'rgba(255, 107, 26, 0.7)' },
      rightBlack: { fill: '#e03e00', top: '#ff8c66', border: '#802300', glow: 'rgba(224, 62, 0, 0.7)' },
      leftWhite: { fill: '#ffbe0b', top: '#fff0ad', border: '#b38300', glow: 'rgba(255, 190, 11, 0.65)' },
      leftBlack: { fill: '#fb5607', top: '#ffaa80', border: '#9c3300', glow: 'rgba(251, 86, 7, 0.65)' }
    },
    rainbow: {
      id: 'rainbow',
      name: 'Kromatik Gökkuşağı (Her Nota Farklı Renk)',
      pitchColors: [
        { fill: '#ff3355', top: '#ff99aa', border: '#99001a', glow: 'rgba(255, 51, 85, 0.65)' },
        { fill: '#ff6622', top: '#ffb391', border: '#993300', glow: 'rgba(255, 102, 34, 0.65)' },
        { fill: '#ffaa00', top: '#ffd685', border: '#996600', glow: 'rgba(255, 170, 0, 0.65)' },
        { fill: '#e6d600', top: '#fff78a', border: '#807700', glow: 'rgba(230, 214, 0, 0.65)' },
        { fill: '#88dd00', top: '#caff75', border: '#4b7a00', glow: 'rgba(136, 221, 0, 0.65)' },
        { fill: '#22cc55', top: '#8affad', border: '#0f732d', glow: 'rgba(34, 204, 85, 0.65)' },
        { fill: '#00cca3', top: '#80ffdf', border: '#00735c', glow: 'rgba(0, 204, 163, 0.65)' },
        { fill: '#00b8ff', top: '#8ae0ff', border: '#006891', glow: 'rgba(0, 184, 255, 0.65)' },
        { fill: '#3377ff', top: '#99bbff', border: '#113d99', glow: 'rgba(51, 119, 255, 0.65)' },
        { fill: '#7744ff', top: '#bba1ff', border: '#3e1999', glow: 'rgba(119, 68, 255, 0.65)' },
        { fill: '#bb33ff', top: '#e099ff', border: '#660f99', glow: 'rgba(187, 51, 255, 0.65)' },
        { fill: '#ff22aa', top: '#ff91d5', border: '#990a62', glow: 'rgba(255, 34, 170, 0.65)' }
      ]
    }
  };

  function getNoteColor(midi, isBlack, themeId = 'classic', splitMidi = 60, explicitHand = null) {
    const theme = THEMES[themeId] || THEMES.classic;
    if (theme.pitchColors) {
      const pc = ((midi % 12) + 12) % 12;
      return theme.pitchColors[pc];
    }
    const isRightHand = explicitHand ? explicitHand === 'right' : midi >= splitMidi;
    if (isRightHand) {
      return isBlack ? theme.rightBlack : theme.rightWhite;
    }
    return isBlack ? theme.leftBlack : theme.leftWhite;
  }

  class NoteHighwayState {
    constructor(options = {}) {
      this.pixelsPerSecond = options.pixelsPerSecond || 220;
      this.splitMidi = options.splitMidi || 60;
      this.risingNotes = [];
      this.activeByMidi = new Map();
      this._nextId = 1;

      this.isRecording = false;
      this.recordStartTime = 0;
      this.recordedNotes = [];
      this._recordActiveByMidi = new Map();
    }

    setSpeed(pixelsPerSecond) {
      const v = Number(pixelsPerSecond);
      if (Number.isFinite(v) && v >= 60 && v <= 700) {
        this.pixelsPerSecond = v;
      }
    }

    noteOn(midi, velocity = 100, nowMs = Date.now(), source = 'user') {
      if (this.activeByMidi.has(midi)) {
        this.noteOff(midi, nowMs);
      }

      const bar = {
        id: this._nextId++,
        midi,
        velocity: Math.max(1, Math.min(127, Math.round(velocity))),
        startTime: nowMs,
        endTime: null,
        source,
        hand: midi >= this.splitMidi ? 'right' : 'left'
      };
      this.risingNotes.push(bar);
      this.activeByMidi.set(midi, bar);

      if (this.isRecording) {
        this._recordActiveByMidi.set(midi, {
          midi,
          velocity: bar.velocity,
          startTimeMs: Math.max(0, nowMs - this.recordStartTime),
          hand: bar.hand
        });
      }
      return bar;
    }

    noteOff(midi, nowMs = Date.now()) {
      const bar = this.activeByMidi.get(midi);
      if (bar) {
        bar.endTime = Math.max(bar.startTime + 25, nowMs);
        this.activeByMidi.delete(midi);
      }

      if (this.isRecording && this._recordActiveByMidi.has(midi)) {
        const rec = this._recordActiveByMidi.get(midi);
        this._recordActiveByMidi.delete(midi);
        const endRel = Math.max(rec.startTimeMs + 40, nowMs - this.recordStartTime);
        this.recordedNotes.push({
          midi: rec.midi,
          velocity: rec.velocity,
          startTimeMs: Math.round(rec.startTimeMs),
          durationMs: Math.round(endRel - rec.startTimeMs),
          hand: rec.hand
        });
      }
      return bar || null;
    }

    releaseAll(nowMs = Date.now()) {
      for (const midi of Array.from(this.activeByMidi.keys())) {
        this.noteOff(midi, nowMs);
      }
    }

    clear() {
      this.risingNotes = [];
      this.activeByMidi.clear();
    }

    computeRisingRects(nowMs, highwayHeight) {
      const pps = this.pixelsPerSecond;
      const visible = [];
      const keep = [];

      for (let i = 0; i < this.risingNotes.length; i++) {
        const n = this.risingNotes[i];
        const elapsedStartSec = Math.max(0, (nowMs - n.startTime) / 1000);
        const yTop = highwayHeight - elapsedStartSec * pps;
        let yBottom;
        if (n.endTime === null) {
          yBottom = highwayHeight;
        } else {
          const elapsedEndSec = Math.max(0, (nowMs - n.endTime) / 1000);
          yBottom = highwayHeight - elapsedEndSec * pps;
        }

        if (yBottom < -30) continue;
        keep.push(n);

        const clampedTop = Math.max(-20, yTop);
        const clampedBottom = Math.min(highwayHeight, yBottom);
        const height = Math.max(6, clampedBottom - clampedTop);

        visible.push({
          id: n.id,
          midi: n.midi,
          velocity: n.velocity,
          hand: n.hand,
          isHeld: n.endTime === null,
          y: clampedTop,
          height,
          rawTop: yTop,
          rawBottom: yBottom
        });
      }

      this.risingNotes = keep;
      return visible;
    }

    computeFallingRects(sequence, songTimeMs, highwayHeight, options = {}) {
      if (!Array.isArray(sequence) || sequence.length === 0) return [];
      const pps = this.pixelsPerSecond;
      const waitingIds = options.waitingIds || null;
      const isTargetFn = options.isTargetFn || null;
      const visible = [];

      for (let i = 0; i < sequence.length; i++) {
        const n = sequence[i];
        const endMs = n.startTimeMs + n.durationMs;
        if (endMs < songTimeMs - 40) continue;

        const timeUntilStartSec = (n.startTimeMs - songTimeMs) / 1000;
        const timeUntilEndSec = (endMs - songTimeMs) / 1000;

        const yBottom = highwayHeight - timeUntilStartSec * pps;
        // Dizi startTimeMs'e göre sıralı olduğu için ekranın üst sınırından daha ilerideki ilk notada döngüden çıkabiliriz
        if (yBottom < -20) break;

        const yTop = highwayHeight - timeUntilEndSec * pps;
        if (yTop > highwayHeight + 20) continue;

        const clampedBottom = Math.min(highwayHeight, yBottom);
        const clampedTop = Math.max(-20, yTop);
        const height = Math.max(6, clampedBottom - clampedTop);
        const isHitting = songTimeMs >= n.startTimeMs && songTimeMs <= endMs;
        const isWaiting = waitingIds ? waitingIds.has(n.id ?? i) : false;
        const isTarget = isTargetFn ? isTargetFn(n) : true;

        visible.push({
          index: i,
          id: n.id ?? i,
          midi: n.midi,
          velocity: n.velocity || 100,
          hand: n.hand || (n.midi >= this.splitMidi ? 'right' : 'left'),
          isHitting,
          isWaiting,
          isTarget,
          completed: !!n.completed,
          missed: !!n.missed,
          y: clampedTop,
          height
        });
      }

      return visible;
    }

    startRecording(nowMs = Date.now()) {
      this.isRecording = true;
      this.recordStartTime = nowMs;
      this.recordedNotes = [];
      this._recordActiveByMidi.clear();
    }

    stopRecording(nowMs = Date.now()) {
      if (!this.isRecording) return this.recordedNotes;
      for (const [, rec] of this._recordActiveByMidi.entries()) {
        const endRel = Math.max(rec.startTimeMs + 40, nowMs - this.recordStartTime);
        this.recordedNotes.push({
          midi: rec.midi,
          velocity: rec.velocity,
          startTimeMs: Math.round(rec.startTimeMs),
          durationMs: Math.round(endRel - rec.startTimeMs),
          hand: rec.hand
        });
      }
      this._recordActiveByMidi.clear();
      this.isRecording = false;
      this.recordedNotes.sort((a, b) => a.startTimeMs - b.startTimeMs);
      return this.recordedNotes;
    }
  }

  const DEMO_SONGS = {
    twinkle: {
      id: 'twinkle',
      title: 'Başlangıç Pratiği – Küçük Yıldız (Twinkle Twinkle)',
      bpm: 105,
      notes: [
        { midi: 60, startTimeMs: 0, durationMs: 440, velocity: 92, hand: 'right' },
        { midi: 48, startTimeMs: 0, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 60, startTimeMs: 500, durationMs: 440, velocity: 92, hand: 'right' },
        { midi: 67, startTimeMs: 1000, durationMs: 440, velocity: 95, hand: 'right' },
        { midi: 52, startTimeMs: 1000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 67, startTimeMs: 1500, durationMs: 440, velocity: 95, hand: 'right' },
        { midi: 69, startTimeMs: 2000, durationMs: 440, velocity: 98, hand: 'right' },
        { midi: 53, startTimeMs: 2000, durationMs: 900, velocity: 80, hand: 'left' },
        { midi: 69, startTimeMs: 2500, durationMs: 440, velocity: 98, hand: 'right' },
        { midi: 67, startTimeMs: 3000, durationMs: 900, velocity: 94, hand: 'right' },
        { midi: 52, startTimeMs: 3000, durationMs: 900, velocity: 78, hand: 'left' },

        { midi: 65, startTimeMs: 4000, durationMs: 440, velocity: 92, hand: 'right' },
        { midi: 50, startTimeMs: 4000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 65, startTimeMs: 4500, durationMs: 440, velocity: 92, hand: 'right' },
        { midi: 64, startTimeMs: 5000, durationMs: 440, velocity: 92, hand: 'right' },
        { midi: 48, startTimeMs: 5000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 64, startTimeMs: 5500, durationMs: 440, velocity: 92, hand: 'right' },
        { midi: 62, startTimeMs: 6000, durationMs: 440, velocity: 90, hand: 'right' },
        { midi: 43, startTimeMs: 6000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 62, startTimeMs: 6500, durationMs: 440, velocity: 90, hand: 'right' },
        { midi: 60, startTimeMs: 7000, durationMs: 950, velocity: 96, hand: 'right' },
        { midi: 48, startTimeMs: 7000, durationMs: 950, velocity: 82, hand: 'left' }
      ]
    },
    fur_elise: {
      id: 'fur_elise',
      title: 'Beethoven – Für Elise (Tema)',
      bpm: 125,
      notes: [
        { midi: 76, startTimeMs: 0, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 75, startTimeMs: 250, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 76, startTimeMs: 500, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 75, startTimeMs: 750, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 76, startTimeMs: 1000, durationMs: 240, velocity: 94, hand: 'right' },
        { midi: 71, startTimeMs: 1250, durationMs: 240, velocity: 90, hand: 'right' },
        { midi: 74, startTimeMs: 1500, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 72, startTimeMs: 1750, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 69, startTimeMs: 2000, durationMs: 700, velocity: 96, hand: 'right' },
        { midi: 45, startTimeMs: 2000, durationMs: 450, velocity: 78, hand: 'left' },
        { midi: 52, startTimeMs: 2250, durationMs: 450, velocity: 75, hand: 'left' },
        { midi: 57, startTimeMs: 2500, durationMs: 450, velocity: 78, hand: 'left' },

        { midi: 60, startTimeMs: 2750, durationMs: 240, velocity: 85, hand: 'right' },
        { midi: 64, startTimeMs: 3000, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 69, startTimeMs: 3250, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 71, startTimeMs: 3500, durationMs: 700, velocity: 95, hand: 'right' },
        { midi: 40, startTimeMs: 3500, durationMs: 450, velocity: 78, hand: 'left' },
        { midi: 52, startTimeMs: 3750, durationMs: 450, velocity: 75, hand: 'left' },
        { midi: 56, startTimeMs: 4000, durationMs: 450, velocity: 78, hand: 'left' },

        { midi: 64, startTimeMs: 4250, durationMs: 240, velocity: 85, hand: 'right' },
        { midi: 68, startTimeMs: 4500, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 71, startTimeMs: 4750, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 72, startTimeMs: 5000, durationMs: 700, velocity: 96, hand: 'right' },
        { midi: 45, startTimeMs: 5000, durationMs: 450, velocity: 78, hand: 'left' },
        { midi: 52, startTimeMs: 5250, durationMs: 450, velocity: 75, hand: 'left' },
        { midi: 57, startTimeMs: 5500, durationMs: 450, velocity: 78, hand: 'left' },

        { midi: 64, startTimeMs: 5750, durationMs: 240, velocity: 86, hand: 'right' },
        { midi: 76, startTimeMs: 6000, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 75, startTimeMs: 6250, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 76, startTimeMs: 6500, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 75, startTimeMs: 6750, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 76, startTimeMs: 7000, durationMs: 240, velocity: 94, hand: 'right' },
        { midi: 71, startTimeMs: 7250, durationMs: 240, velocity: 90, hand: 'right' },
        { midi: 74, startTimeMs: 7500, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 72, startTimeMs: 7750, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 69, startTimeMs: 8000, durationMs: 700, velocity: 98, hand: 'right' },
        { midi: 45, startTimeMs: 8000, durationMs: 450, velocity: 80, hand: 'left' },
        { midi: 52, startTimeMs: 8250, durationMs: 450, velocity: 76, hand: 'left' },
        { midi: 57, startTimeMs: 8500, durationMs: 450, velocity: 80, hand: 'left' },

        { midi: 60, startTimeMs: 8750, durationMs: 240, velocity: 86, hand: 'right' },
        { midi: 64, startTimeMs: 9000, durationMs: 240, velocity: 88, hand: 'right' },
        { midi: 69, startTimeMs: 9250, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 71, startTimeMs: 9500, durationMs: 650, velocity: 94, hand: 'right' },
        { midi: 40, startTimeMs: 9500, durationMs: 450, velocity: 78, hand: 'left' },
        { midi: 52, startTimeMs: 9750, durationMs: 450, velocity: 76, hand: 'left' },
        { midi: 56, startTimeMs: 10000, durationMs: 450, velocity: 78, hand: 'left' },

        { midi: 64, startTimeMs: 10250, durationMs: 240, velocity: 86, hand: 'right' },
        { midi: 72, startTimeMs: 10500, durationMs: 240, velocity: 92, hand: 'right' },
        { midi: 71, startTimeMs: 10750, durationMs: 240, velocity: 90, hand: 'right' },
        { midi: 69, startTimeMs: 11000, durationMs: 1100, velocity: 102, hand: 'right' },
        { midi: 45, startTimeMs: 11000, durationMs: 1100, velocity: 88, hand: 'left' },
        { midi: 57, startTimeMs: 11000, durationMs: 1100, velocity: 84, hand: 'left' }
      ]
    },
    ode_to_joy: {
      id: 'ode_to_joy',
      title: 'Beethoven – Neşeye Övgü (Ode to Joy)',
      bpm: 120,
      notes: [
        { midi: 64, startTimeMs: 0, durationMs: 450, velocity: 95, hand: 'right' },
        { midi: 48, startTimeMs: 0, durationMs: 900, velocity: 82, hand: 'left' },
        { midi: 55, startTimeMs: 0, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 64, startTimeMs: 500, durationMs: 450, velocity: 95, hand: 'right' },
        { midi: 65, startTimeMs: 1000, durationMs: 450, velocity: 98, hand: 'right' },
        { midi: 48, startTimeMs: 1000, durationMs: 900, velocity: 80, hand: 'left' },
        { midi: 67, startTimeMs: 1500, durationMs: 450, velocity: 102, hand: 'right' },

        { midi: 67, startTimeMs: 2000, durationMs: 450, velocity: 102, hand: 'right' },
        { midi: 43, startTimeMs: 2000, durationMs: 900, velocity: 82, hand: 'left' },
        { midi: 55, startTimeMs: 2000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 65, startTimeMs: 2500, durationMs: 450, velocity: 96, hand: 'right' },
        { midi: 64, startTimeMs: 3000, durationMs: 450, velocity: 94, hand: 'right' },
        { midi: 43, startTimeMs: 3000, durationMs: 900, velocity: 80, hand: 'left' },
        { midi: 62, startTimeMs: 3500, durationMs: 450, velocity: 90, hand: 'right' },

        { midi: 60, startTimeMs: 4000, durationMs: 450, velocity: 94, hand: 'right' },
        { midi: 48, startTimeMs: 4000, durationMs: 900, velocity: 82, hand: 'left' },
        { midi: 55, startTimeMs: 4000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 60, startTimeMs: 4500, durationMs: 450, velocity: 94, hand: 'right' },
        { midi: 62, startTimeMs: 5000, durationMs: 450, velocity: 96, hand: 'right' },
        { midi: 48, startTimeMs: 5000, durationMs: 900, velocity: 80, hand: 'left' },
        { midi: 64, startTimeMs: 5500, durationMs: 450, velocity: 98, hand: 'right' },

        { midi: 64, startTimeMs: 6000, durationMs: 680, velocity: 100, hand: 'right' },
        { midi: 43, startTimeMs: 6000, durationMs: 900, velocity: 82, hand: 'left' },
        { midi: 55, startTimeMs: 6000, durationMs: 900, velocity: 78, hand: 'left' },
        { midi: 62, startTimeMs: 6750, durationMs: 220, velocity: 88, hand: 'right' },
        { midi: 62, startTimeMs: 7000, durationMs: 900, velocity: 92, hand: 'right' },
        { midi: 43, startTimeMs: 7000, durationMs: 900, velocity: 80, hand: 'left' }
      ]
    },
    turkish_march: {
      id: 'turkish_march',
      title: 'Mozart – Türk Marşı (Rondo Alla Turca)',
      bpm: 132,
      notes: [
        { midi: 71, startTimeMs: 0, durationMs: 180, velocity: 92, hand: 'right' },
        { midi: 69, startTimeMs: 180, durationMs: 180, velocity: 88, hand: 'right' },
        { midi: 68, startTimeMs: 360, durationMs: 180, velocity: 88, hand: 'right' },
        { midi: 69, startTimeMs: 540, durationMs: 180, velocity: 90, hand: 'right' },
        { midi: 72, startTimeMs: 720, durationMs: 620, velocity: 98, hand: 'right' },
        { midi: 45, startTimeMs: 720, durationMs: 300, velocity: 82, hand: 'left' },
        { midi: 57, startTimeMs: 1080, durationMs: 300, velocity: 78, hand: 'left' },
        { midi: 60, startTimeMs: 1080, durationMs: 300, velocity: 78, hand: 'left' },

        { midi: 74, startTimeMs: 1440, durationMs: 180, velocity: 92, hand: 'right' },
        { midi: 72, startTimeMs: 1620, durationMs: 180, velocity: 88, hand: 'right' },
        { midi: 71, startTimeMs: 1800, durationMs: 180, velocity: 88, hand: 'right' },
        { midi: 72, startTimeMs: 1980, durationMs: 180, velocity: 90, hand: 'right' },
        { midi: 76, startTimeMs: 2160, durationMs: 620, velocity: 100, hand: 'right' },
        { midi: 45, startTimeMs: 2160, durationMs: 300, velocity: 82, hand: 'left' },
        { midi: 57, startTimeMs: 2520, durationMs: 300, velocity: 78, hand: 'left' },
        { midi: 60, startTimeMs: 2520, durationMs: 300, velocity: 78, hand: 'left' },

        { midi: 77, startTimeMs: 2880, durationMs: 180, velocity: 94, hand: 'right' },
        { midi: 76, startTimeMs: 3060, durationMs: 180, velocity: 90, hand: 'right' },
        { midi: 75, startTimeMs: 3240, durationMs: 180, velocity: 90, hand: 'right' },
        { midi: 76, startTimeMs: 3420, durationMs: 180, velocity: 92, hand: 'right' },
        { midi: 83, startTimeMs: 3600, durationMs: 180, velocity: 98, hand: 'right' },
        { midi: 81, startTimeMs: 3780, durationMs: 180, velocity: 94, hand: 'right' },
        { midi: 80, startTimeMs: 3960, durationMs: 180, velocity: 94, hand: 'right' },
        { midi: 81, startTimeMs: 4140, durationMs: 180, velocity: 96, hand: 'right' },
        { midi: 84, startTimeMs: 4320, durationMs: 700, velocity: 104, hand: 'right' },
        { midi: 45, startTimeMs: 4320, durationMs: 700, velocity: 86, hand: 'left' },
        { midi: 57, startTimeMs: 4320, durationMs: 700, velocity: 82, hand: 'left' }
      ]
    },
    bach_prelude: {
      id: 'bach_prelude',
      title: 'Bach – C Majör Prelüd (BWV 846)',
      bpm: 112,
      notes: (() => {
        const patterns = [
          [48, 52, 55, 60, 64],
          [48, 50, 57, 62, 65],
          [47, 50, 55, 62, 65],
          [48, 52, 55, 60, 64]
        ];
        const out = [];
        let t = 0;
        const step = 180;
        for (const pat of patterns) {
          for (let rep = 0; rep < 2; rep++) {
            out.push({ midi: pat[0], startTimeMs: t, durationMs: step * 7.5, velocity: 84, hand: 'left' });
            out.push({ midi: pat[1], startTimeMs: t + step, durationMs: step * 6.5, velocity: 80, hand: 'left' });
            const seq = [pat[2], pat[3], pat[4], pat[2], pat[3], pat[4]];
            seq.forEach((m, i) => {
              out.push({ midi: m, startTimeMs: t + step * (i + 2), durationMs: step * 0.92, velocity: 88 + (i % 3) * 4, hand: 'right' });
            });
            t += step * 8;
          }
        }
        return out;
      })()
    }
  };

  return {
    THEMES,
    DEMO_SONGS,
    getNoteColor,
    NoteHighwayState
  };
});
