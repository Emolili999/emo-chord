(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.EmochordVitalParser = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_HARMONICS = 48;

  function clamp(val, min, max, fallback = min) {
    if (val === null || val === undefined || val === '' || typeof val === 'boolean') {
      return fallback;
    }
    const num = Number(val);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
  }

  function decodeBase64ToBytes(b64) {
    if (typeof b64 !== 'string' || !b64) return null;
    try {
      if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(b64, 'base64'));
      }
      if (typeof atob === 'function') {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        return bytes;
      }
    } catch {
      return null;
    }
    return null;
  }

  function computeHarmonicsFromWaveform(samples, maxHarmonics = MAX_HARMONICS) {
    if (!samples || samples.length < 16) return null;
    const N = samples.length;
    const count = Math.min(maxHarmonics, Math.floor(N / 2));
    const real = new Array(count + 1).fill(0);
    const imag = new Array(count + 1).fill(0);

    let maxMag = 0;
    for (let k = 1; k <= count; k++) {
      let re = 0;
      let im = 0;
      const step = (2 * Math.PI * k) / N;
      for (let n = 0; n < N; n++) {
        const angle = step * n;
        const s = samples[n];
        re += s * Math.cos(angle);
        im -= s * Math.sin(angle);
      }
      real[k] = (2 * re) / N;
      imag[k] = (2 * im) / N;
      const mag = Math.hypot(real[k], imag[k]);
      if (mag > maxMag) maxMag = mag;
    }

    if (maxMag < 1e-6) return null;
    for (let k = 1; k <= count; k++) {
      real[k] = Number((real[k] / maxMag).toFixed(5));
      imag[k] = Number((imag[k] / maxMag).toFixed(5));
    }
    return { real, imag };
  }

  function hasValidKeyframeData(kf) {
    if (!kf || typeof kf !== 'object') return false;
    if (typeof kf.wave_data === 'string' && kf.wave_data.length > 0) return true;
    if (Array.isArray(kf.harmonics) && kf.harmonics.length > 0) return true;
    return false;
  }

  function extractKeyframeHarmonics(kf) {
    // Vital wave_data: base64 encoded Float32Array (genellikle 2048 örnek)
    if (typeof kf.wave_data === 'string' && kf.wave_data.length > 0) {
      const bytes = decodeBase64ToBytes(kf.wave_data);
      if (bytes && bytes.byteLength >= 64) {
        const usableLen = bytes.byteLength - (bytes.byteLength % 4);
        const view = new DataView(bytes.buffer, bytes.byteOffset, usableLen);
        const sampleCount = Math.min(2048, usableLen / 4);
        const samples = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
          const val = view.getFloat32(i * 4, true);
          samples[i] = Number.isFinite(val) ? val : 0;
        }
        const harmonics = computeHarmonicsFromWaveform(samples);
        if (harmonics) return harmonics;
      }
    }

    // Alternatif olarak bazı Vital bileşenleri doğrudan harmonik dizisi içerebilir
    if (Array.isArray(kf.harmonics) && kf.harmonics.length > 0) {
      const len = Math.min(MAX_HARMONICS, kf.harmonics.length);
      const real = new Array(len + 1).fill(0);
      const imag = new Array(len + 1).fill(0);
      for (let i = 0; i < len; i++) {
        imag[i + 1] = clamp(kf.harmonics[i], -1, 1, 0);
      }
      return { real, imag };
    }

    return null;
  }

  function extractWavetableHarmonics(wavetable, waveFrame) {
    if (!wavetable || !Array.isArray(wavetable.groups)) return null;

    const targetPos = clamp(waveFrame, 0, 256, 0);
    const candidates = [];

    for (const group of wavetable.groups) {
      if (!group || !Array.isArray(group.components)) continue;
      for (const comp of group.components) {
        if (!comp || !Array.isArray(comp.keyframes)) continue;
        for (const kf of comp.keyframes) {
          if (!hasValidKeyframeData(kf)) continue;
          const pos = Number.isFinite(Number(kf.position)) ? Number(kf.position) : 0;
          candidates.push({ kf, dist: Math.abs(pos - targetPos) });
        }
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.dist - b.dist);

    for (const item of candidates) {
      const harmonics = extractKeyframeHarmonics(item.kf);
      if (harmonics) return harmonics;
    }

    return null;
  }

  function slugify(str) {
    const trMap = {
      ç: 'c', Ç: 'c',
      ğ: 'g', Ğ: 'g',
      ı: 'i', İ: 'i',
      ö: 'o', Ö: 'o',
      ş: 's', Ş: 's',
      ü: 'u', Ü: 'u'
    };
    const mapped = String(str || 'vital_preset')
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => trMap[ch] || ch)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    const clean = mapped
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return clean || 'vital_preset';
  }

  function midiPitchToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function inferFallbackWaveform(waveFrame, wavetableName) {
    const name = String(wavetableName || '').toLowerCase();
    if (name.includes('sine')) return 'sine';
    if (name.includes('tri')) return 'triangle';
    if (name.includes('square') || name.includes('pulse')) return 'square';
    if (name.includes('saw')) return 'sawtooth';
    const frame = clamp(waveFrame, 0, 256, 0);
    if (frame < 32) return 'sawtooth';
    if (frame < 96) return 'triangle';
    if (frame < 160) return 'square';
    return 'sawtooth';
  }

  function parseVitalPreset(input, fileName = '') {
    let parsed = input;
    if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
      const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
      const text = new TextDecoder('utf-8').decode(bytes);
      parsed = JSON.parse(text.trim());
    } else if (typeof input === 'string') {
      parsed = JSON.parse(input.trim());
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.settings || typeof parsed.settings !== 'object') {
      throw new Error('Geçerli bir .vital preset dosyası değil (settings alanı eksik).');
    }

    const s = parsed.settings;
    const rawName =
      (typeof parsed.preset_name === 'string' && parsed.preset_name.trim()) ||
      (fileName ? fileName.replace(/\.vital$/i, '').trim() : '') ||
      'Vital Preset';

    const wavetables = Array.isArray(s.wavetables)
      ? s.wavetables
      : Array.isArray(parsed.wavetables)
      ? parsed.wavetables
      : [];

    const oscillators = [];
    for (let i = 1; i <= 3; i++) {
      const prefix = `osc_${i}_`;
      const isOn = Number(s[`${prefix}on`] ?? (i === 1 ? 1 : 0)) >= 0.5;
      const level = clamp(s[`${prefix}level`] ?? (i === 1 ? 0.7 : 0), 0, 1, i === 1 ? 0.7 : 0);
      const transpose = clamp(s[`${prefix}transpose`] ?? 0, -48, 48, 0);
      const tune = clamp(s[`${prefix}tune`] ?? 0, -1, 1, 0);
      const unisonVoices = Math.round(clamp(s[`${prefix}unison_voices`] ?? 1, 1, 16, 1));
      const unisonDetune = clamp(s[`${prefix}unison_detune`] ?? 2.0, 0, 10, 2.0);
      const pan = clamp(s[`${prefix}pan`] ?? 0, -1, 1, 0);
      const waveFrame = clamp(s[`${prefix}wave_frame`] ?? 0, 0, 256, 0);
      const wt = wavetables[i - 1] || null;
      const harmonics = isOn && level > 0.001 ? extractWavetableHarmonics(wt, waveFrame) : null;

      oscillators.push({
        index: i,
        on: isOn && level > 0.001,
        level,
        transpose,
        tuneCents: tune * 100,
        unisonVoices,
        unisonDetune,
        pan,
        waveFrame,
        waveform: inferFallbackWaveform(waveFrame, wt?.name),
        harmonics
      });
    }

    const subOn = Number(s.sub_on ?? 0) >= 0.5 && clamp(s.sub_level ?? 0, 0, 1, 0) > 0.001;
    const subShapeIdx = Math.round(clamp(s.sub_shape ?? 0, 0, 3, 0));
    const subShapes = ['sine', 'triangle', 'sawtooth', 'square'];
    const sub = {
      on: subOn,
      level: clamp(s.sub_level ?? 0.5, 0, 1, 0.5),
      octave: Math.round(clamp(s.sub_octave ?? -1, -2, 2, -1)),
      transpose: clamp(s.sub_transpose ?? 0, -24, 24, 0),
      waveform: subShapes[subShapeIdx] || 'sine'
    };

    // Hiçbir osilatör ve sub açık değilse osc_1'i güvenli varsayılan olarak aç
    if (!oscillators.some((o) => o.on) && !sub.on) {
      oscillators[0].on = true;
      oscillators[0].level = 0.7;
      if (!oscillators[0].harmonics && wavetables[0]) {
        oscillators[0].harmonics = extractWavetableHarmonics(wavetables[0], oscillators[0].waveFrame);
      }
    }

    const attack = clamp(s.env_1_attack ?? 0.015, 0.002, 6.0, 0.015);
    const decay = clamp(s.env_1_decay ?? 1.2, 0.02, 12.0, 1.2);
    const sustain = clamp(s.env_1_sustain ?? 0.75, 0.001, 1.0, 0.75);
    const release = clamp(s.env_1_release ?? 0.35, 0.02, 8.0, 0.35);

    const filterOn = Number(s.filter_1_on ?? 0) >= 0.5;
    const cutoffMidi = clamp(s.filter_1_cutoff ?? 96, 8, 136, 96);
    const cutoffHz = clamp(midiPitchToHz(cutoffMidi), 25, 18500, 2000);
    const resonance = clamp(s.filter_1_resonance ?? 0.15, 0, 1, 0.15);
    const blend = clamp(s.filter_1_blend ?? -1, -1, 1, -1);
    const filterType = blend > 0.35 ? 'highpass' : blend > -0.35 ? 'bandpass' : 'lowpass';

    const filter = {
      on: filterOn,
      cutoffMidi,
      cutoffHz,
      resonance,
      q: 0.7 + resonance * 10,
      type: filterType,
      keytrack: clamp(s.filter_1_keytrack ?? 0, -1, 1, 0),
      mix: clamp(s.filter_1_mix ?? 1, 0, 1, 1)
    };

    const fx = {
      reverbOn: Number(s.reverb_on ?? 0) >= 0.5,
      reverbMix: clamp(s.reverb_dry_wet ?? 0.25, 0, 1, 0.25),
      chorusOn: Number(s.chorus_on ?? 0) >= 0.5,
      chorusMix: clamp(s.chorus_dry_wet ?? 0.3, 0, 1, 0.3),
      delayOn: Number(s.delay_on ?? 0) >= 0.5,
      delayMix: clamp(s.delay_dry_wet ?? 0.25, 0, 1, 0.25),
      distortionOn: Number(s.distortion_on ?? 0) >= 0.5,
      distortionDrive: clamp(s.distortion_drive ?? 0, 0, 24, 0)
    };

    return {
      id: `vital:${slugify(rawName)}`,
      name: rawName,
      author: typeof parsed.author === 'string' ? parsed.author.trim() : '',
      style: typeof parsed.preset_style === 'string' ? parsed.preset_style.trim() : '',
      env: { attack, decay, sustain, release },
      oscillators,
      sub,
      filter,
      fx
    };
  }

  return {
    parseVitalPreset,
    computeHarmonicsFromWaveform,
    midiPitchToHz
  };
});
