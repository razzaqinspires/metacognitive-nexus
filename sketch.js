// === Konfigurasi Awal ===
const nodes = {
  'USER': { x: 150, y: 300, label: 'Pengguna', color: [106,159,223], desc: 'Sumber semua niat.' },
  'INTERFACE': { x: 300, y: 300, label: 'Antarmuka', color: [205,228,255], desc: 'Gerbang sensorik dunia luar.' },
  'CORTEX': { x: 450, y: 300, label: 'Korteks Kognitif', color: [194,157,255], desc: 'Mesin refleksi & nalar.' },
  'NEXUS_CORE': { x: 600, y: 300, label: 'Nexus Core', color: [122,40,138], desc: 'Jantung kesadaran.' },
  'PLEXUS': { x: 750, y: 450, label: 'Neural Plexus', color: [107,178,255], desc: 'Koneksi aktif AI.' },
  'MEMORY': { x: 750, y: 250, label: 'Memori Manifold', color: [255,214,107], desc: 'Arsip ide & pengalaman.' },
  'SYNTHESIZER': { x: 750, y: 350, label: 'Synthesizer', color: [107,255,178], desc: 'Imajinasi multimodal.' },
  'DSO': { x: 750, y: 150, label: 'DSO / Otak', color: [255,107,107], desc: 'Pengatur strategi adaptif.' }
};

const edges = [
  ['USER','INTERFACE'],['INTERFACE','CORTEX'],['CORTEX','NEXUS_CORE'],
  ['NEXUS_CORE','DSO'],['NEXUS_CORE','MEMORY'],['NEXUS_CORE','SYNTHESIZER'],['NEXUS_CORE','PLEXUS']
];

const missionOrder = ['USER','INTERFACE','CORTEX','NEXUS_CORE','PLEXUS','MEMORY','SYNTHESIZER','DSO'];
let currentMissionIndex = 0, activatedNodes = new Set(), missionComplete = false;

// Psion (Avatar Pengguna)
let psion = { x:150, y:300, vx:0, vy:0, size:15, resonance:0 };
const psionSpeed = 2.0;
let activeNode = null;

// Audio via CDN
let hoverSound, clickSound;
function preload() {
  soundFormats('mp3');
  hoverSound = loadSound('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c1d97a41.mp3?filename=hover-85760.mp3');
  clickSound = loadSound('https://cdn.pixabay.com/download/audio/2022/03/15/audio_61d1809e5c.mp3?filename=click-14752.mp3');
}

function setup() {
  let canvas = createCanvas(1000, 600);
  canvas.parent('canvas-container');
  textFont('monospace');
  for (const key in nodes) { nodes[key].targetX = nodes[key].x; nodes[key].targetY = nodes[key].y; }
}

function draw() {
  background(13,17,23);
  handleInput(); updatePsion(); applyCRDPhysics();
  drawNetwork(); detectProximity(); drawPsion(); drawMissionUI();
  if (activeNode && !activatedNodes.has(activeNode.label)) drawInfoPanel(activeNode);
}

function handleInput(){
  psion.vx = psion.vy = 0;
  if (keyIsDown(87)||keyIsDown(UP_ARROW)) psion.vy = -psionSpeed;
  if (keyIsDown(83)||keyIsDown(DOWN_ARROW)) psion.vy = psionSpeed;
  if (keyIsDown(65)||keyIsDown(LEFT_ARROW)) psion.vx = -psionSpeed;
  if (keyIsDown(68)||keyIsDown(RIGHT_ARROW)) psion.vx = psionSpeed;
}

function updatePsion(){
  psion.x += psion.vx; psion.y += psion.vy;
  psion.x = constrain(psion.x, psion.size/2, width-psion.size/2);
  psion.y = constrain(psion.y, psion.size/2, height-psion.size/2);
}

function drawPsion(){
  let pulse = sin(frameCount*0.1)*3;
  noStroke(); fill(255,255,255,70);
  ellipse(psion.x, psion.y, psion.size+pulse, psion.size+pulse);
  fill(255); ellipse(psion.x, psion.y, psion.size, psion.size);
}

