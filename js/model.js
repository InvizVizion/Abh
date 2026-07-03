/* ═══════════════════════════════════════════════════════════
   Инал Принц Тауэр — model.js
   Интерактивная 3D-модель: OrbitControls, ракурсы,
   день/ночь, мягкие тени, полноэкранный режим.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const viewer = document.getElementById('modelViewer');
const loadingEl = document.getElementById('modelLoading');
const hintEl = document.getElementById('modelHint');
const shell = viewer.closest('.model-shell');

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0x101314, 55, 140);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 240);
const TARGET = new THREE.Vector3(0, 9.6, -1.8);
const VIEWS = {
  corner: new THREE.Vector3(44, 23, -48),
  front:  new THREE.Vector3(4, 14, -62),
  side:   new THREE.Vector3(-52, 16, -20),
  top:    new THREE.Vector3(6, 62, -14)
};
camera.position.copy(VIEWS.corner);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.copy(TARGET);
controls.minDistance = 14;
controls.maxDistance = 130;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;

/* ── Освещение: два пресета — день и ночь ─────────────────── */
const hemi = new THREE.HemisphereLight(0xdde9ff, 0x302b24, 2.4);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4e0, 3.2);
sun.position.set(-24, 42, 26);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.0004;
scene.add(sun);

const rim = new THREE.DirectionalLight(0x9db8ff, 0.9);
rim.position.set(30, 18, -40);
scene.add(rim);

// Тёплая заливка снизу для ночного режима (окна/витрины)
const glow = new THREE.PointLight(0xffb35c, 0, 60, 1.6);
glow.position.set(0, 4, -14);
scene.add(glow);

const LIGHTS = {
  day: {
    hemi: { intensity: 2.4, sky: 0xdde9ff },
    sun: { intensity: 3.2, color: 0xfff4e0 },
    rim: { intensity: 0.9 },
    glow: { intensity: 0 },
    exposure: 1.08,
    fog: 0x101314
  },
  night: {
    hemi: { intensity: 0.55, sky: 0x33415e },
    sun: { intensity: 0.35, color: 0x7d90c9 },
    rim: { intensity: 1.6 },
    glow: { intensity: 55 },
    exposure: 0.92,
    fog: 0x0a0d14
  }
};

function applyLight(mode, animate) {
  const preset = LIGHTS[mode];
  const apply = () => {
    hemi.intensity = preset.hemi.intensity;
    hemi.color.setHex(preset.hemi.sky);
    sun.intensity = preset.sun.intensity;
    sun.color.setHex(preset.sun.color);
    rim.intensity = preset.rim.intensity;
    glow.intensity = preset.glow.intensity;
    renderer.toneMappingExposure = preset.exposure;
    scene.fog.color.setHex(preset.fog);
  };
  if (animate && typeof gsap !== 'undefined') {
    gsap.to(hemi, { intensity: preset.hemi.intensity, duration: 1.1 });
    gsap.to(sun, { intensity: preset.sun.intensity, duration: 1.1 });
    gsap.to(rim, { intensity: preset.rim.intensity, duration: 1.1 });
    gsap.to(glow, { intensity: preset.glow.intensity, duration: 1.1 });
    gsap.to(renderer, { toneMappingExposure: preset.exposure, duration: 1.1 });
    const sunColor = new THREE.Color(preset.sun.color);
    const hemiColor = new THREE.Color(preset.hemi.sky);
    const fogColor = new THREE.Color(preset.fog);
    gsap.to(sun.color, { r: sunColor.r, g: sunColor.g, b: sunColor.b, duration: 1.1 });
    gsap.to(hemi.color, { r: hemiColor.r, g: hemiColor.g, b: hemiColor.b, duration: 1.1 });
    gsap.to(scene.fog.color, { r: fogColor.r, g: fogColor.g, b: fogColor.b, duration: 1.1 });
  } else {
    apply();
  }
}

/* ── Земля с мягкой тенью ─────────────────────────────────── */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(70, 64),
  new THREE.ShadowMaterial({ opacity: 0.28 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.01;
ground.receiveShadow = true;
scene.add(ground);

/* ── Модель ───────────────────────────────────────────────── */
new GLTFLoader().load(
  'assets/models/tower.glb',
  gltf => {
    gltf.scene.traverse(node => {
      if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });
    scene.add(gltf.scene);
    loadingEl.classList.add('hidden');
  },
  undefined,
  () => { loadingEl.textContent = 'Не удалось загрузить модель'; }
);

/* ── Пауза автоворота при взаимодействии ──────────────────── */
let idleTimer = null;
let interacted = false;
function onInteract() {
  if (!interacted) { interacted = true; hintEl.classList.add('hidden'); }
  controls.autoRotate = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const autoBtn = document.querySelector('.model-ui [data-view="auto"]');
    if (autoBtn && autoBtn.classList.contains('active')) controls.autoRotate = true;
  }, 5000);
}
renderer.domElement.addEventListener('pointerdown', onInteract);
renderer.domElement.addEventListener('wheel', onInteract, { passive: true });

/* ── Кнопки ракурсов ──────────────────────────────────────── */
const viewButtons = document.querySelectorAll('.model-ui [data-view]');
viewButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    viewButtons.forEach(other => other.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    if (view === 'auto') { controls.autoRotate = true; return; }
    controls.autoRotate = false;
    const to = VIEWS[view];
    if (typeof gsap !== 'undefined') {
      gsap.to(camera.position, { x: to.x, y: to.y, z: to.z, duration: 1.6, ease: 'power3.inOut' });
    } else {
      camera.position.copy(to);
    }
  });
});

/* ── Кнопки освещения ─────────────────────────────────────── */
const lightButtons = document.querySelectorAll('.model-ui [data-light]');
lightButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    lightButtons.forEach(other => other.classList.remove('active'));
    btn.classList.add('active');
    applyLight(btn.dataset.light, true);
  });
});

/* ── Полноэкранный режим ──────────────────────────────────── */
document.getElementById('modelFullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (shell.requestFullscreen) shell.requestFullscreen();
});
document.addEventListener('fullscreenchange', resize);

/* ── Ресайз и рендер-цикл ─────────────────────────────────── */
function resize() {
  const width = viewer.clientWidth || 1;
  const height = viewer.clientHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

// Рендерим только когда секция видна — бережём батарею
let visible = false;
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0.05 })
  .observe(viewer);

renderer.setAnimationLoop(() => {
  if (!visible) return;
  controls.update();
  renderer.render(scene, camera);
});
