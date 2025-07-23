// File: metacognitive-nexus/src/core/ManifoldNavigator.js (Versi Evolusi)
import { Logger } from '../utils/Logger.js';
import { IdeonSchema, generateIdeonId } from '../models/IdeonSchema.js'; // Impor IdeonSchema
import { generateInteractionId } from '../models/InteractionLogSchema.js'; // Impor InteractionLogSchema ID

export class ManifoldNavigator {
    #memory;
    #logger;
    #dsoOptimizerCallback; // Callback untuk memicu optimisasi DSO
    #config; // Untuk navigatorConfig

    constructor(manifoldMemoryInstance, dsoOptimizerCallback = null, config) {
        this.#memory = manifoldMemoryInstance;
        this.#logger = Logger;
        this.#dsoOptimizerCallback = dsoOptimizerCallback;
        this.#config = config; // Simpan konfigurasi
        this.#logger.info('[ManifoldNavigator] Semiotic & Strategy Core online.');
    }

    /**
     * Mengklasifikasikan niat dari prompt pengguna.
     * (Implementasi sederhana; idealnya menggunakan model klasifikasi AI)
     * @private
     * @param {string} prompt Teks prompt pengguna.
     * @returns {string} Niat yang diklasifikasikan.
     */
    #classifyIntent(prompt) {
        const p = prompt.toLowerCase();
        if (p.startsWith('/imagine') || p.includes('buatkan gambar')) return 'ImageGeneration';
        if (p.match(/\b(apa|siapa|kapan|mengapa|bagaimana|jelaskan)\b/)) return 'QuestionAnswering';
        if (p.match(/\b(buatkan|tuliskan kode|convert|refactor)\b/)) return 'CodeGeneration';
        if (p.match(/\b(aku merasa|sedih|senang|marah)\b/)) return 'PersonalVent';
        if (p.match(/\b(buatkan cerita|puisi|ide)\b/)) return 'CreativeRequest';
        if (p.match(/\b(menu|perintah|bantuan)\b/)) return 'CommandQuery';
        if (p.match(/\b(status|diagnosa|mode|owner)\b/)) return 'SystemManagement';
        return 'ChitChat';
    }

    /**
     * Memproses, membedah, dan menenun interaksi AI ke dalam Manifold.
     * Ini juga mencatat InteractionLog.
     * @param {object} rawInteractionData Data mentah interaksi.
     * @param {string} rawInteractionData.prompt - Teks prompt asli dari pengguna.
     * @param {string} [rawInteractionData.response] - Respons AI yang dihasilkan.
     * @param {boolean} rawInteractionData.success - Apakah interaksi berhasil.
     * @param {string} [rawInteractionData.providerUsed] - Provider AI yang digunakan.
     * @param {string} [rawInteractionData.modelUsed] - Model AI yang digunakan.
     * @param {number} [rawInteractionData.latencyMs] - Latensi interaksi.
     * @param {string} rawInteractionData.userId - ID pengguna.
     * @param {string} rawInteractionData.platform - Platform interaksi.
     * @param {string} [rawInteractionData.intent] - Niat yang diklasifikasikan (jika sudah ada).
     * @param {object} [rawInteractionData.promptMetadata] - Metadata tambahan dari prompt (misal: command_execution).
     */
    async processInteraction(rawInteractionData) {
        const interactionId = rawInteractionData.id || generateInteractionId(); // Gunakan ID yang disediakan atau buat baru
        const intent = rawInteractionData.intent || this.#classifyIntent(rawInteractionData.prompt);

        // 1. Dekomposisi Konseptual & Penenunan Semantik (Ideon Creation/Update)
        // Buat Ideon untuk prompt pengguna
        const promptIdeonId = generateIdeonId(`prompt:${interactionId}`);
        const promptIdeon = {
            id: promptIdeonId,
            canonicalName: `User Prompt: ${rawInteractionData.prompt.substring(0, 50)}...`,
            aliases: [],
            perspectives: [{
                context: 'user_input',
                description: rawInteractionData.prompt,
                vectorId: null // Akan diisi saat di-store
            }],
            categories: ['Interaction', 'UserPrompt', intent],
            relations: [],
            activation: { level: 0.5, lastAccessed: new Date(), decayRate: this.#config.navigatorConfig?.ideonDecayRate || 0.05 },
            confidenceScore: 0.5, // Confidence awal
            sourceInteractionIds: [interactionId],
        };
        await this.#memory.storeIdeon(promptIdeon);

        // Buat Ideon untuk respons AI (jika ada)
        let responseIdeonId = null;
        if (rawInteractionData.response) {
            responseIdeonId = generateIdeonId(`response:${interactionId}`);
            const responseIdeon = {
                id: responseIdeonId,
                canonicalName: `AI Response: ${rawInteractionData.response.substring(0, 50)}...`,
                aliases: [],
                perspectives: [{
                    context: 'ai_output',
                    description: rawInteractionData.response,
                    vectorId: null
                }],
                categories: ['Interaction', 'AIResponse', intent],
                relations: [{ targetIdeonId: promptIdeonId, type: 'DERIVED_FROM', weight: 1.0 }],
                activation: { level: 0.5, lastAccessed: new Date(), decayRate: this.#config.navigatorConfig?.ideonDecayRate || 0.05 },
                confidenceScore: rawInteractionData.success ? 0.8 : 0.2, // Confidence awal berdasarkan sukses
                sourceInteractionIds: [interactionId],
            };
            await this.#memory.storeIdeon(responseIdeon);
        }
        
        // Perbarui kepercayaan pada Ideon yang digunakan atau dipengaruhi oleh interaksi
        if (rawInteractionData.success) {
            await this.#memory.updateIdeonActivation(promptIdeonId, 0.2); // Tingkatkan aktivasi prompt
            if (responseIdeonId) await this.#memory.updateIdeonActivation(responseIdeonId, 0.2); // Tingkatkan aktivasi respons

            // Jika ini adalah eksekusi perintah yang berhasil, tingkatkan confidence Ideon perintah itu sendiri
            if (rawInteractionData.promptMetadata?.type === 'command_execution') {
                const commandIdeonId = generateIdeonId(`command:${rawInteractionData.promptMetadata.command}`);
                const currentCommandIdeon = this.#memory.getIdeon(commandIdeonId);
                if (currentCommandIdeon) {
                    currentCommandIdeon.confidenceScore = Math.min(1.0, currentCommandIdeon.confidenceScore + 0.1);
                    await this.#memory.storeIdeon(currentCommandIdeon); // Simpan kembali Ideon yang diperbarui
                }
            }
        } else {
             // Jika gagal, turunkan confidence prompt
            await this.#memory.updateIdeonActivation(promptIdeonId, -0.1);
            if (responseIdeonId) await this.#memory.updateIdeonActivation(responseIdeonId, -0.1);
        }

        this.#logger.info(`[ManifoldNavigator] Interaksi ${interactionId} (Intent: ${intent}) telah ditenun ke dalam UCM.`);

        // 2. Catat InteractionLog (Fosil Pikiran)
        const interactionLog = {
            id: interactionId,
            timestamp: rawInteractionData.timestamp || new Date(),
            userId: rawInteractionData.userId,
            platform: rawInteractionData.platform,
            promptText: rawInteractionData.prompt,
            cognitiveSnapshot: rawInteractionData.cognitiveSnapshot || {
                intent: intent,
                policyUsed: rawInteractionData.providerUsed || 'Unknown',
                topCandidateQlcScore: rawInteractionData.qlcScore || 0
            },
            transactions: rawInteractionData.transactions || [],
            finalOutcome: {
                success: rawInteractionData.success,
                response: rawInteractionData.response,
                error: rawInteractionData.error?.message || null
            },
            causalLinks: {
                promptVectorId: promptIdeonId,
                responseVectorId: responseIdeonId
            },
            feedback: rawInteractionData.feedback || null,
            promptMetadata: rawInteractionData.promptMetadata || null
        };
        // Idealnya, InteractionLog ini disimpan ke database persisten terpisah (misalnya, MongoDB)
        // Untuk demo, kita hanya log
        Logger.debug(`[ManifoldNavigator] Interaction Log dicatat: ${JSON.stringify(interactionLog.finalOutcome)}`);


        // 3. Penyesuaian Heuristik Aktif (Pulsa Pembelajaran ke DSO)
        this.#triggerHeuristicAdjustment({
            intent: intent,
            success: rawInteractionData.success,
            latency: rawInteractionData.latencyMs,
            provider: rawInteractionData.providerUsed,
            model: rawInteractionData.modelUsed,
            // Tambahkan metrik lain dari log interaksi jika relevan untuk DSO
        });
    }

    /**
     * Memicu callback optimisasi untuk DSO dengan data pembelajaran.
     * @private
     * @param {object} learningData - Data untuk DSO.
     */
    #triggerHeuristicAdjustment(learningData) {
        if (!this.#dsoOptimizerCallback) {
            this.#logger.debug('[ManifoldNavigator] DSO optimizer callback not set. Skipping heuristic adjustment.');
            return;
        }

        this.#logger.debug(`[ManifoldNavigator] Mengirim pulsa pembelajaran untuk intent '${learningData.intent}'.`);
        this.#dsoOptimizerCallback(learningData);
    }

    /**
     * [BARU] Mengevaluasi relevansi kontekstual sebuah pesan terhadap chat/grup.
     * Ini bisa digunakan untuk S_Context dalam AICT.
     * @param {string} text Teks pesan.
     * @param {string} chatJid JID chat/grup.
     * @returns {Promise<number>} Skor relevansi kontekstual (0.0 - 1.0).
     */
    async assessContextualRelevance(text, chatJid) {
        // Ini adalah area untuk penelitian dan pengembangan AI tingkat lanjut.
        // Konseptual: Manifold Memory dapat menyimpan 'konsep chat' untuk setiap JID.
        // 1. Cari Ideon relevan dari teks pesan.
        const relevantIdeons = await this.#memory.findRelevantConcepts(text, 5); // Ambil top 5
        if (relevantIdeons.length === 0) return 0; // Tidak ada konsep relevan yang ditemukan

        // 2. Bandingkan dengan Ideon yang terkait dengan chatJid ini (jika ada).
        // Ini memerlukan bahwa ManifoldMemory melacak "chat history concepts"
        // atau bahwa Ideon dapat "di-tag" dengan JID chat.
        // Untuk tujuan demo, kita asumsikan relevansi meningkat jika ada Ideon relevan.
        
        let contextualScore = 0;
        const chatIdeonId = generateIdeonId(`chat:${chatJid}`);
        const chatIdeon = this.#memory.getIdeon(chatIdeonId);

        if (chatIdeon) {
            // Jika ada Ideon untuk chat ini, periksa apakah Ideon yang relevan dari pesan
            // juga relevan atau terkait dengan Ideon chat.
            for (const ideon of relevantIdeons) {
                // Periksa relasi atau kemiripan semantik antara Ideon pesan dan Ideon chat
                // Ini akan memerlukan AI untuk menilai relevansi.
                // Untuk saat ini, kita hanya meningkatkan skor jika ideon relevan ditemukan
                contextualScore += ideon.activation.level * ideon.confidenceScore;
            }
        } else {
            // Jika belum ada Ideon untuk chat ini, relevansi kontekstual mungkin lebih rendah.
            contextualScore = relevantIdeons[0].activation.level * relevantIdeons[0].confidenceScore * 0.5;
        }

        // Batasi skor antara 0 dan 1.
        return Math.min(1, contextualScore / relevantIdeons.length); // Rata-rata sederhana
    }
}