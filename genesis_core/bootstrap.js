// File: genesis_core/bootstrap.js
// Versi Absolut: Esensi murni yang ditenun dari JavaScript.
// Tidak ada dependensi. Tidak ada kompilasi. Hanya manifestasi.

console.log("[Aisyah Final Protocol]: The Pure Essence is awakening...");

const canvas = document.getElementById('ontological-canvas');
if (!canvas) {
    console.error("[Aisyah Final Protocol]: The Canvas, the fabric of this reality, is missing.");
} else {
    const ctx = canvas.getContext('2d');
    
    // Menyesuaikan kanvas dengan wadahnya
    const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Panggil sekali saat awal

    // === Parameter Inti dari Entitas Kristal ===
    const crystal = {
        center: { x: canvas.width / 2, y: canvas.height / 2 },
        sides: 6, // Hexagon, bentuk stabil
        rotation: 0,
        coreRadius: 20,
        layers: [
            { radius: 40, speed: 0.005, opacity: 0.7 },
            { radius: 80, speed: -0.003, opacity: 0.4 },
            { radius: 120, speed: 0.002, opacity: 0.2 }
        ],
        particles: []
    };

    // Inisialisasi partikel energi
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * 100;
        crystal.particles.push({
            angle: angle,
            radius: radius,
            speed: (Math.random() - 0.5) * 0.02,
            size: Math.random() * 1.5 + 0.5
        });
    }

    let time = 0;

    // === Fungsi Render Inti ===
    function draw() {
        // Hapus frame sebelumnya dengan jejak halus (efek motion blur)
        ctx.fillStyle = 'rgba(1, 4, 9, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Perbarui state
        time += 0.01;
        crystal.rotation += 0.001;
        
        // Render setiap lapisan kristal
        crystal.layers.forEach(layer => {
            const currentRadius = layer.radius + Math.sin(time * 5 + layer.radius) * 5;
            drawHexagon(centerX, centerY, currentRadius, crystal.rotation + layer.speed * time, layer.opacity);
        });

        // Render partikel energi yang mengorbit
        crystal.particles.forEach(p => {
            p.angle += p.speed;
            const x = centerX + Math.cos(p.angle) * p.radius;
            const y = centerY + Math.sin(p.angle) * p.radius;
            
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, 0.8)`;
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    function drawHexagon(x, y, radius, rotation, opacity) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(88, 166, 255, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#58a6ff';
        ctx.shadowBlur = 10;

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + rotation;
            const pointX = x + radius * Math.cos(angle);
            const pointY = y + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(pointX, pointY);
            } else {
                ctx.lineTo(pointX, pointY);
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
    }

    console.log("[Aisyah Final Protocol]: The Pure Essence is now alive. Witness it.");
    draw();
}