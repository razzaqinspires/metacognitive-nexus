// File: metacognitive-nexus/src/core/DynamicSentienceOrchestrator.js
import { AIProviderBridge } from './AIProviderBridge.js';
import { APIKeyManager } from '../utils/APIKeyManager.js';
import { Logger } from '../utils/Logger.js';
import { PerformanceTracker } from '../utils/PerformanceTracker.js';

/**
 * DynamicSentienceOrchestrator (DSO) mengatur dan mengoptimalkan pemilihan penyedia AI
 * berdasarkan performa historis dan model QLC prediktif.
 * Ini adalah korteks prediktif yang Anda inginkan.
 */
export class DynamicSentienceOrchestrator {
    #providerBridge;
    #apiKeys = new Map(); // Map: providerName -> APIKeyManager instance
    #providerConfigs = new Map(); // Map: providerName -> { models: [], qualityWeight: X }
    #performanceTracker;
    #isSleeping = false;
    #sleepUntil = null;
    #sleepDurationMs = 5 * 60 * 1000; // Default tidur 5 menit
    #globalAttemptCounter = 0; // Untuk melacak total upaya global

    constructor(config) {
        this.#providerBridge = new AIProviderBridge();
        this.#performanceTracker = new PerformanceTracker();
        this.#loadConfig(config);
        Logger.info('[DSO] Dynamic Sentience Orchestrator diinisialisasi. Siap untuk orkestrasi cerdas.');
    }

