// js/ui.js — UI Panel management, notifications, encyclopedia rendering

import { PLANET_DATA, MISSIONS_DATA } from './data.js';
import { toggleSound, playChirp, playWarpSound, playYouTubeBGM } from './audio.js';

// ─── Panel References ──────────────────────────────────────
const $ = id => document.getElementById(id);

const panels = {
  planet: $('planet-panel'),
  encyclopedia: $('encyclopedia-panel'),
  missions: $('missions-panel'),
  settings: $('settings-panel'),
  about: $('about-panel'),
  mainMenu: $('main-menu'),
};

// ─── State ────────────────────────────────────────────────
let onFocusPlanet = null;
let onResetCamera = null;
let onExploreZoom = null;
let onReturnToGalaxy = null;
let onEncycPlanet = null;
let toastTimeout = null;
let eclipseTimeout = null;

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════
export function initUI(callbacks) {
  onFocusPlanet = callbacks.focusPlanet;
  onResetCamera = callbacks.resetCamera;
  onExploreZoom = callbacks.exploreZoom;
  onReturnToGalaxy = callbacks.returnToGalaxy;
  onEncycPlanet = callbacks.openEncyclopedia;

  buildEncyclopedia();
  buildMissions();
  bindMenuButtons();
  bindPlanetPanelButtons();
  bindSettingsCallbacks(callbacks);
  bindHUDButtons(callbacks);
  detectMobileAndSetupTutorial();
}

// ─── Android / Mobile Touch Tutorial & Detection ──────────
function detectMobileAndSetupTutorial() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isAndroid || /iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  if (isMobile) {
    // Update top bar hints for touch
    const hints = $('hud-hints');
    if (hints) {
      hints.innerHTML = `
        <span>👆 Tap: Select</span>
        <span>🔄 1-Finger: Rotate</span>
        <span>🤏 Pinch: Zoom</span>
      `;
    }

    // Update key hints box for mobile touch guide
    const keyHints = $('key-hints');
    if (keyHints) {
      keyHints.innerHTML = `
        <div class="key-row" style="color:var(--cyan); font-weight:700; letter-spacing:1px;">📱 TOUCH GUIDE</div>
        <div class="key-row">👆 Tap Planet</div>
        <div class="key-row">🔄 1-Finger Orbit</div>
        <div class="key-row">🤏 Pinch Zoom</div>
        <div class="key-row">🌌 Milky Way Zoom</div>
      `;
    }

    // Bind tutorial dismiss button
    $('btn-close-android-tut')?.addEventListener('click', () => {
      $('android-tutorial-modal').classList.add('hidden');
    });

    // Show Android touch guide alert modal when exploration starts
    if (isAndroid) {
      setTimeout(() => {
        $('android-tutorial-modal')?.classList.remove('hidden');
      }, 1500);
    }
  }
}

