// File: metacognitive-nexus/src/utils/APIKeyManager.js (Versi Evolusi Definitif)
import { Logger } from './Logger.js';

/**
 * APIKeyManager direkayasa ulang sebagai Credential Governor.
 * Ia secara aktif mengelola sebuah pool kredensial, lengkap dengan status kesehatan,
 * feedback loop, dan mekanisme self-healing.
 */
export class APIKeyManager {
    // #keys sekarang menyimpan obyek dengan status, bukan hanya string.
    // { key: string, status: 'active' | 'impaired' | 'compromised', impairedUntil: Date | null, failureCount: number }
    #keys = [];
    #providerName;
    #roundRobinIndex = 0; // Tetap menggunakan round-robin untuk kunci yang sehat

    constructor(providerName, keys) {
        this.#providerName = providerName;
        if (!Array.isArray(keys) || keys.length === 0) {
            Logger.warn(`[KeyGovernor] ${providerName}: Tidak ada kredensial yang disediakan.`, true); // Tambahkan true untuk log error
            this.#keys = [];
        } else {
            // Ubah array string menjadi struktur obyek yang kaya
            this.#keys = keys.map(key => ({
                key: key,
                status: 'active',
                impairedUntil: null,
                failureCount: 0 // Melacak kegagalan per kunci
            }));
            Logger.info(`[KeyGovernor] ${providerName}: Mengawasi ${this.#keys.length} kredensial.`);
        }
    }

    /**
     * Metode seleksi cerdas untuk mendapatkan kunci yang paling layak.
     * @returns {string | null} Kunci API yang aktif atau null jika tidak ada.
     */
    getKey() {
        // Filter kunci yang benar-benar aktif atau yang sudah pulih dari impaired
        const now = Date.now();
        const activeAndHealedKeys = this.#keys.filter(k => 
            k.status === 'active' || (k.status === 'impaired' && k.impairedUntil && now > k.impairedUntil)
        );
        
        // Aktifkan kembali kunci yang pulih
        activeAndHealedKeys.forEach(k => {
            if (k.status === 'impaired' && k.impairedUntil && now > k.impairedUntil) {
                Logger.info(`[KeyGovernor] Kunci untuk ${this.#providerName} (${k.key.substring(0,8)}) pulih dari status 'impaired'. Mengaktifkan kembali.`);
                k.status = 'active';
                k.impairedUntil = null;
                // Jangan reset failureCount sepenuhnya, mungkin ada sisa efek
            }
        });

        const usableKeys = this.#keys.filter(k => k.status === 'active'); // Hanya kunci yang sekarang aktif
        
        if (usableKeys.length === 0) {
            Logger.warn(`[KeyGovernor] ${this.#providerName}: Tidak ada kredensial aktif yang tersedia saat ini.`);
            return null;
        }

        // Terapkan rotasi round-robin hanya pada kunci yang aktif
        this.#roundRobinIndex = this.#roundRobinIndex % usableKeys.length;
        const selectedKey = usableKeys[this.#roundRobinIndex];
        this.#roundRobinIndex++;

        Logger.debug(`[KeyGovernor] ${this.#providerName}: Menyediakan kredensial aktif: ${selectedKey.key.substring(0,8)}.`);
        return selectedKey.key;
    }

    /**
     * Menerima laporan dari sistem tingkat atas (DSO) tentang status sebuah kunci.
     * @param {string} failedKey - Kunci spesifik yang gagal.
     * @param {string} failureType - Jenis kegagalan (e.g., 'RATE_LIMIT_EXCEEDED', 'INVALID_API_KEY', 'TIMEOUT', 'CONTENT_FILTER').
     */
    reportStatus(failedKey, failureType) {
        const keyObject = this.#keys.find(k => k.key === failedKey);
        if (!keyObject) return;

        keyObject.failureCount++; // Tingkatkan hit kegagalan

        switch (failureType) {
            case 'RATE_LIMIT_EXCEEDED':
                keyObject.status = 'impaired';
                // Durasi istirahat adaptif berdasarkan frekuensi kegagalan
                const rateLimitDuration = 60 * 1000 * Math.min(5, keyObject.failureCount); // 1, 2, 3, 4, 5 menit
                keyObject.impairedUntil = Date.now() + rateLimitDuration;
                Logger.warn(`[KeyGovernor] Kunci untuk ${this.#providerName} (${keyObject.key.substring(0,8)}) diistirahatkan sementara karena RATE_LIMIT (${keyObject.failureCount}x). Pulih dalam ${rateLimitDuration / 1000}s.`);
                break;
            case 'INVALID_API_KEY':
                keyObject.status = 'compromised';
                keyObject.impairedUntil = null; // Karantina permanen
                Logger.error(`[KeyGovernor] Kritis: Kunci untuk ${this.#providerName} (${keyObject.key.substring(0,8)}) terdeteksi tidak valid dan dikarantina secara permanen.`);
                break;
            case 'CONTENT_FILTERED': // Untuk kasus seperti Gemini
            case 'CONTEXT_LENGTH_EXCEEDED': // Untuk kasus OpenAI
                // Ini bukan masalah kunci, jadi jangan karantina kunci
                Logger.warn(`[KeyGovernor] Kunci ${this.#providerName} (${keyObject.key.substring(0,8)}) mengalami error konten/konteks. Tidak dikarantina.`);
                // Bisa reset failureCount jika ini bukan masalah kunci
                keyObject.failureCount = Math.max(0, keyObject.failureCount - 1); // Turunkan sedikit
                break;
            default:
                // Untuk error lain, kita anggap sementara
                keyObject.status = 'impaired';
                const defaultImpairDuration = 30 * 1000 * Math.min(3, keyObject.failureCount); // 30s, 60s, 90s
                keyObject.impairedUntil = Date.now() + defaultImpairDuration;
                Logger.warn(`[KeyGovernor] Kunci untuk ${this.#providerName} (${keyObject.key.substring(0,8)}) diistirahatkan karena error sementara (${keyObject.failureCount}x). Pulih dalam ${defaultImpairDuration / 1000}s.`);
                break;
        }
    }

    /**
     * Mengembalikan status spesifik dari sebuah kunci.
     * @param {string} keyString Kunci yang ingin diperiksa.
     * @returns {'active' | 'impaired' | 'compromised' | 'not_found'}
     */
    getIndividualKeyStatus(keyString) {
        const keyObject = this.#keys.find(k => k.key === keyString);
        if (!keyObject) return 'not_found';
        if (keyObject.status === 'impaired' && keyObject.impairedUntil && Date.now() > keyObject.impairedUntil.getTime()) {
            // Jika sudah expired, secara konseptual aktif kembali (tapi status di objek belum berubah)
            return 'active';
        }
        return keyObject.status;
    }

    /**
     * Mengembalikan semua kunci, terlepas dari statusnya (untuk debugging dan diagnostik).
     * @returns {Array<object>}
     */
    getAllKeys() {
        return this.#keys.map(k => k.key); // Mengembalikan array string kunci
    }

    /**
     * Memeriksa apakah ada setidaknya satu kunci yang aktif atau dapat pulih.
     * @returns {boolean}
     */
    hasActiveKeys() {
        const now = Date.now();
        return this.#keys.some(k => k.status === 'active' || (k.status === 'impaired' && k.impairedUntil && now > k.impairedUntil));
    }

    /**
     * Mereset status semua kunci kembali ke 'active' (kecuali 'compromised').
     * Berguna saat AI "bangun dari tidur" atau setelah perbaikan sistem.
     */
    resetAllKeyStatuses() {
        this.#keys.forEach(k => {
            if (k.status !== 'compromised') { // Jangan aktifkan kembali kunci yang sudah pasti rusak
                k.status = 'active';
                k.impairedUntil = null;
                k.failureCount = 0; // Reset failure count saat direset
            }
        });
        this.#roundRobinIndex = 0;
        Logger.info(`[KeyGovernor] ${this.#providerName}: Status semua kredensial yang dapat digunakan telah direset ke 'active'.`);
    }
}