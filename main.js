// js/main.js — Interactive Solar System · Three.js r168
// Full 3D scene: Sun, 8 planets, Moon, asteroids, stars, effects


import * as THREE from 'three';
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';

import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }       from 'three/addons/postprocessing/OutputPass.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';

import { PLANET_DATA } from './data.js';
import {
  initUI, showPlanetPanel, closePlanetPanel,
  showEclipseAlert, hideEclipseAlert, showToast,
  updateDistanceUI, updateSpacecraftUI, updateCameraMode,
  setPauseButton, setLoadingProgress, hideLoadingScreen,
  spawnLoadingStars
} from './ui.js';

// ═══════════════════════════════════════════════════════════
//  GLOBAL STATE
// ═══════════════════════════════════════════════════════════
let scene, camera, renderer, composer, bloomPass, controls, clock;
let timeScale = 1, paused = false;
let cameraMode = 'free';            // free | follow | cinematic
let followTarget = null;            // planet key string
let cinematicIndex = 0;
let cinematicTimer = 0;
const CINEMATIC_DWELL = 6;          // seconds per planet in cinematic mode

// Objects
let sun, sunGlow, sunSprite;
let starPoints, starUniforms;
let shootingStarsEnabled = true;
let twinkleEnabled = true;

const planets     = {};             // key → { mesh, group }
const orbitAngles = {};
const orbitLines  = {};
let orbitLinesVisible = true;
let asteroidsGroup;
let asteroidsVisible = true;
let moon, moonGroup;
let earthClouds, earthAtmosphere;
let earthShaderMat;

// Interaction
let raycaster, mouse;
let selectedPlanet = null;
const clickableMeshes = [];


// Distance mode
let distanceModeActive = false;
let distancePlanets    = [];
let distanceLine       = null;

// Spacecraft
let spacecraftModeActive = false;
let spacecraftMesh       = null;
let spacecraftTarget     = null;

// Eclipse
let eclipseActive = false;

// Shooting stars
const shootingStars = [];
let shootingTimer   = 0;

// ═══════════════════════════════════════════════════════════
//  ORBITAL PARAMETERS  (educational scale)
// ═══════════════════════════════════════════════════════════
const ORBITS = {
  mercury: { r: 14,  speed: 0.24,   start: 0.5,  rotSpeed: 0.004 },
  venus:   { r: 20,  speed: 0.095,  start: 2.0,  rotSpeed: 0.002 },
  earth:   { r: 28,  speed: 0.06,   start: 4.0,  rotSpeed: 0.02  },
  mars:    { r: 38,  speed: 0.032,  start: 1.0,  rotSpeed: 0.018 },
  jupiter: { r: 58,  speed: 0.013,  start: 3.5,  rotSpeed: 0.09  },
  saturn:  { r: 76,  speed: 0.007,  start: 0.2,  rotSpeed: 0.085 },
  uranus:  { r: 92,  speed: 0.003,  start: 2.8,  rotSpeed: 0.05  },
  neptune: { r: 108, speed: 0.0015, start: 5.0,  rotSpeed: 0.048 },
};
const PLANET_SIZES = {
  sun: 5.5, mercury: 0.5, venus: 1.0, earth: 1.1,
  mars: 0.7, jupiter: 3.5, saturn: 3.0, uranus: 1.8, neptune: 1.7
};
const MOON_ORBIT_R = 3.2;
let moonAngle = 0;

// ═══════════════════════════════════════════════════════════
//  INIT ENTRY POINT
// ═══════════════════════════════════════════════════════════
async function init() {
  spawnLoadingStars();
  setLoadingProgress(5, 'Initializing renderer…');

  setupRenderer();
  setupCamera();
  setupPostProcessing();
  setupControls();

  setLoadingProgress(20, 'Creating star field & Milky Way Galaxy…');
  createStars(20000);
  createMilkyWayGalaxy(35000);

  setLoadingProgress(35, 'Forging the Sun…');
  createSun();
  createLighting();

  setLoadingProgress(50, 'Loading 3D planet models (GLB)…');
  await createAllPlanets();



  setLoadingProgress(65, 'Shaping asteroid belt…');
  createAsteroidBelt();

  setLoadingProgress(75, 'Drawing orbit paths…');
  createOrbitLines();

  setLoadingProgress(85, 'Setting up spacecraft…');
  createSpacecraft();

  setLoadingProgress(95, 'Connecting controls…');
  setupInteraction();
  initUI(buildUICallbacks());

  setLoadingProgress(100, 'Launching into orbit…');
  await delay(600);

  // Hide solar system on menu load — only Milky Way galaxy visible behind main menu!
  setSolarSystemVisible(false);

  hideLoadingScreen(() => {
    document.getElementById('main-menu').classList.remove('hidden');
    gsap.fromTo('#main-menu', { opacity: 0 }, { opacity: 1, duration: 0.6 });
  });

  window.addEventListener('resize', onResize);
  animate();
}

// ─── Delay helper ─────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════
//  RENDERER
// ═══════════════════════════════════════════════════════════
function setupRenderer() {
  scene    = new THREE.Scene();
  clock    = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({
    canvas:    document.getElementById('solar-canvas'),
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200000);
  camera.position.set(300, 1600, 3300);
}

// ─── Milky Way Galaxy Particle Spiral (Orion Arm Positioned) ──
let galaxyMesh = null;
let galCenterOffset = new THREE.Vector3(-1200, 100, -900); // Sagittarius A* galactic core offset

function createMilkyWayGalaxy(count = 35000) {
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);

  const arms = 4;
  const radius = 3500;

  const colorCore  = new THREE.Color('#ffea9f'); // Sagittarius A* core
  const colorArm1  = new THREE.Color('#00d4ff'); // Orion Arm / Perseus Arm
  const colorArm2  = new THREE.Color('#8b5cf6'); // Sagittarius Arm
  const colorOuter = new THREE.Color('#38bdf8');

  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 2.2) * radius + 40;
    const armIndex = i % arms;
    const armAngle = (armIndex / arms) * Math.PI * 2;

    const spinAngle = r * 0.0028;
    const angle = armAngle + spinAngle;

    const randomX = (Math.random() - 0.5) * Math.pow(r / radius, 1.3) * 350;
    const randomY = (Math.random() - 0.5) * Math.pow(r / radius, 1.3) * 200;
    const randomZ = (Math.random() - 0.5) * Math.pow(r / radius, 1.3) * 350;

    // Position relative to galactic core
    const gx = Math.cos(angle) * r + randomX;
    const gy = randomY;
    const gz = Math.sin(angle) * r + randomZ;

    // Shift galaxy core so Solar System rests accurately on the Orion Arm at (0,0,0)!
    positions[i * 3]     = gx + galCenterOffset.x;
    positions[i * 3 + 1] = gy + galCenterOffset.y;
    positions[i * 3 + 2] = gz + galCenterOffset.z;

    const mixFactor = r / radius;
    const baseColor = colorCore.clone().lerp(mixFactor < 0.5 ? colorArm1 : colorArm2, mixFactor * 2);
    baseColor.lerp(colorOuter, Math.pow(mixFactor, 2));

    colors[i * 3]     = baseColor.r;
    colors[i * 3 + 1] = baseColor.g;
    colors[i * 3 + 2] = baseColor.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size:            4.5,
    vertexColors:    true,
    transparent:     true,
    opacity:         0.9,
    blending:        THREE.AdditiveBlending,
    depthWrite:      false,
    sizeAttenuation: true
  });

  galaxyMesh = new THREE.Points(geo, mat);
  galaxyMesh.rotation.x = Math.PI * 0.12;
  scene.add(galaxyMesh);
}

// ─── Solar System Visibility Control ────────────────────
function setSolarSystemVisible(visible) {
  if (sun) sun.visible = visible;
  if (typeof sunCorona !== 'undefined' && sunCorona) sunCorona.visible = visible;
  if (typeof sunFlare  !== 'undefined' && sunFlare)  sunFlare.visible  = visible;
  if (typeof lensflareMesh !== 'undefined' && lensflareMesh) lensflareMesh.visible = visible;
  if (moon) moon.visible = visible;
  if (asteroidsGroup) asteroidsGroup.visible = visible && asteroidsVisible;
  if (earthClouds) earthClouds.visible = visible;
  if (earthAtmosphere) earthAtmosphere.visible = visible;

  Object.values(planets).forEach(p => {
    if (p.mesh) p.mesh.visible = visible;
  });

  Object.values(orbitLines).forEach(line => {
    if (line) line.visible = visible && orbitLinesVisible;
  });
}

