// js/audio.js — Web Audio API Synthesizer (Space drone & sci-fi sound effects)

let ctx = null;
let soundEnabled = false; // Start muted, user toggles

let ambOsc1, ambOsc2, ambGain, ambFilter;

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) ctx = new AudioCtx();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

// ─── YouTube Background Music Control ──────────────────────
export function playYouTubeBGM() {
  try {
    const iframe = document.getElementById('youtube-bgm');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  } catch (err) {
    console.warn('[Audio] YouTube BGM play error:', err);
  }
}

export function pauseYouTubeBGM() {
  try {
    const iframe = document.getElementById('youtube-bgm');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  } catch (err) {
    console.warn('[Audio] YouTube BGM pause error:', err);
  }
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    startSpaceDrone();
    playYouTubeBGM();
    playChirp();
  } else {
    stopSpaceDrone();
    pauseYouTubeBGM();
  }
  return soundEnabled;
}

export function isSoundOn() {
  return soundEnabled;
}

// ─── Ambient Space Drone ──────────────────────────────────
export function startSpaceDrone() {
  if (!soundEnabled) return;
  const ac = getContext();
  if (!ac || ambOsc1) return;

  try {
    ambGain = ac.createGain();
    ambGain.gain.setValueAtTime(0.04, ac.currentTime);

    ambFilter = ac.createBiquadFilter();
    ambFilter.type = 'lowpass';
    ambFilter.frequency.setValueAtTime(180, ac.currentTime);

    ambOsc1 = ac.createOscillator();
    ambOsc1.type = 'sine';
    ambOsc1.frequency.setValueAtTime(45, ac.currentTime);

    ambOsc2 = ac.createOscillator();
    ambOsc2.type = 'triangle';
    ambOsc2.frequency.setValueAtTime(56.25, ac.currentTime);

    ambOsc1.connect(ambGain);
    ambOsc2.connect(ambGain);
    ambGain.connect(ambFilter);
    ambFilter.connect(ac.destination);

    ambOsc1.start();
    ambOsc2.start();
  } catch (e) {}
}

export function stopSpaceDrone() {
  if (ambOsc1) {
    try {
      ambOsc1.stop(); ambOsc2.stop();
      ambOsc1.disconnect(); ambOsc2.disconnect();
    } catch(e) {}
    ambOsc1 = null; ambOsc2 = null;
  }
}

// ─── Sound Effects ────────────────────────────────────────
export function playChirp() {
  if (!soundEnabled) return;
  const ac = getContext();
  if (!ac) return;

  try {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.05);

    gain.gain.setValueAtTime(0.07, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + 0.05);
  } catch(e) {}
}

export function playWarpSound() {
  if (!soundEnabled) return;
  const ac = getContext();
  if (!ac) return;

  try {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ac.currentTime + 0.3);

    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ac.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + 0.3);
  } catch(e) {}
}
