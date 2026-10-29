const test = require('node:test');
const assert = require('node:assert/strict');

const {
  midiToFrequency,
  getNoteInfo,
  recommendRangeForNotes,
  buildKeybedLayout,
  pcCodeToMidi,
  detectChord
} = require('../lib/music-theory');

const {
  NoteHighwayState,
  DEMO_SONGS,
  getNoteColor
} = require('../lib/note-highway');

const { parseMidiBuffer, writeMidiBuffer } = require('../lib/midi-parser');
const { PracticeEngine } = require('../lib/practice-engine');

test('Müzik teorisi: A4 (MIDI 69) 440 Hz ve C4 (MIDI 60) nota bilgisi doğru hesaplanır', () => {
  assert.equal(Math.round(midiToFrequency(69)), 440);
  const c4 = getNoteInfo(60);
  assert.equal(c4.fullName, 'C4');
  assert.equal(c4.fullNameTr, 'Do4');
  assert.equal(c4.isBlack, false);

  const cs4 = getNoteInfo(61);
  assert.equal(cs4.fullName, 'C#4');
  assert.equal(cs4.fullNameTr, 'Do#4');
  assert.equal(cs4.isBlack, true);
});

test('Piyano klavye yerleşimi ve otomatik boyut önerisi doğru çalışır', () => {
  const layout88 = buildKeybedLayout(21, 108, 1040);
  assert.equal(layout88.keys.length, 88);
  assert.equal(layout88.whiteKeys.length, 52);
  assert.equal(layout88.blackKeys.length, 36);
  assert.equal(layout88.whiteKeyWidth, 20);

  const layout61 = buildKeybedLayout(36, 96, 1080);
  assert.equal(layout61.keys.length, 61);
  assert.equal(layout61.whiteKeys.length, 36);
  assert.equal(layout61.blackKeys.length, 25);

  // 37 tuş (48..84) dışına taşan bas nota (30) varsa 88 tuş önermeli
  assert.equal(recommendRangeForNotes([{ midi: 30 }, { midi: 60 }], '37'), '88');
  // 37 tuş sınırları içindeyse mevcut seçimi korumalı
  assert.equal(recommendRangeForNotes([{ midi: 50 }, { midi: 72 }], '37'), '37');
});

test('Bilgisayar klavyesi eşlemesi ve akor algılama doğru çalışır', () => {
  assert.equal(pcCodeToMidi('KeyZ', 3, 0), 48);
  assert.equal(pcCodeToMidi('KeyQ', 3, 0), 60);
  assert.equal(pcCodeToMidi('KeyQ', 4, 2), 74);

  const cMajor = detectChord([60, 64, 67], false);
  assert.equal(cMajor.label, 'C Majör');

  const aMinorTr = detectChord([57, 60, 64], true);
  assert.equal(aMinorTr.label, 'La Minör');

  const dom7No5 = detectChord([60, 64, 70], false);
  assert.equal(dom7No5.label, 'C Dominant 7');
});

test('NoteHighway: serbest çalmada basılı tutulan ve bırakılan notalar yukarı akar', () => {
  const hw = new NoteHighwayState({ pixelsPerSecond: 200 });
  hw.noteOn(60, 100, 1000, 'pc');

  let rects = hw.computeRisingRects(1500, 500);
  assert.equal(rects.length, 1);
  assert.equal(rects[0].isHeld, true);
  assert.equal(rects[0].y, 400);
  assert.equal(rects[0].height, 100);

  hw.noteOff(60, 1500);
  rects = hw.computeRisingRects(2000, 500);
  assert.equal(rects.length, 1);
  assert.equal(rects[0].isHeld, false);
  assert.equal(rects[0].y, 300);
  assert.equal(rects[0].height, 100);
});

test('NoteHighway: serbest çalma kaydı ve yukarıdan akan (falling) demo notaları', () => {
  const hw = new NoteHighwayState({ pixelsPerSecond: 200 });
  hw.startRecording(100);
  hw.noteOn(64, 95, 200, 'pc');
  hw.noteOff(64, 500);
  const rec = hw.stopRecording(600);

  assert.equal(rec.length, 1);
  assert.equal(rec[0].midi, 64);
  assert.equal(rec[0].startTimeMs, 100);
  assert.equal(rec[0].durationMs, 300);

  const falling = hw.computeFallingRects(DEMO_SONGS.fur_elise.notes, 0, 500);
  assert.ok(falling.length > 0);
  assert.ok(getNoteColor(60, false, 'classic').fill);
});

test('MIDI Parser & Writer: Standart MIDI (.mid) yazma ve ayrıştırma tam uyumlu çalışır', () => {
  const bytes = writeMidiBuffer(DEMO_SONGS.twinkle);
  const parsed = parseMidiBuffer(bytes);
  assert.equal(parsed.notes.length, DEMO_SONGS.twinkle.notes.length);
  assert.equal(parsed.notes[0].midi, 48);
  assert.equal(parsed.bpm, 105);
});

