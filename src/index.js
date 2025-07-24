// File: metacognitive-nexus/src/index.js (Lengkap & Utuh)

import { DynamicSentienceOrchestrator } from './core/DynamicSentienceOrchestrator.js';
import { ManifoldMemory } from './core/ManifoldMemory.js';
import { ManifoldNavigator } from './core/ManifoldNavigator.js';
import { MultimodalSynthesizer } from './core/MultimodalSynthesizer.js';
import { AIProviderBridge } from './core/AIProviderBridge.js';
import { Logger } from './utils/Logger.js';
import { SigillumSensorium } from './core/SigillumSensorium.js';

export class MetacognitiveNexus {
    #status = 'initializing';
    #heartbeatInterval;
    #dso;
    #memory;
    #navigator;
    #synthesizer;
    #bridge;
    #sigillumSensorium; 
    publicConfig; 
    coreContext = {}; 

    constructor(config) {
        if (!config || !config.apiKeys?.openai || config.apiKeys.openai.length === 0) {
            const errorMsg = 'Konfigurasi tidak lengkap. `config.apiKeys.openai` wajib ada.';
            Logger.error(`[NexusCore] ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        this.publicConfig = config; 

        try {
            this.#bridge = AIProviderBridge.getInstance(); 
            this.#sigillumSensorium = new SigillumSensorium(); 

            this.#memory = new ManifoldMemory({ apiKey: config.apiKeys.openai[0], config: config });
            this.#synthesizer = new MultimodalSynthesizer({ apiKey: config.apiKeys.openai[0], config: config });
            
            // [PERBAIKAN KRITIS] Meneruskan instance MetacognitiveNexus ke DSO
            // Ini agar DSO dapat memanggil this.#aiNexus.getNavigator() dan this.#aiNexus.getMemory()
            this.#dso = new DynamicSentienceOrchestrator(config, this.#bridge, this.#sigillumSensorium, this); // Passing 'this'

            this.#navigator = new ManifoldNavigator(this.#memory, (learningData) => {
                if (this.#dso) this.#dso.updateHeuristics(learningData);
            }, config);

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
        this.#dso.applyIdeonDecayAndManageCuriosity();
    }

    /**
     * Meminta teks dari AI dengan menerapkan kebijakan yang relevan dengan konteks.
     * @param {object} payload Payload interaksi lengkap.
     * @returns {Promise<object>} Obyek hasil yang kaya informasi.
     */
    async getAIResponse(payload) { 
        if (this.#status === 'degraded' || this.#status === 'shutdown') {
            const errorMsg = `Nexus tidak dapat memproses. Status: ${this.#status}`;
            Logger.error(`[NexusCore] ${errorMsg}`);
            return { response: null, error: new Error(errorMsg), success: false };
        }

        // [PERBAIKAN] Langsung meneruskan payload ke DSO
        const dsoResult = await this.#dso.generateText(payload);
        
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
        
        const relevantIdeons = await this.#memory.findRelevantConcepts(basePrompt, 3); 
        const imageUrl = await this.#synthesizer.generateImage(basePrompt, relevantIdeons);
        
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
                    topCandidateQlcScore: 1.0, 
                    artisticStyle: options.style 
                },
                transactions: [], 
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

    updateOntologicalStateFromGitEvent(eventType, eventData) {
        if (this.#sigillumSensorium) {
            this.#sigillumSensorium.updateSigillumState(eventType, eventData);
        }
    }

    getSigillumState() {
        return this.#sigillumSensorium ? this.#sigillumSensorium.getCurrentState() : null;
    }

    shutdown() {
        Logger.info('[NexusCore] Menerima perintah shutdown...');
        clearInterval(this.#heartbeatInterval);
        if (this.#bridge) this.#bridge.shutdown();
        if (this.#dso) this.#dso.shutdown(); 
        // Jika modul lain memiliki metode shutdown, panggil di sini
        if (this.#memory && typeof this.#memory.shutdown === 'function') this.#memory.shutdown(); 
        if (this.#synthesizer && typeof this.#synthesizer.shutdown === 'function') this.#synthesizer.shutdown();
        if (this.#navigator && typeof this.#navigator.shutdown === 'function') this.#navigator.shutdown();
        this.#status = 'shutdown';
        Logger.info('[NexusCore] Framework telah dimatikan.');
    }

    getMemory = () => this.#memory;
    getNavigator = () => this.#navigator;
    getDSO = () => this.#dso;
    getSynthesizer = () => this.#synthesizer;
}