// ─── Cosmic Galaxy-to-Solar-System Zoom Transition ──────
function triggerGalaxyExploreZoom(onComplete) {
  camera.position.set(300, 1600, 3300);
  controls.target.set(0, 0, 0);

  if (galaxyMesh) {
    galaxyMesh.visible = true;
    galaxyMesh.material.opacity = 0.9;
  }

  showToast('🌌 Zooming from Milky Way (Orion Arm) into Solar System…', 3500);

  // Reveal Solar System objects as camera zooms in
  setSolarSystemVisible(true);

  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(controls.target);
  if (galaxyMesh) gsap.killTweensOf(galaxyMesh.material);

  gsap.to(camera.position, {
    x: 0,
    y: 55,
    z: 130,
    duration: 3.8,
    ease: 'power3.inOut',
    onUpdate: () => controls.update(),
    onComplete: () => {
      // Completely hide Milky Way galaxy once arrived in Solar System
      if (galaxyMesh) galaxyMesh.visible = false;
      if (onComplete) onComplete();
    }
  });

  if (galaxyMesh) {
    gsap.to(galaxyMesh.material, {
      opacity: 0,
      duration: 3.5,
      ease: 'power3.inOut'
    });
  }
}

function setupPostProcessing() {
  composer  = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2,   // strength
    0.5,   // radius
    0.55   // threshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor    = 0.04;
  controls.minDistance      = 3;
  controls.maxDistance      = 6000;
  controls.rotateSpeed      = 0.5;
  controls.zoomSpeed        = 1.2;
  controls.autoRotate       = false;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.resolution.set(window.innerWidth, window.innerHeight);
}

// ═══════════════════════════════════════════════════════════
//  STARS  (shader-based twinkling particle field)
// ═══════════════════════════════════════════════════════════
function createStars(count = 20000) {
  const positions = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  const phases    = new Float32Array(count);
  const colors    = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Distribute on an immense deep-space infinite sphere (radius 50,000 to 70,000)
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 50000 + Math.random() * 20000;

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    sizes[i]  = 1.0 + Math.random() * 2.5;
    phases[i] = Math.random() * Math.PI * 2;

    // Slight color variation: white, blue-white, yellow-white
    const t = Math.random();
    if      (t < 0.6) { colors[i*3]=1;   colors[i*3+1]=1;    colors[i*3+2]=1;    } // white
    else if (t < 0.8) { colors[i*3]=0.85; colors[i*3+1]=0.9; colors[i*3+2]=1;   } // blue-white
    else              { colors[i*3]=1;   colors[i*3+1]=0.95;  colors[i*3+2]=0.8; } // warm
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));

  starUniforms = { uTime: { value: 0 } };

  const mat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3  aColor;
      uniform   float uTime;
      varying   float vAlpha;
      varying   vec3  vColor;

      void main() {
        float twinkle = 0.65 + 0.35 * sin(uTime * 2.5 + aPhase);
        vAlpha = twinkle;
        vColor = aColor;

        vec4 mvPos    = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize  = aSize * (12000.0 / -mvPos.z) * twinkle;
        gl_Position   = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3  vColor;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float intensity = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, vAlpha * intensity);
      }
    `,
    blending:     THREE.AdditiveBlending,
    depthWrite:   false,
    transparent:  true,
  });

  starPoints = new THREE.Points(geo, mat);
  scene.add(starPoints);

  // Milky Way band — extra dense star strip
  addMilkyWayBand();
}

function addMilkyWayBand() {
  const count = 4000;
  const pos   = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const angle  = Math.random() * Math.PI * 2;
    const spread = (Math.random() - 0.5) * 0.28;
    const r      = 1800 + Math.random() * 200;
    pos[i*3]     = r * Math.cos(angle);
    pos[i*3+1]   = r * Math.sin(spread) * 600;
    pos[i*3+2]   = r * Math.sin(angle);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color:       0xaabbff,
    size:        1.5,
    sizeAttenuation: true,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
    transparent: true,
    opacity:     0.25,
  });
  scene.add(new THREE.Points(geo, mat));
}

// ═══════════════════════════════════════════════════════════
//  LIGHTING
// ═══════════════════════════════════════════════════════════
let lensflareMesh = null;

function createLighting() {
  // Sun light
  const sunLight = new THREE.PointLight(0xfff5e0, 3.5, 0, 0.1);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Ambient so dark sides aren't pitch black
  scene.add(new THREE.AmbientLight(0x111133, 0.08));

  // Lensflare on Sun
  const textureLoader = new THREE.TextureLoader();
  const flareCanvas   = makeFlareTexture();
  const flareTex      = new THREE.CanvasTexture(flareCanvas);

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(flareTex, 400, 0, new THREE.Color(1, 0.95, 0.7)));
  lensflare.addElement(new LensflareElement(flareTex, 100, 0.3, new THREE.Color(1, 0.7, 0.3)));
  lensflare.addElement(new LensflareElement(flareTex, 60,  0.6, new THREE.Color(0.7, 0.8, 1)));
  lensflare.addElement(new LensflareElement(flareTex, 40,  0.8, new THREE.Color(0.7, 0.8, 1)));
  sunLight.add(lensflare);
  lensflareMesh = lensflare;
}

function makeFlareTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0,   'rgba(255,255,255,1)');
  grd.addColorStop(0.1, 'rgba(255,230,150,0.8)');
  grd.addColorStop(0.5, 'rgba(255,150,50,0.2)');
  grd.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
  return c;
}

// ═══════════════════════════════════════════════════════════
//  SUN  (animated GLSL shader)
// ═══════════════════════════════════════════════════════════
function createSun() {
  const geo = new THREE.SphereGeometry(PLANET_SIZES.sun, 64, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv    = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 7; i++) { v += a * noise(p); p *= 2.1; a *= 0.48; }
        return v;
      }

      void main() {
        float t  = uTime * 0.12;
        float t2 = uTime * 0.07;
        vec2  uv = vUv;

        float n  = fbm(uv * 4.0 + vec2(t, t * 0.6));
        float n2 = fbm(uv * 8.0 - vec2(t2, t2 * 1.3));
        float n3 = fbm(uv * 16.0 + vec2(-t, t2));
        float f  = n * 0.55 + n2 * 0.30 + n3 * 0.15;

        vec3 c1 = vec3(1.0, 1.0,  0.35);   // bright yellow
        vec3 c2 = vec3(1.0, 0.55, 0.05);   // orange
        vec3 c3 = vec3(0.85, 0.12, 0.02);  // dark red

        vec3 col = mix(c3, c2, f);
        col = mix(col, c1, pow(f, 1.8));

        // Bright granules
        float g = fbm(uv * 20.0 + vec2(t * 3.0, 0.0));
        col += c1 * g * g * 0.45;

        // Limb darkening
        float limb = dot(vNormal, vec3(0.0, 0.0, 1.0));
        col *= 0.7 + 0.3 * abs(limb);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.FrontSide,
  });

  sun = new THREE.Mesh(geo, mat);
  sun.userData.key = 'sun';
  scene.add(sun);
  clickableMeshes.push(sun);

  // Additive glow halo
  const glowGeo = new THREE.SphereGeometry(PLANET_SIZES.sun * 1.18, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color:       new THREE.Color(1.0, 0.8, 0.2),
    transparent: true,
    opacity:     0.08,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
    side:        THREE.BackSide,
  });
  sunGlow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(sunGlow);

  // Soft glow sprite
  const spriteCanvas = makeGlowSprite(256, [255, 200, 80]);
  const spriteTex    = new THREE.CanvasTexture(spriteCanvas);
  const spriteMat    = new THREE.SpriteMaterial({
    map:      spriteTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.55,
  });
  sunSprite = new THREE.Sprite(spriteMat);
  sunSprite.scale.set(22, 22, 1);
  scene.add(sunSprite);

  // Solar flare spikes
  addSolarFlares();
}

function makeGlowSprite(size, rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
  g.addColorStop(0.15,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.6)`);
  g.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.1)`);
  g.addColorStop(1,   `rgba(0,0,0,0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function addSolarFlares() {
  const flareGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const angle  = (i / 8) * Math.PI * 2;
    const length = 2 + Math.random() * 3;
    const pts    = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(
        Math.cos(angle) * (PLANET_SIZES.sun + length),
        Math.sin(angle) * (PLANET_SIZES.sun + length),
        0
      )
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color:       0xffaa33,
      transparent: true,
      opacity:     0.3,
      blending:    THREE.AdditiveBlending,
    });
    flareGroup.add(new THREE.Line(geo, mat));
  }
  flareGroup.userData.isFlare = true;
  scene.add(flareGroup);
}

// ═══════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURES
// ═══════════════════════════════════════════════════════════
function makePlanetTexture(cfg) {
  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  cfg.draw(ctx, w, h);
  return new THREE.CanvasTexture(c);
}

function noisePixels(ctx, w, h, count, alphaRange, colorFn) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const s = 1 + Math.random() * 2;
    ctx.fillStyle = colorFn(Math.random());
    ctx.globalAlpha = alphaRange[0] + Math.random() * (alphaRange[1] - alphaRange[0]);
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

