# 🎹 Emochord v2 – Piano & MIDI Practice Studio

<p align="center">
  <a href="README.md">Türkçe</a> •
  <a href="README.en.md"><strong>English</strong></a>
</p>

**Emochord v2** is a modern, offline piano practice studio and falling-notes MIDI visualizer. It provides an intuitive, distraction-free environment to learn piano pieces at your own pace, visualize notes, detect chords in real time, and practice using any USB/MIDI keyboard or computer keyboard.

The application runs 100% offline—no account required, no internet connection needed, and zero telemetry collected.

---

## ✨ What Does Emochord Do?

Emochord turns standard MIDI files into an interactive "falling notes" highway flowing straight into a virtual piano keyboard. It bridges the gap between passive listening and active muscle memory training with four dedicated modes:

### 1. 🎯 4 Distinct Modes
* **Wait Mode (Interactive Practice):** The falling notes pause at the hit line and wait until you press the correct piano key(s). If you hit a wrong note, it guides you without advancing. Accompaniment notes stay perfectly in sync.
* **Rhythm Mode:** Notes flow steadily at the chosen tempo. Test your timing accuracy with real-time scoring (Perfect, Good, Miss) and combo multiplier streaks.
* **Free Play Mode:** Play freely like an acoustic piano using your MIDI keyboard, computer keys, or mouse. Notes flow upward as you play and can be recorded into a clean MIDI file.
* **Watch & Listen Mode:** Sit back and let the studio play any MIDI file with high-fidelity visualization and keyboard illumination.

### 2. 🎼 Real-Time Music Intelligence & HUD
* **Instant Chord Detection:** Displays the current harmony (e.g., *C Major, Am7, F#dim*) live on the top floating HUD bar as you play.
* **Hand Separation (Left / Right):** Intelligently splits MIDI tracks into left-hand (blue) and right-hand (green) note streams. You can isolate practice to right hand only, left hand only, or play both hands together.
* **A-B Loop Engine:** Set custom start (A) and end (B) markers on the timeline to drill challenging musical passages on repeat until mastered.
* **Sustain Pedal Support:** Full physical MIDI sustain pedal support and computer spacebar toggle with realistic string resonance release.

### 3. 🎨 Minimalist, Focused Interface
* **Full-Width Interactive Timeline:** Scrub or click to any second of the song with instant time preview on hover.
* **Clean Key Lighting:** Pressing a key illuminates it in the exact color of the corresponding hand—clean and elegant, without distracting explosion or fire effects.
* **Adjustable Keyboards:** Automatically switch between 88 keys (full concert grand), 61 keys, 49 keys, or 37 compact studio keys.
* **Slide-out Settings Drawer (`M` key):** Quick-access drawer for song selection, tempo scaling (25% to 200%), key layout, themes, and sound profiles while keeping 98% of the screen dedicated to the note highway.

### 4. 🔊 Built-in Web Audio Synthesizer
* Includes 4 zero-latency algorithmic instruments (no heavy soundbank downloads required):
  * 🎹 **Concert Grand Piano**
  * ✨ **Electric Piano (Rhodes EP)**
  * 🎛️ **Neon Synth**
  * ⛪ **Church / Drawbar Organ**

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* npm (included with Node.js)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/<YOUR_USERNAME>/emochord-v2.git
cd emochord-v2
npm install
```

### Running the App

```bash
# 1. Desktop App (Electron):
npm start

# 2. Lightweight Web Browser Mode (runs on http://127.0.0.1:3030):
npm run web

# 3. Run Automated Unit Tests:
npm test
```

### Building Desktop Installers
You can build standalone distributables for Linux and Windows:

```bash
# Build Linux AppImage:
npm run dist

# Build Windows Portable (.exe):
npm run dist:win

# Build both:
npm run dist:all
```
Outputs will be generated inside the `dist/` directory.

---

## 📂 Included Classical MIDI Samples

The `assets/midi/` folder includes timeless public-domain masterpieces to get you started immediately:
* **Ludwig van Beethoven:** *Für Elise*
* **Ludwig van Beethoven:** *Ode to Joy*
* **Wolfgang Amadeus Mozart:** *Turkish March (Rondo alla Turca)*
* **Johann Sebastian Bach:** *Prelude in C Major (BWV 846)*
* **Traditional:** *Twinkle, Twinkle, Little Star* (Beginner exercise)

You can load any custom `.mid` or `.midi` file from your computer using the **Open MIDI File** button in the settings drawer.

---

## 🔒 Privacy & Offline Guarantee

* **100% Offline:** No network requests, external CDNs, tracking cookies, or third-party analytics.
* **Zero Telemetry:** What you play and record stays strictly on your local machine.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

*Disclaimer: Emochord is an independent open-source project and is not affiliated with any third-party commercial software or hardware trademarks.*
