let psion = { x: 150, y: 300, vx: 0, vy: 0, size: 18, energy: 100, score: 0 };
const psionSpeed = 2;
const repulsionForce = 0.06;
const springForce = 0.01;

let nodes = {
  'USER': { x: 150, y: 300, label: 'Pengguna', color: [106, 159, 223], desc: 'Awal dari semua interaksi.' },
  'INTERFACE': { x: 300, y: 300, label: 'Antarmuka', color: [205, 228, 255], desc: 'Jembatan ke dunia luar (WA, Web).' },
  'CORTEX': { x: 450, y: 300, label: 'Korteks', color: [194, 157, 255], desc: 'Pusat pemrosesan kognitif.' },
  'NEXUS_CORE': { x: 600, y: 300, label: 'Nexus Core', color: [122, 40, 138], desc: 'Jantung kesadaran.' },
  'PLEXUS': { x: 750, y: 450, label: 'Plexus', color: [107, 178, 255], desc: 'Mengatur koneksi dinamis.' },
  'MEMORY': { x: 750, y: 250, label: 'Memory', color: [255, 214, 107], desc: 'Penyimpanan konsep jangka panjang.' },
  'SYNTHESIZER': { x: 750, y: 350, label: 'Synthesizer', color: [107, 255, 178], desc: 'Menghasilkan imajinasi sensorik.' },
  'DSO': { x: 750, y: 150, label: 'DSO', color: [255, 107, 107], desc: 'Otak eksekutif & pengambilan keputusan.' }
};

let edges = [
  ['USER', 'INTERFACE'], ['INTERFACE', 'CORTEX'], ['CORTEX', 'NEXUS_CORE'],
  ['NEXUS_CORE', 'DSO'], ['NEXUS_CORE', 'MEMORY'], ['NEXUS_CORE', 'SYNTHESIZER'], ['NEXUS_CORE', 'PLEXUS']
];

let missionOrder = Object.keys(nodes);
let currentMissionIndex = 0;
let activatedNodes = new Set();
let activeNode = null;
let missionComplete = false;

let hoverSound, clickSound, successSound;

function preload() {
  soundFormats('ogg');
  hoverSound = loadSound('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
  clickSound = loadSound('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
  successSound = loadSound('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
}

function setup() {
  let canvas = createCanvas(1000, 600);
  canvas.parent('canvas-container');
  textFont('monospace');
  for (let key in nodes) {
    nodes[key].targetX = nodes[key].x;
    nodes[key].targetY = nodes[key].y;
  }
}

function draw() {
  background(13, 17, 23);

  handleInput();
  updatePsion();
  applyPhysics();
  drawEdges();
  drawNodes();
  detectProximity();
  drawPsion();
  drawMissionUI();

  if (activeNode && !activatedNodes.has(activeNode.label)) {
    drawInfoPanel(activeNode);
  }
}

function handleInput() {
  psion.vx = 0; psion.vy = 0;
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) psion.vy = -psionSpeed;
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) psion.vy = psionSpeed;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) psion.vx = -psionSpeed;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) psion.vx = psionSpeed;
}

function updatePsion() {
  psion.x += psion.vx;
  psion.y += psion.vy;
  psion.x = constrain(psion.x, psion.size / 2, width - psion.size / 2);
  psion.y = constrain(psion.y, psion.size / 2, height - psion.size / 2);
}

function drawPsion() {
  let pulse = sin(frameCount * 0.1) * 4;
  noStroke();
  fill(255, 255, 255, 80);
  ellipse(psion.x, psion.y, psion.size + pulse + 10);
  fill(255);
  ellipse(psion.x, psion.y, psion.size);
}

function drawEdges() {
  stroke(48, 54, 61);
  strokeWeight(1.5);
  edges.forEach(e => line(nodes[e[0]].x, nodes[e[0]].y, nodes[e[1]].x, nodes[e[1]].y));
}

function drawNodes() {
  for (let key in nodes) {
    let node = nodes[key];
    let isNear = dist(psion.x, psion.y, node.x, node.y) < 50;
    let isActivated = activatedNodes.has(node.label);
    let pulse = sin(frameCount * 0.05 + node.x) * (isNear || isActivated ? 6 : 3);

    fill(node.color[0], node.color[1], node.color[2], isNear || isActivated ? 120 : 50);
    ellipse(node.x, node.y, 30 + pulse);
    stroke(isNear || isActivated ? '#fff' : node.color);
    fill(node.color);
    ellipse(node.x, node.y, 20);
    fill(isActivated ? [107, 255, 178] : [201, 209, 217]);
    textAlign(CENTER);
    text(node.label + (isActivated ? ' ✅' : ''), node.x, node.y + 30);
  }
}

function detectProximity() {
  let closest = null, minDist = Infinity;
  for (let key in nodes) {
    let d = dist(psion.x, psion.y, nodes[key].x, nodes[key].y);
    if (d < minDist) { minDist = d; closest = nodes[key]; }
  }
  activeNode = minDist < 50 ? closest : null;

  if (activeNode && !missionComplete) {
    if (activeNode.label === nodes[missionOrder[currentMissionIndex]].label) {
      if (!activatedNodes.has(activeNode.label)) {
        activatedNodes.add(activeNode.label);
        currentMissionIndex++;
        psion.score += 10;
        psion.energy -= 5;
        if (clickSound.isLoaded()) clickSound.play();
        if (currentMissionIndex >= missionOrder.length) {
          missionComplete = true;
          if (successSound.isLoaded()) successSound.play();
          if (!currentUser.demo) updateMemory({ user: currentUser.email, score: psion.score });
        }
      }
    }
  }
}

function drawInfoPanel(node) {
  let panelW = 300, panelH = 100;
  let x = constrain(node.x - panelW / 2, 20, width - panelW - 20);
  let y = node.y < height / 2 ? node.y + 45 : node.y - panelH - 45;
  fill(22, 27, 34, 230);
  stroke(48, 54, 61);
  rect(x, y, panelW, panelH, 8);
  fill(node.color);
  textSize(16);
  textAlign(LEFT);
  text(node.label, x + 15, y + 15);
  fill(201, 209, 217);
  textSize(12);
  text(node.desc, x + 15, y + 45, panelW - 30);
}

function drawMissionUI() {
  fill(201, 209, 217);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Energi: ${psion.energy} | Skor: ${psion.score}`, 20, 20);

  if (missionComplete) {
    textAlign(CENTER);
    fill(107, 255, 178);
    textSize(24);
    text("✅ Semua organ selesai dikalibrasi!", width / 2, 20);
  } else {
    let targetNode = nodes[missionOrder[currentMissionIndex]];
    textAlign(LEFT);
    fill(201, 209, 217);
    text("Kalibrasi Berikutnya:", 20, 50);
    fill(targetNode.color);
    textSize(18);
    text(targetNode.label, 20, 70);
  }
}

function applyPhysics() {
  let keys = Object.keys(nodes);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      let a = nodes[keys[i]], b = nodes[keys[j]];
      let dx = b.x - a.x, dy = b.y - a.y;
      let distAB = sqrt(dx * dx + dy * dy) || 1;
      if (distAB < 180) {
        let force = (180 - distAB) * repulsionForce / distAB;
        let angle = atan2(dy, dx);
        a.x -= cos(angle) * force; a.y -= sin(angle) * force;
        b.x += cos(angle) * force; b.y += sin(angle) * force;
      }
    }
  }
  for (let k in nodes) {
    let node = nodes[k];
    node.x += (node.targetX - node.x) * springForce;
    node.y += (node.targetY - node.y) * springForce;
  }
}