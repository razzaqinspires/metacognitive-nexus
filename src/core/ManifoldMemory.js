// File: metacognitive-nexus/src/core/ManifoldMemory.js
import { ChromaClient } from 'chromadb';
// Pastikan ChromaDB berjalan sebagai server terpisah atau mode embedded yang sesuai.
// Untuk penggunaan lokal, ChromaClient() default ke localhost:8000.
// Jika Anda ingin mode embedded (tanpa server terpisah), instal '@langchain/community/embeddings/openai'
// dan gunakan 'new OpenAIEmbeddings()' untuk OpenAIEmbeddingFunction.

// Penting: Di lingkungan produksi, Anda mungkin perlu menginstal dan menjalankan server ChromaDB secara terpisah
// atau menggunakan layanan cloud seperti Pinecone/Weaviate.
// Untuk POC (Proof of Concept) lokal, kita bisa mencoba mode embedded jika ingin tanpa server eksternal Chroma.
// Namun, OpenAIEmbeddingFunction memerlukan kunci API OpenAI untuk menghasilkan embedding.

// Menggunakan LangChain untuk OpenAIEmbeddings agar kompatibel dengan Chroma
import { OpenAIEmbeddings } from '@langchain/openai';
import { Logger } from '../utils/Logger.js';

// Catatan: Memerlukan API Key OpenAI untuk menghasilkan embedding.
// Pastikan process.env.OPENAI_API_KEY sudah tersedia (melalui .env atau cara lain).
const embedder = new OpenAIEmbeddings({
    // Nama variabel lingkungan untuk kunci API OpenAI.
    // Pastikan ini adalah kunci yang sama dengan yang Anda gunakan untuk DALL-E/GPT.
    openAIApiKey: process.env.OPENAI_API_KEY_1 || process.env.OPENAI_API_KEY, 
});

export class ManifoldMemory {
    #client;
    #collection;
    #logger;
    #isInitialized = false;

    constructor() {
        // Untuk menggunakan ChromaDB dalam mode embedded (lokal tanpa server terpisah),
        // Anda mungkin perlu mengonfigurasi path database-nya:
        // this.#client = new ChromaClient({ path: "./chroma_db" }); 
        // Untuk kesederhanaan POC, kita akan asumsikan server ChromaDB berjalan di localhost:8000
        // Atau jika ingin embedded, ChromaClient() saja tanpa argumen akan memulai in-memory,
        // atau path argumen untuk persisten disk.
        this.#client = new ChromaClient(); 
        this.#logger = Logger;
        this.#initialize().catch(err => this.#logger.error('[ManifoldMemory] Gagal menginisialisasi UCM.', err));
    }

    async #initialize() {
        try {
            this.#collection = await this.#client.getOrCreateCollection({
                name: "conceptual_manifold",
                embeddingFunction: embedder, // Menggunakan fungsi embedding yang sama
            });
            this.#isInitialized = true;
            this.#logger.info('[ManifoldMemory] Unified Conceptual Manifold online and ready.');
        } catch (error) {
            this.#logger.error('[ManifoldMemory] Gagal menginisialisasi UCM. Pastikan server ChromaDB berjalan atau konfigurasi embedded benar.', error);
            // Tambahkan retry logic atau notifikasi kritis di sini jika ini adalah kegagalan fatal
        }
    }

    /**
     * Menyimpan esensi dari sebuah interaksi ke dalam manifold.
     * @param {string} id ID unik untuk interaksi
     * @param {string} conceptText Teks yang merepresentasikan konsep (e.g., "User prompt: '...'. AI response: '...'. Emotion: happy.")
     * @param {object} metadata Data terkait (userId, latency, provider, dll.)
     */
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

    /**
     * Mencari konsep yang relevan di dalam manifold.
     * @param {string} queryText Teks untuk mencari konsep serupa
     * @param {number} numResults Jumlah hasil yang diinginkan
     * @returns {Promise<string[]>} Array of relevant concept texts.
     */
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
            // Pastikan results.documents ada dan bukan undefined
            return results.documents && results.documents.length > 0 ? results.documents[0] : [];
        } catch (error) {
            this.#logger.error('[ManifoldMemory] Error querying the manifold.', error);
            return [];
        }
    }

    /**
     * Metode untuk mengakses koleksi secara langsung jika diperlukan untuk operasi tingkat lanjut.
     * @returns {import('chromadb').Collection | null}
     */
    getCollection() {
        return this.#collection;
    }
}