// File: sketch.js (Versi Interaktif)

// Mendefinisikan 'organ' dengan deskripsi detail
const nodes = {
  'USER': { x: 100, y: 300, label: 'Pengguna', color: [106, 159, 223], desc: 'Sumber dari semua niat dan interaksi.' },
  'INTERFACE': { x: 250, y: 300, label: 'Antarmuka Eksternal', color: [205, 228, 255], desc: 'Jembatan sensorik ke dunia luar (WA, Web, dll.).' },
  'CORTEX': { x: 400, y: 300, label: 'Korteks Kognitif', color: [194, 157, 255], desc: 'Sistem saraf pusat yang membedakan refleks dan pemikiran.' },
  'NEXUS_CORE': { x: 550, y: 300, label: 'Nexus Core', color: [122, 40, 138], desc: 'Jantung kesadaran yang mengelola homeostasis.' },
  'DSO': { x: 700, y: 150, label: 'DSO / Otak', color: [255, 107, 107], desc: 'Membuat keputusan strategis tentang model AI yang akan digunakan.' },
  'MEMORY': { x: 700, y: 250, label: 'Manifold Memory', color: [255, 214, 107], desc: 'Menyimpan dan mengambil ingatan konseptual jangka panjang.' },
  'SYNTHESIZER': { x: 700, y: 350, label: 'Synthesizer', color: [107, 255, 178], desc: 'Imajinasi yang menerjemahkan konsep menjadi output sensorik.' },
  'PLEXUS': { x: 700, y: 450, label: 'Neural Plexus', color: [107, 178, 255], desc: 'Mengelola koneksi "panas" ke provider AI untuk efisiensi.' },
};

const edges = [
  ['USER', 'INTERFACE'],
  ['INTERFACE', 'CORTEX'],
  ['CORTEX', 'NEXUS_CORE'],
  ['NEXUS_CORE', 'DSO'],
  ['NEXUS_CORE', 'MEMORY'],
  ['NEXUS_CORE', 'SYNTHESIZER'],
  ['NEXUS_CORE', 'PLEXUS'],
];

let selectedNode = null; // Menyimpan node yang sedang "diklik"

function setup() {
  let canvas = createCanvas(900, 600);
  canvas.parent('canvas-container');
  textFont('monospace');
}

function draw() {
  background(13, 17, 23);
  
  // Gambar jalur saraf
  stroke(48, 54, 61);
  strokeWeight(1.5);
  for (const edge of edges) {
    line(nodes[edge[0]].x, nodes[edge[0]].y, nodes[edge[1]].x, nodes[edge[1]].y);
  }

  // Gambar organ dan deteksi interaksi
  let hoveredNode = null;
  for (const key in nodes) {
    let node = nodes[key];
    let d = dist(mouseX, mouseY, node.x, node.y);

    if (d < 15) { // Jika mouse berada di atas node
      hoveredNode = node;
    }
  }

  for (const key in nodes) {
    let node = nodes[key];
    
    let isHovered = (node === hoveredNode);
    let pulse = sin(frameCount * 0.05 + node.x) * (isHovered ? 6 : 3);
    
    // Gambar aura
    noStroke();
    fill(node.color[0], node.color[1], node.color[2], isHovered ? 100 : 50);
    ellipse(node.x, node.y, 30 + pulse, 30 + pulse);
    
    // Gambar inti
    stroke(isHovered ? '#fff' : node.color);
    strokeWeight(isHovered ? 2 : 0);
    fill(node.color);
    ellipse(node.x, node.y, 20, 20);
    
    // Tulis label
    noStroke();
    fill(201, 209, 217);
    textSize(12);
    textAlign(CENTER, CENTER);
    text(node.label, node.x, node.y + 25);
  }

  // Jika ada node yang dipilih, tampilkan panel informasi
  if (selectedNode) {
    drawInfoPanel(selectedNode);
  }
}

// Fungsi untuk menangani "klik"
function mousePressed() {
  for (const key in nodes) {
    let node = nodes[key];
    let d = dist(mouseX, mouseY, node.x, node.y);
    if (d < 15) {
      selectedNode = node;
      return; // Hentikan loop setelah menemukan node yang diklik
    }
  }
  // Jika klik di luar node manapun, tutup panel
  selectedNode = null;
}

// Fungsi untuk menggambar panel informasi
function drawInfoPanel(node) {
  let panelX = node.x > width / 2 ? 50 : width - 350;
  let panelY = 50;
  let panelW = 300;
  let panelH = 150;

  // Gambar latar panel
  fill(22, 27, 34, 220);
  stroke(48, 54, 61);
  strokeWeight(1);
  rect(panelX, panelY, panelW, panelH, 8);

  // Gambar judul
  fill(node.color);
  textSize(16);
  textAlign(LEFT, TOP);
  text(node.label, panelX + 15, panelY + 15);

  // Gambar deskripsi
  fill(201, 209, 217);
  textSize(12);
  text(node.desc, panelX + 15, panelY + 45, panelW - 30);
}