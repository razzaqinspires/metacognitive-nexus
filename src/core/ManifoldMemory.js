// File: metacognitive-nexus/src/core/ManifoldMemory.js (Dengan Kemampuan Introspeksi & Jaringan Ideon)

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Logger } from '../utils/Logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { IdeonSchema, generateIdeonId } from '../models/IdeonSchema.js'; // Impor IdeonSchema dan helper
import { cosineSimilarity } from '../utils/MathHelpers.js'; // Asumsi ada file MathHelpers.js

const UCM_FILE_PATH = path.join(process.cwd(), 'data', 'ucm_memory.json');
const IDEON_DB_PATH = path.join(process.cwd(), 'data', 'ideon_db.json'); // Path untuk menyimpan data Ideon

/**
 * ManifoldMemory (Jalur Inkarnasi)
 * Menggunakan MemoryVectorStore dari LangChain, dengan kemampuan persisten
 * dan metode introspeksi untuk mendukung Curiosity Drive.
 * Kini mengelola "Ideon" sebagai unit pemikiran dinamis.
 */
export class ManifoldMemory {
    #vectorStore;
    #embeddings;
    #isInitialized = false;
    #ideonDB = new Map(); // Map: ideonId -> IdeonObject
    #config; // Untuk navigatorConfig, dll.

    constructor({ apiKey, config }) {
        if (!apiKey) {
            const errorMsg = "[ManifoldMemory] FATAL: OpenAI API Key tidak disuntikkan.";
            Logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        this.#config = config; // Simpan konfigurasi
        this.#embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey });
        this.#initialize().catch(err => Logger.error('[ManifoldMemory] Inisialisasi UCM inkarnasi gagal.', err));
    }

    async #initialize() {
        try {
            // Muat vector store (konsep teks)
            const loadedStore = await this.#loadVectorStoreFromFile();
            if (loadedStore) {
                this.#vectorStore = loadedStore;
                Logger.info('[ManifoldMemory] Vector Store berhasil dimuat dari memori persisten.');
            } else {
                this.#vectorStore = new MemoryVectorStore(this.#embeddings);
                Logger.info('[ManifoldMemory] Memori persisten vector store tidak ditemukan. Memulai yang baru.');
            }

            // Muat Ideon DB
            await this.#loadIdeonDB();

            this.#isInitialized = true;
        } catch (error) {
            Logger.error('[ManifoldMemory] Terjadi kesalahan kritis saat inisialisasi.', error);
            this.#vectorStore = new MemoryVectorStore(this.#embeddings);
        }
    }

    async #saveVectorStoreToFile() {
        if (!this.#vectorStore) return;
        try {
            await fs.mkdir(path.dirname(UCM_FILE_PATH), { recursive: true });
            const serializedData = JSON.stringify(this.#vectorStore.toJSON());
            await fs.writeFile(UCM_FILE_PATH, serializedData);
            Logger.debug('[ManifoldMemory] Vector Store UCM berhasil disimpan ke disk.');
        } catch (error) {
            Logger.error('[ManifoldMemory] Gagal menyimpan Vector Store UCM ke disk.', error);
        }
    }

    async #loadVectorStoreFromFile() {
        try {
            const data = await fs.readFile(UCM_FILE_PATH, 'utf-8');
            const docs = JSON.parse(data);
            return await MemoryVectorStore.fromJSON(docs, this.#embeddings);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            Logger.error('[ManifoldMemory] Gagal memuat Vector Store UCM dari file.', error);
            return null;
        }
    }

    async #saveIdeonDB() {
        try {
            await fs.mkdir(path.dirname(IDEON_DB_PATH), { recursive: true });
            const serializableMap = Array.from(this.#ideonDB.entries());
            await fs.writeFile(IDEON_DB_PATH, JSON.stringify(serializableMap, null, 2));
            Logger.debug('[ManifoldMemory] Ideon DB berhasil disimpan ke disk.');
        } catch (error) {
            Logger.error('[ManifoldMemory] Gagal menyimpan Ideon DB ke disk.', error);
        }
    }

    async #loadIdeonDB() {
        try {
            const data = await fs.readFile(IDEON_DB_PATH, 'utf-8');
            const parsedMap = new Map(JSON.parse(data));
            // Konversi Date string kembali menjadi objek Date
            parsedMap.forEach(ideon => {
                if (ideon.activation && ideon.activation.lastAccessed) {
                    ideon.activation.lastAccessed = new Date(ideon.activation.lastAccessed);
                }
            });
            this.#ideonDB = parsedMap;
            Logger.info(`[ManifoldMemory] Ideon DB berhasil dimuat dengan ${this.#ideonDB.size} Ideon.`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                Logger.info('[ManifoldMemory] Ideon DB tidak ditemukan, memulai dengan kosong.');
            } else {
                Logger.error('[ManifoldMemory] Gagal memuat Ideon DB dari file.', error);
            }
        }
    }

