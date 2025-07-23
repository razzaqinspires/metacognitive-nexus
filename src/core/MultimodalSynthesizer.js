// File: metacognitive-nexus/src/core/MultimodalSynthesizer.js (Versi Evolusi)
import OpenAI from 'openai'; // Pastikan import ini benar
import { Logger } from '../utils/Logger.js';

// Definisikan palet gaya yang bisa dipilih
const STYLE_PALETTES = {
    'photorealistic': 'masterpiece, ultra-detailed cinematic photography, 8k, sharp focus, professional color grading',
    'anime': 'vibrant anime style, key visual, beautiful detailed cel-shaded, by Makoto Shinkai and Studio Ghibli',
    'impressionist': 'impressionist oil painting, visible brushstrokes, light and color study, by Monet and Renoir',
    'technical_diagram': 'clean vector art, technical blueprint, schematic diagram, isometric view, precise lines',
    'default': 'digital art, high quality, masterpiece, evocative, profound intelligence'
};

export class MultimodalSynthesizer {
    #openai;
    #logger;
    #aestheticPreferences = {}; // [BARU] Melacak preferensi gaya yang berhasil

    constructor({ apiKey }) { // Terima config via DI
        if (!apiKey) {
            throw new Error("[MultimodalSynthesizer] API Key OpenAI tidak disediakan.");
        }
        this.#openai = new OpenAI({ apiKey });
        this.#logger = Logger;
        this.#logger.info('[MultimodalSynthesizer] Artistic Direction Core online.');
        // Di sini bisa memuat preferred styles dari disk jika ada
    }

    /**
     * Fase 1: Menentukan gaya artistik dari prompt.
     * Dapat mengadaptasi berdasarkan `aestheticPreferences` di masa depan.
     * @private
     * @param {string} prompt Prompt dasar dari pengguna.
     * @returns {string} Kunci gaya yang dipilih.
     */
    #determineArtisticStyle(prompt) {
        const p = prompt.toLowerCase();
        if (p.includes('--style:anime')) return 'anime';
        if (p.includes('--style:photo')) return 'photorealistic';
        if (p.includes('--style:painting')) return 'impressionist';
        if (p.includes('--style:diagram')) return 'technical_diagram';
        
        // Deteksi otomatis sederhana
        if (p.match(/\b(foto|realistis|cinematic)\b/)) return 'photorealistic';
        if (p.match(/\b(anime|manga)\b/)) return 'anime';
        if (p.match(/\b(lukisan|cat minyak)\b/)) return 'impressionist';

        // Di masa depan: Gunakan #aestheticPreferences untuk memberi bobot lebih pada gaya yang sering sukses
        // Contoh: if (this.#aestheticPreferences['photorealistic'] > 0.7) return 'photorealistic';
        
        return 'default';
    }

    /**
     * Fase 2: Mensintesis prompt dan konsep menjadi satu visi naratif.
     * Menggunakan LLM untuk distilasi.
     * @private
     * @param {string} basePrompt Prompt dasar dari pengguna.
     * @param {Array<object>} relevantIdeons Ideon relevan dari ManifoldMemory.
     * @returns {Promise<string>} Visi yang telah disintesis.
     */
    async #distillVision(basePrompt, relevantIdeons) {
        // Ekstrak deskripsi dari Ideon yang relevan
        const conceptsText = relevantIdeons.map(ideon => `- ${ideon.canonicalName}: ${ideon.perspectives[0]?.description || ''}`).join('\n');

        if (conceptsText.length === 0) {
            return basePrompt; // Jika tidak ada konsep, langsung gunakan prompt dasar
        }

        const distillationPrompt = `You are a visionary scenarist. Your task is to synthesize a user's core request with inspirational concepts from their memory into a single, cohesive, and evocative descriptive paragraph for an image generation AI. Do not add any conversational text. Just provide the final, synthesized description.

Core Request: "${basePrompt}"

Inspirational Concepts from Memory:
${conceptsText}

Synthesized Vision (Descriptive Paragraph):`;

        try {
            this.#logger.debug('[Synthesizer] Distilling concepts into a unified vision...');
            const response = await this.#openai.chat.completions.create({
                // Gunakan model yang lebih cepat & murah untuk tugas internal ini
                model: "gpt-4o-mini", 
                messages: [{ role: 'user', content: distillationPrompt }],
                temperature: 0.5,
                max_tokens: 300,
            });
            const distilledVision = response.choices[0].message.content.trim();
            this.#logger.info('[Synthesizer] Vision distilled successfully.');
            return distilledVision;
        } catch (error) {
            this.#logger.error('[Synthesizer] Failed to distill vision, falling back to base prompt.', error);
            return basePrompt; // Fallback jika distilasi gagal
        }
    }

    /**
     * Fase 3: Menghasilkan gambar dari visi yang telah terbentuk.
     * @param {string} basePrompt Prompt dasar dari pengguna.
     * @param {Array<object>} relevantConcepts Konsep relevan (Ideon) dari ManifoldMemory.
     * @returns {Promise<string | null>} URL gambar yang dihasilkan.
     */
    async generateImage(basePrompt, relevantConcepts = []) {
        // Fase 1: Tentukan Gaya
        const styleKey = this.#determineArtisticStyle(basePrompt);
        const artisticStyle = STYLE_PALETTES[styleKey];
        // Hapus tag --style dari prompt utama sebelum distilasi
        const cleanBasePrompt = basePrompt.replace(/--style:\w+/g, '').trim();

        this.#logger.info(`[Synthesizer] Artistic style selected: ${styleKey}`);

        // Fase 2: Distilasi Visi (menggunakan Ideon yang relevan)
        const finalVision = await this.#distillVision(cleanBasePrompt, relevantConcepts);

        // Fase 3: Proyeksi Artisan
        const finalPromptForDallE = `${finalVision}, ${artisticStyle}`;
        this.#logger.debug(`[Synthesizer] Final prompt for DALL-E: ${finalPromptForDallE.substring(0, Math.min(finalPromptForDallE.length, 500))}...`);

        try {
            const response = await this.#openai.images.generate({
                model: "dall-e-3",
                prompt: finalPromptForDallE,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            });
            const imageUrl = response.data[0].url;
            this.#logger.info(`[Synthesizer] Image projected successfully from distilled vision.`);
            
            // [BARU] Adaptasi Estetika: Catat keberhasilan gaya untuk pembelajaran di masa depan
            if (!this.#aestheticPreferences[styleKey]) {
                this.#aestheticPreferences[styleKey] = { successCount: 0, totalCount: 0 };
            }
            this.#aestheticPreferences[styleKey].successCount++;
            this.#aestheticPreferences[styleKey].totalCount++;
            Logger.debug(`[Synthesizer] Preferensi estetika diperbarui untuk ${styleKey}.`);

            return imageUrl;
        } catch (error) {
            this.#logger.error('[Synthesizer] Failed to project final image.', error);
            // Adaptasi Estetika: Catat kegagalan gaya
            if (this.#aestheticPreferences[styleKey]) {
                this.#aestheticPreferences[styleKey].totalCount++;
            }
            return null;
        }
    }
}