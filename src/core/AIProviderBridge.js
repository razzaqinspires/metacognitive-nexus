// File: metacognitive-nexus/src/core/AIProviderBridge.js (Versi Singleton Definitif)

import { OpenAIAdapter } from '../services/openAI.js';
import { GeminiAdapter } from '../services/gemini.js';
import { GroqAdapter } from '../services/groq.js';
import { Logger } from '../utils/Logger.js';

export class AIProviderBridge {
    static #instance;
    #plexus = new Map();
    #pruningInterval;

    constructor() {
        if (AIProviderBridge.#instance) {
            // Mencegah instansiasi ganda, mengembalikan instance yang sudah ada.
            return AIProviderBridge.#instance;
        }

        const PRUNING_INTERVAL_MS = 10 * 60 * 1000;
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

    establishPathway(providerName, apiKey, model) {
        if (!apiKey || !providerName || !model) {
            Logger.warn(`[NeuralPlexus] Informasi pathway tidak lengkap.`);
            return null;
        }

        const pathwayKey = `${providerName.toLowerCase()}:${model}`;
        const existingPathway = this.#plexus.get(pathwayKey);

        if (existingPathway) {
            existingPathway.lastUsed = Date.now();
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
            Logger.error(`[NeuralPlexus] Gagal membuat instance adapter untuk ${pathwayKey}`, error);
            return null;
        }

        this.#plexus.set(pathwayKey, {
            instance: adapterInstance,
            lastUsed: Date.now(),
        });

        return adapterInstance;
    }

    #pruneDormantPathways() {
        const now = Date.now();
        const DORMANT_THRESHOLD_MS = 15 * 60 * 1000;
        let prunedCount = 0;

        for (const [key, pathway] of this.#plexus.entries()) {
            if (now - pathway.lastUsed > DORMANT_THRESHOLD_MS) {
                this.#plexus.delete(key);
                prunedCount++;
            }
        }
        if (prunedCount > 0) {
            Logger.debug(`[NeuralPlexus] Siklus pruning selesai. ${prunedCount} jalur dipangkas.`);
        }
    }

    shutdown() {
        clearInterval(this.#pruningInterval);
        Logger.info('[NeuralPlexus] Siklus pemeliharaan diri dihentikan.');
    }
}