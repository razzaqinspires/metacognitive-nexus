// File: metacognitive-nexus/src/core/ManifoldMemory.js (Dengan Kemampuan Introspeksi)

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Logger } from '../utils/Logger.js';
import { promises as fs } from 'fs';
import path from 'path';

const UCM_FILE_PATH = path.join(process.cwd(), 'data', 'ucm_memory.json');

/**
 * ManifoldMemory (Jalur Inkarnasi)
 * Menggunakan MemoryVectorStore dari LangChain, dengan kemampuan persisten
 * dan metode introspeksi untuk mendukung Curiosity Drive.
 */
export class ManifoldMemory {
    #vectorStore;
    #embeddings;
    #isInitialized = false;

    constructor({ apiKey }) {
        if (!apiKey) {
            const errorMsg = "[ManifoldMemory] FATAL: OpenAI API Key tidak disuntikkan.";
            Logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        this.#embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey });
        this.#initialize().catch(err => Logger.error('[ManifoldMemory] Inisialisasi UCM inkarnasi gagal.', err));
    }

    async #initialize() {
        try {
            const loadedStore = await this.#loadFromFile();
            if (loadedStore) {
                this.#vectorStore = loadedStore;
                Logger.info('[ManifoldMemory] UCM inkarnasi berhasil dimuat dari memori persisten.');
            } else {
                this.#vectorStore = new MemoryVectorStore(this.#embeddings);
                Logger.info('[ManifoldMemory] Memori persisten tidak ditemukan. Memulai UCM inkarnasi yang baru.');
            }
            this.#isInitialized = true;
        } catch (error) {
            Logger.error('[ManifoldMemory] Terjadi kesalahan kritis saat inisialisasi.', error);
            this.#vectorStore = new MemoryVectorStore(this.#embeddings);
        }
    }

    async #saveToFile() {
        if (!this.#vectorStore) return;
        try {
            await fs.mkdir(path.dirname(UCM_FILE_PATH), { recursive: true });
            const serializedData = JSON.stringify(this.#vectorStore.toJSON());
            await fs.writeFile(UCM_FILE_PATH, serializedData);
            Logger.debug('[ManifoldMemory] Memori UCM berhasil disimpan ke disk.');
        } catch (error) {
            Logger.error('[ManifoldMemory] Gagal menyimpan memori UCM ke disk.', error);
        }
    }

    async #loadFromFile() {
        try {
            const data = await fs.readFile(UCM_FILE_PATH, 'utf-8');
            const docs = JSON.parse(data);
            return await MemoryVectorStore.fromJSON(docs, this.#embeddings);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            Logger.error('[ManifoldMemory] Gagal memuat memori UCM dari file.', error);
            return null;
        }
    }

    async storeConcept(id, conceptText, metadata) {
        if (!this.#isInitialized) return;
        try {
            const document = { pageContent: conceptText, metadata: { ...metadata, conceptId: id } };
            await this.#vectorStore.addDocuments([document]);
            await this.#saveToFile();
            Logger.debug(`[ManifoldMemory] Konsep '${id}' telah di-embed dan disimpan dalam UCM inkarnasi.`);
        } catch (error) {
            Logger.error(`[ManifoldMemory] Gagal menyimpan konsep '${id}'.`, error);
        }
    }

    async findRelevantConcepts(queryText, numResults = 3) {
        if (!this.#isInitialized) return [];
        try {
            const results = await this.#vectorStore.similaritySearch(queryText, numResults);
            return results.map(doc => doc.pageContent);
        } catch (error) {
            Logger.error('[ManifoldMemory] Gagal mencari konsep relevan.', error);
            return [];
        }
    }

    /**
     * [METODE BARU]
     * Melakukan introspeksi untuk menemukan Ideon/konsep dengan kepercayaan diri rendah.
     * Ini adalah "mata" dari Curiosity Drive.
     * @param {number} threshold - Ambang batas confidence score (e.g., 0.4).
     * @returns {Array<object>} Daftar konsep yang tidak dipahami dengan baik.
     */
    findLowConfidenceConcepts(threshold = 0.4) {
        if (!this.#isInitialized || !this.#vectorStore?.memoryVectors) {
            return [];
        }

        const lowConfidenceDocs = this.#vectorStore.memoryVectors
            .map(vec => vec.metadata)
            .filter(meta => meta.confidenceScore && meta.confidenceScore < threshold);
        
        if (lowConfidenceDocs.length > 0) {
            Logger.debug(`[ManifoldMemory] Introspeksi menemukan ${lowConfidenceDocs.length} konsep dengan kepercayaan rendah.`);
        }
        
        return lowConfidenceDocs;
    }
}