// ─── Menu Navigation ──────────────────────────────────────
function bindMenuButtons() {
  $('btn-explore').addEventListener('click', () => {
    playWarpSound();
    playYouTubeBGM();
    gsap.to('#main-menu', {
      opacity: 0, duration: 0.5, onComplete: () => {
        $('main-menu').classList.add('hidden');
        $('main-menu').style.opacity = '1';
      }
    });

    if (onExploreZoom) {
      onExploreZoom(() => {
        $('hud').classList.remove('hidden');
      });
    } else {
      $('hud').classList.remove('hidden');
    }
  });

  $('btn-encyclopedia').addEventListener('click', () => {
    $('main-menu').classList.add('hidden');
    openOverlay('encyclopedia-panel');
  });
  $('encyclopedia-close').addEventListener('click', () => {
    closeOverlay('encyclopedia-panel');
    $('main-menu').classList.remove('hidden');
  });

  $('btn-missions').addEventListener('click', () => {
    $('main-menu').classList.add('hidden');
    openOverlay('missions-panel');
  });
  $('missions-close').addEventListener('click', () => {
    closeOverlay('missions-panel');
    $('main-menu').classList.remove('hidden');
  });

  $('btn-settings').addEventListener('click', () => {
    $('main-menu').classList.add('hidden');
    openOverlay('settings-panel');
  });
  $('settings-close').addEventListener('click', () => {
    closeOverlay('settings-panel');
    $('main-menu').classList.remove('hidden');
  });

  $('btn-about').addEventListener('click', () => {
    $('main-menu').classList.add('hidden');
    openOverlay('about-panel');
  });
  $('about-close').addEventListener('click', () => {
    closeOverlay('about-panel');
    $('main-menu').classList.remove('hidden');
  });

  $('btn-menu-return').addEventListener('click', () => {
    closePlanetPanel();
    $('hud').classList.add('hidden');
    $('main-menu').classList.remove('hidden');
    gsap.fromTo('#main-menu', { opacity: 0 }, { opacity: 1, duration: 0.5 });
    if (onReturnToGalaxy) onReturnToGalaxy();
  });
}

// ─── HUD Buttons ──────────────────────────────────────────
function bindHUDButtons(callbacks) {
  // Time controls
  document.querySelectorAll('.tc-btn').forEach(btn => {
    if (btn.id === 'btn-pause') {
      btn.addEventListener('click', () => callbacks.togglePause());
      return;
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tc-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callbacks.setTimeScale(parseFloat(btn.dataset.speed));
    });
  });

  // Camera mode buttons
  document.querySelectorAll('.cam-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callbacks.setCameraMode(btn.dataset.mode);
    });
  });

  $('btn-back-system')?.addEventListener('click', () => {
    playChirp();
    if (onResetCamera) onResetCamera();
    $('btn-back-system').classList.add('hidden');
  });

  // Feature buttons
  $('btn-toggle-orbits').addEventListener('click', () => {
    playChirp();
    $('btn-toggle-orbits').classList.toggle('active');
    callbacks.toggleOrbits();
  });
  $('btn-toggle-distance').addEventListener('click', () => {
    playChirp();
    $('btn-toggle-distance').classList.toggle('active');
    callbacks.toggleDistance();
  });
  $('btn-spawn-spacecraft').addEventListener('click', () => {
    playChirp();
    $('btn-spawn-spacecraft').classList.toggle('active');
    callbacks.toggleSpacecraft();
  });
  $('btn-toggle-sound')?.addEventListener('click', () => {
    const on = toggleSound();
    $('btn-toggle-sound').classList.toggle('active', on);
    $('btn-toggle-sound').textContent = on ? '🔊 Audio' : '🔈 Audio';
  });

  // Distance close
  $('distance-close').addEventListener('click', () => {
    $('distance-panel').classList.add('hidden');
    $('btn-toggle-distance').classList.remove('active');
    callbacks.cancelDistance();
  });

  // Spacecraft close
  $('spacecraft-close').addEventListener('click', () => {
    $('spacecraft-panel').classList.add('hidden');
    $('btn-spawn-spacecraft').classList.remove('active');
    callbacks.cancelSpacecraft();
  });
}

// ─── Planet Panel ─────────────────────────────────────────
function bindPlanetPanelButtons() {
  $('planet-panel-close').addEventListener('click', closePlanetPanel);
  $('btn-focus-planet').addEventListener('click', () => {
    const name = $('planet-panel').dataset.planet;
    if (name && onFocusPlanet) onFocusPlanet(name);
  });
  $('btn-encyc-planet').addEventListener('click', () => {
    const name = $('planet-panel').dataset.planet;
    if (name) {
      closePlanetPanel();
      openOverlay('encyclopedia-panel');
    }
  });
}

