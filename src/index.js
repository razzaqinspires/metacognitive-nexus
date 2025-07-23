// File: metacognitive-nexus/src/index.js (Lengkap & Utuh)

import { DynamicSentienceOrchestrator } from './core/DynamicSentienceOrchestrator.js';
import { ManifoldMemory } from './core/ManifoldMemory.js';
import { ManifoldNavigator } from './core/ManifoldNavigator.js';
import { MultimodalSynthesizer } from './core/MultimodalSynthesizer.js';
import { AIProviderBridge } from './core/AIProviderBridge.js';
import { Logger } from './utils/Logger.js';
import { SigillumSensorium } from './core/SigillumSensorium.js'; // Impor SigillumSensorium

export class MetacognitiveNexus {
    #status = 'initializing';
    #heartbeatInterval;
    #dso;
    #memory;
    #navigator;
    #synthesizer;
    #bridge;
    #sigillumSensorium; // Properti baru untuk SigillumSensorium
    publicConfig; // Menyimpan konfigurasi yang relevan secara publik
    coreContext = {}; // Objek untuk menyimpan referensi ke semua inti

    constructor(config) {
        if (!config || !config.apiKeys?.openai || config.apiKeys.openai.length === 0) {
            const errorMsg = 'Konfigurasi tidak lengkap. `config.apiKeys.openai` wajib ada.';
            Logger.error(`[NexusCore] ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        this.publicConfig = config; // Simpan konfigurasi lengkap

        try {
            this.#bridge = AIProviderBridge.getInstance(); // Singleton
            this.#sigillumSensorium = new SigillumSensorium(); // Inisialisasi Sensorium

            // Meneruskan konfigurasi lengkap ke ManifoldMemory
            this.#memory = new ManifoldMemory({ apiKey: config.apiKeys.openai[0], config: config });
            this.#synthesizer = new MultimodalSynthesizer({ apiKey: config.apiKeys.openai[0], config: config });
            
            // Meneruskan instance SigillumSensorium dan konfigurasi lengkap ke DSO
            this.#dso = new DynamicSentienceOrchestrator(config, this.#bridge, this.#sigillumSensorium);
            
            // Meneruskan konfigurasi lengkap ke Navigator
            this.#navigator = new ManifoldNavigator(this.#memory, (learningData) => {
                if (this.#dso) this.#dso.updateHeuristics(learningData);
            }, config); // Meneruskan config

            // Populate coreContext for easy access
            this.coreContext = {
                dso: this.#dso,
                memory: this.#memory,
                navigator: this.#navigator,
                synthesizer: this.#synthesizer,
                bridge: this.#bridge,
                sigillumSensorium: this.#sigillumSensorium,
                config: this.publicConfig
            };

            this.#status = 'active';
            Logger.info('[NexusCore] Semua modul kognitif berhasil diinisialisasi.');
            this.#startHeartbeat();

        } catch (error) {
            this.#status = 'degraded';
            Logger.error('[NexusCore] Gagal inisialisasi salah satu modul inti.', error);
        }
    }

    #startHeartbeat() {
        const HEARTBEAT_RATE_MS = 30 * 1000;
        this.#heartbeatInterval = setInterval(() => {
            if (this.#status !== 'active') return;
            Logger.debug(`[NexusHeartbeat] ❤️ Denyut...`);
            this.#checkHomeostasis();
        }, HEARTBEAT_RATE_MS);
    }

    #checkHomeostasis() {
        const dsoIsSleeping = this.#dso ? this.#dso.isSleeping() : false;
        if (dsoIsSleeping && this.#status !== 'sleeping') {
            this.#status = 'sleeping';
            Logger.warn('[NexusCore] Homeostasis: DSO sedang tidur.');
        } else if (!dsoIsSleeping && this.#status === 'sleeping') {
            this.#status = 'active';
            Logger.info('[NexusCore] Homeostasis: DSO telah bangun.');
        }
        // Memicu peluruhan ideon di ManifoldMemory secara berkala melalui DSO
        this.#dso.applyIdeonDecayAndManageCuriosity();
    }

    /**
     * Meminta teks dari AI dengan menerapkan kebijakan yang relevan dengan konteks.
     * @param {object} payload Payload interaksi lengkap.
     * @returns {Promise<object>} Obyek hasil yang kaya informasi.
     */
    async getAIResponse(payload) { // Menerima payload lengkap
        if (this.#status === 'degraded' || this.#status === 'shutdown') {
            const errorMsg = `Nexus tidak dapat memproses. Status: ${this.#status}`;
            Logger.error(`[NexusCore] ${errorMsg}`);
            return { response: null, error: new Error(errorMsg), success: false };
        }

        // Meneruskan payload lengkap ke DSO
        const dsoResult = await this.#dso.generateText(payload);

        // Navigator akan dipanggil secara internal oleh DSO setelah hasil transaksi
        // Jadi tidak perlu panggil lagi di sini kecuali ada logika tambahan di NexusCore
        // await this.#navigator.processInteraction({
        //     prompt: payload.messages[payload.messages.length - 1].content, // Ambil prompt terakhir
        //     ...dsoResult,
        //     userId: payload.userId,
        //     platform: payload.platform
        // });
        
        return dsoResult;
    }

    /**
     * Meminta AI untuk membayangkan/menghasilkan gambar.
     * @param {string} basePrompt Prompt dasar untuk gambar.
     * @param {object} options Opsi tambahan.
     * @returns {Promise<string | null>} URL gambar yang dihasilkan.
     */
    async imagine(basePrompt, options = {}) {
        if (this.#status !== 'active') {
             Logger.warn(`[NexusCore] Imajinasi ditolak. Status: ${this.#status}`);
             return null;
        }
        
        // Cari Ideon relevan, bukan hanya konsep teks
        const relevantIdeons = await this.#memory.findRelevantConcepts(basePrompt, 3); 
        const imageUrl = await this.#synthesizer.generateImage(basePrompt, relevantIdeons);
        
        // Catat interaksi imagine ke Navigator
        if (imageUrl) {
            await this.#navigator.processInteraction({
                id: `imagine-result-${Date.now()}`,
                timestamp: new Date(),
                userId: options.userId,
                platform: options.platform,
                promptText: basePrompt,
                cognitiveSnapshot: {
                    intent: 'ImageGeneration',
                    policyUsed: 'MultimodalSynthesizer',
                    topCandidateQlcScore: 1.0, // Asumsi berhasil tinggi
                    artisticStyle: options.style // Merekam gaya yang digunakan
                },
                transactions: [], // Transaksi imagine berbeda, bisa ditambahkan di sini
                finalOutcome: { success: true, response: imageUrl, error: null },
                promptMetadata: { type: 'image_generation', style: options.style }
            });
        } else {
             await this.#navigator.processInteraction({
                id: `imagine-fail-${Date.now()}`,
                timestamp: new Date(),
                userId: options.userId,
                platform: options.platform,
                promptText: basePrompt,
                cognitiveSnapshot: { intent: 'ImageGeneration', policyUsed: 'MultimodalSynthesizer', topCandidateQlcScore: 0 },
                transactions: [],
                finalOutcome: { success: false, response: null, error: new Error('Image generation failed') },
                promptMetadata: { type: 'image_generation', style: options.style }
            });
        }
        return imageUrl;
    }
    
    getStatus() {
        return {
            status: this.#status,
            dso_is_sleeping: this.#dso ? this.#dso.isSleeping() : false,
        };
    }

    /**
     * [BARU] Metode untuk memperbarui status ontologis (Sigillum) dari event eksternal (Git/CI).
     * @param {string} eventType - Tipe event (e.g., 'COMMIT', 'CI_STATUS').
     * @param {object} eventData - Data terkait event.
     */
    updateOntologicalStateFromGitEvent(eventType, eventData) {
        if (this.#sigillumSensorium) {
            this.#sigillumSensorium.updateSigillumState(eventType, eventData);
        }
    }

    /**
     * [BARU] Mengembalikan status Sigillum saat ini.
     * @returns {{purity: number, symmetry: number, fractureCount: number}}
     */
    getSigillumState() {
        return this.#sigillumSensorium ? this.#sigillumSensorium.getCurrentState() : null;
    }

    shutdown() {
        Logger.info('[NexusCore] Menerima perintah shutdown...');
        clearInterval(this.#heartbeatInterval);
        if (this.#bridge) this.#bridge.shutdown();
        if (this.#dso) this.#dso.shutdown(); // Memastikan DSO membersihkan intervalnya
        if (this.#memory) this.#memory.shutdown(); // Jika Memory memiliki resource untuk dibersihkan
        if (this.#synthesizer) this.#synthesizer.shutdown(); // Jika Synthesizer memiliki resource untuk dibersihkan
        if (this.#navigator) this.#navigator.shutdown(); // Jika Navigator memiliki resource untuk dibersihkan
        this.#status = 'shutdown';
        Logger.info('[NexusCore] Framework telah dimatikan.');
    }

    getMemory = () => this.#memory;
    getNavigator = () => this.#navigator;
    getDSO = () => this.#dso;
    getSynthesizer = () => this.#synthesizer;
}