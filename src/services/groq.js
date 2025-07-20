// File: metacognitive-nexus/src/services/groq.js
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
    }

    /**
     * Memproses muatan interaksi, dioptimalkan untuk respons chat berkecepatan tinggi.
     * @param {object} payload - Obyek interaksi terpadu.
     * @returns {Promise<object>} Obyek hasil yang kaya.
     */
    async process(payload) {
        const { messages, stream = false } = payload;
        const requestBody = {
            model: this.#model,
            messages: messages,
            stream: stream,
        };

        try {
            if (stream) {
                const streamResponse = await this.#client.chat.completions.create(requestBody);
                Logger.debug(`[GroqAdapter] Streaming dimulai untuk model ${this.#model}.`);
                return { stream: streamResponse, type: 'STREAM' };
            }
            
            const response = await this.#client.chat.completions.create(requestBody);
            const choice = response.choices[0];

            return {
                content: choice.message.content,
                tool_calls: null, // Groq saat ini tidak fokus pada tool use
                finish_reason: choice.finish_reason,
                usage: response.usage
            };
        } catch (error) {
            Logger.error(`[GroqAdapter] Error saat memproses: ${error.message}`, error);
            this.#handleError(error);
        }
    }

    #handleError(error) {
        if (error instanceof Groq.APIError) {
            if (error.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
            if (error.status === 401 || error.status === 403) throw new Error('INVALID_API_KEY');
        }
        throw error;
    }
}