// File: metacognitive-nexus/src/services/openAI.js
// (Tidak ada perubahan pada file openAI.js)
import OpenAI from 'openai';
import { Logger } from '../utils/Logger.js';

export class OpenAIAdapter {
    #client;
    #model;

    constructor(apiKey, model = 'gpt-3.5-turbo') {
        if (!apiKey) {
            throw new Error("[OpenAIAdapter] API Key tidak disediakan.");
        }
        this.#client = new OpenAI({ apiKey });
        this.#model = model;
        Logger.info(`[OpenAIAdapter] OpenAI client diinisialisasi dengan model: ${this.#model}`);
    }

    async generateText(prompt) {
        try {
            const response = await this.#client.chat.completions.create({
                model: this.#model,
                messages: [{ role: 'user', content: prompt }],
            });
            return response.choices[0].message.content;
        } catch (error) {
            Logger.error(`[OpenAIAdapter] Error saat generate text: ${error.message}`, error);
            if (error.response?.status === 429) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            } else if (error.message.includes('Incorrect API key')) {
                throw new Error('INVALID_API_KEY');
            }
            throw error;
        }
    }
}