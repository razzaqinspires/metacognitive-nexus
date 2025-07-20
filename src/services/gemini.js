// File: metacognitive-nexus/src/services/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '../utils/Logger.js';

export class GeminiAdapter {
    #client;
    #model;

    constructor(apiKey, model = 'gemini-1.5-pro-latest') {
        if (!apiKey) {
            throw new Error("[GeminiAdapter] API Key tidak disediakan.");
        }
        this.#client = new GoogleGenerativeAI(apiKey);
        this.#model = this.#client.getGenerativeModel({ model: model });
    }

    /**
     * Memproses muatan interaksi, dengan fokus pada kemampuan multimodal dan chat.
     * @param {object} payload - Obyek interaksi terpadu.
     * @returns {Promise<object>} Obyek hasil yang kaya.
     */
    async process(payload) {
        const { messages } = payload;
        
        // Gemini memerlukan format histori yang sedikit berbeda (model/user)
        const history = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
        
        const latestPrompt = messages[messages.length - 1].content;

        try {
            const chat = this.#model.startChat({ history });
            const result = await chat.sendMessage(latestPrompt);
            const response = result.response;
            const content = response.text();

            return {
                content: content,
                tool_calls: null, // Placeholder, implementasi tool calling Gemini bisa ditambahkan
                finish_reason: response.finishReason,
                usage: {
                    prompt_tokens: response.usageMetadata?.promptTokenCount,
                    completion_tokens: response.usageMetadata?.candidatesTokenCount,
                    total_tokens: response.usageMetadata?.totalTokenCount,
                }
            };
        } catch (error) {
            Logger.error(`[GeminiAdapter] Error saat memproses: ${error.message}`, error);
            this.#handleError(error);
        }
    }

    #handleError(error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('quota') || msg.includes('rate limit')) {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }
        if (msg.includes('api key not valid')) {
            throw new Error('INVALID_API_KEY');
        }
        if (msg.includes('400 bad request')) {
            // Seringkali ini karena konten yang diblokir
            throw new Error('CONTENT_FILTERED');
        }
        throw error;
    }
}