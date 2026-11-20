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

function collectLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

test('i18n: EN ve TR sözlük anahtarları birebir eşleşmeli ve eksik/karışık dil metni olmamalı', () => {
  const { TRANSLATIONS, t, setLanguage } = EmochordI18n;
  const enKeys = collectLeafKeys(TRANSLATIONS.en).sort();
  const trKeys = collectLeafKeys(TRANSLATIONS.tr).sort();

  assert.deepEqual(trKeys, enKeys, 'EN ve TR çeviri anahtarları birebir aynı olmalıdır');

  setLanguage('en');
  for (const key of enKeys) {
    const val = t(key);
    assert.ok(typeof val === 'string' && val.trim().length > 0, `EN anahtarı boş olmamalı: ${key}`);
  }

  setLanguage('tr');
  for (const key of trKeys) {
    const val = t(key);
    assert.ok(typeof val === 'string' && val.trim().length > 0, `TR anahtarı boş olmamalı: ${key}`);
  }

  // Yeni eklenen zorunlu anahtarlar
  assert.ok(TRANSLATIONS.en.songs.custom_midi && TRANSLATIONS.tr.songs.custom_midi);
  assert.equal(TRANSLATIONS.en.feedback.perfect, 'PERFECT!');
  assert.equal(TRANSLATIONS.tr.feedback.perfect, 'MÜKEMMEL!');
  assert.equal(TRANSLATIONS.en.feedback.good, 'GOOD!');
  assert.equal(TRANSLATIONS.tr.feedback.good, 'İYİ!');

  // Türkçe yardım metninde İngilizce cümle kalmamalı
  assert.ok(TRANSLATIONS.tr.help.whiteLower.includes('Alt Sıra Beyaz Tuşlar'));
  assert.ok(!TRANSLATIONS.tr.help.whiteLower.includes('Lower Row White Keys'));

  // İngilizce yardım metninde Türkçe özel klavye harfleri ve M kısayolu olmamalı
  assert.ok(!/[ĞÜÖÇŞ]/.test(TRANSLATIONS.en.help.whiteUpper));
  assert.ok(!/[ĞÜÖÇŞ]/.test(TRANSLATIONS.en.help.whiteLower));
  assert.ok(!/[ĞÜÖÇŞ]/.test(TRANSLATIONS.en.help.blackLower));
  assert.ok(TRANSLATIONS.en.help.s1.includes('Tab'));
  assert.ok(TRANSLATIONS.tr.help.s1.includes('Tab'));
  assert.ok(!TRANSLATIONS.en.help.s1.includes('<code>M</code>'));
  assert.ok(!TRANSLATIONS.tr.help.s1.includes('<code>M</code>'));
});
