// File: metacognitive-nexus/src/core/DynamicSentienceOrchestrator.js

import { AIProviderBridge } from './AIProviderBridge.js';
import { APIKeyManager } from '../utils/APIKeyManager.js';
import { Logger } from '../utils/Logger.js';
import { PerformanceTracker } from '../utils/PerformanceTracker.js';

/**
 * DynamicSentienceOrchestrator (DSO) berfungsi sebagai korteks prefrontal dari AI,
 * mengatur pemilihan penyedia AI secara dinamis menggunakan peta kebijakan adaptif
 * yang didorong oleh niat (intent) dan data performa historis.
 */
export class DynamicSentienceOrchestrator {
    #providerBridge;
    #apiKeys = new Map();
    #providerConfigs = new Map();
    #performanceTracker;
    #isSleeping = false;
    #sleepUntil = null;
    #sleepDurationMs = 5 * 60 * 1000; // Tidur selama 5 menit

    // Peta Kebijakan Adaptif: Mendefinisikan bobot QLC (Quality, Latency, Cost) untuk setiap niat.
    #policies = {
        'default':          { w_q: 0.6, w_l: 0.3, w_c: 0.1 },
        'ChitChat':         { w_q: 0.2, w_l: 0.7, w_c: 0.1 },
        'QuestionAnswering':{ w_q: 0.7, w_l: 0.2, w_c: 0.1 },
        'CodeGeneration':   { w_q: 0.8, w_l: 0.1, w_c: 0.1 },
        'CreativeRequest':  { w_q: 0.9, w_l: 0.0, w_c: 0.1 },
        'PersonalVent':     { w_q: 0.5, w_l: 0.4, w_c: 0.1 },
        'ImageGeneration':  { w_q: 0.7, w_l: 0.1, w_c: 0.2 }, // Cost mungkin lebih tinggi
    };

    constructor(config) {
        this.#providerBridge = new AIProviderBridge();
        this.#performanceTracker = new PerformanceTracker();
        this.#loadConfig(config);
        Logger.info('[DSO] Prefrontal Cortex & Adaptive Policy Engine online.');
    }

    #loadConfig(config) {
        if (!config || !config.providers) {
            Logger.error('[DSO] Konfigurasi provider tidak valid atau tidak ada.');
            return;
        }
        for (const [name, providerConfig] of Object.entries(config.providers)) {
            this.#providerConfigs.set(name, providerConfig);
            if (providerConfig.apiKeys && providerConfig.apiKeys.length > 0) {
                this.#apiKeys.set(name, new APIKeyManager(name, providerConfig.apiKeys));
            }
        }
    }

    /**
     * Metode publik untuk menerima 'pulsa pembelajaran' dari ManifoldNavigator dan mengadaptasi kebijakan.
     * Ini adalah inti dari meta-learning DSO.
     * @param {{intent: string, success: boolean, latency: number, model: string, provider: string}} learningData
     */
    updateHeuristics(learningData) {
        const { intent, success, model, provider } = learningData;
        const policy = this.#policies[intent] || this.#policies['default'];
        const learningRate = 0.01; // Seberapa cepat kebijakan beradaptasi (kecil untuk stabilitas)

        const providerConfig = this.#providerConfigs.get(provider);
        // Kualitas model berdasarkan urutannya (semakin kecil urutan, semakin tinggi kualitas)
        const modelQualityProxy = providerConfig?.models?.length 
            ? (1 - ((providerConfig.modelOrder?.[model] || 0) / providerConfig.models.length)) 
            : 0.5;

        if (success) {
            // Jika model berkualitas berhasil, sedikit tingkatkan bobot kualitas untuk niat ini
            policy.w_q += learningRate * modelQualityProxy;
        } else {
            // Jika gagal, turunkan bobot kualitas secara lebih signifikan
            policy.w_q -= learningRate * (1.5 - modelQualityProxy);
        }
        
        // Pastikan bobot tidak menjadi negatif
        policy.w_q = Math.max(0, policy.w_q);

        // Normalisasi ulang semua bobot agar totalnya tetap 1
        const totalWeight = policy.w_q + policy.w_l + policy.w_c;
        if (totalWeight > 0) {
            policy.w_q /= totalWeight;
            policy.w_l /= totalWeight;
            policy.w_c /= totalWeight;
        }

        Logger.debug(`[DSO] Kebijakan untuk intent '${intent}' diadaptasi: w_q=${policy.w_q.toFixed(3)}, w_l=${policy.w_l.toFixed(3)}, w_c=${policy.w_c.toFixed(3)}`);
    }

    /**
     * Memilih kandidat (provider, model, key) terbaik berdasarkan kebijakan yang relevan dengan niat.
     * @param {string} intent Niat dari permintaan saat ini.
     * @returns {object | null} Kandidat optimal atau null.
     */
    #selectOptimalCandidate(intent = 'default') {
        const policy = this.#policies[intent] || this.#policies['default'];
        const { w_q, w_l, w_c } = policy;
        const candidates = [];

        for (const [providerName, keyManager] of this.#apiKeys.entries()) {
            const config = this.#providerConfigs.get(providerName);
            if (!config || !keyManager.hasKeys()) continue;

            for (const model of config.models) {
                for (const apiKey of keyManager.getAllKeys()) {
                    const metrics = this.#performanceTracker.getMetrics(providerName, model, apiKey);

                    // Circuit Breaker: Istirahatkan API key yang sering gagal
                    if (metrics.totalCalls > 10 && metrics.successRate < 0.2) {
                        Logger.warn(`[DSO] Circuit Breaker aktif untuk ${providerName}:${model}:${apiKey.substring(0,8)}.`);
                        continue;
                    }

                    // Proxy Kualitas: Gabungan dari kualitas inheren model dan tingkat keberhasilan historisnya
                    const modelQualityProxy = (config.modelOrder?.[model] !== undefined) ? (1 - (config.modelOrder[model] / config.models.length)) : 0.5;
                    const qualityScore = (modelQualityProxy * 0.4) + (metrics.successRate * 0.6);

                    // Normalisasi Latensi (0-1): 0 = instan, 1 = 5 detik atau lebih
                    const normLatency = Math.min(metrics.avgLatency, 5000) / 5000;
                    
                    // Normalisasi Biaya (0-1): 0 = gratis, 1 = $0.05 per 1k token atau lebih
                    const modelCost = config.costPerMilleTokens?.[model] || 0.001; // Default biaya kecil
                    const normCost = Math.min(modelCost, 0.05) / 0.05;

                    // Rumus QLC dinamis berdasarkan kebijakan yang dipilih
                    const qlcScore = (w_q * qualityScore) - (w_l * normLatency) - (w_c * normCost);
                                     
                    candidates.push({ providerName, model, apiKey, qlcScore, metrics });
                }
            }
        }
        
        if (candidates.length === 0) return null;

        candidates.sort((a, b) => b.qlcScore - a.qlcScore);
        Logger.debug(`[DSO] Intent: '${intent}'. Kandidat teratas: ${candidates[0].providerName}:${candidates[0].model} (Skor: ${candidates[0].qlcScore.toFixed(3)})`);
        return candidates[0];
    }

    /**
     * Meminta teks dari AI dengan menerapkan kebijakan yang relevan dengan konteks.
     * @param {string} prompt Teks prompt.
     * @param {object} options Opsi tambahan, termasuk 'intent'.
     * @returns {Promise<object>} Obyek hasil yang kaya informasi.
     */
    async generateText(prompt, options = {}) {
        const { intent = 'default' } = options;
        const fallbackPath = [];

        if (this.#isSleeping) {
            if (Date.now() < this.#sleepUntil) {
                const remainingTime = Math.ceil((this.#sleepUntil - Date.now()) / (1000 * 60));
                const message = `AI sedang beristirahat untuk memulihkan diri. Coba lagi dalam ${remainingTime} menit.`;
                Logger.warn(`[DSO] Permintaan ditolak: ${message}`, true);
                return { response: null, error: new Error(message), success: false, fallbackPath };
            } else {
                Logger.info('[DSO] AI bangun dari tidur. Mereset state.');
                this.#isSleeping = false;
                this.#sleepUntil = null;
            }
        }

        let currentAttempts = 0;
        const maxAttemptsPerRequest = 5;

        while (currentAttempts < maxAttemptsPerRequest) {
            const candidate = this.#selectOptimalCandidate(intent);

            if (!candidate) {
                const message = 'Tidak ada kandidat AI yang sehat tersedia. Memasuki mode tidur.';
                Logger.error(`[DSO] ${message}`);
                this.#isSleeping = true;
                this.#sleepUntil = Date.now() + this.#sleepDurationMs;
                return { response: null, error: new Error(message), success: false, fallbackPath };
            }
            
            const { providerName, model, apiKey } = candidate;
            fallbackPath.push(`${providerName}:${model}`);

            this.#providerBridge.registerProvider(providerName, apiKey, model);
            const adapter = this.#providerBridge.getAdapter(providerName);

            if (!adapter) {
                Logger.error(`[DSO] Gagal mendapatkan adapter untuk ${providerName}.`);
                currentAttempts++;
                continue;
            }

            const startTime = Date.now();
            try {
                Logger.debug(`[DSO] Mencoba kandidat: ${providerName}:${model} (Upaya ${currentAttempts + 1}/${maxAttemptsPerRequest})`);
                const response = await adapter.generateText(prompt);
                const latency = Date.now() - startTime;
                this.#performanceTracker.log(providerName, model, apiKey, latency, true);
                Logger.info(`[DSO] Berhasil dari ${providerName}:${model} dalam ${latency}ms.`);
                return { response, providerUsed: providerName, modelUsed: model, latencyMs: latency, success: true, fallbackPath };

            } catch (error) {
                const latency = Date.now() - startTime;
                Logger.warn(`[DSO] Gagal dari ${providerName}:${model}: ${error.message}.`);
                this.#performanceTracker.log(providerName, model, apiKey, latency, false);
                currentAttempts++;
            }
        }
        
        const finalMessage = 'Semua upaya pada kandidat optimal gagal. AI akan tidur.';
        Logger.error(`[DSO] ${finalMessage}`);
        this.#isSleeping = true;
        this.#sleepUntil = Date.now() + this.#sleepDurationMs;
        return { response: null, error: new Error(finalMessage), success: false, fallbackPath };
    }

    /**
     * [METODE BARU] Menyediakan jalur komunikasi untuk status tidur.
     * @returns {boolean}
     */
    isSleeping() {
        return this.#isSleeping;
    }
}