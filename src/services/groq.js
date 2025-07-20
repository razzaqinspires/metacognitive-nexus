// File: metacognitive-nexus/src/services/groq.js
// (Tidak ada perubahan pada file groq.js)
import Groq from 'groq-sdk';
import { Logger } from '../utils/Logger.js';

export class GroqAdapter {
    #client;
    #model;

    constructor(apiKey, model = 'llama3-8b-8192') {
        if (!apiKey) {
            throw new Error("[GroqAdapter] API Key tidak disediakan.");
        }
        this.#client = new Groq({ apiKey });
        this.#model = model;
        Logger.info(`[GroqAdapter] Groq client diinisialisasi dengan model: ${this.#model}`);
    }

    async generateText(prompt) {
        try {
            const response = await this.#client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.#model,
            });
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            Logger.error(`[GroqAdapter] Error saat generate text: ${error.message}`, error);
            if (error.message.includes('rate limit exceeded')) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            } else if (error.message.includes('authentication failed')) {
                throw new Error('INVALID_API_KEY');
            }
            throw error;
        }
    }
}