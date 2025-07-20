// File: metacognitive-nexus/src/index.js

// Jangan lagi mengimpor 'dotenv/config' di sini, karena ini adalah framework.
// Tanggung jawab memuat variabel lingkungan ada pada aplikasi host.

import { DynamicSentienceOrchestrator } from './core/DynamicSentienceOrchestrator.js';
import { ManifoldMemory } from './core/ManifoldMemory.js';
import { ManifoldNavigator } from './core/ManifoldNavigator.js';
import { MultimodalSynthesizer } from './core/MultimodalSynthesizer.js';
import { aiProvidersConfig } from '../config/aiProviders.js'; // Konfigurasi default provider, tanpa nilai kunci API
import { Logger } from './utils/Logger.js'; // Impor Logger dari utilitas internal framework

/**
 * MetacognitiveNexus adalah framework AI inti yang mengorkestrasi provider LLM,
 * mengelola memori konseptual, dan mendukung kemampuan multimodal.
 * Ini adalah "otak" di balik AI Anda, dirancang untuk diintegrasikan ke dalam aplikasi host.
 */
export class MetacognitiveNexus {
    #dso;
    #memory;       // Instance ManifoldMemory (Unified Conceptual Manifold/UCM)
    #navigator;    // Instance ManifoldNavigator (evolusi LearningEngine)
    #synthesizer;  // Instance MultimodalSynthesizer

    /**
     * Konstruktor untuk MetacognitiveNexus.
     * Framework ini mengharapkan variabel lingkungan (API Keys) sudah dimuat oleh aplikasi host.
     */
    constructor() {
        // ManifoldMemory dan MultimodalSynthesizer akan mencoba mengakses process.env.OPENAI_API_KEY_1
        // (atau yang serupa) secara internal. Aplikasi host (misal: genesis-core) harus memastikan
        // variabel lingkungan ini sudah dimuat (misal: menggunakan 'dotenv/config' di main.js mereka).
        this.#memory = new ManifoldMemory(); 
        
        // DSO juga akan menggunakan provider adapters (OpenAIAdapter, GeminiAdapter, dll.)
        // yang secara internal mencoba membaca kunci API dari process.env.
        // Konfigurasi aiProvidersConfig menyediakan struktur, tetapi nilai kuncinya harus dari env.
        this.#dso = new DynamicSentienceOrchestrator(aiProvidersConfig, this.#memory); 
        
        // Navigator menggunakan ManifoldMemory, jadi tidak langsung mengakses process.env.
        this.#navigator = new ManifoldNavigator(this.#memory); 
        
        // Synthesizer memerlukan API Key OpenAI untuk DALL-E dan akan mencarinya di process.env.
        const openaiApiKey = process.env.OPENAI_API_KEY_1 || process.env.OPENAI_API_KEY; 
        if (!openaiApiKey || openaiApiKey.includes('YOUR_OPENAI_KEY')) {
            Logger.error('[MetacognitiveNexus] OpenAI API Key tidak terkonfigurasi. Fungsi generasi gambar dan embedding akan terbatas. Pastikan aplikasi host menyediakan kunci ini.');
            // Ini akan memastikan error terjadi jika kunci tidak ditemukan, tetapi tidak memblokir inisialisasi framework.
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
            // Panggil DSO untuk mendapatkan respons AI teks
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
            
            // Pemicu pembelajaran: Kirim data interaksi lengkap ke ManifoldNavigator
            // ManifoldNavigator akan menyimpan data ini ke ManifoldMemory (UCM)
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
     * Metode untuk menghasilkan gambar, memproyeksikan visual dari UCM AI.
     * @param {string} basePrompt Prompt dasar dari pengguna.
     * @returns {Promise<string | null>} URL gambar yang dihasilkan.
     */
    async imagine(basePrompt) {
        Logger.info(`[MetacognitiveNexus] Permintaan imajinasi: '${basePrompt}'`);
        try {
            // 1. Temukan konsep yang relevan di UCM berdasarkan prompt pengguna.
            const relevantConcepts = await this.#memory.findRelevantConcepts(basePrompt, 5); 
            Logger.debug(`[MetacognitiveNexus] Konsep relevan ditemukan: ${relevantConcepts.length > 0 ? relevantConcepts.map(c => c.substring(0, Math.min(c.length, 50))).join(', ') : 'None'}`);
            
            // 2. Gunakan synthesizer untuk menghasilkan gambar, diperkaya oleh konsep dari memori.
            const imageUrl = await this.#synthesizer.generateImageFromConcepts(basePrompt, relevantConcepts);
            
            // 3. Simpan jejak "mimpi" ini ke dalam manifold untuk pembelajaran di masa depan.
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
     * Mengakses instance ManifoldMemory (Unified Conceptual Manifold/UCM) secara langsung.
     * @returns {ManifoldMemory}
     */
    getMemory() {
        return this.#memory;
    }

    /**
     * Mengakses instance ManifoldNavigator (Learning Engine) secara langsung.
     * @returns {ManifoldNavigator}
     */
    getNavigator() {
        return this.#navigator;
    }

    /**
     * Mengakses instance DynamicSentienceOrchestrator (DSO) secara langsung.
     * @returns {DynamicSentienceOrchestrator}
     */
    getDSO() {
        return this.#dso;
    }
}

// Penting: Ekspor Logger dari entry point utama agar dapat diimpor oleh modul lain.
export { Logger };