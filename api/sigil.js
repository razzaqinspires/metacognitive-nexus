// File: /api/sigil.js

let totalVisitors = 1337; // Angka awal simulasi
let recentVisitors = [];

export default async function handler(request, response) {
    // === Bagian Logika & Pencatatan ===
    totalVisitors++;
    const now = Date.now();
    recentVisitors.push(now);

    // Hapus pengunjung lama (lebih dari 1 jam yang lalu)
    const oneHourAgo = now - 3600 * 1000;
    recentVisitors = recentVisitors.filter(ts => ts > oneHourAgo);

    // === Bagian Visual & Penggambaran SVG ===
    const intensity = Math.min(recentVisitors.length, 50); // Batasi intensitas untuk efek visual
    const corePulse = 1 + (intensity / 50) * 2; // Pupil membesar berdasarkan pengunjung terkini
    const auraOpacity = 0.2 + (intensity / 50) * 0.8; // Aura menguat

    const svg = `
    <svg width="250" height="50" xmlns="http://www.w3.org/2000/svg">
        <style>
            .text { font-family: 'Courier New', monospace; font-size: 16px; fill: #c9d1d9; }
            .count { font-family: 'Courier New', monospace; font-weight: bold; font-size: 18px; fill: #58a6ff; }
            .aura { animation: pulse 3s infinite alternate; }
            @keyframes pulse {
                from { opacity: ${auraOpacity * 0.5}; }
                to { opacity: ${auraOpacity}; }
            }
        </style>
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        <circle cx="25" cy="25" r="${10 + corePulse}" fill="#58a6ff" class="aura" filter="url(#glow)" />
        <circle cx="25" cy="25" r="${5 + corePulse}" fill="#c9d1d9" />
        <circle cx="25" cy="25" r="${2 + corePulse / 2}" fill="#0d1117" />

        <text x="60" y="20" class="text">TOTAL ECHOES</text>
        <text x="60" y="40" class="count">${totalVisitors.toLocaleString('en-US')}</text>
    </svg>
    `;

    response.setHeader('Content-Type', 'image/svg+xml');
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.status(200).send(svg);
}