test('PracticeEngine (Tuş Beklemeli Mod): hedef notada durur, sıra dışı vuruşu engeller, eşlik notasını senkron çalar', () => {
  const engine = new PracticeEngine({ mode: 'wait', handMode: 'right' });
  engine.loadSong({
    title: 'Test Parçası',
    bpm: 120,
    notes: [
      { midi: 48, startTimeMs: 0, durationMs: 400, hand: 'left' },
      { midi: 64, startTimeMs: 0, durationMs: 400, hand: 'right' },
      { midi: 65, startTimeMs: 100, durationMs: 400, hand: 'right' },
      { midi: 67, startTimeMs: 500, durationMs: 400, hand: 'right' }
    ]
  });

  engine.start();

  // Ön akış sırasında (-1600ms) tuşa basılırsa yanlış sayılmamalı ('ignored')
  assert.equal(engine.handleUserNoteOn(62).status, 'ignored');

  // Zamanı 0ms'ye ilerlet: Sağ el (64) beklenirken sol el eşliği (48) kullanıcı basana kadar beklemeli!
  const evWait = engine.update(1700);
  assert.equal(engine.songTimeMs, 0);
  assert.equal(engine.isWaitingForInput, true);
  assert.equal(evWait.noteOn.length, 0);

  // Sıradaki 0ms notası (64) dururken 100ms'deki sonraki notaya (65) erken basılması sıra dışı olduğu için reddedilmeli
  const outOfOrder = engine.handleUserNoteOn(65);
  assert.equal(outOfOrder.status, 'wrong');
  assert.equal(engine.isWaitingForInput, true);

  // Doğru tuşa basıldığında (64) kilit açılmalı ve hemen sonraki karede sol el eşliği (48) çalmalı
  const rightRes = engine.handleUserNoteOn(64);
  assert.equal(rightRes.status, 'perfect');
  assert.equal(engine.isWaitingForInput, false);

  const evAfterHit = engine.update(10);
  assert.equal(evAfterHit.noteOn.length, 1);
  assert.equal(evAfterHit.noteOn[0].midi, 48);
});

test('PracticeEngine (A-B Döngü): B noktasına ulaşıldığında A noktasına geri sarar', () => {
  const engine = new PracticeEngine({ mode: 'listen' });
  engine.loadSong(DEMO_SONGS.twinkle);
  engine.start();
  engine.seek(1000);
  engine.setLoopPointA(1000);
  engine.setLoopPointB(2000);

  assert.equal(engine.loopEnabled, true);
  const ev = engine.update(1100);
  assert.equal(ev.looped, true);
  assert.equal(engine.songTimeMs, 1000);
});

test('PracticeEngine: art arda gelen aynı perdeli (consecutive) notalar birbirini erken kesmez', () => {
  const engine = new PracticeEngine({ mode: 'listen' });
  engine.loadSong({
    title: 'Legato Consecutive Test',
    bpm: 160,
    notes: [
      { midi: 73, startTimeMs: 0, durationMs: 185, velocity: 80, hand: 'right' },
      { midi: 73, startTimeMs: 185, durationMs: 190, velocity: 80, hand: 'right' },
      { midi: 71, startTimeMs: 375, durationMs: 185, velocity: 80, hand: 'right' },
      { midi: 71, startTimeMs: 560, durationMs: 377, velocity: 80, hand: 'right' }
    ]
  });
  engine.start();

  const activeByMidi = new Map();
  const actualDurations = [];

  for (let t = 0; t < 2800; t += 16) {
    const ev = engine.update(16);
    for (const off of ev.noteOff) {
      const cur = activeByMidi.get(off.midi);
      assert.ok(cur, 'noteOff geldiğinde aktif bir nota bulunmalı');
      assert.equal(cur.note.id, off.id, 'Eski notanın noteOff olayı yeni başlayan notayı kesmemeli');
      actualDurations.push({ id: cur.note.id, heldMs: engine.songTimeMs - cur.startedAt });
      activeByMidi.delete(off.midi);
    }
    for (const on of ev.noteOn) {
      const prev = activeByMidi.get(on.midi);
      if (prev) {
        actualDurations.push({ id: prev.note.id, heldMs: engine.songTimeMs - prev.startedAt });
      }
      activeByMidi.set(on.midi, { note: on, startedAt: engine.songTimeMs });
    }
  }

  assert.equal(actualDurations.length, 4);
  for (const d of actualDurations) {
    assert.ok(d.heldMs >= 165, `Nota #${d.id} erken kesildi: ${d.heldMs}ms`);
  }
});

