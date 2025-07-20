// File: metacognitive-nexus/src/core/AIProviderBridge.js
// (Tidak ada perubahan pada file AIProviderBridge.js)
import { OpenAIAdapter } from '../services/openAI.js';
import { GeminiAdapter } from '../services/gemini.js';
import { GroqAdapter } from '../services/groq.js';
import { Logger } from '../utils/Logger.js';

export class AIProviderBridge {
    #adapters = new Map();

    registerProvider(providerName, apiKey, model) {
        if (!apiKey) {
            Logger.warn(`[AIProviderBridge] API Key tidak tersedia untuk ${providerName}. Melewatkan pendaftaran.`);
            return;
        }
        let adapterInstance;
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
                Logger.error(`[AIProviderBridge] Penyedia AI '${providerName}' tidak didukung.`);
                return;
        }
        this.#adapters.set(providerName.toLowerCase(), adapterInstance);
        // Logger.info(`[AIProviderBridge] Penyedia '${providerName}' berhasil didaftarkan.`); // Terlalu banyak log, debug saja
    }

    getAdapter(providerName) {
        return this.#adapters.get(providerName.toLowerCase()) || null;
    }
}