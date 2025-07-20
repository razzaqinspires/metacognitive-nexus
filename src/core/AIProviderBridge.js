// File: metacognitive-nexus/src/core/AIProviderBridge.js (Versi Evolusi)

import { OpenAIAdapter } from '../services/openAI.js';
import { GeminiAdapter } from '../services/gemini.js';
import { GroqAdapter } from '../services/groq.js';
import { Logger } from '../utils/Logger.js';

/**
 * AIProviderBridge direkayasa ulang sebagai Active Neural Plexus.
 * Ia secara proaktif mengelola sebuah pool dari koneksi 'panas' ke berbagai penyedia AI,
 * lengkap dengan mekanisme pruning dan self-healing.
 */
export class AIProviderBridge {
    // Plexus menyimpan pathway, bukan hanya adapter.
    // Kunci: 'providerName:model'
    // Nilai: { instance: Adapter, lastUsed: Date, status: 'active' | 'degraded' }
    #plexus = new Map();
    #pruningInterval;
    #healthCheckInterval;

    constructor() {
        const PRUNING_INTERVAL_MS = 10 * 60 * 1000; // Prune setiap 10 menit
        const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Health check setiap 5 menit

        this.#pruningInterval = setInterval(() => this.#pruneDormantPathways(), PRUNING_INTERVAL_MS);
        // this.#healthCheckInterval = setInterval(() => this.#healthCheckPathways(), HEALTH_CHECK_INTERVAL_MS); // Diaktifkan saat ada metode health check
        Logger.info('[NeuralPlexus] Active Neural Plexus is online. Initiating self-maintenance cycles.');
    }

    /**
     * Membangun atau mengaktifkan kembali jalur saraf ke penyedia AI.
     * Mengimplementasikan Connection Pooling.
     * @param {string} providerName Nama penyedia (e.g., 'openai')
     * @param {string} apiKey API key yang valid
     * @param {string} model Model yang akan digunakan
     * @returns {object | null} Instance adapter yang aktif.
     */
    establishPathway(providerName, apiKey, model) {
        if (!apiKey || !providerName || !model) {
            Logger.warn(`[NeuralPlexus] Informasi pathway tidak lengkap. Melewatkan pembuatan.`);
            return null;
        }

        const pathwayKey = `${providerName.toLowerCase()}:${model}`;
        const existingPathway = this.#plexus.get(pathwayKey);

        // Jika pathway sudah ada dan sehat, gunakan kembali
        if (existingPathway && existingPathway.status === 'active') {
            existingPathway.lastUsed = Date.now();
            Logger.debug(`[NeuralPlexus] Menggunakan kembali pathway aktif untuk: ${pathwayKey}`);
            return existingPathway.instance;
        }

        // Jika tidak ada atau terdegradasi, buat pathway baru
        Logger.info(`[NeuralPlexus] Membangun pathway baru untuk: ${pathwayKey}`);
        let adapterInstance;
        try {
            switch (providerName.toLowerCase()) {
                case 'openai':
                    adapterInstance = new OpenAIAdapter(apiKey, model);
                    break;
                case 'gemini':
                    adapterInstance = new GeminiAdapter(apiKey, model);
                    break;
                case 'groq':
                    adapterInstance = new GroqAdapter(apiKey, model);
                    break;
                default:
                    Logger.error(`[NeuralPlexus] Tipe pathway '${providerName}' tidak didukung.`);
                    return null;
            }
        } catch (error) {
            Logger.error(`[NeuralPlexus] Gagal membuat instance adapter untuk ${pathwayKey}`, error);
            return null;
        }

        // Simpan pathway baru ke dalam plexus
        this.#plexus.set(pathwayKey, {
            instance: adapterInstance,
            lastUsed: Date.now(),
            status: 'active'
        });

        return adapterInstance;
    }

    /**
     * Mengambil pathway (adapter) yang sudah aktif dari plexus.
     * Nama diganti dari getAdapter untuk merefleksikan peran barunya.
     * @param {string} providerName
     * @param {string} model
     * @returns {object | null}
     */
    getPathway(providerName, model) {
        const pathwayKey = `${providerName.toLowerCase()}:${model}`;
        const pathway = this.#plexus.get(pathwayKey);
        return pathway ? pathway.instance : null;
    }

    /**
     * Neuroplastisitas: Memangkas jalur saraf yang tidak aktif untuk efisiensi sumber daya.
     * @private
     */
    #pruneDormantPathways() {
        const now = Date.now();
        const DORMANT_THRESHOLD_MS = 10 * 60 * 1000; // 10 menit
        let prunedCount = 0;

        Logger.debug('[NeuralPlexus] Memulai siklus pruning untuk jalur saraf tidak aktif...');
        for (const [key, pathway] of this.#plexus.entries()) {
            if (now - pathway.lastUsed > DORMANT_THRESHOLD_MS) {
                this.#plexus.delete(key);
                prunedCount++;
                Logger.info(`[NeuralPlexus] Jalur saraf tidak aktif '${key}' telah dipangkas.`);
            }
        }
        if (prunedCount > 0) {
            Logger.debug(`[NeuralPlexus] Siklus pruning selesai. ${prunedCount} jalur dipangkas.`);
        }
    }
    
    /**
     * Self-Healing: Secara proaktif memeriksa kesehatan koneksi.
     * (Placeholder untuk implementasi di masa depan, karena butuh metode non-blocking dari adapter)
     * @private
     */
    async #healthCheckPathways() {
        Logger.debug('[NeuralPlexus] Memulai siklus pemeriksaan kesehatan proaktif...');
        for (const [key, pathway] of this.#plexus.entries()) {
            // Asumsi setiap adapter memiliki metode .ping() atau sejenisnya
            try {
                // const isHealthy = await pathway.instance.ping(); // Metode ini perlu ada di adapter
                // if (!isHealthy) {
                //     pathway.status = 'degraded';
                //     Logger.warn(`[NeuralPlexus] Jalur '${key}' terdeteksi terdegradasi.`);
                // } else {
                //     pathway.status = 'active';
                // }
            } catch (error) {
                pathway.status = 'degraded';
                Logger.warn(`[NeuralPlexus] Jalur '${key}' gagal pemeriksaan kesehatan. Status: terdegradasi.`);
            }
        }
    }

    /**
     * Membersihkan semua interval saat aplikasi dimatikan.
     */
    shutdown() {
        clearInterval(this.#pruningInterval);
        clearInterval(this.#healthCheckInterval);
        Logger.info('[NeuralPlexus] Siklus pemeliharaan diri telah dihentikan.');
    }
}   