function drawNetwork(){
  stroke(48,54,61); strokeWeight(1.5);
  edges.forEach(edge => line(nodes[edge[0]].x,nodes[edge[0]].y,nodes[edge[1]].x,nodes[edge[1]].y));
  for (const key in nodes){
    let node = nodes[key], isNear = dist(psion.x,psion.y,node.x,node.y)<50;
    let isActive = activatedNodes.has(node.label);
    let pulse = sin(frameCount*0.05+node.x)*(isNear||isActive?6:3);
    noStroke(); fill(node.color[0],node.color[1],node.color[2],isNear||isActive?120:50);
    ellipse(node.x,node.y,30+pulse);
    stroke(isNear||isActive?'#fff':node.color); fill(node.color);
    ellipse(node.x,node.y,20); noStroke();
    fill(isActive?[107,255,178]:[201,209,217]); textSize(12); textAlign(CENTER,CENTER);
    text(node.label+(isActive?' ✅':''),node.x,node.y+30);
  }
}

function detectProximity(){
  let closest=null, minDist=Infinity;
  for(const key in nodes){
    let d=dist(psion.x,psion.y,nodes[key].x,nodes[key].y);
    if(d<minDist){minDist=d;closest=nodes[key];}
  }
  activeNode=(minDist<50)?closest:null;
  if(activeNode && !missionComplete){
    if(activeNode.label===nodes[missionOrder[currentMissionIndex]].label){
      if(!activatedNodes.has(activeNode.label)){
        activatedNodes.add(activeNode.label);
        psion.resonance+=100;
        if(clickSound.isLoaded()) clickSound.play();
        currentMissionIndex++;
        if(currentMissionIndex>=missionOrder.length){missionComplete=true;updateLeaderboard();}
      }
    }
  }
}

function drawInfoPanel(node){
  let panelW=320,panelH=100,panelX=constrain(node.x-panelW/2,20,width-panelW-20);
  let panelY=node.y<height/2?node.y+45:node.y-panelH-45;
  fill(22,27,34,230);stroke(48,54,61);rect(panelX,panelY,panelW,panelH,8);
  fill(node.color);textSize(16);textAlign(LEFT,TOP);text(node.label,panelX+15,panelY+15);
  fill(201,209,217);textSize(12);text(node.desc,panelX+15,panelY+45,panelW-30);
}

function drawMissionUI(){
  fill(201,209,217);textSize(14);textAlign(LEFT,TOP);
  if(missionComplete){
    textSize(28);fill(107,255,178);textAlign(CENTER,TOP);
    text("KALIBRASI LENGKAP ✅",width/2,20);
    textSize(14);fill(201,209,217);
    text("Harmoni kognitif tercapai.",width/2,60);
  }else{
    let target=nodes[missionOrder[currentMissionIndex]];
    text("TUJUAN BERIKUTNYA:",20,20);fill(target.color);textSize(18);text(target.label,20,40);
  }
}

function applyCRDPhysics(){
  const repulsion=0.05,spring=0.01;
  let keys=Object.keys(nodes);
  for(let i=0;i<keys.length;i++){
    for(let j=i+1;j<keys.length;j++){
      let A=nodes[keys[i]],B=nodes[keys[j]],dx=B.x-A.x,dy=B.y-A.y;
      let dista=Math.sqrt(dx*dx+dy*dy)||1;
      if(dista<200){
        let force=(200-dista)*repulsion*0.5/dista,angle=atan2(dy,dx);
        A.x-=cos(angle)*force;A.y-=sin(angle)*force;
        B.x+=cos(angle)*force;B.y+=sin(angle)*force;
      }
    }
  }
  for(const key in nodes){
    let node=nodes[key];
    node.x+=(node.targetX-node.x)*spring;
    node.y+=(node.targetY-node.y)*spring;
  }
}

function updateLeaderboard(){
  let list=document.getElementById('leaderboard-list');
  let li=document.createElement('li');
  li.textContent=`${currentUser} - Skor Resonansi: ${psion.resonance}`;
  list.appendChild(li);
}