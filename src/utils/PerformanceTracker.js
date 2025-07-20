// File: metacognitive-nexus/src/utils/PerformanceTracker.js (Versi Serebelum)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Logger } from './Logger.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'performance_db.json');
const EMA_ALPHA = 0.1; // Bobot untuk data baru dalam rata-rata bergerak (semakin kecil, semakin halus)

/**
 * PerformanceTracker direkayasa ulang sebagai Serebelum & Model Prediktif.
 * Ia melacak performa dengan intuisi terhadap tren terbaru (EMA),
 * memahami tingkat kepercayaan data, dan mendiagnosis tipe kegagalan.
 */
export class PerformanceTracker {
    // Kunci: 'provider:model:keyPrefix' -> 
    // { emaLatency: number, successCount: number, failureCount: number, failureReasons: Map, lastSeen: Date, totalCalls: number }
    #db = new Map();
    #saveDebounceTimer;

    constructor() {
        this.#loadDatabase().catch(err => Logger.error('[Cerebellum] Gagal memuat memori prosedural.', err));
    }

    async #loadDatabase() {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const data = await fs.readFile(DB_PATH, 'utf-8');
            const parsed = JSON.parse(data, (key, value) => {
                // Konversi kembali objek failureReasons menjadi Map
                if (key === 'failureReasons') {
                    return new Map(Object.entries(value));
                }
                return value;
            });
            for (const [key, value] of Object.entries(parsed)) {
                this.#db.set(key, { ...value, lastSeen: new Date(value.lastSeen) });
            }
            Logger.info(`[Cerebellum] Memori prosedural berhasil dimuat dengan ${this.#db.size} jejak performa.`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                Logger.info('[Cerebellum] Memori prosedural tidak ditemukan, memulai dengan kesadaran baru.');
            } else {
                Logger.error('[Cerebellum] Gagal memuat memori prosedural.', error);
            }
        }
    }

    #saveDatabaseDebounced() {
        clearTimeout(this.#saveDebounceTimer);
        this.#saveDebounceTimer = setTimeout(async () => {
            try {
                const obj = Object.fromEntries(Array.from(this.#db.entries()).map(([key, value]) => {
                    // Konversi Map failureReasons menjadi objek agar bisa di-JSON-kan
                    const serializableValue = { ...value, failureReasons: Object.fromEntries(value.failureReasons) };
                    return [key, serializableValue];
                }));
                await fs.writeFile(DB_PATH, JSON.stringify(obj, null, 2));
                Logger.debug('[Cerebellum] Memori prosedural disimpan ke disk.');
            } catch (error) {
                Logger.error('[Cerebellum] Gagal menyimpan memori prosedural.', error);
            }
        }, 2000); // Debounce 2 detik
    }

    /**
     * Mencatat pengalaman sensorik (hasil panggilan API).
     * @param {string} providerName
     * @param {string} model
     * @param {string} apiKey
     * @param {number} latencyMs
     * @param {boolean} success
     * @param {string} [failureType] - e.g., 'RATE_LIMIT', 'TIMEOUT'
     */
    log(providerName, model, apiKey, latencyMs, success, failureType = 'UNKNOWN') {
        const keyPrefix = apiKey ? apiKey.substring(0, 8) : 'NO_KEY';
        const key = `${providerName}:${model}:${keyPrefix}`;

        if (!this.#db.has(key)) {
            this.#db.set(key, { 
                emaLatency: latencyMs, 
                successCount: 0, 
                failureCount: 0,
                failureReasons: new Map(),
                totalCalls: 0
            });
        }
        
        const entry = this.#db.get(key);
        
        // Perbarui EMA Latency: Memberi bobot lebih pada data terbaru
        entry.emaLatency = (EMA_ALPHA * latencyMs) + (1 - EMA_ALPHA) * entry.emaLatency;

        if (success) {
            entry.successCount++;
        } else {
            entry.failureCount++;
            const reasonCount = entry.failureReasons.get(failureType) || 0;
            entry.failureReasons.set(failureType, reasonCount + 1);
        }
        entry.totalCalls++;
        entry.lastSeen = new Date();
        
        this.#saveDatabaseDebounced();
    }

    /**
     * Memberikan intuisi (metrik) tentang performa sebuah kandidat.
     * @returns {{avgLatency: number, successRate: number, totalCalls: number, confidence: number, failureProfile: object}}
     */
    getMetrics(providerName, model, apiKey) {
        const keyPrefix = apiKey ? apiKey.substring(0, 8) : 'NO_KEY';
        const key = `${providerName}:${model}:${keyPrefix}`;
        const entry = this.#db.get(key);

        if (!entry || entry.totalCalls === 0) {
            // Default optimis untuk entitas yang belum dikenal, dengan kepercayaan rendah
            return { avgLatency: 500, successRate: 0.9, totalCalls: 0, confidence: 0.1, failureProfile: {} };
        }
        
        const { emaLatency, successCount, totalCalls, failureReasons } = entry;
        const successRate = totalCalls > 0 ? successCount / totalCalls : 0;
        
        // Confidence Score: Seberapa kita percaya pada metrik ini?
        // Menggunakan fungsi logaritmik agar confidence tumbuh cepat di awal lalu melambat.
        const confidence = Math.min(1.0, Math.log10(totalCalls + 1) / 2); // Confidence 1.0 tercapai sekitar 100 panggilan

        return { 
            avgLatency: emaLatency, 
            successRate, 
            totalCalls, 
            confidence, 
            failureProfile: Object.fromEntries(failureReasons)
        };
    }

    /**
     * Metode untuk membersihkan interval saat shutdown.
     */
    shutdown() {
        clearTimeout(this.#saveDebounceTimer);
        Logger.info('[Cerebellum] Siklus penyimpanan memori prosedural dihentikan.');
    }
}