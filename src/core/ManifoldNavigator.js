// File: metacognitive-nexus/src/core/ManifoldNavigator.js (Versi Evolusi)
import { Logger } from '../utils/Logger.js';
import { ManifoldMemory } from './ManifoldMemory.js';
import { generateInteractionId } from '../models/InteractionLogSchema.js';

export class ManifoldNavigator {
    #memory;
    #logger;
    #dsoOptimizerCallback; // Callback untuk memicu optimisasi DSO

    constructor(manifoldMemoryInstance, dsoOptimizerCallback = null) {
        this.#memory = manifoldMemoryInstance;
        this.#logger = Logger;
        this.#dsoOptimizerCallback = dsoOptimizerCallback;
        this.#logger.info('[ManifoldNavigator] Semiotic & Strategy Core online.');
    }

    /**
     * Mengklasifikasikan niat dari prompt pengguna.
     * (Implementasi sederhana untuk demonstrasi; bisa diganti model klasifikasi yang lebih canggih)
     * @private
     */
    #classifyIntent(prompt) {
        const p = prompt.toLowerCase();
        if (p.startsWith('/imagine') || p.includes('buatkan gambar')) return 'ImageGeneration';
        if (p.match(/\b(apa|siapa|kapan|mengapa|bagaimana|jelaskan)\b/)) return 'QuestionAnswering';
        if (p.match(/\b(buatkan|tuliskan kode|convert|refactor)\b/)) return 'CodeGeneration';
        if (p.match(/\b(aku merasa|sedih|senang|marah)\b/)) return 'PersonalVent';
        if (p.match(/\b(buatkan cerita|puisi|ide)\b/)) return 'CreativeRequest';
        return 'ChitChat';
    }

    /**
     * Memproses, membedah, dan menenun interaksi AI ke dalam Manifold.
     * @param {object} rawInteractionData Data mentah interaksi.
     */
    async processInteraction(rawInteractionData) {
        const interactionId = generateInteractionId();
        const intent = this.#classifyIntent(rawInteractionData.prompt);

        // 1. Dekomposisi Konseptual
        const promptId = `prompt-${interactionId}`;
        const responseId = `response-${interactionId}`;

        const baseMetadata = {
            interactionId: interactionId,
            timestamp: new Date().toISOString(),
            userId: rawInteractionData.userId || 'anonymous',
            platform: rawInteractionData.platform || 'unknown',
            providerUsed: rawInteractionData.providerUsed,
            modelUsed: rawInteractionData.modelUsed,
            latencyMs: rawInteractionData.latencyMs,
            success: rawInteractionData.success,
            intent: intent
        };

        // 2. Penenunan Semantik: Simpan komponen sebagai konsep terpisah namun terhubung
        // Embed prompt pengguna
        await this.#memory.storeConcept(promptId, rawInteractionData.prompt, {
            ...baseMetadata,
            type: 'user_prompt',
            responseId: responseId
        });

        // Embed respons AI (jika ada)
        if (rawInteractionData.response) {
            await this.#memory.storeConcept(responseId, rawInteractionData.response, {
                ...baseMetadata,
                type: 'ai_response',
                promptId: promptId
            });
        }
        
        this.#logger.info(`[ManifoldNavigator] Interaksi ${interactionId} (Intent: ${intent}) telah ditenun ke dalam UCM.`);

        // 3. Penyesuaian Heuristik Aktif
        this.#triggerHeuristicAdjustment({
            intent: intent,
            success: rawInteractionData.success,
            latency: rawInteractionData.latencyMs,
            provider: rawInteractionData.providerUsed,
            model: rawInteractionData.modelUsed
        });
    }

    /**
     * Memicu callback optimisasi untuk DSO dengan data pembelajaran.
     * @private
     */
    #triggerHeuristicAdjustment(learningData) {
        if (!this.#dsoOptimizerCallback) {
            this.#logger.debug('[ManifoldNavigator] DSO optimizer callback not set. Skipping heuristic adjustment.');
            return;
        }

        // Ini adalah "pulsa pembelajaran" yang dikirim ke sistem lain (misalnya, DSO atau modul optimisasi)
        this.#logger.debug(`[ManifoldNavigator] Mengirim pulsa pembelajaran untuk intent '${learningData.intent}'.`);
        this.#dsoOptimizerCallback(learningData);
    }
}