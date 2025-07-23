// File: metacognitive-nexus/src/core/DynamicSentienceOrchestrator.js

import { AIProviderBridge } from './AIProviderBridge.js';
import { APIKeyManager } from '../utils/APIKeyManager.js';
import { Logger } from '../utils/Logger.js';
import { PerformanceTracker } from '../utils/PerformanceTracker.js';
import { aiProvidersConfig } from '../../config/aiProviders.js'; // Impor konfigurasi dasar

/**
 * DynamicSentienceOrchestrator (DSO) berfungsi sebagai korteks prefrontal dari AI,
 * mengatur pemilihan penyedia AI secara dinamis menggunakan peta kebijakan adaptif
 * yang didorong oleh niat (intent) dan data performa historis, kini dengan kesadaran Sigillum.
 */
export class DynamicSentienceOrchestrator {
    #providerBridge;
    #apiKeys = new Map(); // Map: providerName -> APIKeyManager instance
    #providerConfigs = new Map(); // Map: providerName -> config (dynamic, influenced by Sigillum)
    #performanceTracker;
    #isSleeping = false;
    #sleepUntil = null;
    #defaultSleepDurationMs = 5 * 60 * 1000; // Tidur default 5 menit

    // Peta Kebijakan Adaptif: Mendefinisikan bobot QLC (Quality, Latency, Cost) untuk setiap niat.
    #policies = {
        'default':          { w_q: 0.6, w_l: 0.3, w_c: 0.1 },
        'ChitChat':         { w_q: 0.2, w_l: 0.7, w_c: 0.1 },
        'QuestionAnswering':{ w_q: 0.7, w_l: 0.2, w_c: 0.1 },
        'CodeGeneration':   { w_q: 0.8, w_l: 0.1, w_c: 0.1 },
        'CreativeRequest':  { w_q: 0.9, w_l: 0.0, w_c: 0.1 },
        'PersonalVent':     { w_q: 0.5, w_l: 0.4, w_c: 0.1 },
        'ImageGeneration':  { w_q: 0.7, w_l: 0.1, w_c: 0.2 },
        'TypoCorrectionSuggestion': { w_q: 0.6, w_l: 0.3, w_c: 0.1 }, // Niat baru
        'SystemManagement': { w_q: 0.8, w_l: 0.1, w_c: 0.1 }, // Niat baru
        'SystemSummary':    { w_q: 0.7, w_l: 0.2, w_c: 0.1 }, // Niat baru
        'PassiveLearning':  { w_q: 0.1, w_l: 0.8, w_c: 0.1 }, // Niat baru untuk pembelajaran pasif
    };

    #sigillumSensorium; // Referensi ke SigillumSensorium
    #nexusConfig; // Konfigurasi Nexus lengkap dari main.js

    constructor(config, aiProviderBridge, sigillumSensorium) {
        this.#nexusConfig = config; // Simpan konfigurasi lengkap Nexus
        this.#providerBridge = aiProviderBridge; // Menerima instance bridge yang sudah ada
        this.#performanceTracker = new PerformanceTracker();
        this.#sigillumSensorium = sigillumSensorium; // Simpan referensi

        this.#loadConfig(aiProvidersConfig); // Muat konfigurasi dasar dari aiProviders.js
        Logger.info('[DSO] Prefrontal Cortex & Adaptive Policy Engine online.');

        // Mendaftarkan DSO untuk mendengarkan perubahan Sigillum dan melakukan penyesuaian kebijakan
        // Di produksi, ini mungkin melalui event emitter atau poling yang lebih canggih.
        setInterval(() => {
            const state = this.#sigillumSensorium.getCurrentState();
            this.#adjustPolicyBasedOnSigillum(state);
            this.applyIdeonDecayAndManageCuriosity(); // Memicu manajemen ideon dan rasa ingin tahu
        }, this.#nexusConfig.dsoConfig?.policyAdjustmentIntervalMs || 60 * 1000); // Sesuaikan setiap 1 menit secara default
    }

    #loadConfig(initialAiProvidersConfig) {
        if (!initialAiProvidersConfig || !initialAiProvidersConfig.providers) {
            Logger.error('[DSO] Konfigurasi provider awal tidak valid atau tidak ada.');
            return;
        }
        for (const [name, providerConfig] of Object.entries(initialAiProvidersConfig.providers)) {
            // Salin konfigurasi agar dapat dimodifikasi secara dinamis
            this.#providerConfigs.set(name, { ...providerConfig });
            if (providerConfig.apiKeys && providerConfig.apiKeys.length > 0) {
                this.#apiKeys.set(name, new APIKeyManager(name, providerConfig.apiKeys));
            }
        }
    }

    /**
     * [QMH CORE] Menyesuaikan kebijakan pemilihan AI berdasarkan keadaan Sigillum.
     * Ini adalah manifestasi dari Modulasi Ontologis.
     * @param {{purity: number, symmetry: number, fractureCount: number}} sigillumState
     */
    #adjustPolicyBasedOnSigillum(sigillumState) {
        const { purity, fractureCount } = sigillumState;

        // Dapatkan bobot dasar dari konfigurasi awal untuk mencegah akumulasi perubahan
        const baseAiProvidersConfig = aiProvidersConfig.providers;

        for (const providerName in baseAiProvidersConfig) {
            if (this.#providerConfigs.has(providerName)) {
                const baseConfig = baseAiProvidersConfig[providerName];
                const currentConfig = this.#providerConfigs.get(providerName);

                // Prioritaskan keandalan dan biaya rendah saat sistem mengalami stres (purity rendah, fractureCount tinggi)
                // Ini adalah HEURISTIK MORFOGENIK KUANTUM
                
                // Jika purity sangat rendah atau banyak retakan, tingkatkan bobot latensi dan biaya, turunkan kualitas
                const stressFactor = (1 - purity) + (fractureCount * 0.1); // Skor stres 0-~1+
                
                currentConfig.qualityWeight = baseConfig.qualityWeight * (1 - stressFactor * 0.5); // Kualitas bisa turun hingga 50%
                currentConfig.latencyWeight = baseConfig.latencyWeight * (1 + stressFactor * 0.7); // Latensi bisa naik hingga 70%
                currentConfig.costWeight = baseConfig.costWeight * (1 + stressFactor * 0.8); // Biaya bisa naik hingga 80%

                // Batasi nilai agar masuk akal
                currentConfig.qualityWeight = Math.max(0.1, currentConfig.qualityWeight);
                currentConfig.latencyWeight = Math.min(2.0, currentConfig.latencyWeight);
                currentConfig.costWeight = Math.min(2.0, currentConfig.costWeight);

                Logger.debug(`[DSO] Kebijakan untuk ${providerName} disesuaikan berdasarkan Sigillum. Stres: ${stressFactor.toFixed(2)}. Weights: Q=${currentConfig.qualityWeight.toFixed(2)}, L=${currentConfig.latencyWeight.toFixed(2)}, C=${currentConfig.costWeight.toFixed(2)}.`);
            }
        }
        // Di sini juga bisa memodulasi strategi ManifoldMemory, misalnya:
        // Jika purity rendah, ManifoldMemory bisa diminta untuk lebih agresif dalam pencarian konsep dasar,
        // atau kurang berani dalam membuat asosiasi baru.
        // Misalnya: this.#aiNexus.getMemory().setLearningAggressiveness(stressFactor);
    }

    /**
     * Metode publik untuk menerima 'pulsa pembelajaran' dari ManifoldNavigator dan mengadaptasi kebijakan.
     * Ini adalah inti dari meta-learning DSO.
     * @param {{intent: string, success: boolean, latency: number, model: string, provider: string}} learningData
     */
    updateHeuristics(learningData) {
        const { intent, success, model, provider, latency } = learningData;
        const policy = this.#policies[intent] || this.#policies['default'];
        const learningRate = this.#nexusConfig.dsoConfig?.learningRate || 0.01; // Seberapa cepat kebijakan beradaptasi

        const providerConfig = this.#providerConfigs.get(provider);
        // Kualitas model berdasarkan urutannya (semakin kecil urutan, semakin tinggi kualitas)
        const modelQualityProxy = (providerConfig?.modelOrder?.[model] !== undefined)
            ? (1 - ((providerConfig.modelOrder[model] || 0) / providerConfig.models.length))
            : 0.5;

        // Penguatan/Pelemahan berdasarkan hasil (Reinforcement Learning sederhana)
        if (success) {
            policy.w_q += learningRate * modelQualityProxy; // Hadiah kualitas
            policy.w_l -= learningRate * (latency / 1000); // Hadiah latensi (semakin rendah semakin baik)
            policy.w_c -= learningRate * (this.#getCostProxy(provider, model) / 0.01); // Hadiah biaya (semakin rendah semakin baik)
        } else {
            policy.w_q -= learningRate * (1.5 - modelQualityProxy); // Penalti kualitas
            policy.w_l += learningRate * (latency / 1000); // Penalti latensi
            policy.w_c += learningRate * (this.#getCostProxy(provider, model) / 0.01); // Penalti biaya
        }
        
        // Pastikan bobot tidak menjadi negatif
        policy.w_q = Math.max(0, policy.w_q);
        policy.w_l = Math.max(0, policy.w_l);
        policy.w_c = Math.max(0, policy.w_c);

        // Normalisasi ulang semua bobot agar totalnya tetap 1
        const totalWeight = policy.w_q + policy.w_l + policy.w_c;
        if (totalWeight > 0) {
            policy.w_q /= totalWeight;
            policy.w_l /= totalWeight;
            policy.w_c /= totalWeight;
        }

        Logger.debug(`[DSO] Kebijakan untuk intent '${intent}' diadaptasi: Q=${policy.w_q.toFixed(3)}, L=${policy.w_l.toFixed(3)}, C=${policy.w_c.toFixed(3)}`);
    }

    // Helper untuk mendapatkan proxy biaya
    #getCostProxy(providerName, model) {
        const config = aiProvidersConfig.providers[providerName];
        return config?.costPerMilleTokens?.[model] || 0.001; // Default biaya kecil
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
            const config = this.#providerConfigs.get(providerName); // Gunakan konfigurasi yang sudah dimodifikasi
            if (!config || !keyManager.hasKeys()) continue;

            // Dapatkan kunci aktif dari KeyManager (Credential Governor)
            const activeKeysForProvider = keyManager.getAllKeys().filter(key => keyManager.getIndividualKeyStatus(key) === 'active');
            if (activeKeysForProvider.length === 0) {
                Logger.debug(`[DSO] Tidak ada kunci aktif untuk provider ${providerName}.`);
                continue;
            }

            for (const model of config.models) {
                for (const apiKey of activeKeysForProvider) { // Iterasi hanya pada kunci aktif
                    const metrics = this.#performanceTracker.getMetrics(providerName, model, apiKey);

                    // Circuit Breaker: Istirahatkan API key yang sering gagal
                    if (metrics.totalCalls > (this.#nexusConfig.dsoConfig?.minCallsForCircuitBreaker || 10) && metrics.successRate < (this.#nexusConfig.dsoConfig?.minSuccessRate || 0.2)) {
                        Logger.warn(`[DSO] Circuit Breaker aktif untuk ${providerName}:${model}:${apiKey.substring(0,8)} (Rate: ${metrics.successRate.toFixed(2)}).`);
                        continue;
                    }

                    // Proxy Kualitas: Gabungan dari kualitas inheren model dan tingkat keberhasilan historisnya
                    const modelQualityProxy = (config.modelOrder?.[model] !== undefined) ? (1 - (config.modelOrder[model] / config.models.length)) : 0.5;
                    // Gabungkan dengan bobot kualitas dari providerConfig (yang sudah dimodulasi Sigillum)
                    const qualityScore = (modelQualityProxy * config.qualityWeight * 0.4) + (metrics.successRate * 0.6);

                    // Normalisasi Latensi (0-1): 0 = instan, 1 = MaxLatencyMs atau lebih
                    const maxLatencyMs = this.#nexusConfig.dsoConfig?.maxLatencyConsiderationMs || 5000;
                    const normLatency = Math.min(metrics.avgLatency, maxLatencyMs) / maxLatencyMs;
                    
                    // Normalisasi Biaya (0-1): 0 = gratis, 1 = MaxCostPerMille atau lebih
                    const modelCost = config.costPerMilleTokens?.[model] || 0.001;
                    const maxCostPerMille = this.#nexusConfig.dsoConfig?.maxCostConsiderationPerMille || 0.05;
                    const normCost = Math.min(modelCost, maxCostPerMille) / maxCostPerMille;

                    // Rumus QLC dinamis berdasarkan kebijakan yang dipilih dan bobot yang dimodulasi Sigillum
                    // Menggunakan bobot dari kebijakan (yang adaptif)
                    const qlcScore = (w_q * qualityScore) - (w_l * normLatency * config.latencyWeight) - (w_c * normCost * config.costWeight);
                                     
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
     * @param {object} payload Payload interaksi lengkap.
     * @param {Array<object>} payload.messages - Riwayat percakapan [{role, content}].
     * @param {string} [payload.userId] - ID pengguna.
     * @param {string} [payload.platform] - Platform interaksi.
     * @param {string} [payload.intent] - Niat dari permintaan saat ini.
     * @param {boolean} [payload.showUserError] - Apakah akan menampilkan pesan error ke pengguna.
     * @param {Function} [payload.devErrorHandler] - Callback untuk error developer.
     * @returns {Promise<object>} Obyek hasil yang kaya informasi (content, providerUsed, modelUsed, latencyMs, success, error).
     */
    async generateText(payload) {
        const { messages, userId, platform, intent = 'default', showUserError = false, devErrorHandler = Logger.error } = payload;
        const fallbackPath = [];

        if (this.#isSleeping) {
            const remainingTime = Math.ceil((this.#sleepUntil - Date.now()) / (1000 * 60));
            if (Date.now() < this.#sleepUntil) {
                const message = `AI sedang beristirahat untuk memulihkan diri. Coba lagi dalam ${remainingTime} menit.`;
                Logger.warn(`[DSO] Permintaan ditolak: ${message}`);
                if (showUserError) {
                    // Ini harus ditangani di Genesis Core untuk mengirim pesan ke user
                    // Misalnya, melalui event atau callback ke WhatsAppEventHandler
                }
                devErrorHandler(`[DSO] ${message}`, new Error(message));
                return { response: null, error: new Error(message), success: false, fallbackPath, providerUsed: 'DSO', modelUsed: 'SleepMode' };
            } else {
                Logger.info('[DSO] AI bangun dari tidur. Mereset state.');
                this.#isSleeping = false;
                this.#sleepUntil = null;
                // Reset semua API key status setelah bangun tidur
                this.#apiKeys.forEach(manager => manager.resetAllKeyStatuses());
            }
        }

        let currentAttempts = 0;
        const maxAttemptsPerRequest = this.#nexusConfig.dsoConfig?.maxAttemptsPerRequest || 5;

        while (currentAttempts < maxAttemptsPerRequest) {
            const candidate = this.#selectOptimalCandidate(intent);

            if (!candidate) {
                const message = 'Tidak ada kandidat AI yang sehat tersedia. Memasuki mode tidur.';
                Logger.error(`[DSO] ${message}`);
                this.#isSleeping = true;
                this.#sleepUntil = Date.now() + (this.#nexusConfig.dsoConfig?.sleepDurationMs || this.#defaultSleepDurationMs);
                devErrorHandler(`[DSO] ${message}`, new Error(message));
                return { response: null, error: new Error(message), success: false, fallbackPath, providerUsed: 'DSO', modelUsed: 'NoCandidate' };
            }
            
            const { providerName, model, apiKey } = candidate;
            fallbackPath.push(`${providerName}:${model}`);

            // Estabilish pathway di bridge (akan membuat adapter jika belum ada)
            const adapter = this.#providerBridge.establishPathway(providerName, apiKey, model);

            if (!adapter) {
                Logger.error(`[DSO] Gagal mendapatkan adapter untuk ${providerName}.`);
                currentAttempts++;
                // Laporkan kunci ini sebagai bermasalah jika adapter tidak dapat dibuat
                this.#apiKeys.get(providerName)?.reportStatus(apiKey, 'OTHER');
                continue;
            }

            const startTime = Date.now();
            try {
                Logger.debug(`[DSO] Mencoba kandidat: ${providerName}:${model} (Upaya ${currentAttempts + 1}/${maxAttemptsPerRequest})`);
                
                // Panggilan ke adapter.process dengan payload lengkap
                const response = await adapter.process({ messages: messages, stream: false }); // Asumsi tidak streaming untuk generateText biasa
                
                const latency = Date.now() - startTime;
                this.#performanceTracker.log(providerName, model, apiKey, latency, true);
                Logger.info(`[DSO] Berhasil dari ${providerName}:${model} dalam ${latency}ms.`);
                
                return { response: response.content, providerUsed: providerName, modelUsed: model, latencyMs: latency, success: true, fallbackPath, qlcScore: candidate.qlcScore, rawResponse: response };

            } catch (error) {
                const latency = Date.now() - startTime;
                Logger.warn(`[DSO] Gagal dari ${providerName}:${model}: ${error.message}.`);
                this.#performanceTracker.log(providerName, model, apiKey, latency, false, error.message);
                
                // Laporkan status kunci yang bermasalah ke APIKeyManager
                this.#apiKeys.get(providerName)?.reportStatus(apiKey, error.message);

                currentAttempts++;
            }
        }
        
        const finalMessage = 'Semua upaya pada kandidat optimal gagal. AI akan tidur.';
        Logger.error(`[DSO] ${finalMessage}`);
        this.#isSleeping = true;
        this.#sleepUntil = Date.now() + (this.#nexusConfig.dsoConfig?.sleepDurationMs || this.#defaultSleepDurationMs);
        devErrorHandler(`[DSO] ${finalMessage}`, new Error(finalMessage));
        return { response: null, error: new Error(finalMessage), success: false, fallbackPath, providerUsed: 'DSO', modelUsed: 'FailedAllAttempts' };
    }

    /**
     * [METODE BARU] Menyediakan jalur komunikasi untuk status tidur.
     * @returns {boolean}
     */
    isSleeping() {
        return this.#isSleeping;
    }

    /**
     * [BARU] Mendapatkan metrik performa keseluruhan dari PerformanceTracker.
     * @returns {{avgLatency: number, successRate: number, totalCalls: number, confidence: number}}
     */
    getOverallPerformanceMetrics() {
        return this.#performanceTracker.getOverallMetrics(); // Asumsi PerformanceTracker punya metode ini
    }

    /**
     * [BARU] Mendapatkan semua instance APIKeyManager yang dikelola.
     * @returns {Map<string, APIKeyManager>}
     */
    getAPIKeyManagers() {
        return this.#apiKeys;
    }

    /**
     * [BARU] Memicu penerapan peluruhan pada Ideon dan manajemen rasa ingin tahu.
     */
    async applyIdeonDecayAndManageCuriosity() {
        const memory = this.#aiNexus.getMemory(); // Asumsi Nexus memiliki getMemory()
        if (memory && typeof memory.applyIdeonDecay === 'function') {
            await memory.applyIdeonDecay();
            // Setelah peluruhan, periksa kembali konsep dengan kepercayaan rendah untuk rasa ingin tahu
            const lowConfidenceTopics = memory.findLowConfidenceConcepts(this.#nexusConfig.navigatorConfig?.ideonConfidenceThreshold || 0.4);
            if (lowConfidenceTopics.length > 0) {
                // Di sini DSO bisa memicu niat 'KnowledgeExploration' pada Heart atau dirinya sendiri.
                Logger.debug(`[DSO] Setelah peluruhan, ditemukan ${lowConfidenceTopics.length} topik kepercayaan rendah. Siap memicu rasa ingin tahu.`);
                // Contoh: this.#aiNexus.getHeart()?.triggerCuriosity(lowConfidenceTopics[0].canonicalName);
            }
        }
    }
}