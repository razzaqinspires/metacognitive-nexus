// File: metacognitive-nexus/src/services/openAI.js
import OpenAI from 'openai';
import { Logger } from '../utils/Logger.js';

export class OpenAIAdapter {
    #client;
    #model;

    constructor(apiKey, model = 'gpt-4o') {
        if (!apiKey) {
            throw new Error("[OpenAIAdapter] API Key tidak disediakan.");
        }
        this.#client = new OpenAI({ apiKey });
        this.#model = model;
        // Logger tidak lagi dipanggil di sini untuk mengurangi kebisingan log. Inisialisasi harus senyap.
    }

    /**
     * Memproses muatan interaksi yang kaya, mendukung chat, tool use, dan streaming.
     * @param {object} payload - Obyek interaksi terpadu.
     * @param {Array<object>} payload.messages - Riwayat percakapan [{role, content}].
     * @param {Array<object>} [payload.tools] - (Opsional) Definisi fungsi yang bisa dipanggil.
     * @param {boolean} [payload.stream] - (Opsional) Apakah akan mengaktifkan streaming.
     * @returns {Promise<object>} Obyek hasil yang kaya (content, tool_calls, usage).
     */
    async process(payload) {
        const { messages, tools, stream = false } = payload;
        const requestBody = {
            model: this.#model,
            messages: messages,
            tools: tools,
            stream: stream,
        };

        try {
            if (stream) {
                const streamResponse = await this.#client.chat.completions.create(requestBody);
                // Untuk streaming, kita kembalikan iteratornya agar bisa di-handle oleh pemanggil.
                // Ini adalah implementasi tingkat lanjut yang memungkinkan real-time response.
                Logger.debug(`[OpenAIAdapter] Streaming dimulai untuk model ${this.#model}.`);
                return { stream: streamResponse, type: 'STREAM' };
            }

            const response = await this.#client.chat.completions.create(requestBody);
            const choice = response.choices[0];

            return {
                content: choice.message.content,
                tool_calls: choice.message.tool_calls || null,
                finish_reason: choice.finish_reason,
                usage: response.usage // Mengembalikan info token usage
            };

        } catch (error) {
            Logger.error(`[OpenAIAdapter] Error saat memproses: ${error.message}`, error);
            this.#handleError(error); // Melempar error yang terstandarisasi
        }
    }

    #handleError(error) {
        if (error instanceof OpenAI.APIError) {
            if (error.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
            if (error.status === 401) throw new Error('INVALID_API_KEY');
            if (error.status === 400 && error.code === 'invalid_api_key') throw new Error('INVALID_API_KEY');
            if (error.code === 'context_length_exceeded') throw new Error('CONTEXT_LENGTH_EXCEEDED');
        }
        throw error;
    }
}