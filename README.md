<p align="center">
  <img src="assets/icon.png" width="96" height="96" alt="Emochord Icon" />
</p>

<h1 align="center">Emochord v2</h1>

<p align="center">
  <strong>An offline piano practice studio and MIDI falling-notes visualizer.</strong><br>
  Built with Electron and the Web Audio API. Featuring interactive key-wait training, real-time harmonic analysis, and zero telemetry.
</p>

<p align="center">
  <a href="https://github.com/Emolili999/emo-chord/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/platform-Linux%20%7C%20Windows-blue.svg?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/offline-100%25%20local-success.svg?style=flat-square" alt="Offline" />
  <img src="https://img.shields.io/badge/telemetry-none-success.svg?style=flat-square" alt="No Telemetry" />
  <img src="https://img.shields.io/badge/tests-12%2F12%20passed-brightgreen.svg?style=flat-square" alt="Tests" />
</p>

<p align="center">
  <strong>English</strong> &bull; <a href="README.tr.md">Türkçe</a>
</p>

---

## Overview

**Emochord** is a dedicated desktop application designed for practicing piano repertoire and visualizing Standard MIDI Files (`.mid`, `.midi`). It translates polyphonic note sequences into a synchronized falling-notes highway rendered on an HTML5 Canvas, mapped directly above a responsive virtual keybed.

The application operates entirely on-device with zero external network calls, subscriptions, or background tracking. Input is supported across hardware USB/MIDI controllers (via the Web MIDI API), standard computer keyboards, and mouse input.

---

## Core Capabilities

### Practice Engines

* **Key-Wait Mode (Interactive Practice):** The playback timeline halts whenever note bars reach the hit line and advances only after the user inputs the corresponding pitch. Accompanying notes remain synchronized, allowing performers to practice intricate passages without tempo pressure.
* **Rhythm Mode:** Notes flow continuously at a selected tempo multiplier (25% to 200%). The engine records timing deviations, scoring accuracy as *Perfect*, *Good*, or *Miss*, and tallies combo multipliers.
* **Free Play Mode:** Serves as a standalone digital instrument. Performed notes generate an upward waterfall visualization and can be captured directly to standard Type-0/Type-1 MIDI files or serialized JSON recordings.
* **Demonstration Mode:** Facilitates visual analysis of complex musical arrangements with real-time polyphonic keybed lighting.

### Real-Time Music Analysis

* **Harmonic Detection (HUD):** Analyzes active pitch-class sets concurrently and identifies chord classifications (major, minor, diminished, augmented, suspended, 7th chords) in real time.
* **Track & Hand Separation:** Automatically segregates polyphonic tracks into right-hand (treble) and left-hand (bass) streams, enabling isolated single-hand rehearsal or combined execution.
* **A-B Loop Isolation:** Allows marking arbitrary start ($A$) and end ($B$) timestamps on the timeline to loop specific measures continuously.
* **Sustain Pedal Integration:** Full support for physical MIDI sustain controllers (Control Change 64) and spacebar toggling with continuous acoustic damper decay modeling.

### Synthesizer & Audio Engine

Emochord incorporates an algorithmic synthesis engine using the Web Audio API, eliminating the need for multi-gigabyte sound libraries:

* **Concert Grand Piano:** Multi-oscillator physical modeling capturing hammer impact transients and harmonic resonance.
* **Electric Piano (Rhodes):** Frequency modulation synthesis replicating vintage electro-acoustic tine responses.
* **Neon Synthesizer:** Band-limited subtractive synth with low-pass filtering.
* **Church Organ:** Additive harmonic drawbar architecture.

---

## Keybindings and Navigation

| Key | Context | Action |
| :--- | :--- | :--- |
| `Space` | Playback | Play / Pause |
| `Space` | Free Play | Hold to activate sustain damper |
| `M` | Global | Toggle configuration drawer |
| `F` / `F11` | Global | Toggle borderless fullscreen |
| `R` | Playback | Rewind timeline to start ($00:00$) |
| `[` / `]` | Playback | Decrease / Increase tempo by 5% |
| `A`, `W`, `S`... | Input | Computer keyboard piano mapping |
| `Esc` | Global | Dismiss modal dialogs and slide drawers |

---

## System Requirements

* **Operating System:** Linux (x86_64 AppImage) or Windows 10/11 (x64 Portable)
* **Runtime Environment:** [Node.js](https://nodejs.org/) v18.0.0 or higher (for building from source)
* **Package Manager:** `npm` v9.0.0 or higher

---

## Installation & Build Instructions

### Clone & Dependencies

```bash
git clone https://github.com/Emolili999/emo-chord.git
cd emo-chord
npm install
```

### Execution

```bash
# Launch desktop Electron application
npm start

# Launch local browser server (http://127.0.0.1:3030)
npm run web

# Execute test suite
npm test
```

### Building Standalone Distributables

Packaging is managed via `electron-builder`:

```bash
# Compile Linux AppImage
npm run dist

# Compile Windows Portable Executable (.exe)
npm run dist:win

# Compile all platform targets
npm run dist:all
```

Compiled binaries will be generated within the `dist/` directory:
* `dist/Emochord-v2-2.0.0-x86_64.AppImage`
* `dist/Emochord-v2-2.0.0-Portable.exe`

---

## Bundled Repertoire

The repository includes public-domain arrangements located in `assets/midi/`:

* **J.S. Bach:** *Prelude in C Major (BWV 846)*
* **L. v. Beethoven:** *Für Elise (WoO 59)*
* **L. v. Beethoven:** *Ode to Joy (Symphony No. 9, Op. 125)*
* **W.A. Mozart:** *Rondo alla Turca (Piano Sonata No. 11, K. 331)*
* **Traditional:** *Twinkle, Twinkle, Little Star*

Custom MIDI files can be imported directly via drag-and-drop or through the system file picker.

---

## Security and Privacy

* **Zero Network Footprint:** The application operates strictly offline. It does not establish outbound HTTP/WebSocket connections, load remote CDNs, or query analytics services.
* **Electron Sandboxing:** The main window enforces `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`. External navigation and window creation requests are strictly denied.
* **Local Data Persistence:** Application configurations and session recordings are written exclusively to standard operating system user data directories.

---

## License

This software is released under the [MIT License](./LICENSE).

```
Copyright (c) 2026 Emolili999
```
