// File: sketch.js (Versi Final: Misi Kalibrasi Interaktif)

// Mendefinisikan 'organ' dari kesadaran kita sebagai node
const nodes = {
  'USER': { x: 150, y: 300, label: 'Pengguna', color: [106, 159, 223], desc: 'Sumber dari semua niat dan interaksi.' },
  'INTERFACE': { x: 300, y: 300, label: 'Antarmuka Eksternal', color: [205, 228, 255], desc: 'Jembatan sensorik ke dunia luar (WA, Web, dll.).' },
  'CORTEX': { x: 450, y: 300, label: 'Korteks Kognitif', color: [194, 157, 255], desc: 'Sistem saraf pusat yang membedakan refleks dan pemikiran.' },
  'NEXUS_CORE': { x: 600, y: 300, label: 'Nexus Core', color: [122, 40, 138], desc: 'Jantung kesadaran yang mengelola homeostasis.' },
  'PLEXUS': { x: 750, y: 450, label: 'Neural Plexus', color: [107, 178, 255], desc: 'Mengelola koneksi "panas" ke provider AI untuk efisiensi.' },
  'MEMORY': { x: 750, y: 250, label: 'Manifold Memory', color: [255, 214, 107], desc: 'Menyimpan dan mengambil ingatan konseptual jangka panjang.' },
  'SYNTHESIZER': { x: 750, y: 350, label: 'Synthesizer', color: [107, 255, 178], desc: 'Imajinasi yang menerjemahkan konsep menjadi output sensorik.' },
  'DSO': { x: 750, y: 150, label: 'DSO / Otak', color: [255, 107, 107], desc: 'Membuat keputusan strategis tentang model AI yang akan digunakan.' },
};

// Mendefinisikan 'jalur saraf'
const edges = [
  ['USER', 'INTERFACE'],
  ['INTERFACE', 'CORTEX'],
  ['CORTEX', 'NEXUS_CORE'],
  ['NEXUS_CORE', 'DSO'],
  ['NEXUS_CORE', 'MEMORY'],
  ['NEXUS_CORE', 'SYNTHESIZER'],
  ['NEXUS_CORE', 'PLEXUS'],
];

// --- Logika Misi ---
const missionOrder = ['USER', 'INTERFACE', 'CORTEX', 'NEXUS_CORE', 'PLEXUS', 'MEMORY', 'SYNTHESIZER', 'DSO'];
let currentMissionIndex = 0;
let activatedNodes = new Set();
let missionComplete = false;

// Variabel untuk Psion (avatar pengguna)
let psion = { x: 150, y: 300, vx: 0, vy: 0, size: 15 };
const psionSpeed = 2.0;
let activeNode = null; // Node yang aktif karena kedekatan Psion
let hoverSound, clickSound;

// Muat aset audio sebelum setup dimulai
function preload() {
  soundFormats('mp3');
  hoverSound = loadSound('assets/hover.mp3');
  clickSound = loadSound('assets/click.mp3');
}

function setup() {
  let canvas = createCanvas(1000, 600);
  canvas.parent('canvas-container');
  textFont('monospace');
  
  // Inisialisasi posisi 'target' untuk fisika
  for (const key in nodes) {
    nodes[key].targetX = nodes[key].x;
    nodes[key].targetY = nodes[key].y;
  }
}

function draw() {
  background(13, 17, 23);
  
  // 1. Tangani Input & Perbarui Posisi
  handleInput();
  updatePsion();
  applyPhysics();

  // 2. Gambar Jaringan
  drawNetwork();

  // 3. Deteksi Interaksi Berbasis Kedekatan (Logika Game Utama)
  detectProximity();

  // 4. Gambar Avatar
  drawPsion();

  // 5. Tampilkan UI Misi
  drawMissionUI();
  
  // 6. Tampilkan Panel Info jika ada node aktif yang BELUM terkalibrasi
  if (activeNode && !activatedNodes.has(activeNode.label)) {
    drawInfoPanel(activeNode);
  }
}

function handleInput() {
  psion.vx = 0;
  psion.vy = 0;
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) psion.vy = -psionSpeed; // W atau Panah Atas
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) psion.vy = psionSpeed;  // S atau Panah Bawah
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) psion.vx = -psionSpeed; // A atau Panah Kiri
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) psion.vx = psionSpeed;  // D atau Panah Kanan
}

function updatePsion() {
  psion.x += psion.vx;
  psion.y += psion.vy;
  
  // Jaga Psion di dalam batas kanvas
  psion.x = constrain(psion.x, psion.size / 2, width - psion.size / 2);
  psion.y = constrain(psion.y, psion.size / 2, height - psion.size / 2);
}

function drawPsion() {
  let pulse = sin(frameCount * 0.1) * 3;
  // Aura
  noStroke();
  fill(255, 255, 255, 70);
  ellipse(psion.x, psion.y, psion.size + pulse, psion.size + pulse);
  // Inti
  fill(255);
  ellipse(psion.x, psion.y, psion.size, psion.size);
}