// ─── Settings Callbacks ───────────────────────────────────
function bindSettingsCallbacks(callbacks) {
  $('set-bloom').addEventListener('change', e => callbacks.setBloom(e.target.checked));
  $('set-orbits').addEventListener('change', e => callbacks.showOrbits(e.target.checked));
  $('set-asteroids').addEventListener('change', e => callbacks.showAsteroids(e.target.checked));
  $('set-twinkle').addEventListener('change', e => callbacks.setTwinkle(e.target.checked));
  $('set-shooting').addEventListener('change', e => callbacks.setShooting(e.target.checked));
  $('set-bloom-strength').addEventListener('input', e => callbacks.setBloomStrength(parseFloat(e.target.value)));
}

// // ═══════════════════════════════════════════════════════════
// // PLANET INFO PANEL
// // ═══════════════════════════════════════════════════════════
// export function showPlanetPanel(key) {
//   const d = PLANET_DATA[key];
//   if (!d) return;

//   $('planet-panel').dataset.planet = key;

//   // Header
//   $('pp-icon').textContent  = d.icon;
//   $('pp-name').textContent  = d.name;
//   $('pp-type').textContent  = d.type;

//   // Stats
//   $('pp-diameter').textContent = d.diameter;
//   $('pp-gravity').textContent  = d.gravity;
//   $('pp-distance').textContent = d.distance;
//   $('pp-day').textContent      = d.dayLength;
//   $('pp-year').textContent     = d.yearLength;
//   $('pp-moons').textContent    = d.moons;
//   $('pp-temp').textContent     = d.temperature;
//   $('pp-atmo').textContent     = d.atmosphere;

//   // Description & fun fact
//   $('pp-desc').textContent    = d.description;
//   $('pp-funfact').textContent = d.funFact;

//   playWarpSound();

//   // Animate open — remove inert so close button is reachable
//   const panel = $('planet-panel');
//   panel.removeAttribute('inert');
//   panel.removeAttribute('aria-hidden');
//   panel.classList.add('open');
// }

// export function closePlanetPanel() {
//   const panel = $('planet-panel');
//   panel.classList.remove('open');
//   // Re-apply inert so keyboard / screen-reader focus cannot reach
//   // elements inside the offscreen panel
//   panel.setAttribute('inert', '');
//   if (onResetCamera) onResetCamera();
// }

