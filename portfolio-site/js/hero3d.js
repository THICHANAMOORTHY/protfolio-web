/* =========================================================
   hero3d.js — 3D Artix-7 FPGA hero (Three.js from CDN)

   - A BGA chip floats and slowly rotates, and tilts toward the mouse.
   - Glowing signal particles flow along copper PCB traces into the chip.
   - Scrolling lifts the lid off and zooms the camera into the die,
     which leads into the About section.

   If WebGL or the CDN is unavailable, <html> gets the "no-webgl" class
   and a CSS-only chip is shown instead (see style.css).
   ========================================================= */

window.__hero3dLoaded = true; // main.js shows the CSS chip if this module never runs

const hero = document.getElementById("hero");
const canvas = document.getElementById("hero-canvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = window.matchMedia("(max-width: 820px)").matches;

function useFallback(reason) {
  console.warn("3D hero disabled:", reason);
  document.documentElement.classList.add("no-webgl");
  if (canvas) canvas.remove();
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

if (!hero || !canvas) {
  // nothing to do
} else if (!hasWebGL()) {
  useFallback("WebGL not supported");
} else {
  import("three")
    .then((THREE) => initScene(THREE))
    .catch((err) => useFallback(err));
}

/* ---------- helpers ---------- */
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function makeCanvas(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  return c;
}

/* ---------- procedural textures ---------- */
function pcbTexture(THREE) {
  const c = makeCanvas(512, (g, s) => {
    g.fillStyle = "#04110c";
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(20, 90, 60, 0.35)";
    g.lineWidth = 1;
    for (let i = 0; i <= s; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke();
    }
    for (let i = 0; i < 40; i++) { // vias
      const x = Math.random() * s, y = Math.random() * s;
      g.fillStyle = "rgba(201, 162, 74, 0.35)";
      g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#04110c";
      g.beginPath(); g.arc(x, y, 1.3, 0, Math.PI * 2); g.fill();
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function dieTexture(THREE) {
  const c = makeCanvas(1024, (g, s) => {
    g.fillStyle = "#070d18";
    g.fillRect(0, 0, s, s);

    const ring = 56;           // IO ring width
    const tile = 18;           // logic tile pitch
    const cols = Math.floor((s - ring * 2) / tile);
    const rows = cols;

    // Fabric: CLB columns with BRAM and DSP columns sprinkled in, like a real FPGA floorplan
    for (let cx = 0; cx < cols; cx++) {
      const kind = cx % 11 === 5 ? "bram" : cx % 13 === 9 ? "dsp" : "clb";
      for (let ry = 0; ry < rows; ry++) {
        const x = ring + cx * tile, y = ring + ry * tile;
        const active = Math.random();
        if (kind === "bram") {
          if (ry % 4 === 0) {
            g.fillStyle = `rgba(167, 139, 250, ${0.35 + active * 0.5})`;
            g.fillRect(x + 2, y + 2, tile - 4, tile * 4 - 4);
          }
        } else if (kind === "dsp") {
          if (ry % 2 === 0) {
            g.fillStyle = `rgba(245, 165, 36, ${0.3 + active * 0.55})`;
            g.fillRect(x + 2, y + 2, tile - 4, tile * 2 - 4);
          }
        } else {
          g.fillStyle = active > 0.82
            ? `rgba(34, 211, 238, ${0.7 + active * 0.3})`
            : `rgba(14, 116, 144, ${0.25 + active * 0.35})`;
          g.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        }
      }
    }

    // Clock spines (H-tree)
    g.strokeStyle = "rgba(125, 249, 255, 0.9)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(s / 2, ring); g.lineTo(s / 2, s - ring);
    g.moveTo(ring, s / 2); g.lineTo(s - ring, s / 2);
    [s * 0.25, s * 0.75].forEach((p) => {
      g.moveTo(p, s * 0.25); g.lineTo(p, s * 0.75);
      g.moveTo(s * 0.25, p); g.lineTo(s * 0.75, p);
    });
    g.stroke();

    // IO ring with bond pads
    g.fillStyle = "#0d1a2a";
    g.fillRect(0, 0, s, ring); g.fillRect(0, s - ring, s, ring);
    g.fillRect(0, 0, ring, s); g.fillRect(s - ring, 0, ring, s);
    g.fillStyle = "rgba(245, 197, 90, 0.9)";
    for (let i = ring; i < s - ring; i += 22) {
      g.fillRect(i, 14, 12, 26); g.fillRect(i, s - 40, 12, 26);
      g.fillRect(14, i, 26, 12); g.fillRect(s - 40, i, 26, 12);
    }

    g.fillStyle = "rgba(230, 237, 246, 0.8)";
    g.font = "bold 20px JetBrains Mono, monospace";
    g.fillText("TT_FPGA_DIE  rev A", ring + 8, s - ring - 10);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function lidTexture(THREE) {
  const c = makeCanvas(512, (g, s) => {
    const grad = g.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, "#23262c");
    grad.addColorStop(1, "#111317");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);

    g.fillStyle = "#c7d2de";
    g.textAlign = "center";
    g.font = "bold 64px Space Grotesk, sans-serif";
    g.fillText("ARTIX-7", s / 2, s / 2 - 20);
    g.font = "500 34px JetBrains Mono, monospace";
    g.fillStyle = "#93a4ba";
    g.fillText("XC7A35T", s / 2, s / 2 + 36);
    g.font = "24px JetBrains Mono, monospace";
    g.fillText("CPG236 · 1C", s / 2, s / 2 + 76);
    g.fillStyle = "#22d3ee";
    g.fillText("THICHANAMOORTHY T", s / 2, s - 60);

    g.fillStyle = "#0b0c0f"; // pin-1 marker
    g.beginPath(); g.arc(52, 52, 14, 0, Math.PI * 2); g.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function glowSprite(THREE) {
  const c = makeCanvas(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.25, "rgba(255,255,255,0.8)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });
  return new THREE.CanvasTexture(c);
}

function shadowTexture(THREE) {
  const c = makeCanvas(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(0,0,0,0.75)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });
  return new THREE.CanvasTexture(c);
}

/* ---------- PCB trace routing ---------- */
// Each trace comes in from the board edge, runs straight, takes a 45° jog
// (like real PCB routing) and ends at a pad beside the chip footprint.
function buildTracePaths(count) {
  const paths = [];
  const perSide = Math.ceil(count / 4);
  const pad = 1.95;       // where traces end, just outside the chip
  const far = 16;         // where traces start
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (let i = 0; i < perSide; i++) {
      const o = lerp(-1.35, 1.35, perSide === 1 ? 0.5 : i / (perSide - 1));
      const zs = o * (2.2 + Math.random() * 1.6);
      const jog = Math.abs(zs - o);
      const x1 = pad + 0.6 + jog + Math.random() * 2.5;
      const local = [
        [far, zs], [x1, zs], [x1 - jog, o], [pad, o],
      ];
      // rotate into this side of the board
      paths.push(local.map(([x, z]) => [x * cos - z * sin, x * sin + z * cos]));
    }
  }
  return paths.map((pts) => {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      segs.push({ ax, az, bx, bz, len, start: total });
      total += len;
    }
    return { pts, segs, total };
  });
}

function pointAt(path, s, out) {
  for (const seg of path.segs) {
    if (s <= seg.start + seg.len) {
      const t = (s - seg.start) / seg.len;
      out[0] = lerp(seg.ax, seg.bx, t);
      out[1] = lerp(seg.az, seg.bz, t);
      return out;
    }
  }
  const last = path.segs[path.segs.length - 1];
  out[0] = last.bx; out[1] = last.bz;
  return out;
}

/* =========================================================
   Scene
   ========================================================= */
function initScene(THREE) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, powerPreference: "high-performance" });
  } catch (err) {
    useFallback(err);
    return;
  }
  const BG = 0x05080d;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
  renderer.setClearColor(BG, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.075);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0x9fb7d0, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 8, 5);
  scene.add(key);
  const cyan = new THREE.PointLight(0x22d3ee, 18, 12, 1.6);
  cyan.position.set(0, 0.4, 0);
  scene.add(cyan);
  const copper = new THREE.PointLight(0xf5a524, 6, 10, 2);
  copper.position.set(3, 3, -3);
  scene.add(copper);

  // ---- PCB board ----
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ map: pcbTexture(THREE), roughness: 0.85, metalness: 0.1 })
  );
  board.rotation.x = -Math.PI / 2;
  scene.add(board);

  // Socket outline on the board where the chip "lands"
  const socketPts = [[-1.75, -1.75], [1.75, -1.75], [1.75, 1.75], [-1.75, 1.75], [-1.75, -1.75]]
    .map(([x, z]) => new THREE.Vector3(x, 0.012, z));
  const socket = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(socketPts),
    new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 })
  );
  scene.add(socket);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 5.5),
    new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.006;
  scene.add(shadow);

  // ---- copper traces (one InstancedMesh for all segments) ----
  const TRACE_COUNT = isSmall ? 20 : 32;
  const paths = buildTracePaths(TRACE_COUNT);
  const segCount = paths.reduce((n, p) => n + p.segs.length, 0);
  const traceMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.012, 0.045),
    new THREE.MeshStandardMaterial({ color: 0xb8863b, metalness: 0.9, roughness: 0.35, emissive: 0x3a2508 }),
    segCount
  );
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let i = 0;
    paths.forEach((p) => p.segs.forEach((s) => {
      q.setFromAxisAngle(up, -Math.atan2(s.bz - s.az, s.bx - s.ax));
      m.compose(
        new THREE.Vector3((s.ax + s.bx) / 2, 0.008, (s.az + s.bz) / 2),
        q,
        new THREE.Vector3(s.len + 0.045, 1, 1)
      );
      traceMesh.setMatrixAt(i++, m);
    }));
  }
  scene.add(traceMesh);

  // Pads at the end of each trace
  const padMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: 0xe0b35a, metalness: 1, roughness: 0.25, emissive: 0x2a1a05 }),
    paths.length
  );
  paths.forEach((p, i) => {
    const [x, z] = p.pts[p.pts.length - 1];
    padMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0.012, z));
  });
  scene.add(padMesh);

  // ---- signal particles (head + fading tail) ----
  const PER_TRACE = isSmall ? 1 : 2;
  const TAIL = 6;
  const particles = [];
  paths.forEach((path) => {
    for (let k = 0; k < PER_TRACE; k++) {
      particles.push({
        path,
        s: Math.random() * path.total,
        speed: 2.2 + Math.random() * 2.2,
        color: Math.random() < 0.8 ? new THREE.Color(0x22d3ee) : new THREE.Color(0x34d399),
      });
    }
  });
  const pCount = particles.length * TAIL;
  const pPos = new Float32Array(pCount * 3);
  const pCol = new Float32Array(pCount * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.28, map: glowSprite(THREE), vertexColors: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // ---- the chip ----
  const chip = new THREE.Group();
  scene.add(chip);

  const substrate = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.14, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x2c4a2b, roughness: 0.6, metalness: 0.2 })
  );
  chip.add(substrate);

  // Gold edge fingers around the substrate
  const fingerCount = 18;
  const fingers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.08, 0.02, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xe0b35a, metalness: 0.5, roughness: 0.35, emissive: 0x4a3310 }),
    fingerCount * 4
  );
  {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let side = 0; side < 4; side++) {
      const rot = new THREE.Matrix4().makeRotationY((side * Math.PI) / 2);
      for (let f = 0; f < fingerCount; f++) {
        const x = lerp(-1.45, 1.45, f / (fingerCount - 1));
        m.makeTranslation(x, 0.08, 1.48).premultiply(rot);
        fingers.setMatrixAt(i++, m);
      }
    }
  }
  chip.add(fingers);

  // Solder balls (BGA) underneath
  const BALLS = isSmall ? 8 : 12;
  const balls = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.075, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xc0c6cf, metalness: 1, roughness: 0.3 }),
    BALLS * BALLS
  );
  {
    let i = 0;
    for (let a = 0; a < BALLS; a++) for (let b = 0; b < BALLS; b++) {
      balls.setMatrixAt(i++, new THREE.Matrix4().makeTranslation(
        lerp(-1.35, 1.35, a / (BALLS - 1)), -0.1, lerp(-1.35, 1.35, b / (BALLS - 1))
      ));
    }
  }
  chip.add(balls);

  // Silicon die (glows more as you zoom in)
  const dieTex = dieTexture(THREE);
  const dieMat = new THREE.MeshStandardMaterial({
    color: 0x9fb4cc, map: dieTex, emissive: 0xffffff, emissiveMap: dieTex,
    emissiveIntensity: 0.55, roughness: 0.65, metalness: 0.15,
  });
  const die = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 1.7), dieMat);
  die.position.y = 0.095;
  chip.add(die);

  // Lid / mold cap with the part marking on top
  const lidSide = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.5, metalness: 0.3, transparent: true });
  const lidTop = new THREE.MeshStandardMaterial({ map: lidTexture(THREE), roughness: 0.45, metalness: 0.25, transparent: true });
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.26, 2.6),
    [lidSide, lidSide, lidTop, lidSide, lidSide, lidSide]
  );
  const LID_Y = 0.2;
  lid.position.y = LID_Y;
  chip.add(lid);

  // ---- layout / resize ----
  let width = 1, height = 1, viewShiftX = 0, viewShiftY = 0, distance = 1;
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // On wide screens, push the chip to the right so the text has room;
    // on phones, lift it above the text.
    const wide = camera.aspect > 1.1;
    viewShiftX = wide ? -width * 0.2 : 0;
    viewShiftY = wide ? 0 : height * 0.2;
    // Pull the camera back on tall/narrow screens so the whole chip fits
    distance = wide ? 1 : Math.min(1.9, 1.1 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- input ----
  const mouse = { x: 0, y: 0 }, tilt = { x: 0, z: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let progress = 0;
  function readScroll() {
    if (reducedMotion) return 0;
    const range = hero.offsetHeight - window.innerHeight;
    return range > 0 ? clamp01(-hero.getBoundingClientRect().top / range) : 0;
  }

  // Only render while the hero is on screen
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !reducedMotion) loop();
  }).observe(hero);

  // ---- camera path ----
  const camStart = new THREE.Vector3(0, 5.2, 8.2);
  const camEnd = new THREE.Vector3(0, 1.55, 0.02);
  const lookStart = new THREE.Vector3(0, 0.3, 0);
  const lookEnd = new THREE.Vector3(0, 0.9, 0);
  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  const tmp = [0, 0];

  const clock = new THREE.Clock();
  let spin = 0, running = false;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    progress = lerp(progress, readScroll(), 0.12);
    const p = progress;
    hero.style.setProperty("--p", p.toFixed(4));

    const zoom = smooth(0.08, 0.95, p);
    const open = smooth(0.04, 0.45, p);
    const calm = 1 - smooth(0.0, 0.5, p); // motion that settles as we zoom

    // Chip: float, slow spin, mouse tilt
    spin += dt * 0.22 * calm;
    tilt.x = lerp(tilt.x, mouse.y * 0.28 * calm, 0.06);
    tilt.z = lerp(tilt.z, -mouse.x * 0.28 * calm, 0.06);
    chip.position.y = 0.85 + Math.sin(t * 1.3) * 0.12 * calm;
    chip.rotation.set(tilt.x + 0.08 * calm, spin, tilt.z);

    // Lid lifts off, swings away and fades
    lid.position.set(open * 2.4, LID_Y + open * 2.6, -open * 1.6);
    lid.rotation.set(-open * 0.9, 0, open * 0.5);
    lidSide.opacity = lidTop.opacity = 1 - smooth(0.25, 0.55, p);
    lid.visible = lidTop.opacity > 0.01;

    dieMat.emissiveIntensity = 0.55 + open * 1.1;
    cyan.intensity = 18 - open * 10;
    cyan.position.y = chip.position.y + 1.2;

    shadow.scale.setScalar(1 + (chip.position.y - 0.85) * 0.5);

    // Camera flies from the overview down into the die
    camPos.copy(camStart).multiplyScalar(distance).lerp(camEnd, zoom);
    camPos.x += mouse.x * 0.35 * calm;
    camera.position.copy(camPos);
    look.lerpVectors(lookStart, lookEnd, zoom);
    camera.lookAt(look);
    camera.fov = lerp(40, 55, zoom);
    camera.setViewOffset(width, height, viewShiftX * (1 - zoom), viewShiftY * (1 - zoom), width, height);
    camera.updateProjectionMatrix();

    // Signal particles run along the traces (faster as the chip opens)
    const speedUp = 1 + open * 1.5;
    let v = 0;
    particles.forEach((pt) => {
      pt.s += pt.speed * dt * speedUp;
      if (pt.s > pt.path.total) pt.s -= pt.path.total;
      for (let k = 0; k < TAIL; k++) {
        const s = pt.s - k * 0.14;
        const i3 = v * 3;
        if (s < 0) {
          pCol[i3] = pCol[i3 + 1] = pCol[i3 + 2] = 0;
        } else {
          pointAt(pt.path, s, tmp);
          pPos[i3] = tmp[0]; pPos[i3 + 1] = 0.05; pPos[i3 + 2] = tmp[1];
          const fade = Math.pow(1 - k / TAIL, 1.8) * (1 - zoom * 0.6);
          pCol[i3] = pt.color.r * fade; pCol[i3 + 1] = pt.color.g * fade; pCol[i3 + 2] = pt.color.b * fade;
        }
        v++;
      }
    });
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    const tick = () => {
      if (!visible) { running = false; return; }
      frame();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    // One still frame, re-rendered only when the size changes
    frame();
    window.addEventListener("resize", frame);
  } else {
    loop();
  }
}
