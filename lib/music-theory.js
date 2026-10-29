(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.EmochordMusic = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_NAMES_TR = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

  const KEYBOARD_RANGES = {
    '88': { id: '88', name: '88 Tuş (Tam Piyano A0–C8)', minMidi: 21, maxMidi: 108 },
    '61': { id: '61', name: '61 Tuş (Standart Org C2–C7)', minMidi: 36, maxMidi: 96 },
    '49': { id: '49', name: '49 Tuş (Stüdyo C2–C6)', minMidi: 36, maxMidi: 84 },
    '37': { id: '37', name: '37 Tuş (Kompakt C3–C6)', minMidi: 48, maxMidi: 84 }
  };

  // Fiziksel klavye tuş kodları (KeyboardEvent.code) -> baz oktava göre yarım ses ofseti.
  const PC_CODE_TO_SEMITONE = {
    // Alt sıra: C3 (0) .. E4 (16)
    KeyZ: { offset: 0, label: 'Z' },
    KeyS: { offset: 1, label: 'S' },
    KeyX: { offset: 2, label: 'X' },
    KeyD: { offset: 3, label: 'D' },
    KeyC: { offset: 4, label: 'C' },
    KeyV: { offset: 5, label: 'V' },
    KeyG: { offset: 6, label: 'G' },
    KeyB: { offset: 7, label: 'B' },
    KeyH: { offset: 8, label: 'H' },
    KeyN: { offset: 9, label: 'N' },
    KeyJ: { offset: 10, label: 'J' },
    KeyM: { offset: 11, label: 'M' },
    Comma: { offset: 12, label: 'Ö/,' },
    KeyL: { offset: 13, label: 'L' },
    Period: { offset: 14, label: 'Ç/.' },
    Semicolon: { offset: 15, label: 'Ş/;' },
    Slash: { offset: 16, label: './' },

    // Üst sıra: C4 (12) .. G5 (31)
    KeyQ: { offset: 12, label: 'Q' },
    Digit2: { offset: 13, label: '2' },
    KeyW: { offset: 14, label: 'W' },
    Digit3: { offset: 15, label: '3' },
    KeyE: { offset: 16, label: 'E' },
    KeyR: { offset: 17, label: 'R' },
    Digit5: { offset: 18, label: '5' },
    KeyT: { offset: 19, label: 'T' },
    Digit6: { offset: 20, label: '6' },
    KeyY: { offset: 21, label: 'Y' },
    Digit7: { offset: 22, label: '7' },
    KeyU: { offset: 23, label: 'U' },
    KeyI: { offset: 24, label: 'I' },
    Digit9: { offset: 25, label: '9' },
    KeyO: { offset: 26, label: 'O' },
    Digit0: { offset: 27, label: '0' },
    KeyP: { offset: 28, label: 'P' },
    BracketLeft: { offset: 29, label: 'Ğ/[' },
    Equal: { offset: 30, label: '=' },
    BracketRight: { offset: 31, label: 'Ü/]' }
  };

  function isBlackKey(midi) {
    const pitchClass = ((midi % 12) + 12) % 12;
    return BLACK_SEMITONES.has(pitchClass);
  }

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function getNoteInfo(midi) {
    const m = Math.max(0, Math.min(127, Math.round(midi)));
    const pitchClass = m % 12;
    const octave = Math.floor(m / 12) - 1;
    const name = NOTE_NAMES_SHARP[pitchClass];
    const nameTr = NOTE_NAMES_TR[pitchClass];
    return {
      midi: m,
      pitchClass,
      octave,
      name,
      fullName: `${name}${octave}`,
      nameTr,
      fullNameTr: `${nameTr}${octave}`,
      isBlack: BLACK_SEMITONES.has(pitchClass),
      frequency: midiToFrequency(m)
    };
  }

  // Bir şarkıdaki notaların tamamını kapsayan en uygun klavye boyutunu bulur
  function recommendRangeForNotes(notes, currentRangeId = '61') {
    if (!Array.isArray(notes) || notes.length === 0) return currentRangeId;
    let minM = 127;
    let maxM = 0;
    for (let i = 0; i < notes.length; i++) {
      const m = notes[i].midi;
      if (m < minM) minM = m;
      if (m > maxM) maxM = m;
    }
    const cur = KEYBOARD_RANGES[currentRangeId] || KEYBOARD_RANGES['61'];
    if (minM >= cur.minMidi && maxM <= cur.maxMidi) {
      return currentRangeId;
    }
    for (const id of ['37', '49', '61', '88']) {
      const r = KEYBOARD_RANGES[id];
      if (minM >= r.minMidi && maxM <= r.maxMidi) return id;
    }
    return '88';
  }

  const BLACK_KEY_SHIFT = {
    1: -0.07,
    3: 0.07,
    6: -0.08,
    8: 0.0,
    10: 0.08
  };

  function buildKeybedLayout(minMidi = 21, maxMidi = 108, totalWidth = 1280) {
    const lo = Math.max(0, Math.min(127, Math.round(minMidi)));
    const hi = Math.max(lo, Math.min(127, Math.round(maxMidi)));

    let whiteCount = 0;
    for (let m = lo; m <= hi; m++) {
      if (!isBlackKey(m)) whiteCount++;
    }
    whiteCount = Math.max(1, whiteCount);
    const whiteKeyWidth = totalWidth / whiteCount;
    const blackKeyWidth = whiteKeyWidth * 0.62;

    const keys = [];
    const byMidi = new Map();
    let whiteIdx = 0;

    for (let m = lo; m <= hi; m++) {
      const info = getNoteInfo(m);
      if (!info.isBlack) {
        const x = whiteIdx * whiteKeyWidth;
        const keyObj = {
          ...info,
          whiteIndex: whiteIdx,
          x,
          width: whiteKeyWidth,
          centerX: x + whiteKeyWidth * 0.5,
          laneX: x + 1,
          laneWidth: Math.max(2, whiteKeyWidth - 2)
        };
        keys.push(keyObj);
        byMidi.set(m, keyObj);
        whiteIdx++;
      } else {
        const boundaryX = whiteIdx * whiteKeyWidth;
        const shift = (BLACK_KEY_SHIFT[info.pitchClass] || 0) * whiteKeyWidth;
        const x = boundaryX - blackKeyWidth * 0.5 + shift;
        const keyObj = {
          ...info,
          whiteIndex: whiteIdx - 0.5,
          x,
          width: blackKeyWidth,
          centerX: x + blackKeyWidth * 0.5,
          laneX: x + 0.5,
          laneWidth: Math.max(2, blackKeyWidth - 1)
        };
        keys.push(keyObj);
        byMidi.set(m, keyObj);
      }
    }

    return {
      minMidi: lo,
      maxMidi: hi,
      totalWidth,
      whiteCount,
      whiteKeyWidth,
      blackKeyWidth,
      keys,
      whiteKeys: keys.filter((k) => !k.isBlack),
      blackKeys: keys.filter((k) => k.isBlack),
      byMidi
    };
  }

  function pcCodeToMidi(code, baseOctave = 3, transpose = 0) {
    const entry = PC_CODE_TO_SEMITONE[code];
    if (!entry) return null;
    const baseMidi = (baseOctave + 1) * 12;
    const midi = baseMidi + entry.offset + transpose;
    if (midi < 21 || midi > 108) return null;
    return midi;
  }

  function getPcKeyLabelsByMidi(baseOctave = 3, transpose = 0) {
    const map = new Map();
    const baseMidi = (baseOctave + 1) * 12;
    for (const entry of Object.values(PC_CODE_TO_SEMITONE)) {
      const midi = baseMidi + entry.offset + transpose;
      if (midi >= 21 && midi <= 108) {
        map.set(midi, entry.label);
      }
    }
    return map;
  }

  const CHORD_PATTERNS = [
    { intervals: [0, 4, 7], suffix: 'Majör', short: '' },
    { intervals: [0, 3, 7], suffix: 'Minör', short: 'm' },
    { intervals: [0, 4, 7, 11], suffix: 'Maj7', short: 'maj7' },
    { intervals: [0, 4, 7, 10], suffix: 'Dominant 7', short: '7' },
    { intervals: [0, 3, 7, 10], suffix: 'Minör 7', short: 'm7' },
    { intervals: [0, 2, 4, 7], suffix: 'add9', short: 'add9' },
    { intervals: [0, 2, 3, 7], suffix: 'm(add9)', short: 'madd9' },
    { intervals: [0, 2, 7], suffix: 'Sus2', short: 'sus2' },
    { intervals: [0, 5, 7], suffix: 'Sus4', short: 'sus4' },
    { intervals: [0, 3, 6], suffix: 'Diminished', short: 'dim' },
    { intervals: [0, 3, 6, 9], suffix: 'Dim7', short: 'dim7' },
    { intervals: [0, 3, 6, 10], suffix: 'm7b5 (Yarı Dim)', short: 'm7b5' },
    { intervals: [0, 4, 8], suffix: 'Augmented', short: 'aug' },
    { intervals: [0, 4, 7, 9], suffix: 'Majör 6', short: '6' },
    { intervals: [0, 3, 7, 9], suffix: 'Minör 6', short: 'm6' },
    { intervals: [0, 4, 10], suffix: 'Dominant 7', short: '7' },
    { intervals: [0, 4, 11], suffix: 'Maj7', short: 'maj7' },
    { intervals: [0, 3, 10], suffix: 'Minör 7', short: 'm7' },
    { intervals: [0, 7], suffix: 'Power (5)', short: '5' },
    { intervals: [0, 4], suffix: 'Majör 3\'lü', short: 'M3' },
    { intervals: [0, 3], suffix: 'Minör 3\'lü', short: 'm3' }
  ];

  function detectChord(midiNotes, useTurkish = false) {
    const sorted = Array.from(new Set(midiNotes))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    if (sorted.length === 0) return null;

    const names = useTurkish ? NOTE_NAMES_TR : NOTE_NAMES_SHARP;
    if (sorted.length === 1) {
      const info = getNoteInfo(sorted[0]);
      return {
        root: useTurkish ? info.nameTr : info.name,
        label: useTurkish ? `${info.fullNameTr} (Tek Nota)` : `${info.fullName} (Tek Nota)`,
        notesCount: 1
      };
    }

    const pitchClasses = Array.from(new Set(sorted.map((n) => ((n % 12) + 12) % 12)));
    const bassPc = ((sorted[0] % 12) + 12) % 12;

    if (pitchClasses.length === 1) {
      const rootName = names[bassPc];
      return {
        root: rootName,
        label: `${rootName} Oktav`,
        notesCount: sorted.length
      };
    }

    const candidates = [bassPc, ...pitchClasses.filter((pc) => pc !== bassPc)];
    for (const rootPc of candidates) {
      const rel = pitchClasses
        .map((pc) => (pc - rootPc + 12) % 12)
        .sort((a, b) => a - b);

      for (const pat of CHORD_PATTERNS) {
        if (
          pat.intervals.length === rel.length &&
          pat.intervals.every((v, idx) => v === rel[idx])
        ) {
          const rootName = names[rootPc];
          const bassName = names[bassPc];
          const slash = rootPc !== bassPc && rel.length >= 3 ? ` / ${bassName}` : '';
          return {
            root: rootName,
            quality: pat.suffix,
            label: `${rootName} ${pat.suffix}${slash}`,
            notesCount: sorted.length
          };
        }
      }
    }

    const rootName = names[bassPc];
    return {
      root: rootName,
      quality: 'Çoklu Ses',
      label: `${rootName} Akoru (${sorted.length} ses)`,
      notesCount: sorted.length
    };
  }

  return {
    NOTE_NAMES_SHARP,
    NOTE_NAMES_TR,
    BLACK_SEMITONES,
    KEYBOARD_RANGES,
    PC_CODE_TO_SEMITONE,
    isBlackKey,
    midiToFrequency,
    getNoteInfo,
    recommendRangeForNotes,
    buildKeybedLayout,
    pcCodeToMidi,
    getPcKeyLabelsByMidi,
    detectChord
  };
});