    /**
     * [BARU] Meng-embed teks ke dalam vektor menggunakan model embedding yang dikonfigurasi.
     * Digunakan untuk RCST dan pencarian semantik.
     * @param {string} text Teks yang akan di-embed.
     * @returns {Promise<number[]>} Vektor embedding.
     */
    async embedText(text) {
        if (!this.#isInitialized) {
            Logger.warn('[ManifoldMemory] Memori belum diinisialisasi, tidak dapat meng-embed teks.');
            return [];
        }
        try {
            const result = await this.#embeddings.embedDocuments([text]);
            return result[0]; // Ambil vektor pertama (karena hanya satu dokumen)
        } catch (error) {
            Logger.error(`[ManifoldMemory] Gagal meng-embed teks: ${error.message}`, error);
            return [];
        }
    }

    /**
     * [BARU] Menyimpan atau memperbarui sebuah Ideon dalam memori.
     * Ini adalah inti dari struktur pengetahuan yang hidup.
     * @param {object} ideonObj - Objek Ideon sesuai IdeonSchema.
     */
    async storeIdeon(ideonObj) {
        if (!this.#isInitialized) return;

        // Validasi IdeonObj sesuai skema jika diperlukan (bisa gunakan Joi atau Zod)
        const ideonId = ideonObj.id || generateIdeonId(ideonObj.canonicalName);
        if (!ideonId) {
            Logger.error('[ManifoldMemory] Gagal menyimpan Ideon: canonicalName atau ID tidak valid.');
            return;
        }

        // Simpan setiap perspektif Ideon ke dalam vector store
        for (const perspective of ideonObj.perspectives) {
            const docId = `${ideonId}-${perspective.context}`; // ID unik untuk dokumen ini
            const document = { pageContent: perspective.description, metadata: { ...ideonObj, perspectiveContext: perspective.context, ideonId: ideonId } };
            // Add or update document in vector store
            await this.#vectorStore.addDocuments([document]);
            Logger.debug(`[ManifoldMemory] Perspektif Ideon '${ideonId}' (${perspective.context}) di-embed.`);
        }
        await this.#saveVectorStoreToFile(); // Simpan vector store setelah menambahkan dokumen

        // Simpan objek Ideon lengkap ke Ideon DB
        this.#ideonDB.set(ideonId, {
            ...ideonObj,
            id: ideonId,
            activation: ideonObj.activation || { level: 0.1, lastAccessed: new Date(), decayRate: this.#config.navigatorConfig?.ideonDecayRate || 0.05 },
            confidenceScore: ideonObj.confidenceScore || 0.5,
            sourceInteractionIds: ideonObj.sourceInteractionIds || [],
        });
        await this.#saveIdeonDB();
        Logger.info(`[ManifoldMemory] Ideon '${ideonObj.canonicalName}' (${ideonId}) telah disimpan/diperbarui.`);
    }

    /**
     * Mengambil Ideon berdasarkan ID.
     * @param {string} ideonId ID Ideon.
     * @returns {object | null} Objek Ideon atau null.
     */
    getIdeon(ideonId) {
        return this.#ideonDB.get(ideonId) || null;
    }

    /**
     * [BARU] Memperbarui tingkat aktivasi Ideon.
     * @param {string} ideonId - ID Ideon.
     * @param {number} delta - Perubahan tingkat aktivasi (positif untuk naik, negatif untuk turun).
     */
    async updateIdeonActivation(ideonId, delta) {
        const ideon = this.#ideonDB.get(ideonId);
        if (ideon) {
            ideon.activation.level = Math.max(0, Math.min(1, ideon.activation.level + delta));
            ideon.activation.lastAccessed = new Date();
            await this.#saveIdeonDB();
            Logger.debug(`[ManifoldMemory] Ideon '${ideon.canonicalName}' aktivasi diperbarui ke ${ideon.activation.level.toFixed(2)}.`);
        }
    }

