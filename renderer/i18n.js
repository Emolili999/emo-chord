(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.EmochordI18n = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'emochord_lang';
  const DEFAULT_LANG = 'en'; // Varsayılan dil: İngilizce

  const TRANSLATIONS = {
    en: {
      appName: 'Emochord v2 – Modern Piano & MIDI Practice Studio',
      timelineTooltip: 'Click or drag to jump to any time in the piece',
      menuToggle: 'Studio Settings & Menu (M)',
      menuToggleAria: 'Settings Menu',
      restart: 'Restart',
      playPause: 'Play / Pause',
      play: 'Play',
      pause: 'Pause',
      stop: 'Stop',
      modes: {
        free: 'Free',
        wait: 'Practice',
        rhythm: 'Rhythm',
        listen: 'Listen'
      },
      modesLong: {
        free: '🎹 Free Piano',
        wait: '🎯 Wait Mode',
        rhythm: '⏱️ Rhythm',
        listen: '▶️ Watch & Listen'
      },
      modesTooltip: {
        free: 'Free Piano Mode: Played notes flow upward',
        wait: 'Wait Practice: Pauses until you strike the correct key',
        rhythm: 'Rhythm Practice: Scored continuous flow',
        listen: 'Watch & Listen: Plays automatically'
      },
      drawerBadges: {
        free: 'FREE PLAY',
        wait: 'WAIT PRACTICE',
        rhythm: 'RHYTHM PRACTICE',
        listen: 'LISTEN & WATCH'
      },
      liveHud: {
        chordReady: 'Free Piano Ready',
        notesHint: 'Play with Keyboard, Mouse or MIDI',
        scoreLabel: 'SCORE',
        streakLabel: 'STREAK',
        audioLabel: 'AUDIO'
      },
      sustain: {
        pedal: 'Pedal',
        tooltip: 'Sustain Pedal (Spacebar)',
        open: 'Sustain',
        locked: 'Sustain: Locked'
      },
      midi: {
        standby: 'MIDI: Standby',
        connected: 'MIDI: Connected',
        deviceBox: 'USB/MIDI Device',
        inputStandby: 'MIDI: Standby / Plug & Play'
      },
      buttons: {
        help: 'Keyboard Guide & Shortcuts (?)',
        fullscreen: 'Fullscreen (F11)',
        langToggle: 'Switch Language (EN / TR)',
        openFile: '📂 Open MIDI File',
        record: 'Record',
        recordStop: 'Stop',
        saveMidi: '💾 Download MIDI',
        metronome: '⏱ Metronome',
        particles: '✨ Visual Lighting Effects',
        helpModalBtn: '❓ Keyboard Guide',
        fullscreenBtn: '⛶ Fullscreen',
        close: 'Close (Esc)'
      },
      sections: {
        library: 'Song & MIDI Library',
        practice: 'Practice Modes & Hands',
        keyboard: 'Piano Keyboard & Sound Engine',
        visuals: 'Visual Themes, Acoustics & Settings',
        midi: 'MIDI / USB Keyboard Connection',
        monitor: 'Live Chord, Note & Performance Monitor'
      },
      songs: {
        selectTitle: 'Choose a song to practice',
        twinkle: '🌟 Beginner: Twinkle Twinkle (Easy Practice)',
        fur_elise: '🎼 Beethoven – Für Elise',
        ode_to_joy: '🎼 Beethoven – Ode to Joy',
        turkish_march: '🎼 Mozart – Turkish March (Alla Turca)',
        bach_prelude: '🎼 Bach – Prelude in C Major',
        recorded: '🎙️ My Recording (Free Play)',
        customPrefix: '🎹 '
      },
      hands: {
        label: 'Hands to Play',
        both: '🙌 Both Hands',
        right: '🤚 Right Hand',
        left: '✋ Left Hand',
        labelsMap: {
          both: 'Both Hands',
          right: 'Right Hand',
          left: 'Left Hand'
        }
      },
      practiceFields: {
        modeLabel: 'Practice Mode',
        tempoLabel: 'Tempo / Speed',
        slowDown: 'Slow down (-10%)',
        speedUp: 'Speed up (+10%)',
        loopLabel: 'A–B Loop Section',
        setA: 'Set A',
        setB: 'Set B',
        clearLoop: 'Clear Loop',
        metronomeLabel: 'Rhythm Guide'
      },
      keyboardControls: {
        instrumentLabel: 'Instrument Sound',
        instruments: {
          grand_piano: '🎹 Concert Grand Piano',
          electric_piano: '✨ Electric Piano (Rhodes)',
          neon_synth: '🎛️ Neon Synth',
          drawbar_organ: '⛪ Church / Organ',
          music_box: '💎 Crystal Music Box'
        },
        sizeLabel: 'Piano Size',
        sizes: {
          '88': '88 Keys (Full Piano A0–C8)',
          '61': '61 Keys (Standard C2–C7)',
          '49': '49 Keys (Studio C2–C6)',
          '37': '37 Keys (Compact C3–C6)'
        },
        octaveLabel: 'Octave',
        transposeLabel: 'Transpose',
        pedalLabel: 'Pedal'
      },
      visualsControls: {
        themeLabel: 'Color Theme',
        themes: {
          classic: 'Classic (Green & Blue)',
          aurora: '✨ Aurora Fresh (Teal & Sky)',
          luminary: '🔮 Luminary Studio (Purple & Coral)',
          cyberpunk: '⚡ Cyberpunk Neon',
          emerald: '💎 Emerald & Gold',
          fire: '🔥 Fire & Amber',
          rainbow: '🌈 Chromatic Rainbow'
        },
        keyLabelsLabel: 'Key Labels',
        keyLabels: {
          both: 'Key Letter + Note (C4 / Q)',
          pc: 'Key Letter Only (Q)',
          note: 'Note Names (C, D, E)',
          tr: 'Solfège (Do, Re, Mi)',
          none: 'Hide Labels'
        },
        languageLabel: 'Language / Dil',
        speedLabel: 'Note Fall Speed',
        reverbLabel: 'Hall Reverb',
        volumeLabel: 'Master Volume'
      },
      lcd: {
        chordReady: 'Ready — Start Playing',
        notesReady: 'Play with computer keyboard, mouse or MIDI keyboard',
        score: 'SCORE',
        streak: 'STREAK',
        accuracy: 'ACCURACY',
        audio: 'AUDIO',
        recording: '● Recording in Progress...',
        recordingDesc: 'All played notes are being recorded',
        recordDone: 'Recording Complete ({count} Notes)',
        recordDoneSub: 'Press Play to practice with your recording or download as MIDI',
        recordEmpty: 'Recording Stopped (No Notes)',
        noRecording: 'No Recording Yet',
        noRecordingSub: 'Click "Record" and play some notes first, or choose a song',
        expectedKey: '🎯 Expected Key',
        progress: 'Progress',
        notesCount: 'Notes',
        octaveDown: ' (Octave Down: ←)',
        octaveUp: ' (Octave Up: →)',
        fileReadErr: 'File Read Error',
        invalidFile: 'Invalid file format'
      },
      drop: {
        title: 'Drop MIDI (.mid) or Recording File Here',
        sub: 'Play freely or practice in Wait Mode'
      },
      summary: {
        title: '🏆 Practice Complete – Performance Report',
        score: 'TOTAL SCORE',
        accuracy: 'ACCURACY',
        streak: 'MAX STREAK',
        hits: 'PERFECT / GOOD',
        wrong: 'WRONG KEYS',
        missed: 'MISSED NOTES',
        retry: '🔄 Retry Practice',
        free: '🎹 Back to Free Play',
        modeNames: {
          wait: 'Wait Practice',
          rhythm: 'Rhythm Practice',
          listen: 'Watch & Listen'
        }
      },
      help: {
        title: '🎹 Emochord Studio – Practice & Controls Guide',
        section1: '1. Practice Modes',
        waitDesc: '<strong>🎯 Practice (Wait Mode):</strong> Notes flow down toward the keys. The song pauses at each note until you hit the right key, with visual guides. Accompaniment notes remain synced!',
        rhythmDesc: '<strong>⏱️ Rhythm Practice:</strong> The song flows continuously; timing accuracy awards points and combo multipliers.',
        handDesc: '<strong>🤚 Right Hand / ✋ Left Hand:</strong> Pick one hand to practice; the other hand is played automatically by the studio!',
        section2: '2. Computer Keyboard Controls (2 Octaves)',
        whiteUpper: '<strong>Upper Row White Keys (C4–G5):</strong> <code>Q W E R T Y U I O P Ğ Ü</code>',
        blackUpper: '<strong>Upper Row Black Keys:</strong> <code>2 3</code> &nbsp; <code>5 6 7</code> &nbsp; <code>9 0 =</code>',
        whiteLower: '<strong>Lower Row White Keys (C3–E4):</strong> <code>Z X C V B N M Ö Ç .</code>',
        blackLower: '<strong>Lower Row Black Keys:</strong> <code>S D</code> &nbsp; <code>G H J</code> &nbsp; <code>L Ş</code>',
        section3: '3. A–B Loop Practice & Timeline',
        loopDesc: 'Click anywhere on the glowing top timeline bar to scrub immediately. Set A and B points to loop difficult sections on repeat.',
        section4: '4. Quick Shortcuts',
        s1: '<strong>Settings Drawer:</strong> <code>M</code> key',
        s2: '<strong>Sustain Pedal:</strong> <code>Spacebar</code>',
        s3: '<strong>Octave / Transpose:</strong> <code>← →</code> and <code>↓ ↑</code> arrow keys',
        s4: '<strong>Mute All Notes:</strong> <code>Esc</code>'
      },
      visualizer: {
        wrong: 'MISS',
        bar: 'BAR'
      }
    },

    tr: {
      appName: 'Emochord v2 – Modern Piyano & MIDI Pratik Stüdyosu',
      timelineTooltip: 'Parça içinde istediğiniz saniyeye gitmek için tıklayın veya sürükleyin',
      menuToggle: 'Stüdyo Ayarları ve Menü (M)',
      menuToggleAria: 'Ayarlar Menüsü',
      restart: 'Başa Sar',
      playPause: 'Başlat / Duraklat',
      play: 'Başlat',
      pause: 'Duraklat',
      stop: 'Durdur',
      modes: {
        free: 'Serbest',
        wait: 'Pratik',
        rhythm: 'Ritim',
        listen: 'Dinle'
      },
      modesLong: {
        free: '🎹 Serbest Çal',
        wait: '🎯 Pratik (Tuş Beklemeli)',
        rhythm: '⏱️ Ritim Pratiği',
        listen: '▶️ İzle & Dinle'
      },
      modesTooltip: {
        free: 'Serbest Piyano Modu: Bastığınız notalar yukarı doğru akar',
        wait: 'Beklemeli Pratik: Tuşa basmanızı bekler',
        rhythm: 'Akan Ritim Pratiği: Puanlamalı',
        listen: 'İzle & Dinle: Otomatik çalar'
      },
      drawerBadges: {
        free: 'SERBEST ÇALMA',
        wait: 'TUŞ BEKLEMELİ PRATİK',
        rhythm: 'RİTİM PRATİĞİ',
        listen: 'İZLE & DİNLE'
      },
      liveHud: {
        chordReady: 'Serbest Piyano Hazır',
        notesHint: 'Klavye, Fare veya MIDI ile çalın',
        scoreLabel: 'SKOR',
        streakLabel: 'SERİ',
        audioLabel: 'SES'
      },
      sustain: {
        pedal: 'Pedal',
        tooltip: 'Sustain Pedalı (Boşluk Tuşu)',
        open: 'Sustain',
        locked: 'Sustain: Kilitli'
      },
      midi: {
        standby: 'MIDI: Bekleniyor',
        connected: 'MIDI: Bağlandı',
        deviceBox: 'USB/MIDI Cihazı',
        inputStandby: 'MIDI: Tak-Çalıştır Bekleniyor'
      },
      buttons: {
        help: 'Klavye Rehberi & Kısayollar (?)',
        fullscreen: 'Tam Ekran (F11)',
        langToggle: 'Dili Değiştir (EN / TR)',
        openFile: '📂 MIDI Dosyası Aç',
        record: 'Kayıt',
        recordStop: 'Bitir',
        saveMidi: '💾 MIDI İndir',
        metronome: '⏱ Metronom',
        particles: '✨ Işık & Kıvılcım Efektleri',
        helpModalBtn: '❓ Klavye Rehberi',
        fullscreenBtn: '⛶ Tam Ekran',
        close: 'Kapat (Esc)'
      },
      sections: {
        library: 'Parça & MIDI Kütüphanesi',
        practice: 'Pratik Modları & Eller',
        keyboard: 'Piyano Klavyesi & Ses Motoru',
        visuals: 'Görsel Tema, Akustik & Efektler',
        midi: 'MIDI / USB Klavye & Org Bağlantısı',
        monitor: 'Canlı Akor, Nota & Performans Monitörü'
      },
      songs: {
        selectTitle: 'Çalışmak istediğiniz parçayı seçin',
        twinkle: '🌟 Başlangıç: Küçük Yıldız (Kolay Pratik)',
        fur_elise: '🎼 Beethoven – Für Elise',
        ode_to_joy: '🎼 Beethoven – Neşeye Övgü',
        turkish_march: '🎼 Mozart – Türk Marşı (Alla Turca)',
        bach_prelude: '🎼 Bach – C Majör Prelüd',
        recorded: '🎙️ Kaydım (Serbest Çalma)',
        customPrefix: '🎹 '
      },
      hands: {
        label: 'Pratik Eli',
        both: '🙌 İki El',
        right: '🤚 Sağ El',
        left: '✋ Sol El',
        labelsMap: {
          both: 'İki El',
          right: 'Sağ El',
          left: 'Sol El'
        }
      },
      practiceFields: {
        modeLabel: 'Çalışma Modu',
        tempoLabel: 'Tempo Hızı',
        slowDown: 'Yavaşlat (-%10)',
        speedUp: 'Hızlandır (+%10)',
        loopLabel: 'A–B Bölüm Döngüsü',
        setA: 'A Seç',
        setB: 'B Seç',
        clearLoop: 'Döngüyü Temizle',
        metronomeLabel: 'Ritim Rehberi'
      },
      keyboardControls: {
        instrumentLabel: 'Enstrüman Sesi',
        instruments: {
          grand_piano: '🎹 Konser Piyanosu (Grand)',
          electric_piano: '✨ Elektrik Piyano (Rhodes)',
          neon_synth: '🎛️ Neon Synth',
          drawbar_organ: '⛪ Hammond / Kilise Orgu',
          music_box: '💎 Kristal Müzik Kutusu'
        },
        sizeLabel: 'Piyano Boyutu',
        sizes: {
          '88': '88 Tuş (Tam Piyano A0–C8)',
          '61': '61 Tuş (Standart Org C2–C7)',
          '49': '49 Tuş (Stüdyo C2–C6)',
          '37': '37 Tuş (Kompakt C3–C6)'
        },
        octaveLabel: 'Oktav',
        transposeLabel: 'Transpoze',
        pedalLabel: 'Pedal'
      },
      visualsControls: {
        themeLabel: 'Renk Teması',
        themes: {
          classic: 'Klasik (Yeşil & Mavi)',
          aurora: '✨ Aurora Fresh (Su Yeşili & Gök)',
          luminary: '🔮 Luminary Studio (Mor & Mercan)',
          cyberpunk: '⚡ Cyberpunk Neon',
          emerald: '💎 Zümrüt & Altın',
          fire: '🔥 Ateş & Kor',
          rainbow: '🌈 Kromatik Gökkuşağı'
        },
        keyLabelsLabel: 'Tuş Etiketleri',
        keyLabels: {
          both: 'Klavye Harfi + Nota',
          pc: 'Sadece Klavye Harfi',
          note: 'Nota İsimleri (C, D, E)',
          tr: 'Türkçe Nota (Do, Re, Mi)',
          none: 'Etiketleri Gizle'
        },
        languageLabel: 'Dil / Language',
        speedLabel: 'Akış Hızı',
        reverbLabel: 'Akustik Reverb',
        volumeLabel: 'Ana Ses'
      },
      lcd: {
        chordReady: 'Hazır — Çalmaya Başlayın',
        notesReady: 'Bilgisayar klavyesi, fare veya MIDI org ile çalabilirsiniz',
        score: 'SKOR',
        streak: 'SERİ',
        accuracy: 'DOĞRULUK',
        audio: 'SES',
        recording: '● Kayıt Yapılıyor...',
        recordingDesc: 'Çaldığınız tüm notalar kaydediliyor',
        recordDone: 'Kayıt Tamamlandı ({count} Nota)',
        recordDoneSub: 'Başlat butonuna basarak kaydınızla pratik yapabilir veya MIDI olarak indirebilirsiniz',
        recordEmpty: 'Kayıt Durduruldu (Nota Yok)',
        noRecording: 'Henüz Kayıt Yok',
        noRecordingSub: 'Önce "Kayıt" butonuna basıp birkaç nota çalın veya bir parça seçin',
        expectedKey: '🎯 Beklenen Tuş',
        progress: 'İlerleme',
        notesCount: 'Nota',
        octaveDown: ' (Oktav Düşür: ←)',
        octaveUp: ' (Oktav Yükselt: →)',
        fileReadErr: 'Dosya Okunamadı',
        invalidFile: 'Geçersiz dosya formatı'
      },
      drop: {
        title: 'MIDI (.mid) veya Kayıt Dosyasını Buraya Bırakın',
        sub: 'Serbest dinleyebilir veya Tuş Beklemeli Pratik modunda çalışabilirsiniz'
      },
      summary: {
        title: '🏆 Pratik Tamamlandı – Performans Karnesi',
        score: 'TOPLAM SKOR',
        accuracy: 'DOĞRULUK',
        streak: 'EN YÜKSEK SERİ',
        hits: 'MÜKEMMEL / İYİ',
        wrong: 'YANLIŞ TUŞ',
        missed: 'KAÇIRILAN NOTA',
        retry: '🔄 Tekrar Çalış',
        free: '🎹 Serbest Moda Dön',
        modeNames: {
          wait: 'Tuş Beklemeli Pratik',
          rhythm: 'Akan Ritim Pratiği',
          listen: 'İzle & Dinle'
        }
      },
      help: {
        title: '🎹 Emochord Studio – Pratik & Kontroller Rehberi',
        section1: '1. Pratik Modları',
        waitDesc: '<strong>🎯 Pratik (Tuş Beklemeli):</strong> Notalar yukarıdan klavyeye doğru akar. Nota tuşa ulaştığında şarkı duraklar ve tuşun üzerinde ışıklı rehber görünür. Doğru tuşa bastığınızda şarkı akmaya devam eder!',
        rhythmDesc: '<strong>⏱️ Ritim Pratiği:</strong> Şarkı durmadan akar; zamanlamanıza göre puan ve kombo serisi kazanırsınız.',
        handDesc: '<strong>🤚 Sağ El / ✋ Sol El:</strong> Tek eli seçtiğinizde diğer el stüdyo tarafından otomatik çalınır!',
        section2: '2. Bilgisayar Klavyesi ile Çalma (2 Oktav)',
        whiteUpper: '<strong>Üst Sıra Beyaz Tuşlar (C4–G5):</strong> <code>Q W E R T Y U I O P Ğ Ü</code>',
        blackUpper: '<strong>Üst Sıra Siyah Tuşlar:</strong> <code>2 3</code> &nbsp; <code>5 6 7</code> &nbsp; <code>9 0 =</code>',
        whiteLower: '<strong>Lower Row White Keys (C3–E4):</strong> <code>Z X C V B N M Ö Ç .</code>',
        blackLower: '<strong>Alt Sıra Siyah Tuşlar:</strong> <code>S D</code> &nbsp; <code>G H J</code> &nbsp; <code>L Ş</code>',
        section3: '3. A–B Bölüm Döngüsü & İlerleme Çubuğu',
        loopDesc: 'Ekranın en üstündeki ışıklı ilerleme çubuğuna tıklayarak istediğiniz saniyeye anında geçiş yapabilirsiniz. Zor kısımlar için A ve B noktalarını seçerek döngüye alabilirsiniz.',
        section4: '4. Hızlı Kısayollar',
        s1: '<strong>Ayarlar Çekmecesi:</strong> <code>M</code> tuşu',
        s2: '<strong>Sustain Pedalı:</strong> <code>Boşluk (Space)</code>',
        s3: '<strong>Oktav / Transpoze:</strong> <code>← →</code> ve <code>↓ ↑</code> ok tuşları',
        s4: '<strong>Tüm Sesleri Sustur / Kapat:</strong> <code>Esc</code>'
      },
      visualizer: {
        wrong: 'YANLIŞ',
        bar: 'ÖLÇÜ'
      }
    }
  };

  let currentLang = DEFAULT_LANG;

  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'tr')) {
        currentLang = saved;
      } else {
        currentLang = DEFAULT_LANG;
      }
    } catch {
      currentLang = DEFAULT_LANG;
    }
    applyLanguage(currentLang);
  }

  function getLang() {
    return currentLang;
  }

  function resolvePath(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  function t(key, fallback) {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let val = resolvePath(langDict, key);
    if (val === undefined && currentLang !== 'en') {
      val = resolvePath(TRANSLATIONS.en, key);
    }
    return val !== undefined ? val : (fallback !== undefined ? fallback : key);
  }

  function applyLanguage(lang) {
    if (lang !== 'en' && lang !== 'tr') lang = DEFAULT_LANG;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;

      // data-i18n
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        if (text !== undefined) {
          el.textContent = text;
        }
      });

      // data-i18n-html
      document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const key = el.getAttribute('data-i18n-html');
        const html = t(key);
        if (html !== undefined) {
          el.innerHTML = html;
        }
      });

      // data-i18n-title
      document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        const text = t(key);
        if (text !== undefined) {
          el.title = text;
        }
      });

      // data-i18n-aria
      document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria');
        const text = t(key);
        if (text !== undefined) {
          el.setAttribute('aria-label', text);
        }
      });

      // data-i18n-placeholder
      document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = t(key);
        if (text !== undefined) {
          el.placeholder = text;
        }
      });

      // Title
      document.title = t('appName', 'Emochord v2');

      // Dil değiştirici etiketlerini senkronize et
      const quickLangLabel = document.getElementById('quickLangLabel');
      if (quickLangLabel) quickLangLabel.textContent = lang.toUpperCase();

      const langSelect = document.getElementById('langSelect');
      if (langSelect && langSelect.value !== lang) langSelect.value = lang;

      // Özel olay fırlat
      window.dispatchEvent(new CustomEvent('emochord:languagechange', { detail: { lang } }));
    }
  }

  function setLanguage(lang) {
    applyLanguage(lang);
  }

  function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'tr' : 'en');
  }

  return {
    init,
    getLang,
    setLanguage,
    toggleLanguage,
    t,
    TRANSLATIONS
  };
});
