(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.EmochordMidiParser = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseMidiBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let pos = 0;

    function readStr(len) {
      let s = '';
      for (let i = 0; i < len && pos < bytes.length; i++) {
        s += String.fromCharCode(bytes[pos++]);
      }
      return s;
    }
    function readU16() {
      const v = (bytes[pos] << 8) | bytes[pos + 1];
      pos += 2;
      return v;
    }
    function readU32() {
      const v =
        bytes[pos] * 0x1000000 +
        ((bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]);
      pos += 4;
      return v;
    }
    function readVarLen() {
      let value = 0;
      for (let i = 0; i < 4 && pos < bytes.length; i++) {
        const b = bytes[pos++];
        value = (value << 7) | (b & 0x7f);
        if ((b & 0x80) === 0) break;
      }
      return value;
    }

    if (readStr(4) !== 'MThd') {
      throw new Error('Geçersiz MIDI dosyası (MThd başlığı bulunamadı).');
    }
    const hdrLen = readU32();
    const format = readU16();
    const numTracks = readU16();
    const division = readU16();
    pos = 8 + hdrLen;

    if (division & 0x8000) {
      throw new Error('SMPTE zaman kodlu MIDI dosyaları desteklenmiyor.');
    }
    const ticksPerBeat = division || 480;

    const tempoEvents = [];
    const rawNotes = [];
    let trackTitle = '';

    for (let t = 0; t < numTracks && pos < bytes.length; t++) {
      const chunkId = readStr(4);
      const chunkLen = readU32();
      const trackEnd = Math.min(bytes.length, pos + chunkLen);
      if (chunkId !== 'MTrk') {
        pos = trackEnd;
        continue;
      }

      let tick = 0;
      let runningStatus = 0;
      const openNotes = new Map();
      const sustainedNotes = new Map();
      const sustainPedalByChannel = new Map();

      const flushSustainedNote = (key, endTick) => {
        if (!sustainedNotes.has(key)) return;
        const list = sustainedNotes.get(key);
        sustainedNotes.delete(key);
        for (const prev of list) {
          rawNotes.push({
            midi: prev.note,
            velocity: prev.vel,
            startTick: prev.tick,
            endTick: Math.max(prev.tick + 1, endTick),
            track: t,
            channel: prev.channel
          });
        }
      };

      while (pos < trackEnd) {
        const delta = readVarLen();
        tick += delta;

        let status = bytes[pos];
        if (status < 0x80) {
          status = runningStatus;
        } else {
          pos++;
          if (status < 0xf0) runningStatus = status;
        }

        const eventType = status & 0xf0;
        const channel = status & 0x0f;

        if (eventType === 0x90 || eventType === 0x80) {
          const note = bytes[pos++];
          const vel = bytes[pos++];
          const key = `${channel}:${note}`;
          if (eventType === 0x90 && vel > 0) {
            flushSustainedNote(key, tick);
            if (openNotes.has(key)) {
              const prev = openNotes.get(key);
              rawNotes.push({
                midi: note,
                velocity: prev.vel,
                startTick: prev.tick,
                endTick: Math.max(prev.tick + 1, tick),
                track: t,
                channel
              });
            }
            openNotes.set(key, { tick, vel, note, channel });
          } else if (openNotes.has(key)) {
            const prev = openNotes.get(key);
            openNotes.delete(key);
            if (sustainPedalByChannel.get(channel)) {
              const list = sustainedNotes.get(key) || [];
              list.push(prev);
              sustainedNotes.set(key, list);
            } else {
              rawNotes.push({
                midi: note,
                velocity: prev.vel,
                startTick: prev.tick,
                endTick: Math.max(prev.tick + 1, tick),
                track: t,
                channel
              });
            }
          }
        } else if (eventType === 0xb0) {
          const cc = bytes[pos++];
          const val = bytes[pos++];
          if (cc === 64) {
            const pedalOn = val >= 64;
            sustainPedalByChannel.set(channel, pedalOn);
            if (!pedalOn) {
              for (const key of Array.from(sustainedNotes.keys())) {
                if (key.startsWith(`${channel}:`)) {
                  flushSustainedNote(key, tick);
                }
              }
            }
          }
        } else if (eventType === 0xa0 || eventType === 0xe0) {
          pos += 2;
        } else if (eventType === 0xc0 || eventType === 0xd0) {
          pos += 1;
        } else if (status === 0xff) {
          const metaType = bytes[pos++];
          const metaLen = readVarLen();
          if (metaType === 0x51 && metaLen === 3) {
            const usPerBeat = (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2];
            tempoEvents.push({ tick, usPerBeat });
          } else if (metaType === 0x03 && !trackTitle && metaLen > 0) {
            trackTitle = new TextDecoder('utf-8', { fatal: false })
              .decode(bytes.subarray(pos, pos + metaLen))
              .trim();
          }
          pos += metaLen;
        } else if (status === 0xf0 || status === 0xf7) {
          const sysexLen = readVarLen();
          pos += sysexLen;
        } else {
          break;
        }
      }

      // İz sonunda sustain'de veya açık kalan notaları kapat
      for (const key of Array.from(sustainedNotes.keys())) {
        flushSustainedNote(key, tick);
      }
      for (const prev of openNotes.values()) {
        rawNotes.push({
          midi: prev.note,
          velocity: prev.vel,
          startTick: prev.tick,
          endTick: Math.max(prev.tick + Math.round(ticksPerBeat * 0.5), tick),
          track: t,
          channel: prev.channel
        });
      }

      pos = trackEnd;
    }

    if (tempoEvents.length === 0) {
      tempoEvents.push({ tick: 0, usPerBeat: 500000 });
    }
    tempoEvents.sort((a, b) => a.tick - b.tick);

    function tickToMs(targetTick) {
      let ms = 0;
      let curTick = 0;
      let curUsPerBeat = 500000;
      for (let i = 0; i < tempoEvents.length; i++) {
        const te = tempoEvents[i];
        if (te.tick >= targetTick) break;
        const dt = te.tick - curTick;
        if (dt > 0) {
          ms += (dt * (curUsPerBeat / 1000)) / ticksPerBeat;
        }
        curTick = te.tick;
        curUsPerBeat = te.usPerBeat;
      }
      const rem = targetTick - curTick;
      if (rem > 0) {
        ms += (rem * (curUsPerBeat / 1000)) / ticksPerBeat;
      }
      return ms;
    }

    const filtered = rawNotes.filter((n) => n.channel !== 9 && n.midi >= 21 && n.midi <= 108);

    // Çok izli (multi-track) piyano MIDI dosyalarında sağ/sol el izlerini ortalama perdeye göre belirle
    const trackStats = new Map();
    for (const n of filtered) {
      const st = trackStats.get(n.track) || { sum: 0, count: 0 };
      st.sum += n.midi;
      st.count++;
      trackStats.set(n.track, st);
    }

    const trackHandMap = new Map();
    if (trackStats.size >= 2) {
      const sortedTracks = Array.from(trackStats.entries())
        .map(([trk, st]) => ({ trk, avg: st.sum / st.count }))
        .sort((a, b) => b.avg - a.avg);
      sortedTracks.forEach((item, idx) => {
        trackHandMap.set(item.trk, idx === 0 ? 'right' : 'left');
      });
    }

    let mapped = filtered
      .map((n) => {
        const startTimeMs = Math.round(tickToMs(n.startTick));
        const endTimeMs = Math.round(tickToMs(n.endTick));
        const hand = trackHandMap.get(n.track) || (n.midi >= 60 ? 'right' : 'left');
        return {
          midi: n.midi,
          velocity: n.velocity,
          startTimeMs,
          durationMs: Math.max(35, endTimeMs - startTimeMs),
          hand
        };
      })
      .sort((a, b) => a.startTimeMs - b.startTimeMs || a.midi - b.midi);

    // Baştaki boşluğu (varsa) sıfıra hizala
    if (mapped.length > 0 && mapped[0].startTimeMs > 0) {
      const offset = mapped[0].startTimeMs;
      mapped = mapped.map((n) => ({
        ...n,
        startTimeMs: n.startTimeMs - offset
      }));
    }

    const firstUs = tempoEvents[0]?.usPerBeat || 500000;
    const bpm = Math.max(30, Math.min(300, Math.round(60000000 / firstUs)));
    const durationMs = mapped.reduce((m, n) => Math.max(m, n.startTimeMs + n.durationMs), 0);

    return {
      format,
      numTracks,
      ticksPerBeat,
      bpm,
      durationMs,
      title: trackTitle || 'MIDI Parçası',
      notes: mapped
    };
  }

  // Nota dizisini Standart MIDI Dosyası (Format 1, Sağ ve Sol el ayrı iz) ikili verisine dönüştürür
  function writeMidiBuffer(song) {
    const bpm = song.bpm || 120;
    const ticksPerBeat = 480;
    const usPerBeat = Math.round(60000000 / bpm);
    const msToTick = (ms) => Math.max(0, Math.round((ms * ticksPerBeat * 1000) / usPerBeat));

    function encodeVarLen(val) {
      let v = Math.max(0, val >>> 0);
      const bytes = [v & 0x7f];
      while ((v >>= 7) > 0) {
        bytes.unshift((v & 0x7f) | 0x80);
      }
      return bytes;
    }

    function buildTrack(events) {
      events.sort((a, b) => a.tick - b.tick || a.order - b.order);
      const data = [];
      let lastTick = 0;
      for (const ev of events) {
        const delta = Math.max(0, ev.tick - lastTick);
        lastTick = ev.tick;
        data.push(...encodeVarLen(delta), ...ev.bytes);
      }
      // End of Track
      data.push(0x00, 0xff, 0x2f, 0x00);

      const len = data.length;
      return [
        0x4d, 0x54, 0x72, 0x6b,
        (len >>> 24) & 0xff,
        (len >>> 16) & 0xff,
        (len >>> 8) & 0xff,
        len & 0xff,
        ...data
      ];
    }

    const titleBytes = Array.from(new TextEncoder().encode(song.title || 'Emochord'));
    const metaEvents = [
      {
        tick: 0,
        order: 0,
        bytes: [0xff, 0x03, ...encodeVarLen(titleBytes.length), ...titleBytes]
      },
      {
        tick: 0,
        order: 1,
        bytes: [
          0xff, 0x51, 0x03,
          (usPerBeat >>> 16) & 0xff,
          (usPerBeat >>> 8) & 0xff,
          usPerBeat & 0xff
        ]
      }
    ];

    const rightEvents = [...metaEvents];
    const leftEvents = [];

    for (const n of song.notes || []) {
      const startTick = msToTick(n.startTimeMs);
      const endTick = Math.max(startTick + 10, msToTick(n.startTimeMs + n.durationMs));
      const target = n.hand === 'left' ? leftEvents : rightEvents;
      const ch = n.hand === 'left' ? 1 : 0;
      target.push({
        tick: startTick,
        order: 2,
        bytes: [0x90 | ch, n.midi & 0x7f, (n.velocity || 96) & 0x7f]
      });
      target.push({
        tick: endTick,
        order: 1,
        bytes: [0x80 | ch, n.midi & 0x7f, 0x00]
      });
    }

    const trk1 = buildTrack(rightEvents);
    const trk2 = buildTrack(leftEvents);

    const header = [
      0x4d, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x01,
      0x00, 0x02,
      (ticksPerBeat >>> 8) & 0xff,
      ticksPerBeat & 0xff
    ];

    return new Uint8Array([...header, ...trk1, ...trk2]);
  }

  return { parseMidiBuffer, writeMidiBuffer };
});
