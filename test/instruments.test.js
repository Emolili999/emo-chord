const test = require('node:test');
const assert = require('node:assert/strict');

const { INSTRUMENTS, EmochordAudioEngine } = require('../renderer/audio-engine');
const EmochordI18n = require('../renderer/i18n');

test('Enstrümanlar: Akustik Piyano, Keman ve yeni enstrümanlar tam tanımlı olmalı', () => {
  const expectedInstruments = [
    'grand_piano',
    'acoustic_piano',
    'electric_piano',
    'violin',
    'string_ensemble',
    'acoustic_guitar',
    'flute',
    'celesta',
    'drawbar_organ',
    'music_box',
    'neon_synth',
    'synth_pad'
  ];

  assert.equal(
    Object.keys(INSTRUMENTS).length,
    12,
    'Toplam 12 zengin enstrüman tanımlanmış olmalı'
  );

  for (const id of expectedInstruments) {
    assert.ok(INSTRUMENTS[id], `${id} enstrümanı tanımlı olmalı`);
    const inst = INSTRUMENTS[id];
    assert.equal(inst.id, id, `${id} id alanı uyuşmalı`);
    assert.ok(typeof inst.name === 'string' && inst.name.length > 0, `${id} isim içermeli`);
    assert.ok(typeof inst.attack === 'number' && inst.attack > 0, `${id} geçerli attack süresine sahip olmalı`);
    assert.ok(typeof inst.decayBase === 'number' && inst.decayBase > 0, `${id} geçerli decayBase süresine sahip olmalı`);
    assert.ok(typeof inst.sustainLevel === 'number' && inst.sustainLevel >= 0 && inst.sustainLevel <= 1, `${id} sustainLevel 0-1 aralığında olmalı`);
    assert.ok(typeof inst.release === 'number' && inst.release > 0, `${id} geçerli release süresine sahip olmalı`);
    assert.ok(typeof inst.hammerGain === 'number' && inst.hammerGain >= 0, `${id} hammerGain geçerli olmalı`);
    assert.ok(typeof inst.detuneCents === 'number' && inst.detuneCents >= 0, `${id} detuneCents geçerli olmalı`);
  }

  // Akustik Piyano ve Keman kontrolleri
  assert.ok(INSTRUMENTS.acoustic_piano, 'Akustik Duvar Piyanosu mevcut olmalı');
  assert.ok(INSTRUMENTS.violin, 'Keman (Violin) mevcut olmalı');
  assert.ok(INSTRUMENTS.violin.sustainLevel >= 0.8, 'Keman yaylı olduğu için yüksek sustain seviyesine sahip olmalı');
  assert.ok(INSTRUMENTS.acoustic_piano.hammerGain > 0.2, 'Akustik piyano doğal keçe çekiç vuruşuna sahip olmalı');
});

test('Enstrümanlar: i18n çevirileri (İngilizce ve Türkçe) eksiksiz olmalı', () => {
  const ids = Object.keys(INSTRUMENTS);

  EmochordI18n.setLanguage('en');
  for (const id of ids) {
    const textEn = EmochordI18n.t(`keyboardControls.instruments.${id}`);
    assert.ok(textEn && textEn.length > 0, `İngilizce çeviri bulunmalı: ${id}`);
    assert.notEqual(textEn, `keyboardControls.instruments.${id}`, `İngilizce çeviri eksik olmamalı: ${id}`);
  }

  EmochordI18n.setLanguage('tr');
  for (const id of ids) {
    const textTr = EmochordI18n.t(`keyboardControls.instruments.${id}`);
    assert.ok(textTr && textTr.length > 0, `Türkçe çeviri bulunmalı: ${id}`);
    assert.notEqual(textTr, `keyboardControls.instruments.${id}`, `Türkçe çeviri eksik olmamalı: ${id}`);
  }
});

test('EmochordAudioEngine: setInstrument tüm enstrümanları hatasız seçebilmeli', () => {
  const engine = new EmochordAudioEngine();
  assert.equal(engine.instrument, 'grand_piano', 'Varsayılan enstrüman grand_piano olmalı');

  for (const id of Object.keys(INSTRUMENTS)) {
    engine.setInstrument(id);
    assert.equal(engine.instrument, id, `Enstrüman ${id} olarak seçilebilmeli`);
  }

  // Geçersiz enstrüman seçildiğinde önceki değer korunmalı
  engine.setInstrument('invalid_instrument_name');
  assert.notEqual(engine.instrument, 'invalid_instrument_name');
});