    /**
     * [BARU] Menerapkan peluruhan (decay) pada aktivasi semua Ideon yang tidak diakses.
     */
    async applyIdeonDecay() {
        const now = Date.now();
        const decayRate = this.#config.navigatorConfig?.ideonDecayRate || 0.05; // Decay rate per jam

        let changed = false;
        this.#ideonDB.forEach(ideon => {
            if (ideon.activation && ideon.activation.lastAccessed) {
                const hoursSinceLastAccessed = (now - ideon.activation.lastAccessed.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastAccessed > 1) { // Luruhkan jika lebih dari satu jam
                    const decayAmount = decayRate * hoursSinceLastAccessed;
                    ideon.activation.level = Math.max(0, ideon.activation.level - decayAmount);
                    changed = true;
                }
            }
        });
        if (changed) {
            await this.#saveIdeonDB();
            Logger.debug('[ManifoldMemory] Peluruhan aktivasi Ideon diterapkan.');
        }
    }

    /**
     * [BARU] Membentuk atau memperkuat hubungan semantik antar Ideon.
     * @param {string} sourceIdeonId - ID Ideon sumber.
     * @param {string} targetIdeonId - ID Ideon target.
     * @param {'RELATED_TO' | 'PREREQUISITE_FOR' | 'EXAMPLE_OF' | 'TOOL_FOR' | 'ANTONYM_OF' | 'SYNONYM_OF' | 'DERIVED_FROM' | 'METAPHOR_FOR'} type - Jenis hubungan.
     * @param {number} weight - Kekuatan hubungan (0.0 - 1.0).
     */
    async formAssociation(sourceIdeonId, targetIdeonId, type, weight) {
        const sourceIdeon = this.#ideonDB.get(sourceIdeonId);
        if (sourceIdeon) {
            let existingRelation = sourceIdeon.relations.find(r => r.targetIdeonId === targetIdeonId && r.type === type);
            if (existingRelation) {
                existingRelation.weight = Math.min(1, existingRelation.weight + weight); // Perkuat hubungan
            } else {
                sourceIdeon.relations.push({ targetIdeonId, type, weight });
            }
            await this.#saveIdeonDB();
            Logger.debug(`[ManifoldMemory] Asosiasi terbentuk/diperkuat: ${sourceIdeonId} ${type} ${targetIdeonId}.`);
        }
    }

    /**
     * Mencari konsep relevan dari Ideon berdasarkan query teks.
     * @param {string} queryText Teks query.
     * @param {number} numResults Jumlah hasil yang diinginkan.
     * @returns {Promise<Array<object>>} Daftar Ideon yang relevan.
     */
    async findRelevantConcepts(queryText, numResults = 3) {
        if (!this.#isInitialized) return [];
        try {
            // Lakukan pencarian kesamaan pada vector store (yang menyimpan deskripsi perspektif Ideon)
            const results = await this.#vectorStore.similaritySearch(queryText, numResults);
            
            // Ekstrak Ideon asli dari metadata hasil pencarian
            const relevantIdeonIds = new Set();
            results.forEach(doc => relevantIdeonIds.add(doc.metadata.ideonId));

            const relevantIdeons = Array.from(relevantIdeonIds)
                .map(id => this.#ideonDB.get(id))
                .filter(Boolean); // Filter null/undefined

            // Perbarui aktivasi Ideon yang relevan
            for (const ideon of relevantIdeons) {
                await this.updateIdeonActivation(ideon.id, 0.1); // Tingkatkan aktivasi sedikit
            }
            
            return relevantIdeons; // Mengembalikan objek Ideon lengkap
        } catch (error) {
            Logger.error('[ManifoldMemory] Gagal mencari konsep relevan.', error);
            return [];
        }
    }

    /**
     * Melakukan introspeksi untuk menemukan Ideon/konsep dengan kepercayaan diri rendah.
     * Ini adalah "mata" dari Curiosity Drive.
     * @param {number} threshold - Ambang batas confidence score (e.g., 0.4).
     * @returns {Array<object>} Daftar Ideon yang tidak dipahami dengan baik.
     */
    findLowConfidenceConcepts(threshold = 0.4) {
        if (!this.#isInitialized || this.#ideonDB.size === 0) {
            return [];
        }

        const lowConfidenceIdeons = Array.from(this.#ideonDB.values())
            .filter(ideon => ideon.confidenceScore < threshold);
        
        if (lowConfidenceIdeons.length > 0) {
            Logger.debug(`[ManifoldMemory] Introspeksi menemukan ${lowConfidenceIdeons.length} Ideon dengan kepercayaan rendah.`);
        }
        
        return lowConfidenceIdeons;
    }
}