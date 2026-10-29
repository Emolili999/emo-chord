(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.EmochordPractice = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHORD_WINDOW_MS = 50;
  const EARLY_HIT_WINDOW_MS = 160;
  const RHYTHM_HIT_WINDOW_MS = 185;
  const PERFECT_WINDOW_MS = 75;

  class PracticeEngine {
    constructor(options = {}) {
      this.mode = options.mode || 'wait'; // 'listen' | 'wait' | 'rhythm'
      this.handMode = options.handMode || 'both'; // 'both' | 'right' | 'left'
      this.tempoScale = options.tempoScale || 1.0;
      this.visibleMinMidi = options.visibleMinMidi ?? 21;
      this.visibleMaxMidi = options.visibleMaxMidi ?? 108;

      this.song = null;
      this.notes = [];
      this.durationMs = 0;
      this.songTimeMs = -1600;
      this.isPlaying = false;
      this.isPaused = false;
      this.isWaitingForInput = false;
      this.isFinished = false;

      // A-B Döngü (Loop)
      this.loopEnabled = false;
      this.loopStartMs = null;
      this.loopEndMs = null;

      this.stats = this._emptyStats();
    }

    _emptyStats() {
      return {
        score: 0,
        streak: 0,
        maxStreak: 0,
        perfectHits: 0,
        goodHits: 0,
        wrongHits: 0,
        missedNotes: 0,
        completedTargets: 0,
        totalTargets: 0,
        lastFeedback: null
      };
    }

    setVisibleRange(minMidi, maxMidi) {
      this.visibleMinMidi = minMidi;
      this.visibleMaxMidi = maxMidi;
      this._recountTargets();
    }

    loadSong(songData) {
      if (!songData || !Array.isArray(songData.notes)) {
        throw new Error('Geçersiz parça verisi.');
      }
      this.song = {
        id: songData.id || 'custom',
        title: songData.title || 'MIDI Parçası',
        bpm: songData.bpm || 120
      };

      const sorted = [...songData.notes]
        .map((n, idx) => ({
          id: idx,
          midi: n.midi,
          velocity: n.velocity || 96,
          startTimeMs: Math.max(0, Math.round(n.startTimeMs)),
          durationMs: Math.max(35, Math.round(n.durationMs || 250)),
          hand: n.hand || (n.midi >= 60 ? 'right' : 'left'),
          completed: false,
          missed: false,
          autoPlaying: false,
          autoPlayed: false,
          autoHoldRemainingMs: 0
        }))
        .sort((a, b) => a.startTimeMs - b.startTimeMs || a.midi - b.midi);

      this.notes = sorted;
      this.durationMs = sorted.reduce(
        (max, n) => Math.max(max, n.startTimeMs + n.durationMs),
        0
      );
      this.clearLoop();
      this.reset();
    }

    isNoteTargetForUser(note) {
      if (this.mode === 'listen') return false;
      // Görünür piyano aralığı dışındaki notalar kullanıcıyı kilitlememek için otomatik çalınır
      if (note.midi < this.visibleMinMidi || note.midi > this.visibleMaxMidi) {
        return false;
      }
      if (this.handMode === 'both') return true;
      return note.hand === this.handMode;
    }

    _recountTargets() {
      let total = 0;
      let completed = 0;
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (this.isNoteTargetForUser(n)) {
          total++;
          if (n.completed) completed++;
        }
      }
      this.stats.totalTargets = total;
      this.stats.completedTargets = completed;
    }

    setMode(mode) {
      if (['listen', 'wait', 'rhythm'].includes(mode)) {
        this.mode = mode;
        this.isWaitingForInput = false;
        this._recountTargets();
      }
    }

    setHandMode(handMode) {
      if (['both', 'right', 'left'].includes(handMode)) {
        this.handMode = handMode;
        this.isWaitingForInput = false;
        this._recountTargets();
      }
    }

    setTempoScale(scale) {
      const s = Number(scale);
      if (Number.isFinite(s) && s >= 0.2 && s <= 2.5) {
        this.tempoScale = Math.round(s * 100) / 100;
      }
    }

    setLoopPointA(timeMs = this.songTimeMs) {
      this.loopStartMs = Math.max(0, Math.round(timeMs));
      if (this.loopEndMs !== null && this.loopEndMs <= this.loopStartMs + 250) {
        this.loopEndMs = null;
        this.loopEnabled = false;
      }
    }

    setLoopPointB(timeMs = this.songTimeMs) {
      const t = Math.max(0, Math.round(timeMs));
      if (this.loopStartMs === null) {
        this.loopStartMs = 0;
      }
      if (t > this.loopStartMs + 250) {
        this.loopEndMs = t;
        this.loopEnabled = true;
      }
    }

    clearLoop() {
      this.loopEnabled = false;
      this.loopStartMs = null;
      this.loopEndMs = null;
    }

    reset() {
      this.songTimeMs = -1600;
      this.isPlaying = false;
      this.isPaused = false;
      this.isWaitingForInput = false;
      this.isFinished = false;

      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        n.completed = false;
        n.missed = false;
        n.autoPlaying = false;
        n.autoPlayed = false;
        n.autoHoldRemainingMs = 0;
      }

      this.stats = this._emptyStats();
      this._recountTargets();
    }

    start() {
      if (!this.notes.length) return;
      if (this.isFinished) {
        this.reset();
      }
      this.isPlaying = true;
      this.isPaused = false;
    }

    pause() {
      this.isPaused = true;
    }

    resume() {
      if (this.notes.length) {
        this.isPlaying = true;
        this.isPaused = false;
      }
    }

    seek(targetTimeMs, resetStatsIfLoop = false) {
      const clamped = Math.max(-1600, Math.min(this.durationMs, targetTimeMs));
      this.songTimeMs = clamped;
      this.isWaitingForInput = false;
      this.isFinished = false;

      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        n.autoPlaying = false;
        n.autoHoldRemainingMs = 0;
        if (n.startTimeMs < clamped - 20) {
          if (!resetStatsIfLoop) {
            n.completed = true;
          }
          n.autoPlayed = true;
        } else {
          n.completed = false;
          n.missed = false;
          n.autoPlayed = false;
        }
      }
      this._recountTargets();
    }

    _findEarliestUncompletedTarget() {
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (this.isNoteTargetForUser(n) && !n.completed && !n.missed) {
          return n;
        }
      }
      return null;
    }

    getWaitingNotes() {
      if (!this.isPlaying || this.mode !== 'wait') return [];
      const first = this._findEarliestUncompletedTarget();
      if (!first) return [];
      if (this.songTimeMs < first.startTimeMs - 5) return [];

      const groupTime = first.startTimeMs;
      const out = [];
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (n.startTimeMs > groupTime + CHORD_WINDOW_MS) break;
        if (
          this.isNoteTargetForUser(n) &&
          !n.completed &&
          !n.missed &&
          Math.abs(n.startTimeMs - groupTime) <= CHORD_WINDOW_MS
        ) {
          out.push(n);
        }
      }
      return out;
    }

    update(dtMs) {
      const events = {
        noteOn: [],
        noteOff: [],
        looped: false,
        finished: false
      };

      if (!this.isPlaying || this.isPaused || !this.notes.length) {
        return events;
      }

      const scaledDt = dtMs * this.tempoScale;
      let nextTime = this.songTimeMs + scaledDt;

      // A-B Döngü kontrolü
      if (
        this.loopEnabled &&
        this.loopStartMs !== null &&
        this.loopEndMs !== null &&
        nextTime >= this.loopEndMs
      ) {
        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.autoPlaying) {
            events.noteOff.push(n);
            n.autoPlaying = false;
          }
        }
        this.seek(this.loopStartMs, true);
        events.looped = true;
        return events;
      }

      // 1. "Tuş Beklemeli (wait)" modda sıradaki çalınmamış hedef notada zamanı durdur
      if (this.mode === 'wait') {
        const earliestTarget = this._findEarliestUncompletedTarget();
        if (earliestTarget && nextTime >= earliestTarget.startTimeMs) {
          nextTime = earliestTarget.startTimeMs;
          this.isWaitingForInput = true;
        } else {
          this.isWaitingForInput = false;
        }
      } else {
        this.isWaitingForInput = false;
      }

      this.songTimeMs = nextTime;

      // 2. "Akan Ritim (rhythm)" modda zamanı geçmiş ve basılmamış hedef notaları "Kaçırıldı" işaretle
      if (this.mode === 'rhythm') {
        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.startTimeMs > this.songTimeMs) break;
          if (
            this.isNoteTargetForUser(n) &&
            !n.completed &&
            !n.missed &&
            this.songTimeMs > n.startTimeMs + RHYTHM_HIT_WINDOW_MS
          ) {
            n.missed = true;
            this.stats.missedNotes++;
            this.stats.streak = 0;
            this.stats.lastFeedback = {
              type: 'miss',
              text: 'KAÇIRILDI',
              midi: n.midi
            };
          }
        }
      }

      // 3. Otomatik çalınacak notaları yönet (Sağ/Sol el eşliği veya Dinle modu)
      // Aşama 1: Süresi dolan aktif notaları önce sonlandır (aynı karede başlayan ardışık notaları kesmemek için)
      const endedCandidates = [];
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (!n.autoPlaying) continue;
        const isUserTarget = this.isNoteTargetForUser(n);
        const endMs = n.startTimeMs + n.durationMs;

        if (!isUserTarget) {
          // Şarkı beklemede dursa bile daha önce başlamış eşlik notasının süresini gerçek zamanlı azalt
          n.autoHoldRemainingMs -= scaledDt;
          if (this.songTimeMs >= endMs || n.autoHoldRemainingMs <= 0) {
            n.autoPlaying = false;
            endedCandidates.push(n);
          }
        } else if (this.songTimeMs >= endMs) {
          n.autoPlaying = false;
          endedCandidates.push(n);
        }
      }

      // Aşama 2: Başlama zamanı gelen yeni otomatik notaları tetikle
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (n.autoPlaying || n.autoPlayed) continue;
        const isUserTarget = this.isNoteTargetForUser(n);
        if (isUserTarget) continue;

        const endMs = n.startTimeMs + n.durationMs;
        // Kullanıcıdan tuş beklenirken tam o andaki eşlik notasını kullanıcı tuşa bastığı anda birlikte çal!
        const blockedByWait =
          this.isWaitingForInput && n.startTimeMs >= this.songTimeMs - 2;
        if (!blockedByWait && this.songTimeMs >= n.startTimeMs && this.songTimeMs < endMs) {
          n.autoPlaying = true;
          n.autoPlayed = true;
          n.completed = true;
          n.autoHoldRemainingMs = Math.max(25, endMs - this.songTimeMs);
          events.noteOn.push(n);
        }
      }

      // Aşama 3: Aynı tuşta (midi) yeni bir nota hemen başladıysa veya çakışan başka bir nota hala çalıyorsa
      // eski notanın noteOff olayı yeni başlayan notayı kesmemeli
      if (endedCandidates.length > 0) {
        const activeMidis = new Set();
        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.autoPlaying) {
            activeMidis.add(n.midi);
          }
        }
        for (let i = 0; i < endedCandidates.length; i++) {
          const ended = endedCandidates[i];
          if (!activeMidis.has(ended.midi)) {
            events.noteOff.push(ended);
          }
        }
      }

      // 4. Parça sonu kontrolü
      const allTargetsDone =
        this.mode !== 'wait' || this._findEarliestUncompletedTarget() === null;

      if (allTargetsDone && this.songTimeMs >= this.durationMs + 500) {
        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.autoPlaying) {
            n.autoPlaying = false;
            events.noteOff.push(n);
          }
        }
        this.isPlaying = false;
        this.isFinished = true;
        events.finished = true;
      }

      return events;
    }

    handleUserNoteOn(midi) {
      if (!this.isPlaying || this.isPaused || this.mode === 'listen') {
        return { status: 'ignored' };
      }

      let candidate = null;

      if (this.mode === 'wait') {
        const earliest = this._findEarliestUncompletedTarget();
        if (!earliest) return { status: 'ignored' };

        // Henüz ilk hedef nota vuruş bölgesine yaklaşmadıysa (ör. şarkı başı ön akışta) yanlış sayma
        if (earliest.startTimeMs - this.songTimeMs > EARLY_HIT_WINDOW_MS) {
          return { status: 'ignored' };
        }

        const stepTime = earliest.startTimeMs;
        let alreadyInCurrentChord = false;

        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.startTimeMs > stepTime + CHORD_WINDOW_MS) break;
          if (!this.isNoteTargetForUser(n)) continue;
          if (Math.abs(n.startTimeMs - stepTime) <= CHORD_WINDOW_MS && n.midi === midi) {
            if (!n.completed && !n.missed) {
              candidate = n;
              break;
            } else if (n.completed) {
              alreadyInCurrentChord = true;
            }
          }
        }

        if (!candidate && alreadyInCurrentChord) {
          return { status: 'ignored' };
        }
      } else {
        // 'rhythm' modu
        const earliest = this._findEarliestUncompletedTarget();
        if (earliest && this.songTimeMs < 0 && earliest.startTimeMs - this.songTimeMs > RHYTHM_HIT_WINDOW_MS) {
          return { status: 'ignored' };
        }

        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          if (n.startTimeMs > this.songTimeMs + RHYTHM_HIT_WINDOW_MS) break;
          if (!this.isNoteTargetForUser(n) || n.completed || n.missed) continue;
          if (n.midi !== midi) continue;
          if (Math.abs(n.startTimeMs - this.songTimeMs) <= RHYTHM_HIT_WINDOW_MS) {
            candidate = n;
            break;
          }
        }
      }

      if (candidate) {
        candidate.completed = true;
        this.stats.completedTargets++;
        this.stats.streak++;
        if (this.stats.streak > this.stats.maxStreak) {
          this.stats.maxStreak = this.stats.streak;
        }

        const absDelta = Math.abs(candidate.startTimeMs - this.songTimeMs);
        const isPerfect = this.mode === 'wait' || absDelta <= PERFECT_WINDOW_MS;

        if (isPerfect) {
          this.stats.perfectHits++;
          this.stats.score += 100 + Math.min(50, this.stats.streak * 5);
          this.stats.lastFeedback = {
            type: 'perfect',
            text: 'MÜKEMMEL!',
            midi
          };
        } else {
          this.stats.goodHits++;
          this.stats.score += 70 + Math.min(30, this.stats.streak * 3);
          this.stats.lastFeedback = {
            type: 'good',
            text: 'İYİ!',
            midi
          };
        }

        // Eğer erken basıldıysa (songTimeMs < candidate.startTimeMs) ve akordaki tüm notalar tamamlandıysa
        // eşlik notalarının da çalabilmesi için zamanı tamamlanan adımın başına yaklaştır
        const stillWaiting = this.getWaitingNotes();
        if (stillWaiting.length === 0) {
          this.isWaitingForInput = false;
        }

        return {
          status: isPerfect ? 'perfect' : 'good',
          note: candidate,
          remainingInChord: stillWaiting.length
        };
      }

      this.stats.wrongHits++;
      this.stats.streak = 0;
      this.stats.lastFeedback = {
        type: 'wrong',
        text: 'YANLIŞ TUŞ',
        midi
      };

      return { status: 'wrong', midi };
    }

    getAccuracyPercent() {
      const attempts =
        this.stats.perfectHits +
        this.stats.goodHits +
        this.stats.wrongHits +
        this.stats.missedNotes;
      if (attempts === 0) return 100;
      const hits = this.stats.perfectHits + this.stats.goodHits;
      return Math.max(0, Math.min(100, Math.round((hits / attempts) * 100)));
    }

    getSummaryReport() {
      const accuracy = this.getAccuracyPercent();
      let rank = 'C';
      if (accuracy >= 96 && this.stats.missedNotes === 0) rank = 'S';
      else if (accuracy >= 88) rank = 'A';
      else if (accuracy >= 75) rank = 'B';

      return {
        title: this.song?.title || 'Parça',
        mode: this.mode,
        handMode: this.handMode,
        score: this.stats.score,
        accuracy,
        rank,
        perfectHits: this.stats.perfectHits,
        goodHits: this.stats.goodHits,
        wrongHits: this.stats.wrongHits,
        missedNotes: this.stats.missedNotes,
        maxStreak: this.stats.maxStreak,
        completedTargets: this.stats.completedTargets,
        totalTargets: this.stats.totalTargets
      };
    }
  }

  return {
    CHORD_WINDOW_MS,
    EARLY_HIT_WINDOW_MS,
    RHYTHM_HIT_WINDOW_MS,
    PracticeEngine
  };
});
