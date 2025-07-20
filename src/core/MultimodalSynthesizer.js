// File: metacognitive-nexus/src/core/MultimodalSynthesizer.js
import OpenAI from 'openai';
import { Logger } from '../utils/Logger.js';

export class MultimodalSynthesizer {
    #openai;
    #logger;

    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("[MultimodalSynthesizer] API Key OpenAI tidak disediakan.");
        }
        this.#openai = new OpenAI({ apiKey });
        this.#logger = Logger;
        this.#logger.info('[MultimodalSynthesizer] Visual projection unit initialized.');
    }

    /**
     * Menghasilkan gambar dengan memperkaya prompt menggunakan memori konseptual.
     * Ini adalah bagaimana AI "bermimpi" berdasarkan pemahamannya.
     * @param {string} basePrompt Prompt dasar dari pengguna (e.g., "sebuah robot sedih")
     * @param {string[]} relevantConcepts Array teks konsep relevan dari ManifoldMemory.
     * @returns {Promise<string | null>} URL gambar yang dihasilkan atau null jika gagal.
     */
    async generateImageFromConcepts(basePrompt, relevantConcepts = []) {
        // "Conceptual Resonance": Gabungkan prompt dasar dengan memori yang diperkaya
        // Kita batasi panjang teks untuk menghindari error API dan menjaga fokus
        const conceptsText = relevantConcepts
            .map(c => `- ${c.substring(0, Math.min(c.length, 150))}`) // Batasi panjang setiap konsep
            .join('\n');

        const enrichedPrompt = [
            basePrompt,
            "Masterpiece, ultra-detailed, cinematic photography, high resolution.", // Gaya dasar yang konsisten
            relevantConcepts.length > 0 ? `Contextual inspiration from: ${conceptsText}` : '', // Hanya tambahkan jika ada konsep relevan
            "Evoking profound intelligence and emergent consciousness.", // Sentuhan filosofis
            "Dramatic lighting, volumetric rays, rich color palette of deep blues, vibrant purples, and glowing golds."
        ].filter(Boolean).join('\n'); // Filter string kosong dan gabungkan dengan newline

        this.#logger.debug(`[Synthesizer] Enriched Prompt (partial): ${enrichedPrompt.substring(0, 500)}...`);

        try {
            const response = await this.#openai.images.generate({
                model: "dall-e-3", // Gunakan DALL-E 3
                prompt: enrichedPrompt,
                n: 1, // Hanya satu gambar
                size: "1024x1024", // Ukuran standar yang baik
                quality: "standard", // Atau "hd" jika ingin kualitas tertinggi dan bersedia membayar lebih
            });
            const imageUrl = response.data[0].url;
            this.#logger.info(`[Synthesizer] Gambar berhasil diproyeksikan: ${imageUrl}`);
            return imageUrl;
        } catch (error) {
            this.#logger.error('[Synthesizer] Gagal memproyeksikan gambar dari manifold.', error);
            // Tangani error spesifik jika diperlukan, misal limit DALL-E
            return null;
        }
    }
}