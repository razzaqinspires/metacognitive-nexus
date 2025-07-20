// File: metacognitive-nexus/src/core/ManifoldMemory.js (Final)
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Logger } from '../utils/Logger.js';

export class ManifoldMemory {
    #client;
    #collection;
    #logger;
    #isInitialized = false;

    /**
     * Constructor sekarang menerima API key melalui dependency injection.
     * @param {{apiKey: string}} config Obyek konfigurasi yang berisi apiKey.
     */
    constructor({ apiKey }) {
        this.#client = new ChromaClient(); 
        this.#logger = Logger;
        
        // Validasi dependensi yang disuntikkan.
        if (!apiKey || typeof apiKey !== 'string') {
            const errorMessage = "[ManifoldMemory] FATAL: API Key tidak disuntikkan saat inisialisasi. Framework membutuhkan API Key untuk disediakan oleh aplikasi pemanggil.";
            this.#logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        const embedder = new OpenAIEmbeddings({ openAIApiKey: apiKey });
        
        this.#initialize(embedder).catch(err => this.#logger.error('[ManifoldMemory] Inisialisasi UCM gagal.', err));
    }

    async #initialize(embedder) {
        // ... (Sisa dari metode ini tidak berubah, sudah sempurna)
        try {
            await this.#client.heartbeat();
            this.#logger.info('[ManifoldMemory] Koneksi ke ChromaDB berhasil.');

            this.#collection = await this.#client.getOrCreateCollection({
                name: "conceptual_manifold",
                embeddingFunction: embedder,
            });
            this.#isInitialized = true;
            this.#logger.info('[ManifoldMemory] Unified Conceptual Manifold online and ready.');
        } catch (error) {
            this.#logger.error('[ManifoldMemory] Gagal menginisialisasi UCM. Pastikan server ChromaDB berjalan.', error);
        }
    }

    // ... (Sisa dari metode storeConcept, findRelevantConcepts, dll. tidak berubah)
    async storeConcept(id, conceptText, metadata) {
        if (!this.#isInitialized) {
            this.#logger.warn('[ManifoldMemory] UCM belum diinisialisasi, tidak dapat menyimpan konsep.');
            return;
        }
        try {
            await this.#collection.add({
                ids: [id],
                metadatas: [metadata],
                documents: [conceptText],
            });
            this.#logger.debug(`[ManifoldMemory] Concept ${id} has been embedded into the manifold.`);
        } catch (error) {
            this.#logger.error(`[ManifoldMemory] Error storing concept ${id}.`, error);
        }
    }

    async findRelevantConcepts(queryText, numResults = 3) {
        if (!this.#isInitialized) {
            this.#logger.warn('[ManifoldMemory] UCM belum diinisialisasi, tidak dapat mencari konsep.');
            return [];
        }
        try {
            const results = await this.#collection.query({
                queryTexts: [queryText],
                nResults: numResults,
            });
            return results.documents && results.documents.length > 0 ? results.documents[0] : [];
        } catch (error) {
            this.#logger.error('[ManifoldMemory] Error querying the manifold.', error);
            return [];
        }
    }

    getCollection() {
        return this.#collection;
    }
}
