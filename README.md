<p align="center">
  <img src="assets/icon.png" width="112" height="112" alt="Emochord Icon" />
</p>

<h1 align="center">🎹 Emochord v2</h1>

<p align="center">
  <strong>Modern, 100% offline piano practice studio and falling-notes MIDI visualizer.</strong><br>
  Interactive wait mode, real-time chord detection, hand separation, and zero telemetry.
</p>

<p align="center">
  <a href="https://github.com/Emolili999/emochord-v2/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Windows-2563eb.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Offline-100%25%20Local-10b981.svg" alt="Offline" />
  <img src="https://img.shields.io/badge/Telemetry-None-success.svg" alt="Zero Telemetry" />
  <img src="https://img.shields.io/badge/Tests-12%2F12%20Passing-brightgreen.svg" alt="Tests" />
</p>

<p align="center">
  <strong>English</strong> •
  <a href="README.tr.md">Türkçe</a>
</p>

---

## 🌟 Overview

**Emochord v2** transforms standard `.mid` / `.midi` files into an interactive, high-definition "falling notes" highway connecting directly into a virtual piano keybed. Designed for both beginners learning their first classical piece and intermediate players refining their timing, it bridges the gap between passive listening and active muscle memory.

Connect any **USB/MIDI keyboard**, use your **computer keyboard**, or click with your mouse. Emochord runs **100% locally and offline**—no account, no internet connection, and zero analytics.

---

## ✨ Key Features & Practice Modes

### 🎯 1. Four Dedicated Practice Modes
* **Interactive Wait Mode (Practice):** Falling notes pause right at the key hitline and wait until you strike the correct key(s) on your piano. Wrong notes guide you without advancing the piece, keeping accompanying notes perfectly in sync. Learn at your own pace without pressure.
* **Rhythm Mode:** Notes flow steadily at your selected tempo. Test your timing accuracy with real-time feedback (*Perfect*, *Good*, *Miss*), combo multipliers, and score tracking.
* **Free Play Mode:** Play freely just like an acoustic piano. Notes flow upward from the keybed as you play. Your entire performance can be recorded and exported as a clean standard `.mid` file with a single click.
* **Watch & Listen Mode:** Sit back and let the studio play any loaded song with full-screen smooth 60 FPS falling notes and illuminated keybed action.

---

### 🎼 2. Music Intelligence & Live HUD
* **Real-Time Chord Detection:** Analyzes pressed and falling harmonies instantly, displaying identified chords (*e.g., C Major, Am7, F#dim, Gsus4*) on the top floating HUD bar.
* **Intelligent Hand Separation:** Automatically detects and separates tracks into **Right Hand (Green)** and **Left Hand (Blue)** streams. Practice both hands together or isolate either hand individually.
* **A-B Loop Engine:** Set custom start (A) and end (B) timeline markers to loop difficult measures repeatedly until mastered.
* **Full Sustain Pedal Support:** Full physical USB MIDI sustain pedal support (CC 64) and computer `Spacebar` toggle with realistic acoustic string resonance release.
* **Full-Width Interactive Timeline:** Scrub or click to any second of the piece with real-time timecode preview on hover.

---

### 🎨 3. Minimalist, Distraction-Free UI
* **No Visual Clutter:** Clean, elegant keybed lighting that matches the active hand color without blinding fireworks or particle explosions.
* **Flexible Keybed Sizes:** Seamlessly toggle between **88 keys** (Concert Grand), **61 keys** (Standard Keyboard), **49 keys** (Studio), or **37 keys** (Compact).
* **Slide-out Settings Drawer (`M` Key):** Keeps 98% of your display dedicated to the note stream while providing quick access to tempo scaling (25% – 200%), sound engines, and piece selection.
* **Bilingual Interface:** Instant single-click toggle between **English** and **Türkçe**.

---

### 🔊 4. Built-In Web Audio Synthesizer
Zero configuration and no multi-gigabyte soundbank downloads required. Includes 4 zero-latency algorithmic instruments:
* 🎹 **Concert Grand Piano** (Rich multi-harmonic acoustic model)
* ✨ **Electric Piano (Rhodes EP)** (Warm vintage tine tone)
* 🎛️ **Neon Synth** (Crisp synth lead for modern tracks)
* ⛪ **Church / Drawbar Organ** (Warm harmonic organ timbre)

---

## ⌨️ Controls & Keybindings

| Key / Action | Function |
| :--- | :--- |
| **`Space`** | Play / Pause (or Sustain Pedal in Free Play mode) |
| **`M`** | Toggle Settings Drawer |
| **`F`** / **`F11`** | Toggle Fullscreen Mode |
| **`R`** | Restart Song from the beginning |
| **`[` / `]`** | Scale Tempo (-5% / +5%) |
| **Computer Keys (`A`, `W`, `S`...)** | Play virtual piano keys across octaves |
| **`Esc`** | Close dialogs / drawers |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
* npm (bundled with Node.js)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/Emolili999/emochord-v2.git
cd emochord-v2
npm install
```

### Running the Application

```bash
# 1. Desktop Application (Electron):
npm start

# 2. Browser Mode (Runs locally at http://127.0.0.1:3030):
npm run web

# 3. Run Automated Unit Tests:
npm test
```

### Building Standalone Installers
You can build standalone binaries for Linux and Windows:

```bash
# Build Linux AppImage:
npm run dist

# Build Windows Portable (.exe):
npm run dist:win

# Build both:
npm run dist:all
```
Compiled standalone files are placed in the `dist/` directory.

---

## 📂 Included Classical Masterpieces

The `assets/midi/` folder contains clean public-domain arrangements to start practicing right away:
* 🎼 **Ludwig van Beethoven:** *Für Elise*
* 🎼 **Ludwig van Beethoven:** *Ode to Joy (9th Symphony)*
* 🎼 **Wolfgang Amadeus Mozart:** *Turkish March (Rondo alla Turca)*
* 🎼 **Johann Sebastian Bach:** *Prelude in C Major (BWV 846)*
* 🎼 **Traditional:** *Twinkle, Twinkle, Little Star* (Beginner exercise)

You can also drag-and-drop or load **any custom `.mid` or `.midi` file** from your computer via the **Open MIDI File** button.

---

## 🔒 Privacy & Offline Guarantee

* **100% Local Execution:** No remote API calls, third-party analytics, telemetry, or external CDN dependencies.
* **Safe Sandbox Architecture:** Electron environment strictly isolates context and denies unauthorized navigation or popups.
* **Your Music Stays Yours:** Any performance recorded in Free Play mode remains saved exclusively on your local device.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for complete details.

*Disclaimer: Emochord is an independent open-source project and is not affiliated with, endorsed by, or associated with any third-party commercial software or hardware trademarks.*
