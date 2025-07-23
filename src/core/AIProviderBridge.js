// File: metacognitive-nexus/src/core/AIProviderBridge.js (Versi Singleton Definitif)

import { OpenAIAdapter } from '../services/openAI.js';
import { GeminiAdapter } from '../services/gemini.js';
import { GroqAdapter } from '../services/groq.js';
import { Logger } from '../utils/Logger.js';

export class AIProviderBridge {
    static #instance;
    #plexus = new Map(); // Map: pathwayKey (e.g., 'openai:gpt-4o') -> { instance: Adapter, lastUsed: Date }
    #pruningInterval;

    constructor() {
        if (AIProviderBridge.#instance) {
            // Mencegah instansiasi ganda, mengembalikan instance yang sudah ada.
            return AIProviderBridge.#instance;
        }

        const PRUNING_INTERVAL_MS = 10 * 60 * 1000; // Pruning setiap 10 menit
        this.#pruningInterval = setInterval(() => this.#pruneDormantPathways(), PRUNING_INTERVAL_MS);
        Logger.info('[NeuralPlexus] Active Neural Plexus is online. Initiating self-maintenance cycles.');
        
        AIProviderBridge.#instance = this;
    }

    /**
     * Metode statis untuk mendapatkan satu-satunya instance dari Bridge.
     * @returns {AIProviderBridge}
     */
    static getInstance() {
        if (!this.#instance) {
            this.#instance = new AIProviderBridge();
        }
        return this.#instance;
    }

    /**
     * Membangun atau mendapatkan kembali jalur komunikasi ke provider AI.
     * @param {string} providerName Nama provider (e.g., 'openai').
     * @param {string} apiKey Kunci API yang akan digunakan.
     * @param {string} model Model spesifik yang akan digunakan.
     * @returns {object | null} Instance adapter atau null jika gagal.
     */
    establishPathway(providerName, apiKey, model) {
        if (!apiKey || !providerName || !model) {
            Logger.warn(`[NeuralPlexus] Informasi pathway tidak lengkap. Provider: ${providerName}, Model: ${model}.`);
            return null;
        }

        const pathwayKey = `${providerName.toLowerCase()}:${model}`;
        const existingPathway = this.#plexus.get(pathwayKey);

        if (existingPathway) {
            existingPathway.lastUsed = Date.now();
            Logger.debug(`[NeuralPlexus] Menggunakan jalur yang sudah ada untuk ${pathwayKey}.`);
            return existingPathway.instance;
        }

        let adapterInstance;
        try {
            switch (providerName.toLowerCase()) {
                case 'openai':
                    adapterInstance = new OpenAIAdapter(apiKey, model);
                    break;
                case 'gemini':
                    adapterInstance = new GeminiAdapter(apiKey, model);
                    break;
                case 'groq':
                    adapterInstance = new GroqAdapter(apiKey, model);
                    break;
                default:
                    Logger.error(`[NeuralPlexus] Tipe pathway '${providerName}' tidak didukung.`);
                    return null;
            }
        } catch (error) {
            Logger.error(`[NeuralPlexus] Gagal membuat instance adapter untuk ${pathwayKey}: ${error.message}`, error);
            return null;
        }

        this.#plexus.set(pathwayKey, {
            instance: adapterInstance,
            lastUsed: Date.now(),
        });
        Logger.info(`[NeuralPlexus] Jalur baru ke '${pathwayKey}' dibangun.`);

        return adapterInstance;
    }

    /**
     * Memangkas jalur komunikasi yang tidak digunakan untuk menghemat sumber daya.
     * Ini adalah mekanisme pemeliharaan diri (self-maintenance).
     * @private
     */
    #pruneDormantPathways() {
        const now = Date.now();
        const DORMANT_THRESHOLD_MS = 15 * 60 * 1000; // Dianggap tidak aktif setelah 15 menit
        let prunedCount = 0;

        for (const [key, pathway] of this.#plexus.entries()) {
            if (now - pathway.lastUsed > DORMANT_THRESHOLD_MS) {
                this.#plexus.delete(key);
                prunedCount++;
                Logger.debug(`[NeuralPlexus] Memangkas jalur dorman: ${key}.`);
            }
        }
        if (prunedCount > 0) {
            Logger.info(`[NeuralPlexus] Siklus pruning selesai. ${prunedCount} jalur dipangkas.`);
        }
    }

    /**
     * Menghentikan semua siklus latar belakang.
     */
    shutdown() {
        clearInterval(this.#pruningInterval);
        Logger.info('[NeuralPlexus] Siklus pemeliharaan diri dihentikan.');
    }
}