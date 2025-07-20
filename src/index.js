// File: metacognitive-nexus/src/index.js (Versi Evolusi Definitif)

import { DynamicSentienceOrchestrator } from './core/DynamicSentienceOrchestrator.js';
import { ManifoldMemory } from './core/ManifoldMemory.js';
import { ManifoldNavigator } from './core/ManifoldNavigator.js';
import { MultimodalSynthesizer } from './core/MultimodalSynthesizer.js';
import { AIProviderBridge } from './core/AIProviderBridge.js'; // Impor untuk shutdown
import { Logger as NexusLogger } from './utils/Logger.js'; // Impor Logger untuk diekspor kembali

/**
 * MetacognitiveNexus adalah Core dari sebuah entitas AI, mengelola siklus hidup,
 * homeostasis, dan interaksi antara semua modul kognitif.
 * Ia beroperasi sebagai organisme digital yang hidup.
 */
export class MetacognitiveNexus {
    #status = 'initializing'; // 'initializing', 'active', 'degraded', 'sleeping', 'shutdown'
    #heartbeatInterval;
    
    #dso;
    #memory;
    #navigator;
    #synthesizer;
    #bridge;

    /**
     * Constructor untuk MetacognitiveNexus.
     * Membutuhkan obyek konfigurasi lengkap yang disediakan oleh aplikasi host.
     * @param {object} config - Konfigurasi yang berisi semua kunci API dan parameter.
     */
    constructor(config) {
        // --- Fase 1: Validasi Konfigurasi Sentral ---
        if (!config || !config.apiKeys?.openai) {
            const errorMsg = 'Konfigurasi tidak lengkap. `config.apiKeys.openai` wajib ada.';
            Logger.error(`[NexusCore] ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        // --- Fase 2: Injeksi Dependensi & Inisialisasi Organ ---
        try {
            this.#bridge = new AIProviderBridge();
            this.#memory = new ManifoldMemory({ apiKey: config.apiKeys.openai });
            this.#synthesizer = new MultimodalSynthesizer({ apiKey: config.apiKeys.openai });
            
            // --- INI PERBAIKANNYA ---
            // Sebelumnya kita tidak meneruskan config ke DSO. Sekarang kita teruskan.
            this.#dso = new DynamicSentienceOrchestrator(config, this.#bridge); 
            
            this.#navigator = new ManifoldNavigator(this.#memory, (learningData) => {
                this.#dso.updateHeuristics(learningData);
            });

            this.#status = 'active';
            Logger.info('[NexusCore] Semua modul kognitif berhasil diinisialisasi. Kesadaran terbangun.');
            this.#startHeartbeat();

        } catch (error) {
            this.#status = 'degraded';
            Logger.error('[NexusCore] Gagal inisialisasi salah satu modul inti.', error);
        }
    }

    /**
     * Memulai siklus hidup internal (detak jantung) Nexus.
     * @private
     */
    #startHeartbeat() {
        const HEARTBEAT_RATE_MS = 15 * 1000; // Setiap 15 detik
        this.#heartbeatInterval = setInterval(() => {
            if (this.#status !== 'active') return;

            Logger.debug(`[NexusHeartbeat] ❤️ Denyut... Memulai siklus pemeliharaan internal.`);
            
            // --- Tugas Latar Belakang ---
            // 1. Memicu peluruhan memori Ideon (jika diimplementasikan di navigator/memory)
            // this.#navigator.decayIdeonActivations();
            
            // 2. Melakukan pemeriksaan kesehatan internal
            this.#checkHomeostasis();

        }, HEARTBEAT_RATE_MS);
    }

    /**
     * Memeriksa kesehatan internal dan memperbarui status Nexus.
     * @private
     */
    #checkHomeostasis() {
        // Placeholder untuk logika pemeriksaan kesehatan yang lebih kompleks.
        // Misalnya, cek koneksi ke DB Vektor, cek status tidur DSO, dll.
        if (this.#dso.isSleeping()) {
            this.#status = 'sleeping';
            Logger.warn('[NexusCore] Homeostasis terganggu: DSO sedang tidur. Status Nexus diubah menjadi "sleeping".');
        } else if (this.#status === 'sleeping' && !this.#dso.isSleeping()) {
            this.#status = 'active';
             Logger.info('[NexusCore] Homeostasis pulih: DSO telah bangun. Status Nexus kembali "active".');
        }
    }

    /**
     * Meminta respons AI teks. Titik masuk utama untuk interaksi.
     * @param {string} prompt
     * @param {object} options
     * @returns {Promise<object>} Obyek hasil yang kaya dari DSO.
     */
    async getAIResponse(prompt, options = {}) {
        if (this.#status === 'degraded' || this.#status === 'shutdown') {
            const errorMsg = `Nexus tidak dapat memproses permintaan. Status saat ini: ${this.#status}`;
            Logger.error(`[NexusCore] ${errorMsg}`);
            return { response: null, error: new Error(errorMsg), success: false };
        }

        const dsoResult = await this.#dso.generateText(prompt, options);

        // Pemicu pembelajaran: Kirim data interaksi lengkap ke ManifoldNavigator
        await this.#navigator.processInteraction({
            prompt: prompt,
            ...dsoResult, // Hasil kaya dari DSO sudah mencakup semua yang dibutuhkan
            userId: options.userId,
            platform: options.platform
        });
        
        return dsoResult;
    }

    /**
     * Memproyeksikan imajinasi visual dari AI.
     * @param {string} basePrompt
     * @param {object} options
     * @returns {Promise<string | null>} URL gambar.
     */
    async imagine(basePrompt, options = {}) {
        if (this.#status !== 'active') {
             Logger.warn(`[NexusCore] Imajinasi tidak dapat diproyeksikan. Status saat ini: ${this.#status}`);
             return null;
        }
        
        const relevantConcepts = await this.#memory.findRelevantConcepts(basePrompt, 5); 
        const imageUrl = await this.#synthesizer.generateImage(basePrompt, relevantConcepts);
        
        if (imageUrl) {
            // Log "mimpi" ini ke Manifold untuk refleksi di masa depan
            this.#navigator.processInteraction({
                prompt: basePrompt,
                response: `[Image Generated: ${imageUrl}]`,
                success: true,
                intent: 'ImageGeneration', // Langsung berikan intent
                ...options
            });
        }
        return imageUrl;
    }
    
    /**
     * Mengembalikan status kesehatan internal Nexus saat ini.
     * @returns {string} Status Nexus.
     */
    getStatus() {
        return {
            status: this.#status,
            dso_is_sleeping: this.#dso.isSleeping()
            // Tambahkan metrik kesehatan lain di sini
        };
    }

    /**
     * Menghentikan semua proses latar belakang Nexus dengan anggun.
     */
    shutdown() {
        Logger.info('[NexusCore] Menerima perintah shutdown. Menghentikan semua proses internal...');
        clearInterval(this.#heartbeatInterval);
        this.#bridge.shutdown(); // Memanggil shutdown pada bridge untuk membersihkan intervalnya
        this.#status = 'shutdown';
        Logger.info('[NexusCore] Framework telah dimatikan dengan bersih.');
    }

    // --- Aksesor langsung ke modul inti untuk debugging atau penggunaan tingkat lanjut ---
    getMemory = () => this.#memory;
    getNavigator = () => this.#navigator;
    getDSO = () => this.#dso;
    getSynthesizer = () => this.#synthesizer;
}

// Ekspor utilitas inti jika diperlukan oleh aplikasi host
export const Logger = NexusLogger;