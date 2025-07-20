// File: metacognitive-nexus/src/services/gemini.js
// (Tidak ada perubahan pada file gemini.js)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '../utils/Logger.js';

export class GeminiAdapter {
    #client;
    #model;

    constructor(apiKey, model = 'gemini-pro') {
        if (!apiKey) {
            throw new Error("[GeminiAdapter] API Key tidak disediakan.");
        }
        this.#client = new GoogleGenerativeAI(apiKey);
        this.#model = model;
        Logger.info(`[GeminiAdapter] Gemini client diinisialisasi dengan model: ${this.#model}`);
    }

    async generateText(prompt) {
        try {
            const model = this.#client.getGenerativeModel({ model: this.#model });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            Logger.error(`[GeminiAdapter] Error saat generate text: ${error.message}`, error);
            if (error.message.includes('quota exceeded')) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            } else if (error.message.includes('API key not valid')) {
                throw new Error('INVALID_API_KEY');
            }
            throw error;
        }
    }
}