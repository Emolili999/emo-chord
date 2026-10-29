const test = require('node:test');
const assert = require('node:assert/strict');

const EmochordI18n = require('../renderer/i18n');

test('i18n: Varsayılan dil İngilizce (en) olmalı ve çeviri anahtarları eksiksiz çalışmalı', () => {
  EmochordI18n.setLanguage('en');
  assert.equal(EmochordI18n.getLang(), 'en', 'Varsayılan dil en olmalı');
  assert.equal(EmochordI18n.t('modes.free'), 'Free');
  assert.equal(EmochordI18n.t('modes.wait'), 'Practice');
  assert.equal(EmochordI18n.t('liveHud.chordReady'), 'Free Piano Ready');
  assert.equal(EmochordI18n.t('visualizer.wrong'), 'MISS');

  // Türkçe'ye geçiş
  EmochordI18n.setLanguage('tr');
  assert.equal(EmochordI18n.getLang(), 'tr', 'Dil tr olmalı');
  assert.equal(EmochordI18n.t('modes.free'), 'Serbest');
  assert.equal(EmochordI18n.t('modes.wait'), 'Pratik');
  assert.equal(EmochordI18n.t('liveHud.chordReady'), 'Serbest Piyano Hazır');
  assert.equal(EmochordI18n.t('visualizer.wrong'), 'YANLIŞ');

  // Toggle testi
  EmochordI18n.toggleLanguage();
  assert.equal(EmochordI18n.getLang(), 'en');
});
