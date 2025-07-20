// File: metacognitive-nexus/src/utils/PerformanceTracker.js
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Logger } from './Logger.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'performance_db.json');

/**
 * Melacak dan mengelola data performa historis untuk setiap kombinasi provider-model-key.
 * Menggunakan file JSON sederhana sebagai database persisten.
 * Ini adalah korteks sensorik sistem kita.
 */
export class PerformanceTracker {
    #db = new Map(); // Kunci: 'provider:model:keyPrefix' -> { latencies:[], failureCount:0, successCount:0, lastSeen: Date }
    #saveDebounceTimer;
    #saveInterval = 5000; // Simpan setiap 5 detik

    constructor() {
        this.#loadDatabase().catch(err => Logger.error('[PerformanceTracker] Gagal memuat database performa.', err));
        // Mulai interval penyimpanan otomatis
        setInterval(() => this.#saveDatabase(), this.#saveInterval);
    }

    async #loadDatabase() {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(DB_PATH, 'utf-8');
            const parsed = JSON.parse(data);
            for (const [key, value] of Object.entries(parsed)) {
                this.#db.set(key, { 
                    ...value, 
                    latencies: value.latencies || [], // Pastikan array latencies ada
                    successCount: value.successCount || 0,
                    failureCount: value.failureCount || 0,
                    lastSeen: new Date(value.lastSeen) 
                });
            }
            Logger.info(`[PerformanceTracker] Database performa berhasil dimuat dengan ${this.#db.size} entri.`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                Logger.info('[PerformanceTracker] Database performa tidak ditemukan, memulai dengan database baru.');
            } else {
                Logger.error('[PerformanceTracker] Error saat memuat database performa.', error);
            }
        }
    }

    async #saveDatabase() {
        if (this.#saveDebounceTimer) {
            clearTimeout(this.#saveDebounceTimer);
        }
        this.#saveDebounceTimer = setTimeout(async () => {
            try {
                const obj = Object.fromEntries(this.#db);
                await fs.writeFile(DB_PATH, JSON.stringify(obj, null, 2));
                Logger.debug('[PerformanceTracker] Database performa disimpan.');
            } catch (error) {
                Logger.error('[PerformanceTracker] Gagal menyimpan database performa.', error);
            }
        }, 1000); // Debounce simpan 1 detik setelah perubahan terakhir
    }

    /**
     * Mencatat hasil dari sebuah panggilan API.
     * @param {string} providerName
     * @param {string} model
     * @param {string} apiKey
     * @param {number} latencyMs
     * @param {boolean} success
     */
    async log(providerName, model, apiKey, latencyMs, success) {
        const keyPrefix = apiKey ? apiKey.substring(0, 8) : 'NO_KEY';
        const key = `${providerName}:${model}:${keyPrefix}`;

        if (!this.#db.has(key)) {
            this.#db.set(key, { latencies: [], successCount: 0, failureCount: 0 });
        }
        
        const entry = this.#db.get(key);
        if (success) {
            entry.latencies.push(latencyMs);
            // Simpan 50 entri latensi terakhir untuk rata-rata bergerak
            if (entry.latencies.length > 50) entry.latencies.shift();
            entry.successCount = (entry.successCount || 0) + 1;
        } else {
            entry.failureCount = (entry.failureCount || 0) + 1;
        }
        entry.lastSeen = new Date();
        
        // Simpan secara asinkron (didebounce)
        this.#saveDatabase();
    }

    /**
     * Mendapatkan metrik performa untuk kombinasi tertentu.
     * @returns {{avgLatency: number, successRate: number, totalCalls: number}}
     */
    getMetrics(providerName, model, apiKey) {
        const keyPrefix = apiKey ? apiKey.substring(0, 8) : 'NO_KEY';
        const key = `${providerName}:${model}:${keyPrefix}`;
        const entry = this.#db.get(key);

        if (!entry || (entry.successCount + entry.failureCount === 0)) {
            // Default optimis untuk entri baru, mendorong DSO untuk mencobanya
            return { avgLatency: 500, successRate: 0.9, totalCalls: 0 }; 
        }

        const totalCalls = entry.successCount + entry.failureCount;
        const avgLatency = entry.latencies.length > 0
            ? entry.latencies.reduce((a, b) => a + b, 0) / entry.latencies.length
            : 500; // Default jika tidak ada data latensi

        // Penanganan kasus pembagian nol
        const successRate = totalCalls > 0 ? entry.successCount / totalCalls : 0.9;

        return { avgLatency, successRate, totalCalls };
    }
}