const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVitalPreset, midiPitchToHz } = require('../lib/vital-parser');
const { EmochordAudioEngine } = require('../renderer/audio-engine');

function createBase64SineWave(sampleCount = 256) {
  const buf = new ArrayBuffer(sampleCount * 4);
  const view = new DataView(buf);
  for (let i = 0; i < sampleCount; i++) {
    const val = Math.sin((2 * Math.PI * i) / sampleCount);
    view.setFloat32(i * 4, val, true);
  }
  return Buffer.from(buf).toString('base64');
}

test('Vital Parser: geçerli .vital JSON dosyasını, zarfı, filtreyi ve wavetable harmoniklerini ayrıştırır', () => {
  const sampleVital = {
    author: 'Emo',
    preset_name: 'Neon Dream Lead',
    preset_style: 'Lead',
    settings: {
      osc_1_on: 1,
      osc_1_level: 0.85,
      osc_1_transpose: 12,
      osc_1_unison_voices: 4,
      osc_1_unison_detune: 2.5,
      osc_1_wave_frame: 0,
      osc_2_on: 0,
      env_1_attack: 0.02,
      env_1_decay: 1.5,
      env_1_sustain: 0.6,
      env_1_release: 0.45,
      filter_1_on: 1,
      filter_1_cutoff: 69,
      filter_1_resonance: 0.3,
      sub_on: 1,
      sub_level: 0.4,
      sub_octave: -1,
      wavetables: [
        {
          name: 'Custom Sine',
          groups: [
            {
              components: [
                {
                  keyframes: [
                    {
                      position: 0,
                      wave_data: createBase64SineWave(256)
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  };

  const preset = parseVitalPreset(JSON.stringify(sampleVital), 'Neon Dream Lead.vital');
  assert.equal(preset.id, 'vital:neon_dream_lead');
  assert.equal(preset.name, 'Neon Dream Lead');
  assert.equal(preset.env.attack, 0.02);
  assert.equal(preset.env.sustain, 0.6);
  assert.equal(preset.oscillators[0].on, true);
  assert.equal(preset.oscillators[0].transpose, 12);
  assert.equal(preset.oscillators[0].unisonVoices, 4);
  assert.ok(preset.oscillators[0].harmonics, 'Wavetable harmonikleri çıkarılmalı');
  assert.ok(Math.abs(preset.oscillators[0].harmonics.imag[1]) > 0.9, '1. harmonik baskın sinüs olmalı');
  assert.equal(preset.filter.on, true);
  assert.ok(Math.abs(preset.filter.cutoffHz - 440) < 0.01);
  assert.equal(preset.sub.on, true);
  assert.equal(midiPitchToHz(69), 440);
});

test('Vital Parser: geçersiz JSON veya settings eksikse hata fırlatır', () => {
  assert.throws(() => parseVitalPreset('{"foo": 123}', 'bozuk.vital'), /settings alanı eksik/);
  assert.throws(() => parseVitalPreset('not-json', 'bozuk.vital'));
});

test('EmochordAudioEngine: Vital preset ekleme, seçme, noteOn/noteOff ve silme hatasız çalışır', () => {
  const engine = new EmochordAudioEngine();

  // Sahte AudioContext oluştur
  const noopParam = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {}
  });
  const mockNode = () => ({
    gain: noopParam(),
    frequency: noopParam(),
    detune: noopParam(),
    Q: noopParam(),
    pan: noopParam(),
    type: 'sine',
    connect() {},
    disconnect() {},
    start() {},
    stop() {},
    setPeriodicWave() {}
  });
  engine.ctx = {
    currentTime: 0,
    state: 'running',
    createGain: mockNode,
    createBiquadFilter: mockNode,
    createOscillator: mockNode,
    createStereoPanner: mockNode,
    createPeriodicWave: (real, imag) => ({ real, imag })
  };
  engine.dryGain = mockNode();
  engine.convolver = mockNode();

  const preset = parseVitalPreset(
    JSON.stringify({
      preset_name: 'Test Pad',
      settings: {
        osc_1_on: 1,
        osc_1_level: 0.7,
        osc_1_unison_voices: 3,
        filter_1_on: 1,
        filter_1_cutoff: 80
      }
    }),
    'Test Pad.vital'
  );

  engine.addVitalPreset(preset);
  assert.equal(engine.getVitalPresets().length, 1);
  assert.equal(engine.setInstrument(preset.id), true);
  assert.equal(engine.instrument, preset.id);

  engine.noteOn(60, 100);
  assert.equal(engine.activeVoices.has(60), true);
  engine.noteOff(60);
  assert.equal(engine.activeVoices.has(60), false);

  assert.equal(engine.removeVitalPreset(preset.id), true);
  assert.equal(engine.instrument, 'grand_piano');
});
