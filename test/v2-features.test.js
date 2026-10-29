const test = require('node:test');
const assert = require('node:assert/strict');

const { PracticeEngine } = require('../lib/practice-engine');
const { getNoteColor, DEMO_SONGS } = require('../lib/note-highway');

test('v2 Gereksinim 1: Ekran boyu ilerleme çubuğu - Tıklanan herhangi bir saniyeye atlama (Seek)', () => {
  const engine = new PracticeEngine({
    mode: 'wait'
  });
  engine.loadSong(DEMO_SONGS.fur_elise);
  assert.ok(engine.durationMs > 10000, 'Şarkı süresi en az 10 saniye olmalıdır');

  // Ortadaki bir saniyeye atlama (örn: 5000ms = 5. saniye)
  engine.seek(5000);
  assert.equal(engine.songTimeMs, 5000, '5. saniyeye tam atlanmış olmalı');

  // Başa sarma (0ms)
  engine.seek(0);
  assert.equal(engine.songTimeMs, 0, '0. saniyeye (başa) tam atlanmış olmalı');

  // Parçanın sonlarına doğru (örn: durationMs - 1000)
  const targetEnd = engine.durationMs - 1000;
  engine.seek(targetEnd);
  assert.equal(engine.songTimeMs, targetEnd, 'Son saniyelere tam atlanmış olmalı');
});

test('v2 Gereksinim 3: Basılan tuş notanın rengine bürünür (Yeşil/Mavi)', () => {
  // Klasik renk temasında sağ el notası yeşildir
  const rightHandWhite = getNoteColor(64, false, 'classic', 60, 'right');
  assert.match(rightHandWhite.fill, /^#/, 'Geçerli bir HEX renk olmalı');
  // Yeşil tonları: fill '#65e827'
  assert.equal(rightHandWhite.fill, '#65e827', 'Sağ el notası Klasik tema yeşili (#65e827) olmalıdır');

  // Sol el notası mavidir
  const leftHandWhite = getNoteColor(48, false, 'classic', 60, 'left');
  assert.equal(leftHandWhite.fill, '#29b6f6', 'Sol el notası Klasik tema mavisi (#29b6f6) olmalıdır');

  // Siyah tuşlar da aynı renk ailesindedir
  const rightHandBlack = getNoteColor(66, true, 'classic', 60, 'right');
  assert.equal(rightHandBlack.fill, '#3cb512', 'Sağ el siyah tuşu koyu yeşil (#3cb512) olmalıdır');
});