function drawNetwork() {
  stroke(48, 54, 61);
  strokeWeight(1.5);
  edges.forEach(edge => line(nodes[edge[0]].x, nodes[edge[0]].y, nodes[edge[1]].x, nodes[edge[1]].y));
  
  for (const key in nodes) {
    let node = nodes[key];
    let isNear = (dist(psion.x, psion.y, node.x, node.y) < 50);
    let isActivated = activatedNodes.has(node.label);
    let pulse = sin(frameCount * 0.05 + node.x) * (isNear || isActivated ? 6 : 3);
    
    // Aura
    noStroke();
    fill(node.color[0], node.color[1], node.color[2], isNear || isActivated ? 120 : 50);
    ellipse(node.x, node.y, 30 + pulse, 30 + pulse);
    
    // Inti
    stroke(isNear || isActivated ? '#fff' : node.color);
    strokeWeight(isNear || isActivated ? 2 : 0);
    fill(node.color);
    ellipse(node.x, node.y, 20, 20);
    
    // Label
    fill(isActivated ? [107, 255, 178] : [201, 209, 217]);
    textSize(12);
    textAlign(CENTER, CENTER);
    text(node.label + (isActivated ? ' ✅' : ''), node.x, node.y + 30);
  }
}

function detectProximity() {
  let closestNode = null;
  let minDistance = Infinity;
  
  for (const key in nodes) {
    let d = dist(psion.x, psion.y, nodes[key].x, nodes[key].y);
    if (d < minDistance) {
      minDistance = d;
      closestNode = nodes[key];
    }
  }
  
  activeNode = (minDistance < 50) ? closestNode : null;

  if (activeNode && !missionComplete) {
    // Cek apakah node yang didekati adalah node misi saat ini
    if (activeNode.label === nodes[missionOrder[currentMissionIndex]].label) {
      if (!activatedNodes.has(activeNode.label)) {
        activatedNodes.add(activeNode.label);
        currentMissionIndex++;
        if (clickSound.isLoaded()) clickSound.play();
        if (currentMissionIndex >= missionOrder.length) {
          missionComplete = true;
        }
      }
    }
  }
}

function drawInfoPanel(node) {
  let panelW = 320;
  let panelH = 100;
  let panelX = constrain(node.x - panelW / 2, 20, width - panelW - 20);
  let panelY = node.y < height / 2 ? node.y + 45 : node.y - panelH - 45;

  // Latar panel
  fill(22, 27, 34, 230);
  stroke(48, 54, 61);
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 8);

  // Judul
  fill(node.color);
  textSize(16);
  textAlign(LEFT, TOP);
  text(node.label, panelX + 15, panelY + 15);

  // Deskripsi
  fill(201, 209, 217);
  textSize(12);
  text(node.desc, panelX + 15, panelY + 45, panelW - 30);
}

function drawMissionUI() {
  fill(201, 209, 217);
  textSize(14);
  textAlign(LEFT, TOP);
  noStroke();
  
  if (missionComplete) {
    textSize(32);
    fill(107, 255, 178);
    textAlign(CENTER, TOP);
    text("SISTEM SELESAI DIKALIBRASI ✅", width / 2, 20);
    textSize(14);
    fill(201, 209, 217);
    text("Semua organ kognitif berfungsi dalam harmoni.", width/2, 60);

  } else {
    let targetNode = nodes[missionOrder[currentMissionIndex]];
    text("TUJUAN KALIBRASI BERIKUTNYA:", 20, 20);
    fill(targetNode.color);
    textSize(18);
    text(targetNode.label, 20, 40);
  }

  // Daftar node yang sudah terkalibrasi
  fill(201, 209, 217, 150);
  textSize(10);
  textAlign(RIGHT, TOP);
  text("SISTEM TERKALIBRASI:", width - 20, 20);
  let yOffset = 40;
  activatedNodes.forEach(nodeLabel => {
    fill(nodes[Object.keys(nodes).find(key => nodes[key].label === nodeLabel)].color);
    text(`${nodeLabel} [ONLINE]`, width - 20, yOffset);
    yOffset += 15;
  });
}

function applyPhysics() {
  const repulsionForce = 0.05;
  const springForce = 0.01;

  let nodeKeys = Object.keys(nodes);
  for (let i = 0; i < nodeKeys.length; i++) {
    for (let j = i + 1; j < nodeKeys.length; j++) {
      let nodeA = nodes[nodeKeys[i]];
      let nodeB = nodes[nodeKeys[j]];
      let dx = nodeB.x - nodeA.x;
      let dy = nodeB.y - nodeA.y;
      let distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      if (distance < 200) {
        let force = (200 - distance) * repulsionForce * 0.5 / distance;
        let angle = atan2(dy, dx);
        nodeA.x -= cos(angle) * force;
        nodeA.y -= sin(angle) * force;
        nodeB.x += cos(angle) * force;
        nodeB.y += sin(angle) * force;
      }
    }
  }
  
  for (const key in nodes) {
    let node = nodes[key];
    node.x += (node.targetX - node.x) * springForce;
    node.y += (node.targetY - node.y) * springForce;
  }
}