(function (root) {
  'use strict';

  const { buildKeybedLayout, getPcKeyLabelsByMidi } = root.EmochordMusic;
  const { getNoteColor } = root.EmochordHighway;

  const MAX_PARTICLES = 110;
  const MAX_FLARES = 28;
  const MAX_FLOATING_TEXTS = 24;

  class NoteFlowVisualizer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });

      this.rangeMin = options.minMidi || 36;
      this.rangeMax = options.maxMidi || 96;
      this.themeId = options.themeId || 'classic';
      this.baseOctave = options.baseOctave ?? 3;
      this.transpose = options.transpose ?? 0;
      this.labelMode = options.labelMode || 'both';
      this.useTurkishNotes = !!options.useTurkishNotes;
      this.showParticles = options.showParticles !== false;
      this.showGridLines = options.showGridLines !== false;

      this.width = 1280;
      this.height = 720;
      this.dpr = 1;
      this.keybedHeight = 186;
      this.feltHeight = 8;
      this.highwayHeight = this.height - this.keybedHeight - this.feltHeight;

      this.layout = buildKeybedLayout(this.rangeMin, this.rangeMax, this.width);
      this.pcLabels = getPcKeyLabelsByMidi(this.baseOctave, this.transpose);

      // Önbelleğe alınmış statik gradyanlar
      this._cachedGrads = null;

      this.pressedKeys = new Map();
      this.sustainedKeys = new Set();
      this.waitingKeys = new Map();
      this.wrongKeyFlashes = new Map();

      this.particles = [];
      this.flares = [];
      this.floatingTexts = [];
      this._pulsePhase = 0;

      this.resize();
    }

    setRange(minMidi, maxMidi) {
      this.rangeMin = minMidi;
      this.rangeMax = maxMidi;
      this.layout = buildKeybedLayout(this.rangeMin, this.rangeMax, this.width);
    }

    setPcMapping(baseOctave, transpose) {
      this.baseOctave = baseOctave;
      this.transpose = transpose;
      this.pcLabels = getPcKeyLabelsByMidi(this.baseOctave, this.transpose);
    }

    setWaitingNotes(waitingNotes) {
      this.waitingKeys.clear();
      if (!Array.isArray(waitingNotes)) return;
      for (let i = 0; i < waitingNotes.length; i++) {
        const n = waitingNotes[i];
        this.waitingKeys.set(n.midi, { hand: n.hand || (n.midi >= 60 ? 'right' : 'left') });
      }
    }

    flashWrongKey(midi) {
      this.wrongKeyFlashes.set(midi, 1.0);
      this.spawnFeedbackText(midi, 'YANLIŞ', '#fb7185');
    }

    spawnFeedbackText(midi, text, color = '#2dd4bf') {
      const key = this.layout.byMidi.get(midi);
      if (!key) return;
      if (this.floatingTexts.length >= MAX_FLOATING_TEXTS) {
        this.floatingTexts.shift();
      }
      this.floatingTexts.push({
        x: key.centerX,
        y: this.highwayHeight - 16,
        vy: -56,
        text,
        color,
        alpha: 1.0
      });
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.width = Math.max(320, Math.floor(rect.width));
      this.height = Math.max(240, Math.floor(rect.height));

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);

      this.keybedHeight = Math.max(144, Math.min(212, Math.round(this.height * 0.258)));
      this.feltHeight = 8;
      this.highwayHeight = Math.max(90, this.height - this.keybedHeight - this.feltHeight);

      this.layout = buildKeybedLayout(this.rangeMin, this.rangeMax, this.width);
      this._rebuildCachedGradients();
    }

    _rebuildCachedGradients() {
      const ctx = this.ctx;
      const h = this.highwayHeight;
      const topY = h + this.feltHeight;
      const kh = this.keybedHeight;
      const blackHeight = Math.round(kh * 0.635);

      // Modern Koyu Stüdyo Sahne Gradyanı
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#050811');
      bgGrad.addColorStop(0.58, '#090f1d');
      bgGrad.addColorStop(0.92, '#0e172a');
      bgGrad.addColorStop(1, '#132038');

      // Ufuk Çizgisi Ambiyans Işıması
      const horizonGlowGrad = ctx.createLinearGradient(0, Math.max(0, h - 90), 0, h);
      horizonGlowGrad.addColorStop(0, 'rgba(45, 212, 191, 0)');
      horizonGlowGrad.addColorStop(1, 'rgba(45, 212, 191, 0.055)');

      // Modern Anodize Metal & Lazer Ufuk Şeridi
      const railGrad = ctx.createLinearGradient(0, h, 0, h + this.feltHeight);
      railGrad.addColorStop(0, '#0f172a');
      railGrad.addColorStop(0.4, '#1e293b');
      railGrad.addColorStop(0.75, '#0b1120');
      railGrad.addColorStop(1, '#04070e');

      // Sedefli Beyaz Tuş Gradyanı
      const whiteIdleGrad = ctx.createLinearGradient(0, topY, 0, topY + kh - 4);
      whiteIdleGrad.addColorStop(0, '#eef2f7');
      whiteIdleGrad.addColorStop(0.06, '#ffffff');
      whiteIdleGrad.addColorStop(0.84, '#f1f5f9');
      whiteIdleGrad.addColorStop(0.95, '#d8e1ec');
      whiteIdleGrad.addColorStop(1, '#94a3b8');

      // Saten Karbon Siyah Tuş Gövdesi
      const blackIdleOuterGrad = ctx.createLinearGradient(0, topY, 0, topY + blackHeight);
      blackIdleOuterGrad.addColorStop(0, '#293242');
      blackIdleOuterGrad.addColorStop(0.82, '#111622');
      blackIdleOuterGrad.addColorStop(1, '#05070c');

      // Siyah Tuş Üst Yüzey Yansıması
      const blackIdleTopGrad = ctx.createLinearGradient(0, topY, 0, topY + Math.max(10, blackHeight - 9));
      blackIdleTopGrad.addColorStop(0, '#404b62');
      blackIdleTopGrad.addColorStop(0.14, '#262e3d');
      blackIdleTopGrad.addColorStop(0.92, '#171c26');
      blackIdleTopGrad.addColorStop(1, '#232b3a');

      this._cachedGrads = {
        bgGrad,
        horizonGlowGrad,
        railGrad,
        whiteIdleGrad,
        blackIdleOuterGrad,
        blackIdleTopGrad
      };
    }

    hitTestKey(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const keyTopY = this.highwayHeight + this.feltHeight;

      if (y < keyTopY || y > this.height || x < 0 || x > this.width) {
        return null;
      }

      const relY = y - keyTopY;
      const blackHeight = this.keybedHeight * 0.635;

      if (relY <= blackHeight) {
        const bks = this.layout.blackKeys;
        for (let i = 0; i < bks.length; i++) {
          const bk = bks[i];
          if (x >= bk.x && x <= bk.x + bk.width) {
            return bk.midi;
          }
        }
      }

      const wks = this.layout.whiteKeys;
      for (let i = 0; i < wks.length; i++) {
        const wk = wks[i];
        if (x >= wk.x && x <= wk.x + wk.width) {
          return wk.midi;
        }
      }
      return null;
    }

    spawnNoteBurst(midi, velocity = 100, hand = null) {
      const key = this.layout.byMidi.get(midi);
      if (!key) return;
      const color = getNoteColor(midi, key.isBlack, this.themeId, 60, hand);

      // Her tuş vuruşunda ufuk çizgisinde zarif bir ışık halkası (flare) oluştur
      if (this.flares.length >= MAX_FLARES) {
        this.flares.shift();
      }
      this.flares.push({
        x: key.centerX,
        width: Math.max(18, key.laneWidth * 1.6),
        color: color.top,
        fill: color.fill,
        alpha: Math.min(1, 0.55 + (velocity / 127) * 0.45)
      });

      if (!this.showParticles) return;

      const count = Math.min(7, Math.max(3, Math.round((velocity / 127) * 6)));
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= MAX_PARTICLES) {
          this.particles.shift();
        }
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.15;
        const speed = 42 + Math.random() * 88;
        this.particles.push({
          x: key.centerX + (Math.random() - 0.5) * key.laneWidth * 0.6,
          y: this.highwayHeight - 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5 + Math.random() * 2.1,
          color: i % 2 === 0 ? color.top : color.fill,
          alpha: 0.92,
          decay: 1.35 + Math.random() * 0.75
        });
      }
    }

    _spawnSustainedSparks(dt) {
      if (!this.showParticles || this.pressedKeys.size === 0) return;
      if (Math.random() > dt * 18) return;
      for (const [midi, info] of this.pressedKeys.entries()) {
        if (this.particles.length >= MAX_PARTICLES) break;
        const key = this.layout.byMidi.get(midi);
        if (!key) continue;
        const color = getNoteColor(midi, key.isBlack, this.themeId, 60, info.hand);
        this.particles.push({
          x: key.centerX + (Math.random() - 0.5) * key.laneWidth * 0.7,
          y: this.highwayHeight - 2,
          vx: (Math.random() - 0.5) * 24,
          vy: -(32 + Math.random() * 48),
          size: 1.2 + Math.random() * 1.5,
          color: color.top,
          alpha: 0.75,
          decay: 1.6 + Math.random() * 0.6
        });
      }
    }

    render(dt, risingRects, fallingRects, songMeta = null) {
      this._pulsePhase = (this._pulsePhase + dt * 6.5) % (Math.PI * 2);

      for (const [midi, alpha] of this.wrongKeyFlashes.entries()) {
        const next = alpha - dt * 2.8;
        if (next <= 0) this.wrongKeyFlashes.delete(midi);
        else this.wrongKeyFlashes.set(midi, next);
      }

      if (!this._cachedGrads) this._rebuildCachedGradients();

      const ctx = this.ctx;
      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      this._drawHighwayBackground(ctx, songMeta);
      this._drawNoteBars(ctx, risingRects, fallingRects);
      this._drawVelvetRailAndFlares(ctx, dt);
      this._updateAndDrawParticles(ctx, dt);
      this._drawFloatingTexts(ctx, dt);
      this._drawPianoKeybed(ctx);

      ctx.restore();
    }

    _drawHighwayBackground(ctx, songMeta) {
      const w = this.width;
      const h = this.highwayHeight;

      ctx.fillStyle = this._cachedGrads.bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Oktav Şeritleri (Her C-B oktav aralığını hafif ton farkıyla ayır)
      const wks = this.layout.whiteKeys;
      let octaveStartX = 0;
      let currentOctave = wks.length > 0 ? Math.floor(wks[0].midi / 12) - 1 : 3;

      for (let i = 0; i < wks.length; i++) {
        const wk = wks[i];
        if (wk.pitchClass === 0 && i > 0) {
          if (currentOctave % 2 === 0) {
            ctx.fillStyle = 'rgba(148, 163, 196, 0.016)';
            ctx.fillRect(octaveStartX, 0, wk.x - octaveStartX, h);
          }
          octaveStartX = wk.x;
          currentOctave = wk.octave;
        }
      }
      if (currentOctave % 2 === 0 && octaveStartX < w) {
        ctx.fillStyle = 'rgba(148, 163, 196, 0.016)';
        ctx.fillRect(octaveStartX, 0, w - octaveStartX, h);
      }

      // Ufuk ambiyans ışıması
      ctx.fillStyle = this._cachedGrads.horizonGlowGrad;
      ctx.fillRect(0, Math.max(0, h - 90), w, Math.min(90, h));

      const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);
      for (const [midi, info] of this.waitingKeys.entries()) {
        const key = this.layout.byMidi.get(midi);
        if (!key) continue;
        const color = getNoteColor(midi, key.isBlack, this.themeId, 60, info.hand);
        const waitGrad = ctx.createLinearGradient(0, 0, 0, h);
        waitGrad.addColorStop(0, 'rgba(0,0,0,0)');
        waitGrad.addColorStop(0.35, color.glow.replace(/[\d.]+\)$/, `${0.04 + pulse * 0.04})`));
        waitGrad.addColorStop(1, color.glow.replace(/[\d.]+\)$/, `${0.16 + pulse * 0.16})`));
        ctx.fillStyle = waitGrad;
        ctx.fillRect(key.laneX, 0, key.laneWidth, h);
      }

      for (const [midi, info] of this.pressedKeys.entries()) {
        const key = this.layout.byMidi.get(midi);
        if (!key) continue;
        const color = getNoteColor(midi, key.isBlack, this.themeId, 60, info.hand);
        const laneGrad = ctx.createLinearGradient(0, 0, 0, h);
        laneGrad.addColorStop(0, 'rgba(0,0,0,0)');
        laneGrad.addColorStop(0.45, color.glow.replace(/[\d.]+\)$/, '0.05)'));
        laneGrad.addColorStop(1, color.glow.replace(/[\d.]+\)$/, '0.22)'));
        ctx.fillStyle = laneGrad;
        ctx.fillRect(key.laneX, 0, key.laneWidth, h);
      }

      if (!this.showGridLines) return;

      if (songMeta && songMeta.isPlaying && songMeta.bpm > 0 && songMeta.pixelsPerSecond > 0) {
        const beatMs = 60000 / songMeta.bpm;
        const pps = songMeta.pixelsPerSecond;
        const visibleTimeSpanMs = (h / pps) * 1000;
        const firstBeatIdx = Math.max(0, Math.floor(songMeta.songTimeMs / beatMs));
        const lastBeatIdx = Math.ceil((songMeta.songTimeMs + visibleTimeSpanMs) / beatMs);

        for (let b = firstBeatIdx; b <= lastBeatIdx; b++) {
          const beatTimeMs = b * beatMs;
          const y = Math.round(h - ((beatTimeMs - songMeta.songTimeMs) / 1000) * pps) + 0.5;
          if (y < 0 || y > h) continue;
          const isMeasure = b % 4 === 0;
          ctx.strokeStyle = isMeasure
            ? 'rgba(148, 163, 196, 0.17)'
            : 'rgba(148, 163, 196, 0.045)';
          ctx.lineWidth = isMeasure ? 1.2 : 1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();

          if (isMeasure && b > 0 && y > 24 && y < h - 12) {
            const label = `ÖLÇÜ ${Math.floor(b / 4) + 1}`;
            ctx.fillStyle = 'rgba(148, 163, 196, 0.28)';
            ctx.font = '700 9.5px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, 10, y - 5);
          }
        }
      }

      for (let i = 0; i < wks.length; i++) {
        const wk = wks[i];
        const x = Math.round(wk.x) + 0.5;
        if (wk.pitchClass === 0) {
          ctx.strokeStyle = 'rgba(148, 163, 196, 0.2)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();

          ctx.fillStyle = 'rgba(148, 163, 196, 0.32)';
          ctx.font = '700 10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(this.useTurkishNotes ? wk.fullNameTr : wk.fullName, x + 5, h - 10);
        } else if (wk.pitchClass === 5) {
          ctx.strokeStyle = 'rgba(148, 163, 196, 0.09)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 196, 0.03)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
      }
    }

    _drawNoteBars(ctx, risingRects, fallingRects) {
      const hasFalling = Array.isArray(fallingRects) && fallingRects.length > 0;
      const hasRising = Array.isArray(risingRects) && risingRects.length > 0;
      if (!hasFalling && !hasRising) return;

      const passWhite = [];
      const passBlack = [];

      if (hasFalling) {
        for (let i = 0; i < fallingRects.length; i++) {
          const r = fallingRects[i];
          const key = this.layout.byMidi.get(r.midi);
          if (!key) continue;
          if (key.isBlack) passBlack.push({ r, key, isFalling: true });
          else passWhite.push({ r, key, isFalling: true });
        }
      }

      if (hasRising) {
        for (let i = 0; i < risingRects.length; i++) {
          const r = risingRects[i];
          const key = this.layout.byMidi.get(r.midi);
          if (!key) continue;
          if (key.isBlack) passBlack.push({ r, key, isFalling: false });
          else passWhite.push({ r, key, isFalling: false });
        }
      }

      const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);

      const drawSingleBar = ({ r, key, isFalling }) => {
        const color = getNoteColor(r.midi, key.isBlack, this.themeId, 60, r.hand);
        const x = key.laneX + 0.5;
        const w = Math.max(3, key.laneWidth - 1);
        const y = r.y;
        const h = r.height;
        const radius = Math.min(7, w * 0.34, h * 0.45);
        const isActive = r.isHeld || r.isHitting || r.isWaiting;

        ctx.save();

        if (isFalling) {
          if (r.missed) {
            ctx.globalAlpha = 0.28;
          } else if (r.isTarget === false) {
            ctx.globalAlpha = 0.52;
          }
        }

        // Aktif veya bekleyen notalarda yumuşak neon parlama
        if (isActive) {
          ctx.shadowColor = r.isWaiting ? '#ffffff' : color.glow;
          ctx.shadowBlur = r.isWaiting ? 16 + pulse * 8 : 16;
        }

        // Modern 3B Kapsül Gradyanı
        const grad = ctx.createLinearGradient(x, y, x + w, y);
        grad.addColorStop(0, color.top);
        grad.addColorStop(0.2, color.fill);
        grad.addColorStop(0.85, color.fill);
        grad.addColorStop(1, color.border);

        ctx.fillStyle = grad;
        this._roundRect(ctx, x, y, w, h, radius);
        ctx.fill();

        if (isActive) ctx.shadowBlur = 0;

        // İç-Dış Kristal Çerçeve (Inner Rim Glow)
        ctx.strokeStyle = r.isWaiting
          ? '#ffffff'
          : isActive
          ? color.top
          : 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = r.isWaiting ? 2 : isActive ? 1.5 : 1;
        this._roundRect(ctx, x + 0.5, y + 0.5, Math.max(1, w - 1), Math.max(1, h - 1), radius);
        ctx.stroke();

        // Üst Cam Parlaması (Specular Cap)
        if (h > 10) {
          const capH = Math.min(6, h * 0.28);
          const capGrad = ctx.createLinearGradient(x, y + 1, x, y + 1 + capH);
          capGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
          capGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
          ctx.fillStyle = capGrad;
          this._roundRect(ctx, x + 1.5, y + 1.5, Math.max(1, w - 3), capH, Math.max(1, radius - 1));
          ctx.fill();
        }

        // Tuşa Değme Noktasında Parlak Kontak Işığı
        if ((r.isHitting || r.isHeld) && h > 8) {
          const hitH = Math.min(10, h * 0.4);
          const hitGrad = ctx.createLinearGradient(x, y + h - hitH, x, y + h);
          hitGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          hitGrad.addColorStop(1, 'rgba(255, 255, 255, 0.65)');
          ctx.fillStyle = hitGrad;
          this._roundRect(ctx, x + 1, y + h - hitH, Math.max(1, w - 2), hitH, Math.max(1, radius - 1));
          ctx.fill();
        }

        // Nota İsmi Rozeti
        if (h >= 22 && w >= 13 && this.labelMode !== 'none') {
          const noteText = this.useTurkishNotes ? key.nameTr : key.name;
          const fontSize = Math.min(10.5, Math.max(8, Math.floor(w * 0.46)));
          ctx.fillStyle = 'rgba(6, 10, 20, 0.42)';
          const pillW = Math.min(w - 3, Math.max(12, w * 0.78));
          const pillH = fontSize + 4;
          this._roundRect(ctx, x + (w - pillW) * 0.5, y + h - pillH - 3, pillW, pillH, 4);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(noteText, x + w * 0.5, y + h - pillH * 0.5 - 2.5);
        }

        ctx.restore();
      };

      for (let i = 0; i < passWhite.length; i++) drawSingleBar(passWhite[i]);
      for (let i = 0; i < passBlack.length; i++) drawSingleBar(passBlack[i]);
    }

    _drawVelvetRailAndFlares(ctx, dt) {
      const y = this.highwayHeight;
      const w = this.width;
      const fh = this.feltHeight;

      // 1. Modern Anodize Koyu Metal & Lazer Ufuk Şeridi
      ctx.fillStyle = this._cachedGrads.railGrad;
      ctx.fillRect(0, y, w, fh);

      // İnce üst neon ufuk çizgisi
      ctx.fillStyle = 'rgba(45, 212, 191, 0.28)';
      ctx.fillRect(0, y, w, 1.2);

      // 2. Basılı veya bekleyen tuşların tam üzerinde parlayan dinamik LED bar
      for (const [midi, info] of this.pressedKeys.entries()) {
        const key = this.layout.byMidi.get(midi);
        if (!key) continue;
        const color = getNoteColor(midi, key.isBlack, this.themeId, 60, info.hand);
        ctx.save();
        ctx.fillStyle = color.top;
        ctx.shadowColor = color.fill;
        ctx.shadowBlur = 12;
        this._roundRect(ctx, key.laneX - 1, y + 1, key.laneWidth + 2, fh - 2, 3);
        ctx.fill();
        ctx.restore();
      }

      // 3. Tuş vuruşlarındaki genişleyen ışık dalgaları (flares)
      if (this.flares.length > 0) {
        let writeIdx = 0;
        ctx.save();
        for (let i = 0; i < this.flares.length; i++) {
          const fl = this.flares[i];
          fl.width += dt * 95;
          fl.alpha -= dt * 3.1;
          if (fl.alpha <= 0.02) continue;
          this.flares[writeIdx++] = fl;

          const halfW = fl.width * 0.5;
          const grad = ctx.createLinearGradient(fl.x - halfW, y, fl.x + halfW, y);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.5, fl.color);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = Math.max(0, Math.min(1, fl.alpha));
          ctx.fillStyle = grad;
          ctx.fillRect(fl.x - halfW, y - 1, fl.width, fh + 1);
        }
        ctx.restore();
        this.flares.length = writeIdx;
      }

      // 4. Bekleme modunda hedef nota rehber elması / oku
      if (this.waitingKeys.size > 0) {
        const bounce = Math.sin(this._pulsePhase * 1.35) * 4;
        ctx.save();
        for (const [midi, info] of this.waitingKeys.entries()) {
          const key = this.layout.byMidi.get(midi);
          if (!key) continue;
          const color = getNoteColor(midi, key.isBlack, this.themeId, 60, info.hand);
          const cx = key.centerX;
          const cy = y - 7 + bounce;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = color.fill;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(cx, cy + 6);
          ctx.lineTo(cx - 6.5, cy - 3);
          ctx.lineTo(cx, cy - 1);
          ctx.lineTo(cx + 6.5, cy - 3);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    _updateAndDrawParticles(ctx, dt) {
      this._spawnSustainedSparks(dt);
      if (this.particles.length === 0) return;

      let writeIdx = 0;
      ctx.save();
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 75 * dt;
        p.alpha -= p.decay * dt;
        if (p.alpha <= 0.02 || p.y > this.highwayHeight + 10) continue;
        this.particles[writeIdx++] = p;

        const a = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;

        ctx.globalAlpha = a * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      this.particles.length = writeIdx;
    }

    _drawFloatingTexts(ctx, dt) {
      if (this.floatingTexts.length === 0) return;
      let writeIdx = 0;
      ctx.save();
      ctx.font = '800 11.5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 1.45;
        if (ft.alpha <= 0.02) continue;
        this.floatingTexts[writeIdx++] = ft;

        ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
        ctx.fillStyle = 'rgba(4, 7, 15, 0.9)';
        ctx.fillText(ft.text, ft.x + 1, ft.y + 1.5);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.restore();
      this.floatingTexts.length = writeIdx;
    }

    _drawPianoKeybed(ctx) {
      const topY = this.highwayHeight + this.feltHeight;
      const kh = this.keybedHeight;
      const blackHeight = Math.round(kh * 0.635);
      const pulse = 0.5 + 0.5 * Math.sin(this._pulsePhase);

      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, topY, this.width, kh);

      // 1. Beyaz Tuşlar
      const wks = this.layout.whiteKeys;
      for (let i = 0; i < wks.length; i++) {
        const wk = wks[i];
        const pressed = this.pressedKeys.get(wk.midi);
        const waiting = !pressed && this.waitingKeys.get(wk.midi);
        const wrongAlpha = this.wrongKeyFlashes.get(wk.midi) || 0;
        const isSustained = !pressed && this.sustainedKeys.has(wk.midi);
        const x = wk.x + 0.65;
        const w = Math.max(2, wk.width - 1.3);
        const h = pressed ? kh - 2 : kh - 4;
        const y = pressed ? topY + 2 : topY;
        const bottomRadius = Math.min(6, w * 0.24);

        ctx.save();
        if (pressed) {
          const color = getNoteColor(wk.midi, false, this.themeId, 60, pressed.hand);
          const grad = ctx.createLinearGradient(x, y, x, y + h);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.18, color.top);
          grad.addColorStop(0.7, color.fill);
          grad.addColorStop(1, color.border);
          ctx.fillStyle = grad;
        } else if (wrongAlpha > 0) {
          const grad = ctx.createLinearGradient(x, y, x, y + h);
          grad.addColorStop(0, '#ffe4e8');
          grad.addColorStop(1, `rgba(244, 63, 94, ${0.45 + wrongAlpha * 0.5})`);
          ctx.fillStyle = grad;
        } else if (waiting) {
          const color = getNoteColor(wk.midi, false, this.themeId, 60, waiting.hand);
          const grad = ctx.createLinearGradient(x, y, x, y + h);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.55, color.top);
          grad.addColorStop(1, color.fill);
          ctx.fillStyle = grad;
          ctx.shadowColor = color.glow;
          ctx.shadowBlur = 8 + pulse * 8;
        } else if (isSustained) {
          const color = getNoteColor(wk.midi, false, this.themeId, 60);
          const grad = ctx.createLinearGradient(x, y, x, y + h);
          grad.addColorStop(0, '#f1f5f9');
          grad.addColorStop(0.72, '#e2e8f0');
          grad.addColorStop(1, color.top);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = this._cachedGrads.whiteIdleGrad;
        }

        this._roundRectBottom(ctx, x, y, w, h, bottomRadius);
        ctx.fill();

        // 3B Ön Dudak (Key Lip Bevel) & Üst Gölge
        if (!pressed) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
          this._roundRectBottom(ctx, x, y + h - 5, w, 5, bottomRadius);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fillRect(x + 1, y + h - 6.5, Math.max(1, w - 2), 1.5);
        }

        ctx.restore();

        this._drawWhiteKeyLabels(ctx, wk, x, y, w, h, !!pressed || !!waiting);
      }

      // Piyano Üst Gölge Şeridi (Tuşların ufuk şeridi altına girdiği derinlik hissi)
      const topShadow = ctx.createLinearGradient(0, topY, 0, topY + 8);
      topShadow.addColorStop(0, 'rgba(4, 7, 15, 0.45)');
      topShadow.addColorStop(1, 'rgba(4, 7, 15, 0)');
      ctx.fillStyle = topShadow;
      ctx.fillRect(0, topY, this.width, 8);

      // 2. Siyah Tuşlar
      const bks = this.layout.blackKeys;
      for (let i = 0; i < bks.length; i++) {
        const bk = bks[i];
        const pressed = this.pressedKeys.get(bk.midi);
        const waiting = !pressed && this.waitingKeys.get(bk.midi);
        const wrongAlpha = this.wrongKeyFlashes.get(bk.midi) || 0;
        const isSustained = !pressed && this.sustainedKeys.has(bk.midi);
        const x = bk.x;
        const w = bk.width;
        const h = pressed ? blackHeight + 2 : blackHeight;
        const y = topY;

        ctx.save();

        // Siyah tuşun beyaz tuşlar üzerine düşen yumuşak gölgesi
        ctx.fillStyle = pressed ? 'rgba(2, 6, 23, 0.42)' : 'rgba(2, 6, 23, 0.62)';
        this._roundRectBottom(ctx, x + 1.2, y + 3, w + 0.5, h + (pressed ? 1 : 3), 4.5);
        ctx.fill();

        if (pressed || waiting) {
          const hand = (pressed || waiting).hand;
          const color = getNoteColor(bk.midi, true, this.themeId, 60, hand);
          const grad = ctx.createLinearGradient(x, y, x, y + h);
          grad.addColorStop(0, color.top);
          grad.addColorStop(0.55, color.fill);
          grad.addColorStop(1, color.border);
          ctx.fillStyle = grad;
          if (waiting) {
            ctx.shadowColor = color.glow;
            ctx.shadowBlur = 8 + pulse * 8;
          }
        } else if (wrongAlpha > 0) {
          ctx.fillStyle = '#e11d48';
        } else {
          ctx.fillStyle = this._cachedGrads.blackIdleOuterGrad;
        }

        this._roundRectBottom(ctx, x, y, w, h, 4.5);
        ctx.fill();

        // Siyah tuş 3B üst yüzey (Chamfered Top Surface)
        const inset = Math.max(1.5, w * 0.13);
        const bevelH = Math.max(10, h - (pressed ? 4 : 9));
        if (pressed || waiting) {
          ctx.shadowBlur = 0;
          const hand = (pressed || waiting).hand;
          const color = getNoteColor(bk.midi, true, this.themeId, 60, hand);
          ctx.fillStyle = color.top;
        } else if (wrongAlpha > 0) {
          ctx.fillStyle = '#fb7185';
        } else if (isSustained) {
          const color = getNoteColor(bk.midi, true, this.themeId, 60);
          ctx.fillStyle = color.border;
        } else {
          ctx.fillStyle = this._cachedGrads.blackIdleTopGrad;
        }
        this._roundRectBottom(ctx, x + inset, y, Math.max(2, w - inset * 2), bevelH, 3);
        ctx.fill();

        // Siyah tuş alt-ön parlama çizgisi
        if (!pressed && !waiting) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.fillRect(x + inset + 0.5, y + bevelH - 1.5, Math.max(1, w - inset * 2 - 1), 1.2);
        }

        ctx.restore();

        this._drawBlackKeyLabels(ctx, bk, x, y, w, h, !!pressed || !!waiting);
      }
    }

    _drawWhiteKeyLabels(ctx, wk, x, y, w, h, isHighlighted) {
      if (w < 11 || this.labelMode === 'none') return;

      const pcLabel = this.pcLabels.get(wk.midi);
      const showPc = (this.labelMode === 'both' || this.labelMode === 'pc') && pcLabel;
      const showNote =
        this.labelMode === 'both' ||
        this.labelMode === 'note' ||
        this.labelMode === 'tr' ||
        wk.pitchClass === 0;

      if (showPc && w >= 13) {
        const badgeW = Math.min(w - 4, 22);
        const badgeH = 16;
        const bx = x + (w - badgeW) * 0.5;
        const by = y + h - 43;

        ctx.fillStyle = isHighlighted ? 'rgba(6, 10, 20, 0.32)' : 'rgba(15, 23, 42, 0.09)';
        this._roundRect(ctx, bx, by, badgeW, badgeH, 4.5);
        ctx.fill();

        ctx.fillStyle = isHighlighted ? '#060911' : '#334155';
        ctx.font = `700 ${Math.min(10, Math.max(8, Math.floor(w * 0.42)))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pcLabel, x + w * 0.5, by + badgeH * 0.5 + 0.5);
      }

      if (showNote) {
        const isC = wk.pitchClass === 0;
        const useTr = this.useTurkishNotes || this.labelMode === 'tr';
        const text = isC
          ? useTr
            ? wk.fullNameTr
            : wk.fullName
          : useTr
          ? wk.nameTr
          : wk.name;

        ctx.fillStyle = isHighlighted
          ? '#060911'
          : isC
          ? '#0f172a'
          : '#64748b';
        ctx.font = `${isC ? '800' : '600'} ${Math.min(11, Math.max(8, Math.floor(w * 0.44)))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, x + w * 0.5, y + h - 9);
      }
    }

    _drawBlackKeyLabels(ctx, bk, x, y, w, h, isHighlighted) {
      if (w < 9 || this.labelMode === 'none') return;
      const pcLabel = this.pcLabels.get(bk.midi);
      const showPc = (this.labelMode === 'both' || this.labelMode === 'pc') && pcLabel;

      if (showPc) {
        ctx.fillStyle = isHighlighted ? '#060911' : '#e2e8f0';
        ctx.font = `700 ${Math.min(10, Math.max(8, Math.floor(w * 0.55)))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pcLabel, x + w * 0.5, y + h - 10);
      } else if (this.labelMode === 'note' || this.labelMode === 'tr') {
        const useTr = this.useTurkishNotes || this.labelMode === 'tr';
        const text = useTr ? bk.nameTr : bk.name;
        ctx.fillStyle = isHighlighted ? '#060911' : 'rgba(226, 232, 240, 0.75)';
        ctx.font = `600 ${Math.min(9, Math.max(7, Math.floor(w * 0.5)))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, x + w * 0.5, y + h - 10);
      }
    }

    _roundRect(ctx, x, y, w, h, r) {
      const rad = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    }

    _roundRectBottom(ctx, x, y, w, h, r) {
      const rad = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.closePath();
    }
  }

  root.EmochordVisualizer = { NoteFlowVisualizer };
})(typeof globalThis !== 'undefined' ? globalThis : this);
