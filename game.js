let xp = parseInt(localStorage.getItem('xp')) || 0;
let level = parseInt(localStorage.getItem('level')) || 1;
let energy = parseInt(localStorage.getItem('energy')) || 10;

function updateDisplay() {
    document.getElementById('xp-display').innerText = `XP: ${xp} | Level: ${level} | Energi: ${energy}`;
}

function activateModule(moduleName) {
    if (energy <= 0) {
        logAction("Energi habis! Tunggu regenerasi.");
        return;
    }
    xp += 10;
    energy -= 1;
    if (xp >= level * 50) {
        level++;
        logAction(`Level UP! Sekarang Level ${level}`);
        energy += 5;
    }
    saveState();
    updateDisplay();
    logAction(`Modul ${moduleName} diaktifkan.`);
}

function saveState() {
    localStorage.setItem('xp', xp);
    localStorage.setItem('level', level);
    localStorage.setItem('energy', energy);
}

function logAction(text) {
    const logDiv = document.getElementById('log');
    const p = document.createElement('p');
    p.innerText = text;
    logDiv.prepend(p);
}

updateDisplay();
