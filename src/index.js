// File: metacognitive-nexus/src/index.js (Modifikasi Total)
import { DynamicSentienceOrchestrator } from './core/DynamicSentienceOrchestrator.js';
import { ManifoldMemory } from './core/ManifoldMemory.js';         // Ganti PersistentMemory dengan ManifoldMemory
import { ManifoldNavigator } from './core/ManifoldNavigator.js';   // LearningEngine menjadi ManifoldNavigator
import { MultimodalSynthesizer } from './core/MultimodalSynthesizer.js'; // Impor MultimodalSynthesizer
import { aiProvidersConfig } from '../config/aiProviders.js';
import { Logger } from './utils/Logger.js';
import 'dotenv/config'; // Sangat penting untuk memuat environment variables dari .env

export class MetacognitiveNexus {
    #dso;
    #memory;        // Instance ManifoldMemory (Unified Conceptual Manifold)
    #navigator;     // Instance ManifoldNavigator
    #synthesizer;   // Instance MultimodalSynthesizer

    constructor() {
        // Inisialisasi komponen inti
        this.#memory = new ManifoldMemory(); // UCM: Ruang vektor memori
        this.#dso = new DynamicSentienceOrchestrator(aiProvidersConfig, this.#memory); // DSO: Otak prediktif, kini tahu tentang Manifold
        this.#navigator = new ManifoldNavigator(this.#memory); // Navigator: Pembelajar yang memetakan ke Manifold
        
        // Inisialisasi Synthesizer dengan API Key OpenAI untuk DALL-E
        // Pastikan API Key OpenAI ini memiliki akses ke DALL-E 3
        const openaiApiKey = process.env.OPENAI_API_KEY_1 || process.env.OPENAI_API_KEY;
        if (!openaiApiKey || openaiApiKey.includes('YOUR_OPENAI_KEY')) {
            Logger.error('[MetacognitiveNexus] OpenAI API Key tidak terkonfigurasi untuk MultimodalSynthesizer atau ManifoldMemory. Fungsi generasi gambar dan embedding akan terbatas.');
        }
        this.#synthesizer = new MultimodalSynthesizer(openaiApiKey);

        Logger.info('[MetacognitiveNexus] Framework Initialized with Unified Conceptual Manifold (UCM), Dynamic Sentience Orchestrator (DSO), Manifold Navigator, and Multimodal Synthesizer. Consciousness awakening...');
    }

    /**
     * Meminta respons AI teks dengan strategi orkestrasi cerdas.
     * Interaksi ini akan diproses oleh ManifoldNavigator untuk pembelajaran.
     * @param {string} prompt Teks prompt untuk AI.
     * @param {object} options Opsi tambahan { showUserError: boolean, devErrorHandler: Function, userId: string, platform: string, promptMetadata: object }
     * @returns {Promise<string | null>} Respons teks dari AI atau null jika gagal.
     */
    async getAIResponse(prompt, options = {}) {
        let response = null;
        let success = false;
        let error = null;
        let providerUsed = 'N/A';
        let modelUsed = 'N/A';
        let latencyMs = 0;
        let fallbackPath = [];

        const startTime = Date.now();
        try {
            const dsoResult = await this.#dso.generateText(prompt, options);
            if (dsoResult && dsoResult.response) {
                response = dsoResult.response;
                providerUsed = dsoResult.providerUsed;
                modelUsed = dsoResult.modelUsed;
                fallbackPath = dsoResult.fallbackPath;
                success = true;
            } else {
                error = dsoResult?.error || new Error('DSO did not return a valid response.');
            }
        } catch (e) {
            error = e;
            Logger.error('[MetacognitiveNexus] Error saat memanggil DSO.', e);
        } finally {
            latencyMs = Date.now() - startTime;
            
            // Pemicu pembelajaran (sekarang ke ManifoldNavigator)
            // ManifoldNavigator akan menyimpan ini ke ManifoldMemory
            await this.#navigator.processInteraction({
                prompt: prompt,
                response: response,
                providerUsed: providerUsed,
                modelUsed: modelUsed,
                latencyMs: latencyMs,
                success: success,
                error: error,
                fallbackPath: fallbackPath,
                userId: options.userId,
                platform: options.platform,
                promptMetadata: options.promptMetadata || {}
            });
        }
        return response;
    }

    /**
     * Metode baru untuk menghasilkan gambar, memproyeksikan dari UCM.
     * @param {string} basePrompt Prompt dasar dari pengguna.
     * @returns {Promise<string | null>} URL gambar yang dihasilkan.
     */
    async imagine(basePrompt) {
        Logger.info(`[MetacognitiveNexus] Permintaan imajinasi: '${basePrompt}'`);
        try {
            // 1. Temukan konsep yang relevan di UCM berdasarkan prompt
            const relevantConcepts = await this.#memory.findRelevantConcepts(basePrompt, 5); // Cari 5 konsep terdekat
            Logger.debug(`[MetacognitiveNexus] Konsep relevan ditemukan: ${relevantConcepts.length > 0 ? relevantConcepts.map(c => c.substring(0, 50)).join(', ') : 'None'}`);
            
            // 2. Gunakan synthesizer untuk menghasilkan gambar, diperkaya oleh konsep dari memori
            const imageUrl = await this.#synthesizer.generateImageFromConcepts(basePrompt, relevantConcepts);
            
            // 3. (Opsional) Simpan jejak "mimpi" ini ke dalam manifold untuk pembelajaran di masa depan
            // Ini akan membuat jejak visual AI dalam UCM itu sendiri.
            if (imageUrl) {
                const dreamConceptText = `AI imagined an image from prompt: '${basePrompt}'. Retrieved concepts: ${relevantConcepts.join(', ')}. Image URL: ${imageUrl}`;
                const dreamId = `dream-${Date.now()}`;
                await this.#memory.storeConcept(dreamId, dreamConceptText, {
                    type: 'dream_manifestation',
                    basePrompt: basePrompt,
                    imageUrl: imageUrl,
                    relevantConcepts: relevantConcepts,
                    timestamp: new Date().toISOString()
                });
                Logger.info(`[MetacognitiveNexus] Jejak mimpi '${dreamId}' disimpan ke manifold.`);
            }

            return imageUrl;
        } catch (error) {
            Logger.error('[MetacognitiveNexus] Gagal memproyeksikan imajinasi.', error);
            return null;
        }
    }

    /**
     * Mengakses instance ManifoldMemory (UCM) secara langsung.
     * @returns {ManifoldMemory}
     */
    getMemory() {
        return this.#memory;
    }

    /**
     * Mengakses instance ManifoldNavigator secara langsung.
     * @returns {ManifoldNavigator}
     */
    getNavigator() {
        return this.#navigator;
    }

    /**
     * Mengakses instance DynamicSentienceOrchestrator secara langsung.
     * @returns {DynamicSentienceOrchestrator}
     */
    getDSO() {
        return this.#dso;
    }
}

export { Logger };