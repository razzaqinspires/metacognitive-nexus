// File: metacognitive-nexus/src/index.js (Lengkap & Utuh)

import { DynamicSentienceOrchestrator } from './core/DynamicSentienceOrchestrator.js';
import { ManifoldMemory } from './core/ManifoldMemory.js';
import { ManifoldNavigator } from './core/ManifoldNavigator.js';
import { MultimodalSynthesizer } from './core/MultimodalSynthesizer.js';
import { AIProviderBridge } from './core/AIProviderBridge.js';
import { Logger as NexusLogger } from './utils/Logger.js';

export class MetacognitiveNexus {
    #status = 'initializing';
    #heartbeatInterval;
    #dso;
    #memory;
    #navigator;
    #synthesizer;
    #bridge;

    constructor(config) {
        if (!config || !config.apiKeys?.openai || config.apiKeys.openai.length === 0) {
            const errorMsg = 'Konfigurasi tidak lengkap. `config.apiKeys.openai` wajib ada.';
            NexusLogger.error(`[NexusCore] ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        try {
            // [PERBAIKAN] Panggil satu-satunya instance bridge yang ada
            this.#bridge = AIProviderBridge.getInstance();
            
            this.#memory = new ManifoldMemory({ apiKey: config.apiKeys.openai[0] });
            this.#synthesizer = new MultimodalSynthesizer({ apiKey: config.apiKeys.openai[0] });
            
            // [PERBAIKAN] Suntikkan instance bridge yang sama ke DSO
            this.#dso = new DynamicSentienceOrchestrator(config, this.#bridge);
            
            this.#navigator = new ManifoldNavigator(this.#memory, (learningData) => {
                if (this.#dso) this.#dso.updateHeuristics(learningData);
            });

            this.#status = 'active';
            NexusLogger.info('[NexusCore] Semua modul kognitif berhasil diinisialisasi.');
            this.#startHeartbeat();

        } catch (error) {
            this.#status = 'degraded';
            NexusLogger.error('[NexusCore] Gagal inisialisasi salah satu modul inti.', error);
        }
    }

    #startHeartbeat() {
        const HEARTBEAT_RATE_MS = 30 * 1000;
        this.#heartbeatInterval = setInterval(() => {
            if (this.#status !== 'active') return;
            NexusLogger.debug(`[NexusHeartbeat] ❤️ Denyut...`);
            this.#checkHomeostasis();
        }, HEARTBEAT_RATE_MS);
    }

    #checkHomeostasis() {
        const dsoIsSleeping = this.#dso ? this.#dso.isSleeping() : false;
        if (dsoIsSleeping && this.#status !== 'sleeping') {
            this.#status = 'sleeping';
            NexusLogger.warn('[NexusCore] Homeostasis: DSO sedang tidur.');
        } else if (!dsoIsSleeping && this.#status === 'sleeping') {
            this.#status = 'active';
            NexusLogger.info('[NexusCore] Homeostasis: DSO telah bangun.');
        }
    }

    async getAIResponse(prompt, options = {}) {
        if (this.#status === 'degraded' || this.#status === 'shutdown') {
            const errorMsg = `Nexus tidak dapat memproses. Status: ${this.#status}`;
            NexusLogger.error(`[NexusCore] ${errorMsg}`);
            return { response: null, error: new Error(errorMsg), success: false };
        }

        const dsoResult = await this.#dso.generateText(prompt, options);

        await this.#navigator.processInteraction({
            prompt: prompt,
            ...dsoResult,
            userId: options.userId,
            platform: options.platform
        });
        
        return dsoResult;
    }

    async imagine(basePrompt, options = {}) {
        if (this.#status !== 'active') {
             NexusLogger.warn(`[NexusCore] Imajinasi ditolak. Status: ${this.#status}`);
             return null;
        }
        
        const relevantConcepts = await this.#memory.findRelevantConcepts(basePrompt, 3); 
        const imageUrl = await this.#synthesizer.generateImage(basePrompt, relevantConcepts);
        
        if (imageUrl) {
            this.#navigator.processInteraction({
                prompt: basePrompt,
                response: `[Image Generated: ${imageUrl}]`,
                success: true,
                intent: 'ImageGeneration',
                ...options
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

    shutdown() {
        NexusLogger.info('[NexusCore] Menerima perintah shutdown...');
        clearInterval(this.#heartbeatInterval);
        if (this.#bridge) this.#bridge.shutdown();
        this.#status = 'shutdown';
        NexusLogger.info('[NexusCore] Framework telah dimatikan.');
    }

    getMemory = () => this.#memory;
    getNavigator = () => this.#navigator;
    getDSO = () => this.#dso;
    getSynthesizer = () => this.#synthesizer;
}

export const Logger = NexusLogger;