const TEXTURES = {
  mercury: () => makePlanetTexture({ draw(ctx, w, h) {
    ctx.fillStyle = '#8c8c8c'; ctx.fillRect(0, 0, w, h);
    noisePixels(ctx, w, h, 8000, [0.3, 0.8], t => {
      const v = Math.floor(90 + t * 80);
      return `rgb(${v},${v},${v})`;
    });
    // Craters
    for (let i = 0; i < 40; i++) {
      const x = Math.random()*w, y = Math.random()*h, r = 2+Math.random()*15;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(50,50,50,${0.3+Math.random()*0.4})`; ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }}),

  venus: () => makePlanetTexture({ draw(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c4a862'); g.addColorStop(0.5, '#e8d09a'); g.addColorStop(1, '#b8934a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    noisePixels(ctx, w, h, 6000, [0.1, 0.4], t => {
      const r = Math.floor(160+t*60), gb = Math.floor(100+t*80);
      return `rgb(${r},${gb},${gb-20})`;
    });
    // Swirl bands
    for (let i = 0; i < 12; i++) {
      const y = (i/12)*h;
      ctx.fillStyle = `rgba(180,140,60,${0.1+Math.random()*0.2})`;
      ctx.fillRect(0, y, w, h/20);
    }
  }}),

  earth_day: () => makePlanetTexture({ draw(ctx, w, h) {
    // Ocean base
    ctx.fillStyle = '#2255a0'; ctx.fillRect(0, 0, w, h);
    noisePixels(ctx, w, h, 3000, [0.1, 0.3], () => {
      const b = Math.floor(140+Math.random()*80);
      return `rgb(20,70,${b})`;
    });
    // Continents
    const continents = [
      // North America
      { pts: [[0.05,0.2],[0.22,0.12],[0.28,0.18],[0.3,0.32],[0.24,0.45],[0.18,0.5],[0.1,0.48],[0.04,0.4]] },
      // South America
      { pts: [[0.22,0.5],[0.32,0.48],[0.34,0.58],[0.3,0.72],[0.22,0.75],[0.18,0.68]] },
      // Europe/Africa
      { pts: [[0.5,0.18],[0.6,0.16],[0.63,0.25],[0.6,0.32],[0.56,0.52],[0.52,0.68],[0.48,0.72],[0.46,0.58],[0.48,0.38]] },
      // Asia
      { pts: [[0.58,0.15],[0.82,0.12],[0.88,0.22],[0.85,0.35],[0.78,0.42],[0.68,0.4],[0.62,0.32]] },
      // Australia
      { pts: [[0.78,0.58],[0.88,0.56],[0.9,0.64],[0.84,0.7],[0.76,0.68]] },
    ];
    ctx.globalAlpha = 0.9;
    continents.forEach(cont => {
      ctx.beginPath();
      ctx.moveTo(cont.pts[0][0]*w, cont.pts[0][1]*h);
      cont.pts.forEach(p => ctx.lineTo(p[0]*w, p[1]*h));
      ctx.closePath();
      const g2 = ctx.createLinearGradient(0, 0, 0, h);
      g2.addColorStop(0, '#3a7a3a'); g2.addColorStop(0.5, '#4a8a50'); g2.addColorStop(1, '#8b7550');
      ctx.fillStyle = g2;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Polar ice caps
    ctx.fillStyle = 'rgba(240,248,255,0.85)';
    ctx.fillRect(0, 0, w, h*0.05);
    ctx.fillRect(0, h*0.88, w, h*0.12);
    noisePixels(ctx, w, h, 2000, [0.05, 0.2], () => {
      const v = Math.floor(80+Math.random()*60);
      return `rgb(30,${v},${v+50})`;
    });
  }}),

  earth_night: () => makePlanetTexture({ draw(ctx, w, h) {
    ctx.fillStyle = '#03050f'; ctx.fillRect(0, 0, w, h);
    // City light clusters
    const cities = [
      [0.12,0.26],[0.18,0.3],[0.08,0.35],[0.25,0.24],  // N. America
      [0.25,0.54],[0.28,0.58],                           // S. America
      [0.5,0.22],[0.52,0.28],[0.54,0.32],[0.46,0.24],   // Europe
      [0.56,0.2],[0.58,0.24],                            // Middle East
      [0.62,0.28],[0.68,0.22],[0.72,0.3],[0.78,0.28],   // Asia
      [0.8,0.58],[0.84,0.62],                            // Australia
    ];
    cities.forEach(([cx, cy]) => {
      const x = cx*w, y = cy*h;
      for (let i = 0; i < 30; i++) {
        const px = x + (Math.random()-0.5)*w*0.06;
        const py = y + (Math.random()-0.5)*h*0.1;
        ctx.fillStyle = `rgba(255,220,${80+Math.floor(Math.random()*100)},${0.5+Math.random()*0.5})`;
        ctx.fillRect(px, py, 1, 1);
      }
    });
  }}),

  earth_clouds: () => makePlanetTexture({ draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, w, h);
    // Cloud patches
    for (let i = 0; i < 80; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      const rw = 20+Math.random()*80, rh = 10+Math.random()*30;
      const alpha = 0.2+Math.random()*0.6;
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    // Polar cloud bands
    const pc1 = ctx.createLinearGradient(0,0,0,h*0.12);
    pc1.addColorStop(0,'rgba(255,255,255,0.8)'); pc1.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = pc1; ctx.fillRect(0,0,w,h*0.12);
    const pc2 = ctx.createLinearGradient(0,h*0.9,0,h);
    pc2.addColorStop(0,'rgba(255,255,255,0)'); pc2.addColorStop(1,'rgba(255,255,255,0.7)');
    ctx.fillStyle = pc2; ctx.fillRect(0,h*0.9,w,h*0.1);
  }}),

  mars: () => makePlanetTexture({ draw(ctx, w, h) {
    ctx.fillStyle = '#b83a10'; ctx.fillRect(0, 0, w, h);
    noisePixels(ctx, w, h, 10000, [0.1, 0.6], t => {
      const r = Math.floor(150+t*80), g = Math.floor(40+t*50), b = Math.floor(10+t*30);
      return `rgb(${r},${g},${b})`;
    });
    // Valles Marineris (canyon)
    ctx.strokeStyle = 'rgba(80,20,5,0.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(w*0.35, h*0.48); ctx.lineTo(w*0.7, h*0.52); ctx.stroke();
    // Polar ice
    ctx.fillStyle = 'rgba(220,235,255,0.85)'; ctx.fillRect(0,0,w,h*0.05);
    ctx.fillRect(0,h*0.9,w,h*0.1);
    // Dark region (Syrtis Major)
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#3d1a08';
    ctx.beginPath(); ctx.ellipse(w*0.6, h*0.38, w*0.06, h*0.1, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }}),

  jupiter: () => makePlanetTexture({ draw(ctx, w, h) {
    // Base
    ctx.fillStyle = '#c8863a'; ctx.fillRect(0, 0, w, h);
    // Horizontal bands
    const bands = [
      {y:0.0, h:0.08, c:'rgba(200,160,100,0.7)'},
      {y:0.08,h:0.06, c:'rgba(140,80,30,0.8)'},
      {y:0.14,h:0.1,  c:'rgba(220,190,140,0.6)'},
      {y:0.24,h:0.08, c:'rgba(160,100,50,0.9)'},
      {y:0.32,h:0.14, c:'rgba(230,200,155,0.65)'},
      {y:0.46,h:0.06, c:'rgba(120,70,25,0.85)'},
      {y:0.52,h:0.12, c:'rgba(210,175,120,0.7)'},
      {y:0.64,h:0.08, c:'rgba(150,90,40,0.8)'},
      {y:0.72,h:0.16, c:'rgba(225,195,145,0.6)'},
      {y:0.88,h:0.12, c:'rgba(130,75,28,0.75)'},
    ];
    bands.forEach(b => {
      ctx.fillStyle = b.c;
      ctx.fillRect(0, b.y*h, w, b.h*h);
    });
    noisePixels(ctx, w, h, 4000, [0.05, 0.25], t => {
      return `rgb(${Math.floor(160+t*60)},${Math.floor(90+t*60)},${Math.floor(30+t*40)})`;
    });
    // Great Red Spot
    ctx.globalAlpha = 0.85;
    const grd = ctx.createRadialGradient(w*0.35, h*0.58, 0, w*0.35, h*0.58, w*0.08);
    grd.addColorStop(0, '#cc3300');
    grd.addColorStop(0.4,'#aa2800');
    grd.addColorStop(1, 'rgba(180,60,20,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(w*0.35, h*0.58, w*0.09, h*0.06, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }}),

  saturn: () => makePlanetTexture({ draw(ctx, w, h) {
    ctx.fillStyle = '#d4c080'; ctx.fillRect(0, 0, w, h);
    const bands = [
      {y:0.1, h:0.05, c:'rgba(180,160,100,0.6)'},
      {y:0.2, h:0.08, c:'rgba(200,175,115,0.5)'},
      {y:0.35,h:0.12, c:'rgba(160,140,85,0.7)'},
      {y:0.5, h:0.08, c:'rgba(210,185,125,0.55)'},
      {y:0.65,h:0.1,  c:'rgba(170,148,90,0.65)'},
      {y:0.8, h:0.06, c:'rgba(195,172,110,0.5)'},
    ];
    bands.forEach(b => { ctx.fillStyle=b.c; ctx.fillRect(0,b.y*h,w,b.h*h); });
    noisePixels(ctx, w, h, 2000, [0.05, 0.2], t =>
      `rgb(${Math.floor(185+t*40)},${Math.floor(165+t*35)},${Math.floor(100+t*40)})`
    );
  }}),

  uranus: () => makePlanetTexture({ draw(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#72dde0'); g.addColorStop(0.5, '#5acce0'); g.addColorStop(1, '#4ab8d0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // Subtle bands
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(100,200,220,${0.05+Math.random()*0.1})`;
      ctx.fillRect(0, (i/8)*h, w, h/10);
    }
    noisePixels(ctx, w, h, 1000, [0.02, 0.1], () =>
      `rgba(150,230,240,${0.1+Math.random()*0.2})`
    );
  }}),

  neptune: () => makePlanetTexture({ draw(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a3a9e'); g.addColorStop(0.5, '#2050c0'); g.addColorStop(1, '#102888');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    noisePixels(ctx, w, h, 2000, [0.05, 0.25], t =>
      `rgb(${Math.floor(30+t*60)},${Math.floor(60+t*80)},${Math.floor(160+t*80)})`
    );
    // Great Dark Spot
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#0a1a55';
    ctx.beginPath(); ctx.ellipse(w*0.4, h*0.4, w*0.07, h*0.05, 0.4, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }}),

  moon: () => makePlanetTexture({ draw(ctx, w, h) {
    ctx.fillStyle = '#a8a8a8'; ctx.fillRect(0, 0, w, h);
    noisePixels(ctx, w, h, 6000, [0.2, 0.7], t => {
      const v = Math.floor(120+t*80); return `rgb(${v},${v},${v})`;
    });
    for (let i = 0; i < 60; i++) {
      const x=Math.random()*w, y=Math.random()*h, r=1+Math.random()*10;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(60,60,60,${0.2+Math.random()*0.5})`; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=`rgba(80,80,80,${0.1+Math.random()*0.3})`; ctx.fill();
    }
  }}),

  saturn_ring: () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 4;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0,    'rgba(200,180,120,0)');
    g.addColorStop(0.05, 'rgba(180,160,100,0.6)');
    g.addColorStop(0.15, 'rgba(210,190,140,0.85)');
    g.addColorStop(0.3,  'rgba(170,150,100,0.4)');
    g.addColorStop(0.38, 'rgba(200,180,130,0.7)');
    g.addColorStop(0.45, 'rgba(150,130,80,0.2)');
    g.addColorStop(0.55, 'rgba(190,170,120,0.8)');
    g.addColorStop(0.7,  'rgba(160,140,90,0.5)');
    g.addColorStop(0.85, 'rgba(200,180,130,0.6)');
    g.addColorStop(0.95, 'rgba(170,150,100,0.3)');
    g.addColorStop(1,    'rgba(150,130,80,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 4);
    return new THREE.CanvasTexture(c);
  },
};

// ═══════════════════════════════════════════════════════════
//  PLANETS
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  PLANETS
// ═══════════════════════════════════════════════════════════
async function createAllPlanets() {
  for (const [key, orb] of Object.entries(ORBITS)) {
    orbitAngles[key] = orb.start;
    const size = PLANET_SIZES[key] || 1;
    let mesh;

    if (key === 'earth') {
      mesh = await createEarth(size);
      mesh.traverse(child => {
        if (child.isMesh) {
          child.userData.key = 'earth';
          clickableMeshes.push(child);
        }
      });
    } else if (key === 'saturn') {
      mesh = await createSaturnGLB(size);
    } else if (['mercury', 'venus', 'mars', 'jupiter'].includes(key)) {
      mesh = await loadPlanetGLB(key, size, `${key}.glb`);
    } else {
      // Procedural fallback (e.g., Uranus, Neptune)
      const texFn = TEXTURES[key];
      const tex   = texFn ? texFn() : null;
      const mat   = new THREE.MeshStandardMaterial({
        map:       tex,
        roughness: 0.8,
        metalness: 0.05,
        color:     tex ? 0xffffff : new THREE.Color(PLANET_DATA[key]?.color || '#888888'),
      });
      const geo = new THREE.SphereGeometry(size, 48, 48);
      mesh = new THREE.Mesh(geo, mat);
      mesh.userData.key = key;
      mesh.castShadow   = true;
      clickableMeshes.push(mesh);
    }

    // Position on orbit
    mesh.position.set(orb.r * Math.cos(orb.start), 0, orb.r * Math.sin(orb.start));
    scene.add(mesh);
    planets[key] = { mesh };

    if (key === 'earth') await createMoon();
  }
}

// ─── Generic GLB Loader for Planets ────────────────────
async function loadPlanetGLB(key, size, filename) {
  try {
    const loader = new GLTFLoader();
    loader.register(parser => ({
      name: 'KHR_materials_pbrSpecularGlossiness',
      getMaterialType() { return THREE.MeshStandardMaterial; },
      async extendMaterialParams(materialIndex, materialParams) {
        const matDef = parser.json.materials?.[materialIndex];
        const ext    = matDef?.extensions?.KHR_materials_pbrSpecularGlossiness;
        if (!ext) return;
        if (ext.diffuseFactor) {
          materialParams.color = new THREE.Color(ext.diffuseFactor[0], ext.diffuseFactor[1], ext.diffuseFactor[2]);
        }
        if (ext.diffuseTexture !== undefined) {
          await parser.assignTexture(materialParams, 'map', ext.diffuseTexture);
        }
        materialParams.roughness = 0.8;
        materialParams.metalness = 0.05;
      }
    }));

    const glb = await new Promise((resolve, reject) => {
      loader.load(`./${filename}`, resolve, undefined, reject);
    });

    const model = glb.scene;

    // Auto-scale to fit target radius size
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const scale  = size / (sphere.radius || 1);
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
        child.userData.key  = key;
        clickableMeshes.push(child);

        const srcMats = Array.isArray(child.material) ? child.material : [child.material];
        const newMats = srcMats.map(src => {
          if (src.isMeshStandardMaterial) {
            src.roughness   = src.roughness ?? 0.75;
            src.metalness   = src.metalness ?? 0.05;
            src.needsUpdate = true;
            return src;
          }
          return new THREE.MeshStandardMaterial({
            name:         src.name || `${key}_mat`,
            color:        src.color || new THREE.Color(1, 1, 1),
            map:          src.map || src.diffuseMap || src.specularMap || null,
            normalMap:    src.normalMap || null,
            roughness:    0.75,
            metalness:    0.05,
          });
        });
        child.material = newMats.length === 1 ? newMats[0] : newMats;
      }
    });

    const group = new THREE.Group();
    group.userData.key = key;
    group.add(model);
    showToast(`📦 ${filename} loaded successfully!`);
    return group;

  } catch (err) {
    console.warn(`[Solar Explorer] ${filename} failed, using procedural ${key}:`, err);
    const texFn = TEXTURES[key];
    const tex   = texFn ? texFn() : null;
    const mat   = new THREE.MeshStandardMaterial({
      map:       tex,
      roughness: 0.8,
      metalness: 0.05,
      color:     tex ? 0xffffff : new THREE.Color(PLANET_DATA[key]?.color || '#888888'),
    });
    const geo  = new THREE.SphereGeometry(size, 48, 48);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.key = key;
    mesh.castShadow   = true;
    clickableMeshes.push(mesh);
    return mesh;
  }
}

// ─── Saturn GLB Loader with Ring Support ────────────────
async function createSaturnGLB(size) {
  let group;
  try {
    const loader = new GLTFLoader();
    loader.register(parser => ({
      name: 'KHR_materials_pbrSpecularGlossiness',
      getMaterialType() { return THREE.MeshStandardMaterial; },
      async extendMaterialParams(materialIndex, materialParams) {
        const matDef = parser.json.materials?.[materialIndex];
        const ext    = matDef?.extensions?.KHR_materials_pbrSpecularGlossiness;
        if (!ext) return;
        if (ext.diffuseFactor) {
          materialParams.color = new THREE.Color(ext.diffuseFactor[0], ext.diffuseFactor[1], ext.diffuseFactor[2]);
        }
        if (ext.diffuseTexture !== undefined) {
          await parser.assignTexture(materialParams, 'map', ext.diffuseTexture);
        }
        materialParams.roughness = 0.7;
        materialParams.metalness = 0.05;
      }
    }));

    const glb = await new Promise((resolve, reject) => {
      loader.load('./saturn.glb', resolve, undefined, reject);
    });

    const model = glb.scene;
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const scale  = size / (sphere.radius || 1);
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
        child.userData.key  = 'saturn';
        clickableMeshes.push(child);
      }
    });

    group = new THREE.Group();
    group.userData.key = 'saturn';
    group.add(model);
    showToast('🪐 saturn.glb loaded successfully!');

  } catch (err) {
    console.warn('[Solar Explorer] saturn.glb failed, using procedural Saturn:', err);
    group = createSaturn(size);
    group.userData.key = 'saturn';
    clickableMeshes.push(group);
  }

  return group;
}

// ─── Earth: load GLB, fall back to procedural ───────────
async function createEarth(size) {
  const group = new THREE.Group();
  group.userData.key = 'earth';

  // Cloud + atmosphere are always added regardless of Earth source
  const cloudsTex = TEXTURES.earth_clouds();
  const cloudGeo  = new THREE.SphereGeometry(size * 1.015, 48, 48);
  const cloudMat  = new THREE.MeshStandardMaterial({
    map:         cloudsTex,
    transparent: true,
    opacity:     0.5,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
  });
  earthClouds = new THREE.Mesh(cloudGeo, cloudMat);

  // Soft atmospheric rim glow using Fresnel Shader (FrontSide, transparent)
  const atmoGeo = new THREE.SphereGeometry(size * 1.035, 48, 48);
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        gl_FragColor = vec4(0.25, 0.6, 1.0, intensity * 0.5);
      }
    `,
    blending:    THREE.AdditiveBlending,
    side:        THREE.FrontSide,
    transparent: true,
    depthWrite:  false,
  });
  earthAtmosphere = new THREE.Mesh(atmoGeo, atmoMat);


  // ── Try loading earth.glb ────────────────────────────
  try {
    // Register KHR_materials_pbrSpecularGlossiness handler so the
    // parser converts spec-gloss materials natively and emits no warning.
    const loader = new GLTFLoader();
    loader.register(parser => ({
      name: 'KHR_materials_pbrSpecularGlossiness',

      getMaterialType(/* materialIndex */) {
        return THREE.MeshStandardMaterial;
      },

      async extendMaterialParams(materialIndex, materialParams) {
        const matDef = parser.json.materials?.[materialIndex];
        const ext    = matDef?.extensions?.KHR_materials_pbrSpecularGlossiness;
        if (!ext) return;

        const pending = [];

        // Diffuse albedo → color + map
        if (ext.diffuseFactor) {
          materialParams.color = new THREE.Color(
            ext.diffuseFactor[0],
            ext.diffuseFactor[1],
            ext.diffuseFactor[2]
          );
          if (ext.diffuseFactor[3] !== undefined) {
            materialParams.opacity      = ext.diffuseFactor[3];
            materialParams.transparent  = ext.diffuseFactor[3] < 1.0;
          }
        }
        if (ext.diffuseTexture !== undefined) {
          pending.push(parser.assignTexture(materialParams, 'map', ext.diffuseTexture));
        }

        // Glossiness → roughness (inverted, 0–1)
        materialParams.roughness = ext.glossinessFactor !== undefined
          ? 1.0 - ext.glossinessFactor
          : 0.7;

        // Spec-gloss texture channels — approximate as roughness map
        if (ext.specularGlossinessTexture !== undefined) {
          pending.push(parser.assignTexture(materialParams, 'roughnessMap', ext.specularGlossinessTexture));
        }

        // Spec-gloss PBR has no metalness concept
        materialParams.metalness = 0.0;

        await Promise.all(pending);
      },
    }));

    const glb = await new Promise((resolve, reject) => {
      loader.load('./earth.glb', resolve, undefined, reject);
    });


    const model = glb.scene;

    // Auto-scale: fit the model so its bounding sphere radius ≈ size
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const scale  = size / sphere.radius;
    model.scale.setScalar(scale);
    // Center the model inside the group
    model.position.sub(center.multiplyScalar(scale));

    // ── Convert ALL materials to MeshStandardMaterial ──────
    // Needed because earth.glb uses KHR_materials_pbrSpecularGlossiness
    // which Three.js r128+ no longer supports natively. We rebuild each
    // material as MeshStandardMaterial, preserving every texture we can
    // find regardless of the original material type.
    model.traverse(child => {
      if (!child.isMesh) return;

      child.castShadow    = true;
      child.receiveShadow = true;
      child.userData.key  = 'earth';

      // Handle both single-material and multi-material meshes
      const srcMats = Array.isArray(child.material) ? child.material : [child.material];

      const newMats = srcMats.map(src => {
        // Already standard — just ensure roughness/metalness are sensible
        if (src.isMeshStandardMaterial) {
          src.roughness  = src.roughness  ?? 0.75;
          src.metalness  = src.metalness  ?? 0.0;
          src.needsUpdate = true;
          return src;
        }

        const isTransparent = src.transparent || (src.opacity !== undefined && src.opacity < 0.99) ||
                              /cloud|atmosphere|sky|atmo/i.test(src.name || '') || /cloud|atmosphere|sky|atmo/i.test(child.name || '');

        const std = new THREE.MeshStandardMaterial({
          name:         src.name        || 'earth_mat',
          // Diffuse / albedo
          color:        src.color       || new THREE.Color(1, 1, 1),
          map:          src.map         || src.diffuseMap  || null,
          // Normal / bump
          normalMap:    src.normalMap   || null,
          normalScale:  src.normalScale || new THREE.Vector2(1, 1),
          // Roughness (invert glossiness if present)
          roughness:    src.glossiness  !== undefined
                          ? 1.0 - src.glossiness
                          : (src.roughness ?? 0.75),
          roughnessMap: src.roughnessMap  || src.glossinessMap || null,
          // Metalness
          metalness:    src.metalness    ?? 0.0,
          metalnessMap: src.metalnessMap  || null,
          // Emissive
          emissive:     src.emissive     || new THREE.Color(0, 0, 0),
          emissiveMap:  src.emissiveMap   || null,
          // AO
          aoMap:        src.aoMap         || null,
          // Alpha & Depth
          transparent:  isTransparent,
          opacity:      src.opacity        ?? 1.0,
          depthWrite:   !isTransparent,
          alphaMap:     src.alphaMap       || null,
          // Environment
          envMap:       src.envMap         || null,
          side:         src.side           || THREE.FrontSide,
        });

        // Spec-gloss: KHR_materials_pbrSpecularGlossiness stores diffuse
        // as specularMap in Three.js’s fallback. Copy it over if present.
        if (src.specularMap && !std.map) std.map = src.specularMap;

        return std;
      });

      child.material = newMats.length === 1 ? newMats[0] : newMats;
    });

    group.add(model);
    showToast('🌍 earth.glb loaded successfully!');

  } catch (err) {
    // ── Fallback: procedural shader Earth ───────────────
    console.warn('[Solar Explorer] earth.glb failed, using procedural Earth:', err);
    showToast('⚠ earth.glb not found — using procedural Earth');

    const dayTex   = TEXTURES.earth_day();
    const nightTex = TEXTURES.earth_night();

    earthShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uDay:     { value: dayTex   },
        uNight:   { value: nightTex },
        uClouds:  { value: cloudsTex },
        uSunPos:  { value: new THREE.Vector3(0, 0, 0) },
        uEarthPos:{ value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vViewNormal;
        void main() {
          vUv          = uv;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vViewNormal  = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);
          gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDay, uNight, uClouds;
        uniform vec3 uSunPos, uEarthPos;
        varying vec2 vUv;
        varying vec3 vWorldNormal, vViewNormal;
        void main() {
          vec3  sunDir = normalize(uSunPos - uEarthPos);
          float sun    = dot(vWorldNormal, sunDir);
          float blend  = smoothstep(-0.25, 0.25, sun);
          vec3  day    = texture2D(uDay, vUv).rgb;
          vec3  night  = texture2D(uNight, vUv).rgb;
          vec3  clouds = texture2D(uClouds, vUv).rgb;
          float cAlpha = length(clouds) * 0.55;
          vec3  surf   = mix(night * 1.8, day, blend);
          surf = mix(surf, vec3(1.0), cAlpha * blend);
          float rim    = 1.0 - abs(dot(vViewNormal, vec3(0.0, 0.0, 1.0)));
          surf += vec3(0.25, 0.55, 1.0) * pow(rim, 2.5) * (0.15 + 0.2 * blend);
          gl_FragColor = vec4(surf, 1.0);
        }
      `,
    });

    const fallbackMesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 64, 64),
      earthShaderMat
    );
    fallbackMesh.userData.key = 'earth';
    group.add(fallbackMesh);
  }

  // Always add clouds + atmosphere on top
  group.add(earthClouds);
  group.add(earthAtmosphere);
  return group;
}

// ─── Moon: load GLB, fall back to procedural ────────────
async function createMoon() {
  const targetSize = 0.28;

  try {
    const loader = new GLTFLoader();
    loader.register(parser => ({
      name: 'KHR_materials_pbrSpecularGlossiness',
      getMaterialType() { return THREE.MeshStandardMaterial; },
      async extendMaterialParams(materialIndex, materialParams) {
        const matDef = parser.json.materials?.[materialIndex];
        const ext    = matDef?.extensions?.KHR_materials_pbrSpecularGlossiness;
        if (!ext) return;
        if (ext.diffuseFactor) {
          materialParams.color = new THREE.Color(ext.diffuseFactor[0], ext.diffuseFactor[1], ext.diffuseFactor[2]);
        }
        if (ext.diffuseTexture !== undefined) {
          await parser.assignTexture(materialParams, 'map', ext.diffuseTexture);
        }
        materialParams.roughness = 0.9;
        materialParams.metalness = 0.0;
      }
    }));

    const glb = await new Promise((resolve, reject) => {
      loader.load('./moon.glb', resolve, undefined, reject);
    });

    const model = glb.scene;

    // Auto-scale to radius targetSize (0.28)
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const scale  = targetSize / sphere.radius;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
        child.userData.key  = 'moon';
        clickableMeshes.push(child);

        // Convert material to MeshStandardMaterial if needed
        if (!child.material.isMeshStandardMaterial) {
          child.material = new THREE.MeshStandardMaterial({
            map:       child.material.map || null,
            roughness: 0.9,
            metalness: 0.0,
          });
        }
      }
    });

    moon = model;
    moon.userData.key = 'moon';
    scene.add(moon);
    showToast('🌙 moon.glb loaded successfully!');

  } catch (err) {
    console.warn('[Solar Explorer] moon.glb failed, using procedural Moon:', err);
    const geo  = new THREE.SphereGeometry(targetSize, 32, 32);
    const mat  = new THREE.MeshStandardMaterial({ map: TEXTURES.moon(), roughness: 0.9, metalness: 0 });
    moon = new THREE.Mesh(geo, mat);
    moon.userData.key = 'moon';
    clickableMeshes.push(moon);
    scene.add(moon);
  }
}

// ─── Saturn ─────────────────────────────────────────────
function createSaturn(size) {
  const geo = new THREE.SphereGeometry(size, 48, 48);
  const mat = new THREE.MeshStandardMaterial({ map: TEXTURES.saturn(), roughness: 0.7, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);

  // Rings
  const ringInner = size * 1.35;
  const ringOuter = size * 2.4;
  const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 120);

  // Remap ring UVs for proper texture mapping
  const pos = ringGeo.attributes.position;
  const uv  = ringGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const d = Math.sqrt(x*x + y*y);
    uv.setXY(i, (d - ringInner) / (ringOuter - ringInner), 0.5);
  }

  const ringMat = new THREE.MeshBasicMaterial({
    map:         TEXTURES.saturn_ring(),
    transparent: true,
    opacity:     0.88,
    side:        THREE.DoubleSide,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
  });
  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.rotation.x = Math.PI / 2.4;
  mesh.add(rings);

  // Tilt Saturn slightly
  mesh.rotation.z = 0.47;

  return mesh;
}

// ═══════════════════════════════════════════════════════════
//  ORBIT LINES
// ═══════════════════════════════════════════════════════════
function createOrbitLines() {
  Object.entries(ORBITS).forEach(([key, orb]) => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(orb.r * Math.cos(a), 0, orb.r * Math.sin(a)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color:       0x334466,
      transparent: true,
      opacity:     0.35,
    });
    const line = new THREE.Line(geo, mat);
    orbitLines[key] = line;
    scene.add(line);
  });
}

// ═══════════════════════════════════════════════════════════
//  ASTEROID BELT
// ═══════════════════════════════════════════════════════════
function createAsteroidBelt() {
  asteroidsGroup = new THREE.Group();
  const INNER = ORBITS.mars.r + 2;
  const OUTER = ORBITS.jupiter.r - 2;

  for (let i = 0; i < 320; i++) {
    const r     = INNER + Math.random() * (OUTER - INNER);
    const angle = Math.random() * Math.PI * 2;
    const size  = 0.04 + Math.random() * 0.18;
    const geo   = new THREE.IcosahedronGeometry(size, Math.random() < 0.4 ? 1 : 0);
    const shade = Math.floor(80 + Math.random() * 60);
    const mat   = new THREE.MeshStandardMaterial({
      color:     new THREE.Color(`rgb(${shade},${shade-5},${shade-10})`),
      roughness: 0.9, metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(r * Math.cos(angle), (Math.random()-0.5) * 1.5, r * Math.sin(angle));
    mesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
    mesh.userData.orbitR     = r;
    mesh.userData.orbitAngle = angle;
    mesh.userData.orbitSpeed = 0.002 + Math.random() * 0.01;
    mesh.userData.rotAxis    = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
    mesh.userData.rotSpeed   = 0.5 + Math.random() * 2;
    asteroidsGroup.add(mesh);
  }
  scene.add(asteroidsGroup);
}

// ═══════════════════════════════════════════════════════════
//  SPACECRAFT
// ═══════════════════════════════════════════════════════════
function createSpacecraft() {
  const group = new THREE.Group();

  // Main body
  const bodyGeo = new THREE.CylinderGeometry(0.06, 0.12, 0.4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xddddee, metalness: 0.7, roughness: 0.3 });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Solar panels
  const panelGeo = new THREE.BoxGeometry(0.6, 0.01, 0.15);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x2255aa, metalness: 0.3, roughness: 0.6 });
  const p1 = new THREE.Mesh(panelGeo, panelMat); p1.position.set(0, 0, 0);
  const p2 = p1.clone();
  p1.position.x = 0.35; p2.position.x = -0.35;
  group.add(p1, p2);

  // Thruster
  const thrGeo = new THREE.ConeGeometry(0.04, 0.1, 6);
  const thrMat = new THREE.MeshStandardMaterial({ color: 0x445566 });
  const thr    = new THREE.Mesh(thrGeo, thrMat);
  thr.position.y = -0.25; thr.rotation.x = Math.PI;
  group.add(thr);

  group.visible = false;
  group.scale.setScalar(1.5);
  scene.add(group);
  spacecraftMesh = group;
}

// ═══════════════════════════════════════════════════════════
//  SHOOTING STARS
// ═══════════════════════════════════════════════════════════
function spawnShootingStar() {
  const start = new THREE.Vector3(
    (Math.random()-0.5) * 1000,
    (Math.random()-0.5) * 400,
    (Math.random()-0.5) * 1000
  );
  const dir = new THREE.Vector3(Math.random()-0.5, -Math.random()*0.2, Math.random()-0.5).normalize();
  const len = 30 + Math.random() * 50;
  const end = start.clone().addScaledVector(dir, len);

  const pts = [start, end];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color:       0xffffff,
    transparent: true,
    opacity:     0.9,
    blending:    THREE.AdditiveBlending,
  });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  shootingStars.push({ line, dir, mat, life: 0, maxLife: 0.8 + Math.random() * 0.6 });
}

// ═══════════════════════════════════════════════════════════
//  INTERACTION  (raycasting, keyboard, mouse)
// ═══════════════════════════════════════════════════════════
function setupInteraction() {
  raycaster = new THREE.Raycaster();
  mouse     = new THREE.Vector2();

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 250));

  // Mouse move → hover
  renderer.domElement.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Touch & Pointer tap detection for Mobile/Android
  let pointerStartPos = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', e => {
    pointerStartPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', e => {
    const dx = Math.abs(e.clientX - pointerStartPos.x);
    const dy = Math.abs(e.clientY - pointerStartPos.y);
    if (dx < 8 && dy < 8) {
      mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
  });

  // Single click / tap
  renderer.domElement.addEventListener('click', onCanvasClick);

  // Double click → focus
  renderer.domElement.addEventListener('dblclick', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickableMeshes);
    if (hits.length > 0) {
      const key = hits[0].object.userData.key;
      if (key) focusPlanet(key);
    }
  });

  // Keyboard
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); togglePause(); }
    if (e.code === 'KeyR')  resetCamera();
    if (e.code === 'KeyF') {
      if (selectedPlanet) focusPlanet(selectedPlanet);
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // WASD fly
  let flyInterval;
  const startFly = () => {
    clearInterval(flyInterval);
    flyInterval = setInterval(() => {
      const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? 2.5 : 0.8;
      const dir   = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
      if (keys['KeyW']) camera.position.addScaledVector(dir, speed);
      if (keys['KeyS']) camera.position.addScaledVector(dir,-speed);
      if (keys['KeyA']) camera.position.addScaledVector(right,-speed);
      if (keys['KeyD']) camera.position.addScaledVector(right, speed);
      if (keys['KeyW']||keys['KeyS']||keys['KeyA']||keys['KeyD']) {
        controls.target.addScaledVector(dir, keys['KeyW'] ? speed : keys['KeyS'] ? -speed : 0);
      }
    }, 16);
  };
  startFly();
}

// ─── Click handler ────────────────────────────────────────
let lastClickTime = 0;
let focusedPlanet   = null;
const prevFocusedPos = new THREE.Vector3();

function onCanvasClick(e) {
  // Ignore double-clicks (handled separately)
  const now = Date.now();
  if (now - lastClickTime < 300) { lastClickTime = now; return; }
  lastClickTime = now;

  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickableMeshes);

  if (hits.length === 0) return;

  const key = hits[0].object.userData.key;
  if (!key) return;

  selectedPlanet = key;

  if (distanceModeActive) {
    handleDistanceClick(key);
    return;
  }
  if (spacecraftModeActive && spacecraftTarget === null && key !== 'sun') {
    launchSpacecraftTo(key);
    return;
  }

  // Click planet → center camera on it in 3D space
  focusPlanet(key);
}

// ─── Focus Planet ─────────────────────────────────────────
function focusPlanet(key) {
  const obj = key === 'sun' ? sun : (planets[key]?.mesh);
  if (!obj) return;

  if (galaxyMesh) galaxyMesh.visible = false;

  focusedPlanet  = key;
  selectedPlanet = key;
  prevFocusedPos.copy(obj.position);

  const pos  = obj.position.clone();
  const size = PLANET_SIZES[key] || 1;
  const dist = Math.max(size * 4.5, 9.0);

  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(controls.target);

  const isMobile = window.innerWidth <= 768;

  const targetCamPos = new THREE.Vector3(
    pos.x + dist * 0.7,
    pos.y + (isMobile ? dist * 0.8 : dist * 0.4),
    pos.z + dist * 0.7
  );

  const targetLookPos = new THREE.Vector3(
    pos.x,
    pos.y - (isMobile ? dist * 0.3 : 0),
    pos.z
  );

  gsap.to(camera.position, {
    x: targetCamPos.x,
    y: targetCamPos.y,
    z: targetCamPos.z,
    duration: 1.5,
    ease: 'power2.inOut',
  });

  gsap.to(controls.target, {
    x: targetLookPos.x,
    y: targetLookPos.y,
    z: targetLookPos.z,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  });

  showToast(`Centered on ${PLANET_DATA[key]?.name || key} (Rotate 360° in 3D view)`);
  document.getElementById('btn-back-system')?.classList.remove('hidden');
}

function resetCamera() {
  focusedPlanet = null;
  document.getElementById('btn-back-system')?.classList.add('hidden');
  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(controls.target);
  gsap.to(camera.position, { x: 0, y: 55, z: 130, duration: 1.8, ease: 'power2.inOut' });
  gsap.to(controls.target,  { x: 0, y: 0,  z: 0,   duration: 1.8, ease: 'power2.inOut', onUpdate: () => controls.update() });
  showToast('Returned to full Solar System view');
}

function returnToGalaxyView() {
  focusedPlanet = null;
  document.getElementById('btn-back-system')?.classList.add('hidden');
  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(controls.target);
  if (galaxyMesh) gsap.killTweensOf(galaxyMesh.material);

  if (galaxyMesh) {
    galaxyMesh.visible = true;
    galaxyMesh.material.opacity = 0;
    gsap.to(galaxyMesh.material, { opacity: 0.9, duration: 2.2, ease: 'power2.inOut' });
  }

  gsap.to(camera.position, {
    x: 300, y: 1600, z: 3300,
    duration: 2.2,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
    onComplete: () => {
      setSolarSystemVisible(false);
    }
  });
}

// ═══════════════════════════════════════════════════════════
//  CAMERA MODES
// ═══════════════════════════════════════════════════════════
function updateCamera(delta) {
  if (focusedPlanet) {
    const obj = focusedPlanet === 'sun' ? sun : planets[focusedPlanet]?.mesh;
    if (obj) {
      const currentPos = obj.position;
      const deltaPos   = new THREE.Vector3().subVectors(currentPos, prevFocusedPos);

      // Track orbital movement so planet stays centered while allowing full 360° mouse rotation
      camera.position.add(deltaPos);
      controls.target.add(deltaPos);

      prevFocusedPos.copy(currentPos);
    }
  }

  if (cameraMode === 'cinematic') {
    cinematicTimer += delta;
    if (cinematicTimer >= CINEMATIC_DWELL) {
      cinematicTimer = 0;
      cinematicIndex = (cinematicIndex + 1) % CINEMATIC_TARGETS.length;
      focusPlanet(CINEMATIC_TARGETS[cinematicIndex]);
    }
  }
}

const CINEMATIC_TARGETS = ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];

// ═══════════════════════════════════════════════════════════
//  DISTANCE MODE
// ═══════════════════════════════════════════════════════════
function handleDistanceClick(key) {
  const skip = ['moon'];
  if (skip.includes(key)) return;

  distancePlanets.push(key);

  if (distancePlanets.length === 1) {
    updateDistanceUI('visible', `Point A: ${PLANET_DATA[key]?.name}. Click another planet…`);
  } else if (distancePlanets.length === 2) {
    const [a, b] = distancePlanets;
    const pA = (a === 'sun' ? sun : planets[a]?.mesh)?.position;
    const pB = (b === 'sun' ? sun : planets[b]?.mesh)?.position;

    if (pA && pB) {
      const dist3d = pA.distanceTo(pB);
      // Scale factor: 1 unit ≈ 10 million km (educational scale)
      const km = (dist3d * 10).toFixed(0);
      updateDistanceUI('visible',
        `${PLANET_DATA[a]?.name} → ${PLANET_DATA[b]?.name}`,
        `≈ ${Number(km).toLocaleString()} million km`
      );

      // Draw line
      if (distanceLine) scene.remove(distanceLine);
      const geo = new THREE.BufferGeometry().setFromPoints([pA.clone(), pB.clone()]);
      const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 });
      distanceLine = new THREE.Line(geo, mat);
      scene.add(distanceLine);
    }
    distancePlanets = [];
  }
}

// ═══════════════════════════════════════════════════════════
//  SPACECRAFT AUTOPILOT
// ═══════════════════════════════════════════════════════════
function launchSpacecraftTo(targetKey) {
  spacecraftTarget = targetKey;
  spacecraftMesh.visible = true;
  spacecraftMesh.position.copy(planets.earth?.mesh?.position || new THREE.Vector3(28, 0, 0));

  const targetMesh = planets[targetKey]?.mesh;
  if (!targetMesh) return;

  const dist3d = spacecraftMesh.position.distanceTo(targetMesh.position);
  const etaMonths = Math.round(dist3d * 0.3);
  updateSpacecraftUI('visible',
    `En route to ${PLANET_DATA[targetKey]?.name}`,
    `ETA: ~${etaMonths} months`
  );

  gsap.to(spacecraftMesh.position, {
    x: targetMesh.position.x, y: targetMesh.position.y + 0.5, z: targetMesh.position.z,
    duration: 8,
    ease: 'power2.inOut',
    onComplete: () => {
      showToast(`🚀 Arrived at ${PLANET_DATA[targetKey]?.name}!`, 3500);
      updateSpacecraftUI('visible', `Orbiting ${PLANET_DATA[targetKey]?.name}`, '');
    }
  });
}

// ═══════════════════════════════════════════════════════════
//  ECLIPSE DETECTION
// ═══════════════════════════════════════════════════════════
function checkEclipse() {
  if (!moon || !planets.earth) return;
  const earthPos = planets.earth.mesh.position;
  const moonPos  = moon.position;

  // Vector from sun (origin) to earth
  const sunToEarth = earthPos.clone().normalize();
  // Vector from sun to moon
  const sunToMoon  = moonPos.clone().normalize();
  const dot        = sunToEarth.dot(sunToMoon);
  const moonDistFromLine = moonPos.distanceTo(
    sunToEarth.clone().multiplyScalar(moonPos.dot(sunToEarth))
  );

  const isEclipse = dot > 0.9998 && moonDistFromLine < 0.5;

  if (isEclipse && !eclipseActive) {
    eclipseActive = true;
    showEclipseAlert();
  } else if (!isEclipse && eclipseActive) {
    eclipseActive = false;
  }
}

// ═══════════════════════════════════════════════════════════
//  HOVER / TOOLTIP
// ═══════════════════════════════════════════════════════════
let hoveredKey = null;
function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickableMeshes);

  if (hits.length > 0 && hits[0].object.userData.key) {
    const key  = hits[0].object.userData.key;
    const data = PLANET_DATA[key];
    if (data) {
      const tooltip = document.getElementById('planet-tooltip');
      tooltip.classList.remove('hidden');
      tooltip.classList.add('visible');
      document.getElementById('tooltip-name').textContent = `${data.icon} ${data.name}`;
      hoveredKey = key;
      document.body.style.cursor = 'pointer';
      return;
    }
  }

  // No hit
  document.getElementById('planet-tooltip').classList.remove('visible');
  document.getElementById('planet-tooltip').classList.add('hidden');
  hoveredKey = null;
  document.body.style.cursor = 'default';
}

// ═══════════════════════════════════════════════════════════
//  UI CALLBACK FACTORY
// ═══════════════════════════════════════════════════════════
function buildUICallbacks() {
  return {
    exploreZoom:    (cb) => triggerGalaxyExploreZoom(cb),
    returnToGalaxy: ()  => returnToGalaxyView(),
    focusPlanet:    key => focusPlanet(key),
    resetCamera:    ()  => resetCamera(),
    openEncyclopedia: () => {},
    togglePause:    () => togglePause(),
    setTimeScale:   s  => { timeScale = s; },
    setCameraMode:  m  => {
      cameraMode = m;
      if (m === 'follow') followTarget = selectedPlanet || 'earth';
      if (m === 'cinematic') { cinematicIndex = 0; cinematicTimer = 0; focusPlanet('sun'); }
      if (m === 'free')  controls.autoRotate = false;
      updateCameraMode(m);
    },
    toggleOrbits:   () => {
      orbitLinesVisible = !orbitLinesVisible;
      Object.values(orbitLines).forEach(l => l.visible = orbitLinesVisible);
    },
    showOrbits:     v  => { orbitLinesVisible = v; Object.values(orbitLines).forEach(l => l.visible = v); },
    toggleDistance: () => {
      distanceModeActive = !distanceModeActive;
      distancePlanets    = [];
      if (distanceModeActive) {
        updateDistanceUI('visible', 'Click a planet to set Point A…');
      } else {
        updateDistanceUI('hidden');
        if (distanceLine) { scene.remove(distanceLine); distanceLine = null; }
      }
    },
    cancelDistance: () => {
      distanceModeActive = false;
      distancePlanets    = [];
      if (distanceLine) { scene.remove(distanceLine); distanceLine = null; }
    },
    toggleSpacecraft: () => {
      spacecraftModeActive = !spacecraftModeActive;
      spacecraftTarget = null;
      if (spacecraftModeActive) {
        spacecraftMesh.visible = false;
        updateSpacecraftUI('visible', 'Click a planet as destination…');
      } else {
        spacecraftMesh.visible = false;
        updateSpacecraftUI('hidden');
      }
    },
    cancelSpacecraft: () => {
      spacecraftModeActive = false;
      spacecraftTarget     = null;
      spacecraftMesh.visible = false;
      gsap.killTweensOf(spacecraftMesh.position);
    },
    setBloom:         v  => { bloomPass.enabled = v; },
    setBloomStrength: s  => { bloomPass.strength = s; },
    showAsteroids:    v  => { asteroidsGroup.visible = v; asteroidsVisible = v; },
    setTwinkle:       v  => { twinkleEnabled = v; },
    setShooting:      v  => { shootingStarsEnabled = v; },
  };
}

// ═══════════════════════════════════════════════════════════
//  PAUSE
// ═══════════════════════════════════════════════════════════
function togglePause() {
  paused = !paused;
  setPauseButton(paused);
  showToast(paused ? 'Simulation paused' : 'Simulation resumed');
}

// ═══════════════════════════════════════════════════════════
//  ANIMATION LOOP
// ═══════════════════════════════════════════════════════════
function animate() {
  requestAnimationFrame(animate);
  const delta   = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (!paused) {
    const dt = delta * timeScale;

    // ── Dynamic Sun Glow & Bloom scaling for Milky Way distance ──
    const camDist = camera.position.distanceTo(controls.target);
    if (bloomPass) {
      const t = THREE.MathUtils.clamp((camDist - 250) / 2000, 0, 1);
      bloomPass.strength = THREE.MathUtils.lerp(1.2, 0.35, t);

      if (typeof sunSprite !== 'undefined' && sunSprite?.material) {
        sunSprite.material.opacity = THREE.MathUtils.lerp(0.55, 0.08, t);
      }
      if (typeof sunGlow !== 'undefined' && sunGlow?.material) {
        sunGlow.material.opacity = THREE.MathUtils.lerp(0.08, 0.01, t);
      }
    }

    // ── Dynamic Orbit Lines & Lensflare hide when zooming out to Milky Way ──
    const isFarOut = camDist > 550;
    if (typeof lensflareMesh !== 'undefined' && lensflareMesh) {
      lensflareMesh.visible = !isFarOut;
    }

    Object.values(orbitLines).forEach(line => {
      if (line) {
        if (isFarOut) {
          line.visible = false;
        } else {
          const menuHidden = document.getElementById('main-menu')?.classList.contains('hidden');
          line.visible = menuHidden ? orbitLinesVisible : false;
        }
      }
    });

    if (galaxyMesh) {
      galaxyMesh.rotation.y += 0.0003 * dt;

      // Dynamic distance fade: reveal Milky Way when zooming far out past 450 units!
      if (!gsap.isTweening(camera.position)) {
        if (camDist > 450) {
          galaxyMesh.visible = true;
          const alpha = Math.min((camDist - 450) / 700, 0.9);
          galaxyMesh.material.opacity = alpha;
        } else {
          const menuHidden = document.getElementById('main-menu')?.classList.contains('hidden');
          if (menuHidden) {
            galaxyMesh.visible = false;
          }
        }
      }
    }

    // ── Orbit planets ─────────────────────────────────────
    Object.entries(ORBITS).forEach(([key, orb]) => {
      orbitAngles[key] += orb.speed * dt;
      const mesh = planets[key]?.mesh;
      if (!mesh) return;
      const angle = orbitAngles[key];
      mesh.position.set(orb.r * Math.cos(angle), 0, orb.r * Math.sin(angle));
      mesh.rotation.y += orb.rotSpeed * dt;
    });

    // ── Earth extras ──────────────────────────────────────
    if (earthClouds)   earthClouds.rotation.y   += 0.0025 * dt;
    if (earthShaderMat) {
      earthShaderMat.uniforms.uSunPos.value.set(0, 0, 0);
      earthShaderMat.uniforms.uEarthPos.value.copy(planets.earth.mesh.position);
    }

    // ── Moon ──────────────────────────────────────────────
    if (moon && planets.earth) {
      moonAngle += 0.08 * dt;
      const ep = planets.earth.mesh.position;
      moon.position.set(
        ep.x + MOON_ORBIT_R * Math.cos(moonAngle),
        ep.y + MOON_ORBIT_R * 0.15 * Math.sin(moonAngle * 0.5),
        ep.z + MOON_ORBIT_R * Math.sin(moonAngle)
      );
      moon.rotation.y += 0.005 * dt;
    }

    // ── Asteroids ─────────────────────────────────────────
    if (asteroidsVisible) {
      asteroidsGroup.children.forEach(ast => {
        ast.userData.orbitAngle += ast.userData.orbitSpeed * dt;
        const a = ast.userData.orbitAngle, r = ast.userData.orbitR;
        ast.position.x = r * Math.cos(a);
        ast.position.z = r * Math.sin(a);
        ast.rotateOnAxis(ast.userData.rotAxis, ast.userData.rotSpeed * delta);
      });
    }

    // ── Sun shader ────────────────────────────────────────
    if (sun.material.uniforms) sun.material.uniforms.uTime.value = elapsed;

    // ── Stars twinkling ───────────────────────────────────
    if (starUniforms && twinkleEnabled) starUniforms.uTime.value = elapsed;

    // ── Shooting stars ────────────────────────────────────
    if (shootingStarsEnabled) {
      shootingTimer += delta;
      if (shootingTimer > 3 + Math.random() * 4) {
        shootingTimer = 0;
        spawnShootingStar();
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life += delta;
        ss.mat.opacity = 1 - (ss.life / ss.maxLife);
        const positions = ss.line.geometry.attributes.position;
        for (let j = 0; j < positions.count; j++) {
          positions.setXYZ(j,
            positions.getX(j) + ss.dir.x * 8 * delta,
            positions.getY(j) + ss.dir.y * 8 * delta,
            positions.getZ(j) + ss.dir.z * 8 * delta
          );
        }
        positions.needsUpdate = true;
        if (ss.life >= ss.maxLife) {
          scene.remove(ss.line);
          ss.line.geometry.dispose();
          ss.mat.dispose();
          shootingStars.splice(i, 1);
        }
      }
    }

    // ── Spacecraft follow target ───────────────────────────
    if (spacecraftMesh.visible && spacecraftTarget && planets[spacecraftTarget]) {
      // Slight hover bob
      spacecraftMesh.rotation.y += 0.5 * delta;
    }

    // ── Eclipse check ─────────────────────────────────────
    checkEclipse();

    // ── Distance line update ───────────────────────────────
    if (distanceLine && distancePlanets.length === 0) {
      // Line is static until reset — no update needed
    }
  }

  // Camera
  updateCamera(delta);
  updateHover();
  controls.update();

  // Render
  composer.render();
}

// ═══════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════

init().catch(err => {
  console.error('Solar Explorer init error:', err);
  document.getElementById('loading-text').textContent = 'Error initializing — check console.';
});