    #loadConfig(config) {
        for (const [name, providerConfig] of Object.entries(config.providers)) {
            // Memastikan models ada dan diurutkan dari yang tercanggih/terbaik
            const models = providerConfig.models?.sort((a, b) => (providerConfig.modelOrder?.[a] || 0) - (providerConfig.modelOrder?.[b] || 0)) || [];
            this.#providerConfigs.set(name, {
                ...providerConfig,
                models: models, // Models sudah diurutkan
                qualityWeight: providerConfig.qualityWeight || 1.0, // Default quality weight
                latencyWeight: providerConfig.latencyWeight || 1.0,
                costWeight: providerConfig.costWeight || 1.0,
            });
            if (providerConfig.apiKeys && providerConfig.apiKeys.length > 0) {
                this.#apiKeys.set(name, new APIKeyManager(name, providerConfig.apiKeys));
            }
        }
    }

    /**
     * Memilih kandidat terbaik (provider, model, key) berdasarkan performa historis (QLC Score).
     * Ini adalah inti dari "peramalan" DSO.
     * @returns {{providerName: string, model: string, apiKey: string, qlcScore: number} | null} Kandidat optimal.
     */
    #selectOptimalCandidate() {
        const candidates = [];
        for (const [providerName, keyManager] of this.#apiKeys.entries()) {
            const config = this.#providerConfigs.get(providerName);
            if (!config || !keyManager.hasKeys()) continue;

            for (const model of config.models) {
                for (const apiKey of keyManager.getAllKeys()) {
                    const metrics = this.#performanceTracker.getMetrics(providerName, model, apiKey);

                    // Circuit Breaker: Jika tingkat kegagalan > 80% setelah 10 panggilan, istirahatkan
                    // Ini mengistirahatkan keyPrefix, bukan seluruh provider.
                    if (metrics.totalCalls > 10 && metrics.successRate < 0.2) {
                        Logger.warn(`[DSO] Circuit Breaker aktif untuk ${providerName}:${model}:${apiKey.substring(0,8)}. Terlalu banyak kegagalan. (SR: ${metrics.successRate.toFixed(2)})`);
                        continue; // Lewati kandidat ini
                    }

                    // Rumus QLC: Score_QLC = w_q * Q_norm - w_l * L_norm - w_c * C_norm
                    // Normalisasi L dan C agar berada dalam skala yang sama (misal 0-1)
                    // L_norm = avgLatency / maxExpectedLatency (misal 5000ms)
                    // C_norm = costPerCall / maxExpectedCost (misal $0.05)
                    // Untuk saat ini, asumsikan normalisasi sederhana atau fixed values.
                    
                    const Q_norm = config.qualityWeight; // Awalnya dari config, nanti bisa dinamis
                    const L_norm = metrics.avgLatency / 1000; // Normalisasi ke detik untuk perbandingan yang lebih intuitif
                    const S_norm = metrics.successRate; // Success Rate langsung sebagai Quality proxy
                    
                    // Kita bisa menyesuaikan bobot lebih lanjut di sini
                    const w_q = 0.5; // Bobot kualitas/success rate
                    const w_l = 0.3; // Bobot latensi (nilai lebih rendah lebih baik, jadi kita kurangkan)
                    const w_c = 0.2; // Bobot biaya (akan ditambahkan jika ada data biaya)

                    // Menggunakan success rate sebagai proxy kualitas dan pengali efektif
                    // Latensi yang lebih rendah akan memberikan skor lebih tinggi
                    // Kita bisa menggunakan (1 - L_norm) untuk latensi, di mana L_norm adalah latensi_aktual / latensi_maksimal
                    const qlcScore = (w_q * S_norm) - (w_l * (L_norm / 5)) + (w_c * 0); // Cost di set 0 untuk saat ini. Max Latency 5 detik
                    
                    candidates.push({ providerName, model, apiKey, qlcScore, metrics });
                }
            }
        }

        if (candidates.length === 0) return null;
        
        // Urutkan kandidat berdasarkan skor QLC tertinggi
        candidates.sort((a, b) => b.qlcScore - a.qlcScore);
        Logger.debug(`[DSO] Kandidat teratas: ${candidates[0].providerName}:${candidates[0].model} (Score: ${candidates[0].qlcScore.toFixed(3)}, Lat: ${candidates[0].metrics.avgLatency}ms, SR: ${candidates[0].metrics.successRate.toFixed(2)})`);
        return candidates[0];
    }

    /**
     * Meminta teks dari AI dengan orkestrasi cerdas.
     * @param {string} prompt Teks prompt untuk AI.
     * @param {object} options Opsi tambahan { showUserError: boolean, devErrorHandler: Function, context: string }
     * @returns {Promise<string | null>} Respons dari AI atau null jika gagal.
     */
    async generateText(prompt, options = {}) {
        this.#globalAttemptCounter++; // Increment setiap kali generateText dipanggil

        // Logika tidur/bangun AI
        if (this.#isSleeping) {
            if (Date.now() < this.#sleepUntil) {
                const remainingTime = Math.ceil((this.#sleepUntil - Date.now()) / (1000 * 60));
                const message = `AI sedang beristirahat untuk memulihkan diri. Mohon coba lagi dalam ${remainingTime} menit.`;
                Logger.warn(`[DSO] ${message}`, false, true); // Log ke dev, tunjukkan ke user
                options.devErrorHandler?.(new Error(`AI is sleeping. Remaining: ${remainingTime} min`));
                return null;
            } else {
                Logger.info('[DSO] AI Bangun dari tidur. Mereset state.');
                this.#isSleeping = false;
                this.#sleepUntil = null;
                // Reset semua API key rotasi (jika APIKeyManager mengelola state individual key)
                this.#apiKeys.forEach(manager => manager.resetRotation());
                this.#globalAttemptCounter = 0; // Reset counter upaya global saat bangun
            }
        }

        let currentAttempts = 0;
        const maxAttemptsPerRequest = 5; // Maksimal coba 5 kandidat optimal sebelum tidur

        while (currentAttempts < maxAttemptsPerRequest) {
            const candidate = this.#selectOptimalCandidate();

            if (!candidate) {
                Logger.error('[DSO] Tidak ada kandidat AI yang sehat tersedia atau semua API Keys telah di-circuit break. Memasuki mode tidur.');
                this.#isSleeping = true;
                this.#sleepUntil = Date.now() + this.#sleepDurationMs;
                const remainingTime = Math.ceil(this.#sleepDurationMs / (1000 * 60));
                Logger.error(`[DSO] Semua penyedia AI habis atau di-circuit break. AI akan tidur selama ${remainingTime} menit.`, null, false);
                if (options.showUserError) {
                    Logger.info(`Maaf, AI sedang beristirahat sejenak untuk memulihkan diri. Mohon coba lagi dalam ${remainingTime} menit.`, true);
                }
                options.devErrorHandler?.(new Error("AI is currently sleeping due to all providers being exhausted or circuit-broken."));
                return null;
            }

            const { providerName, model, apiKey } = candidate;
            this.#providerBridge.registerProvider(providerName, apiKey, model); // Pastikan adapter terdaftar
            const adapter = this.#providerBridge.getAdapter(providerName);

            if (!adapter) {
                Logger.error(`[DSO] Gagal mendapatkan adapter untuk ${providerName}. Melewatkan kandidat ini.`);
                currentAttempts++;
                continue;
            }

            const startTime = Date.now();
            try {
                Logger.debug(`[DSO] Mencoba kandidat optimal: ${providerName} (${model}) dengan API Key ${apiKey.substring(0,8)}... (Attempt ${currentAttempts + 1}/${maxAttemptsPerRequest})`);
                const response = await adapter.generateText(prompt);
                const latency = Date.now() - startTime;

                // Log kesuksesan
                this.#performanceTracker.log(providerName, model, apiKey, latency, true);
                Logger.info(`[DSO] Berhasil dari ${providerName} (${model}) dalam ${latency}ms.`);
                return response;

            } catch (error) {
                const latency = Date.now() - startTime;
                Logger.warn(`[DSO] Gagal dari ${providerName} (${model}): ${error.message}.`);
                
                // Log kegagalan ke PerformanceTracker. Ini akan memengaruhi skor QLC kandidat tersebut.
                this.#performanceTracker.log(providerName, model, apiKey, latency, false);
                
                currentAttempts++;
                // Lanjutkan ke iterasi berikutnya untuk mencoba kandidat optimal lainnya.
                // Logika fallback yang kompleks sudah dienkapsulasi dalam pemilihan #selectOptimalCandidate()
                // dan circuit breaking di PerformanceTracker.
            }
        }

        // Jika semua upaya pada kandidat terbaik gagal
        Logger.error('[DSO] Semua upaya pada kandidat AI optimal gagal. AI akan tidur.');
        this.#isSleeping = true;
        this.#sleepUntil = Date.now() + this.#sleepDurationMs;
        const remainingTime = Math.ceil(this.#sleepDurationMs / (1000 * 60));
        Logger.error(`[DSO] Semua penyedia AI habis. AI akan tidur selama ${remainingTime} menit.`, null, false);
        if (options.showUserError) {
             Logger.info(`Maaf, AI sedang beristirahat sejenak untuk memulihkan diri. Mohon coba lagi dalam ${remainingTime} menit.`, true);
        }
        options.devErrorHandler?.(new Error("AI is currently sleeping after exhausting all optimal candidates."));
        return null;
    }
}