// ═══════════════════════════════════════════════════════════
// ENCYCLOPEDIA
// ═══════════════════════════════════════════════════════════
function buildEncyclopedia() {
  const grid = $('encyc-grid');
  grid.innerHTML = '';

  const order = ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  const accentColors = {
    sun: '#ffcc00', mercury: '#9e9e9e', venus: '#e8cda0', earth: '#4a90d9',
    moon: '#b8b8b8', mars: '#c1440e', jupiter: '#c88b3a', saturn: '#e4d191',
    uranus: '#7de8e8', neptune: '#3d56b2'
  };

  order.forEach(key => {
    const d = PLANET_DATA[key];
    if (!d) return;
    const color = accentColors[key] || '#00d4ff';

    const card = document.createElement('div');
    card.className = 'encyc-card';
    card.style.borderColor = color + '33';
    card.style.setProperty('--card-color', color);
    card.innerHTML = `
      <style>.encyc-card:hover { border-color: ${color}66 !important; box-shadow: 0 8px 30px ${color}22; }</style>
      <span class="ec-icon">${d.icon}</span>
      <div class="ec-name">${d.name.toUpperCase()}</div>
      <div class="ec-type" style="color:${color}">${d.type}</div>
      <div class="ec-facts">
        <div class="ec-stat"><span class="ec-sl">Diameter</span><span class="ec-sv">${d.diameter}</span></div>
        <div class="ec-stat"><span class="ec-sl">Gravity</span><span class="ec-sv">${d.gravity}</span></div>
        <div class="ec-stat"><span class="ec-sl">Moons</span><span class="ec-sv">${d.moons}</span></div>
        <div class="ec-stat"><span class="ec-sl">Temperature</span><span class="ec-sv">${d.temperature}</span></div>
      </div>
      <p style="font-size:12px;color:#a8b8d8;line-height:1.6;margin-top:12px;">${d.description.slice(0, 120)}…</p>
    `;
    card.addEventListener('click', () => {
      closeOverlay('encyclopedia-panel');
      $('hud').classList.remove('hidden');
      if (onFocusPlanet) onFocusPlanet(key);
      showPlanetPanel(key);
    });
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════
// MISSIONS
// ═══════════════════════════════════════════════════════════
function buildMissions() {
  const list = $('missions-list');
  list.innerHTML = '';

  MISSIONS_DATA.forEach(m => {
    const card = document.createElement('div');
    card.className = 'mission-card';
    card.innerHTML = `
      <div class="mc-icon">${m.icon}</div>
      <div class="mc-body">
        <div class="mc-name">${m.name}</div>
        <div class="mc-agency">${m.agency} · ${m.target} · ${m.launched}</div>
        <div class="mc-desc">${m.description}</div>
        <span class="mc-status ${m.status}">${m.status.toUpperCase()}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════
// OVERLAY UTILS
// ═══════════════════════════════════════════════════════════
function openOverlay(id) {
  const el = $(id);
  el.classList.remove('hidden');
  gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
}

function closeOverlay(id) {
  const el = $(id);
  gsap.to(el, { opacity: 0, y: 20, duration: 0.25, ease: 'power2.in', onComplete: () => el.classList.add('hidden') });
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
export function showEclipseAlert() {
  const el = $('eclipse-alert');
  el.classList.remove('hidden');
  if (eclipseTimeout) clearTimeout(eclipseTimeout);
  eclipseTimeout = setTimeout(() => el.classList.add('hidden'), 6000);
}

export function hideEclipseAlert() {
  $('eclipse-alert').classList.add('hidden');
}

export function showToast(message, duration = 2500) {
  const toast = $('toast');
  $('toast-text').textContent = message;
  toast.classList.remove('hidden');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), duration);
}

export function updateDistanceUI(state, text, result = '') {
  const panel = $('distance-panel');
  if (state === 'hidden') { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  $('distance-text').textContent = text;
  $('distance-result').textContent = result;
}

export function updateSpacecraftUI(state, text = '', eta = '') {
  const panel = $('spacecraft-panel');
  if (state === 'hidden') { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  $('spacecraft-text').textContent = text;
  $('spacecraft-eta').textContent = eta;
}

export function updateCameraMode(mode) {
  const labels = { free: 'FREE CAMERA', follow: 'PLANET FOLLOW', cinematic: 'CINEMATIC MODE' };
  $('cam-mode-label').textContent = labels[mode] || mode.toUpperCase();
}

export function setPauseButton(paused) {
  $('btn-pause').textContent = paused ? '▶' : '⏸';
}

// ═══════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════
export function setLoadingProgress(pct, text) {
  const bar = $('loading-bar');
  if (bar) bar.style.width = pct + '%';
  const txt = $('loading-text');
  if (txt) txt.textContent = text;
}

export function hideLoadingScreen(callback) {
  const screen = $('loading-screen');
  screen.classList.add('fade-out');
  setTimeout(() => {
    screen.style.display = 'none';
    if (callback) callback();
  }, 900);
}

// Spawn CSS stars in loading screen
export function spawnLoadingStars() {
  const container = $('loading-stars');
  if (!container) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    star.className = 'loading-star';
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      --dur: ${(Math.random() * 3 + 1.5).toFixed(1)}s;
      --del: ${(Math.random() * 3).toFixed(1)}s;
      opacity: ${Math.random() * 0.5};
      width: ${Math.random() < 0.3 ? 2 : 1}px;
      height: ${Math.random() < 0.3 ? 2 : 1}px;
    `;
    container.appendChild(star);
  }
}
